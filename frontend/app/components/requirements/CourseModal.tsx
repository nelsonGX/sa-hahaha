import type { CourseSlot } from './types';

interface MockCourse {
  code: string;
  name: string;
  credits: number;
  teacher: string;
  time: string;
}

// Mock recommendations — replace with real API data later
const MOCK_COURSES: MockCourse[] = [
  { code: 'GE1001', name: '生活中的科學', credits: 2, teacher: '陳明義', time: '週二 3-4' },
  { code: 'GE1023', name: '環境科學概論', credits: 2, teacher: '林佳慧', time: '週四 5-6' },
  { code: 'GE1045', name: '宇宙與人類', credits: 2, teacher: '黃宇翔', time: '週一 7-8' },
  { code: 'GE2010', name: '經濟學與生活', credits: 2, teacher: '王建中', time: '週三 1-2' },
  { code: 'GE2031', name: '法律與人權', credits: 2, teacher: '李玉萍', time: '週五 3-4' },
  { code: 'CS3201', name: '機器學習', credits: 3, teacher: '張博文', time: '週二 1-3' },
];

function RecommendedCourseCard({ course }: { course: MockCourse }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#f6f5f4] hover:bg-[#f0efee] rounded-xl px-4 py-3 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-mono text-[#a39e98]">{course.code}</span>
          <span className="text-[10px] font-semibold text-[#615d59]">{course.credits} 學分</span>
        </div>
        <p className="text-sm font-semibold text-black/85 leading-tight truncate">{course.name}</p>
        <p className="text-xs text-[#a39e98] mt-0.5">{course.teacher} · {course.time}</p>
      </div>
      <button className="shrink-0 text-xs font-semibold text-[#0075de] hover:text-[#0055b3] transition-colors whitespace-nowrap">
        + 加入
      </button>
    </div>
  );
}

export default function CourseModal({ slot, onClose }: { slot: CourseSlot | null; onClose: () => void }) {
  if (!slot) return null;

  const showRecommendations = slot.status === 'unknown' || slot.status === 'failed';

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
              <p className="text-sm text-[#dd5b00] mb-1">成績 {slot.record.score} · {slot.record.semester}</p>
            )}
            <p className="text-sm text-[#615d59] mb-5">尚需修習 {slot.credits} 學分</p>

            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-black/80">選課建議</p>
              <span className="text-[10px] bg-[#fff4ee] text-[#dd5b00] border border-[#dd5b00]/20 font-semibold px-2 py-0.5 rounded-full">測試版</span>
            </div>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {MOCK_COURSES.map(c => (
                <RecommendedCourseCard key={c.code} course={c} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
