'use client';

import type { CreditProgress } from '../types';

interface CreditProgressCardProps {
  item: CreditProgress;
  onShowRecommendations: (categoryId: string, categoryName: string) => void;
}

export default function CreditProgressCard({ item, onShowRecommendations }: CreditProgressCardProps) {
  const percentage = Math.min(100, Math.round((item.earned / item.required) * 100));
  const isCompleted = item.earned >= item.required;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{item.category}</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            {item.earned} / {item.required} 學分
          </p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isCompleted
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {percentage}%
        </span>
      </div>

      <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
            isCompleted
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
              : percentage >= 70
              ? 'bg-gradient-to-r from-indigo-400 to-indigo-500'
              : 'bg-gradient-to-r from-amber-400 to-amber-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {!isCompleted && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">還差 {item.required - item.earned} 學分</span>
          <button
            onClick={() => onShowRecommendations(item.id, item.category)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            查看建議課程
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {isCompleted && (
        <p className="mt-3 text-xs text-emerald-600 font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          已達標
        </p>
      )}
    </div>
  );
}
