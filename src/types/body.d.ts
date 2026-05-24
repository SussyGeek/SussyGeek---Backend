export interface InstitutionBody {
    name: string,
    slug: string,
    studentCount: number,
    city: string,
    country: string,
    state: string,
}

export interface StudentBody {
    $id: string,
    name: string,
    username: string,
    solved: number,
    score: number,
    instituteId: string,
    rank: number,
    streak: number,
    difficultySolved?: number[],
    branch?: string
}

export interface BatchBody {
    id: string,
    username: string,
    fullName: string,
    institution: string,
    codingScore: number,
    problemsSolved: number,
    instituteRank: number,
    streak: number,
    longestStreak: number,
    scrapedAt: string
}

export type ContributionBody = {
    instituteId: string,
    username: string,
    students: BatchBody[],
    seconds: number
}

export interface GFGUser {
    user_id: number,
    handle: string,
    coding_score: number,
    total_problems_solved: number,
    potd_longest_streak: number
}

export interface GFGUsersList {
    page_size: number,
    count: number,
    next: null | string,
    previous: null | string,
    results: []
}