"use client";

import { useState, useEffect } from "react";
import { StudentApi } from "@/infrastructure/api/student-api";
import logger from "@/shared/helpers/logger";

// Types pour le dashboard
interface DashboardData {
  enrolled_course_count: number;
  completed_courses: number;
  certificates_earned: number;
  study_hours: number;
  progress_percentage: number;
  passed_quizzes: number;
  failed_quizzes: number;
  total_attempts: number;
  average_score: number;
}

interface StudentCoursesData {
  enrolled_courses: any[];
  completed_courses: any[];
  in_progress_courses: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ❌ SUPPRESSION DU CACHE MÉMOIRE - Les données doivent toujours venir de la DB

export function useStudentDashboard(options: {
  userId: string | null;
  enabled?: boolean;
  page?: number;
  limit?: number;
}): {
  dashboard: DashboardData | null;
  calendar: null;
  courses: StudentCoursesData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
} {
  const { userId, enabled = true, page = 1, limit = 8 } = options;
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [courses, setCourses] = useState<StudentCoursesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeProgressItems = (payload: any): any[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.courses)) return payload.courses;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.results)) return payload.results;
    return [];
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Skip if enabled is false
      if (!enabled) {
        setDashboard(null);
        setCourses(null);
        setError(null);
        setLoading(false);
        return;
      }

      // Si userId n'est pas encore disponible, rester en loading
      if (!userId || userId === "0") {
        setLoading(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        logger.log("📊 Chargement des données dashboard étudiant ID:", userId);
        const startTime = performance.now();

        const progressPage = await StudentApi.getProgressPage(page, limit);
        const progressItems = normalizeProgressItems(progressPage);

        const coursesWithProgress = progressItems.map((item: any) => ({
          id: item.courseId ?? item.course_id,
          course_id: item.courseId ?? item.course_id,
          title: item.title,
          thumbnailUrl: item.thumbnailUrl,
          progressPercentage: Number(item.progress ?? 0),
          status: Number(item.progress ?? 0) >= 100 ? "COMPLETED" : "ACTIVE",
          currentLesson: item.lastLessonId ?? null,
          lastAccessed: item.lastLessonId ?? null,
        }));

        logger.log(
          "✅ [useStudentDashboard] Progression chargée pour tous les cours",
        );

        // ✅ CALCULER LES COURS TERMINÉS BASÉ SUR LA PROGRESSION RÉELLE
        const completedCoursesCount = coursesWithProgress.filter(
          (course) => course.progressPercentage === 100,
        ).length;

        logger.log(
          `✅ [useStudentDashboard] Cours terminés calculés: ${completedCoursesCount} (basé sur progressPercentage === 100)`,
        );

        const endTime = performance.now();
        logger.log(
          `Dashboard chargé en ${(endTime - startTime).toFixed(0)}ms`,
        );

        const adaptedDashboard = {
          enrolled_course_count:
            typeof progressPage.total === "number"
              ? progressPage.total
              : coursesWithProgress.length,
          completed_courses: completedCoursesCount, // ✅ UTILISER LE CALCUL DYNAMIQUE AU LIEU DE L'API BACKEND
          certificates_earned: 0, // Non disponible dans l'API actuelle
          study_hours: 0, // Non disponible dans l'API actuelle
          progress_percentage:
            coursesWithProgress.length > 0
              ? Math.round(
                  coursesWithProgress.reduce(
                    (sum, course) => sum + (course.progressPercentage ?? 0),
                    0,
                  ) / coursesWithProgress.length,
                )
              : 0,
          passed_quizzes: 0,
          failed_quizzes: 0,
          total_attempts: 0, // Non calculé dans computeQuizStats
          average_score: 0, // Non calculé dans computeQuizStats
        };

        const adaptedCourses: StudentCoursesData = {
          enrolled_courses: coursesWithProgress,
          completed_courses: coursesWithProgress.filter(
            (course: any) => course.status === "COMPLETED",
          ),
          in_progress_courses: coursesWithProgress.filter(
            (course: any) => course.status === "ACTIVE",
          ),
          total: progressPage.total ?? coursesWithProgress.length,
          page: progressPage.page ?? page,
          limit: progressPage.limit ?? limit,
          totalPages: progressPage.totalPages ?? 1,
        };

        setDashboard(adaptedDashboard);
        setCourses(adaptedCourses);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        logger.error("❌ Erreur globale dashboard:", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, enabled, page, limit]);

  // Fonction pour rafraîchir les données
  const refreshData = async () => {
    try {
      logger.log(
        "🔄 [useStudentDashboard] Début rafraîchissement des données...",
      );
      const progressPage = await StudentApi.getProgressPage(page, limit);
      const progressItems = normalizeProgressItems(progressPage);
      const coursesWithProgress = progressItems.map((item: any) => ({
        id: item.courseId ?? item.course_id,
        course_id: item.courseId ?? item.course_id,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
        progressPercentage: Number(item.progress ?? 0),
        status: Number(item.progress ?? 0) >= 100 ? "COMPLETED" : "ACTIVE",
        currentLesson: item.lastLessonId ?? null,
        lastAccessed: item.lastLessonId ?? null,
      }));

      logger.log(
        "✅ [useStudentDashboard] Progression rafraîchie pour tous les cours",
      );

      // ✅ CALCULER LES COURS TERMINÉS BASÉ SUR LA PROGRESSION RÉELLE (REFRESH)
      const completedCoursesCount = coursesWithProgress.filter(
        (course) => course.progressPercentage === 100,
      ).length;

      logger.log(
        `✅ [useStudentDashboard] Cours terminés recalculés après refresh: ${completedCoursesCount} (basé sur progressPercentage === 100)`,
      );

      // Adapter les données pour correspondre aux types attendus
      const adaptedDashboard = {
        enrolled_course_count:
          typeof progressPage.total === "number"
            ? progressPage.total
            : coursesWithProgress.length,
        completed_courses: completedCoursesCount, // ✅ UTILISER LE CALCUL DYNAMIQUE AU LIEU DE L'API BACKEND
        certificates_earned: 0, // Non disponible dans l'API actuelle
        study_hours: 0, // Non disponible dans l'API actuelle
        progress_percentage:
          coursesWithProgress.length > 0
            ? Math.round(
                coursesWithProgress.reduce(
                  (sum, course) => sum + (course.progressPercentage ?? 0),
                  0,
                ) / coursesWithProgress.length,
              )
            : 0,
        passed_quizzes: 0,
        failed_quizzes: 0,
        total_attempts: 0, // Non calculé dans computeQuizStats
        average_score: 0, // Non calculé dans computeQuizStats
      };

      const adaptedCourses = {
        enrolled_courses: coursesWithProgress,
        completed_courses: coursesWithProgress.filter(
          (course) =>
            course.status === "COMPLETED" || course.progressPercentage === 100,
        ),
        in_progress_courses: coursesWithProgress.filter(
          (course) =>
            course.status === "ACTIVE" &&
            (course.progressPercentage ?? 0) < 100,
        ),
        total: progressPage.total ?? coursesWithProgress.length,
        page: progressPage.page ?? page,
        limit: progressPage.limit ?? limit,
        totalPages: progressPage.totalPages ?? 1,
      };

      setDashboard(adaptedDashboard);
      setCourses(adaptedCourses);

      logger.log("🔄 Données rafraîchies en arrière-plan");
    } catch (error) {
      logger.error("❌ Erreur rafraîchissement cache:", error);
    }
  };

  return {
    dashboard,
    calendar: null,
    courses,
    loading,
    error,
    refreshData,
  };
}
