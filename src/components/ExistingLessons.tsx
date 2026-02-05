"use client";

import { Lesson } from "@/domain/entities/module";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit3, Trash2, Play, Clock } from "lucide-react";

interface ExistingLessonsProps {
  lessons: Lesson[];
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
}

export function ExistingLessons({ lessons, onEdit, onDelete }: ExistingLessonsProps) {
  if (lessons.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Leçons existantes ({lessons.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id || lesson.tempId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {lesson.title || "Sans titre"}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {lesson.duration || 0} min
                    </span>
                    {lesson.videoUrl && (
                      <span className="flex items-center text-green-600">
                        <Play className="h-3 w-3 mr-1" />
                        Vidéo
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(lesson)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(lesson.id!)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
