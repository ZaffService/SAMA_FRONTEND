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
    ADMIN_COURSES: "/course/admin/all",
    DETAILS: "/course/details",
    CREATE: "/course/create",
    UPDATE: (courseId: string) => `/course/${courseId}`,
    UPDATE_SIMPLE: (courseId: string) => `/course/update-simple/${courseId}`,
    DELETE: (courseId: string) => `/course/delete/${courseId}`,
    UPDATE_STATUS: (courseId: string) => `/course/update-status/${courseId}`,
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
    PROFILE_METADATA: "/profile-metadata",
    COMPLETE_PROFILE: "/user/complete-profile",
    CREATE_ACCOUNT: "/user/create-account",
    VERIFY_EMAIL: "/user/verify-email",
    BY_ROLE: "/user/by-role",
    REQUEST_PASSWORD_RESET: "/user/request-password-reset",
    RESET_PASSWORD: "/user/reset-password",
    ADMIN_CREATE: "/user/admin/create-user",
    IMPORT_USERS: "/import/users",
    IMPORT_USERS_LEGACY: "/import-users",
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
    SIGNED_VIDEO: (lessonId: string) =>
      `/course/lesson/${lessonId}/video/signed`,
    UPLOAD_VIDEO: (lessonId: string) => `/course/lesson/${lessonId}/video`,
  },
  MODULES: {
    CREATE: (courseId: string) => `/course/${courseId}/modules`,
    UPDATE: (moduleId: string) => `/modules/${moduleId}`,
    UPDATE_MODULE: (moduleId: string) => `/course/module/${moduleId}`,
    DELETE: (moduleId: string) => `/modules/${moduleId}`,
    GET: (moduleId: string) => `/modules/${moduleId}`,
    ADD_LESSONS: (moduleId: string) => `/course/module/${moduleId}/lessons`,
  },
  LESSONS_API: {
    CREATE: (moduleId: string) => `/modules/${moduleId}/lessons`,
    UPDATE: (lessonId: string) => `/lessons/${lessonId}`,
    DELETE: (lessonId: string) => `/lessons/${lessonId}`,
    GET: (lessonId: string) => `/lessons/${lessonId}`,
  },
  QUIZZES: {
    CREATE: (moduleId: string) => `/modules/${moduleId}/quizzes`,
    UPDATE: (quizId: string) => `/quizzes/${quizId}`,
    DELETE: (quizId: string) => `/quizzes/${quizId}`,
    GET: (quizId: string) => `/quizzes/${quizId}`,
    GET_BY_MODULE: (moduleId: string) => `/modules/${moduleId}/quizzes`,
  },
  AUTH: {
    GOOGLE: "/user/google-login", // endpoint backend Google OAuth (idToken)
    GOOGLE_CALLBACK: "/auth/google/callback",
    LOGIN: "/user/login",
    LOGOUT: "/user/logout",
    PROFILE: "/user/profile",
  },
} as const;
