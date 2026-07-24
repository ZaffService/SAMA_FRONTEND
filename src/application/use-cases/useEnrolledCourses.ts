"use client";

/**
 * Cours inscrits via TanStack Query
 *
 * Même API publique : enrolledCourses, loading, error, refetch
 * enabled: false → pas de fetch (ex: utilisateur non connecté)
 */

import { useQuery } from "@tanstack/react-query";
import { StudentUseCases } from "./student-use-cases";
import { Enrollment } from "@/infrastructure/api/student-api";
import { courseKeys } from "@/shared/helpers/query-keys";

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

  const query = useQuery({
    queryKey: courseKeys.enrolled(),
    queryFn: () => StudentUseCases.getEnrolledCourses(),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  return {
    enrolledCourses: enabled ? (query.data ?? []) : [],
    loading: enabled ? query.isPending : false,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Erreur lors du chargement des cours inscrits"
      : null,
    refetch: async () => {
      if (!enabled) return;
      await query.refetch();
    },
  };
}
