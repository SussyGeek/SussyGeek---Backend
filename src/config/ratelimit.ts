type RateLimitStrategy = "user" | "non-user";

export type RateLimitConfig = {
    maxRequests: number;
    windowMs: number;
    strategy: RateLimitStrategy;
};

export const RATE_LIMITS = {
    CONTRIBUTION_BATCH: { maxRequests: 3, windowMs: 10_000, strategy: "user" },
    CONTRIBUTION_READ: { maxRequests: 5, windowMs: 10_000, strategy: "user" },
    CONTRIBUTION_STOP: { maxRequests: 2, windowMs: 10_000, strategy: "user" },
    AUTH_LOGIN: { maxRequests: 3, windowMs: 60_000, strategy: "non-user" },
    DATA_FETCH: { maxRequests: 5, windowMs: 3_000, strategy: "user" },
    META_COUNTERS: { maxRequests: 5, windowMs: 3_000, strategy: "non-user" },
    DEV_MUTATION: { maxRequests: 2, windowMs: 30_000, strategy: "non-user" },
    HANDLE_AUTH: { maxRequests: 3, windowMs: 120_000, strategy: "user" }
} as const satisfies Record<string, RateLimitConfig>;
