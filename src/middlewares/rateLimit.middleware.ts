import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors/ApiError";
import type { RateLimitConfig } from "../config/ratelimit";

export const rateLimits = new Map<string, number[]>();
export const rateLimitByIP = new Map<string, number[]>();

export function rateLimit({
    maxRequests,
    windowMs,
    strategy = "non-user"
}: RateLimitConfig) {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const userId = res.locals?.from?.middlewares?.handleAuth?.userId;

        const key = userId
            ? `user:${userId}`
            : `ip:${req.ip}`;

        const now = Date.now();

        let timestamps = strategy === "user" ?
            rateLimits.get(key) ?? [] :
            rateLimitByIP.get(key) ?? [];

        timestamps = timestamps.filter(
            timestamp => now - timestamp < windowMs
        );

        if (timestamps.length === 0) {
            if (strategy === "user")
                rateLimits.delete(key);
            else
                rateLimitByIP.delete(key);
        }

        if (timestamps.length >= maxRequests) {
            const retryAfter =
                windowMs - (now - timestamps[0]);

            res.setHeader(
                "Retry-After",
                Math.ceil(retryAfter / 1000)
            );

            throw new ApiError(
                429,
                "Too many requests. Try again later."
            );
        }

        timestamps.push(now);
        if (strategy === "user")
            rateLimits.set(key, timestamps);
        else
            rateLimitByIP.set(key, timestamps);

        next();
    };
}