import { Models } from "node-appwrite";
import { UserRow } from "./user";

export interface SessionRow extends Models.DefaultRow {
    userId: string | UserRow
};