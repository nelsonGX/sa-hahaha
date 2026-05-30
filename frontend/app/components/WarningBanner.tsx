'use client';

import { useState } from 'react';

interface WarningBannerProps {
  warnings: string[];
}

export default function WarningBanner({ warnings }: WarningBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (warnings.length === 0) return null;

  return (
    <div className="rounded-xl bg-[rgba(221,91,0,0.06)] border border-[rgba(221,91,0,0.2)] overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-[rgba(221,91,0,0.04)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#dd5b00] text-white text-[10px] font-bold">
            {warnings.length}
          </span>
          <h3 className="font-bold text-sm text-[#dd5b00]">
            畢業預警項目
          </h3>
          {!isExpanded && (
            <span className="text-xs text-[#dd5b00]/60 truncate max-w-[300px] hidden sm:inline">
              {warnings[0]}
            </span>
          )}
        </div>
        
        <svg 
          className={`w-4 h-4 text-[#dd5b00] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {isExpanded && (
        <div className="px-5 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
          <div className="h-px bg-[rgba(221,91,0,0.1)] mb-3" />
          <ul className="flex flex-col gap-2.5">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-[#dd5b00] flex gap-2 leading-relaxed">
                <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-[#dd5b00]" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
