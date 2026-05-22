// Used in institute.repository.ts for redis

export type redisHashObjectType = { 
    score: number,
    value: string
};

// unused for now.
export type redisStatsObjectType = {
    score: number,
    solved: number,
    streak: number
};

export type redisScoresObj = {
    counterArrays: {
        scoreArr: redisHashObjectType[];
        streakArr: redisHashObjectType[];
        solvedArr: redisHashObjectType[];
    },
    hashScores: Record<string, string>
};


// Used in meta.repository.ts

export type metaFieldTypes = {
    totalProblems: number,
    totalScore: number,
    totalStudents: number
};