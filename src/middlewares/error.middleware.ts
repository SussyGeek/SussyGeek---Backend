import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/ApiError";


function ErrorHandler(
    err: ApiError | Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            details: err.details,
        });
    }

    console.error('[Unhandled Error]', err);
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'production' 
            ? undefined 
            : (err instanceof Error ? err.message : String(err)),
    });
}

export default ErrorHandler;