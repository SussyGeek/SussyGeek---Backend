import { Request, Response, NextFunction } from "express";
import InstituteService from "./institute.service";
import { InstitutionBody } from "../../types/body";
import { InstituteFetchQueryTypes, InstituteSearchQueryType } from "../../types/institute";

const instituteController = {
    addInstitute: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                name,
                slug,
                studentCount,
                city,
                country,
                state
            }: InstitutionBody = req.body;

            await InstituteService.addInstitute({
                name,
                slug,
                registeredGeeks: studentCount,
                location: { city, country, state }
            });

            return res.json({
                success: true
            });

        } catch (err) {
            next(err);
        }
    },
    getInstitute: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                id,
                page,
                name,
                limit,
                status
            } = req.query as InstituteFetchQueryTypes
            // @ts-ignore TODO: Handle this at validation layer.
            const pageInt = parseInt(page as string, 10);
            // @ts-ignore. TODO: Fix this TS error.
            const limitInt = parseInt(limit as string, 10);
            const offset = (pageInt - 1) * limitInt;
            const institutes = await InstituteService.getInstitute(
                id, name, pageInt, limitInt, offset, true, status
            );

            return res.json({
                success: true,
                message: "Fetched",
                data: institutes.rows
            });
        } catch (err) {
            next(err);
        }
    },
    searchInstitutes: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, limit, status } = req.query as InstituteSearchQueryType;
            const limitInt = parseInt(limit, 10);
            const institutes = await InstituteService.searchInstitutes(name, limitInt, status);

            return res.json({
                success: true,
                message: "Fetched",
                data: institutes.rows
            });
        } catch (err) {
            next(err);
        }
    },
    findAvailabilityById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { instituteId } = req.params as unknown as { instituteId: string };
            console.log(instituteId);
            const data = await InstituteService.findAvailabilityById(instituteId);
            return res.json({
                success: true,
                data: { availability: data }
            });
        } catch (err) {
            next(err);
        }
    },
    updateStudentCount: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await InstituteService.updateTotalStudents(id);
            return res.json(result);
        } catch (err) {
            next(err);
        }
    }
};

export default instituteController;