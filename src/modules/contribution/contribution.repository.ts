import { ID, Models, Query } from "node-appwrite";
import { appwriteConfig } from "../../database/appwrite/config";
import { database } from "../../database/appwrite/instance";
import { getRedis } from "../../database/redis/instance";
import { ContributionRow } from "../../types/models/contribution";
import { ID_UNASSIGNED } from "../../data/params";
import { randomSleep } from "../../utils/timeUtils";

const LOCK_TTL = 5; // seconds



const ContributionRepository = {
    getInstituteContributions: async (instituteId: string): Promise<Models.RowList<ContributionRow>> => {
        return database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            queries: [Query.equal('instituteId', instituteId)]
        });
    },
    getUserContributions: async (userId: string): Promise<Models.RowList<ContributionRow>> => {
        return database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            queries: [Query.equal('user', userId)]
        });
    },
    getUserAndInstContributions: async (
        userId: string,
        instituteId: string
    ) => {
        return database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            queries: [
                Query.or([
                    Query.equal('instituteId', instituteId),
                    Query.equal('user', userId)
                ]),
                Query.select(
                    [
                        "$id",
                        "seconds",
                        "students",
                        "leaseExpiresAt",
                        "lastHeartbeatAt",
                        "assignedBlock",
                        "instituteId",
                        "user.$id",
                        "user.username"

                    ]
                )
            ]
        });
    },
    getUserRelatedInstContribution: async (
        userId: string,
        instituteId: string
    ) => {
        return database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            queries: [Query.and([
                Query.equal('instituteId', instituteId),
                Query.equal('user', userId)
            ])]
        });
    },
    createContribution: async (data: Partial<ContributionRow>): Promise<ContributionRow> => {
        return database.createRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            rowId: ID.unique(),
            data
        });
    },
    // Provide the time in seconds not MS.
    extendLease: async (id: string, baseTime: number, extensionTime: number, preventRace = false) => {
        if (preventRace) {
            const redis = await getRedis();
            const lockKey = `lock:contrib:${id}`;
            const acquired = await redis.set(lockKey, '1', { EX: LOCK_TTL, NX: true });
            if (!acquired) return { total: 0, rows: [] };
            try {
                const row = await database.getRow({
                    databaseId: appwriteConfig.databaseId,
                    tableId: appwriteConfig.contributionsTableId,
                    rowId: id,
                    queries: [Query.select(['assignedBlock'])]
                });
                if (row.assignedBlock === ID_UNASSIGNED) return { total: 0, rows: [] };

                const updated = await database.updateRow({
                    databaseId: appwriteConfig.databaseId,
                    tableId: appwriteConfig.contributionsTableId,
                    rowId: id,
                    data: { leaseExpiresAt: baseTime + extensionTime, lastHeartbeatAt: baseTime }
                });
                return { total: 1, rows: [updated] };
            } finally {
                await redis.del(lockKey);
            }
        }
        const updated = await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            rowId: id,
            data: { leaseExpiresAt: baseTime + extensionTime, lastHeartbeatAt: baseTime }
        });
        return { total: 1, rows: [updated] };
    },
    updateAssignedBlock: async (
        id: string,
        prevBlockId: number,
        newBlockId: number,
        preventRace = false,
        recurAttempt = 0,
    ) => {
        // Not exposed as a backend API — ContributionId is internally managed.
        // Rollback to previous state upon failure.
        try {
            if (preventRace) {
                const redis = await getRedis();
                const lockKey = `lock:contrib:${id}`;
                const acquired = await redis.set(lockKey, '1', { EX: LOCK_TTL, NX: true });
                if (!acquired) return null;
                try {
                    const row = await database.getRow({
                        databaseId: appwriteConfig.databaseId,
                        tableId: appwriteConfig.contributionsTableId,
                        rowId: id,
                        queries: [Query.select(['assignedBlock'])]
                    });
                    if (row.assignedBlock === ID_UNASSIGNED) return null;

                    return await database.updateRow({
                        databaseId: appwriteConfig.databaseId,
                        tableId: appwriteConfig.contributionsTableId,
                        rowId: id,
                        data: { assignedBlock: ID_UNASSIGNED }
                    });
                } finally {
                    await redis.del(lockKey);
                }
            }
            else {
                return await database.updateRow({
                    databaseId: appwriteConfig.databaseId,
                    tableId: appwriteConfig.contributionsTableId,
                    rowId: id,
                    data: { assignedBlock: newBlockId }
                });
            }
        } catch (err) {
            if (recurAttempt >= 2) return null;
            await randomSleep(1, 0.4);
            await ContributionRepository.updateAssignedBlock(
                id, -1, prevBlockId, false, recurAttempt + 1
            );
            return null;
        }
    },
    updateContribution: async (id: string, data: Partial<ContributionRow>) => {
        return await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            rowId: id,
            data,
        })
    },
};

export default ContributionRepository;