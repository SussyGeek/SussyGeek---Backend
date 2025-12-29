export interface Student {
  $id: string
  name: string
  username: string
  solved: number
  score: number
  streak: number
  rank: number
  instituteId: string
  contestRating: number
  difficultySolved: number[] | null
  $createdAt: string
  $updatedAt: string
}

export interface Institution {
  $id?: string
  name: string
  slug: string
  city: string | null,
  state: string | null,
  country: string | null
  score: number
  students: number
  scrappedStudents: number
  status: "Complete" | "Incomplete" | "Scrapping"
  $createdAt?: string
  $updatedAt?: string
}
