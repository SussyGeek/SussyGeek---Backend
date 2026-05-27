import { Models } from "node-appwrite";
import { InstituteRow } from "./institute";

export interface ContributionRow extends Models.DefaultRow {
    uid: string;
    seconds: number;
    students: number;
    startPage: number;
    username: string;
    institute: string | InstituteRow | undefined;
    assignedBlock: number;
    endPage: number;
    leaseExpiresAt: number;
    lastHeartbeatAt: number;
};