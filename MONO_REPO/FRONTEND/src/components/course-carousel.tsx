"use client";

import { useState, useMemo, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseCarouselProps<T> {
  courses: T[];
  renderCard: (course: T, index: number) => ReactNode;
  itemsPerPage?: number;
  title?: string;
}

export function CourseCarousel<T>({
  courses,
  renderCard,
  itemsPerPage = 4, // 4 cartes sur mobile, plus sur desktop
  title,
}: CourseCarouselProps<T>) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = useMemo(
    () => Math.ceil(courses.length / itemsPerPage),
    [courses.length, itemsPerPage],
  );

  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;
  const showNavigation = courses.length > itemsPerPage;

  return (
    <section className="relative w-full py-6">
      {title && (
        <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
      )}

      <div className="relative group">
        {/* Bouton précédent */}
        {showNavigation && (
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={!canGoPrev}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-20 left-[-50] bg-white shadow-lg rounded-full p-2 transition",
              canGoPrev ? "opacity-100" : "opacity-50",
            )}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Contenu */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <div key={pageIndex} className="w-full flex-shrink-0">
                {/* ✅ GRILLE RESPONSIVE - 4 cartes sur desktop */}
                <div
                  className="
                    grid gap-6 px-8
                    grid-cols-1      /* mobile : 1 carte */
                    sm:grid-cols-2
                    md:grid-cols-3
                    lg:grid-cols-4   /* desktop : 4 cartes */
                  "
                >
                  {courses
                    .slice(
                      pageIndex * itemsPerPage,
                      (pageIndex + 1) * itemsPerPage,
                    )
                    .map((course, idx) => (
                      <div key={idx}>
                        {renderCard(course, pageIndex * itemsPerPage + idx)}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton suivant */}
        {showNavigation && canGoNext && (
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            className="
              absolute top-1/2 -translate-y-1/2 z-20
              right-[-50]
              bg-white shadow-lg rounded-full p-2
              opacity-0 group-hover:opacity-100 transition
            "
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Indicateurs */}
      {showNavigation && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentPage(idx)}
              role="button"
              tabIndex={0}
              className={cn(
                "cursor-pointer transition-all duration-300",
                idx === currentPage
                  ? "w-3 h-3 bg-primary"
                  : "w-2 h-2 bg-gray-300 hover:bg-gray-400",
              )}
              style={{
                borderRadius: "50%",
                minWidth: idx === currentPage ? "12px" : "8px",
                minHeight: idx === currentPage ? "12px" : "8px",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default CourseCarousel;
