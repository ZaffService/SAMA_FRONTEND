"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import logger from "@/shared/helpers/logger";

interface AddLessonDialogProps {
  moduleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLessonAdded: () => void;
  existingLessonsCount?: number; // Nombre de leçons existantes pour calculer orderIndex
}

export function AddLessonDialog({ 
  moduleId, 
  open, 
  onOpenChange, 
  onLessonAdded,
  existingLessonsCount = 0
}: AddLessonDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    duration: 0
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Le titre de la leçon est requis");
      return;
    }

    if (!moduleId) return;

    setIsLoading(true);
    try {
      const tempId = `lesson-${Date.now()}-0-${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculer orderIndex: max existant + 1
      const orderIndex = existingLessonsCount + 1;
      
      await CoursesApi.addLessonsToModule(moduleId, [{
        tempId,
        title: formData.title,
        content: formData.content,
        duration: formData.duration,
        orderIndex, // Envoyer orderIndex calculé
      }]);
      toast.success("Leçon ajoutée avec succès");
      onLessonAdded();
      onOpenChange(false);
      setFormData({ title: "", content: "", duration: 0 });
    } catch (error) {
      logger.error("Erreur lors de l'ajout de la leçon:", error);
      toast.error("Erreur lors de l'ajout de la leçon");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setFormData({ title: "", content: "", duration: 0 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Ajouter une nouvelle leçon</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer une nouvelle leçon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <label className="block text-base font-medium mb-3">
              Titre de la leçon *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Les variables en JavaScript"
              className="h-12 text-base"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-base font-medium mb-3">
              Contenu de la leçon
            </label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Entrez le contenu de la leçon..."
              rows={8}
              className="text-base resize-none"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-base font-medium mb-3">
              Durée (en minutes)
            </label>
            <Input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              className="h-12 text-base w-32"
              disabled={isLoading}
              min="0"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
            className="h-12 px-6"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.title.trim() || isLoading}
            className="h-12 px-8"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter la leçon
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
