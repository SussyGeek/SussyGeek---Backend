import { Request, Response, NextFunction } from "express";
import StudentService from "./student.service";

const StudentController = {
    getStudentList: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { instituteId } = req.params;
            const students = await StudentService.getOrderedStudentList(instituteId);

            return res.json({
                success: true,
                data: { students }
            });
        } catch (err) {
            next(err);
        }
    }
};

export default StudentController;
