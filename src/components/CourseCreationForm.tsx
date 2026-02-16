"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, Eye, AlertCircle, Image, FileText, X } from "lucide-react";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { ModuleManager } from "./ModuleManager";
import { ThumbnailUploader } from "./ThumbnailUploader";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import {
  showCourseCreatedSuccess,
  showCourseCreationError,
  showLoadingToast,
  closeLoading,
} from "@/shared/helpers/sweet-alert";
import { Module, Lesson } from "@/domain/entities/module";
import { CourseCookieStorage } from "@/utils/courseCookieStorage";
import logger from "@/shared/helpers/logger";

interface Category {
  id: string;
  name: string;
}

interface CourseFormData {
  title: string;
  description: string;
  categoryId: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  price: number;
  instructorId: string;
  modules: Module[];
}

interface CourseCreationFormProps {
  initialData?: Partial<CourseFormData>;
}

export function CourseCreationForm({
  initialData,
}: CourseCreationFormProps = {}) {
  const router = useRouter();
  const { user } = useLocalAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CourseFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || "",
    level: initialData?.level || "BEGINNER",
    price: initialData?.price || 0,
    instructorId: initialData?.instructorId || user?.id?.toString() || "",
    modules: initialData?.modules || [],
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        logger.log("🔍 Form: Début du chargement des catégories...");
        const cats = await CoursesApi.getCategories();
        logger.log(`✅ Form: ${cats.length} catégories reçues`, cats);
        setCategories(cats);
      } catch (err) {
        logger.error(
          "❌ Form: Erreur lors du chargement des catégories:",
          err,
        );
      }
    };
    loadCategories();
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (formData.title.trim() && !isSubmitting) {
        CourseCookieStorage.saveDraft({
          title: formData.title,
          description: formData.description,
          categoryId: formData.categoryId,
          level: formData.level,
          price: formData.price,
          modules: formData.modules,
        });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [formData, isSubmitting]);

  const updateFormData = (updates: Partial<CourseFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleModulesChange = (modules: Module[]) => {
    updateFormData({ modules });
  };

  const handleThumbnailUploaded = (fileOrUrl: File | string) => {
    if (fileOrUrl instanceof File) {
      // For course creation - store the file
      setThumbnailFile(fileOrUrl);
      // Create a local preview URL for display
      const previewUrl = URL.createObjectURL(fileOrUrl);
      setThumbnailUrl(previewUrl);
    } else {
      // For existing courses - store the URL
      setThumbnailUrl(fileOrUrl);
      setThumbnailFile(null);
    }
  };

  const handleThumbnailRemoved = () => {
    setThumbnailUrl(null);
    setThumbnailFile(null);
  };

  // Gérer la sélection du fichier PDF
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Valider que c'est un PDF
      if (file.type !== 'application/pdf') {
        alert('Seuls les fichiers PDF sont acceptés');
        return;
      }
      setAttachmentFile(file);
      setAttachmentPreview(URL.createObjectURL(file));
    }
  };

  // Supprimer l'attachment PDF
  const handleAttachmentRemove = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return "Le titre du cours est requis";
    if (!formData.description.trim())
      return "La description du cours est requise";
    if (!formData.categoryId) return "La catégorie est requise";
    if (formData.price < 0) return "Le prix ne peut pas être négatif";
    if (formData.modules.length === 0) return "Au moins un module est requis";

    for (const module of formData.modules) {
      if (!module.title.trim())
        return `Le titre du module "${module.title || "sans titre"}" est requis`;
      // Description is now optional, so no validation required
      if (module.lessons.length === 0)
        return `Le module "${module.title}" doit contenir au moins une leçon`;

      for (const lesson of module.lessons) {
        if (!lesson.title.trim())
          return `Le titre de la leçon "${lesson.title || "sans titre"}" est requis`;
        if (!lesson.content.trim())
          return `Le contenu de la leçon "${lesson.title}" est requis`;
      }
    }

    return null;
  };

  const prepareCourseData = () => {
    return {
      ...formData,
      instructorId: formData.instructorId || user?.id?.toString() || "",
      thumbnail: thumbnailFile || undefined,
      attachments: attachmentFile || undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showCourseCreationError(validationError);
      return;
    }

    // Additional validation: Check if category exists
    const categoryExists = categories.find(
      (cat) => cat.id === formData.categoryId,
    );
    if (!categoryExists) {
      const errorMessage =
        "La catégorie sélectionnée n'existe pas. Veuillez recharger la page et réessayer.";
      setError(errorMessage);
      showCourseCreationError(errorMessage);
      return;
    }

    logger.log("✅ [VALIDATION] Catégorie valide:", categoryExists);

    setIsSubmitting(true);
    showLoadingToast("Création de votre cours en cours...");

    try {
      const result = await CoursesApi.createCourse(prepareCourseData());

      closeLoading();

      // Afficher la popup de succès avec SweetAlert
      showCourseCreatedSuccess(formData.title, () => {
        router.push("/admin-dashboard?courseCreated=true");  // Rediriger vers la liste des cours
      });
    } catch (err) {
      closeLoading();
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du cours";
      setError(errorMessage);
      showCourseCreationError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Créer un nouveau cours
        </h1>
        <p className="text-gray-600 mt-2">
          Remplissez les informations de votre cours et organisez son contenu.
        </p>
        {draftId && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
            <Save className="h-4 w-4 mr-2" />
            Brouillon sauvegardé
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Messages d'erreur/succès */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informations de base</TabsTrigger>
            <TabsTrigger value="content">Contenu du cours</TabsTrigger>
            <TabsTrigger value="media">Médias</TabsTrigger>
          </TabsList>

          {/* Onglet Informations de base */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Détails du cours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Thumbnail Upload */}
                <div className="mb-6">
                  <ThumbnailUploader
                    onThumbnailUploaded={handleThumbnailUploaded}
                    onThumbnailRemoved={handleThumbnailRemoved}
                    existingThumbnailUrl={thumbnailUrl || undefined}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre du cours *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        updateFormData({ title: e.target.value })
                      }
                      placeholder="Entrez le titre de votre cours"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie *
                    </label>

                    {categoriesLoading ? (
                      // État de chargement
                      <div className="border rounded-md p-2 text-gray-500">
                        Chargement des catégories...
                      </div>
                    ) : categoriesError ? (
                      // État d'erreur
                      <div className="border border-red-300 rounded-md p-2 text-red-600">
                        Erreur : {categoriesError}
                      </div>
                    ) : categories.length === 0 ? (
                      // Aucune catégorie
                      <div className="border border-yellow-300 rounded-md p-2 text-yellow-600">
                        Aucune catégorie disponible
                      </div>
                    ) : (
                      // Select normal
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => {
                          logger.log("📝 Catégorie sélectionnée:", value);
                          updateFormData({ categoryId: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => {
                            logger.log(
                              "🔹 Rendu catégorie:",
                              category.id,
                              category.name,
                            );
                            return (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Debug info (à enlever en production) */}
                    <div className="mt-2 text-xs text-gray-500">
                      Debug: {categories.length} catégories chargées
                      {categories.length > 0 && (
                        <ul className="mt-1">
                          {categories.slice(0, 3).map((cat) => (
                            <li key={cat.id}>• {cat.name}</li>
                          ))}
                          {categories.length > 3 && (
                            <li>... et {categories.length - 3} autres</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Niveau *
                    </label>
                    <Select
                      value={formData.level}
                      onValueChange={(
                        value: "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
                      ) => updateFormData({ level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">Débutant</SelectItem>
                        <SelectItem value="INTERMEDIATE">
                          Intermédiaire
                        </SelectItem>
                        <SelectItem value="ADVANCED">Avancé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix (XOF) *
                    </label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        updateFormData({
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
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
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData({ description: e.target.value })
                    }
                    placeholder="Décrivez votre cours en détail..."
                    rows={6}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Contenu du cours */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <ModuleManager
                  modules={formData.modules}
                  onModulesChange={handleModulesChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Médias */}
          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Image className="h-5 w-5" />
                  <span>Gestion des médias</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Vous pouvez upload des vidéos pour chaque leçon dans
                    l&apos;onglet "Contenu du cours". Chaque leçon peut contenir
                    une vidéo de démonstration ou de formation.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Récapitulatif des médias
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">
                        Modules
                      </p>
                      <p className="text-2xl font-bold text-blue-800">
                        {formData.modules.length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">
                        Leçons
                      </p>
                      <p className="text-2xl font-bold text-green-800">
                        {formData.modules.reduce(
                          (acc, m) => acc + m.lessons.length,
                          0,
                        )}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">
                        Vidéos uploadées
                      </p>
                      <p className="text-2xl font-bold text-purple-800">
                        {formData.modules.reduce(
                          (acc, m) =>
                            acc + m.lessons.filter((l) => l.videoUrl).length,
                          0,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Attachment PDF Section */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <span>Document PDF du cours (optionnel)</span>
                  </h3>
                  
                  {!attachmentFile ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleAttachmentChange}
                        className="hidden"
                        id="attachment-upload"
                      />
                      <label
                        htmlFor="attachment-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                          <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Cliquez pour sélectionner un fichier PDF
                        </p>
                        <p className="text-xs text-gray-500">
                          Taille max: 10MB • Format: PDF uniquement
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {attachmentFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB • PDF
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAttachmentRemove}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      {/* Prévisualisation du PDF */}
                      {attachmentPreview && (
                        <div className="mt-4">
                          <embed
                            src={attachmentPreview}
                            type="application/pdf"
                            width="100%"
                            height="300px"
                            className="rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end items-center pt-6 border-t">
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span>
                {isSubmitting ? "Création en cours..." : "Créer le cours"}
              </span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
