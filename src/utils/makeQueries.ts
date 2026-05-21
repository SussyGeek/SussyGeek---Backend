import { Query } from "node-appwrite";

export const makeQueries = (
    name: string,
    limit: number,
    offset: number
) => {
    let queries = [];

    if (!name.trim()) {
        queries.push(Query.limit(limit));
        queries.push(Query.offset(offset));
    } else {
        queries.push(Query.contains('name', name));
    }
    return queries;
}