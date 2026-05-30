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

export interface EnglishProficiency {
  status: string;
  method: string;
  test_score?: string;
  self_study_count: number;
}

export interface ComputerProficiency {
  passed_count: number;
  target_count: number;
  has_programming_elective: boolean;
}

export interface EMIProficiency {
  earned_credits: number;
  course_count: number;
  target_credits: number;
  target_courses: number;
}

export interface DetailedRequirements {
  required_courses: CreditCategory;
  elective_courses: CreditCategory;
  holistic_education: CreditCategory;
  holistic_core: CreditCategory;
  basic_skills: CreditCategory;
  general_ed: GeneralEducationCredit;
  pe_semesters: CreditCategory;
  english_proficiency?: EnglishProficiency;
  computer_proficiency?: ComputerProficiency;
  emi_proficiency?: EMIProficiency;
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
  is_first_time: boolean;
}
