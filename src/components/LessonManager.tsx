"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Upload, Play } from "lucide-react";
import { Lesson } from "@/domain/entities/module";

interface LessonManagerProps {
  lessons: Lesson[];
  onLessonsChange: (lessons: Lesson[]) => void;
  courseId?: string;
}

export function LessonManager({ lessons, onLessonsChange, courseId }: LessonManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addLesson = () => {
    const newLesson: Lesson = {
      tempId: `temp-${Date.now()}`,
      title: '',
      content: '',
      orderIndex: lessons.length + 1,
      duration: 0,
    };
    onLessonsChange([...lessons, newLesson]);
  };

  const updateLesson = (index: number, updates: Partial<Lesson>) => {
    const updatedLessons = lessons.map((lesson, i) =>
      i === index ? { ...lesson, ...updates } : lesson
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

  const handleVideoUpload = (index: number, file: File) => {
    updateLesson(index, { videoFile: file });
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
            <Button
              type="button"
              onClick={addLesson}
              className="mt-4"
            >
              Créer la première leçon
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <Card
              key={lesson.id || lesson.tempId || `lesson-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="cursor-move"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span>Leçon {index + 1}: {lesson.title || 'Sans titre'}</span>
                  </CardTitle>
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
                      onChange={(e) => updateLesson(index, { title: e.target.value })}
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
                      value={lesson.duration || ''}
                      onChange={(e) => updateLesson(index, { duration: parseInt(e.target.value) || 0 })}
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
                    onChange={(e) => updateLesson(index, { content: e.target.value })}
                    placeholder="Écrivez le contenu de votre leçon..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vidéo (optionnel)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {lesson.videoFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Play className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-700">{lesson.videoFile.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateLesson(index, { videoFile: undefined })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Glissez-déposez une vidéo ou cliquez pour sélectionner
                        </p>
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
                        <label htmlFor={`video-upload-${index}`}>
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>Choisir un fichier</span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
