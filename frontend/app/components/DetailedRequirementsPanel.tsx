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
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-[#615d59]">{label}</span>
        <span className={`tabular-nums text-sm font-semibold ${done ? 'text-[#2a9d99]' : 'text-[#615d59]'}`}>
          {earned} / {target}
        </span>
      </div>
      <div className="w-full rounded-full overflow-hidden h-1 bg-black/[0.07]">
        <div
          className={`h-full rounded-full ${done ? 'bg-[#2a9d99]' : 'bg-[var(--notion-blue)]'}`}
          style={{ width: `${pct}%`, transition: 'width 0.7s ease' }}
        />
      </div>
    </div>
  );
}

export default function DetailedRequirementsPanel({ details }: DetailedRequirementsPanelProps) {
  const entries = Object.entries(details) as [keyof DetailedRequirements, CreditCategory | { earned: number; target: number; domains: Record<string, CreditCategory> }][];

  return (
    <div className="rounded-xl p-6 bg-white border border-black/10 shadow-[var(--shadow-card)]">
      <h2 className="font-bold mb-6 text-lg text-black/95 tracking-[-0.25px]">
        資管系畢業初審細項
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
        {entries.map(([key, val]) => (
          <Row
            key={key}
            label={KEY_LABELS[key] ?? key}
            earned={val.earned}
            target={val.target}
          />
        ))}
      </div>
    </div>
  );
}
