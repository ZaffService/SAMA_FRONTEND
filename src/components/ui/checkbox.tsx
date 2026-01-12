"use client";

import type * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      style={{
        width: "16px",
        height: "16px",
        minWidth: "16px",
        minHeight: "16px",
        maxWidth: "16px",
        maxHeight: "16px",
      }}
      className={cn(
        // Base styles - parfaitement carré FORCÉ avec style inline
        "peer shrink-0 rounded border-2",
        "transition-all duration-200",
        // Unchecked state - bordure bien visible
        "border-gray-300 bg-white",
        "hover:border-primary hover:bg-primary/5",
        // Checked state
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white",
        "data-[state=checked]:shadow-sm",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Dark mode
        "dark:border-gray-600 dark:bg-gray-900 dark:data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current animate-in fade-in-0 zoom-in-50 duration-200"
      >
        <CheckIcon className="w-3 h-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
