import { Request, Response, NextFunction } from "express"
import MetaRepository from "./meta.repository";
import MetaService from "./meta.service";


const MetaController = {
    getCounters: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { field } = req.params;
            const result = await MetaService.getCounter(field);
            return res.json({ success: true, data: result });

        } catch (err) {
            next(err);
        }
    }
}

export default MetaController;