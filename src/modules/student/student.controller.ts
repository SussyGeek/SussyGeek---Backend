import { Request, Response, NextFunction } from "express";
import StudentService from "./student.service";

const StudentController = {
    listFrozenStudents: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { instituteId } = req.params;
            const result = await StudentService.listFrozenStudents(instituteId);

            return res.json(result);
        } catch (err) {
            next(err);
        }
    },
    listRegularStudents: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO: This is temporary solution for ts. Find better
            const { pageNo } = req.query as unknown as { pageNo: number };
            const { instituteId } = req.params;

            const result = await StudentService.listRegularStudents(instituteId, pageNo, 10);

            return res.json(result);
        } catch (err) {
            next(err);
        }
    },
    listStudentsByUserIds: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { studentIds } = req.query as unknown as { studentIds: string[] };

            const result = await StudentService.listStudentsByUserIds(studentIds);

            return res.json(result);
        } catch (err) {
            next(err);
        }
    },
    listStudentByFullnameInInstitute: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, instituteId } = req.query as unknown as { name: string, instituteId: string };
            const result = await StudentService.listStudentsByFullNameInInstitute(
                name, instituteId
            );
            return res.json(result);
        } catch (err) {
            next(err);
        }
    }
};

export default StudentController;
