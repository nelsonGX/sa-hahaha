export interface StudentInfo {
  name: string;
  department: string;
  enrollmentYear: string;
  grade: string;
}

export interface CreditProgress {
  id: string;
  category: string;
  earned: number;
  required: number;
}

export interface Course {
  id: string;
  name: string;
  credits: number;
  teacher?: string;
  time?: string;
}

export interface FailedCourse extends Course {
  grade: number;
}

export interface RecommendedCourse extends Course {
  categoryId: string;
  teacher: string;
  time: string;
}

export interface PlannedCourse extends Course {
  time: string;
}
