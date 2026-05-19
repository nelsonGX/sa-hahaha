'use client';

import { useMemo } from 'react';
import type { DetailedRequirements, CourseRecord } from '../types';
import { getProgressValue } from '../utils/progress';
import { getEffectiveCategory, isPassed } from './requirements/helpers';

interface SummaryCardsProps {
  details: DetailedRequirements;
  records: CourseRecord[];
}

function SubProgressBar({ label, earned, target, colorClass = 'bg-[#615d59]' }: { label: string; earned: number; target: number, colorClass?: string }) {
  const percentage = target > 0 ? Math.min(100, (earned / target) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[10px] text-[#615d59] mb-1">
        <span className="font-medium truncate mr-2">{label}</span>
        <span className="shrink-0">
          {earned}{target > 0 ? ` / ${target}` : ''}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-[#f6f5f4] overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-500 opacity-60`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ProgressBar({ earned, target, colorClass }: { earned: number; target: number, colorClass?: string }) {
  const { pct, done } = getProgressValue(earned, target);
  const hasProgress = pct > 0;
  const barColor = done ? 'bg-[#213183]' : (colorClass || 'bg-[#6f7ec9]');
  
  return (
    <div className="mt-4 h-1.5 w-full rounded-full overflow-hidden bg-[#e7e1d9]">
      <div
        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
        style={{
          width: `${pct}%`,
          minWidth: hasProgress ? 6 : 0,
        }}
      />
    </div>
  );
}

export default function SummaryCards({ details, records }: SummaryCardsProps) {
  // 1. Major Required
  const req = details.required_courses;
  // 2. Major Elective
  const ele = details.elective_courses;
  // 3. Holistic Core (8)
  const core = details.holistic_core;
  // 4. Basic Skills (12)
  const basic = details.basic_skills;
  // 5. General Education (12)
  const ge = details.general_ed;

  // Consistent calculation with RequirementsTree
  const { chineseEarned, foreignEarned, majorElectiveEarned, externalElectiveEarned } = useMemo(() => {
    // Basic Skills
    const basicRecords = records.filter(r => getEffectiveCategory(r) === '基本能力課程');
    const cEarned = basicRecords
      .filter(r => r.course_name.includes('國文') && isPassed(r.score))
      .reduce((sum, r) => sum + r.credits, 0);
    const fEarned = basicRecords
      .filter(r => !r.course_name.includes('國文') && isPassed(r.score))
      .reduce((sum, r) => sum + r.credits, 0);

    // Electives Breakdown
    const electiveRecords = records.filter(r => getEffectiveCategory(r) === '選修' && isPassed(r.score));
    const extEarned = electiveRecords
      .filter(r => r.category.includes('外系') || r.audit_category.includes('外系'))
      .reduce((sum, r) => sum + r.credits, 0);
    const majEarned = electiveRecords.reduce((sum, r) => sum + r.credits, 0) - extEarned;

    return { 
      chineseEarned: cEarned, 
      foreignEarned: fEarned,
      majorElectiveEarned: majEarned,
      externalElectiveEarned: extEarned
    };
  }, [records]);

  const pillars = [
    { 
      label: '系所必修', 
      earned: req.earned, 
      target: req.target, 
      done: getProgressValue(req.earned, req.target).done,
      color: 'bg-[#0075de]' 
    },
    { 
      label: '系所選修', 
      earned: ele.earned, 
      target: ele.target, 
      done: getProgressValue(ele.earned, ele.target).done,
      color: 'bg-[#2a9d99]',
      subItems: [
        { label: '本系選修', earned: majorElectiveEarned, target: ele.target },
        { label: '外系選修', earned: externalElectiveEarned, target: 0, color: 'bg-emerald-400' }
      ]
    },
    { 
      label: '全人/核心課程', 
      earned: core.earned, 
      target: core.target, 
      done: getProgressValue(core.earned, core.target).done,
      color: 'bg-[#615d59]',
      subItems: [
        { label: '核心學分', earned: core.earned, target: core.target },
        { label: '體育(學期)', earned: details.pe_semesters.earned, target: details.pe_semesters.target, color: 'bg-rose-400' }
      ]
    },
    { 
      label: '全人/基本能力課程', 
      earned: basic.earned, 
      target: basic.target, 
      done: getProgressValue(basic.earned, basic.target).done,
      color: 'bg-[#4a5568]',
      subItems: [
        { label: '國文', earned: Math.min(4, chineseEarned), target: 4 },
        { label: '外國語文', earned: Math.min(8, foreignEarned), target: 8 }
      ]
    },
    { 
      label: '通識涵養課程', 
      earned: ge.earned, 
      target: ge.target, 
      done: getProgressValue(ge.earned, ge.target).done,
      color: 'bg-[#9b6fb3]', 
      isGenEd: true 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {pillars.map((p, idx) => {
        return (
          <div
            key={idx}
            className="rounded-xl p-5 bg-white border border-black/10 shadow-[var(--shadow-card)] flex flex-col transition-all duration-300 hover:border-[#213183]/30 hover:scale-[1.05] hover:shadow-lg origin-center cursor-default z-0 hover:z-10"
          >
            <p className="font-semibold mb-3 text-[11px] text-[#615d59] tracking-[0.125px] uppercase h-8 flex items-start">
              {p.label}
            </p>
            <p className="text-[32px] font-bold tracking-[-1px] text-black/95 leading-none">
              {p.earned}
              {p.target > 0 && (
                <span className="text-lg font-normal text-[#615d59] ml-1">/ {p.target}</span>
              )}
            </p>
            
            <p className={`mt-1.5 text-[11px] font-medium leading-tight ${p.done ? 'text-[#2a9d99]' : 'text-[#dd5b00]'}`}>
              {p.done ? '已達標' : `還差 ${p.target - p.earned} 學分`}
            </p>

            <ProgressBar earned={p.earned} target={p.target} colorClass={p.color} />

            {/* Sub Items (Core and Basic Skills) */}
            {p.subItems && (
              <div className="mt-4 pt-4 border-t border-black/5 space-y-3">
                {p.subItems.map((sub, sidx) => (
                  <SubProgressBar key={sidx} {...sub} colorClass={sub.color || p.color} />
                ))}
              </div>
            )}

            {/* General Education Domains Breakdown */}
            {p.isGenEd && (
              <div className="mt-4 pt-4 border-t border-black/5 space-y-3">
                {Object.entries(details.general_ed.domains).map(([domain, info]) => (
                  <SubProgressBar 
                    key={domain} 
                    label={domain.replace('通識領域', '').replace('通識', '')} 
                    earned={info.earned} 
                    target={info.target} 
                    colorClass="bg-[#9b6fb3]" 
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
