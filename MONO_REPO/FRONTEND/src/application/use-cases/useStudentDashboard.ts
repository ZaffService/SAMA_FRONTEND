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
  passed_quizzes?: number;
  total_attempts?: number;
}

interface StudentCoursesData {
  enrolled_courses: any[];
  completed_courses: any[];
  in_progress_courses: any[];
}

// Cache en mémoire uniquement (pas de localStorage pour la sécurité)
const dashboardCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

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
      // Skip if userId is invalid (empty, "0", or falsy) or if enabled is false
      if (!userId || userId === "0" || !enabled) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const cacheKey = `student-dashboard-${userId}`;
        const now = Date.now();

        // 1️⃣ Essayer le cache mémoire d'abord
        const memCache = dashboardCache.get(cacheKey);
        if (memCache && now - memCache.timestamp < CACHE_DURATION) {
          console.log("📦 Cache mémoire utilisé - affichage instantané");
          const { dashboard: cachedDashboard, courses: cachedCourses } =
            memCache.data;
          setDashboard(cachedDashboard);
          setCourses(cachedCourses);
          setLoading(false);
          return;
        }

        console.log("📊 Chargement complet du dashboard étudiant ID:", userId);
        const startTime = performance.now();

        // Charger les données via l'API student
        const [dashboardResult, coursesResult] = await Promise.all([
          StudentApi.getStudentDashboard(),
          StudentApi.getEnrolledCourses(),
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

        // 4️⃣ Mettre en cache mémoire uniquement
        const cacheData = {
          dashboard: dashboardResult,
          courses: coursesResult,
        };
        dashboardCache.set(cacheKey, {
          data: cacheData,
          timestamp: now,
        });

        const adaptedDashboard = {
          enrolled_course_count: dashboardResult.total_courses,
          completed_courses: dashboardResult.completed_courses,
          certificates_earned: 0, // Non disponible dans l'API actuelle
          study_hours: 0, // Non disponible dans l'API actuelle
          progress_percentage: dashboardResult.total_progress,
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

  // Fonction pour rafraîchir les données en arrière-plan
  const refreshData = async () => {
    try {
      const cacheKey = `student-dashboard-${userId}`;

      const [dashboardResult, coursesResult] = await Promise.all([
        StudentApi.getStudentDashboard(),
        StudentApi.getEnrolledCourses(),
      ]);

      const cacheData = { dashboard: dashboardResult, courses: coursesResult };
      const now = Date.now();

      dashboardCache.set(cacheKey, {
        data: cacheData,
        timestamp: now,
      });

      // Adapter les données pour correspondre aux types attendus
      const adaptedDashboard = {
        enrolled_course_count: dashboardResult.total_courses,
        completed_courses: dashboardResult.completed_courses,
        certificates_earned: 0, // Non disponible dans l'API actuelle
        study_hours: 0, // Non disponible dans l'API actuelle
        progress_percentage: dashboardResult.total_progress,
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
