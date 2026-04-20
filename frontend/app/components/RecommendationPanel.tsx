'use client';

import type { RecommendedCourse, PlannedCourse } from '../types';

interface RecommendationPanelProps {
  categoryName: string;
  recommendations: RecommendedCourse[];
  plannedCourses: PlannedCourse[];
  onAddToPlan: (course: RecommendedCourse) => void;
  onClose: () => void;
}

export default function RecommendationPanel({
  categoryName,
  recommendations,
  plannedCourses,
  onAddToPlan,
  onClose,
}: RecommendationPanelProps) {
  const plannedIds = new Set(plannedCourses.map((c) => c.id));

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold text-indigo-900">{categoryName} — 推薦選課</h4>
          <p className="text-xs text-indigo-500 mt-0.5">{recommendations.length} 門課程</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {recommendations.length === 0 ? (
        <p className="text-sm text-indigo-400 text-center py-4">目前無對應推薦課程</p>
      ) : (
        <div className="space-y-2">
          {recommendations.map((course) => {
            const isAdded = plannedIds.has(course.id);
            return (
              <div
                key={course.id}
                className="bg-white rounded-xl px-4 py-3 flex items-center justify-between border border-indigo-100"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{course.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {course.teacher} · {course.time} · {course.credits} 學分
                  </p>
                </div>
                <button
                  onClick={() => onAddToPlan(course)}
                  disabled={isAdded}
                  className={`ml-4 shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isAdded
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isAdded ? '已加入' : '加入計畫'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
