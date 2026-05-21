import { Models } from "node-appwrite"

export type AppwriteRes<T> = {
  total: number,
  Row: T[]
};

export interface Student {
  $id: string,
  name: string,
  username: string,
  solved: number,
  score: number,
  streak: number,
  rank: number,
  instituteId: string,
  contestRating: number,
  difficultySolved: number[] | null,
  $createdAt: string,
  $updatedAt: string
}

export interface Institution {
  $id: string,
  name: string,
  slug: string,
  city: string | null,
  state: string | null,
  country: string | null,
  score: number,
  students: number,
  scrappedStudents: number,
  problemsSolved: number,
  status: "Complete" | "Incomplete" | "Scrapping",
  blocks: number[],
  blocksVersion: number,
  $createdAt?: string,
  $updatedAt?: string
}

export interface ContributorRow extends Models.DefaultRow {
  $id: string;
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
  $createdAt?: string; // ISO datetime
  $updatedAt?: string; // ISO datetime
}