const API_BASE_URL = '/api';

export interface RecommendedCourse {
  code: string;
  name: string;
  credits: number;
  teacher: string;
  time: string;
  seats: number;
  remaining: number;
}

export interface RecommendRequest {
  category: string;
  needed_credits: number;
  department: string;
  passed_courses: string[];
  enrolled_courses: { name: string; offering_dept: string }[];
}

export async function fetchRecommendations(req: RecommendRequest): Promise<RecommendedCourse[]> {
  const res = await fetch(`${API_BASE_URL}/recommend-courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  
  if (!res.ok) throw new Error('無法載入選課建議');
  const json = await res.json();
  return json.courses as RecommendedCourse[];
}
