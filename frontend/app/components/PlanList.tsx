import type { PlannedCourse } from '../types';

interface PlanListProps {
  courses: PlannedCourse[];
}

export default function PlanList({ courses }: PlanListProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900">計畫選課清單</h3>
        {courses.length > 0 && (
          <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            {courses.length}
          </span>
        )}
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-3">尚未加入任何課程</p>
      ) : (
        <>
          <ul className="space-y-2">
            {courses.map((course) => (
              <li
                key={course.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <p className="text-sm font-medium text-gray-800">{course.name}</p>
                <span className="text-xs text-gray-400 ml-3">{course.time}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl">
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-700">系統已偵測衝堂狀況：目前無衝突</p>
          </div>
        </>
      )}
    </div>
  );
}
