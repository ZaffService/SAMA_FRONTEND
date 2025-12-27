import { useEffect, useRef, useCallback } from 'react';

interface UseVideoProgressProps {
  lessonId: string;
  videoUrl: string;
  duration?: number;
  onProgressUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

export function useVideoProgress({
  lessonId,
  videoUrl,
  duration,
  onProgressUpdate,
  onComplete,
}: UseVideoProgressProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedProgressRef = useRef(0);

  // Sauvegarde la progression toutes les 10 secondes
  const saveProgress = useCallback(
    async (currentTime: number, totalDuration: number) => {
      if (!lessonId) return;

      const progress = (currentTime / totalDuration) * 100;

      // Évite les sauvegardes trop fréquentes pour le même pourcentage
      if (Math.abs(progress - lastSavedProgressRef.current) < 5) return;

      try {
        // TODO: Appeler l'API backend pour sauvegarder la progression
        // await LessonApi.updateProgress(lessonId, progress);
        console.log(`Progression sauvegardée: ${progress.toFixed(1)}%`);

        lastSavedProgressRef.current = progress;
        onProgressUpdate?.(progress);
      } catch (error) {
        console.error('Erreur sauvegarde progression:', error);
      }
    },
    [lessonId, onProgressUpdate]
  );

  // Marque la leçon comme terminée
  const completeLesson = useCallback(async () => {
    if (!lessonId) return;

    try {
      // TODO: Appeler l'API backend pour marquer comme terminé
      // await LessonApi.completeLesson(lessonId);
      console.log('Leçon marquée comme terminée');
      onComplete?.();
    } catch (error) {
      console.error('Erreur completion leçon:', error);
    }
  }, [lessonId, onComplete]);

  // Gestionnaire d'événement de progression vidéo
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const currentTime = video.currentTime;
    const totalDuration = duration;

    // Sauvegarde automatique toutes les 10 secondes
    if (!progressIntervalRef.current) {
      progressIntervalRef.current = setInterval(() => {
        saveProgress(currentTime, totalDuration);
      }, 10000); // 10 secondes
    }

    // Marquage automatique comme terminé à 90%
    const progressPercent = (currentTime / totalDuration) * 100;
    if (progressPercent >= 90 && lastSavedProgressRef.current < 90) {
      completeLesson();
    }
  }, [duration, saveProgress, completeLesson]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Marquage manuel comme terminé
  const markAsCompleted = useCallback(() => {
    completeLesson();
  }, [completeLesson]);

  return {
    videoRef,
    handleTimeUpdate,
    markAsCompleted,
    saveProgress: () => {
      const video = videoRef.current;
      if (video && duration) {
        saveProgress(video.currentTime, duration);
      }
    },
  };
}