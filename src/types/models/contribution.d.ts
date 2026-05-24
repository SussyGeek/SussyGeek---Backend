import { Models } from "node-appwrite";

export interface ContributionRow extends Models.DefaultRow {
    uid: string;
    seconds: number;
    students: number;
    startPage: number;
    username: string;
    instituteId: string;
    assignedBlock: number;
    endPage: number;
    leaseExpiresAt: number;
    lastHeartbeatAt: number;
};