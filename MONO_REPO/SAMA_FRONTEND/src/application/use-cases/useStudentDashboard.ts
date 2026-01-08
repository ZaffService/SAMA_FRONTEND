"use client";

import { useState, useEffect } from "react";
import { StudentApi } from "@/infrastructure/api/student-api";

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
}

// ❌ SUPPRESSION DU CACHE MÉMOIRE - Les données doivent toujours venir de la DB

export function useStudentDashboard(options: {
  userId: string | null;
  enabled?: boolean;
}): {
  dashboard: DashboardData | null;
  calendar: null;
  courses: StudentCoursesData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
} {
  const { userId, enabled = true } = options;
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [courses, setCourses] = useState<StudentCoursesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        console.log("📊 Chargement des données dashboard étudiant ID:", userId);
        const startTime = performance.now();

        // ✅ CHARGER LES DONNÉES DIRECTEMENT DEPUIS LES APIs (PAS DE CACHE)
        const [dashboardResult, coursesResult, quizStats] = await Promise.all([
          StudentApi.getStudentDashboard(),
          StudentApi.getEnrolledCourses(),
          StudentApi.computeQuizStats(), // ✅ UTILISER LES VRAIES STATISTIQUES DE QUIZ
        ]);

        console.log(
          "✅ Dashboard chargé:",
          dashboardResult.total_courses,
          "cours",
        );

        console.log("✅ Cours chargés:", coursesResult.length, "cours");

        const endTime = performance.now();
        console.log(
          `Dashboard chargé en ${(endTime - startTime).toFixed(0)}ms`,
        );

        const adaptedDashboard = {
          enrolled_course_count: dashboardResult.total_courses,
          completed_courses: dashboardResult.completed_courses,
          certificates_earned: 0, // Non disponible dans l'API actuelle
          study_hours: 0, // Non disponible dans l'API actuelle
          progress_percentage: dashboardResult.total_progress,
          passed_quizzes: quizStats.passedQuizzes,
          failed_quizzes: quizStats.failedQuizzes,
          total_attempts: 0, // Non calculé dans computeQuizStats
          average_score: 0, // Non calculé dans computeQuizStats
        };

        const adaptedCourses = {
          enrolled_courses: coursesResult,
          completed_courses: coursesResult.filter(
            (course) => course.status === "COMPLETED",
          ),
          in_progress_courses: coursesResult.filter(
            (course) => course.status === "ACTIVE",
          ),
        };

        setDashboard(adaptedDashboard);
        setCourses(adaptedCourses);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        console.error("❌ Erreur globale dashboard:", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, enabled]);

  // Fonction pour rafraîchir les données
  const refreshData = async () => {
    try {
      const [dashboardResult, coursesResult, quizStats] = await Promise.all([
        StudentApi.getStudentDashboard(),
        StudentApi.getEnrolledCourses(),
        StudentApi.computeQuizStats(),
      ]);

      // Adapter les données pour correspondre aux types attendus
      const adaptedDashboard = {
        enrolled_course_count: dashboardResult.total_courses,
        completed_courses: dashboardResult.completed_courses,
        certificates_earned: 0, // Non disponible dans l'API actuelle
        study_hours: 0, // Non disponible dans l'API actuelle
        progress_percentage: dashboardResult.total_progress,
        passed_quizzes: quizStats.passedQuizzes,
        failed_quizzes: quizStats.failedQuizzes,
        total_attempts: 0, // Non calculé dans computeQuizStats
        average_score: 0, // Non calculé dans computeQuizStats
      };

      const adaptedCourses = {
        enrolled_courses: coursesResult,
        completed_courses: coursesResult.filter(
          (course) => course.status === "COMPLETED",
        ),
        in_progress_courses: coursesResult.filter(
          (course) => course.status === "ACTIVE",
        ),
      };

      setDashboard(adaptedDashboard);
      setCourses(adaptedCourses);

      console.log("🔄 Données rafraîchies en arrière-plan");
    } catch (error) {
      console.error("❌ Erreur rafraîchissement cache:", error);
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
