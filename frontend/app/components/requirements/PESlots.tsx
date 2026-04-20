import type { CourseRecord } from '../../types';
import type { CourseSlot } from './types';
import { isPassed, isStudying, slotStatus } from './helpers';
import SubAccordion from './SubAccordion';
import CourseChip from './CourseChip';

interface PESlotsProps {
  peCourses: CourseRecord[];
  peTarget: number;
  onSlotClick: (s: CourseSlot) => void;
}

export default function PESlots({ peCourses, peTarget, onSlotClick }: PESlotsProps) {
  const slots: CourseSlot[] = peCourses.map((c, i) => ({
    id: `pe-${i}`,
    status: slotStatus(c.score),
    name: c.course_name,
    credits: c.credits,
    record: c,
  }));

  const passedCount    = peCourses.filter(c => isPassed(c.score)).length;
  const committedCount = peCourses.filter(c => isPassed(c.score) || isStudying(c.score)).length;

  for (let i = committedCount; i < peTarget; i++) {
    slots.push({ id: `pe-unknown-${i}`, status: 'unknown', name: '???', credits: 0 });
  }

  return (
    <SubAccordion title="體育" earned={passedCount} target={peTarget} unitLabel="學期" indent>
      {slots.map(s => <CourseChip key={s.id} slot={s} onClick={onSlotClick} />)}
    </SubAccordion>
  );
}
