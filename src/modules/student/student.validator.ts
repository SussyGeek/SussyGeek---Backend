import { z } from "zod";

const StudentValidator = {
    listFrozenStudents: {
        params: z.object({
            instituteId: z.string()
        })
    },
    listRegularStudents: {
        query: z.object({
            pageNo: z.coerce.number().nonnegative()
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
    }
};

export default StudentValidator;
