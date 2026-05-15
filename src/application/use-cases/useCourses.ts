import { useState, useEffect, useCallback, useRef } from "react";
import { CoursesUseCases } from "./courses-use-cases";
import { Course } from "@/domain/entities/course";
import { CourseSearchOptions } from "@/infrastructure/api/baseConfig";
import { BackendCourse } from "@/infrastructure/api/courses-api";
import logger from "@/shared/helpers/logger";

/* =====================================================
   TYPES
===================================================== */

interface FiltersState {
  page: number;
  query: string;
  categories: string[];
}

interface UseCoursesState {
  courses: BackendCourse[];
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

interface UseCoursesOptions {
  fetchAll?: boolean;
}

/* =====================================================
   HOOK
===================================================== */

export function useCourses(
  initialPage: number = 1,
  initialPerPage: number = 500,
  options?: UseCoursesOptions,
): UseCoursesState & UseCoursesActions {
  const MAX_FETCH_ALL_PAGES = 20;
  /* =======================
     STATES
  ======================= */

  const [courses, setCourses] = useState<BackendCourse[]>([]);
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
  const fetchAll = options?.fetchAll ?? false;
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

      if (fetchAll) {
        const firstResult = await CoursesUseCases.getCourses(
          1,
          perPage.current,
          searchOptions,
        );

        if (controller.signal.aborted) return;

        let allCourses = [...(firstResult.courses || [])];
        let totalPages = firstResult.pages ?? 1;
        const totalFromApi = firstResult.total;
        let hasCourses = firstResult.hasCoursesInDatabase;

        if (totalPages < 1) {
          totalPages = 1;
        }

        const safeTotalPages = Math.min(totalPages, MAX_FETCH_ALL_PAGES);

        for (let page = 2; page <= safeTotalPages; page += 1) {
          if (controller.signal.aborted) return;
          const pageResult = await CoursesUseCases.getCourses(
            page,
            perPage.current,
            searchOptions,
          );
          allCourses = allCourses.concat(pageResult.courses || []);
          hasCourses = hasCourses || pageResult.hasCoursesInDatabase;
        }

        if (!controller.signal.aborted) {
          setCourses(allCourses);
          setTotal(totalFromApi ?? allCourses.length);
          setPages(1);
          setHasCoursesInDatabase(hasCourses);
          setShowMaintenance(false);
          if (totalPages > MAX_FETCH_ALL_PAGES) {
            logger.warn(
              `⚠️ [useCourses] fetchAll limité à ${MAX_FETCH_ALL_PAGES} pages (total API: ${totalPages})`,
            );
          }
        }
      } else {
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
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      const message =
        err instanceof Error ? err.message : "Erreur de chargement";
      setError(message);
      const isNetworkError =
        err instanceof Error &&
        err.message.includes("Impossible de se connecter au serveur");
      setShowMaintenance(isNetworkError);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [fetchAll]);

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
      logger.error("❌ Erreur chargement filtres", err);
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

  const effectivePages = fetchAll ? 1 : pages;
  const effectivePage = fetchAll ? 1 : filters.page;
  const hasMore = !fetchAll && filters.page < pages && !loading;

  /* =====================================================
     RETURN
  ===================================================== */

  return {
    courses,
    loading,
    error,
    showMaintenance,
    total,
    pages: effectivePages,
    hasMore,
    currentPage: effectivePage,
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
