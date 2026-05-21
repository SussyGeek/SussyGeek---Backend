import { Models } from "node-appwrite"

export interface InstituteRow extends Models.DefaultRow {
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
}