import { BatchBody, StudentBody } from "../../types/body";
import { appwriteConfig } from "../appwrite/config";
import { database } from "../appwrite/instance";
import { getRedis } from "../redis/instance";
import { extractUsernames } from "../utils";
import { getAllUsernames, getTotalStudentCount } from "./geeksforgeeks.actions";

export const addStudentsBatch = async (
    students: StudentBody[],
    limit: number // Will be used later for concurrent institutional scrapping.
) => {

    try{
        const res = await database.createRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.studentTableId,
            rows: students
        });

        if(res?.total === 0) return {
            success: false, 
            code: 500
        };

        if(res?.total > 0) return {
            success: true, 
            code: 200
        };

        return {
            success: false,
            code: 500
        };

    } catch(err){
        console.log("[addStudentsBatch]: Error adding student batch: ",
            // @ts-ignore
            err?.message ?? err)
        return {
            success: false, 
            // @ts-ignore // FIX!
            message: err?.message ?? null,
            code: 500
        }
    }
}

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