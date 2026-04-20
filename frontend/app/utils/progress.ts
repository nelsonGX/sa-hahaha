export interface ProgressValue {
  earned: number;
  target: number;
  pct: number;
  done: boolean;
}

function toSafeNumber(value: unknown) {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function getProgressValue(earned: unknown, target: unknown): ProgressValue {
  const safeEarned = Math.max(0, toSafeNumber(earned));
  const safeTarget = Math.max(0, toSafeNumber(target));
  const pct = safeTarget > 0 ? Math.min(100, Math.round((safeEarned / safeTarget) * 100)) : 0;

  return {
    earned: safeEarned,
    target: safeTarget,
    pct,
    done: safeTarget > 0 && safeEarned >= safeTarget,
  };
}
