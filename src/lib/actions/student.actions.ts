import { BatchBody, StudentBody } from "../../types/body";
import { appwriteConfig } from "../appwrite/config";
import { database } from "../appwrite/instance";
import { getRedis } from "../redis/instance";
import { extractUsernames } from "../utils";
import { getAllUsernames, getTotalStudentCount } from "./geeksforgeeks.actions";

export const addStudentsBatch = async (
    students: StudentBody[],
    instituteId: string
) => {
    try {
        const redis = await getRedis();

        const rows = [];
        const hashData: Record<string, string> = {};
        const scoreZ = [];
        const streakZ = [];
        const solvedZ = [];

        for (const s of students) {
            rows.push({
                $id: s.$id,
                instituteId: s.instituteId,
                branch: s.branch ?? null,
                username: s.username,
                name: s.name
            });

            const stats = JSON.stringify({
                score: s.score,
                solved: s.solved,
                streak: s.streak
            });

            hashData[s.username] = stats;
            scoreZ.push({ score: s.score, value: s.username });
            streakZ.push({ score: s.streak, value: s.username });
            solvedZ.push({ score: s.solved, value: s.username });
        }

        const res = await database.createRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.studentTableId,
            rows
        });

        if (res.total <= 0) {
            throw new Error("No rows inserted");
        }

        await redis
            .multi()
            .hSet(`institute:${instituteId}:data`, hashData)
            .zAdd(`institute:${instituteId}:scores`, scoreZ)
            .zAdd(`institute:${instituteId}:streaks`, streakZ)
            .zAdd(`institute:${instituteId}:solved`, solvedZ)
            .exec();

        return { success: true, code: 200 };

    } catch (err: any) {
        console.log("[addStudentsBatch]:", err?.message ?? err);
        return {
            success: false,
            message: err?.message ?? null,
            code: 500
        };
    }
};

export const cacheStudentUsernames = async (
    instituteId: string
) => {
    const countRes = await getTotalStudentCount(instituteId);

    if(!countRes.success)
        return { success: false }
    
    const count = countRes.count;
    const usernameRes = await getAllUsernames(instituteId, count);

    if(!usernameRes.success)
        return { success: false }

    // If it gets to this point, that means usernames haven't been cached.
    // Pre-existence checks maintained elsewhere.
    const redis = await getRedis();
    const usernames = usernameRes.usernames;
    redis.sAdd(`institute:${instituteId}:usernames`, usernames);

    return { success: true };
}

export const verifyStudentNames = async (
    students: BatchBody[],
    instituteId: string
) => {
    const usernames = extractUsernames(students);
    
    try{
        const redis = await getRedis();
        const results = await redis.smIsMember(
            `institute:${instituteId}:usernames`, 
            usernames
        );

        const allStudentsValid = results.every(r => r == 1)

        return {
            success: allStudentsValid,
            code: allStudentsValid ? 200 : 400,
            message: allStudentsValid ? "OK!" : "Invalid batch." 
        };
        
    } catch(err){
        console.log("Name verification failed");
        return {
            success: false,
            code: 500,
            message: "Server error. Verification failure."
        }
    }
}