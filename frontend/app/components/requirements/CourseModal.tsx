'use client';

import { useState, useEffect, useMemo } from 'react';
import type { CourseSlot } from './types';
import { fetchRecommendations, type RecommendedCourse } from './fakeRecommendationsApi';
import { useCourseCart } from './CourseCartContext';

function SeatBadge({ remaining, seats }: { remaining: number; seats: number }) {
  const pct = remaining / seats;
  const color = pct < 0.1 ? 'text-[#dd5b00] bg-[#fff4ee]' : pct < 0.3 ? 'text-[#9d6b00] bg-[#fffbf0]' : 'text-[#2a9d99] bg-[#f0faf9]';
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${color}`}>
      剩 {remaining} 名
    </span>
  );
}

function RecommendedCourseCard({ course, addedFor }: { course: RecommendedCourse; addedFor: string }) {
  const { add, remove, has } = useCourseCart();
  const inCart = has(course.code);

  return (
    <div className="flex items-center gap-3 bg-[#f6f5f4] hover:bg-[#f0efee] rounded-xl px-4 py-3 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-mono text-[#a39e98]">{course.code}</span>
          <span className="text-[10px] font-semibold text-[#615d59]">{course.credits} 學分</span>
          <SeatBadge remaining={course.remaining} seats={course.seats} />
        </div>
        <p className="text-sm font-semibold text-black/85 leading-tight truncate">{course.name}</p>
        <p className="text-xs text-[#a39e98] mt-0.5">{course.teacher} · {course.time}</p>
      </div>
      <button
        onClick={() => inCart ? remove(course.code) : add(course, addedFor)}
        className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
          inCart
            ? 'bg-[#2a9d99]/12 text-[#1d7572] hover:bg-[#dd5b00]/10 hover:text-[#dd5b00]'
            : 'bg-black/6 text-[#615d59] hover:bg-black hover:text-white'
        }`}
      >
        {inCart ? '已加入' : '+ 加入'}
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#f6f5f4] rounded-xl px-4 py-3 flex flex-col gap-2 animate-pulse">
      <div className="flex gap-2">
        <div className="h-3 w-14 bg-black/10 rounded" />
        <div className="h-3 w-10 bg-black/10 rounded" />
      </div>
      <div className="h-4 w-3/4 bg-black/10 rounded" />
      <div className="h-3 w-1/2 bg-black/8 rounded" />
    </div>
  );
}

export default function CourseModal({ slot, onClose }: { slot: CourseSlot | null; onClose: () => void }) {
  const [courses, setCourses] = useState<RecommendedCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCredits, setFilterCredits] = useState<number | null>(null);

  const showRecommendations = slot?.status === 'unknown' || slot?.status === 'failed';
  const addedFor = slot?.category ?? slot?.name ?? '課程';

  useEffect(() => {
    if (!slot || !showRecommendations) return;
    setLoading(true);
    setCourses([]);
    setSearch('');
    setFilterCredits(null);
    fetchRecommendations(slot.category ?? '', slot.credits)
      .then(setCourses)
      .finally(() => setLoading(false));
  }, [slot?.id]);

  const filtered = useMemo(() => {
    let list = courses;
    if (filterCredits !== null) list = list.filter(c => c.credits === filterCredits);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.teacher.toLowerCase().includes(q)
      );
    }
    return list;
  }, [courses, search, filterCredits]);

  const creditOptions = useMemo(() => [...new Set(courses.map(c => c.credits))].sort(), [courses]);

  if (!slot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className={`relative bg-white rounded-2xl p-6 w-full shadow-[var(--shadow-deep)] border border-black/10 ${showRecommendations ? 'max-w-lg' : 'max-w-sm'}`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/6 hover:bg-black/10 flex items-center justify-center text-sm text-[#615d59] transition-colors"
        >
          ✕
        </button>

        {slot.status === 'passed' && slot.record ? (
          <>
            <p className="text-xs font-semibold text-[#2a9d99] mb-1 uppercase tracking-widest">已通過</p>
            <h3 className="font-bold text-xl text-black/95 mb-1 pr-8">{slot.name}</h3>
            <p className="text-sm text-[#615d59] mb-5">{slot.record.semester} · {slot.record.category}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f6f5f4] rounded-xl p-4 text-center">
                <p className="text-xs text-[#615d59] mb-1">學分</p>
                <p className="font-bold text-2xl">{slot.credits}</p>
              </div>
              <div className="bg-[#f0faf9] rounded-xl p-4 text-center">
                <p className="text-xs text-[#615d59] mb-1">成績</p>
                <p className="font-bold text-2xl text-[#1d7572]">{slot.record.score}</p>
              </div>
            </div>
          </>
        ) : slot.status === 'studying' && slot.record ? (
          <>
            <p className="text-xs font-semibold text-[#0075de] mb-1 uppercase tracking-widest">修課中</p>
            <h3 className="font-bold text-xl text-black/95 mb-1 pr-8">{slot.name}</h3>
            <p className="text-sm text-[#615d59] mb-5">{slot.record.semester} · {slot.record.category}</p>
            <div className="bg-[#f0f5ff] border border-[#0075de]/15 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-[#0055b3] mb-1">學分數</p>
              <p className="font-bold text-2xl text-[#0055b3]">{slot.credits}</p>
              <p className="text-xs text-[#615d59] mt-1">成績待公布</p>
            </div>
          </>
        ) : (
          <>
            <p className={`text-xs font-semibold mb-1 uppercase tracking-widest ${slot.status === 'failed' ? 'text-[#dd5b00]' : 'text-[#615d59]'}`}>
              {slot.status === 'failed' ? '不及格' : '尚未修習'}
            </p>
            <h3 className="font-bold text-xl text-black/95 mb-1 pr-8">
              {slot.name === '???' ? '待選課程' : slot.name}
            </h3>
            {slot.status === 'failed' && slot.record && (
              <p className="text-sm text-[#dd5b00] mb-0.5">成績 {slot.record.score} · {slot.record.semester}</p>
            )}
            <p className="text-sm text-[#615d59] mb-5">尚需修習 {slot.credits} 學分</p>

            {/* Recommendations header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-black/80">選課建議</p>
              <span className="text-[10px] bg-[#fff4ee] text-[#dd5b00] border border-[#dd5b00]/20 font-semibold px-2 py-0.5 rounded-full">測試版</span>
            </div>

            {/* Search + filter */}
            {!loading && courses.length > 0 && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜尋課程名稱、老師…"
                  className="flex-1 text-sm bg-[#f6f5f4] border border-black/8 rounded-lg px-3 py-2 outline-none focus:border-black/25 placeholder:text-[#c4bfba] transition-colors"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => setFilterCredits(null)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${filterCredits === null ? 'bg-black text-white' : 'bg-[#f6f5f4] text-[#615d59] hover:bg-[#eeeceb]'}`}
                  >
                    全部
                  </button>
                  {creditOptions.map(cr => (
                    <button
                      key={cr}
                      onClick={() => setFilterCredits(filterCredits === cr ? null : cr)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${filterCredits === cr ? 'bg-black text-white' : 'bg-[#f6f5f4] text-[#615d59] hover:bg-[#eeeceb]'}`}
                    >
                      {cr}學分
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Course list */}
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto -mx-1 px-1">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#a39e98]">
                  {search ? '找不到符合的課程' : '目前無推薦課程'}
                </div>
              ) : (
                filtered.map(c => (
                  <RecommendedCourseCard key={c.code} course={c} addedFor={addedFor} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
