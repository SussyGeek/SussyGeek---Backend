import { Request, Response, NextFunction } from "express";
import { sessionExists } from "../lib/actions/user.actions";


// Future plan:
// 1. Logic separation for first time contributor
// 2. Logic separation for prevention of contribution from unauthorized users.

// This session protection is unused for batch submissions
// sessionId is passed via cookies, not body.
export const protectSession = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    const { sessionId } = req.cookies;
    try{
        const session = await sessionExists('sessionId',sessionId);
        if(typeof(session) !== "boolean")
            throw Error("Server error");
        if(!session)
            return res.status(403).json({
                success: false,
                message: "Unauthorized."
            });
            
            next();
    } catch(err){
        res.status(500).json({
            success: false,
            // @ts-ignore
            message: err?.message ?? "Server error."
        })
    }
}