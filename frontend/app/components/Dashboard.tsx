'use client';

import { useState } from 'react';
import type { StudentData } from '../types';
import LoginForm from './LoginForm';
import Navbar from './Navbar';
import WarningBanner from './WarningBanner';
import RequirementsTree from './RequirementsTree';
import SummaryCards from './SummaryCards';
import CourseTable from './CourseTable';
import { CourseCartProvider } from './requirements/CourseCartContext';
import CourseCartPanel from './CourseCartPanel';
import SpecialRequirementsPanel from './SpecialRequirementsPanel';
import ProficiencyOnboarding from './ProficiencyOnboarding';

export default function Dashboard() {
  const [data, setData] = useState<StudentData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 當資料載入時，檢查是否有本地儲存的門檻資訊並合併
  const handleDataLoaded = (freshData: StudentData) => {
    const savedProf = localStorage.getItem(`prof_data_${freshData.student_id}`);
    if (savedProf && freshData.credit_summary.details) {
      const { english, computer } = JSON.parse(savedProf);
      const currentComputer = freshData.credit_summary.details.computer_proficiency;
      freshData.credit_summary.details.english_proficiency = english;
      freshData.credit_summary.details.computer_proficiency = {
        passed_count: computer.passed_count,
        target_count: currentComputer?.target_count ?? computer.target_count ?? 5,
        has_programming_elective: currentComputer?.has_programming_elective ?? computer.has_programming_elective ?? false
      };
      freshData.is_first_time = false;

      // 重新計算預警 (過濾掉已通過的非學分門檻)
      freshData.warnings = freshData.warnings.filter(w => {
        if (w.includes('英文畢業門檻') && english.status !== '未通過') return false;
        const isCompDone = computer.passed_count >= 5 || (computer.passed_count >= 3 && freshData.credit_summary.details?.computer_proficiency?.has_programming_elective);
        if (w.includes('資訊素養機測') && isCompDone) return false;
        return true;
      });
    }
    setData(freshData);

    // 如果沒合併過（且後端說是第一次），才顯示導引
    if (freshData.is_first_time && !localStorage.getItem(`onboarded_${freshData.student_id}`)) {
      setShowOnboarding(true);
    }
  };

  if (!data) {
    return <LoginForm onSuccess={handleDataLoaded} />;
  }

  const { student_id, department_name, enrollment_year, credit_summary, course_records } = data;

  // 動態計算最終顯示的預警列表
  const getFinalWarnings = () => {
    // 1. 過濾掉後端原始預警中與非學分門檻相關的部分 (由前端接管)
    let list = data.warnings.filter(w => !w.includes('英文畢業門檻') && !w.includes('資訊素養機測') && !w.includes('EMI 課程'));

    // 2. 根據目前狀態手動加入預警
    if (credit_summary.details) {
      const { english_proficiency: eng, computer_proficiency: cp, emi_proficiency: emi } = credit_summary.details;
      
      if (eng) {
        if (eng.status === '未通過') {
          list.push("📢 您尚未通過英文畢業門檻 (CEFR B2)，請記得參加檢定或自學方案。");
        } else if (eng.status === '自學方案中') {
          const remaining = 8 - eng.self_study_count;
          if (remaining > 0) {
            list.push(`📢 您的英文自學方案尚餘 ${remaining} 次測驗 (目前 ${eng.self_study_count}/8)。`);
          }
        }
      }
      
      if (cp) {
        const isCompDone = cp.passed_count >= 5 || (cp.passed_count >= 3 && cp.has_programming_elective);
        if (!isCompDone) {
          if (cp.passed_count >= 3) {
            list.push(`📢 您的資訊素養機測已通過 ${cp.passed_count} 題，請記得修習程式選修以符合替代方案。`);
          } else {
            list.push(`📢 您的資訊素養機測尚未達標 (僅通過 ${cp.passed_count} 題)，目標為 5 題。`);
          }
        }
      }

      if (emi) {
        const isEmiDone = emi.earned_credits >= 15 || emi.course_count >= 5;
        if (!isEmiDone) {
          list.push(`📢 您的 EMI 課程尚未達標 (目前 ${emi.course_count} 門 / ${emi.earned_credits} 學分)，目標為 5 門或 15 學分。`);
        }
      }
    }
    return list;
  };

  const finalWarnings = getFinalWarnings();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11.5) return "☀️ 早安！不要遲到喔";
    if (hour >= 11.5 && hour < 18.5) return "☕ 午安！記得吃午餐";
    if (hour >= 18.5 && hour < 23) return "🌙 晚安！有寫作業吧？";
    if (hour >= 23 || hour < 1) return "💤 不要熬夜了，趕快睡覺..";
    return "💀 都要岩壁了還不睡覺？";
  };

  const handleOnboardingComplete = ({ english, computer }: any) => {
    if (data.credit_summary.details) {
      // 重新過濾預警訊息
      const newWarnings = data.warnings.filter(w => {
        if (w.includes('英文畢業門檻') && english.status !== '未通過') return false;
        const isCompDone = computer.passed_count >= 5 || (computer.passed_count >= 3 && data.credit_summary.details?.computer_proficiency?.has_programming_elective);
        if (w.includes('資訊素養機測') && isCompDone) return false;
        return true;
      });

      const updatedData = {
        ...data,
        is_first_time: false,
        warnings: newWarnings,
        credit_summary: {
          ...data.credit_summary,
          details: {
            ...data.credit_summary.details,
            english_proficiency: english,
            computer_proficiency: computer
          }
        }
      };
      setData(updatedData);
      localStorage.setItem(`onboarded_${student_id}`, 'true');
      // 同時存儲具體數值以便下次自動填寫（可選）
      localStorage.setItem(`prof_data_${student_id}`, JSON.stringify({ english, computer }));
    }
    setShowOnboarding(false);
  };

  return (
    <CourseCartProvider>
      <Navbar
        studentId={student_id}
        departmentName={department_name}
        onReset={() => setData(null)}
      />

      <main className="bg-[#f6f5f4] min-h-screen">
        <div className="bg-white border-b border-black/10">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <p className="text-sm text-[#615d59] mb-1.5">
              {enrollment_year} 學年度入學 · {department_name}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div className="space-y-1">
                <p className="text-lg font-medium text-[#213183] animate-pulse">
                  {getGreeting()}
                </p>
                <h1 className="font-bold text-[40px] tracking-[-1.5px] leading-[1.1] text-black/95">
                  學號{' '}
                  <span className="font-mono tracking-[-0.5px]">{student_id}</span>
                </h1>
              </div>

              <div className="flex items-center gap-6 shrink-0 bg-[#f6f5f4] border border-black/10 rounded-xl px-6 py-4 shadow-(--shadow-card)">
                <div className="text-center">
                  <p className="font-bold text-[32px] tracking-[-1px] text-black/95 leading-none">
                    {credit_summary.total_earned}
                  </p>
                  <p className="text-xs text-[#615d59] mt-1">已修學分</p>
                </div>
                <div className="w-px h-9 bg-black/10" />
                <div className="text-center">
                  <p className={`font-semibold text-base leading-none ${finalWarnings.length > 0 ? 'text-[#dd5b00]' : 'text-[#2a9d99]'}`}>
                    {finalWarnings.length > 0 ? `${finalWarnings.length} 項預警` : '無預警'}
                  </p>
                  <p className="text-xs text-[#615d59] mt-1">畢業狀態</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10">
          <WarningBanner warnings={finalWarnings} />

          {credit_summary.details && (
            <>
              <SummaryCards details={credit_summary.details} records={course_records} />
              
              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight text-black/95 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#213183] rounded-full" />
                  其他畢業門檻
                </h2>
                <SpecialRequirementsPanel 
                  english={credit_summary.details.english_proficiency}
                  computer={credit_summary.details.computer_proficiency}
                  emi={credit_summary.details.emi_proficiency}
                  onEdit={() => setShowOnboarding(true)}
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight text-black/95 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#213183] rounded-full" />
                  畢業學分達成詳情
                </h2>
                <RequirementsTree
                  details={credit_summary.details}
                  records={course_records}
                  enrollmentYear={enrollment_year}
                  departmentName={department_name}
                />
              </div>

              <CourseTable records={course_records} enrollmentYear={enrollment_year} />
            </>
          )}
        </div>
      </main>

      <CourseCartPanel />

      {showOnboarding && credit_summary.details?.computer_proficiency && credit_summary.details?.english_proficiency && (
        <ProficiencyOnboarding
          initialComputer={credit_summary.details.computer_proficiency}
          initialEnglish={credit_summary.details.english_proficiency}
          onComplete={handleOnboardingComplete}
        />
      )}
    </CourseCartProvider>
  );
}
