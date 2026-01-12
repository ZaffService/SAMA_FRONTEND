import { useState, useEffect, useCallback } from "react";
import {
  getYoutubeDuration,
  extractYoutubeId,
  type VideoDuration,
} from "@/shared/helpers/video-duration";

interface UseYoutubeDurationResult {
  duration: VideoDuration | null;
  loading: boolean;
  error: string | null;
}

// 📌 Cache mémoire SEULEMENT (pas de sessionStorage!)
const durationCache = new Map<
  string,
  { value: VideoDuration; timestamp: number }
>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Hook pour récupérer la durée d'une vidéo YouTube
 * Avec cache mémoire et fallback automatique
 */
export function useYoutubeDuration(
  videoUrl: string | null,
): UseYoutubeDurationResult {
  const [duration, setDuration] = useState<VideoDuration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDuration = useCallback(async () => {
    if (!videoUrl) {
      setDuration(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Vérifier que c'est une URL YouTube valide
    const youtubeId = extractYoutubeId(videoUrl);
    if (!youtubeId) {
      setError("URL YouTube invalide");
      setLoading(false);
      return;
    }

    // 📌 Vérifier le cache mémoire (pas sessionStorage!)
    const cacheKey = `youtube_duration_${youtubeId}`;
    const cached = durationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setDuration(cached.value);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getYoutubeDuration(videoUrl);

      if (result) {
        setDuration(result);
        // 📌 Mettre en cache mémoire (pas sessionStorage!)
        durationCache.set(cacheKey, {
          value: result,
          timestamp: Date.now(),
        });
      } else {
        // Fallback
        const fallback: VideoDuration = {
          hours: "1",
          minutes: "30",
          seconds: "0",
          formatted: "~1h 30m",
        };
        setDuration(fallback);
        durationCache.set(cacheKey, {
          value: fallback,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement",
      );
      // Toujours afficher une durée, même en cas d'erreur
      const fallback: VideoDuration = {
        hours: "1",
        minutes: "30",
        seconds: "0",
        formatted: "~1h 30m",
      };
      setDuration(fallback);
    } finally {
      setLoading(false);
    }
  }, [videoUrl]);

  useEffect(() => {
    fetchDuration();
  }, [fetchDuration]);

  return { duration, loading, error };
}
