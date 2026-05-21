import { Request, Response, NextFunction } from "express"

export const initializeFields = (req: Request, res: Response, next: NextFunction) => {
    res.locals.from = {
        middlewares: {},
        controllers: {}
    };
    
    next();
};