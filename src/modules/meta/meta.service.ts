import { metaFields } from "../../data/meta";
import MetaRepository from "./meta.repository";


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
    incrementAll: async (data: metaFieldTypes) => {
        await MetaRepository.incrementAllFields(data);
        return { success: true };
    }
};

export default MetaService;