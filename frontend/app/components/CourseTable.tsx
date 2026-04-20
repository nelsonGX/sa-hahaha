'use client';

import { useState, useMemo } from 'react';
import type { CourseRecord } from '../types';

interface CourseTableProps {
  records: CourseRecord[];
}

type SortKey = 'semester' | 'audit_category';

function isPassed(score: string): boolean {
  const num = parseInt(score);
  if (!isNaN(num)) return num >= 60;
  return ['抵免', '通過', '及格'].includes(score);
}

function getCategoryStyle(cat: string): string {
  if (cat.includes('必修')) return 'bg-blue-50 text-blue-600 border-blue-200';
  if (cat.includes('選修')) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  if (cat.includes('核心') || cat.includes('能力')) return 'bg-slate-50 text-slate-600 border-slate-200';
  if (cat.includes('通識')) return 'bg-purple-50 text-purple-600 border-purple-200';
  if (cat.includes('體育')) return 'bg-rose-50 text-rose-600 border-rose-200';
  return 'bg-slate-50 text-slate-400 border-slate-200';
}

export default function CourseTable({ records }: CourseTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('semester');
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = useMemo(() => {
    return [...records].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [records, sortKey, sortAsc]);

  function SortIcon({ active, asc }: { active: boolean; asc: boolean }) {
    return (
      <svg
        className={`inline w-3.5 h-3.5 ml-1 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d={active && !asc ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
      </svg>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">歷年修課明細</h3>
        <div className="flex gap-2">
          <button
            onClick={() => toggleSort('semester')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              sortKey === 'semester'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
          >
            按學期
            <SortIcon active={sortKey === 'semester'} asc={sortAsc} />
          </button>
          <button
            onClick={() => toggleSort('audit_category')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              sortKey === 'audit_category'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
          >
            按分類
            <SortIcon active={sortKey === 'audit_category'} asc={sortAsc} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 font-medium">學期</th>
              <th className="px-6 py-3 font-medium">課程名稱</th>
              <th className="px-6 py-3 font-medium text-center">學分</th>
              <th className="px-6 py-3 font-medium text-center">成績</th>
              <th className="px-6 py-3 font-medium">審查標籤</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-6 py-3.5 font-mono text-slate-400 text-xs">{r.semester}</td>
                <td className="px-6 py-3.5">
                  <p className="font-medium text-slate-800">{r.course_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.category}</p>
                </td>
                <td className="px-6 py-3.5 text-center text-slate-600">{r.credits}</td>
                <td className="px-6 py-3.5 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                    isPassed(r.score)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {r.score}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getCategoryStyle(r.audit_category)}`}>
                    {r.audit_category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
