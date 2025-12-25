"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  X,
  Filter,
  Star,
  Clock,
  DollarSign,
  BookOpen,
  Users,
  ChevronDown,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroBanner } from "@/components/hero-banner";
import { CoursePagination } from "@/components/course-pagination";
import Swal from "sweetalert2";
import { useCourses } from "@/application/use-cases/useCourses";
import type { Course, CourseFilter } from "@/domain/entities/course";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { CourseCard } from "@/components/course-card";

const CoursesPage = () => {
  const { isAuthenticated, setRedirectAfterLogin } = useLocalAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CourseFilter>({
    categories: [],
    levels: [],
    priceRange: [],
    duration: [],
    rating: [],
  });

  // Utiliser le hook avec pagination pour récupérer les cours
  const {
    courses,
    loading,
    error,
    total,
    pages,
    currentPage: apiCurrentPage,
    refetch,
  } = useCourses(1, 8);

  // État local pour la pagination (évite les re-renders inutiles)
  const [localCurrentPage, setLocalCurrentPage] = useState(1);

  // Gestion du changement de page (sans appel API immédiat)
  const handlePageChange = useCallback((page: number) => {
    setLocalCurrentPage(page);
  }, []);

  // Appeler l'API seulement quand la page locale change
  useEffect(() => {
    if (localCurrentPage !== apiCurrentPage) {
      refetch(localCurrentPage, 8, {
        query: searchQuery,
      });
    }
  }, [localCurrentPage, apiCurrentPage, refetch, searchQuery]);

  // Recharger quand la recherche change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetch(1, 8, { query: searchQuery });
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, refetch]);

  // Écouter l'événement pour activer les tutos gratuits
  useEffect(() => {
    const handleActivateFreeTutorials = () => {
      setShowFilters(true);
      setFilters((prev) => ({
        ...prev,
        priceRange: ["free"],
      }));
    };

    window.addEventListener(
      "activateFreeTutorials",
      handleActivateFreeTutorials,
    );
    return () =>
      window.removeEventListener(
        "activateFreeTutorials",
        handleActivateFreeTutorials,
      );
  }, []);

  // Fonctions de gestion des filtres
  const toggleFilter = (category: keyof CourseFilter, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: (prev[category] as string[])?.includes(value)
        ? (prev[category] as string[])?.filter((item) => item !== value) || []
        : [...((prev[category] as string[]) || []), value],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      levels: [],
      priceRange: [],
      duration: [],
      rating: [],
    });
  };

  // Appliquer tous les filtres
  const applyFilters = (courses: Course[]) => {
    return courses.filter((course) => {
      // Filtrer par catégories
      if (filters.categories.length > 0) {
        const categoryName =
          typeof course.category === "string"
            ? course.category
            : course.category.name;
        if (!filters.categories.includes(categoryName.toLowerCase()))
          return false;
      }

      // Filtrer par niveau
      if (filters.levels.length > 0) {
        if (!filters.levels.includes(course.level.toLowerCase())) return false;
      }

      // Filtrer par prix
      if (filters.priceRange.length > 0) {
        const isFree = course.price === 0;

        if (filters.priceRange.includes("free") && !isFree) return false;
        if (filters.priceRange.includes("paid") && isFree) return false;
        if (filters.priceRange.includes("under-5000") && course.price >= 5000)
          return false;
        if (
          filters.priceRange.includes("5000-10000") &&
          (course.price < 5000 || course.price > 10000)
        )
          return false;
        if (filters.priceRange.includes("over-10000") && course.price <= 10000)
          return false;
      }

      // Filtrer par note
      if (filters.rating.length > 0) {
        if (
          filters.rating.includes("4+") &&
          (course.rating === undefined || course.rating < 4)
        )
          return false;
        if (
          filters.rating.includes("3+") &&
          (course.rating === undefined || course.rating < 3)
        )
          return false;
      }

      return true;
    });
  };

  // Appliquer la recherche et les filtres
  let filteredCourses = courses;

  // Appliquer la recherche
  if (searchQuery) {
    filteredCourses = filteredCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.description &&
          course.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (course.tags &&
          course.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          )),
    );
  }

  // Appliquer les filtres
  filteredCourses = applyFilters(filteredCourses);

  // Handlers pour les actions des cours
  const handleEnrollClick = (course: Course) => {
    console.log("Inscription au cours:", course.title);
    Swal.fire({
      title: "<strong>Inscription</strong>",
      text: `Inscription au cours "${course.title}"`,
      icon: "info",
      confirmButtonText: "OK",
    });
  };

  const handleVideoClick = (course: Course) => {
    console.log("Lecture vidéo du cours:", course.title);

    if (!isAuthenticated) {
      // Stocker la destination après connexion
      setRedirectAfterLogin(`/course-details/${course.id}`);
      // Rediriger vers la page de connexion
      window.location.href = "/login";
      return;
    }

    // Redirection vers la page du cours
    window.location.href = `/course-details/${course.id}`;
  };

  // Gestion des états de chargement et d'erreur
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">
              Chargement des cours...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col justify-center items-center h-64 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Erreur de chargement
            </h2>
            <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Tous nos cours
            </h1>

            {/* Champ de recherche dynamique */}
            <div className="relative w-full sm:max-w-sm lg:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 sm:pl-10 pr-10 py-2.5 sm:py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section de filtres professionnels */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {(filters.categories.length > 0 ||
                filters.levels.length > 0 ||
                filters.priceRange.length > 0 ||
                filters.rating.length > 0) && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary hover:text-primary/80 underline"
                >
                  Effacer tout
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Masquer" : "Afficher"} les filtres
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 sm:p-6 bg-muted/30 rounded-xl text-center">
              <p className="text-muted-foreground">
                🔧 Filtres à implémenter avec le backend
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Les données de filtrage seront chargées dynamiquement depuis
                l'API
              </p>
            </div>
          )}
        </div>

        {filteredCourses.length > 0 ? (
          <div id="formations">
            {/* Header avec nombre de résultats */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {searchQuery
                  ? `Résultats pour "${searchQuery}"`
                  : "Tous nos cours"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredCourses.length !== total
                  ? filteredCourses.length
                  : total}{" "}
                cours trouvé
                {filteredCourses.length !== total
                  ? filteredCourses.length
                  : total > 1
                    ? "s"
                    : ""}
              </p>
            </div>

            {/* Grid de cours - 4 cards par ligne comme Udemy/Coursera */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEnrollClick={handleEnrollClick}
                  onVideoClick={handleVideoClick}
                />
              ))}
            </div>

            {/* Pagination - masquée si filtres actifs */}
            {!(
              filters.categories.length > 0 ||
              filters.levels.length > 0 ||
              filters.priceRange.length > 0 ||
              filters.rating.length > 0
            ) && (
              <CoursePagination
                currentPage={localCurrentPage}
                totalPages={pages}
                total={total}
                limit={8}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery
                ? `Aucun cours trouvé pour "${searchQuery}"`
                : "Aucun cours disponible pour le moment."}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CoursesPage;
