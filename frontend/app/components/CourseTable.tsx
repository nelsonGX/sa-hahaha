'use client';

import { useState, useMemo } from 'react';
import type { CourseRecord } from '../types';
import { isPassed } from './requirements/helpers';

interface CourseTableProps {
  records: CourseRecord[];
}

type SortKey = 'semester' | 'audit_category';

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
  const [sortAsc, setSortAsc] = useState(false); // Default to newest first
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | '必修' | '選修' | '通識' | '核心/能力'>('all');
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

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
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
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
                學期: {selectedSemester} ✕
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <SortChip id="semester" label="按學期" active={sortKey === 'semester'} sortAsc={sortAsc} onToggleSort={toggleSort} />
            <SortChip id="audit_category" label="按分類" active={sortKey === 'audit_category'} sortAsc={sortAsc} onToggleSort={toggleSort} />
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#615d59] opacity-50 overflow-visible"
              fill="currentColor" 
              viewBox="0 0 16 16"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            <input
              type="text"
              placeholder="搜尋課程名稱或學期..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#f6f5f4] border-none rounded-lg text-sm placeholder:text-[#a39e98] outline-none focus:ring-2 focus:ring-(--notion-blue)/20 transition-all"
            />
          </div>
          <div className="flex bg-[#f6f5f4] p-1 rounded-lg gap-1 overflow-x-auto no-scrollbar">
            {(['all', '必修', '選修', '通識', '核心/能力'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-[#615d59] hover:bg-black/5'
                }`}
              >
                {tab === 'all' ? '全部' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#f6f5f4]">
              {['學期', '課程名稱', '學分', '成績', '審查標籤'].map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3 text-[11px] font-bold text-[#615d59] tracking-[0.05em] uppercase border-b border-black/10 ${i >= 2 && i <= 3 ? 'text-center' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {sorted.length > 0 ? (
              sorted.map((r, i) => (
                <tr key={i} className="group hover:bg-[#f6f5f4]/50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedSemester(r.semester)}
                      className={`font-mono text-xs px-2 py-1 rounded transition-colors ${
                        selectedSemester === r.semester 
                          ? 'bg-(--notion-blue) text-white font-bold' 
                          : 'text-[#615d59] hover:bg-black/5 hover:text-black'
                      }`}
                      title={`只顯示 ${r.semester} 學期`}
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
                    <ScoreBadge score={r.score} />
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
        <p className="text-xs text-[#a39e98]">
          顯示 {sorted.length} 門課程
        </p>
        <p className="text-sm font-bold text-black/90">
          篩選總學分：<span className="text-(--notion-blue)">{totalFilteredCredits}</span>
        </p>
      </div>
    </div>
  );
}
