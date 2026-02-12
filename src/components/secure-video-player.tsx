"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { VideoApi } from "@/infrastructure/api/video-api";

interface SecureVideoPlayerProps {
  lessonId: string;
  url?: string; // URL directe de la vidéo (si fournie, pas de fetch)
  durationHintSeconds?: number;
  title?: string;
  className?: string;
  onProgressWindow?: (
    fromTime: number,
    toTime: number,
    duration: number,
  ) => void;
  onEnded?: () => void;
}

export function SecureVideoPlayer({
  lessonId,
  url,
  durationHintSeconds,
  title = "Vidéo du cours",
  className = "",
  onProgressWindow,
  onEnded,
}: SecureVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | undefined>(url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const trackingIntervalRef = useRef<number | null>(null);
  const lastTrackedTimeRef = useRef(0);
  const bunnyTimeEventSeenRef = useRef(false);

  const isIframeEmbedUrl = useCallback((input?: string) => {
    if (!input) return false;
    return (
      input.includes("player.mediadelivery.net/embed/") ||
      input.includes("youtube.com/embed/") ||
      input.includes("youtu.be/")
    );
  }, []);

  const parseBunnyMessage = useCallback((rawData: unknown) => {
    let data: any = rawData;
    if (typeof rawData === "string") {
      try {
        data = JSON.parse(rawData);
      } catch {
        data = { event: rawData };
      }
    }

    const currentTimeCandidates = [
      data?.currentTime,
      data?.time,
      data?.seconds,
      data?.position,
      data?.value?.currentTime,
      data?.value?.time,
      data?.data?.currentTime,
      data?.data?.time,
    ];
    const durationCandidates = [
      data?.duration,
      data?.totalDuration,
      data?.value?.duration,
      data?.data?.duration,
    ];

    const currentTime = currentTimeCandidates.find(
      (v) => typeof v === "number" && Number.isFinite(v),
    );
    const duration = durationCandidates.find(
      (v) => typeof v === "number" && Number.isFinite(v),
    );

    const eventName = String(
      data?.event || data?.type || data?.name || data?.action || "",
    ).toLowerCase();

    const ended =
      data?.ended === true ||
      eventName.includes("ended") ||
      (typeof currentTime === "number" &&
        typeof duration === "number" &&
        duration > 0 &&
        currentTime >= duration - 0.5);

    return { data, currentTime, duration, ended, eventName };
  }, []);

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

  useEffect(() => {
    lastTrackedTimeRef.current = 0;
    bunnyTimeEventSeenRef.current = false;
    console.log("[BUNNY TRACKING] reset état tracking", { lessonId, videoUrl });
  }, [lessonId, videoUrl]);

  useEffect(() => {
    if (!videoUrl || !isIframeEmbedUrl(videoUrl)) return;

    console.log("[BUNNY TRACKING] mode iframe actif", { lessonId, videoUrl });

    const handleMessage = (event: MessageEvent) => {
      if (
        !event.origin.includes("mediadelivery.net") &&
        !event.origin.includes("bunnycdn")
      ) {
        return;
      }

      const parsed = parseBunnyMessage(event.data);
      console.log("[BUNNY TRACKING] message reçu", {
        origin: event.origin,
        eventName: parsed.eventName,
        raw: parsed.data,
      });

      const nextTime =
        typeof parsed.currentTime === "number"
          ? parsed.currentTime
          : lastTrackedTimeRef.current;
      const duration =
        typeof parsed.duration === "number" && parsed.duration > 0
          ? parsed.duration
          : typeof durationHintSeconds === "number" && durationHintSeconds > 0
            ? durationHintSeconds
            : 0;

      if (
        onProgressWindow &&
        typeof parsed.currentTime === "number" &&
        parsed.currentTime >= lastTrackedTimeRef.current
      ) {
        bunnyTimeEventSeenRef.current = true;
        const previousTime = lastTrackedTimeRef.current;
        onProgressWindow(previousTime, parsed.currentTime, duration);
        lastTrackedTimeRef.current = parsed.currentTime;
        console.log("[BUNNY TRACKING] progression envoyée", {
          lessonId,
          from: previousTime,
          to: nextTime,
          duration,
        });
      }

      if (parsed.ended) {
        console.log("[BUNNY TRACKING] vidéo terminée", { lessonId });
        onEnded?.();
      }
    };

    const requestPlayerState = () => {
      const target = iframeRef.current?.contentWindow;
      if (!target) return;

      // Bunny peut ignorer certaines commandes selon version player.
      // On envoie plusieurs formats pour maximiser la compatibilité.
      const commands = [
        { event: "getCurrentTime" },
        { event: "getDuration" },
        { type: "getCurrentTime" },
        { type: "getDuration" },
        "getCurrentTime",
        "getDuration",
      ];

      commands.forEach((cmd) => {
        target.postMessage(cmd, "*");
      });
    };

    window.addEventListener("message", handleMessage);
    const pollId = window.setInterval(requestPlayerState, 2000);

    // Fallback si le player iframe ne publie pas currentTime via postMessage.
    const fallbackId = window.setInterval(() => {
      if (!onProgressWindow) return;
      if (bunnyTimeEventSeenRef.current) return;
      if (!durationHintSeconds || durationHintSeconds <= 0) return;
      if (document.visibilityState !== "visible") return;

      const from = lastTrackedTimeRef.current;
      const to = Math.min(durationHintSeconds, from + 2);
      if (to <= from) return;

      onProgressWindow(from, to, durationHintSeconds);
      lastTrackedTimeRef.current = to;
      console.log("[BUNNY TRACKING][fallback] progression envoyée", {
        lessonId,
        from,
        to,
        duration: durationHintSeconds,
      });

      if (to >= durationHintSeconds - 0.5) {
        console.log("[BUNNY TRACKING][fallback] durée atteinte", { lessonId });
        onEnded?.();
      }
    }, 2000);

    requestPlayerState();

    return () => {
      window.removeEventListener("message", handleMessage);
      window.clearInterval(pollId);
      window.clearInterval(fallbackId);
    };
  }, [
    isIframeEmbedUrl,
    lessonId,
    onEnded,
    onProgressWindow,
    parseBunnyMessage,
    durationHintSeconds,
    videoUrl,
  ]);

  // Gestionnaire d'erreur vidéo - retente de récupérer une nouvelle URL signée
  const handleVideoError = useCallback(() => {
    // En cas d'erreur de lecture (possiblement expiration), retenter
    fetchSignedUrl();
  }, [fetchSignedUrl]);

  const flushTracking = useCallback(() => {
    if (!videoRef.current || !onProgressWindow) return;
    const currentTime = Number(videoRef.current.currentTime) || 0;
    const duration = Number(videoRef.current.duration) || 0;
    onProgressWindow(lastTrackedTimeRef.current, currentTime, duration);
    lastTrackedTimeRef.current = currentTime;
  }, [onProgressWindow]);

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      window.clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!onProgressWindow) return;
    stopTracking();
    trackingIntervalRef.current = window.setInterval(() => {
      flushTracking();
    }, 2000);
  }, [flushTracking, onProgressWindow, stopTracking]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

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
        isIframeEmbedUrl(videoUrl) ? (
          <iframe
            ref={iframeRef}
            src={videoUrl}
            title={title}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            className={`h-full w-full border-0 ${className}`}
            onLoad={() => {
              console.log("[BUNNY TRACKING] iframe chargé", { lessonId, videoUrl });
            }}
          />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            className={`h-full w-full ${className}`}
            title={title}
            onLoadedMetadata={() => {
              lastTrackedTimeRef.current = Number(videoRef.current?.currentTime) || 0;
            }}
            onPlay={startTracking}
            onPause={() => {
              stopTracking();
              flushTracking();
            }}
            onSeeking={flushTracking}
            onSeeked={flushTracking}
            onEnded={() => {
              stopTracking();
              flushTracking();
              onEnded?.();
            }}
            onError={() => {
              stopTracking();
              handleVideoError();
            }}
          />
        )
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
