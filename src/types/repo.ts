// Used in institute.repository.ts for redis

type redisHashObjectType = { 
    score: number,
    value: string
};

// unused for now.
type redisStatsObjectType = {
    score: number,
    solved: number,
    streak: number
};

type redisScoresObj = {
    counterArrays: {
        scoreArr: redisHashObjectType[];
        streakArr: redisHashObjectType[];
        solvedArr: redisHashObjectType[];
    },
    hashScores: Record<string, string>
};


// Used in meta.repository.ts

type metaFieldTypes = {
    totalProblems: number,
    totalScore: number,
    totalStudents: number
};