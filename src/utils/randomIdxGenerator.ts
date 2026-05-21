import { ID_UNASSIGNED } from "../data/params";
import { ApiError } from "../errors/ApiError";
import { ContributionRow } from "../types/models/contribution";


/*
This function has the best case time complexity of O(3) ~ O(1) and same for worst case. [CASE SPECIFIC]
CASE? We only try 3 times and initially the array starts with all values i.e assignedBlock !== ID_UNASSIGNED [i.e -1]

Actual time complexities FYI:
Best case: O(N) - Found at first.
Average case: O(1) - Found after 3-10-15.... whatever.
Worst case: O(N) - N-1 first entires + some overhead are ID_UNASSIGNED, last is or all are.
*/
export const getRandomIdx = (expiredRows: ContributionRow[]) => {
    const vis = new Set();
    const expiredCount = expiredRows.length;
    let visCount = 0;
    while (visCount < expiredCount) {
        const rIdx = Math.floor(Math.random() * expiredCount);
        if (expiredRows[rIdx].assignedBlock !== ID_UNASSIGNED)
            return rIdx;
        if (!vis.has(rIdx)) {
            vis.add(rIdx);
            visCount++;
        }
    }
    throw new ApiError(409, "High contention. Try again later");
}