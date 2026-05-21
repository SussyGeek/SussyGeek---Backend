import { z } from "zod";

export const BatchBodySchema = z.object({
    id: z.string(),
    username: z.string().max(120, "Username exceeds allowed length"),
    fullName: z.string().max(120, "Full name exceeds allowed length"),
    institution: z.string().optional(), // This isn't required for now.
    codingScore: z.number(),
    problemsSolved: z.number(),
    instituteRank: z.number(),
    streak: z.number().optional(),
    longestStreak: z.number(),
    scrapedAt: z.string(),
});


const ContributionValidator = {
    getInstituteContributions: {
        params: z.object({
            instituteId: z.string()
        })
    },
    stopContrubtion: {
        params: z.object({
            instituteId: z.string()
        })
    },
    getUserContributions: {
        params: z.object({
            username: z.string().max(24)
        })
    },
    getUserAndInstContributions: {
        params: z.object({
            instituteId: z.string(),
            username: z.string().max(24)
        })
    },
    batchInput: {
        body: z.object({
            instituteId: z.string(),
            students: z.array(BatchBodySchema).default([]),
            seconds: z.number().nonnegative()
        })
    }
};

export default ContributionValidator;