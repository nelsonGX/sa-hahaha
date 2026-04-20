import type { DetailedRequirements, CreditCategory } from '../types';

interface DetailedRequirementsPanelProps {
  details: DetailedRequirements;
}

const KEY_LABELS: Record<string, string> = {
  required_courses:   '必修 (64)',
  elective_courses:   '選修 (32)',
  holistic_education: '全人教育總計 (32)',
  holistic_core:      '核心課程 (8)',
  basic_skills:       '基本能力課程 (12)',
  general_ed:         '通識 (12)',
  pe_semesters:       '體育及格學期數 (4)',
};

function Row({ label, earned, target }: { label: string; earned: number; target: number }) {
  const pct = Math.min(100, Math.round((earned / target) * 100));
  const done = earned >= target;

  return (
    <div>
      <div className="flex justify-between items-center text-sm mb-1.5">
        <span className="font-medium text-slate-600">{label}</span>
        <span className={`font-semibold tabular-nums ${done ? 'text-emerald-600' : 'text-slate-400'}`}>
          {earned} / {target}
        </span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${done ? 'bg-emerald-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DetailedRequirementsPanel({ details }: DetailedRequirementsPanelProps) {
  const entries = Object.entries(details) as [keyof DetailedRequirements, CreditCategory | { earned: number; target: number; domains: Record<string, CreditCategory> }][];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-7 bg-blue-600 rounded-full" />
        <h2 className="text-xl font-bold text-slate-800">資管系畢業初審細項</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
        {entries.map(([key, val]) => {
          const label = KEY_LABELS[key] ?? key;
          return (
            <Row
              key={key}
              label={label}
              earned={val.earned}
              target={val.target}
            />
          );
        })}
      </div>
    </div>
  );
}
