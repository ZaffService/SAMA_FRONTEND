import { useState, useEffect, useCallback, useRef } from "react";
import { CoursesUseCases } from "./courses-use-cases";
import { Course } from "@/domain/entities/course";
import { CourseSearchOptions } from "@/infrastructure/api/baseConfig";

/* =====================================================
   TYPES
===================================================== */

interface FiltersState {
  page: number;
  query: string;
  categories: string[];
}

interface UseCoursesState {
  courses: Course[];
  loading: boolean;
  error: string | null;
  showMaintenance: boolean;
  total: number;
  pages: number;
  hasCoursesInDatabase: boolean;
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
  setFilterCategories: (categoryIds: string[]) => void;
  refresh: () => void;
  refetch: () => void;
  clearError: () => void;
}

/* =====================================================
   HOOK
===================================================== */

export function useCourses(
  initialPage: number = 1,
  initialPerPage: number = 8,
): UseCoursesState & UseCoursesActions {
  /* =======================
     STATES
  ======================= */

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [hasCoursesInDatabase, setHasCoursesInDatabase] = useState(false);

  const [filterData, setFilterData] = useState({
    categories: [] as Array<{ id: string; name: string; count: number }>,
    levels: [] as Array<{ id: string; name: string; count: number }>,
    priceRanges: [] as Array<{ id: string; name: string; count: number }>,
  });
  const [filterLoading, setFilterLoading] = useState(false);

  /* =======================
     FILTRES (SOURCE UNIQUE)
  ======================= */

  const [filters, setFilters] = useState<FiltersState>({
    page: initialPage,
    query: "",
    categories: [],
  });

  const perPage = useRef(initialPerPage);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  /* =====================================================
     FETCH COURSES (API ONLY)
  ===================================================== */

  const fetchCourses = useCallback(async (currentFilters: FiltersState) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const searchOptions: CourseSearchOptions | undefined =
        currentFilters.query || currentFilters.categories.length > 0
          ? {
              query: currentFilters.query || undefined,
              categoryId: currentFilters.categories[0] || undefined, // 1 catégorie assumée
            }
          : undefined;

      const result = await CoursesUseCases.getCourses(
        currentFilters.page,
        perPage.current,
        searchOptions,
      );

      if (!controller.signal.aborted) {
        setCourses(result.courses);
        setTotal(result.total);
        setPages(result.pages);
        setHasCoursesInDatabase(result.hasCoursesInDatabase);
        setShowMaintenance(false);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setShowMaintenance(true);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  /* =====================================================
     FETCH COURSES (DEBOUNCED)
  ===================================================== */

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchCourses(filters);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchCourses(filters);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filters, fetchCourses]);

  /* =====================================================
     FILTER DATA — API ONLY (NO MOCK)
  ===================================================== */

  const loadFilterData = useCallback(async () => {
    try {
      setFilterLoading(true);
      const data = await CoursesUseCases.getCourseFilters();
      setFilterData(data);
    } catch (err) {
      console.error("❌ Erreur chargement filtres", err);
      setFilterData({
        categories: [],
        levels: [],
        priceRanges: [],
      });
    } finally {
      setFilterLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFilterData();
  }, [loadFilterData]);

  /* =====================================================
     ACTIONS (NO DIRECT FETCH)
  ===================================================== */

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, query, page: 1 }));
  }, []);

  const setFilterCategories = useCallback((categoryIds: string[]) => {
    setFilters((prev) => ({ ...prev, categories: categoryIds, page: 1 }));
  }, []);

  const refresh = useCallback(() => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const refetch = useCallback(() => {
    setFilters((prev) => ({ ...prev }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /* =====================================================
     DERIVED STATE
  ===================================================== */

  const hasMore = filters.page < pages && !loading;

  /* =====================================================
     RETURN
  ===================================================== */

  return {
    courses,
    loading,
    error,
    showMaintenance,
    total,
    pages,
    hasMore,
    currentPage: filters.page,
    filterData,
    filterLoading,
    setPage,
    setSearchQuery,
    setFilterCategories,
    refresh,
    refetch,
    clearError,
    hasCoursesInDatabase,
  };
}
