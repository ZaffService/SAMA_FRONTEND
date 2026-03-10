"use client";

import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Save,
  X,
  Edit3,
  FileText,
} from "lucide-react";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { ModuleManager } from "./ModuleManager";
import { ThumbnailUploader } from "./ThumbnailUploader";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { Module } from "@/domain/entities/module";
import { toast } from "sonner";
import logger from "@/shared/helpers/logger";

interface Category {
  id?: string;
  name: string;
  description?: string;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  category?: string | Category;
  level: string;
  price: number;
  status?: string;
  thumbnailUrl?: string;
  attachment?: string | null;
  modules?: any[];
}

interface CourseEditorProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseUpdated?: () => void;
}

export function CourseEditor({
  course,
  open,
  onOpenChange,
  onCourseUpdated,
}: CourseEditorProps) {
  const { user } = useLocalAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    level: "BEGINNER" as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
    price: 0,
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    modules: [] as Module[],
  });

  // Load course data when opening
  useEffect(() => {
    if (open && course) {
      loadCourseData();
    }
  }, [open, course]);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await CoursesApi.getCategories();
        setCategories(cats);
      } catch (err) {
        logger.error("Erreur lors du chargement des catégories:", err);
      }
    };
    loadCategories();
  }, []);

  const loadCourseData = async () => {
    if (!course) return;

    setIsLoading(true);
    try {
      const details = await CoursesApi.getCourseDetails(course.id);

      setFormData({
        title: details.course.title || course?.title || "",
        description: details.course.description || course?.description || "",
        categoryId: details.course.categoryId || course?.categoryId || "",
        level: (details.course.level || course?.level || "BEGINNER") as
          | "BEGINNER"
          | "INTERMEDIATE"
          | "ADVANCED",
        price: details.course.price || course?.price || 0,
        status: (course?.status || "DRAFT") as
          | "DRAFT"
          | "PUBLISHED"
          | "ARCHIVED",
        modules: (details.modules || []).map((m: any, index: number) => ({
          id: m.id,
          tempId: m.id,
          title: m.title,
          description: m.description,
          orderIndex: m.orderIndex || index + 1,
          lessons: (m.lessons || []).map((l: any, lIndex: number) => ({
            id: l.id,
            tempId: l.id,
            title: l.title,
            content: l.content || "",
            orderIndex: l.orderIndex || lIndex + 1,
            duration: l.duration || 0,
          })),
          quizzes: [],
        })),
      });

      setThumbnailUrl(
        details.course.thumbnailUrl || course.thumbnailUrl || null,
      );
      
      // Charger l'attachment existant
      setExistingAttachmentUrl(details.course.attachment || null);
    } catch (err) {
      logger.error("Erreur lors du chargement du cours:", err);
      setError("Erreur lors du chargement du cours");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleModulesChange = (modules: Module[]) => {
    logger.log(
      "[CourseEditor] Modules changed:",
      modules.map((m) => ({
        id: m.id,
        title: m.title,
        orderIndex: m.orderIndex,
      })),
    );
    updateFormData({ modules });
  };

  const handleThumbnailUploaded = (fileOrUrl: File | string) => {
    if (fileOrUrl instanceof File) {
      setThumbnailFile(fileOrUrl);
      setThumbnailUrl(null);
    } else {
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
        toast.error('Seuls les fichiers PDF sont acceptés');
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
      if (!module.title.trim()) {
        return `Le titre du module "${module.title || "sans titre"}" est requis`;
      }
      for (const lesson of module.lessons) {
        if (!lesson.title.trim()) {
          return `Le titre de la leçon "${lesson.title || "sans titre"}" est requis`;
        }
      }
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await CoursesApi.updateCourse(course!.id, {
        ...formData,
        thumbnail: thumbnailFile || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        attachments: attachmentFile || undefined,
      });

      toast.success("Cours modifié avec succès");
      onOpenChange(false);
      onCourseUpdated?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification du cours";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header fixe */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center space-x-3">
            <Edit3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Modifier le cours</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              size="lg"
            >
              <X className="h-5 w-5 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu principal avec scroll */}
      <div className="h-[calc(100vh-80px)] overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <span className="ml-3 text-lg">Chargement du cours...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Informations de base */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Informations du cours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        placeholder="Entrez le titre du cours"
                        className="text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catégorie *
                      </label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) =>
                          updateFormData({ categoryId: value })
                        }
                      >
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.id || `cat-${category.name}`}
                              value={category.id || category.name}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        updateFormData({ description: e.target.value })
                      }
                      placeholder="Décrivez votre cours..."
                      rows={5}
                      className="text-base resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <SelectTrigger className="text-base">
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
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.price}
                        onChange={(e) =>
                          updateFormData({
                            price:
                              parseInt(e.target.value.replace(/[^\d]/g, ""), 10) ||
                              0,
                          })
                        }
                        min="0"
                        step="100"
                        className="text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statut *
                      </label>
                      <Select
                        value={formData.status}
                        onValueChange={(
                          value: "DRAFT" | "PUBLISHED" | "ARCHIVED",
                        ) => updateFormData({ status: value })}
                      >
                        <SelectTrigger className="text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Brouillon</SelectItem>
                          <SelectItem value="PUBLISHED">Publié</SelectItem>
                          <SelectItem value="ARCHIVED">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Miniature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image de couverture
                    </label>
                    <ThumbnailUploader
                      onThumbnailUploaded={handleThumbnailUploaded}
                      onThumbnailRemoved={handleThumbnailRemoved}
                      existingThumbnailUrl={thumbnailUrl || undefined}
                    />
                  </div>

                  {/* Attachment PDF */}
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <span>Document PDF du cours (optionnel)</span>
                    </h3>
                    
                    {!attachmentFile && !existingAttachmentUrl ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleAttachmentChange}
                          className="hidden"
                          id="attachment-upload-edit"
                        />
                        <label
                          htmlFor="attachment-upload-edit"
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
                                {attachmentFile ? attachmentFile.name : 'Document PDF existant'}
                              </p>
                              {attachmentFile && (
                                <p className="text-xs text-gray-500">
                                  {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              )}
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
                        {(attachmentPreview || existingAttachmentUrl) && (
                          <div className="mt-4">
                            <embed
                              src={attachmentPreview || existingAttachmentUrl || ''}
                              type="application/pdf"
                              width="100%"
                              height="300px"
                              className="rounded-lg border border-gray-200"
                            />
                          </div>
                        )}
                        {/* Lien vers l'attachment existant */}
                        {existingAttachmentUrl && !attachmentFile && (
                          <div className="mt-4">
                            <a
                              href={existingAttachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              Ouvrir le document PDF actuel
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Modules avec drag & drop */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-xl">
                    <span>Modules et leçons</span>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {formData.modules.length} module(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ModuleManager
                    modules={formData.modules}
                    onModulesChange={handleModulesChange}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
