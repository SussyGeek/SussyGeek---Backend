import { GfgClient } from "./client";
import { GFGRes } from "../types/gfg_api";

const GeeksForGeeksAPI = {
    getTotalStudentCount: async (instituteId: string) => {
        const { count } = await GfgClient.get<GFGRes>(`institute/${instituteId}/students/stats?page_size=1&page=1`);
        return count;
    },
    getStudentsByInstitute: async (instituteId: string, count: number) => {
        const { results } = await GfgClient.get<GFGRes>(`institute/${instituteId}/students/stats?page_size=${count}&page=1`);
        return results;
    }
};

export default GeeksForGeeksAPI;