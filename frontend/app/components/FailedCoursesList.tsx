import type { FailedCourse } from '../types';

interface FailedCoursesListProps {
  courses: FailedCourse[];
}

export default function FailedCoursesList({ courses }: FailedCoursesListProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900">警示清單</h3>
        {courses.length > 0 && (
          <span className="ml-auto bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            {courses.length}
          </span>
        )}
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-3">無警示課程</p>
      ) : (
        <ul className="space-y-2">
          {courses.map((course) => (
            <li
              key={course.id}
              className="flex items-center justify-between p-3 bg-red-50/60 rounded-xl"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{course.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{course.credits} 學分 · 分數 {course.grade}</p>
              </div>
              <span className="shrink-0 ml-3 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                需重修
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
