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

      <main style={{ background: 'var(--warm-white)', minHeight: '100vh' }}>
        <div
          style={{
            background: '#ffffff',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="max-w-6xl mx-auto px-6 py-10">
            <p style={{ fontSize: 14, color: 'var(--warm-gray-300)', marginBottom: 6 }}>
              {enrollment_year} 學年度入學 · {department_name}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <h1
                className="font-bold"
                style={{
                  fontSize: 40,
                  letterSpacing: '-1.5px',
                  lineHeight: 1.1,
                  color: 'rgba(0,0,0,0.95)',
                }}
              >
                學號{' '}
                <span className="font-mono" style={{ letterSpacing: '-0.5px' }}>
                  {student_id}
                </span>
              </h1>

              <div
                className="flex items-center gap-6 shrink-0"
                style={{
                  background: 'var(--warm-white)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px 24px',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="text-center">
                  <p
                    className="font-bold"
                    style={{ fontSize: 32, letterSpacing: '-1px', color: 'rgba(0,0,0,0.95)', lineHeight: 1 }}
                  >
                    {credit_summary.total_earned}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--warm-gray-300)', marginTop: 4 }}>已修學分</p>
                </div>
                <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
                <div className="text-center">
                  <p
                    className="font-semibold"
                    style={{
                      fontSize: 16,
                      color: warnings.length > 0 ? '#dd5b00' : '#2a9d99',
                      lineHeight: 1,
                    }}
                  >
                    {warnings.length > 0 ? `${warnings.length} 項預警` : '無預警'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--warm-gray-300)', marginTop: 4 }}>畢業狀態</p>
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
