import { useState, useEffect, useCallback, useRef } from "react";
import { CategoriesApi } from "@/infrastructure/api/categories-api";
import type { Category } from "@/domain/entities/course";

interface UseCategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

interface UseCategoriesActions {
  refresh: () => Promise<void>;
}

export function useCategories(): UseCategoriesState & UseCategoriesActions {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitialized = useRef(false);

  const fetchCategories = useCallback(async () => {
    // Éviter les appels multiples au premier rendu
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Récupération des catégories...");

      const result = await CategoriesApi.getCategories();

      if (!abortControllerRef.current.signal.aborted) {
        setCategories(result);
        console.log(`✅ ${result.length} catégories chargées avec succès`);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        console.error("❌ Erreur lors de la récupération des catégories:", err);
        setError(errorMessage);
        setCategories([]);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchCategories();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCategories]);

  const refresh = useCallback(async () => {
    return fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refresh,
  };
}
