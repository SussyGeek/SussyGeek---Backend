import { ID, Models, Query } from "node-appwrite";
import { appwriteConfig } from "../appwrite/config";
import { database } from "../appwrite/instance";
import { getUID } from "./user.actions";
import { ContributorRow, Institution } from "../../types/appwrite";
import { handleError, SECONDSFOR, sleep } from "../utils";
import { determineBlockCompletion, fetchInstitute, updateScrappedStudentsCount } from "./institution.actions";
type Result<T> = Promise<T>;

// Push this into a folder.
interface addResultFailure {
    success: false,
    code: number,
    message: string
};

interface addResultSuccess {
    success: true,
    contributor: ContributorRow,
    uid: string
}

export const addContributor = async (
    instituteId: string,
    username: string
): Result<Promise<addResultSuccess | addResultFailure>> => {

    let message, code=200, object="Contributor", source="addContributor";
    try{
        // This is user ID.
        const uid = (await getUID(username, null))?.UID;

        if(!uid){
            message = "Invalid user accessed";
            console.log("[addContributor]: User ID is null.") // For debugging. To be removed later.
            code = 403;
            throw(message);
        }

        const now = Math.floor(Date.now()/1000);

        const result = await database.createRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            rowId: ID.unique(),
            data: {
                username,
                uid,
                instituteId: instituteId,
                seconds: 0,
                students: 0,
                leaseExpiresAt: now + SECONDSFOR.Hour,
                lastHeartbeatAt: now,
                assignedBlock: -1 // Default value to prevent exclusion.
            } as Partial<ContributorRow>}) as ContributorRow;

        if(result.$id){
            return {
                success: true,
                uid: uid,
                contributor: result,
            };
        }

        message = "Server error";
        code = 500;
        throw(message);
  
    } catch(err){
        console.log("error at [addContributor]", err?.message);
        return handleError(`[${source}]`, code, object);
    }
}

// Push this into a folder.
interface ExistenceResultFailure {
    success: false
};

type ExistenceResultSuccess =
  | {
      success: true
      userExists: true
      contributor: ContributorRow
      expiredContributors: ContributorRow[]
    }
  | {
      success: true
      userExists: false
      contributor: null
      expiredContributors: ContributorRow[]
    }



export const getInstituteContributors = async (  
    username: string,
    instituteID: string
): Result<ExistenceResultSuccess | ExistenceResultFailure> => {
    try{

        // Checks if contributor for the institute 
        // OR
        // contributor for institute for current user exists.
        const result: Models.RowList = await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            queries: [Query.or([
                Query.equal('instituteId', instituteID),
                Query.and([
                    Query.equal('instituteId', instituteID),
                    Query.equal('username', username)
                ])
            ])]
        });
    
        if(result.total == null)
            return { success: false };

        let contributor: ContributorRow | null = null;
        let expiredContributors: ContributorRow[] = [];

        // Rule - One row per institution per user.
        for(let row of result.rows){
            const currentTime = Math.floor(Date.now()/1000);
            if(row.username === username)
                contributor = row as ContributorRow;
            // Rule - If a user completes their block, their blockId is treated unassigned (-1).
            // This rule will be enforced when user pushes the batch successfully and startPage == endPage
            else if(currentTime - row.leaseExpiresAt > SECONDSFOR.Hour && row.assignedBlock !== -1)
                expiredContributors.push(row as ContributorRow);
        }

        if (contributor) {
            return {
                success: true,
                userExists: true,
                contributor,
                expiredContributors,
            };
        }

        return {
            success: true,
            contributor: null,
            expiredContributors,
            userExists: false,
        };

    } catch (err){
        console.log("[CONTRI ACTIONS]: Contributor existence check err", err);
        return {
            success: false
        }
    }
}

