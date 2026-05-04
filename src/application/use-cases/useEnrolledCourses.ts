import { useState, useEffect } from "react";
import { StudentUseCases } from "./student-use-cases";
import { Enrollment } from "@/infrastructure/api/student-api";
import logger from "@/shared/helpers/logger";

interface UseEnrolledCoursesState {
  enrolledCourses: Enrollment[];
  loading: boolean;
  error: string | null;
}

interface UseEnrolledCoursesActions {
  refetch: () => Promise<void>;
}

interface UseEnrolledCoursesOptions {
  enabled?: boolean;
}

export function useEnrolledCourses(
  options: UseEnrolledCoursesOptions = {},
): UseEnrolledCoursesState & UseEnrolledCoursesActions {
  const { enabled = true } = options;
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.log(
        "🔍 [useEnrolledCourses] Début récupération des cours inscrits...",
      );

      const courses = await StudentUseCases.getEnrolledCourses();

      logger.log("📚 [useEnrolledCourses] Cours inscrits récupérés:", courses);
      logger.log(
        "📊 [useEnrolledCourses] Nombre de cours:",
        courses?.length || 0,
      );

      // 🔥 DEBUG spécifique pour le cours problématique
      const leadershipCourse = courses?.find((c) =>
        c.title?.includes("Leadership"),
      );
      if (leadershipCourse) {
        logger.log(
          "🎯 [useEnrolledCourses] Cours Leadership trouvé:",
          leadershipCourse,
        );
        logger.log("🆔 ID du cours Leadership:", leadershipCourse.id);
        logger.log("🏷️ Titre du cours Leadership:", leadershipCourse.title);
      } else {
        logger.log(
          "❌ [useEnrolledCourses] Cours Leadership NON trouvé dans les cours inscrits",
        );
      }

      setEnrolledCourses(courses);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des cours inscrits";
      setError(errorMessage);
      logger.error("❌ [useEnrolledCourses] Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    if (!enabled) {
      return;
    }
    await fetchEnrolledCourses();
  };

  useEffect(() => {
    if (!enabled) {
      setEnrolledCourses([]);
      setError(null);
      setLoading(false);
      return;
    }

    fetchEnrolledCourses();
  }, [enabled]);

  return {
    enrolledCourses,
    loading,
    error,
    refetch,
  };
}
