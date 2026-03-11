"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
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

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
}

interface EditModuleDialogProps {
  module: Module | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModuleUpdated: () => void;
}

export function EditModuleDialog({ 
  module, 
  open, 
  onOpenChange, 
  onModuleUpdated 
}: EditModuleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: 0
  });

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title,
        description: module.description || "",
        order: module.order
      });
    }
  }, [module]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Le titre du module est requis");
      return;
    }

    if (!module) return;

    setIsLoading(true);
    try {
      await CoursesApi.updateModule(module.id, {
        title: formData.title,
        description: formData.description,
        order: formData.order
      });
      toast.success("Module modifié avec succès");
      onModuleUpdated();
      onOpenChange(false);
    } catch (error) {
      logger.error("Erreur lors de la modification du module:", error);
      toast.error("Erreur lors de la modification du module");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Modifier le module</DialogTitle>
          <DialogDescription>
            Modifiez les informations du module ci-dessous.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <label className="block text-base font-medium mb-3">
              Titre du module *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Introduction au JavaScript"
              className="h-12 text-base"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-base font-medium mb-3">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez le contenu de ce module..."
              rows={6}
              className="text-base resize-none"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-base font-medium mb-3">
              Ordre d'affichage
            </label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order:
                    parseInt(e.target.value.replace(/[^\d]/g, ""), 10) || 0,
                })
              }
              className="h-12 text-base w-32"
              disabled={isLoading}
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
                Modification en cours...
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
