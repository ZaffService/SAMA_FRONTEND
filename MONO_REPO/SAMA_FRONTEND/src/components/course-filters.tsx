"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const LEVELS = ["Débutant", "Intermédiaire", "Avancé", "Tous niveaux"];
const PRICES = ["Gratuit", "0-1000 FCFA", "1000-3000 FCFA", "3000 FCFA+"];

interface CourseFiltersProps {
  onFilterChange?: (level: string, price: string) => void;
}

/**
 * Composant de filtres moderne inspiré d'Airbnb/Booking.com
 * Design avec chips pills, active states, et hover effects
 */
export function CourseFilters({ onFilterChange }: CourseFiltersProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<string>("");

  const handleLevelChange = (level: string) => {
    const newLevel = selectedLevel === level ? "" : level;
    setSelectedLevel(newLevel);
    onFilterChange?.(newLevel, selectedPrice);
  };

  const handlePriceChange = (price: string) => {
    const newPrice = selectedPrice === price ? "" : price;
    setSelectedPrice(newPrice);
    onFilterChange?.(selectedLevel, newPrice);
  };

  const reset = () => {
    setSelectedLevel("");
    setSelectedPrice("");
    onFilterChange?.("", "");
  };

  const hasActiveFilters = selectedLevel || selectedPrice;

  return (
    <div className="bg-card rounded-xl border p-4 md:p-6 space-y-6">
      {/* Titre avec indicateur */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Filtrer les cours
        </h2>
        {hasActiveFilters && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-primary rounded-full" />
            {(selectedLevel ? 1 : 0) + (selectedPrice ? 1 : 0)} actif
            {(selectedLevel ? 1 : 0) + (selectedPrice ? 1 : 0) > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Niveau */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Niveau
        </h3>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => handleLevelChange(level)}
              className={cn(
                "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium",
                "border-2 transition-all duration-200 whitespace-nowrap",
                "hover:scale-105 active:scale-95",
                selectedLevel === level
                  ? "bg-primary border-primary text-primary-foreground shadow-md"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5",
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Prix */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Gamme de prix
        </h3>
        <div className="flex flex-wrap gap-2">
          {PRICES.map((price) => (
            <button
              key={price}
              onClick={() => handlePriceChange(price)}
              className={cn(
                "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium",
                "border-2 transition-all duration-200 whitespace-nowrap",
                "hover:scale-105 active:scale-95",
                selectedPrice === price
                  ? "bg-primary border-primary text-primary-foreground shadow-md"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5",
              )}
            >
              {price}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      {hasActiveFilters && (
        <Button
          onClick={reset}
          variant="outline"
          size="sm"
          className="w-full gap-2 text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );
}
