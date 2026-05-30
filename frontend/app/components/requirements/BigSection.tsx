'use client';

import { useEffect, useRef, useState } from 'react';
import { getProgressValue } from '../../utils/progress';
import ProgressBar from './ProgressBar';

const CREDIT_SECTION_EVENT = 'graduation-credit-section-request';

interface BigSectionProps {
  id?: string;
  title: string;
  subtitle: string;
  earned: number;
  target: number;
  accent: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function BigSection({
  id,
  title,
  subtitle,
  earned,
  target,
  accent,
  children,
  defaultOpen = false,
}: BigSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [highlighted, setHighlighted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { pct, done } = getProgressValue(earned, target);

  useEffect(() => {
    if (!id) return;

    let highlightTimer: number | undefined;
    let scrollTimer: number | undefined;

    const reveal = (behavior: ScrollBehavior) => {
      setOpen(true);
      setHighlighted(true);
      window.clearTimeout(highlightTimer);
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior, block: 'start' });
      }, 0);
      highlightTimer = window.setTimeout(() => setHighlighted(false), 1800);
    };

    const handleRequest = (event: Event) => {
      const requestedId = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (requestedId === id) {
        reveal('smooth');
      }
    };

    const handleHashChange = () => {
      if (window.location.hash === `#${id}`) {
        reveal('smooth');
      }
    };

    window.addEventListener(CREDIT_SECTION_EVENT, handleRequest);
    window.addEventListener('hashchange', handleHashChange);

    if (window.location.hash === `#${id}`) {
      reveal('auto');
    }

    return () => {
      window.removeEventListener(CREDIT_SECTION_EVENT, handleRequest);
      window.removeEventListener('hashchange', handleHashChange);
      window.clearTimeout(highlightTimer);
      window.clearTimeout(scrollTimer);
    };
  }, [id]);

  return (
    <div
      ref={sectionRef}
      id={id}
      className={`rounded-2xl bg-white border border-black/10 shadow-[var(--shadow-card)] overflow-hidden scroll-mt-24 transition-all duration-300 ${
        highlighted ? 'border-[#213183] ring-2 ring-[#213183] ring-offset-2 shadow-lg' : ''
      }`}
    >
      <button
        className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-[#fafafa] transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div
          className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-base font-bold"
          style={{ background: accent }}
        >
          {title}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1.5">
            <h2 className="font-bold text-base text-black/95 tracking-[-0.25px]">{subtitle}</h2>
            <span className={`text-sm font-semibold tabular-nums ${done ? 'text-[#2a9d99]' : 'text-[#615d59]'}`}>
              {earned} {target > 0 ? `/ ${target}` : ''}
            </span>
            {done && target > 0 && (
              <span className="text-xs font-semibold text-[#2a9d99] bg-[#f0faf9] px-2 py-0.5 rounded-full">已達標</span>
            )}
          </div>
          <ProgressBar earned={earned} target={target} />
        </div>
        <span
          className="text-sm text-[#a39e98] shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        >▾</span>
      </button>

      {open && (
        <div className="px-6 pb-6 flex flex-col gap-3 border-t border-black/6">
          <div className="flex justify-between items-center pt-4 pb-1">
            <p className="text-xs text-[#a39e98]">點擊子項目展開 · 點擊課程查看詳情</p>
            <p className="text-xs font-semibold text-[#615d59] tabular-nums">{pct}% 完成</p>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}
