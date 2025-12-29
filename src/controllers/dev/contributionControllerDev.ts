import { Request, Response } from "express"
import { database } from "../../lib/appwrite/instance";
import { appwriteConfig } from "../../lib/appwrite/config";

export const resetActiveScrapper = async (
    req: Request,
    res: Response,
) => {
    try{
        if(!req.body) throw Error("No request body attached");
        if(!req.body.instituteId) throw Error("No institute ID attached");

        const {instituteId} = req.body;

        const updation = await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: instituteId,
            data: {
                activeScrapper: null,
                leaseExpiresAt: null,
                lastHeartbeatAt: null,

            }
        });

        if(updation.$id)
            res.status(200).json({
                success: true
        });

    } catch(err){
        console.log("[DEV: resetActiveScrapper]: Error resetting active scrapper: ",
            // @ts-ignore
            err?.message ?? err
        );
        res.status(400).json({
            // @ts-ignore
            msg: err?.message ?? err
        })
    }
}