import { NextFunction, Request, Response } from "express"
import { 
    addContributor, 
    getInstituteContributors, 
    batchUpdateAndExtendLease, 
    handleAllocatedBlocks 
} from "../lib/actions/contributions.actions";
import { BatchBody, ContributorReqBody, StudentBody } from "../types/body";
import { addStudentsBatch, cacheStudentUsernames, verifyStudentNames } from "../lib/actions/student.actions";
import { prepBatchList } from "../lib/utils";
import { assignBlocksToInstitution, fetchInstitute, updateScrappedStudentsCount } from "../lib/actions/institution.actions";
import { ContributorRow } from "../types/appwrite";
import { BLOCK, STUDENT_BATCH_SIZE } from "../data/params";


export const handleBlocks = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    const { instituteId, username, students }: ContributorReqBody = req.body;
    let usernamesCached = true; // Initial assumption? True.

    const institute = await fetchInstitute(instituteId, null, 1, 1, 0);

    if(!institute.$id){
        return res.status(400).json({
            success: false,
            message: "Institute ID is invalid."
        })
    }

    // Assign blocks to institute if there are none.
    if(institute.blocks.length === 0 && institute.students !== 0){
        const blockRes = await assignBlocksToInstitution(instituteId, institute.students);
        if(!blockRes.success)
            return res.status(500).json({
                success: false,
                message: "Server error"
            });
        usernamesCached = false;
    }

    let alreadyScrapped = institute.scrappedStudents === institute.students;
    if( alreadyScrapped ||
        institute.students === 0
     ){
        // This is bad. Return a proper response code.
        return res.status(409).json({
            success: false,
            message: alreadyScrapped ? 
            "All students have already been scrapped." :
            "This institute does not have any students."
        });
    }

    const contributorsRes = await getInstituteContributors(username, instituteId);
    if(!contributorsRes.success)
        return (res.status(500).json({
            success: false, 
            message: "Server error."
        })
    );

    let contributor: ContributorRow;
    if(contributorsRes.userExists === false){
        const addRes = await addContributor(instituteId, username);
        if(!addRes.success){
            const { code, message } = addRes;
            return res.status(code).json({
                success: false,
                message,
            });
        }
        contributor = addRes.contributor;
    } else {
        contributor = contributorsRes.contributor;
    }
    
    // Institute students are divided into blocks of batches.
    // Assign block to user. A user can scrape one block at a time.
    const allocationResult = await handleAllocatedBlocks(contributor, institute, contributorsRes.expiredContributors);

    if(!allocationResult.success){
        const { code, message } = allocationResult;
        return res.status(code).json({
            success: false,
            code, message
        });
    }

    if(!students || students.length === 0){
        return res.status(200).json({
            success: true,
            page: allocationResult.startingPage,
            batch: STUDENT_BATCH_SIZE,
            block: BLOCK
        })
    }

    res.locals.usernamesCached = usernamesCached;
    res.locals.contributorRowId = contributor.$id;
    res.locals.blockStartingPage = institute.blocks[contributor.assignedBlock+1];
    res.locals.totalStudents = institute.students;
    next();
}

export const verificationAndCaching = async (
    req: Request, 
    res: Response,
    next: NextFunction
) => {
    
    const { instituteId, students } = req.body;

    if(res.locals.usernamesCached === false){
        const cacheRes = await cacheStudentUsernames(instituteId)
        if(!cacheRes.success){
            return res.status(500).json({
                success: false,
                message: "Server error. Caching failed."
            });
        }
    }

    const verificationRes = await verifyStudentNames(
        students, 
        instituteId
    );

    if(!verificationRes.success){
        const { code, message } = verificationRes;
        return res.status(code).json({
            success: false,
            message: message ?? "Invalid batch"
        })
    }

    next();
}

export const handleBatchPublication = async (
    req: Request, 
    res: Response
) => {

    const {
        username,
        instituteId,
        students,
        seconds
    }: {
        username: string,
        instituteId: string,
        students: BatchBody[],
        seconds: number,
    } = req.body;

    const { contributorRowId }= res.locals;
    try{
        let batch: StudentBody[] = prepBatchList(students, instituteId);
        const batchResult = await addStudentsBatch(batch, instituteId);

        if(!batchResult.success){
            throw Error("[contributionController]: Error adding batch");
        }

        const result = await batchUpdateAndExtendLease(
            username, instituteId, seconds, batch.length, contributorRowId
        );

        if(result?.code !== 200){
            if(result?.code === 404){
                res.status(404).json({
                    success: false,
                    message: "Contributor not found."
                });
            }
            else if(result?.code === 500){
                res.status(500).json({
                    success: false
                });
            }
        }

        const instResult = await updateScrappedStudentsCount(instituteId, batch.length);

        if(!instResult.success)
            throw new Error("Server error"); // Handle this properly.

        return res.status(200).json({
                success: true
        });

    } catch (err){
        console.log('[contributionController]: error ', 
            // @ts-ignore
            err?.message ?? err);
        res.status(500).json({
            success: false
        });
    }
}