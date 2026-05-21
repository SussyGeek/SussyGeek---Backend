import { Request, Response, NextFunction } from "express"

const UserMiddleware = {
    hasSession: (req: Request, res: Response, next: NextFunction) => {
        const sessionID = req.cookies?.sessionId;

        if (!sessionID || sessionID.length !== 20) {
            return res.status(403).json({
                success: false,
                message: "No user logged in."
            });
        }
        next();
    },
    hasNoSession: (req: Request, res: Response, next: NextFunction) => {
        const sessionID = req.cookies?.sessionId;

        if (sessionID) {
            return res.status(409).json({
                success: false,
                message: "You're already logged in."
            });
        }
        next();
    }
};

export default UserMiddleware;