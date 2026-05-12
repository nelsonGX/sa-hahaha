import type { StudentData } from '../app/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export function getHealth() {
  // Assuming /health is at the root, not under /api. Adjusting URL logic.
  const healthUrl = API_BASE_URL.replace('/api', '/health');
  return fetch(healthUrl).then((res) => res.json());
}

export interface SyncGradesRequest {
  student_id: string;
  password: string;
  use_mock: boolean;
}

export async function syncGrades(payload: SyncGradesRequest): Promise<StudentData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超時

  try {
    const res = await fetch(`${API_BASE_URL}/sync-grades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const json = await res.json();

    if (res.ok && json.status === 'success') {
      return json.data as StudentData;
    }

    throw new Error(json.detail?.message ?? json.message ?? '同步失敗，請重試');
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('連線逾時，學校伺服器回應過慢，請稍後再試');
    }
    throw error;
  }
}
