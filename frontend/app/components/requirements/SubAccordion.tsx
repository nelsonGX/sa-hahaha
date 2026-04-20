'use client';

import { useState } from 'react';
import { getProgressValue } from '../../utils/progress';
import ProgressBar from './ProgressBar';

interface SubAccordionProps {
  title: string;
  earned: number;
  target: number;
  unitLabel?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  indent?: boolean;
}

export default function SubAccordion({
  title,
  earned,
  target,
  unitLabel = '學分',
  children,
  defaultOpen = false,
  indent = false,
}: SubAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { done } = getProgressValue(earned, target);

  return (
    <div className={`rounded-xl border border-black/8 overflow-hidden ${indent ? 'ml-3' : ''}`}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#fafafa] hover:bg-[#f6f5f4] transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span
          className="text-[9px] text-[#a39e98] shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)' }}
        >▶</span>
        <span className="flex-1 text-sm font-semibold text-black/85">{title}</span>
        <span className={`text-xs font-semibold tabular-nums shrink-0 ${done ? 'text-[#2a9d99]' : 'text-[#615d59]'}`}>
          {earned}/{target} {unitLabel}
        </span>
        <div className="w-16 shrink-0">
          <ProgressBar earned={earned} target={target} />
        </div>
      </button>
      {open && (
        <div className="bg-white px-4 py-3 flex flex-col gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
