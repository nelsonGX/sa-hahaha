export interface CourseRecord {
  semester: string;
  course_name: string;
  credits: number;
  score: string;
  category: string;
  audit_category: string;
}

export interface CreditCategory {
  earned: number;
  target: number;
}

export interface GeneralEducationCredit {
  earned: number;
  target: number;
  domains: Record<string, CreditCategory>;
}

export interface DetailedRequirements {
  required_courses: CreditCategory;
  elective_courses: CreditCategory;
  holistic_education: CreditCategory;
  holistic_core: CreditCategory;
  basic_skills: CreditCategory;
  general_ed: GeneralEducationCredit;
  pe_semesters: CreditCategory;
}

export interface CreditSummary {
  total_earned: number;
  details?: DetailedRequirements;
}

export interface StudentData {
  student_id: string;
  department_name: string;
  enrollment_year: number;
  course_records: CourseRecord[];
  credit_summary: CreditSummary;
  warnings: string[];
}
