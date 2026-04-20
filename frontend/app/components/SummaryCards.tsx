import type { DetailedRequirements } from '../types';

interface SummaryCardsProps {
  details: DetailedRequirements;
}

interface CardConfig {
  key: keyof Pick<DetailedRequirements, 'holistic_education' | 'required_courses' | 'elective_courses' | 'general_ed'>;
  label: string;
  color: string;
  barColor: string;
}

const cards: CardConfig[] = [
  { key: 'required_courses',   label: '必修',     color: 'text-blue-600',   barColor: 'bg-blue-500' },
  { key: 'elective_courses',   label: '選修',     color: 'text-emerald-600', barColor: 'bg-emerald-500' },
  { key: 'holistic_education', label: '全人教育', color: 'text-amber-600',  barColor: 'bg-amber-500' },
  { key: 'general_ed',         label: '通識',     color: 'text-purple-600', barColor: 'bg-purple-500' },
];

function ProgressBar({ earned, target, barColor }: { earned: number; target: number; barColor: string }) {
  const pct = Math.min(100, Math.round((earned / target) * 100));
  return (
    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
      <div
        className={`${barColor} h-full rounded-full transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function SummaryCards({ details }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, color, barColor }) => {
        const item = details[key];
        const earned = item.earned;
        const target = item.target;
        const done = earned >= target;

        return (
          <div key={key} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{label}總進度</p>
            <p className={`text-3xl font-bold ${color}`}>
              {earned} <span className="text-slate-300 font-normal text-xl">/ {target}</span>
            </p>
            {done ? (
              <p className="text-sm text-emerald-500 mt-1 font-medium">已達標 🎉</p>
            ) : (
              <p className="text-sm text-rose-500 mt-1">還差 {target - earned} 學分</p>
            )}
            <ProgressBar earned={earned} target={target} barColor={barColor} />
          </div>
        );
      })}
    </div>
  );
}
