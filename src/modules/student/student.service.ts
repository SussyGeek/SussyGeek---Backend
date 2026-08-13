import GeeksForGeeksAPI from "../../api/geeksforgeeks.api";
import { ApiError } from "../../errors/ApiError";
import { BatchBody } from "../../types/body";
import { GFGStudentStats } from "../../types/gfg_api";
import { InstituteRow } from "../../types/models/institute";
import { StudentRow } from "../../types/models/student";
import { CounterDataObject, StudentRedis } from "../../types/students";
import InstituteService from "../institute/institute.service";
import MetaService from "../meta/meta.service";
import StudentRepository from "./student.repository";

const StudentService = {
    addStudents: async (students: Partial<StudentRow>[]) => {
        students.forEach(s => {
            s.name = s.name?.toLowerCase()
            s.username = s.username?.toLowerCase()
        }
        );
        await StudentRepository.addMultiple(students);
        return { success: true };
    },
    cacheStudentUsernames: async (instituteId: string) => {
        const count = await GeeksForGeeksAPI.getTotalStudentCount(instituteId);
        const students = await GeeksForGeeksAPI.getStudentsByInstitute(instituteId, count);

        const cacheSet = students.map(s => JSON.stringify({ username: s.handle, user_id: s.user_id }));
        // Ordered list maintains handle rather than username 
        // just respecting GFG API conventions.
        const orderedList = students.map(s => JSON.stringify({ handle: s.handle, user_id: s.user_id }));

        await StudentRepository.redisAddUsernamesToInstituteSet(instituteId, cacheSet);
        await StudentRepository.redisCacheOrderedStudentList(instituteId, orderedList);
        const { institute } = await InstituteService.updateUserCacheStatus(instituteId, true);
        return { success: true, institute };
    },
    listFrozenStudents: async (instituteId: string) => {
        const raw = await StudentRepository.redisGetOrderedStudentList(instituteId);
        const students = raw.map(entry => JSON.parse(entry));
        return {
            success: true,
            data: { students }
        };
    },
    // TODO: Adapt this function to use
    /*
        SORTING.
    */
    listRegularStudents: async (
        instituteId: string,
        pageNo: number,
        pageSize: number = 10,
        showCounters?: number
    ) => {
        const pageOffset = pageNo - 1;
        const res = await StudentRepository.listStudents(
            instituteId,
            pageOffset,
            pageSize
        );

        let students = res.rows;

        if (showCounters === 1 && students.length > 0) {
            const studentIds = students.map(s => s.$id);
            const usersSerialized = await StudentRepository.redisSearchStudnetsOnHash(instituteId, studentIds);

            // @ts-ignore
            students = students.map((s, i) => {
                const serialized = usersSerialized[i];
                if (serialized) {
                    const parsed = JSON.parse(serialized);
                    return { ...s, ...parsed, $id: s.$id };
                }
                return s;
            });
        }

        return {
            success: true,
            data: { students }
        };
    },
    listAllStudentsByInstituteId: async (
        instituteId: string
    ) => {
        const { rows } = await StudentRepository.listAllByInstituteId(instituteId);
        return rows;
    },
    listSortedStudents: async (
        instituteId: string,
        sortBy: 'score' | 'solved' | 'streak',
        order: 'asc' | 'desc',
        pageNo: number,
        pageSize: number = 100
    ) => {
        const students = await StudentRepository.redisGetSortedStudents(
            instituteId,
            sortBy,
            order,
            pageNo,
            pageSize
        );

        return {
            success: true,
            data: { students }
        };
    },
    listStudentsByUserIds: async (
        studentIds: string[]
    ) => {
        const { rows } = await StudentRepository.listStudentsByIds(studentIds);
        return {
            success: true,
            data: rows
        };
    },
    listStudentsByFullNameInInstitute: async (
        fullName: string,
        instituteId: string
    ) => {
        const { total, rows } = await StudentRepository.listByFullNameInInstitute(fullName, instituteId);

        let users: StudentRedis[] = [];
        if (total > 0) {
            const studentIds = rows.map(r => r.$id);
            const usersSerialized = await StudentRepository.redisSearchStudnetsOnHash(instituteId, studentIds);
            // deserialized users.
            // @ts-ignore
            users = usersSerialized
                .map((u, i) => {
                    if (u) {
                        const parsed = JSON.parse(u);
                        parsed.$id = studentIds[i];
                        return parsed;
                    }
                    return null;
                })
                .filter((u): u is StudentRedis => u !== null);
        }
        return {
            success: true,
            data: users
        }
    },
    isBatchValid: async (instituteId: string, students: BatchBody[]) => {
        const users = students.map(s => JSON.stringify({ username: s.username, user_id: Number(s.id) }));
        const result = await StudentRepository.redisStudentMembershipCheck(instituteId, users);
        return result.every(r => r === 1);
    },
    isSomeStudentRepeated: async (instituteId: string, students: BatchBody[]) => {
        const users = students.map(s => JSON.stringify({ username: s.username, user_id: Number(s.id) }));
        const result = await StudentRepository.redisScrappedMembershipCheck(instituteId, users);
        return result.some(r => r === 1);
    },
    updateStudentScores: async (
        instituteId: string,
        institute: InstituteRow | null,
        accessMode: "BLOCK_EXTENSION" | "SCORE_UPDATION" = "BLOCK_EXTENSION"
    ) => {
        institute = institute ?? (await InstituteService.getInstitute(instituteId, '', 1, 1, 0, false)).rows[0];
        if (institute.totalStudents !== institute.scrappedStudents) {
            throw new ApiError(409, "Institute has partial contributions. Can't be updated.");
        }

        const lastUpdateS = new Date(institute.$updatedAt).getTime() / 1000;
        const currentS = Date.now() / 1000;

        if (currentS - lastUpdateS <= 3600) {
            throw new ApiError(403, "A recent update was issued.");
        }

        // Get fresh student list from GFG.
        const totalStudents = await GeeksForGeeksAPI.getTotalStudentCount(instituteId);
        const studentList = await GeeksForGeeksAPI.getStudentsByInstitute(instituteId, totalStudents);

        const serializedStudents: string[] = []; // For querying scrapped student hash.
        const studentIds: Record<string, string[]> = {
            existing: [], // For score updation.
            all: [] // For querying appwrite student rows.
        }
        const newStudentsList: GFGStudentStats[] = []; // This data is used for extension logic.

        studentList.forEach(s => {
            studentIds.all.push(s.user_id.toString());

            serializedStudents.push(JSON.stringify({
                username: s.handle,
                user_id: s.user_id.toString()
            }));
        });

        const counterData: CounterDataObject = {
            sets: { solved: [], streak: [], scores: [] },
            total: { problemsSolved: 0, score: 0 } // For appwrite institute row.
        };

        const hashDataSerialized: Record<string, string> = {};
        const studentExists = await StudentRepository.redisScrappedMembershipCheck(instituteId, serializedStudents);
        const appwriteStudentRows = await StudentService.listAllStudentsByInstituteId(institute.$id);

        const appwriteNameMap = new Map(appwriteStudentRows.map(row => [
            row.$id,
            row.name
        ]));

        studentList.forEach((s: GFGStudentStats, idx: number) => {
            const userIdStr = s.user_id.toString();
            if (studentExists[idx]) {
                studentIds.existing.push(userIdStr);

                // This total data is computed for Institutional counter update
                // And difference obtaining for metadata increment.
                counterData.total.problemsSolved += s?.total_problems_solved ?? 0;
                counterData.total.score += s?.coding_score ?? 0;

                // For our Redis sets.
                counterData.sets.scores.push({ score: s?.coding_score ?? 0, value: userIdStr });
                counterData.sets.solved.push({ score: s?.total_problems_solved ?? 0, value: userIdStr });
                counterData.sets.streak.push({ score: s?.potd_longest_streak ?? 0, value: userIdStr });

                hashDataSerialized[userIdStr] = JSON.stringify({
                    username: s.handle,
                    name: appwriteNameMap.get(userIdStr) ?? s.handle,
                    score: s?.coding_score ?? 0,
                    solved: s?.total_problems_solved ?? 0,
                    streak: s?.potd_longest_streak ?? 0
                });
            } else {
                newStudentsList.push(s);
            }
        });

        const counterDifference = {
            totalScore: counterData.total?.score ?? 0 - institute.score,
            totalProblems: counterData.total?.problemsSolved ?? 0 - institute.problemsSolved
        };
        await MetaService.incrementDifference(counterDifference);
        await InstituteService.updateScoreAndProblems(instituteId, counterData.total);
        await StudentRepository.redisUpdateScores(instituteId, counterData.sets, hashDataSerialized);

        return {
            success: true,
            message: "Score updated",
            newStudentsList: accessMode === "BLOCK_EXTENSION" ? newStudentsList : [],
        };
    }
};

export default StudentService;