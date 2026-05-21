import { createClient } from "redis";
import { redisConfig } from "./config";

const redis = createClient({
  url: redisConfig.secretUrl
});

redis.on("error", (err) => {
    console.error("Redis error:", err);
});

let connected = false;

export async function getRedis() {
    if (!connected) {
      await redis.connect();
      console.log("connected");
      connected = true;
    }
    return redis;
}

const shutdown = async (signal: string) => {
  console.log(`Shutting down on ${signal}`);
  if (redis.isOpen) {
    await redis.quit();
  }
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);