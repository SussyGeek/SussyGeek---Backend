import { InstitutionBody } from "../types/body";
import { fetchInstitute, pushInstitute, updateTotalStudentCount } from "../lib/actions/institution.actions";
import type { Response, Request } from "express";
import { appwriteConfig } from "../lib/appwrite/config";


export const addInstitute = async (
    req: Request, 
    res: Response
) => {
        const {
        name,
        slug,
        studentCount,
        city,
        country,
        state } = req.body as unknown as InstitutionBody; // This might not be the way. Fix it later.
        
        const location = {
            city,
            state,
            country
        };

        await pushInstitute(
            name,
            slug,
            studentCount,
            location
        );

        res.status(200).json({success: true});
    
}

/*
Kaam chalau API. Pending tasks.
Filter by:

1. Location -
City,
State,
Country

2. Sort by
Registered students
Score
*/

export const updateStudentCount = async (
    req: Request, 
    res: Response
) =>{
    const { instituteId }:{ 
        instituteId: string 
    } = req.body;

    try{
        const result = await updateTotalStudentCount(instituteId);
        const { code, message, success } = result;
        return res.status(code).json({
            success,
            message
        });
    } catch(err){
        // @ts-ignore
        const message = err?.message ?? "Server error";
        console.log("[Institution Controller: updateStudentCount] ", message);
        return res.status(500).json({
            success: false,
            message
        });
    }
}

export const getInstitute = async (req: Request, res: Response) => {
    
    const id = req.query.id as string || null; 
    const page = parseInt(req.query.page as string, 10) || 1;
    const name = (req.query.name as string) || '';
    const limit = parseInt(req.query.limit as string, 10) || 16; 
    const offset = (page - 1) * limit;
    
    try{
        const response = await fetchInstitute(id, name, page, limit, offset);

        res.status(200).json({
            success: true, 
            data: response
        });
    } catch(err){
        res.status(500).json({
            success: false,
            err: err
        });
    }
}
