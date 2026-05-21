import { GfgClient } from "./client";

const GeeksForGeeksAPI = {
    getTotalStudentCount: async (instituteId: string) => {
        const { count } = await GfgClient.get<GFGRes>(`institute/${instituteId}/students/stats?page_size=1&page=1`);
        return count;
    },
    getUsernamesByInstitute: async (instituteId: string, count: number) => {
        const { results } = await GfgClient.get<GFGRes>(`institute/${instituteId}/students/stats?page_size=${count}&page=1`);
        const usernames = results.map(r => r.handle);
        return usernames;
    }
};

export default GeeksForGeeksAPI;