"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Swal from "sweetalert2";
import { useCourses } from "@/application/use-cases/useCourses";
import type { Course, CourseFilter } from "@/domain/entities/course";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { CourseCard } from "@/components/course-card";
import MaintenancePage from "@/components/MaintenancePage";

const CoursesPage = () => {
  const { isAuthenticated, setRedirectAfterLogin } = useLocalAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CourseFilter>({
    categories: [],
    levels: [],
    priceRange: [],
    duration: [],
    rating: [],
  });

  // ✅ Hook unique avec gestion intégrée de la pagination et recherche
  const {
    courses,
    loading,
    error,
    showMaintenance,
    refetch,
    total,
    pages,
    currentPage,
    filterData,
    filterLoading,
    setPage,
    setSearchQuery,
    setFilterCategories,
    refresh,
  } = useCourses(1, 8);

  // ✅ État local uniquement pour l'input de recherche (UI)
  const [searchInputValue, setSearchInputValue] = useState("");

  // ✅ Synchroniser l'input avec le hook (debounce géré dans le hook)
  useEffect(() => {
    setSearchQuery(searchInputValue);
  }, [searchInputValue, setSearchQuery]);

  // Événement pour activer les tutos gratuits
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
  const clearAllFilters = useCallback(() => {
    // ✅ Effacer les catégories côté serveur d'abord
    setFilterCategories([]);

    // ✅ Puis effacer tous les filtres côté client
    setFilters({
      categories: [],
      levels: [],
      priceRange: [],
      duration: [],
      rating: [],
    });
  }, [setFilterCategories]);

  // Appliquer les filtres côté client (seulement prix, niveau, rating - pas catégories)
  const applyFilters = useCallback(
    (courses: Course[]) => {
      return courses.filter((course) => {
        // ✅ NE PAS FILTRER PAR CATÉGORIES ICI - Le backend s'en charge

        if (filters.levels.length > 0) {
          if (!filters.levels.includes(course.level.toLowerCase()))
            return false;
        }

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
          if (
            filters.priceRange.includes("over-10000") &&
            course.price <= 10000
          )
            return false;
        }

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
    },
    [filters],
  );

  const filteredCourses = applyFilters(courses);

  // Handlers pour les actions des cours
  const handleEnrollClick = useCallback((course: Course) => {
    console.log("Inscription au cours:", course.title);
    Swal.fire({
      title: "<strong>Inscription</strong>",
      text: `Inscription au cours "${course.title}"`,
      icon: "info",
      confirmButtonText: "OK",
    });
  }, []);

  const handleVideoClick = useCallback(
    (course: Course) => {
      console.log("Lecture vidéo du cours:", course.title);

      if (!isAuthenticated) {
        setRedirectAfterLogin(`/course-details/${course.id}`);
        window.location.href = "/login";
        return;
      }

      // ✅ Redirection toujours vers la page de détails
      window.location.href = `/course-details/${course.id}`;
    },
    [isAuthenticated, setRedirectAfterLogin],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
    },
    [setPage],
  );

  // Gestion du loading
  if (loading && courses.length === 0) {
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

  // ✅ Afficher la page de maintenance si le backend ne répond pas
  if (showMaintenance) {
    return <MaintenancePage onRetry={refetch} />;
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
              onClick={refresh}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.levels.length > 0 ||
    filters.priceRange.length > 0 ||
    filters.rating.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 pt-20 sm:pt-24 lg:pt-28">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Tous nos cours
            </h1>

            {/* Champ de recherche */}
            <div className="relative w-full sm:max-w-sm lg:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                className="block w-full pl-9 sm:pl-10 pr-10 py-2.5 sm:py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
              />
              {searchInputValue && (
                <button
                  onClick={() => setSearchInputValue("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section Explorez par domaine */}
        {!filterLoading && filterData.categories.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Explorez par domaine
              </h2>
              <p className="text-muted-foreground">
                Trouvez la formation qui correspond à vos objectifs
              </p>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div></div>
              <button
                onClick={() => {
                  setFilters((prev) => ({
                    ...prev,
                    categories: [],
                  }));
                  setFilterCategories([]);
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                  filters.categories.length === 0
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background text-muted-foreground hover:bg-muted border-border hover:border-primary/50"
                }`}
              >
                <span className="text-base">🌐</span>
                <span>Voir tout</span>
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {filterData.categories.map((category) => {
                const isSelected = filters.categories.includes(category.id);
                const getCategoryIcon = (name: string) => {
                  const lowerName = name.toLowerCase();
                  if (lowerName.includes('développement') || lowerName.includes('web')) return '💻';
                  if (lowerName.includes('intelligence') || lowerName.includes('ia')) return '🤖';
                  if (lowerName.includes('marketing') || lowerName.includes('digital')) return '📈';
                  if (lowerName.includes('contenu') || lowerName.includes('création')) return '🎨';
                  if (lowerName.includes('gestion') || lowerName.includes('management')) return '👔';
                  if (lowerName.includes('informatique') || lowerName.includes('bureautique')) return '💼';
                  return '📚';
                };

                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      console.log("🖱️ Clic sur catégorie:", category.name, category.id);
                      const newCategories = filters.categories.includes(category.id)
                        ? filters.categories.filter(id => id !== category.id)
                        : [...filters.categories, category.id];
                      console.log("📋 Nouvelles catégories:", newCategories);

                      // ✅ PREMIÈRE: Mettre à jour le hook
                      setFilterCategories(newCategories);

                      // ✅ DEUXIÈME: Mettre à jour l'UI locale en dernier
                      setFilters((prev) => ({
                        ...prev,
                        categories: newCategories,
                      }));
                    }}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background text-muted-foreground hover:bg-muted border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-base">{getCategoryIcon(category.name)}</span>
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section de filtres */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary hover:text-primary/80"
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
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
              {filterLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">
                    Chargement des filtres...
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Catégories */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Catégories
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filterData.categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category.id)}
                            onChange={() => {
                              console.log("☑️ Checkbox catégorie:", category.name, category.id);
                              const newCategories = filters.categories.includes(category.id)
                                ? filters.categories.filter((c) => c !== category.id)
                                : [...filters.categories, category.id];
                              console.log("📋 Nouvelles catégories (checkbox):", newCategories);

                              // ✅ PREMIÈRE: Mettre à jour le hook
                              setFilterCategories(newCategories);

                              // ✅ DEUXIÈME: Mettre à jour l'UI locale en dernier
                              setFilters((prev) => ({
                                ...prev,
                                categories: newCategories,
                              }));
                            }}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-muted-foreground">
                            {category.name} ({category.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Niveaux */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Niveau
                    </h3>
                    <div className="space-y-2">
                      {filterData.levels.map((level) => (
                        <label
                          key={level.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={filters.levels.includes(
                              level.name.toLowerCase(),
                            )}
                            onChange={() => {
                              const levelName = level.name.toLowerCase();
                              setFilters((prev) => ({
                                ...prev,
                                levels: prev.levels.includes(levelName)
                                  ? prev.levels.filter((l) => l !== levelName)
                                  : [...prev.levels, levelName],
                              }));
                            }}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-muted-foreground">
                            {level.name} ({level.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Prix */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Prix</h3>
                    <div className="space-y-2">
                      {filterData.priceRanges.map((range) => (
                        <label
                          key={range.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={filters.priceRange.includes(range.id)}
                            onChange={() => {
                              setFilters((prev) => ({
                                ...prev,
                                priceRange: prev.priceRange.includes(range.id)
                                  ? prev.priceRange.filter(
                                      (p) => p !== range.id,
                                    )
                                  : [...prev.priceRange, range.id],
                              }));
                            }}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-muted-foreground">
                            {range.name} ({range.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Note minimum
                    </h3>
                    <div className="space-y-2">
                      {[
                        { id: "4+", name: "4 étoiles et plus", count: 15 },
                        { id: "3+", name: "3 étoiles et plus", count: 28 },
                      ].map((rating) => (
                        <label
                          key={rating.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={filters.rating.includes(rating.id)}
                            onChange={() => {
                              setFilters((prev) => ({
                                ...prev,
                                rating: prev.rating.includes(rating.id)
                                  ? prev.rating.filter((r) => r !== rating.id)
                                  : [...prev.rating, rating.id],
                              }));
                            }}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-muted-foreground">
                            {rating.name} ({rating.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {filteredCourses.length > 0 ? (
          <div id="formations">
            {/* Header avec nombre de résultats */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {searchInputValue
                  ? `Résultats pour "${searchInputValue}"`
                  : "Tous nos cours"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters ? filteredCourses.length : total} cours trouvé
                {(hasActiveFilters ? filteredCourses.length : total) > 1
                  ? "s"
                  : ""}
              </p>
            </div>

            {/* Indicateur de chargement pour changement de page */}
            {loading && (
              <div className="mb-4 text-center">
                <span className="text-sm text-muted-foreground">
                  Chargement...
                </span>
              </div>
            )}

            {/* Grid de cours avec pagination carrousel */}
            {!hasActiveFilters && pages > 1 && (
              <div className="relative mb-8">
                {/* Chevron gauche */}
                {currentPage > 1 && (
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                  </button>
                )}

                {/* Grid de cours */}
                <div className="space-y-6">
                  {Array.from(
                    { length: Math.ceil(filteredCourses.length / 4) },
                    (_, rowIndex) => {
                      const startIndex = rowIndex * 4;
                      const rowCourses = filteredCourses.slice(
                        startIndex,
                        startIndex + 4,
                      );

                      return (
                        <div
                          key={rowIndex}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                          {rowCourses.map((course) => (
                            <CourseCard
                              key={course.id}
                              course={course}
                              onEnrollClick={handleEnrollClick}
                              onVideoClick={handleVideoClick}
                            />
                          ))}
                        </div>
                      );
                    },
                  )}
                </div>

                {/* Chevron droit */}
                {currentPage < pages && (
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                  </button>
                )}
              </div>
            )}

            {/* Affichage sans pagination si filtres actifs ou une seule page */}
            {(hasActiveFilters || pages <= 1) && (
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
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchInputValue
                ? `Aucun cours trouvé pour "${searchInputValue}"`
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