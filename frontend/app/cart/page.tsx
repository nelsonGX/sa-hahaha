'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { CartItem } from '../components/requirements/CourseCartContext';

const STORAGE_KEY = 'course-cart';

function groupByArea(items: CartItem[]): Record<string, CartItem[]> {
  return items.reduce<Record<string, CartItem[]>>((acc, item) => {
    const key = item.addedFor;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      onClick={copy}
      title="點擊複製"
      className={`font-mono font-bold text-base px-3 py-1.5 rounded-lg transition-all select-all ${
        copied
          ? 'bg-[#2a9d99]/15 text-[#1d7572]'
          : 'bg-[#f6f5f4] text-black/80 hover:bg-black hover:text-white'
      }`}
    >
      {copied ? '✓ 已複製' : text}
    </button>
  );
}

function CourseRow({ item }: { item: CartItem }) {
  const lowSeats = item.remaining <= 5;

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-black/6 last:border-0">
      <div className="shrink-0">
        <CopyButton text={item.code} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-black/90 truncate">{item.name}</p>
        <p className="text-xs text-[#615d59] mt-0.5">{item.teacher} · {item.time}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-black/80">{item.credits} 學分</p>
        <p className={`text-xs mt-0.5 font-medium ${lowSeats ? 'text-[#dd5b00]' : 'text-[#a39e98]'}`}>
          剩 {item.remaining} 名額{lowSeats ? ' ⚠' : ''}
        </p>
      </div>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [copyAllDone, setCopyAllDone] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, []);

  const totalCredits = items.reduce((s, i) => s + i.credits, 0);
  const groups = groupByArea(items);
  const allCodes = items.map(i => i.code).join('\n');

  const copyAll = () => {
    navigator.clipboard.writeText(allCodes).then(() => {
      setCopyAllDone(true);
      setTimeout(() => setCopyAllDone(false), 2000);
    });
  };

  const clearCart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  };

  return (
    <div className="min-h-screen bg-[#f6f5f4]">
      {/* Header */}
      <div className="bg-white border-b border-black/10 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-black/6 hover:bg-black/10 flex items-center justify-center text-sm text-[#615d59] transition-colors"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg text-black/90">選課清單</h1>
            <p className="text-xs text-[#615d59]">{items.length} 門課 · 共 {totalCredits} 學分</p>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={copyAll}
                className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 ${
                  copyAllDone
                    ? 'bg-[#2a9d99]/12 text-[#1d7572]'
                    : 'bg-black text-white hover:bg-black/85'
                }`}
              >
                {copyAllDone ? '✓ 已複製全部' : '複製所有課號'}
              </button>
              <button
                onClick={clearCart}
                className="text-sm font-semibold px-4 py-2 rounded-xl text-[#dd5b00] bg-[#fff4ee] hover:bg-[#dd5b00]/15 transition-colors"
              >
                清空
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <span className="text-5xl">📭</span>
            <p className="font-semibold text-black/60">選課清單是空的</p>
            <button
              onClick={() => router.back()}
              className="text-sm font-semibold text-[#0075de] hover:text-[#0055b3] transition-colors"
            >
              ← 返回加入課程
            </button>
          </div>
        ) : (
          <>
            {/* Usage hint */}
            <div className="bg-[#fffbf0] border border-[#e6c84a]/30 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-base mt-0.5 shrink-0">💡</span>
              <p className="text-sm text-[#7a6200]">
                點擊課號可複製，再貼到選課系統的搜尋欄即可找到課程。也可以「複製所有課號」一次取得全部。
              </p>
            </div>

            {/* Groups */}
            {Object.entries(groups).map(([area, areaItems]) => (
              <div key={area} className="bg-white rounded-2xl border border-black/8 overflow-hidden">
                <div className="px-5 py-3 bg-[#fafafa] border-b border-black/6 flex items-center justify-between">
                  <p className="text-sm font-semibold text-black/80">{area}</p>
                  <p className="text-xs text-[#615d59]">
                    {areaItems.reduce((s, i) => s + i.credits, 0)} 學分
                  </p>
                </div>
                {areaItems.map(item => <CourseRow key={item.code} item={item} />)}
              </div>
            ))}

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-black/8 px-5 py-4 flex items-center justify-between">
              <p className="text-sm text-[#615d59]">合計</p>
              <p className="font-bold text-2xl text-black/90">{totalCredits} 學分</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
