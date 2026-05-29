import { RedisHashObjectType } from "./repo";

export type StudentRedis = {
    username: string,
    name: string,
    score: number,
    solved: number,
    streak: number
};

export type CounterDataObject = {
    sets: {
        solved: RedisHashObjectType[],
        streak: RedisHashObjectType[],
        scores: RedisHashObjectType[]
    },
    total: {
        problemsSolved: number,
        score: number
    }
};