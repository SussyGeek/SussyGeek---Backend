export const RATE_LIMITS = {
    STUDENT_STATS: {
        maxRequests: 2,
        windowMs: 3 * 60 * 1000,
    },
    FAST_ENDPOINT: {
        maxRequests: 2,
        windowMs: 6 * 1000,
    },
    CONTRIBUTION_ENDPOINT: {
        maxRequests: 2,
        windowMs: 6 * 1000,
    }
} as const;