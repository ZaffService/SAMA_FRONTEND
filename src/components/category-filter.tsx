"use client";

import {
  Code,
  Briefcase,
  Pen,
  Megaphone,
  LayoutGrid,
  Palette,
  DollarSign,
  Languages,
  Search,
  Package,
  Zap,
} from "lucide-react";
import type { Category } from "@/domain/entities/course";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  loading?: boolean;
}

const baseButtonClass =
  "inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-base transition-all duration-200 whitespace-nowrap border cursor-pointer select-none";

const selectedButtonClass =
  "bg-[var(--bibocom-blue)] text-white border-[var(--bibocom-blue)] shadow-md shadow-[var(--bibocom-blue)]/25 scale-[1.02]";

const categoryButtonClass =
  "bg-[var(--bibocom-red)] text-white border-[var(--bibocom-red)] hover:bg-[var(--bibocom-red)]/90 active:scale-[0.98] shadow-sm";

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();

  if (name.includes("gestion") || name.includes("management")) {
    return <Briefcase className="w-5 h-5 shrink-0" />;
  }
  if (name.includes("marketing") || name.includes("communication")) {
    return <Megaphone className="w-5 h-5 shrink-0" />;
  }
  if (
    name.includes("développement") ||
    name.includes("developpement") ||
    name.includes("web")
  ) {
    return <Code className="w-5 h-5 shrink-0" />;
  }
  if (name.includes("design")) {
    return <Palette className="w-5 h-5 shrink-0" />;
  }
  if (name.includes("finance") || name.includes("comptab")) {
    return <DollarSign className="w-5 h-5 shrink-0" />;
  }
  if (name.includes("langue")) {
    return <Languages className="w-5 h-5 shrink-0" />;
  }
  if (
    name.includes("data") ||
    name.includes("intelligence") ||
    name.includes("ia")
  ) {
    return <Zap className="w-5 h-5 shrink-0" />;
  }
  if (name.includes("contenu") || name.includes("création")) {
    return <Pen className="w-5 h-5 shrink-0" />;
  }
  if (name.includes("bureautique") || name.includes("informatique")) {
    return <Package className="w-5 h-5 shrink-0" />;
  }

  return <Briefcase className="w-5 h-5 shrink-0" />;
};

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery = "",
  onSearchChange,
  loading = false,
}: CategoryFilterProps) {
  if (loading) {
    return (
      <div className="w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-72 rounded-lg bg-slate-100 animate-pulse md:w-96 md:h-12" />
          <div className="mx-auto h-5 w-full max-w-lg rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="mx-auto h-14 w-full max-w-2xl rounded-full bg-slate-100 animate-pulse" />
        <div className="flex flex-wrap gap-3 justify-center">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-12 w-36 rounded-full bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const isAllSelected = selectedCategoryId === null;

  return (
    <div id="formations" className="w-full scroll-mt-24 space-y-6">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-8">
          <div className="hidden sm:block h-[2px] bg-[var(--bibocom-blue)]/30 flex-1 max-w-[120px] lg:max-w-[200px]" />
          <h2 className="text-center text-[1.25rem] sm:text-[1.5rem] md:text-[2rem] lg:text-[2.5rem] font-bold text-[var(--bibocom-blue)] leading-[1.3]">
            Catégories de formation
          </h2>
          <div className="hidden sm:block h-[2px] bg-[var(--bibocom-blue)]/30 flex-1 max-w-[120px] lg:max-w-[200px]" />
        </div>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
          Trouvez la formation qui correspond à vos objectifs
        </p>
      </div>

      {onSearchChange && (
        <div className="flex justify-center px-2">
          <div className="relative w-full max-w-2xl">
            <Search
              className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher une formation..."
              aria-label="Rechercher une formation"
              className="w-full rounded-full border-2 border-[var(--bibocom-red)] bg-white py-4 pl-14 pr-5 text-base md:text-lg text-slate-900 placeholder:text-slate-400 outline-none transition-shadow focus:ring-2 focus:ring-[var(--bibocom-red)]/25 focus:border-[var(--bibocom-red)]"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`${baseButtonClass} ${
            isAllSelected ? selectedButtonClass : categoryButtonClass
          }`}
          aria-pressed={isAllSelected}
        >
          <LayoutGrid className="w-5 h-5 shrink-0" />
          Tous
        </button>

        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          const icon = getCategoryIcon(category.name);

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id || "")}
              className={`${baseButtonClass} ${
                isSelected ? selectedButtonClass : categoryButtonClass
              }`}
              title={category.description}
              aria-pressed={isSelected}
            >
              {icon}
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
