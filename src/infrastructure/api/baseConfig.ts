// baseConfig.ts - UNIQUE SOURCE DE VÉRITÉ POUR LES URLs API
import { config } from "@/lib/config/config";

export const API_BASE_URL = config.backendUrl;

/**
 * Fonction helper pour construire les URLs API de manière centralisée
 * @param endpoint - L'endpoint (peut commencer ou non par /)
 * @returns L'URL complète
 */
export const buildApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

/**
 * Interface pour les options de recherche de cours
 */
export interface CourseSearchOptions {
  query?: string;
  categoryId?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  page?: number;
  limit?: number;
}

/**
 * Constantes pour les endpoints API
 */
export const API_ENDPOINTS = {
  COURSES: {
    SEARCH: "/course/search",
    DETAILS: "/course/details",
    CREATE: "/course/create",
    ENROLL: "/course/enrollment",
    ENROLLMENT: "/course/enrollment",
    FOLLOW: (courseId: string) => `/course/follow/${courseId}`,
    PROGRESS: (courseId: string) => `/course/progress/${courseId}`,
    CATEGORIES: "/course/categories",
    ENROLLED: "/course/enrolled",
    QUIZ: "/course/quiz",
    LESSON_COMPLETE: "/course/lesson/complete",
    LESSON_UNCOMPLETE: "/course/lesson/uncomplete",
  },
  USER: {
    LOGIN: "/user/login",
    LOGOUT: "/user/logout",
    PROFILE: "/user/profile",
    CREATE_ACCOUNT: "/user/create-account",
    VERIFY_EMAIL: "/user/verify-email",
    BY_ROLE: "/user/by-role",
    REQUEST_PASSWORD_RESET: "/user/request-password-reset",
    RESET_PASSWORD: "/user/reset-password",
  },
  QUIZ: {
    QUESTIONS: (quizId: string) => `/quiz/${quizId}/questions`,
    SUBMIT: (quizId: string) => `/course/quiz/${quizId}`,
    COURSE: "/quizzes/course",
    ID: "/quizzes",
    START: "/quizzes/start",
    ATTEMPTS: "/course/quizzes/attempts",
    RETRY_STATUS: "/quizzes/retake-status",
    STUDENT_PROGRESS: "/students/quiz-progress",
  },
  PAYMENT: {
    CREATE_INTENT: "course/payments/create-intent",
    VERIFY: "course/payments/verify",
  },
  LESSONS: {
    COMPLETE: (lessonId: string) => `/course/lesson/${lessonId}/complete`,
    UNCOMPLETE: (lessonId: string) => `/course/lesson/${lessonId}/uncomplete`,
  },
} as const;
