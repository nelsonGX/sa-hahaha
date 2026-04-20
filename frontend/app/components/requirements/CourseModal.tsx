import type { CourseSlot } from './types';

export default function CourseModal({ slot, onClose }: { slot: CourseSlot | null; onClose: () => void }) {
  if (!slot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-[var(--shadow-deep)] border border-black/10"
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
              <p className="text-sm text-[#dd5b00] mb-4">成績 {slot.record.score} · {slot.record.semester}</p>
            )}
            {slot.status === 'unknown' && (
              <p className="text-sm text-[#615d59] mb-4">尚需修習 {slot.credits} 學分</p>
            )}
            <div className="bg-[#fff4ee] border border-[#dd5b00]/15 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-[#dd5b00] mb-1">選課建議</p>
              <p className="text-sm text-[#615d59]">非選課時間</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
