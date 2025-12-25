"use client";

import React, { useCallback, memo, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CoursePaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

// Validation interne pour éviter les erreurs
const validatePage = (page: number, totalPages: number): number => {
  if (totalPages <= 0) return 1;
  return Math.max(1, Math.min(page, totalPages));
};

const CoursePaginationComponent: React.FC<CoursePaginationProps> = ({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
}) => {
  // Validation de currentPage
  const validCurrentPage = validatePage(currentPage, totalPages);

  // Calcul de la plage affichée
  const getPageRange = useCallback(() => {
    const start = (validCurrentPage - 1) * limit + 1;
    const end = Math.min(validCurrentPage * limit, total);
    return { start, end };
  }, [validCurrentPage, limit, total]);

  // Logique de génération des numéros de page avec ellipses
  const getPageNumbers = useCallback((): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Afficher toutes les pages si <= 7
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique avec ellipses intelligentes
      if (validCurrentPage <= 3) {
        // Début: 1 2 3 4 ... totalPages
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (validCurrentPage >= totalPages - 2) {
        // Fin: 1 ... totalPages-3 totalPages-2 totalPages-1 totalPages
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        // Milieu: 1 ... currentPage-1 currentPage currentPage+1 ... totalPages
        pages.push(
          1,
          "...",
          validCurrentPage - 1,
          validCurrentPage,
          validCurrentPage + 1,
          "...",
          totalPages,
        );
      }
    }

    return pages;
  }, [validCurrentPage, totalPages]);

  // Handlers avec useCallback pour stabilité
  const handlePrevClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (validCurrentPage > 1) {
        onPageChange(validCurrentPage - 1);
      }
    },
    [validCurrentPage, onPageChange],
  );

  const handleNextClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (validCurrentPage < totalPages) {
        onPageChange(validCurrentPage + 1);
      }
    },
    [validCurrentPage, totalPages, onPageChange],
  );

  // Gestion clavier pour accessibilité
  const handleKeyDown = useCallback(
    (action: () => void) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        action();
      }
    },
    [],
  );

  // Handlers stables pour les boutons de page
  const pageHandlers = useMemo(() => {
    const handlers: Record<
      number,
      {
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
        onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
      }
    > = {};

    for (let i = 1; i <= totalPages; i++) {
      handlers[i] = {
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
          event.preventDefault();
          onPageChange(i);
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onPageChange(i);
          }
        },
      };
    }

    return handlers;
  }, [totalPages, onPageChange]);

  // Ne rien afficher si une seule page ou moins
  if (totalPages <= 1) return null;

  const { start, end } = getPageRange();
  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center mt-8 mb-12">
      {/* Info pagination */}
      <div className="mb-4 text-sm text-muted-foreground">
        {start} à {end} sur {total} résultats
      </div>

      {/* Contrôles pagination */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {/* Bouton Précédent */}
        <button
          type="button"
          onClick={handlePrevClick}
          onKeyDown={handleKeyDown(
            () => validCurrentPage > 1 && onPageChange(validCurrentPage - 1),
          )}
          disabled={validCurrentPage === 1}
          aria-label="Page précédente"
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Précédent</span>
        </button>

        {/* Numéros de page */}
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-muted-foreground cursor-default select-none"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === validCurrentPage;

          return (
            <button
              type="button"
              key={pageNum}
              onClick={pageHandlers[pageNum].onClick}
              onKeyDown={pageHandlers[pageNum].onKeyDown}
              aria-label={`Aller à la page ${pageNum}`}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 min-w-[40px] ${
                isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Bouton Suivant */}
        <button
          type="button"
          onClick={handleNextClick}
          onKeyDown={handleKeyDown(
            () =>
              validCurrentPage < totalPages &&
              onPageChange(validCurrentPage + 1),
          )}
          disabled={validCurrentPage === totalPages}
          aria-label="Page suivante"
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Utilisation de React.memo pour éviter les rerenders inutiles
export const CoursePagination = memo(CoursePaginationComponent);
