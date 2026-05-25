const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface RecommendedCourse {
  code: string;
  name: string;
  credits: number;
  teacher: string;
  time: string;
  seats: number;
  remaining: number;
}

export async function fetchRecommendations(
  category: string,
  neededCredits: number,
  department?: string,
): Promise<RecommendedCourse[]> {
  const params = new URLSearchParams({
    category,
    needed_credits: String(neededCredits),
  });
  if (department) params.set('department', department);

  const res = await fetch(`${API_BASE_URL}/recommend-courses?${params}`);
  if (!res.ok) throw new Error('無法載入選課建議');
  const json = await res.json();
  return json.courses as RecommendedCourse[];
}
