import { ID, Models, Query } from "node-appwrite";
import { appwriteConfig } from "../appwrite/config";
import { database } from "../appwrite/instance";
import { getUID } from "./user.actions";


export const addContributor = async (
    instituteId: string,
    username: string,
    startStudents: number
) => {
    try{

        const existenceCheck = await contributorExists(username, instituteId);

        if(!existenceCheck.success){
            return {
                success: false,
                code: 500
            };
        }

        if(existenceCheck.exists){
            return {
                success: true,
                message: "Aready exists",
                code: 200
            };
        }

        const uid = (await getUID(username, null))?.UID;

        if(!uid) throw("[addContributor]: User ID is null.");

        const result: Models.DefaultRow = await database.createRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            rowId: ID.unique(),
            data: {
                username,
                uid,
                instituteId: instituteId,
                seconds: 0,
                students: 0,
                startStudents
            }
        });

        if(result.$id){
            return {
                success: true,
                message: "Contributor added",
                uid: uid,
                code: 200
            };
        }

        return {
            success: false,
            code: 500,
            message: "unknown"
        };

    } catch(err){
        console.log("Problem adding contribution: ", 
            // @ts-ignore
            err?.message ?? err);
        return {
            success: false,
            code: 500
        };
    }
}

export const contributorExists = async (  
    username: string,
    instituteID: string
): Promise<{
    success: boolean,
    exists?: boolean,
    uid?: string
}> => {
    try{
        const result: Models.RowList = await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            queries: [
                Query.and([
                    Query.equal('username', username),
                    Query.equal('instituteId', instituteID)
                ]),
            ] 
        });

        const uid = result?.rows[0]?.uid;

        if(result.total !== null || result.total !== undefined){
            return {
                success: true,
                exists: result.total > 0,
                uid: uid
            };
        }

        return {
            success: false
        }
    } catch (err){
        console.log("[CONTRI ACTIONS]: Contributor existence check err", err);
        return {
            success: false
        }
    }
}


export const batchUpdate = async (
    username: string,
    instituteId: string,
    seconds: number, // Constant seconds elapsed since last batch
    students: number

) => {
    try{
        const res = await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            queries: [
                Query.and([
                    Query.equal('instituteId', instituteId),
                    Query.equal('username', username)
                ])
            ]
        });


        const id = res.rows[0].$id; // We assume this exists, so no error checking!
        const row = res.rows[0];
        
        const result = await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            rowId: id,
            data: {
                students: row.students + students,
                seconds: row.seconds + seconds

            }
        });

        if(result.$id) return {
            success: true,
            code: 200
        };

        return {
            success: false,
            code: 404 
        };

    } catch(err){
        console.log("Contributions batch update error: ", 
            // @ts-ignore
            err?.message ?? err);
        return {
            success: false,
            code: 500
        };
    }
}