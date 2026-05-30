'use client';

import type { EnglishProficiency, ComputerProficiency, EMIProficiency } from '../types';
import { getProgressValue } from '../utils/progress';

interface SpecialRequirementsPanelProps {
  english?: EnglishProficiency;
  computer?: ComputerProficiency;
  emi?: EMIProficiency;
  onEdit: () => void;
}

function RequirementCard({ 
  title, 
  status, 
  progress, 
  target, 
  description,
  isSpecialDone = false,
  progressLabel = "完成進度"
}: { 
  title: string; 
  status: string; 
  progress?: number; 
  target?: number;
  description?: string;
  isSpecialDone?: boolean;
  progressLabel?: string;
}) {
  const isDone = isSpecialDone || status === '已通過' || status === '自學方案完成' || (progress !== undefined && target !== undefined && progress >= target);
  const { pct } = getProgressValue(progress ?? 0, target ?? 1);

  return (
    <div className="group p-5 rounded-xl bg-white border border-black/10 shadow-[var(--shadow-card)] flex flex-col justify-between transition-all duration-300 hover:border-[#213183]/30 hover:scale-[1.02] hover:shadow-lg origin-center cursor-default">
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-black/90 text-base">{title}</h3>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
            isDone ? 'bg-[#e6f4f1] text-[#2a9d99]' : 'bg-[#fff4e6] text-[#e67e22]'
          }`}>
            {status}
          </span>
        </div>
        
        <div className="h-10 mb-2 overflow-hidden">
          <p className="text-[11px] text-[#8c8782] leading-relaxed opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            {description}
          </p>
        </div>
      </div>

      {progress !== undefined && target !== undefined && (
        <div className="mt-auto">
          <div className="flex justify-between text-[11px] mb-1.5 font-medium">
            <span className="text-[#615d59]">{progressLabel}</span>
            <span className="text-[#213183] tabular-nums">{progress} / {target}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#e7e1d9] overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ease-out ${isDone ? 'bg-[#213183]' : 'bg-[#6f7ec9]'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SpecialRequirementsPanel({ english, computer, emi, onEdit }: SpecialRequirementsPanelProps) {
  if (!english && !computer && !emi) return null;

  const computerStatus = (computer: ComputerProficiency) => {
    if (computer.passed_count >= computer.target_count) return '已完成';
    if (computer.passed_count >= 3 && computer.has_programming_elective) return '已完成 (替代方案)';
    if (computer.passed_count >= 3) return `待修程式選修 (${computer.passed_count}/3)`;
    return '未達標';
  };

  const isComputerDone = (computer: ComputerProficiency) => 
    computer.passed_count >= computer.target_count || (computer.passed_count >= 3 && computer.has_programming_elective);

  const emiStatus = (emi: EMIProficiency) => {
    if (emi.course_count >= emi.target_courses || emi.earned_credits >= emi.target_credits) return '已完成';
    return '未達標';
  };

  return (
    <div className="relative">
      <button 
        onClick={onEdit}
        className="absolute -top-11 right-0 text-xs font-bold text-[#213183] hover:text-[#1a276a] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#213183]/10 hover:border-[#213183]/30 shadow-sm transition-all z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        修改資訊
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {english && (
        <RequirementCard
          title="英文畢業門檻 (CEFR B2)"
          status={english.status}
          description="須達多益 785 / 托福 72 / 雅思 6.0 或參加管院自學方案。"
          progress={english.status.includes('自學') ? english.self_study_count : (english.status === '已通過' ? 1 : 0)}
          target={english.status.includes('自學') ? 8 : 1}
        />
      )}
      
      {computer && (
        <RequirementCard
          title="資訊素養機測"
          status={computerStatus(computer)}
          isSpecialDone={isComputerDone(computer)}
          progress={computer.passed_count}
          target={computer.target_count}
          description="畢業前須通過 5 題機測題目。"
        />
      )}

      {emi && (
        <RequirementCard
          title="EMI 專業課程 (Beta)"
          status={emiStatus(emi)}
          progress={emi.course_count}
          target={emi.target_courses}
          progressLabel="修畢門數"
          description="需修畢 5 門（或 15 學分）本院開設之英語授課專業課程。此功能目前透過關鍵字自動判定，僅供參考。"
        />
      )}
      </div>
    </div>
  );
}
