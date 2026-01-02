import { NextFunction, Request, Response } from "express"
import { BatchBody, ContributorReqBody } from "../types/body";
import { STUDENT_BATCH_SIZE } from "../data/params";
import { batchDict } from "../data/meta";

// typical body validation.
export const bodyValidation = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if( typeof(req.body) !== "object" )
        return res.status(400);
    next();
}

// Validation for when a contributor sends a batch.
export const contributorBodyValidation = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if( typeof(req.body) !== "object" )
        return res.status(400);

    const { 
            instituteId, 
            username, 
            students 
        }: ContributorReqBody = req.body;

    const { sessionId } = req.cookies;
    
    if((!sessionId || sessionId.length !== 64) || !username?.trim() || username.length > 24){ 
        return res.status(403).json({
            success: false
        });
    }

    if(typeof(instituteId) !== "string"){
        return res.status(400).json({
            success: false,
            message: "Incorrect institute ID type"
        });
    }

    next();

}

// Validation for adding of an institute.
export const validateInstitutionInput = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const {
        name,
        slug,
        studentCount,
        city,
        country,
        state
    } = req.body;
    
    if (
        !name?.trim() ||
        !slug?.trim() ||
        studentCount == null ||
        !city?.trim() ||
        !state?.trim() ||
        !country?.trim()
    ) {
        return res.status(400).json({ 
            success: false,
            error: "Missing required fields" // helpful error message
        });
    }
    
    next();
};


export const validateBatchInput = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const body = req.body;

    if (!body || typeof body !== "object") {
        return res.status(400).json({
            success: false,
            message: "Body is not object."
        });
    }

    const { 
            username,
            instituteId,
            students,
            seconds,
        }:{
            username:string,
            instituteId: string,
            students: BatchBody[],
            seconds: number,
        } = body;

    const { blockStartingPage, totalStudents } = res.locals;

    if (
        typeof username !== "string" ||
        typeof instituteId !== "string" ||
        !Array.isArray(students) ||
        typeof seconds !== "number" //|| 
        //typeof totalStudents !== "number" ||
        //typeof offset !== "number"
    ) {
        return res.status(400).json({
            success: false
        });
    }
    const BATCH_REMAINDER = totalStudents%STUDENT_BATCH_SIZE;

    const BATCH_COUNT_INVALID = (students?.length !== STUDENT_BATCH_SIZE && 
        ((blockStartingPage+students.length) !== totalStudents && students.length !== BATCH_REMAINDER)
    );

    if (
        BATCH_COUNT_INVALID || 
        seconds <= 0 ||
        !Number.isFinite(seconds)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid batch size."
        });
    }

    // PENDING: Seconds check to determine interval validity.

    const requiredKeys = Object.keys(batchDict);

    for (const student of students) {
        if (!student || typeof student !== "object") {
            return res.status(400).json({
                success: false,
                message: "Student list malformed."
            });
        }

        // fields used in transformation
        for (const key of requiredKeys) {
            if (!(key in student)) {
                return res.status(400).json({
                    success: false,
                    message: `Student list missing ${key} field.`
                });
            }
        }

        if ( typeof student.scrapedAt !== "string" ) {
            return res.status(400).json({
                success: false,
                message: "Invalid student metadata"
            });
        }
    }

    next();
};