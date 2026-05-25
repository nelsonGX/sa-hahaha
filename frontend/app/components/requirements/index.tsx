'use client';

import { useState, useMemo } from 'react';
import type { CourseRecord, DetailedRequirements } from '../../types';
import type { CourseSlot } from './types';
import { getEffectiveCategory, buildSlots, buildFixedSlot, isPassed, earnedCredits } from './helpers';
import { DOMAIN_DISPLAY, DOMAIN_AUDIT_PREFIX } from './constants';
import BigSection from './BigSection';
import SubAccordion from './SubAccordion';
import CourseChip from './CourseChip';
import CourseModal from './CourseModal';
import PESlots from './PESlots';

interface RequirementsTreeProps {
  details: DetailedRequirements;
  records: CourseRecord[];
  enrollmentYear: number;
  departmentName?: string;
}

export default function RequirementsTree({ details, records, departmentName }: RequirementsTreeProps) {
  const [modalSlot, setModalSlot] = useState<CourseSlot | null>(null);

  const byCategory = useMemo(() => {
    const map: Record<string, CourseRecord[]> = {};
    for (const r of records) {
      const key = getEffectiveCategory(r);
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, [records]);

  const coreRecords     = byCategory['核心課程'] ?? [];
  const peRecords       = byCategory['核心課程(體育)'] ?? [];
  const basicRecords    = byCategory['基本能力課程'] ?? [];
  const requiredRecords = byCategory['必修'] ?? [];
  const electiveRecords = byCategory['選修'] ?? [];

  const coreSlots: CourseSlot[] = [
    buildFixedSlot(['大學入門'], 2, coreRecords, 'core-intro', '核心課程'),
    buildFixedSlot(['人生哲學'], 4, coreRecords, 'core-philosophy', '核心課程'),
    buildFixedSlot(['專業倫理', '企業倫理'], 2, coreRecords, 'core-ethics', '核心課程'),
  ];

  const chineseRecords = basicRecords.filter(r => r.course_name.includes('國文'));
  const foreignRecords = basicRecords.filter(r => !r.course_name.includes('國文'));
  const chineseSlots   = buildSlots(chineseRecords, 4, 'zh', '國文');
  const foreignSlots   = buildSlots(foreignRecords, 8, 'fl', '外語');

  const requiredSlots = buildSlots(requiredRecords, details.required_courses.target, 'req', '必修');
  const electiveSlots = buildSlots(electiveRecords, details.elective_courses.target, 'ele', '選修');

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* ── 1. 全人/核心課程 ── */}
        <BigSection
          title="核心"
          subtitle="全人/核心課程"
          earned={details.holistic_core.earned}
          target={details.holistic_core.target}
          accent="#615d59"
          defaultOpen
        >
          <div className="flex flex-col gap-2 pt-1">
            {coreSlots.map(s => <CourseChip key={s.id} slot={s} onClick={setModalSlot} />)}
            <PESlots peCourses={peRecords} peTarget={details.pe_semesters.target} onSlotClick={setModalSlot} />
          </div>
        </BigSection>

        {/* ── 2. 全人/基本能力課程 ── */}
        <BigSection
          title="能力"
          subtitle="全人/基本能力課程"
          earned={details.basic_skills.earned}
          target={details.basic_skills.target}
          accent="#4a5568"
        >
          <div className="flex flex-col gap-4 pt-1">
            <SubAccordion title="國文" earned={earnedCredits(chineseRecords)} target={4} defaultOpen>
              {chineseSlots.map(s => <CourseChip key={s.id} slot={s} onClick={setModalSlot} />)}
            </SubAccordion>
            <SubAccordion title="外國語文" earned={earnedCredits(foreignRecords)} target={8} defaultOpen>
              {foreignSlots.map(s => <CourseChip key={s.id} slot={s} onClick={setModalSlot} />)}
            </SubAccordion>
          </div>
        </BigSection>

        {/* ── 3. 通識涵養課程 ── */}
        <BigSection
          title="通識"
          subtitle="通識涵養課程"
          earned={details.general_ed.earned}
          target={details.general_ed.target}
          accent="#9b6fb3"
        >
          <div className="flex flex-col gap-2 pt-1">
            {Object.entries(details.general_ed.domains).map(([domainKey, domain]) => {
              const auditPrefix  = DOMAIN_AUDIT_PREFIX[domainKey] ?? `通識-${domainKey.slice(0, 2)}`;
              const domainRecords = byCategory[auditPrefix] ?? [];
              const domainSlots  = buildSlots(domainRecords, domain.target, `ge-${domainKey}`, auditPrefix);
              return (
                <SubAccordion
                  key={domainKey}
                  title={DOMAIN_DISPLAY[domainKey] ?? domainKey}
                  earned={domain.earned}
                  target={domain.target}
                >
                  {domainSlots.map(s => <CourseChip key={s.id} slot={s} onClick={setModalSlot} />)}
                </SubAccordion>
              );
            })}
            {(byCategory['通識課程'] ?? []).length > 0 && (
              <SubAccordion title="通識（未分域）" earned={earnedCredits(byCategory['通識課程'] ?? [])} target={0}>
                {(byCategory['通識課程'] ?? []).map((c, i) => {
                  const slot: CourseSlot = { id: `ge-other-${i}`, status: isPassed(c.score) ? 'passed' : 'failed', name: c.course_name, credits: c.credits, record: c };
                  return <CourseChip key={i} slot={slot} onClick={setModalSlot} />;
                })}
              </SubAccordion>
            )}
          </div>
        </BigSection>

        {/* ── 4. 必修 ── */}
        <BigSection
          title="必修"
          subtitle="系所必修"
          earned={details.required_courses.earned}
          target={details.required_courses.target}
          accent="#0075de"
        >
          <div className="flex flex-col gap-2 pt-1">
            {requiredSlots.map(s => <CourseChip key={s.id} slot={s} onClick={setModalSlot} />)}
          </div>
        </BigSection>

        {/* ── 5. 選修 ── */}
        <BigSection
          title="選修"
          subtitle="系所選修"
          earned={details.elective_courses.earned}
          target={details.elective_courses.target}
          accent="#2a9d99"
        >
          <div className="flex flex-col gap-2 pt-1">
            {electiveSlots.map(s => <CourseChip key={s.id} slot={s} onClick={setModalSlot} />)}
          </div>
        </BigSection>
      </div>

      <CourseModal slot={modalSlot} onClose={() => setModalSlot(null)} departmentName={departmentName} />
    </>
  );
}
