import type { StudentInfo, CreditProgress, FailedCourse, RecommendedCourse } from '../types';

export const mockStudentInfo: StudentInfo = {
  name: '王小明',
  department: '資訊管理學系',
  enrollmentYear: '111',
  grade: '大三',
};

export const mockCreditProgress: CreditProgress[] = [
  { id: 'c1', category: '必修', earned: 45, required: 50 },
  { id: 'c2', category: '系選修', earned: 12, required: 21 },
  { id: 'c3', category: '通識', earned: 24, required: 28 },
  { id: 'c4', category: '總學分', earned: 81, required: 128 },
];

export const mockFailedCourses: FailedCourse[] = [
  { id: 'f1', name: '資料結構', credits: 3, grade: 45 },
  { id: 'f2', name: '微積分', credits: 3, grade: 55 },
];

export const mockRecommendations: RecommendedCourse[] = [
  { id: 'r1', categoryId: 'c2', name: '巨量資料分析', credits: 3, teacher: '李教授', time: 'D3-D4' },
  { id: 'r2', categoryId: 'c2', name: '企業資源規劃', credits: 3, teacher: '陳教授', time: 'D7-D8' },
  { id: 'r3', categoryId: 'c3', name: '哲學與人生', credits: 2, teacher: '林神父', time: 'D5-D6' },
];
