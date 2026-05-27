import { ID, Models, Query } from "node-appwrite";
import { appwriteConfig } from "../../database/appwrite/config";
import { database } from "../../database/appwrite/instance";
import { ContributionRow } from "../../types/models/contribution";
import { ID_UNASSIGNED } from "../../data/params";
import { randomSleep } from "../../utils/timeUtils";



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
            queries: [Query.or([
                Query.equal('instituteId', instituteId),
                Query.equal('user', userId)
            ])]
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
        const queries = [Query.equal('$id', id)];
        if (preventRace) queries.push(Query.notEqual('assignedBlock', -1));
        return await database.updateRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            queries,
            data: {
                leaseExpiresAt: baseTime + extensionTime,
                lastHeartbeatAt: baseTime
            }
        });
    },
    updateAssignedBlock: async ( // TODO: Split this function. One function = One responsibility.
        id: string,
        prevBlockId: number,
        newBlockId: number,
        preventRace = false,
        recurAttempt = 0,
    ) => {
        // NOTE: THis method isn't exposed as a backend API and only accessible via intermediate service call.
        // Means provision of ContributionId is internally managed.

        // In one scenario this is a critical operation.
        // Hence the rollback to previous state upon failure.
        try {
            if (preventRace) {
                // Prevent race condition exclusively exists for revoking.
                return (await database.updateRows({
                    databaseId: appwriteConfig.databaseId,
                    tableId: appwriteConfig.contributionsTableId,
                    queries: [Query.and([
                        Query.equal('$id', id),
                        Query.notEqual('assignedBlock', ID_UNASSIGNED)
                    ])],
                    data: { assignedBlock: ID_UNASSIGNED } // CRUCIAAL NOTE: always ID_UNASSIGNED, unless stated otherwise in this comment.
                })).rows[0] ?? null;
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