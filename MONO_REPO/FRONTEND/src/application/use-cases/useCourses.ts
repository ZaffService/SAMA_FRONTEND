import { useState, useEffect, useCallback } from "react";
import { CoursesUseCases } from "./courses-use-cases";
import { Course } from "@/domain/entities/course";
import { CourseSearchOptions } from "@/infrastructure/api/baseConfig";

/**
 * Interface pour les états du hook useCourses
 */
interface UseCoursesState {
  courses: Course[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  hasMore: boolean;
  currentPage: number;
}

/**
 * Interface pour les méthodes du hook useCourses
 */
interface UseCoursesActions {
  refresh: () => Promise<void>;
  refetch: (
    page?: number,
    perPage?: number,
    searchOptions?: CourseSearchOptions,
  ) => Promise<void>;
  loadMore: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook React optimisé pour récupérer et gérer la liste des cours
 * Gère automatiquement les états loading, error et la pagination
 *
 * @param initialPage - Page initiale (défaut: 1)
 * @param initialPerPage - Nombre de cours par page (défaut: 10)
 * @param searchOptions - Options de recherche et filtrage
 * @returns Objet contenant les états et les méthodes
 */
export function useCourses(
  initialPage: number = 1,
  initialPerPage: number = 10,
  searchOptions?: CourseSearchOptions,
): UseCoursesState & UseCoursesActions {
  // États locaux
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [perPage] = useState(initialPerPage);

  /**
   * Fonction principale pour récupérer les cours
   */
  const fetchCourses = useCallback(
    async (
      page: number = currentPage,
      itemsPerPage: number = perPage,
      searchOpts?: CourseSearchOptions,
    ) => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔄 Chargement des cours...", {
          page,
          itemsPerPage,
          searchOpts,
        });

        const result = await CoursesUseCases.getCourses(
          page,
          itemsPerPage,
          searchOpts || searchOptions,
        );

        setCourses(result.courses);
        setTotal(result.total);
        setPages(result.pages);
        setCurrentPage(page);

        console.log(`✅ ${result.courses.length} cours chargés avec succès`);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur inconnue lors du chargement";
        setError(errorMessage);
        console.error("❌ Erreur dans useCourses:", err);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, perPage, searchOptions],
  );

  /**
   * Rafraîchir la liste (recharger depuis la première page)
   */
  const refresh = useCallback(async () => {
    await fetchCourses(1);
  }, [fetchCourses]);

  /**
   * Recharger avec des paramètres spécifiques
   */
  const refetch = async (
    page?: number,
    itemsPerPage?: number,
    searchOpts?: CourseSearchOptions,
  ) => {
    await fetchCourses(page, itemsPerPage, searchOpts);
  };

  /**
   * Charger plus de cours (pagination infinie)
   */
  const loadMore = useCallback(async () => {
    if (currentPage < pages && !loading) {
      await fetchCourses(currentPage + 1);
    }
  }, [currentPage, pages, loading, fetchCourses]);

  /**
   * Effacer l'erreur actuelle
   */
  const clearError = () => {
    setError(null);
  };

  // Calculer s'il y a plus de contenu à charger
  const hasMore = currentPage < pages && !loading;

  // Charger les cours au montage du composant
  useEffect(() => {
    fetchCourses();
  }, []);

  return {
    // États
    courses,
    loading,
    error,
    total,
    pages,
    hasMore,
    currentPage,

    // Actions
    refresh,
    refetch,
    loadMore,
    clearError,
  };
}

/**
 * Hook simplifié pour récupérer uniquement les cours de base
 * Idéal pour les listes simples sans pagination complexe
 */
export function useAllCourses(): {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { courses, loading, error, refresh } = useCourses(1, 8); // 8 courses per page

  return {
    courses,
    loading,
    error,
    refetch: refresh,
  };
}
