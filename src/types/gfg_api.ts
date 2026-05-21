type GFGStudentStats = {
  user_id: number;
  handle: string;
  coding_score: number;
  total_problems_solved: number;
  potd_longest_streak: number;
};

type GFGRes = {
  page_size: number;
  count: number;
  next: string | null;
  previous: string | null;
  results: GFGStudentStats[];
};

type GfgApiClient = {
  get<T>(url: string, config?: any): Promise<T>;
};
