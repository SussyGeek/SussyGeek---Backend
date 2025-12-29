import { database } from "../lib/appwrite/instance";
import { createUsername, createSession, revokeSession, getUsername } from "../lib/actions/user.actions";
import {Request, Response} from "express";

export const Login = async (req: Request, res: Response) => {

    const username = req?.body?.username;
    const { sessionId } = req.cookies;
    
    try {
        if(!username || username.length > 24) {
            return res.status(400).json({
                success: false,
            }); 
        }

        if(sessionId && sessionId.length === 64){
            return res.status(401).json({
                success: false,
                message: "Existing session found."
            });

        }

        const user = await createUsername(username);
        if(!(user?.success)) {
            return res.
            status(user.code).
            json({
                success: false,
                message: user?.message
            });
        }
        
        const session = await createSession(user?.uid);
        if(!(session?.success)){
            return res.
            status(session.code).
            json({
                success: false,
                message: session?.message
            });
        }

        return res.cookie("sessionId", session.sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in production, false in dev
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: "/",
            maxAge: 1000 * 60 * 60 * 24 * 90
        }).status(200).json({ success: true });

        
    } catch (err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        })
    }
}

export const GetUser = async (req: Request, res: Response) => {
    const { sessionId } = req.cookies;
    try{
        if(!sessionId?.trim() || sessionId?.length !== 64){
            return res.status(400).json({
                success: false,
                message: "No user logged in."
            });
        }

        const query = await getUsername(sessionId);
        const username = query.user;

        return res.status(200).json({
            success: true,
            user: username
        });

    } catch (err){
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

export const Logout = async (req: Request, res: Response) => {
    const { sessionId } = req.cookies;

    try {
        if(!sessionId || sessionId.length < 64) {
            return res.status(400).json({
                success: false,
            })
        }
        
        const session = await revokeSession(sessionId);
        if(!session.success){
            return res.status(500).json(session);
        }

        res.clearCookie("sessionId", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in production, false in dev
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: "/"
        });

        return res.status(200).json({
            success: true
        });
    } catch (err){
        return res.status(500).json({
            success: false
        });
    }
}