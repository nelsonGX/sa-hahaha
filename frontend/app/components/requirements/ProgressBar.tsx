import { getProgressValue } from '../../utils/progress';

export default function ProgressBar({ earned, target }: { earned: number; target: number }) {
  const { pct, done } = getProgressValue(earned, target);
  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden bg-[#e7e1d9]">
      <div
        className={done ? 'h-full rounded-full bg-[#213183]' : 'h-full rounded-full bg-[#6f7ec9]'}
        style={{ width: `${pct}%`, minWidth: pct > 0 ? 4 : 0, transition: 'width 0.6s ease' }}
      />
    </div>
  );
}
