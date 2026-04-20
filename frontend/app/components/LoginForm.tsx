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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: 'var(--warm-white)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <span style={{ fontSize: 40, lineHeight: 1 }}>⛰️</span>
          <h1
            className="mt-4 font-bold"
            style={{
              fontSize: 32,
              letterSpacing: '-1px',
              lineHeight: 1.1,
              color: 'rgba(0,0,0,0.95)',
            }}
          >
            岩壁計算機
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--warm-gray-500)' }}
          >
            同步 SIS 成績，掌握畢業進度
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-deep)',
          }}
        >
          <h2
            className="font-semibold mb-6"
            style={{ fontSize: 16, color: 'rgba(0,0,0,0.95)' }}
          >
            登入 SIS 同步成績
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'rgba(0,0,0,0.95)' }}
              >
                學號
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="例如：413401223"
                required
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #dddddd',
                  borderRadius: 4,
                  fontSize: 16,
                  color: 'rgba(0,0,0,0.9)',
                  background: '#ffffff',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--focus-color)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(9,127,232,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#dddddd';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'rgba(0,0,0,0.95)' }}
              >
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="SIS 密碼"
                required
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #dddddd',
                  borderRadius: 4,
                  fontSize: 16,
                  color: 'rgba(0,0,0,0.9)',
                  background: '#ffffff',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--focus-color)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(9,127,232,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#dddddd';
                  e.currentTarget.style.boxShadow = 'none';
                }}
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
                <div
                  className="w-9 h-5 rounded-full border transition-colors peer-checked:border-transparent"
                  style={{
                    background: useMock ? 'var(--notion-blue)' : 'rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.15)',
                  }}
                />
                <div
                  className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                  style={{ transform: useMock ? 'translateX(16px)' : 'translateX(0)' }}
                />
              </div>
              <span className="text-sm" style={{ color: 'var(--warm-gray-500)' }}>
                使用測試假資料 (Mock)
              </span>
            </label>

            {error && (
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded"
                style={{
                  background: 'rgba(221,91,0,0.06)',
                  border: '1px solid rgba(221,91,0,0.2)',
                }}
              >
                <span className="text-sm shrink-0" style={{ color: '#dd5b00', marginTop: 1 }}>⚠</span>
                <p className="text-sm" style={{ color: '#dd5b00' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'var(--warm-gray-300)' : 'var(--notion-blue)',
                color: '#ffffff',
                border: '1px solid transparent',
                borderRadius: 4,
                padding: '8px 16px',
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = 'var(--notion-blue-active)';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = 'var(--notion-blue)';
              }}
              onMouseDown={(e) => {
                if (!loading) e.currentTarget.style.transform = 'scale(0.97)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {loading ? '同步中...' : '開始同步'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
