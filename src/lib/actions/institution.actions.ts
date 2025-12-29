import { database } from "../appwrite/instance";
import { appwriteConfig } from "../appwrite/config";
import { omitDBInfo, prepInstitutionObject } from "../utils";
import { ID, Query } from "node-appwrite";
import { STUDENT_BATCH_SIZE } from "../../data/params";

const makeQueries = (
    name: string | null,
    limit: number,
    offset: number
) => {
    let queries = [];

    if(!name){
        queries.push(Query.limit(limit));
        queries.push(Query.offset(offset));
    } else if(name){
        queries.push(Query.contains('name', name));
    }
    return queries;
}  


export const pushInstitute = async (
    name: string,
    slug: string,
    registeredGeeks: number,
    location: {
        city: string,
        state: string,
        country: string
    }
) => {
        try{
            const InstitutionEntry = prepInstitutionObject(
                name.slice(0,120),
                slug.slice(0, 120),
                registeredGeeks,
                location
            );  
            return await database.createRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: ID.unique(),
            data: InstitutionEntry
            });
        } catch(err){
            console.log("Couldn't push institute: ", err)
            throw(err);
        }
}

export const fetchInstitute = async (
    id: string | null,
    name: string | null,
    page: number,
    limit: number,
    offset: number,
    omitInfo = true

) => {

    try{
        const queries = makeQueries(
            name,
            limit,
            offset
        );

        const response = id?.trim() ? 
        (await database.getRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: id
        })) :
        (await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            queries: queries,
        })) ;

        if(!response?.rows && !id) throw Error("No results found.");
        
        // Introduce efficiency here bro.
        if(omitInfo)
            omitDBInfo(response.rows ? response.rows : [response], true);

        return id?.trim() ? response : response.rows;
        
    } catch(err){
        if(err?.code === 404){
            err.message = "Institute not found."
        }
        console.log("Institute fetch err - ", 
            // @ts-ignore
            err?.message ?? err);
        throw(err?.message ?? "Server error.");
    }
}

export const updateTotalStudentCount = async (
    instituteId: string
) => {
    try{
        const institute = await fetchInstitute(instituteId, null, 1, 1, 0);
        const lastUpdate = new Date(institute.$updatedAt).getTime();
        const currTime = Date.now();

        const canUpdate = (currTime - lastUpdate)/(3600*1000);
        
        if(canUpdate){
            const updationRes = await database.incrementRowColumn({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.institutionTableId,
                rowId: instituteId,
                column: "students",
                value: institute.students
            });

            
        }

        return {
                success: true,
                message: canUpdate ? 
                "Updated" :
                "Recently updated",
                code: 200
        }

    } catch(err){
        return {
            success: false,
            // @ts-ignore
            message: err?.message ?? "Institute not found.",
            code: 404
        };
    }
}

export const updateScrappedStudentsCount = async (
    instituteId: string
) => {
    try {
        const result = await database.incrementRowColumn({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: instituteId,
            column: "scrappedStudents",
            value: STUDENT_BATCH_SIZE
        });

        return (result.$id ? {
            success: true,
            code: 200,
            message: "Updated"
        }: {
            success: false,
            code: 500,
            message: "Appwrite Server Error"
        }
        )
    } catch(err){
        //@ts-ignore
        const message = err?.message ?? "Appwrite Server Error"
        console.log("[INSTITUTE: updateScrappedStudents] ", message);
        return {
            success: false,
            code: 500,
            message: message
        }
    }
}

// export const 

export const assignScrapper = async (
    uid: string,
    instituteId: number, // Maybe will be used?
    rowId: string
) => {
    try{
        const result = await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId,
            data: {
                activeScrapper: uid,
                leaseExpiresAt: 59595, // PLACEHOLDER SECONDS [The time at which user contributes]: FIX
                lastHeartbeatAt: 595959, // FIX
                status: 2 // I think 2 stands for scrapping (We're using ENUM: Incomplete, Complete, Scrapping). FIX
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
    } catch (err){
        console.log("Scrapper assignment error: ", 
            // @ts-ignore BAD FIX!
            err?.message ?? err);
        return {
            success: false,
            code: 500
        }
    }
}

export const updateActiveScrapper = async (
    username: string,
    instituteId: string,
    seconds: number
) => {
    try {
        const expiry = seconds + 60; // Assuming that seconds = seconds & not ms

        const result = await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: instituteId,
            data: {
                activeScrapper: username,
                leaseExpiresAt: expiry,
                lastHeartbeatAt: seconds
            }
        });

        if(result.$id){
            return {
                success: true,
            }
        }

        return {
            success: false
        };

    } catch (err){
        console.log("[updateActiveScrapper]: Erorr: ", err);
        return {
            success: false,
            code: 500
        }
    }
}

export const extendLease = async (
    rowId: string
) => {
    try {
        const result = await database.incrementRowColumn({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId,
            column: "leaseExpiresAt",
            value: 500 // Value that represents extension seconds. FIX!
        });

        if(result.$id) return {
            success: true,
            code: 200
        };
        
        return {
            success: false,
            code: 404
        };

    } catch (err){
        console.log("Lease extension error: ", 
            // @ts-ignore BAD FIX!
            err?.message ?? err);
        return {
            success: false,
            code: 500
        }
    }
}
