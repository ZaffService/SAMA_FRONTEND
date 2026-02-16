
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Save } from "lucide-react";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { ThumbnailUploader } from "@/components/ThumbnailUploader";
import { showSuccessToast, showErrorToast } from "@/shared/helpers/sweet-alert";
import logger from "@/shared/helpers/logger";

interface Category {
  id: string;
  name: string;
}

export interface CourseBasicData {
  title: string;
  description: string;
  categoryId: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  price: number;
  thumbnailUrl?: string;
  status?: string;
}

interface CourseBasicInfoEditorProps {
  courseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseUpdated?: () => void;
}

// Extract Step1BasicInfo from CourseWizard
function Step1BasicInfo({
  formData,
  updateFormData,
  categories,
  thumbnailUrl,
  onThumbnailUploaded,
  onThumbnailRemoved,
}: {
  formData: CourseBasicData;
  updateFormData: (updates: Partial<CourseBasicData>) => void;
  categories: Category[];
  thumbnailUrl: string | null;
  onThumbnailUploaded: (fileOrUrl: File | string) => void;
  onThumbnailRemoved: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <ThumbnailUploader
          onThumbnailUploaded={onThumbnailUploaded}
          onThumbnailRemoved={onThumbnailRemoved}
          existingThumbnailUrl={thumbnailUrl || undefined}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre du cours *
          </label>
          <input
            type="text"
            value={formData.title || ""}
            onChange={(e) => updateFormData({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Entrez le titre de votre cours"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie *
          </label>
          <select
            value={formData.categoryId || ""}
            onChange={(e) => updateFormData({ categoryId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionnez une catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Niveau *
          </label>
          <select
            value={formData.level || "BEGINNER"}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              updateFormData({ level: e.target.value as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BEGINNER">Débutant</option>
            <option value="INTERMEDIATE">Intermédiaire</option>
            <option value="ADVANCED">Avancé</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix (XOF) *
          </label>
          <input
            type="number"
            value={formData.price ?? 0}
            onChange={(e) =>
              updateFormData({ price: parseFloat(e.target.value) || 0 })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min="0"
            step="100"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description du cours *
        </label>
        <textarea
          value={formData.description || ""}
          onChange={(e) => updateFormData({ description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Décrivez votre cours en détail..."
          rows={6}
          required
        />
      </div>
    </div>
  );
}

export function CourseBasicInfoEditor({
  courseId,
  open,
  onOpenChange,
  onCourseUpdated,
}: CourseBasicInfoEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [originalData, setOriginalData] = useState<CourseBasicData | null>(null);
  const [formData, setFormData] = useState<CourseBasicData>({
    title: "",
    description: "",
    categoryId: "",
    level: "BEGINNER",
    price: 0,
    thumbnailUrl: "",
    status: "DRAFT",
  });
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await CoursesApi.getCategories();
        setCategories(cats);
        logger.log("✅ Catégories chargées:", cats.length);
      } catch (err) {
        logger.error("Erreur lors du chargement des catégories:", err);
        showErrorToast("Erreur", "Impossible de charger les catégories");
      }
    };
    loadCategories();
  }, []);

  // Load course data when modal opens
  useEffect(() => {
    if (open && courseId) {
      logger.log("🔍 Ouverture du modal, chargement des données pour courseId:", courseId);
      loadCourseData();
    } else if (open && !courseId) {
      logger.error("❌ courseId est null ou undefined");
      showErrorToast("Erreur", "ID du cours manquant");
      onOpenChange(false);
    }
  }, [open, courseId]);

  const loadCourseData = async () => {
    if (!courseId) return;

    setIsLoading(true);
    logger.log("🔄 Début chargement données cours:", courseId);
    
    try {
      const details = await CoursesApi.getCourseDetails(courseId);
      logger.log("📦 Données reçues de l'API:", JSON.stringify(details, null, 2));

      // Mapper les données du cours depuis l'API
      // Note: Le status n'est pas toujours retourné par getCourseDetails
      const courseData: CourseBasicData = {
        title: details.course?.title || "",
        description: details.course?.description || "",
        categoryId: details.course?.categoryId || "",
        level: (details.course?.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED") || "BEGINNER",
        price: details.course?.price ?? 0,
        thumbnailUrl: details.course?.thumbnailUrl || "",
        status: "DRAFT", // Le status sera conservé depuis originalData
      };

      // Stocker l'URL du thumbnail séparément
      setThumbnailUrl(details.course?.thumbnailUrl || null);

      logger.log("✅ Données mappées:", courseData);
      logger.log("🖼️ Thumbnail URL:", details.course?.thumbnailUrl);

      setOriginalData(courseData);
      setFormData(courseData);
    } catch (error) {
      logger.error("❌ Erreur lors du chargement des données du cours:", error);
      showErrorToast("Erreur", "Impossible de charger les données du cours");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (updates: Partial<CourseBasicData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleThumbnailUploaded = (fileOrUrl: File | string) => {
    if (typeof fileOrUrl === "string") {
      setThumbnailUrl(fileOrUrl);
      updateFormData({ thumbnailUrl: fileOrUrl });
    } else {
      // Handle file upload - store file reference and create local URL for preview
      setThumbnailFile(fileOrUrl);
      const localUrl = URL.createObjectURL(fileOrUrl);
      setThumbnailUrl(localUrl);
      updateFormData({ thumbnailUrl: localUrl });
    }
  };

  const handleThumbnailRemoved = () => {
    setThumbnailFile(null);
    setThumbnailUrl(null);
    updateFormData({ thumbnailUrl: "" });
  };

  // Calculer si des modifications ont été feitas
  const hasChanges = useMemo(() => {
    if (!originalData) return false;
    
    return (
      formData.title !== originalData.title ||
      formData.description !== originalData.description ||
      formData.categoryId !== originalData.categoryId ||
      formData.level !== originalData.level ||
      formData.price !== originalData.price ||
      (formData.thumbnailUrl || "") !== (originalData.thumbnailUrl || "")
    );
  }, [formData, originalData]);

  const handleSave = async () => {
    if (!hasChanges || !courseId) {
      logger.log("⏭️ Aucune modification ou courseId manquant");
      return;
    }

    setIsSaving(true);
    logger.log("💾 Début sauvegarde des modifications...");

    try {
      // Préparer les données pour la mise à jour avec l'API update-simple
      // Tous les champs sont optionnels dans l'API
      const updateData = {
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        level: formData.level,
        price: formData.price,
      };

      logger.log("📤 Données envoyées pour mise à jour:", JSON.stringify(updateData, null, 2));

      // Utiliser updateCourseSimple avec le format multipart/form-data
      await CoursesApi.updateCourseSimple(courseId, updateData, thumbnailFile);
      
      logger.log("✅ Sauvegarde réussie");
      showSuccessToast("Succès", "Cours modifié avec succès !");
      onCourseUpdated?.();
      onOpenChange(false);
    } catch (error) {
      logger.error("❌ Erreur lors de la mise à jour:", error);
      showErrorToast("Erreur", "Impossible de modifier le cours");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      // Ici on pourrait ajouter une confirmation de perte de données
      logger.log("⚠️ Fermeture avec modifications non sauvegardées");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les info du cours</DialogTitle>
          <DialogDescription>
            Modifiez les informations de base de votre cours. Seules les informations modifiées seront sauvegardées.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Chargement des données...</span>
          </div>
        ) : (
          <>
            <Step1BasicInfo
              formData={formData}
              updateFormData={updateFormData}
              categories={categories}
              thumbnailUrl={thumbnailUrl}
              onThumbnailUploaded={handleThumbnailUploaded}
              onThumbnailRemoved={handleThumbnailRemoved}
            />
            <div className="text-sm text-gray-500 mt-2">
              * Champs obligatoires
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || isLoading}
            className="flex items-center space-x-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? "Sauvegarde..." : "Sauvegarder"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
