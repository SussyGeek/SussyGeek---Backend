import { Request, Response, NextFunction } from "express";
import UserService from "./user.service";

const UserController = {
    Login: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username }:
                { username: string } = req.body;

            const session = await UserService.Login(username);

            return res.json({ success: true, sessionId: session.sId });

        } catch (err) {
            next(err);
        }
    },
    Logout: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = res.locals.from.middlewares.hasSession;
            await UserService.Logout(sessionId);

            return res.json({ success: true });
        } catch (err) {
            next(err);
        }
    },
    Me: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = res.locals.from.middlewares.hasSession;
            const userData = await UserService.GetUser(sessionId);

            return res.json(userData);
        } catch (err) {
            next(err);
        }
    },
    SetInactive: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = res.locals.from.middlewares.hasSession;
            const result = await UserService.SetInactive(sessionId);
            return res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default UserController;