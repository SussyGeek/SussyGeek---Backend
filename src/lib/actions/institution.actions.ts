import { database } from "../appwrite/instance";
import { appwriteConfig } from "../appwrite/config";
import { handleError, omitDBInfo, prepInstitutionObject, sleep } from "../utils";
import { ID, Query } from "node-appwrite";
import { BLOCK, STUDENT_BATCH_SIZE } from "../../data/params";

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
    let code = 200;
    let dataObject = "Institute";
    const source = 'fetchInstitute';
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

        if(!response?.rows && !id){
            code = 400;
            throw Error("Institute ID is invalid.");
        }
        
        // Introduce efficiency here bro.
        if(omitInfo)
            omitDBInfo(response.rows ? response.rows : [response], true);

        return id?.trim() ? response : response.rows;
        
    } catch(err){
        // This is bad way. Fix this later. Generic errors fail diagnosis.
        handleError(`[${source}]`, code, dataObject);
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
        
        if(canUpdate < 1){
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

export const assignBlocksToInstitution = async (
    instituteId: string,
    students: number
) => {
    let message;
    try {
        let blockList = [];
        const totalBlocks = (students/STUDENT_BATCH_SIZE)/BLOCK;
        const blockPages = Math.ceil(STUDENT_BATCH_SIZE*BLOCK);

        for(let b = 0 ; b < totalBlocks ; b++ ){
            const start = (blockPages * b) + 1;
            const end = Math.min(
                blockPages * (b + 1),
                students
            );
            blockList.push(0,start,end)
        }
        const result = await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: instituteId,
            data: {
                blocks: blockList
            }
        });

        message = "Assigned."

        if(result.$id){
            return {
                success: true,
                message: message
            }
        }

        return { success: false }
    } catch (err){
        // @ts-ignore
        let message = err?.message ?? "Server error";
        console.log("[InstitutionController - assignBlocks]: ", message);
        return {
            success: false
        };
    }
}

export const updateScrappedStudentsCount = async (
    instituteId: string,
    studentCount: number
) => {
    try {
        const result = await database.incrementRowColumn({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: instituteId,
            column: "scrappedStudents",
            value: studentCount
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

export const determineBlockCompletion = async (
    instituteId: string,
    studentCount: number,
    assignedBlock: number

) => {
    let code: number = 200, message: string;
    let source: string = "determineBlockCompletion"
    try{
        let institute = await fetchInstitute(instituteId, null, 1, 1, 0, false);
        if(!institute.$id){
            message = "Failed to fetch institute."; 
            code = 404;
            throw new Error("Failed to fetch institute.");
        }

        const currentPage = institute.blocks[assignedBlock+1]+studentCount;
        const blockCompleted = currentPage >= institute.blocks[assignedBlock+2];

        let tries = 5;
        let instUpdateResult = { total: 0, rows: [] };

        while(instUpdateResult.total === 0 && tries--){
            // @ts-ignore FIX!
            institute.blocks[assignedBlock] = blockCompleted ? 2 : 1;
            institute.blocks[assignedBlock+1] = currentPage;
            instUpdateResult = await database.updateRows({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.contributionsTableId,
                queries: [
                    Query.and([
                        Query.equal('instituteId', instituteId),
                        Query.notEqual('blocksVersion', institute.blockVersion)
                    ])
                ],
                data: {
                    blocks: institute.blocks,
                    blocksVersion: institute.blocksVersion+1
                }
            }); 
            await sleep(Math.random() * 0.5 + 0.2);
            institute = await fetchInstitute(instituteId, null, 1, 1, 0, false);
        }

        if(instUpdateResult.total === 0){
            message = "High contention. Try again!."; 
            code = 409;
            throw new Error("Failed to fetch institute.");
        }

        code = 200;
        return {
            success: true, 
            message: blockCompleted ? 
            "Block completed" : "Block incomplete",
            code
        }
    } catch(err){
        return handleError(`[${source}]`, code, 'institute' );
    }
}

