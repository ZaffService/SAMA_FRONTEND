"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";
import { CategoriesApi } from "@/infrastructure/api/categories-api";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  onCategoryCreated,
}: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Le nom de la catégorie est obligatoire");
      return;
    }

    setIsLoading(true);

    try {
      await CategoriesApi.createCategory({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      // Réinitialiser le formulaire
      setName("");
      setDescription("");
      onCategoryCreated();
      onOpenChange(false);
    } catch (err) {
      console.error("❌ Erreur lors de la création de la catégorie:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <DialogTitle className="text-left">
                Ajouter une catégorie
              </DialogTitle>
              <DialogDescription className="text-left">
                Créez une nouvelle catégorie pour organiser vos cours.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Champ Nom */}
            <div className="grid gap-2">
              <Label htmlFor="name" className="required">
                Nom de la catégorie
              </Label>
              <Input
                id="name"
                placeholder="Ex: Développement Web"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            {/* Champ Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <textarea
                id="description"
                placeholder="Décrivez cette catégorie..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:flex-col sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer la catégorie"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
