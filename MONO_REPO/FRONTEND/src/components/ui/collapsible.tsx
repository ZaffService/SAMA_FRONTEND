"use client";

import * as React from "react";
import { Check } from "lucide-react";

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  id,
  checked = false,
  onCheckedChange,
  disabled = false,
  className = "",
}: CheckboxProps) {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        inline-flex items-center justify-center
        w-4 h-4
        border-2 rounded
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2
        ${
          checked
            ? "bg-primary border-primary text-white"
            : "bg-white border-gray-300 hover:border-primary hover:bg-primary/5"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      {checked && <Check className="w-3 h-3" strokeWidth={3} />}
    </button>
  );
}
