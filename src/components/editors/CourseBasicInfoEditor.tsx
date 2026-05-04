
"use client";

import { useState, useEffect, useMemo, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save, ArrowLeft } from "lucide-react";
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
  price: string;
  thumbnailUrl?: string;
  status?: string;
}

interface CourseBasicInfoEditorProps {
  courseId: string | null;
  onBack?: () => void;
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
          <label className="mb-2 block text-sm font-medium text-white/85">
            Titre du cours *
          </label>
          <input
            type="text"
            value={formData.title || ""}
            onChange={(e) => updateFormData({ title: e.target.value })}
            className="w-full rounded-lg border border-white/15 bg-[#121829] px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Entrez le titre de votre cours"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/85">
            Catégorie *
          </label>
          <select
            value={formData.categoryId || ""}
            onChange={(e) => updateFormData({ categoryId: e.target.value })}
            className="w-full rounded-lg border border-white/15 bg-[#121829] px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="mb-2 block text-sm font-medium text-white/85">
            Niveau *
          </label>
          <select
            value={formData.level || "BEGINNER"}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateFormData({ level: e.target.value as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" })
            }
            className="w-full rounded-lg border border-white/15 bg-[#121829] px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BEGINNER">Débutant</option>
            <option value="INTERMEDIATE">Intermédiaire</option>
            <option value="ADVANCED">Avancé</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/85">
            Prix (XOF) *
          </label>
          <input
            type="text"
            inputMode="text"
            pattern="[0-9]*"
            value={formData.price ?? ""}
            onChange={(e) =>
              updateFormData({
                price: e.target.value.replace(/[^\d]/g, ""),
              })
            }
            className="w-full rounded-lg border border-white/15 bg-[#121829] px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min="0"
            step="100"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-white/85">
          Description du cours *
        </label>
        <textarea
          value={formData.description || ""}
          onChange={(e) => updateFormData({ description: e.target.value })}
          className="w-full rounded-lg border border-white/15 bg-[#121829] px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  onBack,
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
    price: "",
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

  // Load course data when courseId changes
  useEffect(() => {
    if (courseId) {
      logger.log("🔍 Chargement des données pour courseId:", courseId);
      loadCourseData();
    } else {
      logger.error("❌ courseId est null ou undefined");
      showErrorToast("Erreur", "ID du cours manquant");
    }
  }, [courseId]);

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
        price: String(details.course?.price ?? ""),
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
      onBack?.();
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
        price: Number.parseInt(formData.price || "0", 10) || 0,
      };

      logger.log("📤 Données envoyées pour mise à jour:", JSON.stringify(updateData, null, 2));

      // Utiliser updateCourseSimple avec le format multipart/form-data
      await CoursesApi.updateCourseSimple(courseId, updateData, thumbnailFile);
      
      logger.log("✅ Sauvegarde réussie");
      showSuccessToast("Succès", "Cours modifié avec succès !");
      onCourseUpdated?.();
    } catch (error) {
      logger.error("❌ Erreur lors de la mise à jour:", error);
      showErrorToast("Erreur", "Impossible de modifier le cours");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      // Ici on pourrait ajouter une confirmation de perte de données
      logger.log("⚠️ Retour avec modifications non sauvegardées");
    }
    onBack?.();
  };

  return (
    <div className="relative mx-auto w-full max-w-7xl p-6 md:p-10 text-white">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-44 right-8 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="group rounded-xl border border-white/10 bg-white/5 px-4 text-white/80 hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Retour aux actions du cours
        </Button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#101522]/95 p-6 shadow-[0_28px_90px_-45px_rgba(0,0,0,0.9)] md:p-8">
        <div className="mb-8 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Modifier les infos du cours
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-white/65 md:text-base">
            Modifiez les informations de base de votre cours. Seules les
            informations modifiées seront sauvegardées.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-2 text-white/75">Chargement des données...</span>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-2xl border border-white/10 bg-[#0E1320]/95 p-5 md:p-6">
              <Step1BasicInfo
                formData={formData}
                updateFormData={updateFormData}
                categories={categories}
                thumbnailUrl={thumbnailUrl}
                onThumbnailUploaded={handleThumbnailUploaded}
                onThumbnailRemoved={handleThumbnailRemoved}
              />
            </div>
            <div className="text-sm text-white/55">* Champs obligatoires</div>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isSaving}
            className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            Retour
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || isLoading}
            className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-500"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? "Sauvegarde..." : "Sauvegarder"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
