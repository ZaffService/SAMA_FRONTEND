// src/infrastructure/api/enrollment-api.ts
import logger from "@/shared/helpers/logger";
import { buildApiUrl, API_ENDPOINTS } from "./baseConfig";
import Cookies from "js-cookie";

export interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  progressPercentage: number;
  status: "ACTIVE" | "COMPLETED";
  enrollmentDate: string;
  completionDate?: string;
  category?: string;
  level?: string;
  duration?: string;
}

export interface EnrolledCoursesResponse {
  courses: EnrolledCourse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EnrollmentRequest {
  courseId: string;
  userId: string;
}

export interface EnrollStudentsRequest {
  courseId: string;
  userIds: string[];
  isAdmin?: boolean;
}

export interface BulkEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrollmentDate: string;
  progressPercentage: number;
  status: "ACTIVE" | "INACTIVE" | "COMPLETED";
}

export interface EnrollStudentsResponse {
  enrollments: BulkEnrollment[];
  skippedUserIds: string[];
  notifiedUserIds: string[];
}

export interface EnrollmentResponse {
  success: boolean;
  message: string;
  enrollmentId?: string;
}

export interface PaymentInfo {
  amount: number;
  method: string;
  courseId: string;
}

const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    Cookies.get("access_token") ||
    null
  );
};

const buildAuthHeaders = (): Record<string, string> => {
  const token = getStoredAccessToken();
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export class EnrollmentApi {
  /**
   * Récupérer les cours auxquels l'étudiant est inscrit
   * Avec les vraies données de catégorie du backend
   */
  static async getEnrolledCourses(
    page: number = 1,
    limit: number = 10,
  ): Promise<EnrolledCoursesResponse> {
    try {
      logger.log(
        `📤 [ENROLLMENT-API] Récupération des cours inscrits (page ${page})...`,
      );

      const response = await fetch(
        buildApiUrl(
          `${API_ENDPOINTS.COURSES.ENROLLED}?page=${page}&limit=${limit}`,
        ),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // ✅ IMPORTANT : Envoyer les cookies
        },
      );

      if (!response.ok) {
        logger.error("❌ [ENROLLMENT-API] Erreur:", response.status);
        throw new Error("Impossible de récupérer les cours");
      }

      const data = await response.json();
      logger.log(`✅ [ENROLLMENT-API] ${data.total} cours récupérés`);

      // DEBUG: Afficher les données brutes pour diagnostiquer la catégorisation
      logger.log(
        "🔍 [ENROLLMENT-API] Données brutes:",
        JSON.stringify(data, null, 2),
      );

      // Enrichir les données avec les informations de catégorie du backend
      const enrichedCourses = (data.courses || []).map((course: any) => {
        // Extraire la catégorie du backend avec différents formats possibles
        // Si pas de catégorie du backend, laisser undefined pour que le fallback fonctionne
        let category: string | undefined;

        if (course._category?.name) {
          category = course._category.name;
        } else if (course._category?._name) {
          category = course._category._name;
        } else if (course.category?.name) {
          category = course.category.name;
        } else if (course.category) {
          category = course.category;
        }

        // Utiliser le niveau du backend
        let level = course._level || course.level || "BEGINNER";

        // Utiliser la durée du backend
        let duration = course._duration || course.duration;

        logger.log(
          `📚 [ENROLLMENT-API] Cours "${course.title || course._title}" -> Catégorie backend: ${category || "AUCUNE"}`,
        );

        return {
          ...course,
          category,
          level,
          duration,
        };
      });

      return {
        ...data,
        courses: enrichedCourses,
      };
    } catch (error) {
      logger.error("❌ [ENROLLMENT-API] Exception:", error);
      throw error;
    }
  }

  /**
   * Mettre à jour la progression d'un cours
   */
  static async updateProgress(
    enrollmentId: string,
    progressPercentage: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      logger.log(
        `📤 [ENROLLMENT-API] Mise à jour progression ${enrollmentId}: ${progressPercentage}%`,
      );

      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.COURSES.PROGRESS(enrollmentId)}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            enrollmentId,
            progressPercentage,
          }),
        },
      );

      if (!response.ok) {
        logger.error("❌ [ENROLLMENT-API] Erreur:", response.status);
        throw new Error("Impossible de mettre à jour la progression");
      }

      const data = await response.json();
      logger.log(`✅ [ENROLLMENT-API] Progression mise à jour`);

      return data;
    } catch (error) {
      logger.error("❌ [ENROLLMENT-API] Exception:", error);
      throw error;
    }
  }

  /**
   * Inscrire plusieurs etudiants a un cours (admin)
   */
  static async enrollStudentsInCourse(
    request: EnrollStudentsRequest,
  ): Promise<EnrollStudentsResponse> {
    try {
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.COURSES.ENROLLMENT),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildAuthHeaders(),
          },
          credentials: "include",
          body: JSON.stringify(request),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data as any)?.message ||
          (data as any)?.error ||
          `Erreur ${response.status}`;
        const error = new Error(message);
        (error as any).status = response.status;
        (error as any).payload = data;
        throw error;
      }

      return data as EnrollStudentsResponse;
    } catch (error) {
      logger.error("❌ [ENROLLMENT-API] Erreur inscription multiple:", error);
      throw error;
    }
  }

  static async enrollInCourse(
    request: EnrollmentRequest,
  ): Promise<EnrollmentResponse> {
    // TODO: Implement enrollment
    return { success: false, message: "Not implemented" };
  }

  static async unenrollFromCourse(
    courseId: number,
  ): Promise<{ success: boolean; message: string }> {
    // TODO: Implement unenrollment
    return { success: false, message: "Not implemented" };
  }

  static async getEnrollmentStatus(courseId: number): Promise<{
    enrolled: boolean;
    enrollment_date?: string;
    progress?: number;
    status?: "active" | "completed" | "cancelled";
  }> {
    // TODO: Implement status check
    return { enrolled: false };
  }

  static async processPayment(paymentInfo: PaymentInfo): Promise<{
    success: boolean;
    transaction_id: string;
    message: string;
  }> {
    // TODO: Implement payment processing
    return { success: false, transaction_id: "", message: "Not implemented" };
  }

  static async getPaymentMethods(): Promise<
    Array<{
      id: string;
      name: string;
      type: "card" | "bank_transfer" | "mobile_money";
      enabled: boolean;
    }>
  > {
    // TODO: Implement payment methods
    return [];
  }

  static async getEnrollmentHistory(): Promise<
    Array<{
      id: number;
      course_id: number;
      course_title: string;
      enrollment_date: string;
      status: string;
      progress: number;
    }>
  > {
    // TODO: Implement history
    return [];
  }

  /**
   * Passer un quiz
   */
  static async takeQuiz(data: {
    quizId: string;
    answers: Record<string, string>;
  }): Promise<{
    quizId: string;
    score: number;
    passed: boolean;
    answers: any[];
  }> {
    try {
      logger.log(`📤 [QUIZ-API] Soumission quiz ${data.quizId}`);

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.QUIZ.SUBMIT(data.quizId)),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ answers: data.answers }),
        },
      );

      if (!response.ok) {
        logger.error("❌ [QUIZ-API] Erreur:", response.status);
        throw new Error("Impossible de soumettre le quiz");
      }

      const result = await response.json();
      logger.log(`✅ [QUIZ-API] Quiz soumis - Score: ${result.score}%`);

      return result;
    } catch (error) {
      logger.error("❌ [QUIZ-API] Exception:", error);
      throw error;
    }
  }
}
