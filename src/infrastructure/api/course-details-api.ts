// src/infrastructure/api/course-details-api.ts

import { buildApiUrl, API_ENDPOINTS } from "./baseConfig";

export interface CourseDetails {
  course: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    instructor: {
      name: string;
    };
  };
  modules: ModuleDetails[];
  moduleCount: number;
}

export interface ModuleDetails {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: LessonDetails[];
  quiz?: QuizDetails;
}

export interface LessonDetails {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  orderIndex: number;
  duration?: number;
}

export interface QuizDetails {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  progressPercentage: number;
  completedLessons: string[];
  currentLesson?: string;
}

export class CourseDetailsApi {
  /**
   * Récupérer les détails complets d'un cours
   */
  static async getCourseDetails(courseId: string): Promise<CourseDetails> {
    try {
      console.log(
        `📤 [COURSE-DETAILS-API] Récupération détails cours: ${courseId}`,
      );

      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.COURSES.DETAILS}/${courseId}`),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        console.error("❌ [COURSE-DETAILS-API] Erreur:", response.status);
        throw new Error("Impossible de récupérer les détails du cours");
      }

      const data = await response.json();
      console.log(`✅ [COURSE-DETAILS-API] Détails cours récupérés`);

      return data;
    } catch (error) {
      console.error("❌ [COURSE-DETAILS-API] Exception:", error);
      throw error;
    }
  }

  /**
   * Récupérer la progression d'un utilisateur sur un cours
   */
  static async getCourseProgress(courseId: string): Promise<CourseProgress> {
    try {
      console.log(
        `📤 [COURSE-PROGRESS-API] Récupération progression: ${courseId}`,
      );

      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.COURSES.PROGRESS}/${courseId}`),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Cookies pour l'authentification
        },
      );

      if (!response.ok) {
        console.error("❌ [COURSE-PROGRESS-API] Erreur:", response.status);
        throw new Error("Impossible de récupérer la progression");
      }

      const data = await response.json();
      console.log(
        `✅ [COURSE-PROGRESS-API] Progression récupérée: ${data.progressPercentage}%`,
      );

      return data;
    } catch (error) {
      console.error("❌ [COURSE-PROGRESS-API] Exception:", error);
      throw error;
    }
  }

  /**
   * Mettre à jour la progression d'une leçon
   */
  static async updateLessonProgress(
    lessonId: string,
    progress: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(
        `📤 [LESSON-PROGRESS-API] Mise à jour leçon ${lessonId}: ${progress}%`,
      );

      // TODO: Implémenter l'endpoint backend pour la progression des leçons
      // Pour l'instant, on simule
      return { success: true, message: "Progression mise à jour" };
    } catch (error) {
      console.error("❌ [LESSON-PROGRESS-API] Exception:", error);
      throw error;
    }
  }

  /**
   * Marquer une leçon comme terminée
   */
  static async completeLesson(
    lessonId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📤 [LESSON-API] Completion leçon: ${lessonId}`);

      // TODO: Implémenter l'endpoint backend
      return { success: true, message: "Leçon marquée comme terminée" };
    } catch (error) {
      console.error("❌ [LESSON-API] Exception:", error);
      throw error;
    }
  }
}
