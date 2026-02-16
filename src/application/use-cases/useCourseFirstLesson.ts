import { useState, useEffect } from "react";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import logger from "@/shared/helpers/logger";

/**
 * Hook pour charger les leçons d'un cours avec les vidéos et thumbnails
 * Retourne la première leçon (pour affichage sur la page d'accueil)
 */
export function useCourseFirstLesson(courseId: string | number) {
  const [firstLesson, setFirstLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    const fetchFirstLesson = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Récupérer les topics du cours
        const topicsResponse = await CoursesApi.getCourseContents(
          courseId.toString(),
        );
        const topics = Array.isArray(topicsResponse) ? topicsResponse : [];

        if (topics.length === 0) {
          setFirstLesson(null);
          setLoading(false);
          return;
        }

        // 2. Récupérer les leçons du premier topic
        const firstTopic = topics[0];
        const lessonsResponse = await CoursesApi.getLessons(firstTopic.id);
        const lessons = Array.isArray(lessonsResponse) ? lessonsResponse : [];

        if (lessons.length > 0) {
          // 3. Mapper la première leçon
          const lesson = lessons[0];
          const mappedLesson = {
            id: lesson.id,
            title: lesson.title,
            thumbnail: lesson.thumbnail,
            video: lesson.video,
            videoUrl: lesson.video?.source_youtube,
            duration: lesson.video?.playtime || "00:00",
          };

          logger.log("✅ First lesson loaded:", mappedLesson);
          setFirstLesson(mappedLesson);
        } else {
          setFirstLesson(null);
        }
      } catch (err) {
        logger.error("❌ Error fetching first lesson:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement de la leçon",
        );
        setFirstLesson(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFirstLesson();
  }, [courseId]);

  return { firstLesson, loading, error };
}
