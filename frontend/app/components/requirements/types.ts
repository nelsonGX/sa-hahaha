import type { CourseRecord } from '../../types';

export type SlotStatus = 'passed' | 'studying' | 'failed' | 'unknown';

export interface CourseSlot {
  id: string;
  status: SlotStatus;
  name: string;
  credits: number;
  record?: CourseRecord;
}
