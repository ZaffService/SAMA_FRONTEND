"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2, Plus, GripVertical, Trash2, Upload, AlertCircle, CheckCircle, FileVideo, Loader2 as Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { Lesson } from "@/domain/entities/module";

interface LessonEditorProps {
  courseId: string;
  onBack: () => void;
  selectedModuleId?: string | null;
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

export function LessonEditor({ courseId, onBack, selectedModuleId: propSelectedModuleId }: LessonEditorProps) {
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(propSelectedModuleId || null);
  const [existingLessons, setExistingLessons] = useState<Lesson[]>([]);
  const [newLessons, setNewLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // États pour l'upload de vidéo
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (propSelectedModuleId) {
      setSelectedModuleId(propSelectedModuleId);
      loadModuleData(propSelectedModuleId);
    } else {
      loadModules();
    }
  }, [courseId, propSelectedModuleId]);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      const details = await CoursesApi.getCourseDetails(courseId);
      setModules(details.modules || []);
      if (details.modules && details.modules.length > 0) {
        const firstModuleId = details.modules[0].id;
        setSelectedModuleId(firstModuleId);
        loadModuleData(firstModuleId);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des modules:", error);
      toast.error("Erreur lors du chargement des modules");
    } finally {
      setIsLoading(false);
    }
  };

  const loadModuleData = async (moduleId: string) => {
    setIsLoading(true);
    try {
      const details = await CoursesApi.getCourseDetails(courseId);
      const module = details.modules?.find((m: any) => m.id === moduleId);
      if (module) {
        setExistingLessons(module.lessons || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des leçons:", error);
      toast.error("Erreur lors du chargement des leçons");
    } finally {
      setIsLoading(false);
    }
  };

  const addLesson = useCallback(() => {
    const newLesson: Lesson = {
      tempId: `temp-${Date.now()}`,
      title: "",
      content: "",
      orderIndex: existingLessons.length + newLessons.length + 1,
      duration: 0,
    };
    setNewLessons([...newLessons, newLesson]);
  }, [existingLessons.length, newLessons.length]);

  const updateNewLesson = (index: number, updates: Partial<Lesson>) => {
    const updatedLessons = newLessons.map((lesson, i) =>
      i === index ? { ...lesson, ...updates } : lesson,
    );
    setNewLessons(updatedLessons);
  };

  const removeNewLesson = (index: number) => {
    const updatedLessons = newLessons.filter((_, i) => i !== index);
    // Recalculer les orderIndex
    const reorderedLessons = updatedLessons.map((lesson, i) => ({
      ...lesson,
      orderIndex: existingLessons.length + i + 1,
    }));
    setNewLessons(reorderedLessons);
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
    const lessonId = newLessons[index].tempId || `lesson-${index}`;

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
          updateNewLesson(index, { videoFile: file });
          return { ...prev, [lessonId]: 100 };
        }
        return { ...prev, [lessonId]: currentProgress + 10 };
      });
    }, 200);

    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress((prev) => ({ ...prev, [lessonId]: 100 }));
      updateNewLesson(index, { videoFile: file });
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
  }, [newLessons]);

  const handleDragOverVideo = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setIsDragOver((prev) => ({ ...prev, [`lesson-${index}`]: true }));
  }, []);

  const handleDragLeaveVideo = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setIsDragOver((prev) => ({ ...prev, [`lesson-${index}`]: false }));
  }, []);

  const removeVideo = (index: number) => {
    const lessonId = newLessons[index].tempId || `lesson-${index}`;
    updateNewLesson(index, { videoFile: undefined });
    setUploadProgress((prev) => ({ ...prev, [lessonId]: 0 }));
    setUploadErrors((prev) => ({ ...prev, [lessonId]: "" }));
  };

  const handleSaveNewLessons = async () => {
    if (!selectedModuleId || newLessons.length === 0) {
      toast.error("Aucune nouvelle leçon à ajouter");
      return;
    }

    // Vérifier que tous les champs obligatoires sont remplis
    for (let i = 0; i < newLessons.length; i++) {
      const lesson = newLessons[i];
      if (!lesson.title.trim()) {
        toast.error(`La leçon ${i + 1} n'a pas de titre`);
        return;
      }
      if (!lesson.content.trim()) {
        toast.error(`La leçon "${lesson.title}" n'a pas de contenu`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const allLessons = [...existingLessons, ...newLessons];
      await CoursesApi.updateModuleLessons(selectedModuleId, allLessons);
      toast.success(`${newLessons.length} leçon(s) ajoutée(s) avec succès`);
      
      // Recharger les données du module
      await loadModuleData(selectedModuleId);
      setNewLessons([]);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des nouvelles leçons:", error);
      toast.error("Erreur lors de la sauvegarde des leçons");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  if (isLoading && modules.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </Button>
        </div>

        <h2 className="text-3xl font-bold mb-2">
          Ajouter des leçons
        </h2>
        <p className="text-gray-600 mb-8">
          {selectedModule ? `Module: ${selectedModule.title}` : 'Sélectionnez un module'}
        </p>

        {/* Leçons existantes */}
        {existingLessons.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">
              Leçons existantes ({existingLessons.length})
            </h3>
            <div className="space-y-3">
              {existingLessons.map((lesson, index) => (
                <Card key={lesson.id || `existing-${index}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-gray-600 font-medium">{index + 1}</span>
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium text-gray-900">{lesson.title || "Sans titre"}</p>
                        <p className="text-sm text-gray-500">
                          {lesson.content ? `${lesson.content.substring(0, 50)}...` : 'Sans contenu'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Nouvelles leçons - Formulaire vide */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Nouvelles leçons</h3>
              <p className="text-sm text-gray-600">
                Ajoutez de nouvelles leçons au module
              </p>
            </div>
            <Button
              onClick={addLesson}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Ajouter une leçon
            </Button>
          </div>

          {newLessons.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="py-12 text-center">
                <Plus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune nouvelle leçon
                </h3>
                <p className="text-gray-600 mb-4">
                  Cliquez sur "Ajouter une leçon" pour créer une nouvelle leçon
                </p>
                <Button onClick={addLesson} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une leçon
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {newLessons.map((lesson, index) => (
                <Card key={lesson.tempId || `new-${index}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span>
                          Nouvelle leçon {existingLessons.length + index + 1}
                        </span>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeNewLesson(index)}
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
                            updateNewLesson(index, { title: e.target.value })
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
                            updateNewLesson(index, {
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
                          updateNewLesson(index, { content: e.target.value })
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
                                  <Loader2Icon className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
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
              ))}
            </div>
          )}

          {/* Bouton de sauvegarde */}
          {newLessons.length > 0 && (
            <div className="flex justify-end pt-6 border-t">
              <Button
                onClick={handleSaveNewLessons}
                disabled={isSaving}
                className="px-8 bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde en cours...
                  </>
                ) : (
                  <>
                    Sauvegarder {newLessons.length} leçon(s)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
