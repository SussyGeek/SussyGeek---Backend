import { database } from "../../database/appwrite/instance";
import { appwriteConfig } from "../../database/appwrite/config";
import { getRedis } from "../../database/redis/instance";
import { StudentRow } from "../../types/models/student";
import { Models, Query } from "node-appwrite";
import { CounterSetObject, serializedStudentData } from "../../types/students";

const StudentRepository = {
    listStudents: async (
        instituteId: string,
        pageNo: number,
        pageSize: number
    ) => {
        return await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.studentTableId,
            queries: [
                Query.equal("instituteId", instituteId),
                Query.limit(pageSize),
                Query.offset(pageSize * pageNo),
                Query.orderAsc("$sequence")
            ]
        });
    },
    listStudentsByIds: async (
        studentIds: string[]
    ): Promise<Models.RowList<StudentRow>> => {
        return await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.studentTableId,
            queries: [
                Query.equal("$id", studentIds),
                Query.select(["username", "name"])
            ]
        });
    },
    listByFullNameInInstitute: async (
        fullName: string,
        instituteId: string
    ) => {
        return await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.studentTableId,
            queries: [
                Query.and([
                    Query.equal("instituteId", instituteId),
                    Query.search("name", fullName)]),
                Query.select(["$id"])
            ]
        });
    },
    addMultiple: async (data: Partial<StudentRow>[]) => {
        return await database.createRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.studentTableId,
            rows: data
        });
    },
    redisAddUsernamesToInstituteSet: async (
        instituteId: string,
        usernames: string[]
    ) => {
        const redis = await getRedis();
        return await redis.sAdd(`institute:${instituteId}:users`, usernames);
    },
    redisCacheOrderedStudentList: async (
        instituteId: string,
        students: string[]
    ) => {
        const redis = await getRedis();
        return await redis.rPush(`institute:${instituteId}:students`, students);
    },
    redisExtendListAndCacheSet: async (
        instituteId: string,
        data: serializedStudentData
    ) => {
        const redis = await getRedis();
        await redis
            .multi()
            .sAdd(`institute:${instituteId}:users`, data.set)
            .rPush(`institute:${instituteId}:students`, data.list)
            .exec();
    },
    redisGetOrderedStudentList: async (
        instituteId: string
    ) => {
        const redis = await getRedis();
        return await redis.lRange(`institute:${instituteId}:students`, 0, -1);
    },
    redisStudentMembershipCheck: async (
        instituteId: string,
        users: string[]
    ) => {
        const redis = await getRedis();
        return await redis.smIsMember(
            `institute:${instituteId}:users`,
            users
        );
    },
    redisScrappedMembershipCheck: async (
        instituteId: string,
        users: string[]
    ) => {
        const redis = await getRedis();
        return await redis.smIsMember(
            `institute:${instituteId}:scrapped`,
            users
        )
    },
    redisSearchStudnetsOnHash: async (
        instituteId: string,
        studentIds: string[]
    ) => {
        const redis = await getRedis();
        return redis.hmGet(`institute:${instituteId}:data`, studentIds)
    },
    // NOTE: This method is only used
    // For institutional wide score updates
    // Not batch submissions, batch updations.
    redisUpdateScores: async (
        instituteId: string,
        counterSets: CounterSetObject,
        hashMap: Record<string, string>
    ) => {
        const redis = await getRedis();
        await redis
            .multi()
            .hset(`institute:${instituteId}:data`, hashMap)
            .zAdd('global:scores', counterSets.scores)
            .zAdd('global:solved', counterSets.solved)
            .zAdd('global:streaks', counterSets.streak)
            .zAdd(`institute:${instituteId}:solved`, counterSets.solved)
            .zAdd(`institute:${instituteId}:streaks`, counterSets.streak)
            .zAdd(`institute:${instituteId}:scores`, counterSets.scores)
            .exec()
    },
    redisGetSortedStudents: async (
        instituteId: string,
        sortBy: 'score' | 'solved' | 'streak',
        order: 'asc' | 'desc',
        pageNo: number,
        pageSize: number
    ) => {
        const redis = await getRedis();
        const start = (pageNo - 1) * pageSize;
        const end = start + pageSize - 1;
        const key = sortBy === 'score' ? `institute:${instituteId}:scores` :
                    sortBy === 'solved' ? `institute:${instituteId}:solved` :
                    `institute:${instituteId}:streaks`;
        
        let studentIds: string[];
        if (order === 'desc') {
            studentIds = await redis.zRange(key, start, end, { REV: true });
        } else {
            studentIds = await redis.zRange(key, start, end);
        }
        
        if (!studentIds || studentIds.length === 0) return [];
        
        const rawData = await redis.hmGet(`institute:${instituteId}:data`, studentIds);
        
        const parsed = rawData.map((d, i) => {
            if (!d) return null;
            const parsedObj = JSON.parse(d);
            parsedObj.$id = studentIds[i];
            return parsedObj;
        }).filter(Boolean);
        
        return parsed;
    }
}

export default StudentRepository;