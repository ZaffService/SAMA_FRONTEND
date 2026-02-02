import { useState, useEffect } from "react";
import { VideoApi } from "@/infrastructure/api/video-api";

export interface UseSignedVideoUrlOptions {
  autoFetch?: boolean; // Récupérer automatiquement
  onError?: (error: string) => void;
}

export function useSignedVideoUrl(
  lessonId: string | null,
  options: UseSignedVideoUrlOptions = {},
) {
  const { autoFetch = true, onError } = options;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId || !autoFetch) return;

    const fetchUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = await VideoApi.getSignedVideoUrl(lessonId);
        setVideoUrl(url);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUrl();
  }, [lessonId, autoFetch, onError]);

  return { videoUrl, loading, error };
}
