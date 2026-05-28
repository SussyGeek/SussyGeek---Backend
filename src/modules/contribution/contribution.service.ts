import { Models } from "node-appwrite";
import ContributionRepository from "./contribution.repository";
import InstituteService from "../institute/institute.service";
import { timeUnits } from "../../utils/timeUtils";
import { BLOCK, BLOCK_STATE, ID_UNASSIGNED, STUDENT_BATCH_SIZE } from "../../data/params";
import { ContributionRow } from "../../types/models/contribution";
import UserService from "../user/user.service";
import { InstituteRow } from "../../types/models/institute";
import InstituteRepository from "../institute/institute.repository";
import { randomSleep } from "../../utils/timeUtils";
import { getRandomIdx } from "../../utils/randomIdxGenerator";
import { BatchBody, StudentBody } from "../../types/body";
import { aggregateScore, prepBatchList } from "../../utils/contributionUtils";
import StudentService from "../student/student.service";
import MetaService from "../meta/meta.service";
import MetaRepository from "../meta/meta.repository";
import { ApiError } from "../../errors/ApiError";


const ContributionService = {
    resolveUserIdByUsername: async (username: string): Promise<string> => {
        return await UserService.getIdbyUsername(username);
    },
    getUserContributions: async (userId: string) => {
        const res = await ContributionRepository.getUserContributions(userId);
        return { instituteContributions: res.rows };
    },
    getInstituteContributions: async (instituteId: string) => {
        const res = await ContributionRepository.getInstituteContributions(instituteId);
        return { instituteContributions: res.rows };
    },
    getInstituteAndUserContributions: async (
        userId: string,
        instituteId: string
    ) => {
        /*
            GETS:
            1. All institution related contributions.
            2. All ACTIVE Contributions for the user
                                (i.e assignedBlock !== -1 [ID_UNASSIGNED])
        */
        const res = await ContributionRepository.getUserAndInstContributions(
            userId,
            instituteId
        );

        let instituteContributions: Models.DefaultRow[] = [];
        let userContributions: Models.DefaultRow[] = [];
        res.rows.forEach(row => {
            if (row.assignedBlock !== ID_UNASSIGNED && row.user.$id === userId) {
                userContributions.push(row);
            }
            if (row.instituteId === instituteId) {
                instituteContributions.push(row);
            }
        });

        return {
            instituteContributions,
            userContributions
        };
    },
    getUserAndExpiredRows: async (userId: string, instituteId: string): Promise<{
        user: ContributionRow | undefined,
        expired: ContributionRow[],
        institute: ContributionRow[]
    }> => {
        const { instituteContributions: contributions } = await ContributionService.getInstituteContributions(instituteId);
        let contributorRow;
        const expiredContributionRows: ContributionRow[] = [];

        contributions.forEach(c => {
            const now = Math.floor(Date.now() / 1000);
            // POSSIBLE BUG: This logic is questionably but consistent with previous implementation
            // I mean the SECONDS.HalfHour one and not > 0 [You're allowing way too much buffer time / protection ahead of expirty]
            const expired = (now - c.leaseExpiresAt) > timeUnits.SECONDSFOR.HalfHour;
            if (c.user === userId) contributorRow = c;
            else if (expired && c.assignedBlock !== -1)
                expiredContributionRows.push(c);
        });

        return {
            user: contributorRow,
            expired: expiredContributionRows,
            institute: contributions
        };
    },
    createContribution: async (
        userId: string,
        instituteId: string,
    ) => {
        const now = Math.floor(Date.now() / 1000);
        const data: Partial<ContributionRow> = {
            user: userId,
            instituteId,
            seconds: 0,
            students: 0,
            leaseExpiresAt: now + timeUnits.SECONDSFOR.HalfHour,
            lastHeartbeatAt: now,
            assignedBlock: ID_UNASSIGNED
        };
        const row = await ContributionRepository.createContribution(data);
        return row;
    },
    extendLease: async (id: string) => {
        /*
            1. Extends a user's lease time.
            2. Built to notify of potential race condition preventing write inconsistency.
            MESSAGE MEANING:
            I. EXTENDED: Self-explanatory.
            II. TAKEN: Someone else took your block. Find new block.
        */

        // TODO: Split this function and its repo function to race and none-race types for faster update.
        // As the race one is used exclusively to declare someone as expired.

        const baseTime = Math.floor(Date.now() / 1000); // current Time
        const TEN_MINS = 60 * 10; // extend by [BTW Resuming contributors aren't prioritized.]
        const result = await ContributionRepository.extendLease(
            id, baseTime, TEN_MINS, true
        )
        return {
            success: result.total > 0,
            message: result.total > 0 ? 'EXTENDED' : 'TAKEN'
        };
    },
    // for flexible updations.
    updateContribution: async (contributionId: string, data: Partial<ContributionRow>) => {
        const row = await ContributionRepository.updateContribution(contributionId, data);
        return { success: true, contributor: row };
    },
    pushBatchAndLease: async (
        contributor: ContributionRow,
        batchComplete: boolean,
        studentCount: number,
        seconds: number,
        assignedBlockId: number
    ) => {
        /*
        DOES:
        1. Updates:
          I. Student count
          II. Seconds elapsed scraping
          III. lastHeatbeat

        2. Pushes the lease forward by 1/2 hour if below specified mins.
        */
        const now = Math.floor(Date.now() / 1000);

        const data = {
            students: contributor.students + studentCount,
            seconds: contributor.seconds + seconds,
            lastHeartbeatAt: now,
            // System rule: Set ID to unassigned upon block completion.
            assignedBlock: batchComplete ? ID_UNASSIGNED : assignedBlockId
        };

        // TODO: Add a variable here so we can easily change the time accumulation.
        if (contributor.leaseExpiresAt - contributor.lastHeartbeatAt < (3.5 * 60)) {
            // @ts-ignore // fix this later.
            data.leaseExpiresAt = now + timeUnits.SECONDSFOR.HalfHour;
        }

        const newContributionRow = (await ContributionService.updateContribution(contributor.$id, data)).contributor;

        return {
            success: true,
            contributionRow: newContributionRow
        };
    },
    allocateBlockFromInstitute: async (
        instituteId: string
    ) => {
        let tries = 3; // polling for an empty slot.
        let instituteUpdated = false;
        let freeBlockId = ID_UNASSIGNED;
        let institute = (await InstituteService.getInstitute(instituteId, '', 0, 0, 0)).rows[0];

        while (!instituteUpdated && tries--) {
            const size = institute.blocks.length;
            for (let b = 0; (b < size) && freeBlockId === ID_UNASSIGNED; b += 3) {
                if (institute.blocks[b] === BLOCK_STATE['FREE']) {
                    freeBlockId = b;
                    institute.blocks[b] = BLOCK_STATE['ACTIVE'];
                }
            }

            if (freeBlockId === ID_UNASSIGNED)
                throw new ApiError(409, 'No blocks available. Try again later');

            const result = await InstituteRepository.updateInstituteBlocksNoRace(
                institute.$id, institute.blocks, institute.blocksVersion
            );
            instituteUpdated = result.total > 0;
            institute = result.rows[0]

            if (instituteUpdated) break;

            institute = (await InstituteService.getInstitute(instituteId, '', 0, 0, 0)).rows[0];
            freeBlockId = -1;
            await randomSleep(0.5, 0.2);
        }

        if (!instituteUpdated) throw new ApiError(409, "High contention. Try again later");

        return {
            startingPage: institute.blocks[freeBlockId + 1],
            endingPage: institute.blocks[freeBlockId + 2],
            blocks: institute.blocks,
            freeBlockId,
        };
    },
    resolveUserId: (contribution: ContributionRow): string => {
        if (typeof contribution.user === 'string') return contribution.user;
        if (contribution.user && typeof contribution.user === 'object') return contribution.user.$id;
        throw new ApiError(500, "Contribution has no linked user");
    },
    revokeAssignedBlockFromExpired: async (cid: string, userId: string, prevBlockId: number) => {
        // contribution row related to block.
        const cRow = await ContributionRepository.updateAssignedBlock(cid, prevBlockId, ID_UNASSIGNED, true);
        if (!cRow) return { success: false }; // Race condition or appwrite level issue. Handled eitherway.
        await UserService.UpdateUserState(userId, 'idle');
        return { success: true };
    },
    stealExpiredBlock: async (expiredContributors: ContributionRow[], blocks: number[]) => {
        let tries = 3, isBlockAllocated = false;
        let freeBlockId = -1;

        while (!isBlockAllocated && tries--) {
            let randomIdx = getRandomIdx(expiredContributors);
            freeBlockId = expiredContributors[randomIdx].assignedBlock;

            const userId = ContributionService.resolveUserId(expiredContributors[randomIdx]);
            const { $id } = expiredContributors[randomIdx];

            isBlockAllocated = (await ContributionService.revokeAssignedBlockFromExpired(
                $id, userId, freeBlockId
            )).success;

            if (!isBlockAllocated) {
                expiredContributors[randomIdx].assignedBlock = -1;
                await randomSleep(0.6, 0.2);
            }
        }

        if (!isBlockAllocated) throw new ApiError(409, "High contention. Try again later.");
        return {
            startingPage: blocks[freeBlockId + 1],
            endingPage: blocks[freeBlockId + 2],
            blocks,
            freeBlockId
        };
    },
    handleBlocks: async (
        contributor: ContributionRow,
        institute: InstituteRow,
        expiredRows: ContributionRow[]
    ) => {
        let startingPage, leaseMessage;
        const now = Math.floor(Date.now() / 1000);
        if (contributor.assignedBlock !== ID_UNASSIGNED) { // UNASSIGNED or EXPIRED.
            const leaseExpired = now - contributor.leaseExpiresAt >= 0;
            leaseMessage = (leaseExpired ?
                await ContributionService.extendLease(contributor.$id) :
                { message: 'NOT_EXPIRED' }).message;

            // We ignore for leaseMessage === 'TAKEN'. It means someone took
            // the block ID we were scrapping so we are gonna claim a new one
            // by not early returning & proceeding.
            if (leaseMessage === 'NOT_EXPIRED' || leaseMessage === 'EXTENDED') {
                startingPage = institute.blocks[contributor.assignedBlock + 1];
                const endingPage = institute.blocks[contributor.assignedBlock + 2];
                return {
                    success: true,
                    leaseMessage,
                    startingPage,
                    assignedBlock: contributor.assignedBlock,
                    endingPage,
                    blocks: []
                };
            }
        }

        const noExpiredContributorFound = expiredRows.length === 0;

        const allocationRes = noExpiredContributorFound ?
            await ContributionService.allocateBlockFromInstitute(institute.$id) : // Allocate from institute
            await ContributionService.stealExpiredBlock(expiredRows, institute.blocks); // Take from expired.

        // Allocate lease and give user the ID.
        await ContributionService.updateContribution(
            contributor.$id,
            {
                assignedBlock: allocationRes.freeBlockId,
                lastHeartbeatAt: now,
                leaseExpiresAt: now + timeUnits.SECONDSFOR.HalfHour
            }
        );

        const contributorUserId = ContributionService.resolveUserId(contributor);
        await UserService.UpdateUserState(contributorUserId, 'active');

        return {
            success: true,
            startingPage: allocationRes.startingPage,
            endingPage: allocationRes.endingPage,
            blocks: allocationRes.blocks,
            assignedBlock: allocationRes.freeBlockId,
            leaseMessage: leaseMessage ?? 'LEASE_ASSIGNED'
        };
    },
    handleContribution: async (
        userId: string,
        instituteId: string
    ) => {
        // Creates block if not already.
        const blockRes = await InstituteService.assignBlocks(instituteId);
        let { institute } = blockRes;
        const { isUsersCached } = institute;

        if (!isUsersCached) {
            const cacheRes = await StudentService.cacheStudentUsernames(institute.$id);
            institute = cacheRes.institute;
        }

        if (institute.scrappedStudents === institute.totalStudents) {
            throw new ApiError(409, "No students left to scrape");
        }

        const contributionRows = await ContributionService.getUserAndExpiredRows(userId, instituteId);
        if (contributionRows.user == null) {
            contributionRows.user = await ContributionService.createContribution(userId, instituteId);
        }

        const allocationRes = await ContributionService.handleBlocks(
            contributionRows.user, institute, contributionRows.expired
        );

        return {
            ...allocationRes,
            institute,
            contributor: contributionRows.user,
            totalStudents: institute.scrappedStudents,
            instituteContributions: contributionRows.institute
        };
    },
    handleBatchPublication: async (
        institute: InstituteRow,
        students: BatchBody[],
        startingPage: number,
        seconds: number,
        assignedBlock: number,
        contributor: ContributionRow
    ) => {
        const studentCount = students.length;
        const batch: StudentBody[] = prepBatchList(students, institute.$id);
        const studentData = aggregateScore(batch);

        await StudentService.addStudents(studentData.rows);
        await MetaRepository.redisAddScores(studentData, institute.$id);
        const isBlockComplete = await InstituteService.hasBlockCompleted(
            assignedBlock,
            startingPage,
            studentCount,
            institute,
            ''
        );

        const newBlockState = BLOCK_STATE[isBlockComplete ? 'COMPLETE' : 'ACTIVE'];

        // TODO: Possibility of failure due to race condition. Handle appropriately. [NOT HANDLED]
        // Why it's not handled? Polling higher is already applied, the failure is possible state corruption.
        const { blocks } = await InstituteService.updateBlockPagesAndState(
            institute.$id, assignedBlock, newBlockState, studentCount
        )

        const newContributionRow = (await ContributionService.pushBatchAndLease(
            contributor, isBlockComplete, studentCount, seconds, assignedBlock
        )).contributionRow;

        const { data: aggregated } = await InstituteService.incrementScoreAndProblems(institute.$id, batch);
        await MetaService.incrementAll({
            totalProblems: aggregated.batchProblems,
            totalScore: aggregated.batchScore,
            totalStudents: aggregated.studentCount,
        });

        return {
            startingPage: startingPage + studentCount,
            assignedBlockId: assignedBlock,
            batchSize: STUDENT_BATCH_SIZE,
            blockSize: BLOCK,
            blocks: blocks,
            instituteScrappedCount: institute.scrappedStudents,
            userInstituteContribution: newContributionRow,
            isBlockComplete: newBlockState === BLOCK_STATE['COMPLETE']
        }
    },
    stopContribution: async (
        userId: string,
        instituteId: string,
        sessionId: string
    ) => {
        const res = await ContributionRepository.getUserRelatedInstContribution(userId, instituteId);
        if (res.total === 0)
            throw new ApiError(404, "No session found for this institue.");

        const contributionRow = res.rows[0];
        const secondsNow = Date.now() / 1000;
        const sessionExpired = (secondsNow - contributionRow.leaseExpiresAt) >= 0;

        await UserService.SetInactive(sessionId);
        if (sessionExpired)
            return { success: true, message: "Session already expired" };

        const newExpirySeconds = Math.round(secondsNow - timeUnits.SECONDSFOR.Hour);
        await ContributionRepository.updateContribution(
            contributionRow.$id,
            {
                leaseExpiresAt: newExpirySeconds,
                lastHeartbeatAt: newExpirySeconds
            }
        );

        return { success: true, message: "Contribution stopped" };
    }
};

export default ContributionService;