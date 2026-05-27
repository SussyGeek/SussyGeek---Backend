import { Models } from "node-appwrite";

export interface StudentRow extends Models.DefaultRow {
    name: string,
    username: string,
    instituteId: string,
    branch?: string | null,
}