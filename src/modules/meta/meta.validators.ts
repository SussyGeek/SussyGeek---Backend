import { z } from "zod";
import { metaFields } from "../../data/meta";

const fieldTypes = metaFields.concat(['all']);

const MetaValidator = {
    getCounters: {
        params: z.object({
            field: z.enum(fieldTypes)
        })
    }
};

export default MetaValidator;