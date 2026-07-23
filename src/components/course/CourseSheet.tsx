"use client";

import { useState, type ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

type CourseSheetProps = {
  children: ReactNode | ((close: () => void) => ReactNode);
};

/** Drawer mobile pour le contenu du cours (paysage) — ne s'affiche qu'en < lg. */
export function CourseSheet({ children }: CourseSheetProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button
        type="button"
        size="icon"
        className="fixed bottom-4 right-4 z-40 size-12 rounded-full shadow-[var(--shadow-card)] lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le contenu du cours"
      >
        <BookOpen className="size-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-md lg:hidden"
        >
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle>Contenu du cours</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-4.5rem)]">
            <div className="p-2">
              {typeof children === "function" ? children(close) : children}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
