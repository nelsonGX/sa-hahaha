'use client';

import { useState, useMemo } from 'react';
import type { CourseRecord } from '../types';
import { isPassed } from './requirements/helpers';

interface CourseTableProps {
  records: CourseRecord[];
  enrollmentYear: number;
}

type SortKey = 'semester' | 'audit_category';

const TABS = ['all', '必修', '選修', '通識', '核心/能力'] as const;

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
  const cls = passed ? 'bg-[rgba(26,174,57,0.1)] text-[#1aae39]' : 'bg-[rgba(221,91,0,0.08)] text-[#dd5b00]';
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${cls}`}>
      {score}
    </span>
  );
}

export default function CourseTable({ records, enrollmentYear }: CourseTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('semester');
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('all');
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  const semesters = useMemo(() => {
    const currentYear = 114;
    const currentSem = 2;
    const list: string[] = [];
    for (let y = enrollmentYear; y <= currentYear; y++) {
      for (let s = 1; s <= 2; s++) {
        if (y === currentYear && s > currentSem) break;
        list.push(`${y}-${s}`);
      }
    }
    return list.reverse();
  }, [enrollmentYear]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchSearch = r.course_name.toLowerCase().includes(search.toLowerCase()) || 
                          r.semester.includes(search);
      const matchTab = activeTab === 'all' || 
                       (activeTab === '核心/能力' ? (r.audit_category.includes('核心') || r.audit_category.includes('能力')) : r.audit_category.includes(activeTab));
      const matchSemester = !selectedSemester || r.semester === selectedSemester;
      return matchSearch && matchTab && matchSemester;
    });
  }, [records, search, activeTab, selectedSemester]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (sortAsc) return va.localeCompare(vb);
      return vb.localeCompare(va);
    });
  }, [filtered, sortKey, sortAsc]);

  const totalFilteredCredits = useMemo(() => {
    return filtered.filter(r => isPassed(r.score)).reduce((sum, r) => sum + r.credits, 0);
  }, [filtered]);

  return (
    <div className="rounded-xl overflow-hidden bg-white border border-black/10 shadow-(--shadow-card)">
      <div className="px-6 py-5 border-b border-black/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-black/95 tracking-[-0.5px]">
              歷年修課明細
            </h3>
            {selectedSemester && (
              <button
                onClick={() => setSelectedSemester(null)}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-(--notion-blue)/10 text-(--notion-blue) rounded text-[11px] font-bold hover:bg-(--notion-blue)/20 transition-colors"
              >
                學期: {selectedSemester} x
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSortKey('semester'); setSortAsc(!sortAsc); }}
              className={`px-2.5 py-0.75 rounded-full text-xs font-semibold border transition-colors ${sortKey === 'semester' ? 'bg-(--notion-blue) text-white border-transparent' : 'bg-transparent text-[#615d59] border-black/10'}`}
            >
              按學期 {sortKey === 'semester' ? (sortAsc ? '▲' : '▼') : ''}
            </button>
            <button
              onClick={() => { setSortKey('audit_category'); setSortAsc(!sortAsc); }}
              className={`px-2.5 py-0.75 rounded-full text-xs font-semibold border transition-colors ${sortKey === 'audit_category' ? 'bg-(--notion-blue) text-white border-transparent' : 'bg-transparent text-[#615d59] border-black/10'}`}
            >
              按分類 {sortKey === 'audit_category' ? (sortAsc ? '▲' : '▼') : ''}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="搜尋課程名稱或學期..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-2 bg-[#f6f5f4] border-none rounded-lg text-sm placeholder:text-[#a39e98] outline-none focus:ring-2 focus:ring-(--notion-blue)/20 transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={selectedSemester || ''}
                onChange={(e) => setSelectedSemester(e.target.value || null)}
                className="appearance-none px-3 py-2 bg-[#f6f5f4] border-none rounded-lg text-xs font-medium text-[#615d59] outline-none focus:ring-2 focus:ring-(--notion-blue)/20 transition-all cursor-pointer pr-8"
              >
                <option value="">所有學期</option>
                {semesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#615d59] opacity-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="flex bg-[#f6f5f4] p-1 rounded-lg gap-1 overflow-x-auto no-scrollbar">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-[#615d59] hover:bg-black/5'}`}
                >
                  {tab === 'all' ? '全部' : tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#f6f5f4]">
              <th className="px-5 py-3 text-[11px] font-bold text-[#615d59] tracking-[0.05em] uppercase border-b border-black/10">學期</th>
              <th className="px-5 py-3 text-[11px] font-bold text-[#615d59] tracking-[0.05em] uppercase border-b border-black/10">課程名稱</th>
              <th className="px-5 py-3 text-[11px] font-bold text-[#615d59] tracking-[0.05em] uppercase border-b border-black/10 text-center">學分</th>
              <th className="px-5 py-3 text-[11px] font-bold text-[#615d59] tracking-[0.05em] uppercase border-b border-black/10 text-center">成績</th>
              <th className="px-5 py-3 text-[11px] font-bold text-[#615d59] tracking-[0.05em] uppercase border-b border-black/10">審查標籤</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {sorted.length > 0 ? (
              sorted.map((r, i) => (
                <tr key={i} className="group hover:bg-[#f6f5f4]/50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedSemester(r.semester)}
                      className={`font-mono text-xs px-2 py-1 rounded transition-colors ${selectedSemester === r.semester ? 'bg-(--notion-blue) text-white font-bold' : 'text-[#615d59] hover:bg-black/5 hover:text-black'}`}
                    >
                      {r.semester}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-black/90 group-hover:text-(--notion-blue) transition-colors">{r.course_name}</p>
                    <p className="text-[11px] text-[#a39e98] mt-0.5">{r.category}</p>
                  </td>
                  <td className="px-5 py-4 text-center text-sm font-medium text-[#615d59]">
                    {r.credits}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {r.course_name.includes('導師時間') ? (
                      <span className="text-[#a39e98]">-</span>
                    ) : (
                      <ScoreBadge score={r.score} />
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <CategoryBadge cat={r.audit_category} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-20 text-center text-sm text-[#a39e98]">
                  沒有找到符合條件的課程
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-[#f6f5f4]/30 border-t border-black/10 flex justify-between items-center">
        <p className="text-xs text-[#a39e98]">顯示 {sorted.length} 門課程</p>
        <p className="text-sm font-bold text-black/90">
          篩選總學分：<span className="text-(--notion-blue)">{totalFilteredCredits}</span>
        </p>
      </div>
    </div>
  );
}
