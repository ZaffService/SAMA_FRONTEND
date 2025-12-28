"use client"
import { Play, CheckCircle2, Circle, Award, ChevronDown } from 'lucide-react';
import { TEXTS } from '@/lib/constants';

interface Lesson {
  id: string;
  title: string;
  duration: number;
  videoUrl?: string;
}

interface ModuleLessonListProps {
  module: {
    id: string;
    title: string;
    lessons: Lesson[];
  };
  moduleIndex: number;
  isExpanded: boolean;
  isEnrolled: boolean;
  selectedLessonId: string;
  onToggleModule: () => void;
  onSelectLesson: (lessonId: string) => void;
  isLessonCompleted: (lessonId: string) => boolean;
  onToggleLessonCompletion: (lessonId: string, completed: boolean) => Promise<void>;
  onStartQuiz: () => void;
  formatDuration: (minutes: number) => string;
  scrollToTop?: () => void;
}

export function ModuleLessonList({
  module,
  moduleIndex,
  isExpanded,
  isEnrolled,
  selectedLessonId,
  onToggleModule,
  onSelectLesson,
  isLessonCompleted,
  onToggleLessonCompletion,
  onStartQuiz,
  formatDuration,
  scrollToTop,
}: ModuleLessonListProps) {
  const moduleLessons = module.lessons.filter(l => l.videoUrl);
  const totalModuleDuration = moduleLessons.reduce((sum, l) => sum + l.duration, 0);
  const allLessonsCompleted = moduleLessons.every(lesson => isLessonCompleted(lesson.id));
  const completedCount = moduleLessons.filter(lesson => isLessonCompleted(lesson.id)).length;

  return (
    <div className="mb-2">
      {/* Module Header */}
      <button
        onClick={onToggleModule}
        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all text-left group"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-sm font-bold text-white">
              {moduleIndex + 1}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">
              {module.title}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>{moduleLessons.length} leçons</span>
              <span>•</span>
              <span>{formatDuration(totalModuleDuration)}</span>
              {isEnrolled && (
                <>
                  <span>•</span>
                  <span className="text-indigo-600 font-medium">
                    {completedCount}/{moduleLessons.length}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Lessons List */}
      {isExpanded && (
        <div className="mt-2 space-y-1.5 ml-2">
          {moduleLessons.map((lesson) => {
            const completed = isLessonCompleted(lesson.id);
            const isSelected = selectedLessonId === lesson.id;

            return (
              <div
                key={lesson.id}
                className={`group relative rounded-lg transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 shadow-sm"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Checkbox - Bien visible à gauche */}
                  {isEnrolled && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!completed) {
                          await onToggleLessonCompletion(lesson.id, true);
                        }
                      }}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        completed
                          ? "bg-green-500 border-green-500 shadow-md"
                          : "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50"
                      }`}
                      title={completed ? "Leçon terminée" : "Marquer comme terminée"}
                    >
                      {completed && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  )}

                  {/* Lesson Content - Cliquable */}
                  <button
                    onClick={() => {
                      onSelectLesson(lesson.id);
                      scrollToTop?.();
                    }}
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                  >
                    {/* Play Icon */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? "bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg scale-105"
                          : completed
                          ? "bg-green-100"
                          : "bg-gradient-to-br from-indigo-100 to-purple-100"
                      }`}
                    >
                      <Play
                        className={`w-4 h-4 ${
                          isSelected
                            ? "text-white"
                            : completed
                            ? "text-green-600"
                            : "text-indigo-600"
                        } fill-current ml-0.5`}
                      />
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium text-sm leading-snug truncate ${
                          isSelected
                            ? "text-indigo-900"
                            : completed
                            ? "text-green-700"
                            : "text-gray-700"
                        }`}
                      >
                        {lesson.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{formatDuration(lesson.duration)}</span>
                        {completed && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                            ✓ Terminée
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-r-full" />
                )}
              </div>
            );
          })}

          {/* Module Completed Badge + Quiz Button */}
          {isEnrolled && allLessonsCompleted && (
            <div className="mt-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-green-900 text-sm">
                    Module terminé !
                  </h4>
                  <p className="text-xs text-green-700 mt-0.5">
                    Félicitations, passez au quiz
                  </p>
                </div>
              </div>

              <button
                onClick={() => { console.log('Bouton Quiz cliqué pour module:', module.id); onStartQuiz(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Award className="w-5 h-5" />
                <span>{TEXTS.QUIZ_BUTTON}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}