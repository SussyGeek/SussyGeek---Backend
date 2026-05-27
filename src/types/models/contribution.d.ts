import { Models } from "node-appwrite";
import { UserRow } from "./user";

export interface ContributionRow extends Models.DefaultRow {
    seconds: number;
    students: number;
    instituteId: string;
    user: string | UserRow | undefined;
    assignedBlock: number;
    leaseExpiresAt: number;
    lastHeartbeatAt: number;
};