import { useState, useEffect, useCallback, useRef } from "react";
import { CoursesUseCases } from "./courses-use-cases";
import { Course } from "@/domain/entities/course";
import { CourseSearchOptions } from "@/infrastructure/api/baseConfig";

interface UseCoursesState {
  courses: Course[];
  loading: boolean;
  error: string | null;
  showMaintenance: boolean;
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
  setFilterCategories: (categoryIds: string[]) => void;
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
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
   const fetchCourses = useCallback(async (page: number, query: string, categories: string[] = []) => {
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
         categories,
         perPage: perPage.current,
       });

       // Construire les options de recherche
       const searchOptions: CourseSearchOptions | undefined = (query || categories.length > 0)
         ? { 
             query: query || undefined,
             categoryId: categories.length > 0 ? categories[0] : undefined // API accepte une catégorie à la fois
           }
         : undefined;

       const result = await CoursesUseCases.getCourses(
         page,
         perPage.current,
         searchOptions,
       );

       if (!abortControllerRef.current.signal.aborted) {
         setShowMaintenance(false); // ✅ Backend répond, cacher la page maintenance
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
       setShowMaintenance(true); // ✅ Afficher la page maintenance
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
       fetchCourses(1, searchQuery, selectedCategories);
     }, 300);

     return () => clearTimeout(timeoutId);
   }, [searchQuery, fetchCourses, selectedCategories]);

  /**
    * ✅ Écouter les changements de catégories
    */
   useEffect(() => {
     if (isInitialMount.current) {
       return;
     }

     console.log("🎯 Catégories modifiées:", selectedCategories);
     fetchCourses(1, searchQuery, selectedCategories);
   }, [selectedCategories, fetchCourses, searchQuery]);

  /**
    * ✅ Changement de page
    */
   useEffect(() => {
     // Skip le montage initial
     if (isInitialMount.current) {
       return;
     }

     console.log("📄 useEffect [currentPage]:", currentPage);
     fetchCourses(currentPage, searchQuery, selectedCategories);
   }, [currentPage, fetchCourses, searchQuery, selectedCategories]);

  /**
    * ✅ Fonction pour charger les données de filtrage
    */
   const loadFilterData = useCallback(async () => {
     try {
       console.log("🔄 [loadFilterData] Début chargement des données de filtrage");
       setFilterLoading(true);

       // Fetch real categories from API
       console.log("🔍 [loadFilterData] Appel à CoursesUseCases.getCategories()");
       const categories = await CoursesUseCases.getCategories();
       console.log("✅ [loadFilterData] Catégories reçues:", categories);

       // Mock data for levels and price ranges (can be updated later if API provides them)
       const mockFilterData = {
         categories: categories.map(cat => ({
           id: cat.id,
           name: cat.name,
           count: 0, // TODO: Get count from API if available
         })),
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

       setFilterData(mockFilterData);
     } catch (err) {
       console.error("❌ Erreur chargement données filtrage:", err);
       console.error("❌ Détails de l'erreur:", err instanceof Error ? err.message : err);
       // Fallback temporaire avec vraies données pour que ça fonctionne
       console.log("⚠️ Utilisation du fallback temporaire");
       setFilterData({
         categories: [
           { id: "3d4b99d6-1d8f-4dab-b20f-9f7a791a48c1", name: "Gestion", count: 2 },
           { id: "75adc1cb-a5b6-497f-bb28-a55c36b995eb", name: "Développement web", count: 2 },
           { id: "432bfdae-6f51-4248-aec9-8f2fec204c58", name: "Création de contenu", count: 2 },
           { id: "fa93ca42-66e5-4bd7-87ae-ca921df46f04", name: "Marketing digital", count: 2 },
           { id: "af9f5bc7-b055-4851-8190-7b73c6aeb41a", name: "Intelligence Artificielle", count: 2 },
           { id: "ea7b4c15-e7cd-456e-bd09-5749d3d32367", name: "Informatique bureautique", count: 0 },
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
       });
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
    await fetchCourses(1, searchQuery, selectedCategories);
  }, [fetchCourses, searchQuery, selectedCategories]);

  const refetch = useCallback(async () => {
    await fetchCourses(currentPage, searchQuery, selectedCategories);
  }, [fetchCourses, currentPage, searchQuery, selectedCategories]);

  const setFilterCategories = useCallback((categoryIds: string[]) => {
    console.log("🎯 [setFilterCategories] Catégories:", categoryIds);
    setSelectedCategories(categoryIds);
    setCurrentPage(1);
    // ✅ Laisser le useEffect de selectedCategories appeler fetchCourses
  }, []);

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
    showMaintenance,
    total,
    pages,
    hasMore,
    currentPage,
    filterData,
    filterLoading,
    setPage,
    setSearchQuery,
    setFilterCategories,
    refresh,
    clearError,
    refetch,
  };
}
