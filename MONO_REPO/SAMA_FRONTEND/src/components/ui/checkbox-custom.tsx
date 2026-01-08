"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Checkbox stylisée professionnel avec Lucide icons
 * Design moderne similaire à Airbnb/Stripe
 */
export function CustomCheckbox({
  checked,
  onCheckedChange,
  label,
  id,
  className,
  disabled = false,
}: CustomCheckboxProps) {
  const checkboxId =
    id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-labelledby={`label-${checkboxId}`}
        onClick={() => !disabled && onCheckedChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative w-5 h-5 rounded border-2 flex items-center justify-center",
          "transition-all duration-200 shrink-0",
          "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary",
          checked
            ? "bg-primary border-primary shadow-sm"
            : "bg-background border-input hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {checked && (
          <Check className="w-3.5 h-3.5 text-primary-foreground animate-in fade-in zoom-in-50 duration-200" />
        )}
      </button>
      <label
        id={`label-${checkboxId}`}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          "text-sm text-muted-foreground",
          !disabled && "cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {label}
      </label>
    </div>
  );
}
