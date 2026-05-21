import dotenv from "dotenv";
dotenv.config();

export const redisConfig = {
    secretUrl: process.env.UPSTASH_REDIS_URL
};

