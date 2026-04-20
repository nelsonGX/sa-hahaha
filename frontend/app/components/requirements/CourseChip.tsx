import type { CourseSlot, SlotStatus } from './types';

const STYLES: Record<SlotStatus, string> = {
  passed:   'bg-[#f0faf9] border-[#2a9d99]/25 hover:border-[#2a9d99]/60 text-[#1d7572]',
  studying: 'bg-[#f0f5ff] border-[#0075de]/25 hover:border-[#0075de]/60 text-[#0055b3]',
  failed:   'bg-[#fff4ee] border-[#dd5b00]/25 hover:border-[#dd5b00]/60 text-[#dd5b00]',
  unknown:  'bg-[#f6f5f4] border-black/15 hover:border-black/30 text-[#615d59] border-dashed',
};

function StatusDot({ status }: { status: SlotStatus }) {
  if (status === 'studying') {
    return (
      <span className="relative flex w-2 h-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0075de] opacity-60" />
        <span className="relative inline-flex rounded-full w-2 h-2 bg-[#0075de]" />
      </span>
    );
  }
  const colors: Record<SlotStatus, string> = {
    passed:   'bg-[#2a9d99]',
    studying: '',
    failed:   'bg-[#dd5b00]',
    unknown:  'bg-[#a39e98]',
  };
  return <span className={`w-2 h-2 rounded-full shrink-0 ${colors[status]}`} />;
}

function metaLabel(slot: CourseSlot): string {
  if (slot.status === 'passed' && slot.record)
    return `${slot.record.semester} · ${slot.credits}cr · ${slot.record.score}`;
  if (slot.status === 'studying' && slot.record)
    return `${slot.record.semester} · ${slot.credits}cr · 修課中`;
  if (slot.status === 'failed' && slot.record)
    return `${slot.record.semester} · 不及格 ${slot.record.score}`;
  return `需 ${slot.credits} 學分`;
}

export default function CourseChip({ slot, onClick }: { slot: CourseSlot; onClick: (s: CourseSlot) => void }) {
  return (
    <button
      onClick={() => onClick(slot)}
      className={`rounded-lg px-3 py-2 text-sm cursor-pointer border flex items-center gap-2.5 w-full text-left transition-colors ${STYLES[slot.status]}`}
    >
      <StatusDot status={slot.status} />
      <span className="flex-1 font-medium truncate">
        {slot.status === 'unknown' && slot.name === '???' ? '待修課程' : slot.name}
      </span>
      <span className="text-xs opacity-50 shrink-0 tabular-nums">{metaLabel(slot)}</span>
    </button>
  );
}
