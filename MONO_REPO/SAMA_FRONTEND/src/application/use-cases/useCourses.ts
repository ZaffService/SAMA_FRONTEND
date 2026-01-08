import { useState, useEffect, useCallback, useRef } from "react";
import { CoursesUseCases } from "./courses-use-cases";
import { Course } from "@/domain/entities/course";
import { CourseSearchOptions } from "@/infrastructure/api/baseConfig";

interface UseCoursesState {
  courses: Course[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  hasMore: boolean;
  currentPage: number;
  filterData: {
    categories: Array<{ id: string; name: string; count: number }>;
    levels: Array<{ id: string; name: string; count: number }>;
    priceRanges: Array<{ id: string; name: string; count: number }>;
  };
  filterLoading: boolean;
}

interface UseCoursesActions {
  setPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  refresh: () => Promise<void>;
  clearError: () => void;
  refetch: () => Promise<void>;
}

export function useCourses(
  initialPage: number = 1,
  initialPerPage: number = 8,
): UseCoursesState & UseCoursesActions {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState("");

  const [filterData, setFilterData] = useState<{
    categories: Array<{ id: string; name: string; count: number }>;
    levels: Array<{ id: string; name: string; count: number }>;
    priceRanges: Array<{ id: string; name: string; count: number }>;
  }>({
    categories: [],
    levels: [],
    priceRanges: [],
  });
  const [filterLoading, setFilterLoading] = useState(false);

  const perPage = useRef(initialPerPage);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialMount = useRef(true); // ✅ Track initial mount

  /**
   * ✅ Fonction stable de récupération
   */
  const fetchCourses = useCallback(async (page: number, query: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      console.log("🔄 fetchCourses appelé:", {
        page,
        query,
        perPage: perPage.current,
      });

      const searchOptions: CourseSearchOptions | undefined = query
        ? { query }
        : undefined;

      const result = await CoursesUseCases.getCourses(
        page,
        perPage.current,
        searchOptions,
      );

      if (!abortControllerRef.current.signal.aborted) {
        setCourses(result.courses);
        setTotal(result.total);
        setPages(result.pages);
        // ✅ Mettre à jour currentPage ici aussi pour sync
        setCurrentPage(page);
        console.log(
          `✅ ${result.courses.length} cours chargés (page ${page}/${result.pages})`,
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("🚫 Requête annulée");
        return;
      }

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur inconnue lors du chargement";
      setError(errorMessage);
      console.error("❌ Erreur dans useCourses:", err);
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * ✅ Debounce pour la recherche
   */
  useEffect(() => {
    // Skip si c'est le montage initial
    if (isInitialMount.current) {
      return;
    }

    console.log("🔍 Recherche modifiée:", searchQuery);
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset à page 1
      fetchCourses(1, searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchCourses]);

  /**
   * ✅ Changement de page
   */
  useEffect(() => {
    // Skip le montage initial
    if (isInitialMount.current) {
      return;
    }

    console.log("📄 useEffect [currentPage]:", currentPage);
    fetchCourses(currentPage, searchQuery);
  }, [currentPage, fetchCourses, searchQuery]);

  /**
   * ✅ Fonction pour charger les données de filtrage
   */
  const loadFilterData = useCallback(async () => {
    try {
      setFilterLoading(true);
      const mockFilterData = {
        categories: [
          { id: "marketing", name: "Marketing Digital", count: 25 },
          { id: "community", name: "Community Management", count: 18 },
          { id: "content", name: "Content Marketing", count: 15 },
          { id: "social", name: "Réseaux Sociaux", count: 22 },
          { id: "seo", name: "SEO/SEA", count: 12 },
        ],
        levels: [
          { id: "beginner", name: "Débutant", count: 35 },
          { id: "intermediate", name: "Intermédiaire", count: 28 },
          { id: "advanced", name: "Avancé", count: 15 },
        ],
        priceRanges: [
          { id: "free", name: "Gratuit", count: 8 },
          { id: "under-5000", name: "Moins de 5 000 FCFA", count: 22 },
          { id: "5000-10000", name: "5 000 - 10 000 FCFA", count: 18 },
          { id: "over-10000", name: "Plus de 10 000 FCFA", count: 12 },
        ],
      };

      await new Promise((resolve) => setTimeout(resolve, 500));
      setFilterData(mockFilterData);
    } catch (err) {
      console.error("Erreur chargement données filtrage:", err);
    } finally {
      setFilterLoading(false);
    }
  }, []);

  /**
   * ✅ Chargement initial
   */
  useEffect(() => {
    console.log("🏁 Montage initial du hook");
    fetchCourses(initialPage, "");
    loadFilterData();

    // Marquer la fin du montage initial
    isInitialMount.current = false;
  }, [fetchCourses, loadFilterData, initialPage]);

  /**
   * ✅ setPage SANS dépendances (fonction stable)
   */
  const setPage = useCallback((page: number) => {
    console.log("🔧 setPage appelé avec page:", page);
    console.log("🔧 setCurrentPage va être appelé");
    setCurrentPage(page);
    console.log(
      "🔧 setCurrentPage appelé - page devrait passer de",
      currentPage,
      "à",
      page,
    );
  }, []); // ✅ AUCUNE dépendance !

  const refresh = useCallback(async () => {
    await fetchCourses(1, searchQuery);
  }, [fetchCourses, searchQuery]);

  const refetch = useCallback(async () => {
    await fetchCourses(currentPage, searchQuery);
  }, [fetchCourses, currentPage, searchQuery]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasMore = currentPage < pages && !loading;

  // ✅ Debug: logger chaque render
  console.log("🔄 useCourses render - currentPage:", currentPage);

  return {
    courses,
    loading,
    error,
    total,
    pages,
    hasMore,
    currentPage,
    filterData,
    filterLoading,
    setPage,
    setSearchQuery,
    refresh,
    clearError,
    refetch,
  };
}
