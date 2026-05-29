import { database } from "../../database/appwrite/instance";
import { appwriteConfig } from "../../database/appwrite/config";
import { getRedis } from "../../database/redis/instance";
import { StudentRow } from "../../types/models/student";
import { Models, Query } from "node-appwrite";

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
    }
};

export default StudentRepository;