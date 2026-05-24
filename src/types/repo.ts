// Used in institute.repository.ts for redis

export type RedisHashObjectType = { 
    score: number,
    value: string
};

// unused for now.
export type RedisStatsObjectType = {
    score: number,
    solved: number,
    streak: number
};

export type RedisScoresObj = {
    counterArrays: {
        scoreArr: RedisHashObjectType[];
        streakArr: RedisHashObjectType[];
        solvedArr: RedisHashObjectType[];
    },
    hashScores: Record<string, string>
};


// Used in meta.repository.ts

export type MetaFieldTypes = {
    totalProblems: number,
    totalScore: number,
    totalStudents: number
};