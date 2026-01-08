"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, RotateCcw } from "lucide-react";

interface InteractiveCounterProps {
  initialValue?: number;
  minValue?: number;
  maxValue?: number;
  onValueChange?: (value: number) => void;
  className?: string;
}

/**
 * Client-Only Interactive Counter Component
 *
 * Ce composant démontre l'utilisation d'un client-only component avec:
 * - useState pour gérer l'état local
 * - useEffect pour les effets de bord
 * - useCallback pour optimiser les callbacks
 * - Interactions utilisateur dynamiques
 */
export function InteractiveCounter({
  initialValue = 0,
  minValue = 0,
  maxValue = 100,
  onValueChange,
  className = "",
}: InteractiveCounterProps) {
  // État local du compteur
  const [count, setCount] = useState(initialValue);
  const [isAnimating, setIsAnimating] = useState(false);

  // Effet pour notifier le parent lors des changements
  useEffect(() => {
    if (onValueChange) {
      onValueChange(count);
    }
  }, [count, onValueChange]);

  // Fonction optimisée pour incrémenter
  const increment = useCallback(() => {
    setCount((prev) => {
      const newValue = Math.min(prev + 1, maxValue);
      if (newValue !== prev) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
      }
      return newValue;
    });
  }, [maxValue]);

  // Fonction optimisée pour décrémenter
  const decrement = useCallback(() => {
    setCount((prev) => {
      const newValue = Math.max(prev - 1, minValue);
      if (newValue !== prev) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
      }
      return newValue;
    });
  }, [minValue]);

  // Fonction pour reset
  const reset = useCallback(() => {
    setCount(initialValue);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  }, [initialValue]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;

      switch (event.key) {
        case "ArrowUp":
        case "+":
          event.preventDefault();
          increment();
          break;
        case "ArrowDown":
        case "-":
          event.preventDefault();
          decrement();
          break;
        case "r":
        case "R":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            reset();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [increment, decrement, reset]);

  return (
    <Card className={`w-full max-w-sm mx-auto ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Compteur Interactif</CardTitle>
        <p className="text-sm text-muted-foreground">
          Utilisez les boutons ou les raccourcis clavier
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Affichage du compteur */}
        <div className="text-center">
          <div
            className={`text-4xl font-bold transition-all duration-300 ${
              isAnimating ? "scale-110 text-primary" : "scale-100"
            } ${
              count >= maxValue
                ? "text-red-500"
                : count <= minValue
                  ? "text-blue-500"
                  : "text-foreground"
            }`}
          >
            {count}
          </div>

          {/* Barre de progression */}
          <div className="mt-2 w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((count - minValue) / (maxValue - minValue)) * 100}%`,
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {count >= maxValue
              ? "Maximum atteint"
              : count <= minValue
                ? "Minimum atteint"
                : "En cours"}
          </p>
        </div>

        {/* Contrôles */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={decrement}
            disabled={count <= minValue}
            className="flex items-center gap-1"
          >
            <Minus className="w-4 h-4" />-
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={increment}
            disabled={count >= maxValue}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />+
          </Button>
        </div>

        {/* Informations sur les raccourcis */}
        <div className="text-center text-xs text-muted-foreground">
          <p>⌨️ Raccourcis: ↑/+ pour incrémenter, ↓/- pour décrémenter</p>
          <p>⌨️ Ctrl+R pour reset</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default InteractiveCounter;
