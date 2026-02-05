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
  Upload,
  AlertCircle,
  CheckCircle,
  FileVideo,
  Loader2,
  Edit,
} from "lucide-react";
import { Lesson, Module } from "@/domain/entities/module";
import { CoursesApi } from "@/infrastructure/api/courses-api";

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
          updateLesson(index, { videoFile: file });
          return { ...prev, [lessonId]: 100 };
        }
        return { ...prev, [lessonId]: currentProgress + 10 };
      });
    }, 200);

    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress((prev) => ({ ...prev, [lessonId]: 100 }));
      updateLesson(index, { videoFile: file });
    }, 2000);
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
    updateLesson(index, { videoFile: undefined });
    setUploadProgress((prev) => ({ ...prev, [lessonId]: 0 }));
    setUploadErrors((prev) => ({ ...prev, [lessonId]: "" }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Leçons</h3>
          <p className="text-sm text-gray-600">
            Ajoutez du contenu et des vidéos à votre leçon.
          </p>
        </div>
        <Button
          type="button"
          onClick={addLesson}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter une leçon</span>
        </Button>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="space-y-2">
            <h4 className="text-md font-medium">Aucune leçon créée</h4>
            <p>Commencez par ajouter votre première leçon.</p>
            <Button type="button" onClick={addLesson} className="mt-4">
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
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center space-x-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span>
                        Leçon {index + 1}: {lesson.title || "Sans titre"}
                      </span>
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      Glissez pour réorganiser
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLesson(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titre de la leçon *
                      </label>
                      <Input
                        value={lesson.title}
                        onChange={(e) =>
                          updateLesson(index, { title: e.target.value })
                        }
                        placeholder="Entrez le titre de la leçon"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Durée (minutes)
                      </label>
                      <Input
                        type="number"
                        value={lesson.duration || ""}
                        onChange={(e) =>
                          updateLesson(index, {
                            duration: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contenu de la leçon *
                    </label>
                    <Textarea
                      value={lesson.content}
                      onChange={(e) =>
                        updateLesson(index, { content: e.target.value })
                      }
                      placeholder="Écrivez le contenu de votre leçon..."
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vidéo de la leçon (optionnel)
                    </label>

                    {(() => {
                      const lessonId = lesson.tempId || `lesson-${index}`;
                      const currentError = uploadErrors[lessonId];
                      const currentDragOver = isDragOver[lessonId];
                      const currentProgress = uploadProgress[lessonId] || 0;

                      return (
                        <>
                          {currentError && (
                            <Alert variant="destructive" className="mb-3">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                {currentError}
                              </AlertDescription>
                            </Alert>
                          )}

                          <div
                            className={`
                              border-2 border-dashed rounded-lg p-6 text-center transition-colors
                              ${
                                currentDragOver
                                  ? "border-blue-400 bg-blue-50"
                                  : "border-gray-300 hover:border-gray-400"
                              }
                              ${lesson.videoFile ? "bg-green-50 border-green-300" : ""}
                            `}
                            onDragOver={(e) => handleDragOverVideo(e, index)}
                            onDragLeave={(e) => handleDragLeaveVideo(e, index)}
                            onDrop={(e) => handleFileDrop(e, index)}
                          >
                            {lesson.videoFile ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-center space-x-2">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  <span className="text-sm font-medium text-green-700">
                                    Vidéo ajoutée
                                  </span>
                                </div>

                                <div className="flex items-center justify-between bg-white p-3 rounded border">
                                  <div className="flex items-center space-x-3">
                                    <FileVideo className="h-8 w-8 text-blue-500" />
                                    <div className="text-left">
                                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                        {lesson.videoFile.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatFileSize(lesson.videoFile.size)}{" "}
                                        • {lesson.videoFile.type}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeVideo(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : currentProgress > 0 && currentProgress < 100 ? (
                              <div className="space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-gray-900">
                                    Téléchargement en cours...
                                  </p>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${currentProgress}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {currentProgress}% terminé
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <Upload
                                  className={`h-10 w-10 mx-auto ${currentDragOver ? "text-blue-500" : "text-gray-400"}`}
                                />
                                <div className="space-y-2">
                                  <p className="text-lg font-medium text-gray-900">
                                    {currentDragOver
                                      ? "Déposez votre vidéo ici"
                                      : "Glissez-déposez une vidéo"}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    ou{" "}
                                    <label
                                      htmlFor={`video-upload-${index}`}
                                      className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
                                    >
                                      parcourez vos fichiers
                                    </label>
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Formats acceptés: MP4, WebM, OGG, AVI, MOV,
                                    WMV, FLV, MKV • Max 500MB
                                  </p>
                                </div>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleVideoUpload(index, file);
                                  }}
                                  className="hidden"
                                  id={`video-upload-${index}`}
                                />
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
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
      const response = await CoursesApi.updateModule(editingModule.moduleId, {
        title: editingModule.title,
        description: editingModule.description || undefined,
      });

      console.log("✅ Module modifié:", response);
      setSuccess(true);

      // Mettre à jour le module dans la liste locale
      const moduleIndex = modules.findIndex((m) => m.id === editingModule.moduleId);
      if (moduleIndex !== -1) {
        updateModule(moduleIndex, {
          title: response.module.title,
          description: response.module.description,
        });
      }

      // Fermer le dialogue après un court délai
      setTimeout(() => {
        closeEditDialog();
      }, 1500);
    } catch (err: any) {
      console.error("❌ Erreur modification module:", err);
      setError(err.message || "Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Modules</h3>
          <p className="text-sm text-gray-600">
            Organisez votre cours en modules et leçons.
          </p>
        </div>
        <Button
          type="button"
          onClick={addModule}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un module</span>
        </Button>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="space-y-2">
            <h4 className="text-md font-medium">Aucun module créé</h4>
            <p>Commencez par ajouter votre premier module.</p>
            <Button type="button" onClick={addModule} className="mt-4">
              Créer le premier module
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module, index) => (
            <Card key={module.id || module.tempId || `module-${index}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Module {index + 1}: {module.title || "Sans titre"}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {module.id && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(module)}
                        className="text-blue-600 hover:text-blue-700"
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
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre du module *
                  </label>
                  <Input
                    value={module.title}
                    onChange={(e) =>
                      updateModule(index, { title: e.target.value })
                    }
                    placeholder="Entrez le titre du module"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description du module
                  </label>
                  <Textarea
                    value={module.description || ""}
                    onChange={(e) =>
                      updateModule(index, { description: e.target.value })
                    }
                    placeholder="Décrivez le contenu de ce module..."
                    rows={2}
                  />
                </div>

                <div className="border-t pt-4">
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
      <Dialog open={editingModule?.isOpen || false} onOpenChange={(open) => {
        if (!open) closeEditDialog();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Modifier le module</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {success && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Module modifié avec succès !
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="edit-module-title" className="block text-sm font-medium text-gray-700">
                Titre du module *
              </label>
              <Input
                id="edit-module-title"
                value={editingModule?.title || ""}
                onChange={(e) => handleEditFieldChange("title", e.target.value)}
                placeholder="Entrez le titre du module"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-module-description" className="block text-sm font-medium text-gray-700">
                Description du module
              </label>
              <Textarea
                id="edit-module-description"
                value={editingModule?.description || ""}
                onChange={(e) => handleEditFieldChange("description", e.target.value)}
                placeholder="Décrivez le contenu de ce module..."
                rows={4}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeEditDialog}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleEditSubmit}
              disabled={isSubmitting || success}
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
