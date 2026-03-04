"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({
  className,
  checked,
  onCheckedChange,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <SwitchPrimitive.Root
        data-slot="switch"
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          "peer relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent outline-none transition-all duration-200 ease-in-out",
          "data-[state=unchecked]:bg-muted hover:data-[state=unchecked]:bg-muted/70",
          "data-[state=checked]:bg-primary data-[state=checked]:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]",
          "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className={cn(
            "pointer-events-none block size-5 rounded-full bg-white",
            "shadow-[0_1px_4px_rgba(0,0,0,0.20),0_0_0_1px_rgba(0,0,0,0.04)]",
            "transition-transform duration-200 ease-in-out",
            "data-[state=unchecked]:translate-x-0.5",
            "data-[state=checked]:translate-x-7",
          )}
        />
      </SwitchPrimitive.Root>

      <span
        className={cn(
          "w-16 text-sm font-medium whitespace-nowrap transition-colors duration-200 select-none",
          checked ? "text-primary" : "text-muted-foreground",
        )}
      >
        {checked ? "Activé" : "Désactivé"}
      </span>
    </div>
  );
}

export { Switch };