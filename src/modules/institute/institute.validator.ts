import { z } from "zod";

export const InstituteValidator = {
    addInstitute: {
        body: z.object({
            name: z.string(),
            slug: z.string(),
            studentCount: z.number(),
            city: z.string(),
            country: z.string(),
            state: z.string()
        }),
    },
    getInstitute: {
        query: z.object({
            id: z.string().optional().default(''),
            page: z.string().optional().default('1'),
            name: z.string().optional().default(''),
            limit: z.string().optional().default('16'),
        })
    },
    updateTotalStudents: {
        params: z.object({
            id: z.string().nonoptional()
        })
    },
    findAvailability: {
        params: z.object({
            instituteId: z.string()
                .nonoptional()
                .refine(id => id !== "undefined", "Invalid institute id.")
        })
    }
}