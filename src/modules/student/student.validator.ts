import { z } from "zod";

const StudentValidator = {
    getStudentList: {
        params: z.object({
            instituteId: z.string()
        })
    }
};

export default StudentValidator;
