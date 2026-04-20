'use client';

import { useState } from 'react';
import type { StudentInfo, CreditProgress, FailedCourse, RecommendedCourse, PlannedCourse } from '../types';
import Navbar from './Navbar';
import CreditProgressCard from './CreditProgressCard';
import RecommendationPanel from './RecommendationPanel';
import FailedCoursesList from './FailedCoursesList';
import PlanList from './PlanList';

interface DashboardProps {
  studentInfo: StudentInfo;
  creditProgress: CreditProgress[];
  failedCourses: FailedCourse[];
  recommendations: RecommendedCourse[];
}

interface RecommendationState {
  categoryId: string;
  categoryName: string;
}

export default function Dashboard({
  studentInfo,
  creditProgress,
  failedCourses,
  recommendations,
}: DashboardProps) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourse[]>([]);
  const [activeRecommendation, setActiveRecommendation] = useState<RecommendationState | null>(null);

  function handleLogin(username: string) {
    setCurrentUser(username);
  }

  function handleLogout() {
    setCurrentUser(null);
  }

  function handleShowRecommendations(categoryId: string, categoryName: string) {
    setActiveRecommendation(
      activeRecommendation?.categoryId === categoryId ? null : { categoryId, categoryName }
    );
  }

  function handleAddToPlan(course: RecommendedCourse) {
    setPlannedCourses((prev) => {
      if (prev.some((c) => c.id === course.id)) return prev;
      return [...prev, { id: course.id, name: course.name, credits: course.credits, time: course.time }];
    });
  }

  const filteredRecommendations = activeRecommendation
    ? recommendations.filter((r) => r.categoryId === activeRecommendation.categoryId)
    : [];

  const totalEarned = creditProgress.find((c) => c.id === 'c4')?.earned ?? 0;
  const totalRequired = creditProgress.find((c) => c.id === 'c4')?.required ?? 0;
  const overallPct = Math.round((totalEarned / totalRequired) * 100);

  return (
    <>
      <Navbar currentUser={currentUser} onLogin={handleLogin} onLogout={handleLogout} />

      <main className="flex-1 bg-gray-50">
        {/* Hero header */}
        <div className="bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-indigo-300 text-sm font-medium mb-1">
                  {studentInfo.enrollmentYear} 學年度 · {studentInfo.department}
                </p>
                <h1 className="text-3xl font-bold tracking-tight">
                  {currentUser
                    ? `歡迎回來，${currentUser}`
                    : `${studentInfo.name} 的學習儀表板`}
                </h1>
                <p className="text-gray-400 mt-1">{studentInfo.grade}</p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl px-5 py-3">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{overallPct}%</p>
                  <p className="text-xs text-gray-300 mt-0.5">畢業進度</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{totalEarned}</p>
                  <p className="text-xs text-gray-300 mt-0.5">已修學分</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — progress */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wide">學分進度總覽</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {creditProgress.map((item) => (
                  <CreditProgressCard
                    key={item.id}
                    item={item}
                    onShowRecommendations={handleShowRecommendations}
                  />
                ))}
              </div>

              {activeRecommendation && (
                <RecommendationPanel
                  categoryName={activeRecommendation.categoryName}
                  recommendations={filteredRecommendations}
                  plannedCourses={plannedCourses}
                  onAddToPlan={handleAddToPlan}
                  onClose={() => setActiveRecommendation(null)}
                />
              )}
            </div>

            {/* Right — sidebar */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wide">概況</h2>
              <FailedCoursesList courses={failedCourses} />
              <PlanList courses={plannedCourses} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
