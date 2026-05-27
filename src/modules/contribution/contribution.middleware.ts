import { ID_UNASSIGNED, STUDENT_BATCH_SIZE } from "../../data/params";
import { ApiError } from "../../errors/ApiError";
import StudentService from "../student/student.service";
import ContributionService from "./contribution.service";
import { Request, Response, NextFunction } from "express";

const ContributionMiddlewares = {
    preventMultiple: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = res.locals.from.middlewares.handleAuth;
            const { instituteId } = req.body;

            const contributions = (await ContributionService.getUserContributions(userId)).instituteContributions;

            if (contributions.length > 0) {
                contributions.forEach(c => {
                    if (c.instituteId !== instituteId && c.assignedBlock !== ID_UNASSIGNED)
                        throw new ApiError(403, "Existing scrapping instance is active.");

                    // TODO: Identify if this passed data is used elsewhere and remove if not.
                    if (c.assignedBlock !== ID_UNASSIGNED && c.instituteId === instituteId) {
                        res.locals.from.middlewares.userContributionId = c.$id;
                    }
                });
            }

            next();
        } catch (err) {
            next(err);
        }
    },
    validateBatch: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { students } = req.body

            const { blockStartingPage, institute } = res.locals.from.controllers.handleContributions;
            const totalStudents = institute.totalStudents;

            const BATCH_REMAINDER = totalStudents % STUDENT_BATCH_SIZE;

            const isFullBatch = students.length === STUDENT_BATCH_SIZE;
            const isLastBatch =
                BATCH_REMAINDER !== 0 &&
                (students.length === BATCH_REMAINDER); // &&
            // ((blockStartingPage - 1) + students.length === totalStudents) && [This check will cause bugs if the last batch doesn't complete scrapped students and someone's claimed batch is simultaneously pending]


            if (!isFullBatch && !isLastBatch)
                throw new ApiError(400, "Batch malformed");

            const isBatchValid = await StudentService.isBatchValid(institute.$id, students);

            if (!isBatchValid)
                throw new ApiError(400, "Invalid student list provided.");

            const isSomeStudentRepeat = await StudentService.isSomeStudentRepeated(institute.$id, students);

            if (isSomeStudentRepeat)
                throw new ApiError(409, "Batch rejected due to duplicate students.");

            next();
        } catch (err) {
            next(err);
        }
    }
};

export default ContributionMiddlewares;