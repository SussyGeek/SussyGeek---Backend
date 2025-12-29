import { Request, Response, NextFunction } from "express";
import { addContributor } from "../lib/actions/contributions.actions";
import { updateActiveScrapper } from "../lib/actions/institution.actions";
import { fetchInstitute } from "../lib/actions/institution.actions";
import { BatchBody } from "../types/body";


// Future plan:
// 1. Logic separation for first time contributor
// 2. Logic separation for prevention of contribution from unauthorized users.
export const scrapperAuthentication = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    const { 
        instituteId,
        username,
        students
     }:
    { 
        instituteId: string, 
        username: string,
        students?: BatchBody[]
     } = req.body;
    const { sessionId } = req.cookies;
    let firstTime = false;

    req.body.usernamesCached = true;

    // This could be wrong. The username length limit
    if((!sessionId || sessionId.length !== 64) || !username || username.length > 18){ 
        return res.status(403).json({
            success: false
        });
    }
    
    if(typeof(instituteId) !== "string")
        return res.status(400).json({
            success: false,
            message: "Incorrect institute ID type"
        });

    const institute = await fetchInstitute(instituteId, null, 1, 1, 0);

    if(!institute.$id){
        return res.status(400).json({
            success: false,
            message: "Institute ID is invalid."
        })
    }

    // Check to establish caching requirement in next call.
    if(institute.scrappedStudents === 0)
        req.body.usernamesCached = false;
    
    const currentTime = Math.floor(Date.now()/1000);

    if(institute.activeScrapper && username !== institute.activeScrapper){
            // Only forbids if institute still under lease.
            if(currentTime <= institute.leaseExpiresAt){
                return res.status(403).json({
                    success: false
                })
            }
    }

    // Introduce new contributor if non exists / current lease expires.
    if( !institute.activeScrapper || (institute.leaseExpiresAt && currentTime > institute.leaseExpiresAt)) {

        const notCurrentUser = institute.activeScrapper && institute.activeScrapper !== username;
        const activeScrapperNull = !institute.activeScrapper;

        // Logic, two above cases to prevent third case: username === activeScrapper, as a contributor already exists in that case.
        if(notCurrentUser || activeScrapperNull){

            const result = await addContributor(
                instituteId, 
                username, 
                institute.scrappedStudents
            );

            if(!result.success){
                return res.status(500).json({
                    success: false
                });
            }
            firstTime = true; // A new contributor has been added.
        }
       
        const instituteResult = await updateActiveScrapper(
            username,
            instituteId,
            currentTime
        );

        if(!instituteResult.success){
            return res.status(500).json({
                success: false
            });
        }

        // This is deliberately not invokved for now. Frontend calls 
        // are worked in such way that initial student list is always provided.
        if((!students || students?.length === 0) && !firstTime){
            return res.status(200).json({
                success: true,
                message: "Contributor network joined"
            });
        }
    }

    next(); // Handle batch to next controller.
}



