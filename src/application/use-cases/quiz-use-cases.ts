import {
  QuizApi,
  Quiz,
  QuizAttempt,
  QuizSubmission,
  QuizResult,
} from "@/infrastructure/api/quiz-api";

export class QuizUseCases {
  static async getQuizzesByCourse(courseId: number): Promise<Quiz[]> {
    return QuizApi.getQuizzesByCourse(courseId);
  }

  static async getQuizById(quizId: number): Promise<Quiz> {
    return QuizApi.getQuizById(quizId);
  }

  static async startQuizAttempt(quizId: number): Promise<{
    attempt_id: number;
    quiz: Quiz;
    time_started: string;
  }> {
    return QuizApi.startQuizAttempt(quizId);
  }

  static async submitQuizAttempt(
    attemptId: number,
    submission: QuizSubmission,
  ): Promise<QuizResult> {
    return QuizApi.submitQuizAttempt(attemptId, submission);
  }

  /**
   * Soumettre un quiz avec vérification d'inscription
   */
  static async submitQuiz(
    quizId: string,
    answers: Record<string, any>,
  ): Promise<{
    quizId: string;
    score: number;
    passed: boolean;
    answers: Record<string, any>;
  }> {
    try {
      // Vérifier l'inscription avant soumission
      const result = await QuizApi.submitQuiz(quizId, answers);
      return result;
    } catch (error) {
      // Re-throw COURSE_NOT_ENROLLED error for UI handling - check error.code
      const apiError = error as any;
      if (apiError && apiError.code === "COURSE_NOT_ENROLLED") {
        throw error;
      }
      throw error;
    }
  }

  static async getQuizAttempts(quizId: number): Promise<QuizAttempt[]> {
    return QuizApi.getQuizAttempts(quizId);
  }

  static async getQuizResults(attemptId: number): Promise<QuizResult> {
    return QuizApi.getQuizResults(attemptId);
  }

  static async getStudentQuizProgress(studentId: number): Promise<{
    completed_quizzes: number;
    total_quizzes: number;
    average_score: number;
    best_score: number;
    total_time_spent: number;
  }> {
    return QuizApi.getStudentQuizProgress(studentId);
  }

  static async canRetakeQuiz(quizId: number): Promise<{
    can_retake: boolean;
    remaining_attempts: number;
    max_attempts: number;
  }> {
    return QuizApi.canRetakeQuiz(quizId);
  }
}
