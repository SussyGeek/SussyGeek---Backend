import { RedisHashObjectType } from "./repo";

export type StudentRedis = {
    username: string,
    name: string,
    score: number,
    solved: number,
    streak: number
};

export type CounterSetObject = {
    solved: RedisHashObjectType[]
    streak: RedisHashObjectType[]
    scores: RedisHashObjectType[]
}

export type CounterDataObject = {
    sets: CounterSetObject,
    total: {
        problemsSolved: number,
        score: number
    }
};

export type serializedStudentData = {
    list: string[],
    set: string[]
};
