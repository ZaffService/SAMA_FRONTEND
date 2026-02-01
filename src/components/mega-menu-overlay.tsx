"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { useCategories } from "@/application/use-cases/useCategories";
import { CoursesApi } from "@/infrastructure/api/courses-api";

interface MegaMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MegaMenuOverlay({ isOpen, onClose }: MegaMenuOverlayProps) {
  const { categories: apiCategories, loading } = useCategories();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Récupérer les cours quand la catégorie change
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedCategory) {
        setCourses([]);
        return;
      }

      setCoursesLoading(true);
      try {
        const response = await CoursesApi.getCourses(1, 10, { categoryId: selectedCategory });
        setCourses(response.courses || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des cours:", error);
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, [selectedCategory]);

  // Sélectionner la première catégorie par défaut
  useEffect(() => {
    if (apiCategories.length > 0 && !selectedCategory) {
      const firstCategoryId = apiCategories[0].id;
      if (firstCategoryId) {
        setSelectedCategory(firstCategoryId);
      }
    }
  }, [apiCategories, selectedCategory]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Empêcher le scroll du body quand le mega menu est ouvert
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCategoryClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* BACKDROP - ANIMATION FLUIDE */}
      <div
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]
          transition-opacity duration-500 ease-out
          ${isOpen ? "opacity-100" : "opacity-0"}
        `}
        onClick={handleBackdropClick}
        style={{ top: "0" }}
      />

      {/* MEGA MENU CONTAINER - PLEIN ÉCRAN SUR MOBILE, PARTIEL SUR DESKTOP */}
      <div
        ref={overlayRef}
        className={`
          fixed inset-0 lg:inset-auto lg:left-0 lg:right-0
          bg-white z-[101]
          transition-all duration-500 ease-out
          ${isOpen ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0 pointer-events-none"}
        `}
        style={{
          top: "0",
          height: "100vh",
        }}
      >
        {/* HEADER DU MEGA MENU AVEC BOUTON FERMER */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Formations</h2>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* CONTENU DU MEGA MENU */}
        <div className="h-[calc(100vh-73px)] overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-full">
              
              {/* COLONNE GAUCHE - LISTE DES CATÉGORIES */}
              <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50">
                <div className="p-4 sm:p-6 md:p-8">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">
                    Apprenez un métier d'avenir
                  </h3>
                  
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <nav className="space-y-2">
                      {apiCategories.map((category) =>
                        category.id ? (
                          <button
                            key={category.id}
                            onClick={() => category.id && setSelectedCategory(category.id)}
                            className={`
                              w-full text-left px-3 md:px-4 py-2.5 md:py-3 rounded-lg 
                              flex items-center justify-between
                              transition-all duration-200 group
                              ${
                                selectedCategory === category.id
                                  ? "bg-[var(--bibocom-red)] text-white font-bold shadow-md"
                                  : "hover:bg-gray-200 text-gray-700 font-medium"
                              }
                            `}
                          >
                            <span className="text-sm md:text-base">{category.name}</span>
                            <ChevronRight
                              className={`h-4 w-4 md:h-5 md:w-5 transition-transform duration-200 flex-shrink-0 ${
                                selectedCategory === category.id
                                  ? "translate-x-1"
                                  : "group-hover:translate-x-1"
                              }`}
                            />
                          </button>
                        ) : null
                      )}
                    </nav>
                  )}
                </div>
              </div>

              {/* COLONNE DROITE - DÉTAILS DE LA CATÉGORIE SÉLECTIONNÉE */}
              <div className="lg:col-span-8 bg-white">
                <div className="p-4 sm:p-6 md:p-8">
                  {selectedCategory && (
                    <div className="animate-fadeIn">
                      {(() => {
                        const category = apiCategories.find((c) => c.id === selectedCategory);
                        if (!category) return null;

                        return (
                          <div>
                            {/* TITRE ET DESCRIPTION */}
                            <div className="mb-6 md:mb-8">
                              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                                {category.name}
                              </h2>
                              
                              <p className="text-gray-600 text-sm md:text-base lg:text-lg leading-relaxed">
                                {category.description || "Découvrez nos formations dans cette catégorie et développez vos compétences professionnelles"}
                              </p>
                            </div>

                            {/* SECTION: COURS DISPONIBLES */}
                            <div className="mb-6 md:mb-8">
                              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[var(--bibocom-red)]"></span>
                                Cours disponibles
                              </h3>
                              
                              {coursesLoading ? (
                                <div className="space-y-3">
                                  {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                                  ))}
                                </div>
                              ) : courses.length > 0 ? (
                                <div className="space-y-3">
                                  {courses.slice(0, 5).map((course) => (
                                    <Link
                                      key={course.id}
                                      href={`/course-details/${course.id}`}
                                      onClick={handleCategoryClick}
                                      className="block p-4 md:p-5 rounded-xl border-2 border-gray-200 hover:border-[var(--bibocom-red)] hover:bg-red-50 transition-all duration-200 group"
                                    >
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                          <h4 className="font-bold text-gray-900 group-hover:text-[var(--bibocom-red)] transition-colors text-sm md:text-base mb-1">
                                            {course.title}
                                          </h4>
                                          <p className="text-xs md:text-sm text-gray-500 line-clamp-2">
                                            {course.description || 'Aucune description disponible'}
                                          </p>
                                          {course.level && (
                                            <p className="text-xs md:text-sm text-gray-500 mt-1">
                                              Niveau: {course.level}
                                            </p>
                                          )}
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[var(--bibocom-red)] group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 mt-1" />
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 px-4">
                                  <p className="text-gray-500 text-sm md:text-base">
                                    Cette catégorie n'a pas encore de cours.
                                  </p>
                                  <p className="text-gray-400 text-xs md:text-sm mt-1">
                                    Bientôt disponible !
                                  </p>
                                </div>
                              )}

                          
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Styles pour le scroll personnalisé sur desktop */
        @media (min-width: 1024px) {
          .overflow-y-auto::-webkit-scrollbar {
            width: 8px;
          }

          .overflow-y-auto::-webkit-scrollbar-track {
            background: #f1f1f1;
          }

          .overflow-y-auto::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }

          .overflow-y-auto::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        }
      `}</style>
    </>
  );
}
