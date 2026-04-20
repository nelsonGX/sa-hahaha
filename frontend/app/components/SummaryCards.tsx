import type { DetailedRequirements } from '../types';

interface SummaryCardsProps {
  details: DetailedRequirements;
}

const cards = [
  { key: 'required_courses'   as const, label: '必修' },
  { key: 'elective_courses'   as const, label: '選修' },
  { key: 'holistic_education' as const, label: '全人教育' },
  { key: 'general_ed'         as const, label: '通識' },
] satisfies { key: keyof Pick<DetailedRequirements, 'required_courses' | 'elective_courses' | 'holistic_education' | 'general_ed'>; label: string }[];

function ProgressBar({ earned, target }: { earned: number; target: number }) {
  const pct = Math.min(100, Math.round((earned / target) * 100));
  const done = earned >= target;
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: 4, background: 'rgba(0,0,0,0.07)', marginTop: 16 }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: done ? '#2a9d99' : 'var(--notion-blue)',
          transition: 'width 0.7s ease',
        }}
      />
    </div>
  );
}

export default function SummaryCards({ details }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label }) => {
        const item = details[key];
        const { earned, target } = item;
        const done = earned >= target;

        return (
          <div
            key={key}
            className="rounded-xl p-5"
            style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <p
              className="font-semibold mb-3"
              style={{ fontSize: 12, color: 'var(--warm-gray-300)', letterSpacing: '0.125px', textTransform: 'uppercase' }}
            >
              {label}總進度
            </p>
            <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px', color: 'rgba(0,0,0,0.95)', lineHeight: 1 }}>
              {earned}
              <span style={{ fontSize: 18, fontWeight: 400, color: 'var(--warm-gray-300)', marginLeft: 4 }}>
                / {target}
              </span>
            </p>
            <p
              className="mt-1.5"
              style={{ fontSize: 13, fontWeight: 500, color: done ? '#2a9d99' : '#dd5b00' }}
            >
              {done ? '已達標' : `還差 ${target - earned} 學分`}
            </p>
            <ProgressBar earned={earned} target={target} />
          </div>
        );
      })}
    </div>
  );
}
