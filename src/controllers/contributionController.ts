import { Request, Response } from "express"
import { batchUpdate } from "../lib/actions/contributions.actions";
import { BatchBody, StudentBody } from "../types/body";
import { STUDENT_BATCH_SIZE } from "../data/params";
import { addStudentsBatch } from "../lib/actions/student.actions";
import { prepBatchList } from "../lib/utils";
import { updateScrappedStudentsCount } from "../lib/actions/institution.actions";

export const contributionController = async (req: Request, res: Response) => {

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

    try{

        let batch: StudentBody[] = prepBatchList(students, instituteId);

        const result = await batchUpdate(
            username, instituteId, seconds, batch.length
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

        const batchResult = await addStudentsBatch(batch, STUDENT_BATCH_SIZE);

        if(batchResult.code !== 200){
            throw Error("[contributionController]: Error adding batch");
        }
        
        res.status(200).json({
            success: true
        })

        const countUpdationRes = await updateScrappedStudentsCount(instituteId);
        if(!countUpdationRes.success){
            console.log("Data inconsistency caused. scrappedStudents count not updated!");
        }

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