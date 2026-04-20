'use client';

import { useState } from 'react';
import type { StudentData } from '../types';
import LoginForm from './LoginForm';
import Navbar from './Navbar';
import WarningBanner from './WarningBanner';
import SummaryCards from './SummaryCards';
import DetailedRequirementsPanel from './DetailedRequirementsPanel';
import CourseTable from './CourseTable';

export default function Dashboard() {
  const [data, setData] = useState<StudentData | null>(null);

  if (!data) {
    return <LoginForm onSuccess={setData} />;
  }

  const { student_id, department_name, enrollment_year, credit_summary, course_records, warnings } = data;

  return (
    <>
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
              <h1 className="font-bold text-[40px] tracking-[-1.5px] leading-[1.1] text-black/95">
                學號{' '}
                <span className="font-mono tracking-[-0.5px]">{student_id}</span>
              </h1>

              <div className="flex items-center gap-6 shrink-0 bg-[#f6f5f4] border border-black/10 rounded-xl px-6 py-4 shadow-(--shadow-card)">
                <div className="text-center">
                  <p className="font-bold text-[32px] tracking-[-1px] text-black/95 leading-none">
                    {credit_summary.total_earned}
                  </p>
                  <p className="text-xs text-[#615d59] mt-1">已修學分</p>
                </div>
                <div className="w-px h-9 bg-black/10" />
                <div className="text-center">
                  <p className={`font-semibold text-base leading-none ${warnings.length > 0 ? 'text-[#dd5b00]' : 'text-[#2a9d99]'}`}>
                    {warnings.length > 0 ? `${warnings.length} 項預警` : '無預警'}
                  </p>
                  <p className="text-xs text-[#615d59] mt-1">畢業狀態</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-6">
          <WarningBanner warnings={warnings} />

          {credit_summary.details && (
            <>
              <SummaryCards details={credit_summary.details} />
              <DetailedRequirementsPanel details={credit_summary.details} />
            </>
          )}

          <CourseTable records={course_records} />
        </div>
      </main>
    </>
  );
}
