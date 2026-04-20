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
      style={{
        padding: '3px 10px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.125px',
        border: '1px solid var(--border)',
        background: active ? 'var(--notion-blue)' : 'transparent',
        color: active ? '#ffffff' : 'var(--warm-gray-500)',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {label}
      <span style={{ opacity: active ? 1 : 0.4, fontSize: 10 }}>
        {active && !sortAsc ? '▲' : '▼'}
      </span>
    </button>
  );
}

function CategoryBadge({ cat }: { cat: string }) {
  let bg = 'var(--badge-bg)';
  let color = 'var(--badge-text)';

  if (cat.includes('必修')) {
    bg = 'var(--badge-bg)'; color = 'var(--badge-text)';
  } else if (cat.includes('選修')) {
    bg = 'rgba(42,157,153,0.1)'; color = '#2a9d99';
  } else if (cat.includes('通識')) {
    bg = 'rgba(57,28,87,0.08)'; color = '#391c57';
  } else if (cat.includes('體育')) {
    bg = 'rgba(221,91,0,0.08)'; color = '#dd5b00';
  } else if (cat.includes('核心') || cat.includes('能力')) {
    bg = 'rgba(0,0,0,0.05)'; color = 'var(--warm-gray-500)';
  }

  return (
    <span
      style={{
        background: bg,
        color,
        borderRadius: 9999,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.125px',
        whiteSpace: 'nowrap',
      }}
    >
      {cat}
    </span>
  );
}

function ScoreBadge({ score }: { score: string }) {
  const passed = isPassed(score);
  return (
    <span
      style={{
        background: passed ? 'rgba(26,174,57,0.1)' : 'rgba(221,91,0,0.08)',
        color: passed ? '#1aae39' : '#dd5b00',
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
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
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h3
          className="font-bold"
          style={{ fontSize: 16, color: 'rgba(0,0,0,0.95)', letterSpacing: '-0.25px' }}
        >
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
            <tr style={{ background: 'var(--warm-white)' }}>
              {['學期', '課程名稱', '學分', '成績', '審查標籤'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 20px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--warm-gray-300)',
                    letterSpacing: '0.125px',
                    textTransform: 'uppercase',
                    textAlign: i >= 2 && i <= 3 ? 'center' : 'left',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr
                key={i}
                style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--warm-white)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td
                  className="font-mono"
                  style={{ padding: '12px 20px', fontSize: 12, color: 'var(--warm-gray-300)', whiteSpace: 'nowrap' }}
                >
                  {r.semester}
                </td>
                <td style={{ padding: '12px 20px' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.95)' }}>{r.course_name}</p>
                  <p style={{ fontSize: 12, color: 'var(--warm-gray-300)', marginTop: 2 }}>{r.category}</p>
                </td>
                <td style={{ padding: '12px 20px', textAlign: 'center', fontSize: 14, color: 'var(--warm-gray-500)' }}>
                  {r.credits}
                </td>
                <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                  <ScoreBadge score={r.score} />
                </td>
                <td style={{ padding: '12px 20px' }}>
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
