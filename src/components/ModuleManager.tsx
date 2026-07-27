"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
  CheckCircle,
  Loader2,
  Edit,
} from "lucide-react";
import { Lesson, Module } from "@/domain/entities/module";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { LessonVideoSourcePicker } from "@/components/lesson-video-source-picker";
import type { LessonVideoSourceMode } from "@/lib/youtube";
import logger from "@/shared/helpers/logger";

// ============================================================================
// LessonManager Component
// ============================================================================

interface LessonManagerProps {
  lessons: Lesson[];
  onLessonsChange: (lessons: Lesson[]) => void;
  courseId?: string;
}

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/avi",
  "video/mov",
  "video/wmv",
  "video/flv",
  "video/mkv",
];

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export function LessonManager({
  lessons,
  onLessonsChange,
  courseId,
}: LessonManagerProps) {
  const fieldClassName =
    "border-[#3B3754] bg-[#181721] text-white placeholder:text-white/55";
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState<Record<string, boolean>>({});

  const addLesson = () => {
    const newLesson: Lesson = {
      tempId: `temp-${Date.now()}`,
      title: "",
      content: "",
      orderIndex: lessons.length + 1,
      duration: 0,
    };
    onLessonsChange([...lessons, newLesson]);
  };

  const updateLesson = (index: number, updates: Partial<Lesson>) => {
    const updatedLessons = lessons.map((lesson, i) =>
      i === index ? { ...lesson, ...updates } : lesson,
    );
    onLessonsChange(updatedLessons);
  };

  const removeLesson = (index: number) => {
    const updatedLessons = lessons.filter((_, i) => i !== index);
    const reorderedLessons = updatedLessons.map((lesson, i) => ({
      ...lesson,
      orderIndex: i + 1,
    }));
    onLessonsChange(reorderedLessons);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newLessons = [...lessons];
    const draggedLesson = newLessons[draggedIndex];
    newLessons.splice(draggedIndex, 1);
    newLessons.splice(index, 0, draggedLesson);

    const reorderedLessons = newLessons.map((lesson, i) => ({
      ...lesson,
      orderIndex: i + 1,
    }));

    onLessonsChange(reorderedLessons);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const validateVideoFile = (file: File): string | null => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return `Type de fichier non supporté: ${file.type}. Types acceptés: MP4, WebM, OGG, AVI, MOV, WMV, FLV, MKV.`;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return `Fichier trop volumineux: ${(file.size / 1024 / 1024 / 1024).toFixed(1)}GB. Maximum: ${MAX_VIDEO_SIZE / 1024 / 1024 / 1024}GB.`;
    }
    return null;
  };

  const handleVideoUpload = async (index: number, file: File) => {
    const lessonId = lessons[index].tempId || `lesson-${index}`;

    setUploadErrors((prev) => ({ ...prev, [lessonId]: "" }));

    const validationError = validateVideoFile(file);
    if (validationError) {
      setUploadErrors((prev) => ({ ...prev, [lessonId]: validationError }));
      return;
    }

    setUploadProgress((prev) => ({ ...prev, [lessonId]: 0 }));

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const currentProgress = prev[lessonId] || 0;
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
          updateLesson(index, {
            videoFile: file,
            videoUrl: undefined,
            videoSource: "file",
          });
          return { ...prev, [lessonId]: 100 };
        }
        return { ...prev, [lessonId]: currentProgress + 10 };
      });
    }, 200);

    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress((prev) => ({ ...prev, [lessonId]: 100 }));
      updateLesson(index, {
        videoFile: file,
        videoUrl: undefined,
        videoSource: "file",
      });
    }, 2000);
  };

  const handleVideoSourceModeChange = (
    index: number,
    mode: LessonVideoSourceMode,
  ) => {
    const lessonId = lessons[index].tempId || `lesson-${index}`;
    if (mode === "file") {
      updateLesson(index, {
        videoSource: "file",
        videoUrl: undefined,
      });
    } else {
      updateLesson(index, {
        videoSource: "youtube",
        videoFile: undefined,
      });
      setUploadProgress((prev) => ({ ...prev, [lessonId]: 0 }));
    }
    setUploadErrors((prev) => ({ ...prev, [lessonId]: "" }));
  };

  const handleVideoUrlChange = (index: number, url: string) => {
    updateLesson(index, {
      videoSource: "youtube",
      videoUrl: url,
      videoFile: undefined,
    });
  };

  const handleFileDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setIsDragOver((prev) => ({ ...prev, [`lesson-${index}`]: false }));

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("video/")) {
        handleVideoUpload(index, file);
      }
    }
  }, []);

  const handleDragOverVideo = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setIsDragOver((prev) => ({ ...prev, [`lesson-${index}`]: true }));
    },
    [],
  );

  const handleDragLeaveVideo = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setIsDragOver((prev) => ({ ...prev, [`lesson-${index}`]: false }));
    },
    [],
  );

  const removeVideo = (index: number) => {
    const lessonId = lessons[index].tempId || `lesson-${index}`;
    updateLesson(index, {
      videoFile: undefined,
      videoUrl: undefined,
    });
    setUploadProgress((prev) => ({ ...prev, [lessonId]: 0 }));
    setUploadErrors((prev) => ({ ...prev, [lessonId]: "" }));
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Leçons</h3>
          <p className="text-sm text-white">
            Ajoutez du contenu et des vidéos à votre leçon.
          </p>
        </div>
        <Button
          type="button"
          onClick={addLesson}
          className="flex items-center space-x-2 bg-[#3B82F6] text-white hover:bg-[#2563EB]"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter une leçon</span>
        </Button>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-[#3B3754] bg-[#181721] py-8 text-center text-white">
          <div className="space-y-2">
            <h4 className="text-md font-medium">Aucune leçon créée</h4>
            <p>Commencez par ajouter votre première leçon.</p>
            <Button
              type="button"
              onClick={addLesson}
              className="mt-4 bg-[#3B82F6] text-white hover:bg-[#2563EB]"
            >
              Créer la première leçon
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id || lesson.tempId || `lesson-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="cursor-move"
            >
              <Card className="border border-[#3B3754] bg-[#1F1D2B]">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center space-x-2 text-white">
                      <GripVertical className="h-4 w-4 text-white/50" />
                      <span>
                        Leçon {index + 1}: {lesson.title || "Sans titre"}
                      </span>
                    </CardTitle>
                    <p className="mt-1 text-xs text-white/60">
                      Glissez pour réorganiser
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLesson(index)}
                      className="border-[#3B3754] bg-[#181721] text-red-400 hover:bg-[#33242a] hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-white">
                        Titre de la leçon *
                      </label>
                      <Input
                        value={lesson.title}
                        onChange={(e) =>
                          updateLesson(index, { title: e.target.value })
                        }
                        placeholder="Entrez le titre de la leçon"
                        className={fieldClassName}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-white">
                        Durée (minutes)
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={lesson.duration || ""}
                        onChange={(e) =>
                          updateLesson(index, {
                            duration: parseInt(e.target.value.replace(/[^\d]/g, ""), 10) || 0,
                          })
                        }
                        placeholder="0"
                        className={fieldClassName}
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-white">
                      Contenu de la leçon *
                    </label>
                    <Textarea
                      value={lesson.content}
                      onChange={(e) =>
                        updateLesson(index, { content: e.target.value })
                      }
                      placeholder="Écrivez le contenu de votre leçon..."
                      rows={4}
                      className={fieldClassName}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">
                      Vidéo de la leçon (optionnel)
                    </label>
                    <LessonVideoSourcePicker
                      variant="dark"
                      mode={
                        lesson.videoSource === "youtube" ||
                        (!lesson.videoFile && !!lesson.videoUrl)
                          ? "youtube"
                          : "file"
                      }
                      videoFile={lesson.videoFile}
                      videoUrl={lesson.videoUrl || ""}
                      error={uploadErrors[lesson.tempId || `lesson-${index}`]}
                      isDragOver={
                        !!isDragOver[lesson.tempId || `lesson-${index}`]
                      }
                      uploadProgress={
                        uploadProgress[lesson.tempId || `lesson-${index}`] || 0
                      }
                      onModeChange={(mode) =>
                        handleVideoSourceModeChange(index, mode)
                      }
                      onFileSelect={(file) => handleVideoUpload(index, file)}
                      onVideoUrlChange={(url) =>
                        handleVideoUrlChange(index, url)
                      }
                      onClear={() => removeVideo(index)}
                      onDragOver={(e) => handleDragOverVideo(e, index)}
                      onDragLeave={(e) => handleDragLeaveVideo(e, index)}
                      onDrop={(e) => handleFileDrop(e, index)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ModuleManager Component
// ============================================================================

interface ModuleManagerProps {
  modules: Module[];
  onModulesChange: (modules: Module[]) => void;
}

export function ModuleManager({ modules, onModulesChange }: ModuleManagerProps) {
  const fieldClassName =
    "border-[#3B3754] bg-[#181721] text-white placeholder:text-white/55";
  const [editingModule, setEditingModule] = useState<{
    isOpen: boolean;
    moduleId: string;
    title: string;
    description: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addModule = () => {
    const newModule: Module = {
      tempId: `temp-${Date.now()}`,
      title: "",
      description: "",
      orderIndex: modules.length + 1,
      lessons: [],
    };
    onModulesChange([...modules, newModule]);
  };

  const updateModule = (index: number, updates: Partial<Module>) => {
    const updatedModules = modules.map((module, i) =>
      i === index ? { ...module, ...updates } : module,
    );
    onModulesChange(updatedModules);
  };

  const removeModule = (index: number) => {
    const updatedModules = modules.filter((_, i) => i !== index);
    const reorderedModules = updatedModules.map((module, i) => ({
      ...module,
      orderIndex: i + 1,
    }));
    onModulesChange(reorderedModules);
  };

  const handleLessonsChange = (moduleIndex: number, lessons: Module["lessons"]) => {
    updateModule(moduleIndex, { lessons });
  };

  // Ouvrir le dialogue d'édition
  const openEditDialog = (module: Module) => {
    setEditingModule({
      isOpen: true,
      moduleId: module.id!,
      title: module.title,
      description: module.description || "",
    });
    setError(null);
    setSuccess(false);
  };

  // Fermer le dialogue
  const closeEditDialog = () => {
    setEditingModule(null);
    setError(null);
    setSuccess(false);
  };

  // Gérer les changements dans le formulaire
  const handleEditFieldChange = (field: "title" | "description", value: string) => {
    if (editingModule) {
      setEditingModule({ ...editingModule, [field]: value });
    }
  };

  // Soumettre le formulaire de modification
  const handleEditSubmit = async () => {
    if (!editingModule) return;

    // Validation
    if (!editingModule.title || editingModule.title.trim() === "") {
      setError("Le titre du module est requis");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      logger.log(`🔄 [ModuleManager] Début modification module: ${editingModule.moduleId}`);
      logger.log(`📦 [ModuleManager] Données envoyées:`, {
        title: editingModule.title,
        description: editingModule.description
      });
      
      // Mettre à jour immédiatement le dialogue avec les nouvelles valeurs
      // pour que l'utilisateur voie les changements immédiatement
      setEditingModule(prev => prev ? {
        ...prev,
        title: editingModule.title,
        description: editingModule.description
      } : null);
      
      const response = await CoursesApi.updateModule(editingModule.moduleId, {
        title: editingModule.title,
        description: editingModule.description || undefined,
      });

      logger.log(`✅ [ModuleManager] Réponse API:`, response);
      setSuccess(true);

      // Mettre à jour le module avec les données du serveur (si disponibles)
      const updatedModules = modules.map((module) => {
        if (module.id === editingModule.moduleId) {
          return { 
            ...module, 
            title: response.module?.title || editingModule.title, 
            description: response.module?.description || editingModule.description 
          };
        }
        return module;
      });
      
      logger.log(`📦 [ModuleManager] Modules mis à jour: ${modules.length} → ${updatedModules.length}`);
      onModulesChange(updatedModules);

      // Fermer le dialogue après un court délai
      setTimeout(() => {
        closeEditDialog();
      }, 1500);
    } catch (err: any) {
      logger.error("❌ [ModuleManager] Erreur modification module:", err);
      setError(err.message || "Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Modules</h3>
          <p className="text-sm text-white">
            Organisez votre cours en modules et leçons.
          </p>
        </div>
        <Button
          type="button"
          onClick={addModule}
          className="flex items-center space-x-2 bg-[#3B82F6] text-white hover:bg-[#2563EB]"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un module</span>
        </Button>
      </div>

      {modules.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-[#3B3754] bg-[#181721] py-8 text-center text-white">
          <div className="space-y-2">
            <h4 className="text-md font-medium">Aucun module créé</h4>
            <p>Commencez par ajouter votre premier module.</p>
            <Button
              type="button"
              onClick={addModule}
              className="mt-4 bg-[#3B82F6] text-white hover:bg-[#2563EB]"
            >
              Créer le premier module
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module, index) => (
            <Card
              key={module.id || module.tempId || `module-${index}`}
              className="border border-[#3B3754] bg-[#1F1D2B]"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-white">
                    Module {index + 1}: {module.title || "Sans titre"}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {module.id && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(module)}
                        className="border-[#3B3754] bg-[#181721] text-[#80B5FF] hover:bg-[#26233A] hover:text-[#A5CCFF]"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="ml-1">Modifier</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeModule(index)}
                      className="border-[#3B3754] bg-[#181721] text-red-400 hover:bg-[#33242a] hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-white">
                    Titre du module *
                  </label>
                  <Input
                    value={module.title}
                    onChange={(e) =>
                      updateModule(index, { title: e.target.value })
                    }
                    placeholder="Entrez le titre du module"
                    className={fieldClassName}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-white">
                    Description du module
                  </label>
                  <Textarea
                    value={module.description || ""}
                    onChange={(e) =>
                      updateModule(index, { description: e.target.value })
                    }
                    placeholder="Décrivez le contenu de ce module..."
                    className={fieldClassName}
                    rows={2}
                  />
                </div>

                <div className="border-t border-[#3B3754] pt-4">
                  <LessonManager
                    lessons={module.lessons}
                    onLessonsChange={(lessons) => handleLessonsChange(index, lessons)}
                    courseId={module.id}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogue de modification du module */}
      <Dialog
        open={editingModule?.isOpen || false}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
      >
        <DialogContent className="sm:max-w-[500px] border border-[#3B3754] bg-[#1F1D2B] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-white">
              <Edit className="h-5 w-5 text-[#80B5FF]" />
              <span>Modifier le module</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {success && (
              <Alert className="border-[#34D399] bg-[#12352D]">
                <CheckCircle className="h-4 w-4 text-[#A9F5E5]" />
                <AlertDescription className="text-[#A9F5E5]">
                  Module modifié avec succès !
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-[#EF4444] bg-[#35181D] text-white">
                <AlertCircle className="h-4 w-4 text-[#FCA5A5]" />
                <AlertDescription className="text-[#FECACA]">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label
                htmlFor="edit-module-title"
                className="block text-sm font-semibold text-white"
              >
                Titre du module *
              </label>
              <Input
                id="edit-module-title"
                value={editingModule?.title || ""}
                onChange={(e) => handleEditFieldChange("title", e.target.value)}
                placeholder="Entrez le titre du module"
                className="border-[#3B3754] bg-[#181721] text-white placeholder:text-white/55"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-module-description"
                className="block text-sm font-semibold text-white"
              >
                Description du module
              </label>
              <Textarea
                id="edit-module-description"
                value={editingModule?.description || ""}
                onChange={(e) => handleEditFieldChange("description", e.target.value)}
                placeholder="Décrivez le contenu de ce module..."
                className="border-[#3B3754] bg-[#181721] text-white placeholder:text-white/55"
                rows={4}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              onClick={closeEditDialog}
              disabled={isSubmitting}
              className="border border-[#3B3754] bg-[#181721] text-white hover:bg-[#26233A]"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleEditSubmit}
              disabled={isSubmitting || success}
              className="bg-[#3B82F6] text-white hover:bg-[#2563EB]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Modification...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
