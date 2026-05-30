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
        pageSize: number = 10
    ) => {
        const pageOffset = pageNo - 1;

        const res = await StudentRepository.listStudents(
            instituteId,
            pageOffset,
            pageSize
        );

        return {
            success: true,
            data: { students: res.rows }
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
            users = usersSerialized
                .map(u => u ? JSON.parse(u) : null)
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
        institute: InstituteRow | null
    ) => {
        institute = institute ?? (await InstituteService.getInstitute(instituteId, '', 1, 1, 0, false)).rows[0];
        if (institute.totalStudents !== institute.scrappedStudents) {
            throw new ApiError(409, "Institute has partial contributions. Can't be updated.");
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
                user_id: s.user_id
            }));
        });

        const counterData: CounterDataObject = {
            sets: { solved: [], streak: [], scores: [] },
            total: { problemsSolved: 0, score: 0 } // For appwrite institute row.
        };

        const hashDataSerialized: Record<string, string> = {};
        const studentExists = await StudentRepository.redisScrappedMembershipCheck(instituteId, serializedStudents);
        const { data: appwriteStudentRows } = await StudentService.listStudentsByUserIds(studentIds.all);

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
                counterData.total.problemsSolved += s.total_problems_solved;
                counterData.total.score += s.coding_score;

                // For our Redis sets.
                counterData.sets.scores.push({ score: s.coding_score, value: userIdStr });
                counterData.sets.solved.push({ score: s.total_problems_solved, value: userIdStr });
                counterData.sets.streak.push({ score: s.potd_longest_streak, value: userIdStr });

                hashDataSerialized[userIdStr] = JSON.stringify({
                    username: s.handle,
                    name: appwriteNameMap.get(userIdStr) ?? s.handle,
                    score: s.coding_score,
                    solved: s.total_problems_solved,
                    streak: s.potd_longest_streak
                });
            } else {
                newStudentsList.push(s);
            }
        });

        const counterDifference = {
            totalScore: counterData.total.score - institute.score,
            totalProblems: counterData.total.problemsSolved - institute.problemsSolved
        };
        await MetaService.incrementDifference(counterDifference);

        await InstituteService.updateScoreAndProblems(instituteId, counterData.total);
        await StudentRepository.redisUpdateScores(instituteId, counterData.sets, hashDataSerialized);

        return {
            success: true,
            message: "Score updated",
            newStudentsList,
        };
    }
};

export default StudentService;