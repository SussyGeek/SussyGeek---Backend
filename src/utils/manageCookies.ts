import { Response, Request } from "express"

export const setCookiesFn = (req: Request, res: Response) => {
    res.cookie(res.locals.cookieKey, res.locals.cookieVal, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true in production, false in dev
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 90
    });
    return;
};

export const removeCookiesFn = (req: Request, res: Response) => {
    res.clearCookie(res.locals.cookieKey, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true in production, false in dev
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: "/"
    });
    return;
};