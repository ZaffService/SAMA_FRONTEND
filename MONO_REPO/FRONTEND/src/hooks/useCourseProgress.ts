import { useMemo } from 'react';

interface ModuleProgress {
  id: string;
  progress: number;
  completed: boolean;
}

interface UseCourseProgressProps {
  modules: ModuleProgress[];
}

export function useCourseProgress({ modules }: UseCourseProgressProps) {
  // Calcul de la progression globale du cours
  const overallProgress = useMemo(() => {
    if (!modules || modules.length === 0) return 0;

    const totalProgress = modules.reduce((sum, module) => sum + module.progress, 0);
    return totalProgress / modules.length;
  }, [modules]);

  // Statistiques globales
  const stats = useMemo(() => {
    const totalModules = modules.length;
    const completedModules = modules.filter(m => m.completed).length;
    const inProgressModules = modules.filter(m => m.progress > 0 && !m.completed).length;
    const notStartedModules = totalModules - completedModules - inProgressModules;

    return {
      totalModules,
      completedModules,
      inProgressModules,
      notStartedModules,
      overallProgress: Math.round(overallProgress),
    };
  }, [modules, overallProgress]);

  // Vérifier si le cours est terminé
  const isCompleted = useMemo(() => {
    return stats.completedModules === stats.totalModules && stats.totalModules > 0;
  }, [stats]);

  return {
    overallProgress,
    isCompleted,
    stats,
  };
}