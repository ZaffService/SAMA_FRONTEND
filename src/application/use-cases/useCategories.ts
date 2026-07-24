"use client";

/**
 * Module Catégories — lecture via TanStack Query
 *
 * Conserve la même API publique (categories, loading, error, refresh)
 * pour ne rien casser dans page.tsx / mega-menu / admin.
 */

import { useQuery } from "@tanstack/react-query";
import { CategoriesApi } from "@/infrastructure/api/categories-api";
import type { Category } from "@/domain/entities/course";
import { categoryKeys } from "@/shared/helpers/query-keys";

// Ré-export pour les imports existants / mutations
export { categoryKeys } from "@/shared/helpers/query-keys";

interface UseCategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

interface UseCategoriesActions {
  refresh: () => Promise<void>;
}

export function useCategories(): UseCategoriesState & UseCategoriesActions {
  const query = useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => CategoriesApi.getCategories(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    categories: query.data ?? [],
    loading: query.isPending,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Erreur inconnue"
      : null,
    refresh: async () => {
      await query.refetch();
    },
  };
}
