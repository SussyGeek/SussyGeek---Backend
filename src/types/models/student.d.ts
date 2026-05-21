import { Models } from "node-appwrite";

export interface StudentRow extends Models.DefaultRow {
    $id: string,
    name: string,
    username: string,
    instituteId: string,
    branch?: string | null,
    $createdAt: string,
    $updatedAt: string
}