import { Models } from "node-appwrite";
import { ContributionRow } from "./contribution"
import { SessionRow } from "./session"

export interface UserRow extends Models.DefaultRow {
    username: string,
    sessionId: string | SessionRow | undefined,
    state: string
    contributions: ContributionRow[] | undefined
};