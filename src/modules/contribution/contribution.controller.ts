import { Request, Response, NextFunction } from "express";
import ContributionService from "./contribution.service";
import { ContributionBody } from "../../types/contribution";
import { BLOCK, STUDENT_BATCH_SIZE } from "../../data/params";

const ContributionController = {
    getUserAndInstContributions: async (req: Request, res: Response, next: NextFunction) => {
        // NOTE: The username contributions are all
        // ACTIVE scrapper instances/sessions.
        try {
            const { instituteId, username } = req.params;
            const data = await ContributionService.getInstituteAndUserContributions(
                username,
                instituteId
            );

            return res.json({
                success: true,
                message: "Fetched",
                data,
            });
        } catch (err) {
            next(err);
        }
    },
    getUserContributions: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username } = req.params;
            const data = await ContributionService.getUserContributions(
                username,
            );

            return res.json({
                success: true,
                message: "Fetched",
                data,
            });
        } catch (err) {
            next(err);
        }
    },
    getInstituteContributions: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { instituteId } = req.params;
            const data = await ContributionService.getInstituteContributions(
                instituteId,
            );

            return res.json({
                success: true,
                message: "Fetched",
                data,
            });
        } catch (err) {
            next(err);
        }
    },
    handleContributions: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username } = res.locals.from.middlewares.handleAuth;
            const {
                instituteId,
                students,  // TODO: Adjust type for this later.
                seconds
            }: ContributionBody = req.body;

            const conRes = await ContributionService.handleContribution(username, instituteId, students);

            res.locals.from.controllers.handleContributions = {
                contributor: conRes.contributor,
                contributorRowId: conRes.contributor.$id,
                instituteContributions: conRes.instituteContributions.filter(
                    row => row.username !== username
                ),
                blockStartingPage: conRes.startingPage,
                blockEndingPage: conRes.endingPage,
                totalStudents: conRes.institute.scrappedStudents,
                blocks: conRes.blocks,
                assignedBlock: conRes.assignedBlock,
                studentBatch: students,
                institute: conRes.institute,
                seconds
            };

            if (students.length === 0) {
                // TODO: Rename these to enhance semantic relevancy.
                return res.json({
                    success: true,
                    data: {
                        startingPage: conRes.startingPage,
                        endingPage: conRes.endingPage,
                        batchSize: STUDENT_BATCH_SIZE,
                        assignedBlockId: conRes.assignedBlock,
                        blockSize: BLOCK,
                        blocks: conRes.blocks,
                        instituteScrappedCount: conRes.institute.scrappedStudents,
                        instituteContributions: res.locals.from.controllers.handleContributions.instituteContributions,
                        userInstituteContribution: conRes.instituteContributions.find(
                            row => row.username === username
                        )
                    }
                });
            }

            next();

        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    handleBatchPublication: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = res.locals.from.controllers.handleContributions;

            const result = await ContributionService.handleBatchPublication(
                data.contributor.username,
                data.institute,
                data.studentBatch,
                data.blockStartingPage,
                data.seconds,
                data.assignedBlock,
                data.contributor
            );

            return res.json({
                success: true,
                data: {
                    ...result,
                    instituteContributions: data.instituteContributions
                }
            });
        } catch (err) {
            next(err);
        }
    },
    stopContribution: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { instituteId } = req.params;
            const { username, sessionId } = res.locals.from.middlewares.handleAuth;

            const result = await ContributionService.stopContribution(
                username,
                instituteId,
                sessionId
            );

            return res.json(result);
        } catch (err) {
            next(err);
        }
    }
};

export default ContributionController;