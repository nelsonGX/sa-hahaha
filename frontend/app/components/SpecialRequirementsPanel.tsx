'use client';

import type { EnglishProficiency, ComputerProficiency, EMIProficiency } from '../types';
import { getProgressValue } from '../utils/progress';

interface SpecialRequirementsPanelProps {
  english?: EnglishProficiency;
  computer?: ComputerProficiency;
  emi?: EMIProficiency;
  onEdit: () => void;
  departmentName?: string;
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

export default function SpecialRequirementsPanel({ english, computer, emi, onEdit, departmentName }: SpecialRequirementsPanelProps) {
  const isIM = departmentName?.includes('資訊管理');
  
  // 如果 emi 物件完全沒資料，嘗試從後端可能有的 emi_courses 欄位或即時計算 (這裡以傳入的 emi 為主)
  // 確保 progress 有值，即使 emi 為 undefined 也要顯示 0/15
  const emiCredits = emi?.earned_credits ?? 0;
  const emiTarget = emi?.target_credits ?? 15;
  
  if (!english && !computer && !emi && !isIM) return null;

  const computerStatus = (computer?: ComputerProficiency) => {
    if (!computer) return '未達標';
    if (computer.passed_count >= computer.target_count) return '已完成';
    if (computer.passed_count >= 3 && computer.has_programming_elective) return '已完成 (替代方案)';
    if (computer.passed_count >= 3) return `待修程式選修 (${computer.passed_count}/3)`;
    return '未達標';
  };

  const isComputerDone = (computer?: ComputerProficiency) => 
    !!computer && (computer.passed_count >= computer.target_count || (computer.passed_count >= 3 && computer.has_programming_elective));

  const emiStatus = (emi?: EMIProficiency) => {
    if (!emi) return '未達標';
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <RequirementCard
          title="英文畢業門檻 (CEFR B2)"
          status={english?.status || '未通過'}
          description="須達多益 785 / 托福 72 / 雅思 6.0 或參加管院自學方案。"
          progress={english?.status.includes('自學') ? english.self_study_count : (english?.status === '已通過' ? 1 : 0)}
          target={english?.status.includes('自學') ? 8 : 1}
        />
        
        <RequirementCard
          title="資訊素養機測"
          status={computerStatus(computer)}
          isSpecialDone={isComputerDone(computer)}
          progress={computer?.passed_count || 0}
          target={computer?.target_count || 5}
          description="畢業前須通過 5 題機測題目 (或 3 題＋程式選修)。"
        />

        {(emi || isIM) && (
          <RequirementCard
            title="EMI 專業課程"
            status={emiStatus(emi)}
            progress={emiCredits}
            target={emiTarget}
            progressLabel="累計學分"
            description="資管系需修畢 15 學分（或 5 門）英語授課專業課程。系統依名稱自動判定僅供參考。"
          />
        )}
      </div>
    </div>
  );
}
