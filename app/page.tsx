"use client";

import {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Swal from "sweetalert2";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroBanner } from "@/components/hero-banner";
import { CourseCard } from "@/components/course-card";
import MaintenancePage from "@/components/MaintenancePage";

import { useCourses } from "@/application/use-cases/useCourses";
import { useEnrolledCourses } from "@/application/use-cases/useEnrolledCourses";
import { useCategories } from "@/application/use-cases/useCategories";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { CategoryFilter } from "@/components/category-filter";
import type { Course, CourseFilter } from "@/domain/entities/course";

const Index = () => {
  const { isAuthenticated, setRedirectAfterLogin } = useLocalAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showFreeTutorials, setShowFreeTutorials] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    categories: [] as string[],
    levels: [] as string[],
    priceRange: [] as string[],
    duration: [] as string[],
    rating: [] as string[],
  });

  const { courses, loading, error, pages, currentPage, setPage, refresh, setFilterCategories } =
    useCourses(1, 8);

  const { enrolledCourses } = useEnrolledCourses();
  const { categories, loading: categoriesLoading } = useCategories();

  /** 🔒 Ref pour la section des formations */
  const courseSectionRef = useRef<HTMLDivElement>(null);
  const isPageChanging = useRef(false);

  const handlePageChange = useCallback(
    (newPage: number) => {
      isPageChanging.current = true;
      setPage(newPage);
    },
    [setPage],
  );

  /** Gérer la sélection de catégorie */
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    // Utiliser le backend pour filtrer par catégorie
    setFilterCategories(categoryId ? [categoryId] : []);
    // Réinitialiser à la première page lors de changement de filtre
    setPage(1);
  }, [setPage, setFilterCategories]);

  /** Scroll automatique vers la section formations après changement de page */
  // Supprimé pour éviter le masquage du titre après connexion
  // useLayoutEffect(() => {
  //   if (isPageChanging.current && courseSectionRef.current) {
  //     courseSectionRef.current.scrollIntoView({
  //       behavior: "auto",
  //       block: "start",
  //     });
  //     isPageChanging.current = false;
  //   }
  // }, [currentPage]);

  /** Écouter l'événement pour activer les tutos gratuits */
  useEffect(() => {
    const handleActivateFreeTutorials = () => {
      setShowFreeTutorials(true);
      setFilters({
        categories: [],
        levels: [],
        priceRange: ["free"],
        duration: [],
        rating: [],
      });
      // Scroll vers la section après un court délai pour laisser le temps au filtre de s'appliquer
      setTimeout(() => {
        document
          .getElementById("formations-section")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    window.addEventListener(
      "activateFreeTutorials",
      handleActivateFreeTutorials,
    );

    return () => {
      window.removeEventListener(
        "activateFreeTutorials",
        handleActivateFreeTutorials,
      );
    };
  }, []);

  const toggleFilter = (category: keyof CourseFilter, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category]?.includes(value)
        ? prev[category].filter((item) => item !== value)
        : [...prev[category], value],
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

  const applyFilters = (courses: Course[]) =>
    courses.filter((course) => {
      // ✅ Le filtrage par catégorie est géré par le backend via setFilterCategories

      if (filters.categories.length > 0) {
        const cat =
          typeof course.category === "string"
            ? course.category
            : course.category.name;
        if (!filters.categories.includes(cat.toLowerCase())) return false;
      }
      if (filters.levels.length > 0) {
        if (!filters.levels.includes(course.level.toLowerCase())) return false;
      }
      if (filters.priceRange.length > 0) {
        const isFree = course.price === 0;
        if (filters.priceRange.includes("free") && !isFree) return false;
        if (filters.priceRange.includes("paid") && isFree) return false;
      }
      if (filters.rating.length > 0) {
        if (
          filters.rating.includes("4+") &&
          (course.rating === undefined || course.rating < 4)
        )
          return false;
      }
      return true;
    });

  let filteredCourses = applyFilters(courses);

  if (searchQuery) {
    filteredCourses = filteredCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  const handleEnrollClick = (course: Course) => {
    Swal.fire({
      title: "Inscription",
      text: `Inscription au cours "${course.title}"`,
      icon: "info",
      confirmButtonText: "OK",
    });
  };

  const handleVideoClick = (course: Course) => {
    if (!isAuthenticated) {
      setRedirectAfterLogin(`/course-details/${course.id}`);
      window.location.href = "/login";
      return;
    }
    window.location.href = `/course-details/${course.id}`;
  };

  // Fonction helper pour vérifier si un cours est acheté
  const isCourseEnrolled = (courseId: string) => {
    console.log(`🔍 [isCourseEnrolled] Vérification pour cours ID: ${courseId}`);
    console.log(`📚 [isCourseEnrolled] Cours inscrits disponibles:`, enrolledCourses);

    const isEnrolled = enrolledCourses.some(enrollment => {
      // 🔥 CORRECTION : Vérifier tous les champs possibles (id, _id, course_id)
      const enrolledId = enrollment.id || (enrollment as any)._id || enrollment.course_id;
      const match = enrolledId === courseId;
      console.log(`🔍 [isCourseEnrolled] Comparaison: ${enrolledId} === ${courseId} ? ${match}`);
      return match;
    });

    console.log(`✅ [isCourseEnrolled] Résultat pour ${courseId}: ${isEnrolled}`);
    return isEnrolled;
  };

  // Fonction helper pour récupérer la progression d'un cours
  const getCourseProgress = (courseId: string) => {
    const enrollment = enrolledCourses.find(enrollment => {
      const enrolledId = enrollment.id || (enrollment as any)._id || enrollment.course_id;
      return enrolledId === courseId;
    });

    // 🔥 CORRECTION : Vérifier TOUS les champs possibles pour la progression
    const progress =
      enrollment?.progressPercentage ||
      enrollment?.progress ||
      (enrollment as any)?.percentage ||
      0;

    console.log(`📊 [getCourseProgress] Progression pour ${courseId}: ${progress}% (enrollment:`, enrollment, `)`);
    return progress;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center mt-12">
          <p>Chargement des cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <MaintenancePage onRetry={refresh} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroBanner />

      <main className="container mx-auto px-4 py-8 pt-3 sm:pt-18 lg:pt-3">
        {/* 🎯 Filtre par catégories */}
        <section className="mb-12 py-8 border-b border-slate-200">
          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleCategorySelect}
            loading={categoriesLoading}
          />
        </section>

        {/* 🎯 Ancre pour la section formations */}
        <div ref={courseSectionRef} id="formations-section" className="pt-12">
          {/* Barre de recherche avec titre - Layout mobile en colonne */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-sm sm:text-xl font-bold whitespace-nowrap text-center">
              {showFreeTutorials
                ? "Tutos gratuits disponibles"
                : selectedCategoryId
                  ? `${categories.find(cat => cat.id === selectedCategoryId)?.name || "Formations"}`
                  : "Découvrez nos formations"}
            </h2>

            <div className="relative w-full sm:max-w-sm lg:max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border rounded"
                placeholder="Rechercher une formation"
              />
              {searchQuery && (
                <X
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 h-4 w-4 cursor-pointer"
                />
              )}
            </div>
          </div>

          {/* Grille */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
            {filteredCourses.map((course: Course) => {
              const isEnrolled = isCourseEnrolled(course.id);
              const progress = getCourseProgress(course.id);

              // 🔥 DEBUG spécifique pour le cours Leadership
              if (course.title?.includes("Leadership")) {
                console.log("🎯 [CourseCard] Rendu du cours Leadership:");
                console.log("   - Titre:", course.title);
                console.log("   - ID:", course.id);
                console.log("   - Est inscrit?", isEnrolled);
                console.log("   - Progression:", progress);
              }

              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEnrollClick={handleEnrollClick}
                  onVideoClick={handleVideoClick}
                  isEnrolled={isEnrolled}
                  progress={progress}
                />
              );
            })}
          </div>

          {/* Message si aucun tuto gratuit */}
          {showFreeTutorials && filteredCourses.length === 0 && (
            <div className="text-center py-8">
              <p className="text-lg text-slate-600">
                Aucun tuto gratuit disponible pour le moment.
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Revenez bientôt pour découvrir nos nouvelles formations
                gratuites !
              </p>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="relative mt-4 flex justify-center items-center gap-4">
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-3 py-2 bg-primary text-white rounded"
                >
                  <ChevronLeft />
                </button>
              )}
              <span>
                Page {currentPage} sur {pages}
              </span>
              {currentPage < pages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-3 py-2 bg-primary text-white rounded"
                >
                  <ChevronRight />
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
