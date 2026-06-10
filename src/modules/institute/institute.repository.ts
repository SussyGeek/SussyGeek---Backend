import { ID, Models, Operator, Query } from "node-appwrite"
import { appwriteConfig } from "../../database/appwrite/config"
import { database } from "../../database/appwrite/instance"
import { InstituteRow } from "../../types/models/institute"
import { ApiError } from "../../errors/ApiError"


const InstituteRepository = {
    addInstitute: async (data: Partial<InstituteRow>): Promise<InstituteRow> => {
        // TODO: Find a proper return type and introduce that.
        // @ts-ignore
        return await database.createRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: ID.unique(),
            data
        });
    },
    getInstituteById: async (id: string): Promise<InstituteRow> => {
        try {
            return await database.getRow({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.institutionTableId,
                rowId: id,
            });
        } catch (err) {
            throw new ApiError(404, 'Institute non-existant');
        }
    },
    findAvailability: async (id: string): Promise<Partial<InstituteRow>> => {
        try {
            const row = await database.getRow({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.institutionTableId,
                rowId: id,
                queries: [Query.select(['scrappedStudents', 'totalStudents'])]
            });
            return row;
        } catch (err) {
            throw new ApiError(404, 'Institute non-existant');
        }
    },
    getBlocksByInstId: async (id: string): Promise<InstituteRow> => {
        return await database.getRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: id,
            queries: [Query.select(['blocks', 'blocksVersion'])]
        });
    },
    listInstitutes: async (queries: string[]): Promise<Models.RowList<InstituteRow>> => {
        return await database.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            queries: queries,
        });
    },
    updateInstituteStudents: async (id: string, count: number, incr: boolean) => {
        if (incr) {
            return await database.incrementRowColumn({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.institutionTableId,
                rowId: id,
                column: 'students',
                value: count
            });
        } else {
            return await database.decrementRowColumn({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.institutionTableId,
                rowId: id,
                column: 'students',
                value: count
            });
        }
    },
    updateInstituteById: async (id: string, data: Partial<InstituteRow>): Promise<InstituteRow> => {
        return await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: id,
            data,
        });
    },
    updateInstituteBlocks: async (instituteId: string, blocks: number[]): Promise<InstituteRow> => {
        return await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: instituteId,
            data: { blocks }
        });
    },
    updateInstituteBlocksNoRace: async (
        instituteId: string,
        blocks: number[],
        blocksVersion: number
    ): Promise<Models.RowList<InstituteRow>> => {
        return await database.updateRows({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            queries: [
                Query.equal('$id', instituteId),
                Query.equal('blocksVersion', blocksVersion)
            ],
            data: { blocks, blocksVersion: blocksVersion + 1 }
        });
    },
    // TODO: Move the type to a types/
    incrementScoreAndProblemsAndStudents: async (id: string, data: { batchProblems: number, batchScore: number, studentCount: number }) => {
        return await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: id,
            data: {
                scrappedStudents: Operator.increment(data.studentCount),
                score: Operator.increment(data.batchScore),
                problemsSolved: Operator.increment(data.batchProblems)
            }
        });
    },
    updateCounter: async (id: string, counterData: Partial<InstituteRow>) => {
        return await database.updateRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.institutionTableId,
            rowId: id,
            data: {
                score: counterData.score,
                problemsSolved: counterData.problemsSolved
            }
        });
    }
}

export default InstituteRepository;