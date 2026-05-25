import { database } from "../../database/appwrite/instance";
import { appwriteConfig } from "../../database/appwrite/config";
import { getRedis } from "../../database/redis/instance";
import { StudentRow } from "../../types/models/student";
import { Query } from "node-appwrite";

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
    listStudentsById: async (
        studentIds: string[]
    ) => {
        return await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.studentTableId,
            queries: [
                Query.equal("$id", [studentIds]),
                Query.select(["username", "name"])
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
        return await redis.sAdd(`institute:${instituteId}:usernames`, usernames);
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
        usernames: string[]
    ) => {
        const redis = await getRedis();
        return await redis.smIsMember(
            `institute:${instituteId}:usernames`,
            usernames
        );
    }
};

export default StudentRepository;