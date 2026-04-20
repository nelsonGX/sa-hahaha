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

interface SortChipProps {
  id: 'semester' | 'audit_category';
  label: string;
  active: boolean;
  sortAsc: boolean;
  onToggleSort: (key: 'semester' | 'audit_category') => void;
}

function SortChip({ id, label, active, sortAsc, onToggleSort }: SortChipProps) {
  return (
    <button
      onClick={() => onToggleSort(id)}
      className={`px-2.5 py-0.75 rounded-full text-xs font-semibold tracking-[0.125px] border cursor-pointer transition-colors inline-flex items-center gap-1 ${
        active
          ? 'bg-(--notion-blue) text-white border-transparent'
          : 'bg-transparent text-[#615d59] border-black/10 hover:bg-black/4'
      }`}
    >
      {label}
      <span className={`text-[10px] ${active ? 'opacity-100' : 'opacity-40'}`}>
        {active && !sortAsc ? '▲' : '▼'}
      </span>
    </button>
  );
}

function CategoryBadge({ cat }: { cat: string }) {
  let cls = 'bg-[#f2f9ff] text-[#097fe8]';
  if (cat.includes('選修'))                          cls = 'bg-[rgba(42,157,153,0.1)] text-[#2a9d99]';
  else if (cat.includes('通識'))                     cls = 'bg-[rgba(57,28,87,0.08)] text-[#391c57]';
  else if (cat.includes('體育'))                     cls = 'bg-[rgba(221,91,0,0.08)] text-[#dd5b00]';
  else if (cat.includes('核心') || cat.includes('能力')) cls = 'bg-black/5 text-[#615d59]';

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tracking-[0.125px] whitespace-nowrap ${cls}`}>
      {cat}
    </span>
  );
}

function ScoreBadge({ score }: { score: string }) {
  const passed = isPassed(score);
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${passed ? 'bg-[rgba(26,174,57,0.1)] text-[#1aae39]' : 'bg-[rgba(221,91,0,0.08)] text-[#dd5b00]'}`}>
      {score}
    </span>
  );
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

  return (
    <div className="rounded-xl overflow-hidden bg-white border border-black/10 shadow-(--shadow-card)">
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
        <h3 className="font-bold text-base text-black/95 tracking-[-0.25px]">
          歷年修課明細
        </h3>
        <div className="flex gap-2">
          <SortChip id="semester" label="按學期" active={sortKey === 'semester'} sortAsc={sortAsc} onToggleSort={toggleSort} />
          <SortChip id="audit_category" label="按分類" active={sortKey === 'audit_category'} sortAsc={sortAsc} onToggleSort={toggleSort} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#f6f5f4]">
              {['學期', '課程名稱', '學分', '成績', '審查標籤'].map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-2.5 text-xs font-semibold text-[#615d59] tracking-[0.125px] uppercase border-b border-black/10 ${i >= 2 && i <= 3 ? 'text-center' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={i} className="border-b border-black/5 hover:bg-[#f6f5f4] transition-colors">
                <td className="font-mono px-5 py-3 text-xs text-[#615d59] whitespace-nowrap">
                  {r.semester}
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-black/95">{r.course_name}</p>
                  <p className="text-xs text-[#615d59] mt-0.5">{r.category}</p>
                </td>
                <td className="px-5 py-3 text-center text-sm text-[#615d59]">
                  {r.credits}
                </td>
                <td className="px-5 py-3 text-center">
                  <ScoreBadge score={r.score} />
                </td>
                <td className="px-5 py-3">
                  <CategoryBadge cat={r.audit_category} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
