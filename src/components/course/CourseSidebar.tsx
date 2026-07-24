"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ListVideo, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "course-details-sidebar-open";

type CourseSidebarProps = {
  children: ReactNode;
  className?: string;
};

/** Sidebar desktop repliable — contenu fourni par la page. */
export function CourseSidebar({ children, className }: CourseSidebarProps) {
  const [open, setOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setOpen(stored === "true");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(open));
    } catch {
      /* ignore */
    }
  }, [open, hydrated]);

  const toggleLabel = open ? "Masquer le contenu" : "Afficher le contenu";

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-[calc(100vh-3.5rem)] shrink-0 border-l border-border bg-background transition-[width] duration-300 ease-in-out lg:flex lg:flex-col",
        open ? "w-[22rem]" : "w-16",
        className,
      )}
      aria-label="Contenu du cours"
      data-sidebar-open={open ? "true" : "false"}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2 border-b border-border",
          open ? "justify-between px-3" : "justify-center px-2",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden transition-opacity duration-300",
            open ? "opacity-100" : "pointer-events-none absolute w-0 opacity-0",
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ListVideo className="size-4" strokeWidth={2.25} />
          </span>
          <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
            Contenu du cours
          </h2>
        </div>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setOpen((prev) => !prev)}
                aria-label={toggleLabel}
                aria-expanded={open}
                className={cn(
                  "size-10 shrink-0 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary",
                  "shadow-sm hover:border-primary hover:bg-primary hover:text-primary-foreground",
                  "focus-visible:ring-2 focus-visible:ring-primary/40",
                  "transition-colors duration-200",
                )}
              >
                {open ? (
                  <PanelLeftClose className="size-5" strokeWidth={2.25} />
                ) : (
                  <PanelLeftOpen className="size-5" strokeWidth={2.25} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="font-medium">
              {toggleLabel}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Scroll uniquement à l'ouverture — barre discrète collée à droite */}
      {open ? (
        <div className="course-sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-2">{children}</div>
        </div>
      ) : null}
    </aside>
  );
}
