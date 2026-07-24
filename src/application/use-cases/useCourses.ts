"use client";

/**
 * Liste des cours via TanStack Query
 *
 * - Les filtres restent en state local (page, query, categories)
 * - Debounce 300ms avant de changer la queryKey (évite un fetch à chaque frappe)
 * - queryKey inclut les filtres → cache par combinaison de recherche
 * - API publique inchangée pour les pages existantes
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CoursesUseCases } from "./courses-use-cases";
import { CourseSearchOptions } from "@/infrastructure/api/baseConfig";
import { BackendCourse } from "@/infrastructure/api/courses-api";
import { courseKeys } from "@/shared/helpers/query-keys";
import logger from "@/shared/helpers/logger";

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

const MAX_FETCH_ALL_PAGES = 20;

async function fetchCoursesPage(
  filters: FiltersState,
  perPage: number,
  fetchAll: boolean,
) {
  const searchOptions: CourseSearchOptions | undefined =
    filters.query || filters.categories.length > 0
      ? {
          query: filters.query || undefined,
          categoryId: filters.categories[0] || undefined,
        }
      : undefined;

  if (fetchAll) {
    const firstResult = await CoursesUseCases.getCourses(
      1,
      perPage,
      searchOptions,
    );

    let allCourses = [...(firstResult.courses || [])];
    let totalPages = firstResult.pages ?? 1;
    const totalFromApi = firstResult.total;
    let hasCourses = firstResult.hasCoursesInDatabase;

    if (totalPages < 1) totalPages = 1;
    const safeTotalPages = Math.min(totalPages, MAX_FETCH_ALL_PAGES);

    for (let page = 2; page <= safeTotalPages; page += 1) {
      const pageResult = await CoursesUseCases.getCourses(
        page,
        perPage,
        searchOptions,
      );
      allCourses = allCourses.concat(pageResult.courses || []);
      hasCourses = hasCourses || pageResult.hasCoursesInDatabase;
    }

    if (totalPages > MAX_FETCH_ALL_PAGES) {
      logger.warn(
        `⚠️ [useCourses] fetchAll limité à ${MAX_FETCH_ALL_PAGES} pages (total API: ${totalPages})`,
      );
    }

    return {
      courses: allCourses,
      total: totalFromApi ?? allCourses.length,
      pages: 1,
      hasCoursesInDatabase: hasCourses,
    };
  }

  const result = await CoursesUseCases.getCourses(
    filters.page,
    perPage,
    searchOptions,
  );

  return {
    courses: result.courses,
    total: result.total,
    pages: result.pages,
    hasCoursesInDatabase: result.hasCoursesInDatabase,
  };
}

export function useCourses(
  initialPage: number = 1,
  initialPerPage: number = 8,
  options?: UseCoursesOptions,
): UseCoursesState & UseCoursesActions {
  const fetchAll = options?.fetchAll ?? false;
  const perPage = useRef(initialPerPage);

  const [filters, setFilters] = useState<FiltersState>({
    page: initialPage,
    query: "",
    categories: [],
  });

  // Debounce : on ne change la queryKey qu'après 300ms sans frappe
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(t);
  }, [filters]);

  const listQuery = useQuery({
    queryKey: courseKeys.list({
      page: debouncedFilters.page,
      perPage: perPage.current,
      query: debouncedFilters.query || undefined,
      categoryId: debouncedFilters.categories[0] || undefined,
      fetchAll,
    }),
    queryFn: () =>
      fetchCoursesPage(debouncedFilters, perPage.current, fetchAll),
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const filtersQuery = useQuery({
    queryKey: courseKeys.filters(),
    queryFn: () => CoursesUseCases.getCourseFilters(),
    staleTime: 5 * 60 * 1000,
  });

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
    void listQuery.refetch();
  }, [listQuery]);

  const clearError = useCallback(() => {
    // no-op compatible : l'erreur vient de la query
  }, []);

  const pages = listQuery.data?.pages ?? 0;
  const effectivePages = fetchAll ? 1 : pages;
  const effectivePage = fetchAll ? 1 : filters.page;
  const loading = listQuery.isFetching;
  const hasMore = !fetchAll && filters.page < pages && !loading;

  const errorMessage = listQuery.error
    ? listQuery.error instanceof Error
      ? listQuery.error.message
      : "Erreur de chargement"
    : null;

  const showMaintenance = Boolean(
    errorMessage && errorMessage.includes("Impossible de se connecter au serveur"),
  );

  const filterData = useMemo(
    () =>
      filtersQuery.data ?? {
        categories: [],
        levels: [],
        priceRanges: [],
      },
    [filtersQuery.data],
  );

  return {
    courses: listQuery.data?.courses ?? [],
    loading,
    error: errorMessage,
    showMaintenance,
    total: listQuery.data?.total ?? 0,
    pages: effectivePages,
    hasMore,
    currentPage: effectivePage,
    filterData,
    filterLoading: filtersQuery.isPending,
    setPage,
    setSearchQuery,
    setFilterCategories,
    refresh,
    refetch,
    clearError,
    hasCoursesInDatabase: listQuery.data?.hasCoursesInDatabase ?? false,
  };
}
