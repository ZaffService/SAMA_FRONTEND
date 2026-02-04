"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { LessonManager } from "@/components/LessonManager";
import { Lesson } from "@/domain/entities/module";

interface ModuleLessonManagerProps {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLessonsUpdated?: () => void;
}

export function ModuleLessonManager({
  courseId,
  moduleId,
  moduleTitle,
  open,
  onOpenChange,
  onLessonsUpdated,
}: ModuleLessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && moduleId) {
      loadLessons();
    }
  }, [open, moduleId]);

  const loadLessons = async () => {
    setIsLoading(true);
    try {
      const details = await CoursesApi.getCourseDetails(courseId);
      const module = details.modules?.find((m) => m.id === moduleId);
      if (module) {
        setLessons(module.lessons || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des leçons:", error);
      toast.error("Erreur lors du chargement des leçons");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonsChange = async (updatedLessons: Lesson[]) => {
    try {
      // Update lessons in the backend
      await CoursesApi.updateModuleLessons(moduleId, updatedLessons);
      setLessons(updatedLessons);
      toast.success("Leçons mises à jour avec succès");
      onLessonsUpdated?.();
    } catch (error) {
      console.error("Erreur lors de la mise à jour des leçons:", error);
      toast.error("Erreur lors de la mise à jour des leçons");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Gérer les leçons - {moduleTitle}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Chargement des leçons...</span>
          </div>
        ) : (
          <LessonManager
            lessons={lessons}
            onLessonsChange={handleLessonsChange}
            courseId={courseId}
          />
        )}

        <div className="flex justify-end mt-6">
          <Button onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
