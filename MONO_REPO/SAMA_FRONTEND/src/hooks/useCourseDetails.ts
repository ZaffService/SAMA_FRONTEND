import { useState, useEffect, useCallback } from "react";
import {
  CourseDetailsApi,
  CourseDetails,
  CourseProgress,
} from "@/infrastructure/api/course-details-api";

interface UseCourseDetailsProps {
  courseId: string;
}

interface LessonWithProgress {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  orderIndex: number;
  duration?: number;
  completed: boolean;
  progress: number;
}

interface ModuleWithProgress {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: LessonWithProgress[];
  quiz?: any;
  progress: number;
  completed: boolean;
}

export function useCourseDetails({ courseId }: UseCourseDetailsProps) {
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(
    null,
  );
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(
    null,
  );
  const [modulesWithProgress, setModulesWithProgress] = useState<
    ModuleWithProgress[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données du cours
  const loadCourseData = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);

      // Charger les détails du cours et la progression en parallèle
      const [details, progress] = await Promise.all([
        CourseDetailsApi.getCourseDetails(courseId),
        CourseDetailsApi.getCourseProgress(courseId).catch(() => null), // Progression peut ne pas exister
      ]);

      setCourseDetails(details);
      setCourseProgress(progress);

      // Combiner les données avec la progression
      const modulesWithProgressData: ModuleWithProgress[] = details.modules.map(
        (module: any) => {
          const lessonsWithProgress: LessonWithProgress[] = module.lessons.map(
            (lesson: any) => ({
              ...lesson,
              completed:
                progress?.completedLessons?.includes(lesson.id) || false,
              progress: 0, // TODO: Implémenter progression individuelle des leçons
            }),
          );

          const completedLessons = lessonsWithProgress.filter(
            (l: LessonWithProgress) => l.completed,
          ).length;
          const moduleProgress =
            lessonsWithProgress.length > 0
              ? (completedLessons / lessonsWithProgress.length) * 100
              : 0;

          return {
            ...module,
            lessons: lessonsWithProgress,
            progress: moduleProgress,
            completed: moduleProgress >= 100,
          };
        },
      );

      setModulesWithProgress(modulesWithProgressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Marquer une leçon comme terminée
  const completeLesson = useCallback(async (lessonId: string) => {
    try {
      await CourseDetailsApi.completeLesson(lessonId);

      // Mettre à jour l'état local
      setModulesWithProgress((prev) =>
        prev.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) =>
            lesson.id === lessonId
              ? { ...lesson, completed: true, progress: 100 }
              : lesson,
          ),
        })),
      );

      // Recalculer la progression des modules
      setModulesWithProgress((prev) =>
        prev.map((module) => {
          const completedLessons = module.lessons.filter(
            (l) => l.completed,
          ).length;
          const progress =
            module.lessons.length > 0
              ? (completedLessons / module.lessons.length) * 100
              : 0;

          return {
            ...module,
            progress,
            completed: progress >= 100,
          };
        }),
      );
    } catch (err) {
      console.error("Erreur completion leçon:", err);
      throw err;
    }
  }, []);

  // Mettre à jour la progression d'une leçon
  const updateLessonProgress = useCallback(
    async (lessonId: string, progress: number) => {
      try {
        await CourseDetailsApi.updateLessonProgress(lessonId, progress);

        // Mettre à jour l'état local
        setModulesWithProgress((prev) =>
          prev.map((module) => ({
            ...module,
            lessons: module.lessons.map((lesson) =>
              lesson.id === lessonId ? { ...lesson, progress } : lesson,
            ),
          })),
        );
      } catch (err) {
        console.error("Erreur mise à jour progression:", err);
      }
    },
    [],
  );

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  return {
    courseDetails,
    courseProgress,
    modules: modulesWithProgress,
    loading,
    error,
    completeLesson,
    updateLessonProgress,
    refresh: loadCourseData,
  };
}
