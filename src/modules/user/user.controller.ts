import { Request, Response, NextFunction } from "express";
import UserService from "./user.service";
import { removeCookiesFn, setCookiesFn } from "../../utils/manageCookies";

const UserController = {
    Login: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username }:
                { username: string } = req.body;

            const session = await UserService.Login(username);
            res.locals.cookieKey = 'sessionId';
            res.locals.cookieVal = session.sId;

            setCookiesFn(req, res);

            return res.json({ success: true });

        } catch (err) {
            next(err);
        }
    },
    Logout: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.cookies;
            await UserService.Logout(sessionId);
            res.locals.cookieKey = 'sessionId';

            removeCookiesFn(req, res);

            return res.json({ success: true });
        } catch (err) {
            next(err);
        }
    },
    Me: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.cookies;
            const userData = await UserService.GetUser(sessionId);

            return res.json(userData);
        } catch (err) {
            next(err);
        }
    },
    SetInactive: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.cookies;
            const result = await UserService.SetInactive(sessionId);
            return res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default UserController;