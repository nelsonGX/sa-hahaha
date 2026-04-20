import type { StudentData } from '../app/types';

export function getHealth() {
  return fetch('http://localhost:8667/health').then((res) => res.json());
}

export interface SyncGradesRequest {
  student_id: string;
  password: string;
  use_mock: boolean;
}

export async function syncGrades(payload: SyncGradesRequest): Promise<StudentData> {
  const res = await fetch('http://localhost:8667/api/sync-grades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (res.ok && json.status === 'success') {
    return json.data as StudentData;
  }

  throw new Error(json.detail?.message ?? json.message ?? '同步失敗，請重試');
}
