"use client";

import { useEffect, useState, useCallback } from "react";
import { VideoApi } from "@/infrastructure/api/video-api";

interface SecureVideoPlayerProps {
  lessonId: string;
  url?: string; // URL directe de la vidéo (si fournie, pas de fetch)
  title?: string;
  className?: string;
}

export function SecureVideoPlayer({
  lessonId,
  url,
  title = "Vidéo du cours",
  className = "",
}: SecureVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | undefined>(url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer l'URL signée depuis l'API (utilisée quand aucune URL directe n'est fournie)
  const fetchSignedUrl = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const signedUrl = await VideoApi.getSignedVideoUrl(lessonId);
      setVideoUrl(signedUrl);
    } catch (err) {
      console.error("Erreur lors de la récupération de l'URL signée:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    if (url) {
      // Utiliser directement l'URL fournie sans fetch
      setVideoUrl(url);
      setLoading(false);
    } else {
      // Récupérer l'URL signée via API si aucune URL n'est fournie
      fetchSignedUrl();
    }
    // VideoApi gère le cache et l'expiration automatiquement
  }, [url, fetchSignedUrl]);

  // Gestionnaire d'erreur vidéo - retente de récupérer une nouvelle URL signée
  const handleVideoError = useCallback(() => {
    // En cas d'erreur de lecture (possiblement expiration), retenter
    fetchSignedUrl();
  }, [fetchSignedUrl]);

  if (loading) {
    return (
      <div
        className={`relative bg-black aspect-video ${className} flex items-center justify-center`}
      >
        <div className="text-center text-white">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm">Chargement de la vidéo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`relative bg-black aspect-video ${className} flex items-center justify-center`}
      >
        <div className="text-center text-white px-4">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-sm mb-2">{error}</p>
          <button
            onClick={fetchSignedUrl}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-black">
      {videoUrl ? (
        <iframe
          src={videoUrl}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          title={title}
          onError={handleVideoError as any}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-white">
          Vidéo indisponible
        </div>
      )}
    </div>
  );
}

// "use client";

// interface SecureVideoPlayerProps {
//   lessonId: string;
//   url?: string;
//   title?: string;
//   className?: string;
// }

// export function SecureVideoPlayer({
//   lessonId,
//   url,
//   title = "Vidéo du cours",
//   className = "",
// }: SecureVideoPlayerProps) {
//   if (!url) {
//     return (
//       <div
//         className={`relative bg-black aspect-video ${className} flex items-center justify-center`}
//       >
//         <p className="text-white text-sm">Aucune vidéo disponible</p>
//       </div>
//     );
//   }

//   return (
//     <div className={`relative bg-black aspect-video ${className}`}>
//       <video
//         className="w-full h-full"
//         controls
//         preload="metadata"
//         title={title}
//       >
//         <source src={url} type="video/mp4" />
//         Votre navigateur ne supporte pas la lecture de vidéos.
//       </video>
//     </div>
//   );
// }
