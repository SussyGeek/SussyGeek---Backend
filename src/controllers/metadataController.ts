import { InstitutionBody } from "../types/body";
import { fetchInstitute, pushInstitute } from "../lib/actions/institution.actions";
import type { Response, Request } from "express";
import { appwriteConfig } from "../lib/appwrite/config";
import { metaEntires } from "../data/meta";
import { getMetaCounts } from "../lib/actions/meta.actions";
import { database } from "../lib/appwrite/instance";
import { Models } from "node-appwrite";


export const getCounter = async (
    req: Request, 
    res: Response
) => {
    const { field } = req.params;

    try{
        if (field && !metaEntires.includes(field.toLowerCase()))
            return res.status(400).json({ success: false, message: "Invalid input" });
        const response = await getMetaCounts(field ?? null);

        if (!response.success)
            return res.status(500).json({ success: false, message: response?.message });

        res.status(200).json(response);
    } catch (err){
        console.log("Meta data count fetch err", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

