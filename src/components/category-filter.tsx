"use client";

import { Code, BarChart, Pen, Megaphone, Zap, Package } from "lucide-react";
import type { Category } from "@/domain/entities/course";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  loading?: boolean;
}

// Map les noms de catégories avec des icônes
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();

  if (name.includes("développement") || name.includes("web")) {
    return <Code className="w-5 h-5" />;
  }
  if (name.includes("data") || name.includes("intelligence") || name.includes("ia")) {
    return <Zap className="w-5 h-5" />;
  }
  if (name.includes("contenu") || name.includes("création")) {
    return <Pen className="w-5 h-5" />;
  }
  if (name.includes("marketing") || name.includes("communication")) {
    return <Megaphone className="w-5 h-5" />;
  }
  if (name.includes("gestion") || name.includes("management")) {
    return <BarChart className="w-5 h-5" />;
  }
  if (name.includes("bureautique") || name.includes("informatique")) {
    return <Package className="w-5 h-5" />;
  }

  return <Code className="w-5 h-5" />;
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
        <div className="flex flex-wrap gap-2 justify-center">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-10 w-32 bg-slate-200 rounded-full animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {/* Titre */}
      <div className="text-center">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900">
          Explorez par domaine
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Trouvez la formation qui correspond à vos objectifs
        </p>
      </div>

      {/* Boutons de catégories */}
      <div className="flex flex-wrap gap-3 justify-center">
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          const icon = getCategoryIcon(category.name);

          return (
            <button
              key={category.id}
              onClick={() =>
                onSelectCategory(isSelected ? null : category.id || "")
              }
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full
                font-medium text-sm transition-all duration-200
                whitespace-nowrap
                ${
                  isSelected
                    ? "bg-primary text-white shadow-lg scale-105"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95"
                }
              `}
              title={category.description}
            >
              {icon}
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Bouton "Voir tout" pour réinitialiser le filtre */}
      {selectedCategoryId && (
        <div className="flex justify-center">
          <button
            onClick={() => onSelectCategory(null)}
            className="text-primary hover:text-primary/80 font-medium text-sm underline"
          >
            Voir tout →
          </button>
        </div>
      )}
    </div>
  );
}
