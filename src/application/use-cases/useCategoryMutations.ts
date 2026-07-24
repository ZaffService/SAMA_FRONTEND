"use client";

/**
 * Mutations catégories (create / update / delete)
 *
 * Pourquoi useMutation ?
 * - Après un CRUD, on invalide UNIQUEMENT categoryKeys.list()
 * - Toutes les pages qui utilisent useCategories() se resynchronisent
 * - CategoriesApi reste la seule couche réseau
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoriesApi } from "@/infrastructure/api/categories-api";
import { categoryKeys } from "@/shared/helpers/query-keys";

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      CategoriesApi.createCategory(payload),
    onSuccess: () => {
      // Invalide la liste → refetch des écrans qui affichent les catégories
      void queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: { name?: string; description?: string };
    }) => CategoriesApi.updateCategory(categoryId, data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(variables.categoryId),
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => CategoriesApi.deleteCategory(categoryId),
    onSuccess: (_result, categoryId) => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(categoryId),
      });
    },
  });
}
