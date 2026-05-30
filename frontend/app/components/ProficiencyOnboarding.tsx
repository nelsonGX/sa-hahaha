'use client';

import { useState } from 'react';
import type { EnglishProficiency, ComputerProficiency } from '../types';

interface OnboardingModalProps {
  onComplete: (data: { english: EnglishProficiency; computer: ComputerProficiency }) => void;
  initialComputer: ComputerProficiency;
  initialEnglish: EnglishProficiency;
}

export default function ProficiencyOnboarding({ onComplete, initialComputer, initialEnglish }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [english, setEnglish] = useState<EnglishProficiency>(initialEnglish);
  const [computerCount, setComputerCount] = useState(initialComputer.passed_count);

  const handleFinish = () => {
    onComplete({
      english,
      computer: {
        ...initialComputer,
        passed_count: computerCount
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-black/10">
        {/* Header Section - Clean & Subtle */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8c8782] bg-[#f6f5f4] px-2 py-0.5 rounded">
              Step {step} of 2
            </span>
          </div>
          <h2 className="text-xl font-bold text-black/90">畢業門檻補充</h2>
          <p className="text-sm text-[#8c8782] mt-1">
            請協助填寫以下資訊以完成畢業審查。
          </p>
        </div>

        {/* Content Section */}
        <div className="px-8 pb-8 pt-4">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#2d2a26]">
                  英文畢業門檻狀態
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: '已通過 (B2 標籤)', status: '已通過', method: '外部檢定' },
                    { label: '管院自學方案中', status: '自學方案中', method: '自學方案' },
                    { label: '尚未通過', status: '未通過', method: '待檢定' }
                  ].map((opt) => (
                    <button
                      key={opt.status}
                      onClick={() => setEnglish({ ...english, status: opt.status, method: opt.method })}
                      className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        english.status === opt.status 
                        ? 'border-[#213183] bg-[#213183]/5 text-[#213183]' 
                        : 'border-[#f6f5f4] hover:border-[#e7e1d9] text-[#615d59]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">{opt.label}</span>
                        {english.status === opt.status && (
                          <div className="w-2 h-2 rounded-full bg-[#213183]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {english.status === '自學方案中' && (
                <div className="p-4 rounded-xl bg-[#f6f5f4] space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center text-xs font-bold text-[#615d59]">
                    <span>自學測驗次數</span>
                    <span className="text-[#213183]">{english.self_study_count} / 8</span>
                  </div>
                  <input 
                    type="range" min="0" max="8" value={english.self_study_count}
                    onChange={(e) => setEnglish({ ...english, self_study_count: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#e7e1d9] rounded-full appearance-none cursor-pointer accent-[#213183]"
                  />
                </div>
              )}

              <button 
                onClick={() => setStep(2)}
                className="w-full py-3 bg-[#213183] text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                下一步
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#2d2a26]">
                  資訊素養機測題數
                </label>
                <p className="text-xs text-[#8c8782]">
                  畢業前須通過 5 題機測題目；或通過 3 題且加修本系程式選修。
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setComputerCount(num)}
                      className={`aspect-square rounded-lg flex items-center justify-center font-bold transition-all ${
                        computerCount === num 
                        ? 'bg-[#213183] text-white' 
                        : 'bg-[#f6f5f4] text-[#8c8782] hover:bg-[#e7e1d9]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setStep(1)}
                  className="px-4 py-3 text-[#615d59] font-bold hover:bg-[#f6f5f4] rounded-xl transition-all"
                >
                  返回
                </button>
                <button 
                  onClick={handleFinish}
                  className="flex-1 py-3 bg-[#213183] text-white rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  確認修改
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
