"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LessonNavProps = {
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
  current: number;
  total: number;
  className?: string;
};

export function LessonNav({
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  current,
  total,
  className,
}: LessonNavProps) {
  return (
    <nav
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-border bg-card px-2 py-2 shadow-[var(--shadow-card)] sm:gap-3 sm:px-3",
        className,
      )}
      aria-label="Navigation entre les leçons"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-10 gap-1 px-2.5"
        onClick={onPrevious}
        disabled={!canPrevious}
      >
        <ChevronLeft className="size-4" />
        <span>Précédent</span>
      </Button>

      <p className="min-w-0 truncate text-center text-xs font-medium text-muted-foreground sm:text-sm">
        Leçon {current} / {total}
      </p>

      <Button
        type="button"
        size="sm"
        className="min-h-10 gap-1 px-2.5"
        onClick={onNext}
        disabled={!canNext}
      >
        <span>Suivant</span>
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
