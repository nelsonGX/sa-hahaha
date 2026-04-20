import type { DetailedRequirements } from '../types';
import { getProgressValue } from '../utils/progress';

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
  const { pct, done } = getProgressValue(earned, target);
  const hasProgress = pct > 0;
  return (
    <div className="mt-4 h-1.5 w-full rounded-full overflow-hidden bg-[#e7e1d9]">
      <div
        className={done ? 'h-full rounded-full bg-[#213183]' : 'h-full rounded-full bg-[#6f7ec9]'}
        style={{
          width: `${pct}%`,
          minWidth: hasProgress ? 6 : 0,
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
        const { earned, target, done } = getProgressValue(item.earned, item.target);

        return (
          <div
            key={key}
            className="rounded-xl p-5 bg-white border border-black/10 shadow-[var(--shadow-card)]"
          >
            <p className="font-semibold mb-3 text-xs text-[#615d59] tracking-[0.125px] uppercase">
              {label}總進度
            </p>
            <p className="text-[32px] font-bold tracking-[-1px] text-black/95 leading-none">
              {earned}
              <span className="text-lg font-normal text-[#615d59] ml-1">
                / {target}
              </span>
            </p>
            <p className={`mt-1.5 text-[13px] font-medium ${done ? 'text-[#2a9d99]' : 'text-[#dd5b00]'}`}>
              {done ? '已達標' : `還差 ${target - earned} 學分`}
            </p>
            <ProgressBar earned={earned} target={target} />
          </div>
        );
      })}
    </div>
  );
}
