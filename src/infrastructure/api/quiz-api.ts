import { buildApiUrl, API_ENDPOINTS } from './baseConfig';

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

  /**
   * Récupérer les questions d'un quiz
   */
  static async getQuizQuestions(moduleId: string): Promise<{
    quiz: {
      id: string;
      title: string;
      description?: string;
      passingScore: number;
    };
    questions: Array<{
      id: string;
      question: string;
      type: string;
      options?: any;
      points: number;
    }>;
  }> {
    try {
      console.log(`📡 API: Récupération des questions du quiz pour le module: ${moduleId}`);
      
      // Correction: La route backend est /course/quiz/module/:moduleId/questions
      const endpoint = `course/quiz/module/${moduleId}/questions`;
      console.log(`📡 API: Endpoint utilisé: ${endpoint}`);
      
      const response = await fetch(
        buildApiUrl(endpoint),
        {
          method: "GET",
          credentials: "include",
        },
      );

      console.log(`📡 API: Réponse reçue - Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API: Erreur ${response.status}: ${errorText}`);
        throw new Error(`Erreur ${response.status}: Impossible de charger le quiz pour ce module`);
      }

      const data = await response.json();
      console.log(`✅ API: Données reçues:`, data);
      return data;
    } catch (error) {
      console.error(`❌ API: Erreur lors de la récupération des questions:`, error);
      throw error;
    }
  }

  /**
   * Soumettre un quiz
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
      console.log(`📤 API: Soumission du quiz ${quizId} avec les réponses:`, answers);
      
      // Correction: La route backend est /course/quiz/:quizId
      const endpoint = `course/quiz/${quizId}`;
      console.log(`📤 API: Endpoint utilisé pour soumission: ${endpoint}`);
      
      const response = await fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers }),
      });

      console.log(`📤 API: Réponse de soumission - Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API: Erreur ${response.status} lors de la soumission: ${errorText}`);
        throw new Error(`Erreur ${response.status}: Impossible de soumettre le quiz`);
      }

      const data = await response.json();
      console.log(`✅ API: Résultat de la soumission:`, data);
      return data;
    } catch (error) {
      console.error(`❌ API: Erreur lors de la soumission du quiz:`, error);
      throw error;
    }
  }

  static async getQuizzesByCourse(courseId: number): Promise<Quiz[]> {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.QUIZ.COURSE}/${courseId}`),
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
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.QUIZ.SUBMIT}/${quizId}`), {
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
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.QUIZ.ID}/${quizId}${API_ENDPOINTS.QUIZ.START}`), {
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
      buildApiUrl(`${API_ENDPOINTS.QUIZ.ATTEMPTS}/${attemptId}/submit`),
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
      buildApiUrl(`${API_ENDPOINTS.QUIZ.ID}/${quizId}${API_ENDPOINTS.QUIZ.ATTEMPTS}`),
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
      buildApiUrl(`${API_ENDPOINTS.QUIZ.ATTEMPTS}/${attemptId}/results`),
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
      buildApiUrl(`${API_ENDPOINTS.QUIZ.STUDENT_PROGRESS}/${studentId}`),
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
      buildApiUrl(`${API_ENDPOINTS.QUIZ.ID}/${quizId}${API_ENDPOINTS.QUIZ.RETRY_STATUS}`),
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
