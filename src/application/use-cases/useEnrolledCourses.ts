import { useState, useEffect } from "react";
import { StudentUseCases } from "./student-use-cases";
import { Enrollment } from "@/infrastructure/api/student-api";

interface UseEnrolledCoursesState {
  enrolledCourses: Enrollment[];
  loading: boolean;
  error: string | null;
}

interface UseEnrolledCoursesActions {
  refetch: () => Promise<void>;
}

export function useEnrolledCourses(): UseEnrolledCoursesState & UseEnrolledCoursesActions {
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔍 [useEnrolledCourses] Début récupération des cours inscrits...");

      const courses = await StudentUseCases.getEnrolledCourses();

      console.log("📚 [useEnrolledCourses] Cours inscrits récupérés:", courses);
      console.log("📊 [useEnrolledCourses] Nombre de cours:", courses?.length || 0);

      // 🔥 DEBUG spécifique pour le cours problématique
      const leadershipCourse = courses?.find(c => c.title?.includes("Leadership"));
      if (leadershipCourse) {
        console.log("🎯 [useEnrolledCourses] Cours Leadership trouvé:", leadershipCourse);
        console.log("🆔 ID du cours Leadership:", leadershipCourse.id);
        console.log("🏷️ Titre du cours Leadership:", leadershipCourse.title);
      } else {
        console.log("❌ [useEnrolledCourses] Cours Leadership NON trouvé dans les cours inscrits");
      }

      setEnrolledCourses(courses);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des cours inscrits";
      setError(errorMessage);
      console.error("❌ [useEnrolledCourses] Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchEnrolledCourses();
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  return {
    enrolledCourses,
    loading,
    error,
    refetch,
  };
}