import {
  StudentApi,
  Student,
  StudentDashboard,
  Enrollment,
} from "@/infrastructure/api/student-api";

export class StudentUseCases {
  static async getCurrentStudent(): Promise<Student> {
    return StudentApi.getCurrentStudent();
  }

  static async getStudentDashboard(): Promise<StudentDashboard> {
    return StudentApi.getStudentDashboard();
  }

  static async updateStudentProfile(data: Partial<Student>): Promise<Student> {
    return StudentApi.updateStudentProfile(data);
  }

  static async getEnrolledCourses(): Promise<Enrollment[]> {
    return StudentApi.getEnrolledCourses();
  }

  static async getCourseProgress(courseId: string): Promise<{
    progress: number;
    completed_lessons: number;
    total_lessons: number;
    last_accessed: string;
  }> {
    return StudentApi.getCourseProgress(courseId);
  }

  static async markLessonComplete(lessonId: number): Promise<void> {
    return StudentApi.markLessonComplete(lessonId);
  }

  static async submitQuiz(
    quizId: number,
    answers: Record<number, string>,
  ): Promise<{
    score: number;
    total_questions: number;
    correct_answers: number;
    passed: boolean;
  }> {
    return StudentApi.submitQuiz(quizId, answers);
  }
}
