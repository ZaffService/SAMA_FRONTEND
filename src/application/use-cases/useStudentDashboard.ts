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

        // ✅ FETCH PROGRESS FOR EACH ENROLLED COURSE
        console.log("📊 [useStudentDashboard] Début récupération progression pour", coursesResult.length, "cours");
        const coursesWithProgress = await Promise.all(
          coursesResult.map(async (course) => {
            try {
              const courseId = course.id || course.course_id;
              if (!courseId) {
                console.log("⚠️ [useStudentDashboard] Cours sans ID:", course);
                return course;
              }

              console.log(`📚 [useStudentDashboard] Récupération progression pour cours ID: ${courseId} - ${course.title || 'sans titre'}`);
              const progressData = await StudentApi.getCourseProgress(courseId);
              
              console.log(`✅ [useStudentDashboard] Progression reçue pour cours ${courseId}:`, {
                progress: progressData.progress,
                completed_lessons: progressData.completed_lessons,
                total_lessons: progressData.total_lessons,
                last_accessed: progressData.last_accessed,
                timestamp: new Date().toISOString()
              });

              return {
                ...course,
                progressPercentage: progressData.progress,
                completedLessons: progressData.completed_lessons,
                totalLessons: progressData.total_lessons,
                lastAccessed: progressData.last_accessed,
              };
            } catch (error) {
              console.error(`❌ [useStudentDashboard] Erreur récupération progression pour cours ${course.id}:`, error);
              // Return course with default progress if API fails
              return {
                ...course,
                progressPercentage: course.progressPercentage || 0,
                completedLessons: course.completedLessons || 0,
                totalLessons: course.totalLessons || 0,
              };
            }
          })
        );

        console.log("✅ [useStudentDashboard] Progression chargée pour tous les cours");
        console.log("📊 [useStudentDashboard] Résumé des progressions:");
        coursesWithProgress.forEach(course => {
          console.log(`  - Cours ${course.id || course.course_id}: ${course.progressPercentage}% (${course.completedLessons}/${course.totalLessons} leçons)`);
        });

        // ✅ CALCULER LES COURS TERMINÉS BASÉ SUR LA PROGRESSION RÉELLE
        const completedCoursesCount = coursesWithProgress.filter(
          (course) => course.progressPercentage === 100
        ).length;

        console.log(`✅ [useStudentDashboard] Cours terminés calculés: ${completedCoursesCount} (basé sur progressPercentage === 100)`);

        const endTime = performance.now();
        console.log(
          `Dashboard chargé en ${(endTime - startTime).toFixed(0)}ms`,
        );

        const adaptedDashboard = {
          enrolled_course_count: dashboardResult.total_courses,
          completed_courses: completedCoursesCount, // ✅ UTILISER LE CALCUL DYNAMIQUE AU LIEU DE L'API BACKEND
          certificates_earned: 0, // Non disponible dans l'API actuelle
          study_hours: 0, // Non disponible dans l'API actuelle
          progress_percentage: dashboardResult.total_progress,
          passed_quizzes: quizStats.passedQuizzes,
          failed_quizzes: quizStats.failedQuizzes,
          total_attempts: 0, // Non calculé dans computeQuizStats
          average_score: 0, // Non calculé dans computeQuizStats
        };

        const adaptedCourses = {
          enrolled_courses: coursesWithProgress,
          completed_courses: coursesWithProgress.filter(
            (course) => course.status === "COMPLETED",
          ),
          in_progress_courses: coursesWithProgress.filter(
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
      console.log("🔄 [useStudentDashboard] Début rafraîchissement des données...");
      const [dashboardResult, coursesResult, quizStats] = await Promise.all([
        StudentApi.getStudentDashboard(),
        StudentApi.getEnrolledCourses(),
        StudentApi.computeQuizStats(),
      ]);

      // ✅ FETCH PROGRESS FOR EACH ENROLLED COURSE
      console.log("📊 [useStudentDashboard] Rafraîchissement progression pour", coursesResult.length, "cours");
      const coursesWithProgress = await Promise.all(
        coursesResult.map(async (course) => {
          try {
            const courseId = course.id || course.course_id;
            if (!courseId) {
              console.log("⚠️ [useStudentDashboard] Cours sans ID lors du refresh:", course);
              return course;
            }

            console.log(`📚 [useStudentDashboard] Refresh progression pour cours ID: ${courseId} - ${course.title || 'sans titre'}`);
            const progressData = await StudentApi.getCourseProgress(courseId);
            
            console.log(`✅ [useStudentDashboard] Progression rafraîchie pour cours ${courseId}:`, {
              progress: progressData.progress,
              completed_lessons: progressData.completed_lessons,
              total_lessons: progressData.total_lessons,
              last_accessed: progressData.last_accessed,
              timestamp: new Date().toISOString()
            });

            return {
              ...course,
              progressPercentage: progressData.progress,
              completedLessons: progressData.completed_lessons,
              totalLessons: progressData.total_lessons,
              lastAccessed: progressData.last_accessed,
            };
          } catch (error) {
            console.error(` [useStudentDashboard] Erreur refresh progression pour cours ${course.id}:`, error);
            // Return course with default progress if API fails
            return {
              ...course,
              progressPercentage: course.progressPercentage || 0,
              completedLessons: course.completedLessons || 0,
              totalLessons: course.totalLessons || 0,
            };
          }
        })
      );

      console.log("✅ [useStudentDashboard] Progression rafraîchie pour tous les cours");
      console.log("📊 [useStudentDashboard] Résumé des progressions après refresh:");
      coursesWithProgress.forEach(course => {
        console.log(`  - Cours ${course.id || course.course_id}: ${course.progressPercentage}% (${course.completedLessons}/${course.totalLessons} leçons) - Dernier accès: ${course.lastAccessed || 'N/A'}`);
      });

      // ✅ CALCULER LES COURS TERMINÉS BASÉ SUR LA PROGRESSION RÉELLE (REFRESH)
      const completedCoursesCount = coursesWithProgress.filter(
        (course) => course.progressPercentage === 100
      ).length;

      console.log(`✅ [useStudentDashboard] Cours terminés recalculés après refresh: ${completedCoursesCount} (basé sur progressPercentage === 100)`);

      // Adapter les données pour correspondre aux types attendus
      const adaptedDashboard = {
        enrolled_course_count: dashboardResult.total_courses,
        completed_courses: completedCoursesCount, // ✅ UTILISER LE CALCUL DYNAMIQUE AU LIEU DE L'API BACKEND
        certificates_earned: 0, // Non disponible dans l'API actuelle
        study_hours: 0, // Non disponible dans l'API actuelle
        progress_percentage: dashboardResult.total_progress,
        passed_quizzes: quizStats.passedQuizzes,
        failed_quizzes: quizStats.failedQuizzes,
        total_attempts: 0, // Non calculé dans computeQuizStats
        average_score: 0, // Non calculé dans computeQuizStats
      };

      const adaptedCourses = {
        enrolled_courses: coursesWithProgress,
        completed_courses: coursesWithProgress.filter(
          (course) => course.status === "COMPLETED" || course.progressPercentage === 100,
        ),
        in_progress_courses: coursesWithProgress.filter(
          (course) => course.status === "ACTIVE" && (course.progressPercentage ?? 0) < 100,
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
