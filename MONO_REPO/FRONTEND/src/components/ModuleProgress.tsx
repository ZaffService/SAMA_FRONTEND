"use client";

import { useModuleProgress } from '@/hooks/useModuleProgress';
import { CheckCircle, Circle, BookOpen } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  completed: boolean;
}

interface Lesson {
  id: string;
  title: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  quiz?: {
    id: string;
    title: string;
  };
}

interface ModuleProgressProps {
  module: Module;
  onModuleComplete?: (moduleId: string) => void;
  onLessonComplete?: (lessonId: string) => void;
}

export function ModuleProgress({
  module,
  onModuleComplete,
  onLessonComplete,
}: ModuleProgressProps) {
  const { progress, isCompleted, stats, onLessonComplete: hookOnLessonComplete } = useModuleProgress({
    module,
    onModuleComplete,
  });

  const handleLessonComplete = (lessonId: string) => {
    onLessonComplete?.(lessonId);
    hookOnLessonComplete(lessonId);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{module.title}</h3>
            <p className="text-sm text-gray-600">
              {stats.completed} sur {stats.total} leçons terminées
            </p>
          </div>
        </div>

        {isCompleted && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Terminé</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progression</span>
          <span className="font-medium text-gray-900">{stats.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isCompleted ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900">Leçons</h4>
        <div className="space-y-1">
          {module.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {lesson.completed ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
              <span
                className={`text-sm flex-1 ${
                  lesson.completed ? 'text-gray-600 line-through' : 'text-gray-900'
                }`}
              >
                {lesson.title}
              </span>
              {!lesson.completed && (
                <button
                  onClick={() => handleLessonComplete(lesson.id)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Marquer terminé
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quiz Button - Affiché automatiquement si module terminé et quiz disponible */}
      {isCompleted && module.quiz && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Quiz disponible</h4>
              <p className="text-sm text-blue-700">
                Testez vos connaissances sur "{module.quiz.title}"
              </p>
            </div>
            <button
              onClick={() => window.location.href = `/quiz/${module.quiz!.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Passer le quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}