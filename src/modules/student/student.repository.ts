import { database } from "../../database/appwrite/instance";
import { appwriteConfig } from "../../database/appwrite/config";
import { getRedis } from "../../database/redis/instance";
import { StudentRow } from "../../types/models/student";

const StudentRepository = {
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