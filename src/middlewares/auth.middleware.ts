import { NextFunction, Request, Response } from "express";
import SessionRepository from "../modules/user/repositories/session.repository";
import { ApiError } from "../errors/ApiError";


export const handleAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const sessionId = authHeader?.split(' ')[1];

        if (!sessionId || sessionId.length !== 20)
            throw new ApiError(403, "Session invalid. Please login.");

        const row = await SessionRepository.getUsernameAndStateBySID(sessionId);

        if (!row)
            throw new ApiError(403, "Invalid session");
        const userRow = row.userId;

        res.locals.from.middlewares.handleAuth = {
            username: userRow.username,
            userState: userRow.state,
            sessionId: sessionId
        }
        next();
    } catch (err) {
        next(err);
    }
}