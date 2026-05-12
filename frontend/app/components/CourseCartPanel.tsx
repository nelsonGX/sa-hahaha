'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCourseCart } from './requirements/CourseCartContext';

export default function CourseCartPanel() {
  const { items, remove } = useCourseCart();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const totalCredits = items.reduce((s, i) => s + i.credits, 0);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-black text-white rounded-2xl px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:bg-black/85 transition-all active:scale-95"
      >
        <span className="text-base">📋</span>
        <span className="font-semibold text-sm">選課清單</span>
        {items.length > 0 && (
          <span className="bg-white text-black text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 -mr-1">
            {items.length}
          </span>
        )}
      </button>

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div
            className="relative bg-white w-full max-w-sm h-full shadow-[-4px_0_24px_rgba(0,0,0,0.12)] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/8">
              <div>
                <h2 className="font-bold text-lg text-black/90">選課清單</h2>
                <p className="text-xs text-[#615d59] mt-0.5">{items.length} 門課 · 共 {totalCredits} 學分</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-black/6 hover:bg-black/10 flex items-center justify-center text-sm text-[#615d59] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Course list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <span className="text-4xl">📭</span>
                  <p className="text-sm font-semibold text-black/60">清單是空的</p>
                  <p className="text-xs text-[#a39e98]">點選課程旁的「加入」即可加入清單</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.code} className="bg-[#f6f5f4] rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-[#a39e98]">{item.code}</p>
                        <p className="font-semibold text-sm text-black/90 leading-tight">{item.name}</p>
                      </div>
                      <button
                        onClick={() => remove(item.code)}
                        className="shrink-0 w-6 h-6 rounded-full bg-black/8 hover:bg-[#dd5b00]/15 hover:text-[#dd5b00] flex items-center justify-center text-xs text-[#a39e98] transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#615d59]">
                      <span>{item.credits} 學分</span>
                      <span>·</span>
                      <span>{item.teacher}</span>
                      <span>·</span>
                      <span>{item.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-[#a39e98]">補足：{item.addedFor}</span>
                      <span className={`text-[10px] font-semibold ${item.remaining <= 5 ? 'text-[#dd5b00]' : 'text-[#2a9d99]'}`}>
                        剩 {item.remaining} 個名額
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-black/8 px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-[#615d59]">預計修習學分</span>
                  <span className="font-bold text-xl text-black/90">{totalCredits}</span>
                </div>
                <button
                  onClick={() => router.push('/cart')}
                  className="w-full bg-black text-white font-semibold text-sm rounded-xl py-3 hover:bg-black/85 transition-colors active:scale-[0.98]"
                >
                  查看完整選課清單 →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
