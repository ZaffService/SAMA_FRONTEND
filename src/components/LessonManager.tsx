"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Lesson } from "@/domain/entities/module";
import { LessonVideoSourcePicker } from "@/components/lesson-video-source-picker";
import type { LessonVideoSourceMode } from "@/lib/youtube";

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
    // Recalculer les orderIndex
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

    // Recalculer les orderIndex
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
      updateLesson(index, { videoSource: "file", videoUrl: undefined });
    } else {
      updateLesson(index, { videoSource: "youtube", videoFile: undefined });
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
    updateLesson(index, { videoFile: undefined, videoUrl: undefined });
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
                    <LessonVideoSourcePicker
                      variant="light"
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
