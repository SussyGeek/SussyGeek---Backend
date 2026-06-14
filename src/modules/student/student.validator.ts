import { z } from "zod";

const StudentValidator = {
    listFrozenStudents: {
        params: z.object({
            instituteId: z.string()
        })
    },
    listRegularStudents: {
        query: z.object({
            pageNo: z.coerce.number().nonnegative(),
            showCounters: z.coerce.number().optional()
        }),
        params: z.object({
            instituteId: z.string().nonempty()
        })
    },
    listSortedStudents: {
        query: z.object({
            pageNo: z.coerce.number().nonnegative(),
            sortBy: z.enum(['score', 'solved', 'streak']),
            order: z.enum(['asc', 'desc'])
        }),
        params: z.object({
            instituteId: z.string().nonempty()
        })
    },
    listStudentsByUserId: {
        query: z.object({
            studentIds: z.preprocess(
                (val) => (typeof val === "string" ? val.split(",") : val),
                z.array(z.string().nonempty()).min(1).max(10)
            )
        })
    },
    listStudentByFullNameInInstitute: {
        query: z.object({
            name: z.string().min(1),
            instituteId: z.string().min(1)
        })
    }
};

export default StudentValidator;
