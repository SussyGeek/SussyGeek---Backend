import { Request, Response, NextFunction } from "express"

const UserMiddleware = {
    hasSession: (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers?.authorization;
        const sessionId = authHeader?.split(' ')[1];

        if (!sessionId || sessionId.length !== 20) {
            return res.status(403).json({
                success: false,
                message: "No user logged in."
            });
        }

        res.locals.from.middlewares.hasSession = { sessionId };
        next();
    },
    hasNoSession: (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers?.authorization;
        const sessionId = authHeader?.split(' ')[1];

        if (sessionId) {
            return res.status(409).json({
                success: false,
                message: "You're already logged in."
            });
        }
        next();
    }
};

export default UserMiddleware;