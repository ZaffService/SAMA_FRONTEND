export interface Question {
  id: number;
  question: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
}

export interface Quiz {
  id: number;
  title: string;
  description?: string;
  course_id: number;
  lesson_id?: number;
  time_limit?: number; // en minutes
  passing_score: number;
  max_attempts: number;
  questions: Question[];
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  student_id: number;
  started_at: string;
  submitted_at?: string;
  score?: number;
  total_points?: number;
  passed: boolean;
  answers: Record<number, string>;
  time_taken?: number; // en secondes
}

export interface QuizSubmission {
  answers: Record<number, string>;
  time_taken?: number;
}

export interface QuizResult {
  success: boolean;
  attempt_id: number;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  correct_answers: number;
  total_questions: number;
  time_taken: number;
  feedback: {
    question_id: number;
    correct: boolean;
    user_answer: string;
    correct_answer: string;
    explanation?: string;
  }[];
}

export class QuizApi {
  private static readonly BASE_URL = "";

  static async getQuizzesByCourse(courseId: number): Promise<Quiz[]> {
    const response = await fetch(
      `${this.BASE_URL}/quizzes/course/${courseId}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des quiz du cours");
    }

    const data = await response.json();
    return data.data || [];
  }

  static async getQuizById(quizId: number): Promise<Quiz> {
    const response = await fetch(`${this.BASE_URL}/quizzes/${quizId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération du quiz");
    }

    const data = await response.json();
    return data.data;
  }

  static async startQuizAttempt(quizId: number): Promise<{
    attempt_id: number;
    quiz: Quiz;
    time_started: string;
  }> {
    const response = await fetch(`${this.BASE_URL}/quizzes/${quizId}/start`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Erreur lors du démarrage du quiz");
    }

    return response.json();
  }

  static async submitQuizAttempt(
    attemptId: number,
    submission: QuizSubmission,
  ): Promise<QuizResult> {
    const response = await fetch(
      `${this.BASE_URL}/quizzes/attempts/${attemptId}/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submission),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Erreur lors de la soumission du quiz",
      );
    }

    return response.json();
  }

  static async getQuizAttempts(quizId: number): Promise<QuizAttempt[]> {
    const response = await fetch(
      `${this.BASE_URL}/quizzes/${quizId}/attempts`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des tentatives de quiz");
    }

    const data = await response.json();
    return data.data || [];
  }

  static async getQuizResults(attemptId: number): Promise<QuizResult> {
    const response = await fetch(
      `${this.BASE_URL}/quizzes/attempts/${attemptId}/results`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des résultats");
    }

    return response.json();
  }

  static async getStudentQuizProgress(studentId: number): Promise<{
    completed_quizzes: number;
    total_quizzes: number;
    average_score: number;
    best_score: number;
    total_time_spent: number;
  }> {
    const response = await fetch(
      `${this.BASE_URL}/students/${studentId}/quiz-progress`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(
        "Erreur lors de la récupération de la progression des quiz",
      );
    }

    return response.json();
  }

  static async canRetakeQuiz(quizId: number): Promise<{
    can_retake: boolean;
    remaining_attempts: number;
    max_attempts: number;
  }> {
    const response = await fetch(
      `${this.BASE_URL}/quizzes/${quizId}/retake-status`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la vérification du statut de reprise");
    }

    return response.json();
  }
}