export const handleAllocatedBlocks = async (
    contributor: ContributorRow,
    institute: Institution,
    expiredContributors: ContributorRow[]
): Promise<{
    success: boolean,
    message: string,
    code: number,
    startingPage: number
} | {
    success: false,
    message: string,
    code: number
}> => {

    let success, message, code;
    let source = "handleAllocatedBlocks";
    code = 500;
    try{
        const { assignedBlock: blockId  } = contributor;
        const assignmentRequired = blockId === -1;
        let startingPage = -1;

        if(!assignmentRequired){
            success = true, message = "No new block assigned.";
            code = 200;
            return { success, message, code, startingPage };
        }

        // 0 = idle
        // 1 = active (currently being contributed to)
        // 2 = done (Not accepting contributions).
        let freeBlockId = -1;
        if(expiredContributors.length === 0){ // Expired contributors don't exist. Pick from available free blocks.

            let tries = 3;
            let instUpdate = { total: 0, rows: [] };
            while(instUpdate.total === 0 && tries--){
                let size = institute.blocks.length;
                for(let b = 0 ; b < size ; b+=3){
                    if( institute.blocks[b] === 0){ // Free block == 0.
                        freeBlockId = b;
                        institute.blocks[b] = 1; // Block  reserved == 1.
                        break;
                    }
                }

                if (freeBlockId === -1)
                    return { success: false, message: "No blocks available", code: 409 };


                instUpdate = await database.updateRows({
                    databaseId: appwriteConfig.databaseId,
                    tableId: appwriteConfig.institutionTableId,
                    data: { blocks: institute.blocks, blocksVersion: institute.blocksVersion+1 },
                    queries: [ Query.and([
                        Query.equal('blocksVersion', institute.blocksVersion),
                        Query.equal('$id', institute.$id)
                    ]) ]
                });

                if(instUpdate.total > 0)
                    break;
                institute = await fetchInstitute(institute.$id, null, 1, 1, 0, false);
                freeBlockId = -1;
                await sleep(Math.random() * 0.5 + 0.2);
            }

            if(instUpdate.total === 0){
                success = false, message = "High contention. Try again.";
                code = 409;
                throw Error(message);
            }

        } else { // Pick a random expired contributor.
            let tries = 3;
            let conExpireResult = {total: 0, rows: []};
            while(conExpireResult.total === 0 && tries--){
                let b = Math.random()*expiredContributors.length;
                freeBlockId = expiredContributors[b].assignedBlock;

                conExpireResult = await database.updateRows({
                    databaseId: appwriteConfig.databaseId,
                    tableId: appwriteConfig.contributionsTableId,
                    queries: [ Query.and( [
                        Query.equal('instituteId', institute.$id), // This can be removed as $id is unique.
                        Query.equal('$id', expiredContributors[b].$id), 
                        Query.notEqual('assignedBlock', -2)] ) 
                    ], // From 1 to -1. Declare unassigned.
                    data: { assignedBlock: -2 }
                });
                await sleep(Math.random() * 0.5 + 0.2);
            }
            if(conExpireResult.total === 0){
                success = false, message = "High contention. Try again.";
                code = 409;
                throw Error(message);
            }
        }
        const now = Math.floor(Date.now()/1000);
        const conResult = await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            rowId: contributor.$id,
            data: {     
                assignedBlock: freeBlockId,
                leaseExpiresAt: now + SECONDSFOR.Hour,
                lastHeartbeatAt: now
            }
        });
        code = 200;
        success = true;
        message = "OK!";
        startingPage = institute.blocks[freeBlockId+1];

        return { success, message, code, startingPage };
    } catch(err){
        return handleError(`[${source}]`, code, 'block');
    }
}


export const batchUpdateAndExtendLease = async (
    username: string,
    instituteId: string,
    seconds: number, // Constant seconds elapsed since last batch
    students: number,
    id: string // This is contributor row id from res.locals

) => {
    let message, code = 200;
    let source = 'batchUpdateAndExtendLease';
    try {
        const row = await database.getRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            rowId: id
        });

        const instituteCompletionStatus = await determineBlockCompletion(
            instituteId,
            students,
            row.assignedBlock
        );

        if(!instituteCompletionStatus.success){
            message = instituteCompletionStatus.message;
            code = instituteCompletionStatus.code;
            throw new Error(message);
        }
        
        const now = Math.floor(Date.now()/1000);

        let assignedBlock;
        if(instituteCompletionStatus.message === "Block completed")
            assignedBlock = -1; // Reset block to unassigned.
        else
            assignedBlock = row.assignedBlock;

        const data = {
                students: row.students + students,
                seconds: row.seconds + seconds,
                lastHeartBeatAt: now, // Column redundant. Will be removed in future
                assignedBlock: assignedBlock
        }

        // This can cause bugs as time difference will be negative.
        // Personal justification? The time intervals of request will be 25-30 seconds, so time difference can become negative.
        // due to heartbeat surpassing expiry time.
        if(row.lastHeartbeatAt - row.leaseExpirsAt < 5){
            // @ts-ignore
            data.leaseExpiresAt = now+SECONDSFOR.Hour;
        }
        
        const result = await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.contributionsTableId,
            rowId: id,
            data,
        });

        if(!result.$id) return {
            success: false,
            code: 500 // Introduce a proper response in future.
        };

    } catch(err){
        handleError(`[${source}]`, code, '--');
    }
}