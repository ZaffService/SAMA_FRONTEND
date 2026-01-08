import { useMemo, useCallback } from "react";

interface Lesson {
  id: string;
  title: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface UseModuleProgressProps {
  module: Module;
  onModuleComplete?: (moduleId: string) => void;
}

export function useModuleProgress({
  module,
  onModuleComplete,
}: UseModuleProgressProps) {
  // Calcul de la progression du module
  const progress = useMemo(() => {
    if (!module.lessons || module.lessons.length === 0) return 0;

    const completedLessons = module.lessons.filter(
      (lesson) => lesson.completed,
    ).length;
    return (completedLessons / module.lessons.length) * 100;
  }, [module.lessons]);

  // Vérifier si le module est terminé
  const isCompleted = useMemo(() => {
    return progress >= 100;
  }, [progress]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const total = module.lessons?.length || 0;
    const completed = module.lessons?.filter((l) => l.completed).length || 0;
    const remaining = total - completed;

    return {
      total,
      completed,
      remaining,
      progress: Math.round(progress),
    };
  }, [module.lessons, progress]);

  // Callback quand une leçon est complétée
  const onLessonComplete = useCallback(
    (lessonId: string) => {
      // Vérifier si toutes les leçons sont maintenant complétées
      const updatedLessons = module.lessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, completed: true } : lesson,
      );

      const allCompleted = updatedLessons.every((lesson) => lesson.completed);

      if (allCompleted && !isCompleted) {
        onModuleComplete?.(module.id);
      }
    },
    [module.id, module.lessons, isCompleted, onModuleComplete],
  );

  return {
    progress,
    isCompleted,
    stats,
    onLessonComplete,
  };
}
