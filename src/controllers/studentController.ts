import { Request, Response } from "express"
import { StudentBody } from "../types/body";


// This is incomplete logic. Deprecated
// Previous plan? Add ability to manually add yourself. VERY INSENSIBLE.
const addStudents = (req: Request, res: Response) => {
    const { 
        students, 
        limit 
    }: { 
        students: StudentBody[], 
        limit: number 
    } = req.body;

    

    if(students.length != limit ){
        res.status(400).json({
            success: false
        });
    }

    try {
        
    } catch(err){
        console.log("[CONTROLLER]: Error with adding students",
            // @ts-ignore
            err?.message ?? err
        )
    }
}