import { Models } from "node-appwrite"

export type InstituteRow = {
  name: string,
  slug: string,
  city: string | null,
  state: string | null,
  country: string | null,
  score: number,
  totalStudents: number,
  scrappedStudents: number,
  problemsSolved: number,
  status: "Complete" | "Incomplete" | "Scrapping",
  blocks: number[],
  blocksVersion: number,
  isUsersCached: boolean
} & Models.DefaultRow