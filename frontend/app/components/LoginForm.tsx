'use client';

import { useState } from 'react';
import type { StudentData } from '../types';
import { syncGrades } from '../../lib/getapi';

interface LoginFormProps {
  onSuccess: (data: StudentData) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [useMock, setUseMock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await syncGrades({ student_id: studentId, password, use_mock: useMock });
      onSuccess(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '連線失敗，請確認後端是否已啟動');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[#f6f5f4]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <span className="text-[40px] leading-none">⛰️</span>
          <h1 className="mt-4 font-bold text-[32px] tracking-[-1px] leading-[1.1] text-black/95">
            岩壁計算機
          </h1>
          <p className="mt-2 text-sm text-[#615d59]">
            同步 SIS 成績，掌握畢業進度
          </p>
        </div>

        <div className="rounded-2xl p-8 bg-white border border-black/10 shadow-[var(--shadow-deep)]">
          <h2 className="font-semibold mb-6 text-base text-black/95">
            登入 SIS 同步成績
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-black/95">
                學號
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="例如：413401223"
                required
                className="w-full px-2 py-1.5 border border-[#dddddd] rounded text-base text-black/90 bg-white outline-none focus:border-[#097fe8] focus:shadow-[0_0_0_2px_rgba(9,127,232,0.15)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-black/95">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="SIS 密碼"
                required
                className="w-full px-2 py-1.5 border border-[#dddddd] rounded text-base text-black/90 bg-white outline-none focus:border-[#097fe8] focus:shadow-[0_0_0_2px_rgba(9,127,232,0.15)]"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  checked={useMock}
                  onChange={(e) => setUseMock(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 rounded-full border border-black/15 bg-black/[0.08] transition-colors peer-checked:bg-[var(--notion-blue)] peer-checked:border-transparent" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
              </div>
              <span className="text-sm text-[#615d59]">
                使用測試假資料 (Mock)
              </span>
            </label>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded bg-[rgba(221,91,0,0.06)] border border-[rgba(221,91,0,0.2)]">
                <span className="text-sm shrink-0 mt-px text-[#dd5b00]">⚠</span>
                <p className="text-sm text-[#dd5b00]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded text-[15px] font-semibold text-white bg-[var(--notion-blue)] border border-transparent transition-colors cursor-pointer hover:bg-[var(--notion-blue-active)] active:scale-[.97] disabled:bg-[#a39e98] disabled:cursor-not-allowed"
            >
              {loading ? '同步中...' : '開始同步'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
