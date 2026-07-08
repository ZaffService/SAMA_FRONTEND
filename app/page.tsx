"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  useSearchParams,
  usePathname,
} from "next/navigation";
import {
  ChevronDown,
  SearchX,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import HeroBanner from "@/components/hero-banner";
import WhyChooseBibocom from "@/components/why-choose-bibocom";
import HowItWorks from "@/components/how-it-works";
import { Testimonials } from "@/components/testimonials";
import TrustCarousel from "@/components/TrustCarousel";
import PresentielSection from "@/components/presentiel-section";
import { CourseCard } from "@/components/course-card";
import EmptyCoursesState from "@/components/EmptyCoursesState";
import { ProfileCompletionBanner } from "@/components/profile-completion-banner";

import { useCourses } from "@/application/use-cases/useCourses";
import { useEnrolledCourses } from "@/application/use-cases/useEnrolledCourses";
import { useCategories } from "@/application/use-cases/useCategories";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { CategoryFilter } from "@/components/category-filter";
import { BackendCourse } from "@/infrastructure/api/courses-api";
import logger from "@/shared/helpers/logger";
import { scrollToFormationsSection } from "@/lib/smooth-scroll";

const Index = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isAuthenticated } = useLocalAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFreeTutorials, setShowFreeTutorials] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [filters, setFilters] = useState({
    categories: [] as string[],
    levels: [] as string[],
    priceRange: [] as string[],
    duration: [] as string[],
    rating: [] as string[],
  });

  const {
    courses,
    loading,
    error,
    refresh,
    setFilterCategories,
    hasCoursesInDatabase,
  } = useCourses(1, 50);

  const { enrolledCourses, refetch: refetchEnrolledCourses } =
    useEnrolledCourses({ enabled: isAuthenticated });
  const { categories, loading: categoriesLoading } = useCategories();

  // Pre-fill search query and category from URL params
  useEffect(() => {
    const searchParam = searchParams.get("search");
    const categoryParam = searchParams.get("category");
    
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    
    if (categoryParam) {
      // Si une catégorie est spécifiée, sélectionner automatiquement cette catégorie
      setSelectedCategoryId(categoryParam);
      setFilterCategories(categoryParam ? [categoryParam] : []);
      
      // Scroll vers la section formations après un court délai
      setTimeout(() => {
        document.getElementById("formations-section")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [searchParams, setFilterCategories]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#formations") return;

    const scrollWhenReady = () => {
      if (scrollToFormationsSection()) return;
      window.setTimeout(scrollWhenReady, 50);
    };

    const timer = window.setTimeout(scrollWhenReady, 80);
    return () => window.clearTimeout(timer);
  }, [pathname, loading, categoriesLoading]);

  /**  Ref pour la section des formations */
  const courseSectionRef = useRef<HTMLDivElement>(null);

  /** Gérer la sélection de catégorie */
  const handleCategorySelect = useCallback(
    (categoryId: string | null) => {
      setSelectedCategoryId(categoryId);
      // Utiliser le backend pour filtrer par catégorie
      setFilterCategories(categoryId ? [categoryId] : []);
    },
    [setFilterCategories],
  );

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

  const applyFilters = (courses: BackendCourse[]) =>
    courses.filter((course) => {
      // ✅ Le filtrage par catégorie est géré par le backend via setFilterCategories

      if (filters.categories.length > 0) {
        const cat = course.categoryName || "";
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

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCategoryId !== null ||
    filters.categories.length > 0 ||
    filters.levels.length > 0 ||
    filters.priceRange.length > 0;

  const selectedCategoryName =
    categories.find((c) => c.id === selectedCategoryId)?.name ?? null;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategoryId(null);
    setFilterCategories([]);
    setShowFreeTutorials(false);
    setFilters({
      categories: [],
      levels: [],
      priceRange: [],
      duration: [],
      rating: [],
    });
  };

  // Fonction helper pour vérifier si un cours est acheté
  const isCourseEnrolled = (courseId: string) => {
    logger.log(
      `🔍 [isCourseEnrolled] Vérification pour cours ID: ${courseId}`,
    );
    logger.log(
      `📚 [isCourseEnrolled] Cours inscrits disponibles:`,
      enrolledCourses,
    );

    const isEnrolled = enrolledCourses.some((enrollment) => {
      // 🔥 CORRECTION : Vérifier tous les champs possibles (id, _id, course_id)
      const enrolledId =
        enrollment.id || (enrollment as any)._id || enrollment.course_id;
      const match = enrolledId === courseId;
      logger.log(
        `🔍 [isCourseEnrolled] Comparaison: ${enrolledId} === ${courseId} ? ${match}`,
      );
      return match;
    });

    logger.log(
      `✅ [isCourseEnrolled] Résultat pour ${courseId}: ${isEnrolled}`,
    );
    return isEnrolled;
  };

  // Fonction helper pour récupérer la progression d'un cours
  const getCourseProgress = (courseId: string) => {
    const enrollment = enrolledCourses.find((enrollment) => {
      const enrolledId =
        enrollment.id || (enrollment as any)._id || enrollment.course_id;
      return enrolledId === courseId;
    });

    // 🔥 CORRECTION : Vérifier TOUS les champs possibles pour la progression
    const progress =
      enrollment?.progressPercentage ||
      enrollment?.progress ||
      (enrollment as any)?.percentage ||
      0;

    logger.log(
      `📊 [getCourseProgress] Progression pour ${courseId}: ${progress}% (enrollment:`,
      enrollment,
      `)`,
    );
    return progress;
  };

  // Helper component for loading skeleton
  const CourseSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-300" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4" />
        <div className="h-3 bg-gray-300 rounded w-full" />
        <div className="h-3 bg-gray-300 rounded w-2/3" />
        <div className="flex justify-between mt-4">
          <div className="h-6 bg-gray-300 rounded w-20" />
          <div className="h-8 bg-gray-300 rounded w-24" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroBanner />
      <WhyChooseBibocom />

      <main
        className={`container mx-auto px-4 ${
          isAuthenticated ? "pt-24" : "pt-3 sm:pt-18 lg:pt-3"
        }`}
      >
        {!hasCoursesInDatabase && !loading ? (
          <EmptyCoursesState />
        ) : (
          <>
            <ProfileCompletionBanner />

            {/* 🎯 Filtre par catégories */}
            <section className="py-6 mb-2">
              <CategoryFilter
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={handleCategorySelect}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                loading={categoriesLoading}
              />
            </section>

            {/* 🎯 Ancre pour la section formations */}
            <div
              ref={courseSectionRef}
              id="formations-section"
              className="pt-2"
            >
              {/* Titre "Formations Populaires" avec lignes décoratives */}
              <div className="flex flex-col items-center mb-6">
                {/* Titre avec lignes */}
                <div className="flex items-center justify-center gap-6 w-full max-w-6xl">
                  <div className="hidden sm:block h-[1px] bg-[#2B3E91] flex-1 max-w-[400px]" />
                  <h2 className="text-[#2B3E91] font-bold text-[1.75rem] md:text-[2.25rem] italic whitespace-nowrap">
                    Formations Populaires
                  </h2>
                  <div className="hidden sm:block h-[1px] bg-[#2B3E91] flex-1 max-w-[400px]" />
                </div>
                
                {/* Chevron animé pour inciter à scroller vers les formations */}
                <ChevronDown className="w-6 h-6 text-[#2B3E91] mt-2 animate-bounce" />
              </div>

              {/* Skeleton Loading - affiché pendant le chargement */}
              {loading ? (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <CourseSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                /* Erreur - afficher bouton de retry */
                <div className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                      onClick={refresh}
                      className="px-4 py-2 bg-[var(--bibocom-red)] text-white rounded-md hover:opacity-90 transition-opacity"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
                  {filteredCourses.map((course: BackendCourse) => {
                    const isEnrolled = isCourseEnrolled(course.id);
                    const progress = getCourseProgress(course.id);

                    // 🔥 DEBUG spécifique pour le cours Leadership
                    if (course.title?.includes("Leadership")) {
                      logger.log("🎯 [CourseCard] Rendu du cours Leadership:");
                      logger.log("   - Titre:", course.title);
                      logger.log("   - ID:", course.id);
                      logger.log("   - Est inscrit?", isEnrolled);
                      logger.log("   - Progression:", progress);
                    }

                    return (
                      <CourseCard
                        key={course.id}
                        course={course}
                        isEnrolled={isEnrolled}
                        progress={progress}
                        onEnrolled={refetchEnrolledCourses}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 px-4 mb-8">
                  <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10">
                    <SearchX className="mx-auto mb-4 h-12 w-12 text-[var(--bibocom-red)]" />
                    {showFreeTutorials ? (
                      <>
                        <p className="text-xl font-bold text-[var(--bibocom-blue)]">
                          Aucun tuto gratuit disponible
                        </p>
                        <p className="mt-2 text-base text-slate-600">
                          Revenez bientôt pour découvrir nos nouvelles formations
                          gratuites.
                        </p>
                      </>
                    ) : searchQuery.trim() ? (
                      <>
                        <p className="text-xl font-bold text-[var(--bibocom-blue)]">
                          Aucune formation trouvée
                        </p>
                        <p className="mt-2 text-base text-slate-600">
                          Aucun résultat pour «{" "}
                          <span className="font-semibold text-slate-800">
                            {searchQuery.trim()}
                          </span>
                          ». Essayez un autre mot-clé ou parcourez les
                          catégories.
                        </p>
                      </>
                    ) : selectedCategoryName ? (
                      <>
                        <p className="text-xl font-bold text-[var(--bibocom-blue)]">
                          Aucune formation dans cette catégorie
                        </p>
                        <p className="mt-2 text-base text-slate-600">
                          Aucune formation disponible pour le moment dans «{" "}
                          <span className="font-semibold text-slate-800">
                            {selectedCategoryName}
                          </span>
                          ».
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xl font-bold text-[var(--bibocom-blue)]">
                          Aucune formation disponible
                        </p>
                        <p className="mt-2 text-base text-slate-600">
                          Aucune formation ne correspond à vos critères pour le
                          moment.
                        </p>
                      </>
                    )}
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-6 rounded-full bg-[var(--bibocom-red)] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        Réinitialiser les filtres
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Message si aucun tuto gratuit — géré dans l'état vide ci-dessus */}

            </div>
          </>
        )}
      </main>

      {/* <PresentielSection /> */}

      {/* Section "Comment ça marche ?" -仅 pour les utilisateurs non connectés */}
      <HowItWorks />

      {/* Section Témoignages -仅 pour les utilisateurs non connectés */}
      <Testimonials />
      <TrustCarousel />

      <a
        href="https://wa.me/221788784040"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        aria-label="Contacter sur WhatsApp"
        title="WhatsApp"
      >
        <span className="whatsapp-ping" aria-hidden="true" />
        <FaWhatsapp className="whatsapp-icon" aria-hidden="true" />
      </a>

      <Footer />
    </div>
  );
};

export default Index;
