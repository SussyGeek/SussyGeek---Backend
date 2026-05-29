import { metaFields } from "../../data/meta";
import MetaRepository from "./meta.repository";
import { MetaFieldTypes } from "../../types/repo";

const MetaService = {
    getCounter: async (field: string) => {
        const scoreRow = (field === 'all' ?
            (await MetaRepository.getAllFields()) :
            (await MetaRepository.getField(field))).rows[0];

        const scores = field === 'all' ?
            Object.fromEntries(metaFields.map(f => [f, scoreRow[f]])) :
            { field: scoreRow[field] };

        return scores;
    },
    incrementAll: async (data: MetaFieldTypes) => {
        await MetaRepository.incrementAllFields(data);
        return { success: true };
    },
    incrementDifference: async (data: Omit<MetaFieldTypes, "totalStudents">) => {
        await MetaRepository.incrementDifference(data);
        return { success: true };
    }
};

export default MetaService;