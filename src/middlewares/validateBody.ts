import { NextFunction, Request, Response } from "express"
import { BatchBody } from "../types/body";
import { STUDENT_BATCH_SIZE } from "../data/params";
import { batchDict } from "../data/meta";
import { cacheStudentUsernames, verifyStudentNames } from "../lib/actions/student.actions";

export const bodyValidation = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if( typeof(req.body) !== "object" )
        return res.status(400);
    next();
}

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
        seconds 
        }:{
        username:string,
        instituteId: string,
        students: BatchBody[],
        seconds: number
    } = body;


    if (
        typeof username !== "string" ||
        typeof instituteId !== "string" ||
        !Array.isArray(students) ||
        typeof seconds !== "number"
    ) {
        return res.status(400).json({
            success: false
        });
    }

    if (
        students?.length !== STUDENT_BATCH_SIZE ||
        seconds <= 0 ||
        !Number.isFinite(seconds)
    ) {
        return res.status(400).json({
            success: false,
            message: "List smaller than batch size"
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


    // Type checking is uselessly explicit to avoid undefined / null states.
    // In the future. Deal with this differently.
    if(req.body.usernamesCached === false){
        console.log("Cached students");
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
};