"use client";

/**
 * URL vidéo signée (TTL court)
 *
 * Pourquoi un staleTime spécial ?
 * - L'URL expire côté Bunny / backend → cache long = 403
 * - On calcule staleTime = expiresAt - now - 60s de marge
 * - refetchOnWindowFocus aide si l'utilisateur revient après expiration
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VideoApi, type SignedVideoUrl } from "@/infrastructure/api/video-api";
import { videoKeys } from "@/shared/helpers/query-keys";

const SAFETY_MARGIN_MS = 60_000;
const FALLBACK_STALE_MS = 4 * 60_000; // 4 min si expiresAt absent


export function useSignedVideoUrl(lessonId?: string, enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: videoKeys.signed(lessonId || "none"),
    queryFn: async (): Promise<SignedVideoUrl> => {
      const data = await VideoApi.requestSignedVideoUrl(lessonId!);
      return data;
    },
    enabled: Boolean(enabled && lessonId),
    staleTime: FALLBACK_STALE_MS,
    // Refetch automatique un peu avant expiration (évite les 403)
    refetchInterval: (q) => {
      const expiresAt = q.state.data?.expiresAt;
      if (!expiresAt) return false;
      const ms =
        new Date(expiresAt).getTime() - Date.now() - SAFETY_MARGIN_MS;
      if (!Number.isFinite(ms)) return false;
      return ms > 5_000 ? ms : 5_000;
    },
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      const message = error instanceof Error ? error.message : "";
      // Pas de retry agressif sur 403 métier
      if (message.includes("UNAUTHORIZED")) return false;
      return failureCount < 2;
    },
  });

  const invalidate = () => {
    if (!lessonId) return;
    VideoApi.invalidateCache(lessonId);
    void queryClient.invalidateQueries({
      queryKey: videoKeys.signed(lessonId),
    });
  };

  return {
    url: query.data?.url,
    expiresAt: query.data?.expiresAt,
    loading: query.isPending,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Erreur URL vidéo"
      : null,
    refetch: query.refetch,
    invalidate,
  };
}
