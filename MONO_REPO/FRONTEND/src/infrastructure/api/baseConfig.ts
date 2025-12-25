// baseConfig.ts - UNIQUE SOURCE DE VÉRITÉ POUR LES URLs API
export const API_BASE_URL = "http://localhost:3006";

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
    FOLLOW: "/course/follow",
    PROGRESS: "/course/progress",
    CATEGORIES: "/course/categories",
    ENROLLED: "/course/enrolled",
    QUIZ: "/course/quiz",
  },
  USER: {
    LOGIN: "/user/login",
    LOGOUT: "/user/logout",
    PROFILE: "/user/profile",
    CREATE_ACCOUNT: "/user/create-account",
    VERIFY_EMAIL: "/user/verify-email",
    BY_ROLE: "/user/by-role",
  },
} as const;
