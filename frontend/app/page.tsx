import Dashboard from './components/Dashboard';
import { mockStudentInfo, mockCreditProgress, mockFailedCourses, mockRecommendations } from './data/mockData';

export default function Home() {
  return (
    <Dashboard
      studentInfo={mockStudentInfo}
      creditProgress={mockCreditProgress}
      failedCourses={mockFailedCourses}
      recommendations={mockRecommendations}
    />
  );
}
