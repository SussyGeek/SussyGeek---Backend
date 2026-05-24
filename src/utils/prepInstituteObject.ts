import { InstituteRow } from "../types/models/institute";
import { AddInstituteSvcType } from "../types/institute";

export const prepInstitutionObject = ({
        name,
        slug,
        registeredGeeks,
        location
}: AddInstituteSvcType
): Partial<Partial<InstituteRow>> => ({
        name,
        slug,
        city: location?.city ?? '',
        state: location?.state ?? '',
        country: location?.country ?? '',
        score: 0,
        students: registeredGeeks ?? 0,
        scrappedStudents: 0,
        status: "Incomplete",
});