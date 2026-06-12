"use client";

import {
  Code,
  BarChart,
  Pen,
  Megaphone,
  Zap,
  Package,
  LayoutGrid,
} from "lucide-react";
import type { Category } from "@/domain/entities/course";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  loading?: boolean;
}

const baseButtonClass =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap border cursor-pointer select-none";

const selectedButtonClass =
  "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.02]";

const defaultButtonClass =
  "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]";

// Map les noms de catégories avec des icônes
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();

  if (name.includes("développement") || name.includes("web")) {
    return <Code className="w-4 h-4 shrink-0" />;
  }
  if (
    name.includes("data") ||
    name.includes("intelligence") ||
    name.includes("ia")
  ) {
    return <Zap className="w-4 h-4 shrink-0" />;
  }
  if (name.includes("contenu") || name.includes("création")) {
    return <Pen className="w-4 h-4 shrink-0" />;
  }
  if (name.includes("marketing") || name.includes("communication")) {
    return <Megaphone className="w-4 h-4 shrink-0" />;
  }
  if (name.includes("gestion") || name.includes("management")) {
    return <BarChart className="w-4 h-4 shrink-0" />;
  }
  if (name.includes("bureautique") || name.includes("informatique")) {
    return <Package className="w-4 h-4 shrink-0" />;
  }

  return <Code className="w-4 h-4 shrink-0" />;
};

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
  loading = false,
}: CategoryFilterProps) {
  if (loading) {
    return (
      <div className="w-full">
        <div className="flex flex-wrap gap-3 justify-center">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-10 w-32 rounded-full border border-slate-200 bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const isAllSelected = selectedCategoryId === null;

  return (
    <div id="formations" className="w-full space-y-4">
      <div className="text-center">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900">
          Explorez par domaine
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Trouvez la formation qui correspond à vos objectifs
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`${baseButtonClass} ${
            isAllSelected ? selectedButtonClass : defaultButtonClass
          }`}
          aria-pressed={isAllSelected}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
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
                isSelected ? selectedButtonClass : defaultButtonClass
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
