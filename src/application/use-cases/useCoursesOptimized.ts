"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { Course } from "@/domain/entities/course";
import { transformApiCourses } from "@/domain/entities/course";
import logger from "@/shared/helpers/logger";

// Cache mémoire avec SWR pattern
const memoryCache = new Map<string, { data: Course[]; timestamp: number }>();
const CACHE_KEY = "courses_optimized_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STALE_DURATION = 30 * 1000; // 30 secondes avant revalidation

export function useCoursesOptimized(category?: string, search?: string) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRevalidating, setIsRevalidating] = useState(false);

  const revalidateInBackground = useCallback(async () => {
    if (isRevalidating) return;

    setIsRevalidating(true);
    logger.log("🚀 Démarrage du chargement des cours optimisé...");

    try {
      // Déterminer la source de données selon les filtres
      let response: Course[];

      if (category && category !== "Tous") {
        // Filtrer par catégorie
        response = transformApiCourses((await CoursesApi.getCourses()).courses); // TODO: Implement category filtering
      } else if (search && search.trim()) {
        // Recherche textuelle
        response = transformApiCourses((await CoursesApi.getCourses()).courses); // TODO: Implement search
      } else {
        // Tous les cours
        response = transformApiCourses((await CoursesApi.getCourses()).courses);
      }

      logger.log("✅ Cours chargés:", response.length);

      if (response && response.length > 0) {
        setCourses(response);

        // Mettre en cache mémoire
        memoryCache.set(CACHE_KEY, {
          data: response,
          timestamp: Date.now(),
        });

        setError(null);
      } else {
        logger.log("⚠️ Aucun cours trouvé avec les filtres actuels");
        setCourses([]);
        setError(null); // Pas d'erreur, simplement aucun résultat
      }
    } catch (err) {
      logger.error("❌ Erreur lors du chargement des cours:", err);

      // Ne pas écraser les données si on a du cache
      if (courses.length === 0) {
        setError(err instanceof Error ? err.message : "Erreur de connexion");
      }
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, [isRevalidating, courses.length, category, search]);

  // Charger depuis le cache mémoire immédiatement
  useEffect(() => {
    const cached = memoryCache.get(CACHE_KEY);

    // Si pas de filtre, utiliser le cache global
    if (!category && !search && cached) {
      const age = Date.now() - cached.timestamp;

      logger.log("📦 Utilisation du cache, âge:", age, "ms");
      setCourses(cached.data);
      setLoading(false);

      // Si cache est stale, revalider en arrière-plan
      if (age > STALE_DURATION) {
        revalidateInBackground();
      }
    } else {
      logger.log("🔍 Filtres détectés ou pas de cache, chargement forcé...");
      revalidateInBackground();
    }
  }, [category, search, revalidateInBackground]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtrer les cours avec memoization (filtrage côté client en complément)
  const filtered = useMemo(() => {
    return courses.filter((course) => {
      if (category && category !== "Tous") {
        if (course.categoryId !== category) {
          return false;
        }
      }

      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        const titleMatch = course.title.toLowerCase().includes(searchLower);
        const descriptionMatch = course.description
          ? course.description.toLowerCase().includes(searchLower)
          : false;
        const tagMatch = course.tags
          ? course.tags.some((tag) => tag.toLowerCase().includes(searchLower))
          : false;

        if (!titleMatch && !descriptionMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });
  }, [courses, category, search]);

  // Fonction pour obtenir les cours populaires
  const getPopularCourses = useCallback(async (limit: number = 6) => {
    try {
      return transformApiCourses((await CoursesApi.getCourses()).courses); // TODO: Implement popular courses
    } catch (err) {
      logger.error("Erreur lors du chargement des cours populaires:", err);
      return [];
    }
  }, []);

  // Fonction pour obtenir les cours gratuits
  const getFreeCourses = useCallback(async () => {
    try {
      return transformApiCourses((await CoursesApi.getCourses()).courses); // TODO: Implement free courses
    } catch (err) {
      logger.error("Erreur lors du chargement des cours gratuits:", err);
      return [];
    }
  }, []);

  // Fonction pour obtenir les cours récents
  const getRecentCourses = useCallback(async (limit: number = 6) => {
    try {
      return transformApiCourses((await CoursesApi.getCourses()).courses); // TODO: Implement recent courses
    } catch (err) {
      logger.error("Erreur lors du chargement des cours récents:", err);
      return [];
    }
  }, []);

  return {
    courses: filtered,
    allCourses: courses, // Tous les cours pour d'autres usages
    loading,
    error,
    isRevalidating,
    refetch: revalidateInBackground,
    getPopularCourses,
    getFreeCourses,
    getRecentCourses,
  };
}
