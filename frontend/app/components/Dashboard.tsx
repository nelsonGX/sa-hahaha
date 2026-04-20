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

      <main className="bg-slate-50 min-h-screen">
        {/* Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-indigo-300 text-sm mb-1">
                  {enrollment_year} 學年度入學 · {department_name}
                </p>
                <h1 className="text-3xl font-bold tracking-tight">
                  學號 <span className="font-mono">{student_id}</span>
                </h1>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-2xl px-6 py-3">
                <div className="text-center">
                  <p className="text-3xl font-bold">{credit_summary.total_earned}</p>
                  <p className="text-xs text-slate-300 mt-0.5">已修學分</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <p className={`text-lg font-semibold ${warnings.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {warnings.length > 0 ? `${warnings.length} 項預警` : '無預警'}
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">畢業狀態</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
