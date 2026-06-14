import { Models, Query } from "node-appwrite";
import { AddInstituteSvcType } from "../../types/institute";
import { prepInstitutionObject } from "../../utils/prepInstituteObject";
import InstituteRepository from "./institute.repository";
import { BLOCK, BLOCK_STATE, STUDENT_BATCH_SIZE } from "../../data/params";
import { InstituteRow } from "../../types/models/institute";
import { randomSleep } from "../../utils/timeUtils";
import { StudentBody } from "../../types/body";
import { ApiError } from "../../errors/ApiError";
import GeeksForGeeksAPI from "../../api/geeksforgeeks.api";
import { makeQueries } from "../../utils/makeQueries";
import StudentService from "../student/student.service";
import StudentRepository from "../student/student.repository";
import { serializedStudentData } from "../../types/students";


const InstituteService = {
    addInstitute: async ({
        name,
        slug,
        registeredGeeks,
        location
    }: AddInstituteSvcType) => {

        const instituteObject = prepInstitutionObject({
            name,
            slug,
            registeredGeeks,
            location
        });

        const institute = await InstituteRepository.addInstitute(instituteObject);

        return institute;
    },
    getInstitute: async (
        id: string,
        name: string,
        page: number,
        limit: number,
        offset: number,
        omitInfo = true,
        status: string = 'all'
    ) => {
        let ans: Models.RowList<InstituteRow>;
        // TODO: Omit sensitive info like Institute ID and stuff.
        if (name.trim() || !id.trim() || status !== 'all') {
            const queries = makeQueries(
                name, limit, offset, status
            );
            ans = await InstituteRepository.listInstitutes(queries);
        } else {
            const instituteRow = await InstituteRepository.getInstituteById(id);
            ans = { total: 1, rows: [instituteRow] };
        }
        return ans;
    },
    searchInstitutes: async (name: string, limit: number, status: string = 'all') => {
        return await InstituteRepository.searchInstitutes(name, limit, status);
    },
    findAvailabilityById: async (instituteId: string) => {
        const row = await InstituteRepository.findAvailability(instituteId);
        return row.scrappedStudents === row.totalStudents;
    },
    // updates counter for totalStudents
    updateTotalStudents: async (instId: string) => {

        const institute = (await InstituteService.getInstitute(instId, '', 1, 1, 1)).rows[0] ?? null;
        if (!institute)
            throw new ApiError(404, 'Institute ID is invalid');

        const lastUpdate = new Date(institute.$updatedAt).getTime();
        const updateHourDiff = (Date.now() - lastUpdate) / (3600 * 1000);

        const newStudentCount = 0; // TODO: Fetch institute count from GFG API;
        const difference = newStudentCount - institute.totalStudents;

        if (updateHourDiff >= 1 && difference != 0) {
            // TODO: Verify if atomic operations lead to updation of $updatedAt
            // If not, could possibly lead to bug.
            const result = InstituteRepository.updateInstituteStudents(
                instId,
                difference,
                difference >= 0
            );
        }

        return {
            success: true,
            message: updateHourDiff >= 1 ?
                "Updated" : "A recent update was found."
        }
    },
    updateBlockPagesAndState: async (
        instituteId: string,
        blockId: number,
        blockState: number, // Ensure that you're passing valid state from BSTATE here.
        studentCount: number = 0
    ) => {
        let { blocks, blocksVersion } = await InstituteService.getBlocks(instituteId);
        let tries = 5, updated = false;

        while (!updated && tries--) {
            blocks[blockId] = blockState;
            blocks[blockId + 1] = blocks[blockId + 1] + studentCount,

                updated = (await InstituteRepository.updateInstituteBlocksNoRace(
                    instituteId, blocks, blocksVersion
                )).total > 0;

            if (updated) break;
            await randomSleep(0.5, 0.3);

            const newBlockData = await InstituteService.getBlocks(instituteId);
            blocks = newBlockData.blocks;
            blocksVersion = newBlockData.blocksVersion;
        }

        return {
            success: updated,
            blocks
        };
    },
    // For studenr batch increments.
    incrementScoreAndProblemsAndStudents: async (instituteId: string, students: StudentBody[]) => {
        const data = students.reduce((acc, student) => (
            {
                batchScore: acc.batchScore + student.score,
                batchProblems: acc.batchProblems + student.solved,
                studentCount: 0
            }
        ), { batchScore: 0, batchProblems: 0, studentCount: 0 });

        data.studentCount = students.length;

        // !This updates scrappedStudent count, not totalStudents
        await InstituteRepository.incrementScoreAndProblemsAndStudents(instituteId, data);

        return { success: true, data };
    },
    // For grand updation across all students.
    updateScoreAndProblems: async (instituteId: string, counterData: Partial<InstituteRow>) => {
        await InstituteRepository.updateCounter(instituteId, counterData);
        return { success: true };
    },
    assignBlocks: async (
        instituteId: string,
    ) => {

        let institute = await InstituteRepository.getInstituteById(instituteId);

        if (institute.blocks.length !== 0) // Blocks already exist. No need.
            return { success: false, institute }

        // First-time block initialization: fetch actual student count from GFG API.
        const newStudentCount = await GeeksForGeeksAPI.getTotalStudentCount(instituteId);
        if (Math.abs(newStudentCount - institute.totalStudents) > 0) {
            await InstituteRepository.updateInstituteById(instituteId, {
                totalStudents: newStudentCount
            });
            institute.totalStudents = newStudentCount;
        }

        if (institute.totalStudents === 0)
            throw new ApiError(409, "No students to form blocks on.");

        let blockList = [];
        const totalBlocks = Math.ceil(institute.totalStudents / (STUDENT_BATCH_SIZE * BLOCK));
        const blockPages = STUDENT_BATCH_SIZE * BLOCK;

        for (let b = 0; b < totalBlocks; b++) {
            const startPage = (blockPages * b) + 1;
            const endPage = Math.min(
                blockPages * (b + 1),
                institute.totalStudents
            );
            const state = BLOCK_STATE['FREE'];
            blockList.push(state, startPage, endPage);
        }

        institute = await InstituteRepository.updateInstituteBlocks(
            instituteId, blockList
        );

        return { success: true, institute };
    },
    getBlocks: async (instituteId: string) => {
        const res = await InstituteRepository.getBlocksByInstId(instituteId);
        return { blocks: res.blocks, blocksVersion: res.blocksVersion };
    },
    hasBlockCompleted: async (blockId: number, prevStartingPage: number, studentCount: number, institute: InstituteRow | null, instituteId: string) => {
        const blocks = (institute || await InstituteService.getBlocks(instituteId)).blocks;
        const newStartingPage = prevStartingPage + studentCount;
        return newStartingPage >= blocks[blockId + 2];
    },
    updateUserCacheStatus: async (
        instituteId: string,
        newStatus: boolean
    ) => {
        const institute = await InstituteRepository.updateInstituteById(instituteId, {
            isUsersCached: newStatus
        });

        return { success: true, institute };
    },
    // NOTE: This method is only to be used when an institute is fully scrapped.
    extendBlocks: async (
        instituteId: string
    ) => {
        const institute = (await InstituteService.getInstitute(instituteId, '', 1, 1, 0, false)).rows[0];

        if (institute.totalStudents !== institute.scrappedStudents)
            return { success: false, message: "Partial contributions. Not updatable" };

        const { newStudentsList } = await StudentService.updateStudentScores(instituteId, institute);
        if (newStudentsList.length === 0)
            return { success: true, message: "No new students to extend blocks. Student list updated." };

        const serializedData: serializedStudentData = {
            list: [],
            set: []
        };

        newStudentsList.forEach(s => {
            serializedData.list.push(JSON.stringify({ handle: s.handle, user_id: s.user_id }));
            serializedData.set.push(JSON.stringify({ username: s.handle, user_id: s.user_id }));
        });

        await StudentRepository.redisExtendListAndCacheSet(instituteId, serializedData);

        const { blocks, blocksVersion } = institute;
        const newTotal = institute.totalStudents + newStudentsList.length;
        const blockPages = STUDENT_BATCH_SIZE * BLOCK;
        const lastEndPage = blocks.length >= 3 ? blocks[blocks.length - 1] : 0;
        const newBlockCount = Math.ceil((newTotal - lastEndPage) / blockPages);

        for (let b = 0; b < newBlockCount; b++) {
            const startPage = lastEndPage + (blockPages * b) + 1;
            const endPage = Math.min(
                lastEndPage + blockPages * (b + 1),
                newTotal
            );
            blocks.push(BLOCK_STATE['FREE'], startPage, endPage);
        }

        // No race condition will occur here as there aren't any active scrappers
        // due to institute being already scrapped.
        await InstituteRepository.updateInstituteById(
            instituteId,
            {
                totalStudents: newTotal,
                blocks: blocks,
                blocksVersion: blocksVersion + 1
            }
        );

        return { success: true, message: "Institute blocks extended" };
    }
};

export default InstituteService;