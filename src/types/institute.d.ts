import { StudentRow } from "./models/student";
import { RedisHashObjectType } from "./repo";

export type LocationType = {
    city: string,
    state: string,
    country: string
};

export type AddInstituteSvcType = {
    name: string,
    slug: string,
    registeredGeeks: number,
    location: LocationType
}

// TODO: Change once you fix at the validation layer.
export type InstituteFetchQueryTypes = {
    id: string,
    page: string,
    name: string,
    limit: string
    status: string
};

export type InstituteSearchQueryType = {
    name: string,
    limit: string,
    status: string
}

export type ScoreAggreation = {
    rows: Partial<StudentRow>[];
    hashScores: Record<string, string>;
    counterArrays: {
        scoreArr: RedisHashObjectType[];
        streakArr: RedisHashObjectType[];
        solvedArr: RedisHashObjectType[];
    };
    serializedStudentIds: string[];
}