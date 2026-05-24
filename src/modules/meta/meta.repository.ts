import { Models, Operator, Query } from "node-appwrite";
import { appwriteConfig } from "../../database/appwrite/config";
import { database } from "../../database/appwrite/instance";
import { metaFields } from "../../data/meta";
import { getRedis } from "../../database/redis/instance";
import { MetaFieldTypes, RedisScoresObj } from "../../types/repo";

const MetaRepository = {
    getAllFields: async (): Promise<Models.RowList<Models.DefaultRow>> => {
        // @ts-ignore // TODO: Appwrite types outdated. Update it and move from this temp sol.
        return await database.getRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.metaTableId,
            rowId: appwriteConfig.rowIds.meta,
            queries: [Query.select(metaFields)]
        })
    },
    getField: async (field: string): Promise<Models.RowList<Models.DefaultRow>> => {
        // @ts-ignore // TODO: Appwrite types outdated. Update it and move from this temp sol.
        return await database.getRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.metaTableId,
            rowId: appwriteConfig.rowIds.meta,
            queries: [Query.select([field])]
        })
    },
    incrementAllFields: async (data: MetaFieldTypes) => { // TODO: Introduce a type in
        return await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.metaTableId,
            rowId: appwriteConfig.rowIds.meta,
            data: {
                totalScore: Operator.increment(data.totalScore),
                totalStudents: Operator.increment(data.totalStudents),
                totalProblems: Operator.increment(data.totalProblems)
            }
        });
    },
    redisAddScores: async (
        data: RedisScoresObj,
        instituteId: string
    ) => {
        const redis = await getRedis();
        await redis
            .multi()
            .hSet(`institute:${instituteId}:data`, data.hashScores)
            .zAdd(`institute:${instituteId}:scores`, data.counterArrays.scoreArr)
            .zAdd(`institute:${instituteId}:streaks`, data.counterArrays.streakArr)
            .zAdd(`institute:${instituteId}:solved`, data.counterArrays.solvedArr)
            .exec();
    }
};

export default MetaRepository;