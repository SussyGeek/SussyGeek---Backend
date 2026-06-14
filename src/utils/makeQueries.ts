import { Query } from "node-appwrite";

export const makeQueries = (
    name: string,
    limit: number,
    offset: number,
    status: string = 'all'
) => {
    let queries = [];

    if (!name.trim()) {
        queries.push(Query.limit(limit));
        queries.push(Query.offset(offset));
    } else {
        queries.push(Query.contains('name', name));
    }
    
    if (status !== 'all') {
        queries.push(Query.equal('status', status));
    }
    return queries;
}