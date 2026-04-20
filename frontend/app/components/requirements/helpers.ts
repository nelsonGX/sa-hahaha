import type { CourseRecord } from '../../types';
import type { CourseSlot, SlotStatus } from './types';

export function isPassed(score: string): boolean {
  const num = parseInt(score);
  if (!isNaN(num)) return num >= 60;
  return ['抵免', '通過', '及格'].includes(score);
}

// A course is "studying" when it has no grade yet (currently enrolled)
export function isStudying(score: string): boolean {
  const s = score.trim();
  if (!s || s === '-' || s === '--') return true;
  if (['修課中', '上課中', '選課中'].includes(s)) return true;
  const num = parseInt(s);
  if (!isNaN(num)) return false;
  return !['抵免', '通過', '及格', '停修', '不及格'].includes(s);
}

export function slotStatus(score: string): SlotStatus {
  if (isStudying(score)) return 'studying';
  if (isPassed(score)) return 'passed';
  return 'failed';
}

// Sum of credits for courses that have a confirmed passing grade
export function earnedCredits(courses: CourseRecord[]): number {
  return courses.filter(c => isPassed(c.score)).reduce((s, c) => s + c.credits, 0);
}

// Re-derive category for non-passed courses (backend marks them all "不及格/停修")
export function getEffectiveCategory(r: CourseRecord): string {
  if (r.audit_category !== '不及格/停修') return r.audit_category;
  const n = r.course_name;
  const c = r.category;
  if (['大學入門', '人生哲學', '專業倫理', '企業倫理'].some(k => n.includes(k))) return '核心課程';
  if (['體育', '羽球', '桌球', '游泳', '網球', '排球', '籃球'].some(k => n.includes(k))) return '核心課程(體育)';
  if (['國文', '外語', '外國語文', '英語', '英文', '法文', '德文', '日文', '西班牙文', '韓文'].some(k => n.includes(k))) return '基本能力課程';
  if (c.includes('通識')) {
    if (c.includes('人文')) return '通識-人文';
    if (c.includes('自然')) return '通識-自然';
    if (c.includes('社會')) return '通識-社會';
    return '通識課程';
  }
  if (c.includes('必修')) return '必修';
  if (c.includes('選修')) return '選修';
  return '不及格/停修';
}

// Build course slots for a category, appending ??? for remaining credit shortfall.
// Studying courses count against the shortfall (likely to complete) but don't count as earned.
export function buildSlots(courses: CourseRecord[], targetCredits: number, prefix: string): CourseSlot[] {
  const slots: CourseSlot[] = courses.map((c, i) => ({
    id: `${prefix}-${i}`,
    status: slotStatus(c.score),
    name: c.course_name,
    credits: c.credits,
    record: c,
  }));
  const committed = courses
    .filter(c => isPassed(c.score) || isStudying(c.score))
    .reduce((s, c) => s + c.credits, 0);
  const remaining = targetCredits - committed;
  if (remaining > 0) slots.push({ id: `${prefix}-unknown`, status: 'unknown', name: '???', credits: remaining });
  return slots;
}

// Build a slot for a single fixed required course (e.g. 大學入門, 人生哲學)
export function buildFixedSlot(keywords: string[], credits: number, pool: CourseRecord[], id: string): CourseSlot {
  const found = pool.find(c => keywords.some(k => c.course_name.includes(k)));
  if (found) return { id, status: slotStatus(found.score), name: found.course_name, credits: found.credits, record: found };
  return { id, status: 'unknown', name: keywords[0], credits };
}
