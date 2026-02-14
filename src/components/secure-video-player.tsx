"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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

const TRACKING_TICK_SECONDS = 2;
const COMPLETION_THRESHOLD = 0.95;
const PLAYERJS_SCRIPT_ID = "bunny-playerjs-sdk";
const PLAYERJS_SCRIPT_SRC =
  "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";

type PlayerJsEventPayload =
  | {
      seconds?: number | string;
      duration?: number | string;
      percent?: number | string;
    }
  | number
  | string
  | null
  | undefined;

type PlayerJsCallback = (value?: PlayerJsEventPayload) => void;

type PlayerJsInstance = {
  on: (eventName: string, callback: PlayerJsCallback) => boolean;
  off: (eventName: string, callback: PlayerJsCallback) => boolean;
  getCurrentTime: (callback: (value: number | string) => void) => void;
  getDuration: (callback: (value: number | string) => void) => void;
};

type PlayerJsGlobal = {
  Player: new (element: HTMLIFrameElement | string) => PlayerJsInstance;
};

declare global {
  interface Window {
    playerjs?: PlayerJsGlobal;
  }
}

let playerJsLoaderPromise: Promise<void> | null = null;

const loadPlayerJs = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.playerjs?.Player) return Promise.resolve();
  if (playerJsLoaderPromise) return playerJsLoaderPromise;

  playerJsLoaderPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      PLAYERJS_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    const handleLoaded = () => {
      if (window.playerjs?.Player) {
        resolve();
        return;
      }
      reject(new Error("playerjs chargé mais indisponible sur window"));
    };

    const handleError = () => {
      reject(new Error("Impossible de charger playerjs"));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoaded, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = PLAYERJS_SCRIPT_ID;
    script.src = PLAYERJS_SCRIPT_SRC;
    script.async = true;
    script.onload = handleLoaded;
    script.onerror = handleError;
    document.body.appendChild(script);
  }).catch((error) => {
    playerJsLoaderPromise = null;
    throw error;
  });

  return playerJsLoaderPromise as Promise<void>;
};

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
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const trackingIntervalRef = useRef<number | null>(null);
  const lastTrackedTimeRef = useRef(0);
  const lastKnownDurationRef = useRef(0);
  const completionNotifiedRef = useRef(false);
  const onProgressWindowRef = useRef(onProgressWindow);

  useEffect(() => {
    onProgressWindowRef.current = onProgressWindow;
  }, [onProgressWindow]);

  const isIframeEmbedUrl = useCallback((input?: string) => {
    if (!input) return false;
    return (
      input.includes("mediadelivery.net/embed/") ||
      input.includes("mediadelivery.net/play/") ||
      input.includes("youtube.com/embed/") ||
      input.includes("youtu.be/")
    );
  }, []);

  const toFiniteNumber = useCallback((value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
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
      data?.detail?.currentTime,
      data?.detail?.time,
      data?.detail?.seconds,
      data?.value?.currentTime,
      data?.value?.time,
      data?.value?.seconds,
      data?.value?.position,
      data?.data?.currentTime,
      data?.data?.time,
      data?.data?.seconds,
      data?.data?.position,
      data?.payload?.currentTime,
      data?.payload?.time,
      data?.payload?.seconds,
      data?.payload?.position,
    ];
    const durationCandidates = [
      data?.duration,
      data?.totalDuration,
      data?.detail?.duration,
      data?.value?.duration,
      data?.data?.duration,
      data?.payload?.duration,
    ];

    const currentTime = currentTimeCandidates
      .map(toFiniteNumber)
      .find((v) => typeof v === "number");
    const duration = durationCandidates
      .map(toFiniteNumber)
      .find((v) => typeof v === "number");

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
  }, [toFiniteNumber]);

  const resolvedIframeUrl = useMemo(() => {
    if (!videoUrl) return videoUrl;
    if (!videoUrl.includes("mediadelivery.net/")) return videoUrl;

    try {
      const parsed = new URL(videoUrl);
      if (!parsed.searchParams.has("playerjs")) {
        parsed.searchParams.set("playerjs", "1");
      }
      return parsed.toString();
    } catch {
      return videoUrl;
    }
  }, [videoUrl]);

  const maybeNotifyCompleted = useCallback(
    (currentTime: number, duration: number, source: string) => {
      if (completionNotifiedRef.current) return;
      if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
        return;
      }

      const ratio = currentTime / duration;
      if (ratio >= COMPLETION_THRESHOLD) {
        completionNotifiedRef.current = true;
        console.log("[TRACKING][player] seuil 95% atteint", {
          lessonId,
          source,
          currentTime,
          duration,
          ratio: Number((ratio * 100).toFixed(2)),
        });
        onEnded?.();
      }
    },
    [lessonId, onEnded],
  );

  const maybeNotifyEnded = useCallback(
    (source: string) => {
      if (completionNotifiedRef.current) return;
      completionNotifiedRef.current = true;
      console.log("[TRACKING][player] fin de lecture", { lessonId, source });
      onEnded?.();
    },
    [lessonId, onEnded],
  );

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
    lastKnownDurationRef.current =
      typeof durationHintSeconds === "number" && durationHintSeconds > 0
        ? durationHintSeconds
        : 0;
    completionNotifiedRef.current = false;
    console.log("[BUNNY TRACKING] reset état tracking", { lessonId, videoUrl });
  }, [durationHintSeconds, lessonId, videoUrl]);

  useEffect(() => {
    if (!videoUrl) {
      setIsPlayerLoading(false);
      return;
    }
    setIsPlayerLoading(true);
  }, [videoUrl]);

  useEffect(() => {
    if (!resolvedIframeUrl || !isIframeEmbedUrl(resolvedIframeUrl)) return;

    console.log("[BUNNY TRACKING] mode iframe actif", { lessonId, videoUrl: resolvedIframeUrl });

    let isMounted = true;
    let playerInstance: PlayerJsInstance | null = null;

    const resolveDuration = (candidate?: number): number => {
      if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) {
        lastKnownDurationRef.current = candidate;
        return candidate;
      }
      if (lastKnownDurationRef.current > 0) {
        return lastKnownDurationRef.current;
      }
      if (typeof durationHintSeconds === "number" && durationHintSeconds > 0) {
        lastKnownDurationRef.current = durationHintSeconds;
        return durationHintSeconds;
      }
      return 0;
    };

    const sendProgressWindow = (
      nextTimeCandidate: unknown,
      durationCandidate: unknown,
      source: string,
    ) => {
      const nextTime = toFiniteNumber(nextTimeCandidate);
      if (typeof nextTime !== "number" || nextTime < 0) return;

      const duration = resolveDuration(toFiniteNumber(durationCandidate));
      const previousTime = lastTrackedTimeRef.current;
      const progressHandler = onProgressWindowRef.current;

      if (nextTime + 0.5 < previousTime) {
        lastTrackedTimeRef.current = nextTime;
        console.log("[BUNNY TRACKING] saut arrière détecté", {
          lessonId,
          source,
          from: previousTime,
          to: nextTime,
        });
        maybeNotifyCompleted(nextTime, duration, source);
        return;
      }

      if (progressHandler && duration > 0) {
        progressHandler(previousTime, nextTime, duration);
        console.log("[BUNNY TRACKING] progression envoyée", {
          lessonId,
          source,
          from: previousTime,
          to: nextTime,
          duration,
        });
      }

      lastTrackedTimeRef.current = nextTime;
      maybeNotifyCompleted(nextTime, duration, source);
    };

    const probePlayerDuration = () => {
      if (!playerInstance) return;
      playerInstance.getDuration((value) => {
        if (!isMounted) return;
        const duration = toFiniteNumber(value);
        if (typeof duration === "number" && duration > 0) {
          lastKnownDurationRef.current = duration;
          console.log("[BUNNY TRACKING][playerjs] durée réelle détectée", {
            lessonId,
            duration,
          });
          maybeNotifyCompleted(
            lastTrackedTimeRef.current,
            duration,
            "playerjs_duration_probe",
          );
        }
      });
    };

    const initPlayerJs = async () => {
      try {
        await loadPlayerJs();
        if (!isMounted) return;
        if (!iframeRef.current || !window.playerjs?.Player) return;

        playerInstance = new window.playerjs.Player(iframeRef.current);
        console.log("[BUNNY TRACKING][playerjs] SDK initialisé", { lessonId });

        const onReady: PlayerJsCallback = () => {
          console.log("[BUNNY TRACKING][playerjs] ready", { lessonId });
          probePlayerDuration();
        };

        const onTimeUpdate: PlayerJsCallback = (payload) => {
          const data =
            payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
          const duration = toFiniteNumber(data.duration);
          const percent = toFiniteNumber(data.percent);
          const currentTimeFromData = toFiniteNumber(
            data.seconds ?? data.currentTime ?? data.time ?? data.position,
          );
          const resolvedDuration = resolveDuration(duration);
          const currentTime =
            typeof currentTimeFromData === "number"
              ? currentTimeFromData
              : typeof percent === "number" && resolvedDuration > 0
                ? Math.max(0, Math.min(1, percent)) * resolvedDuration
                : undefined;
          sendProgressWindow(currentTime, resolvedDuration, "playerjs_timeupdate");
        };

        const onSeeked: PlayerJsCallback = (payload) => {
          const data =
            payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
          const duration = toFiniteNumber(data.duration);
          const percent = toFiniteNumber(data.percent);
          const secondsFromData = toFiniteNumber(
            data.seconds ?? data.currentTime ?? data.time ?? data.position,
          );
          const resolvedDuration = resolveDuration(duration);
          const seconds =
            typeof secondsFromData === "number"
              ? secondsFromData
              : typeof percent === "number" && resolvedDuration > 0
                ? Math.max(0, Math.min(1, percent)) * resolvedDuration
                : undefined;

          sendProgressWindow(seconds, resolvedDuration, "playerjs_seeked");
          probePlayerDuration();
        };

        const onEnded: PlayerJsCallback = () => {
          maybeNotifyEnded("playerjs_ended");
        };

        playerInstance.on("ready", onReady);
        playerInstance.on("timeupdate", onTimeUpdate);
        playerInstance.on("seeked", onSeeked);
        playerInstance.on("ended", onEnded);

        const safeOff = (eventName: string, callback: PlayerJsCallback) => {
          if (!playerInstance) return;
          try {
            playerInstance.off(eventName, callback);
          } catch (error) {
            console.warn("[BUNNY TRACKING][playerjs] off() ignoré", {
              lessonId,
              eventName,
              error,
            });
          }
        };

        return () => {
          if (!playerInstance) return;
          if (!iframeRef.current?.contentWindow) {
            playerInstance = null;
            return;
          }
          safeOff("ready", onReady);
          safeOff("timeupdate", onTimeUpdate);
          safeOff("seeked", onSeeked);
          safeOff("ended", onEnded);
          playerInstance = null;
        };
      } catch (error) {
        console.warn("[BUNNY TRACKING][playerjs] indisponible, fallback postMessage", {
          lessonId,
          error,
        });
        return undefined;
      }
    };

    let cleanupPlayerJs: (() => void) | undefined;
    void initPlayerJs().then((cleanup) => {
      if (!isMounted) {
        cleanup?.();
        return;
      }
      cleanupPlayerJs = cleanup;
    });

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

      sendProgressWindow(parsed.currentTime, parsed.duration, "iframe_message");

      if (parsed.ended) {
        console.log("[BUNNY TRACKING] vidéo terminée", { lessonId });
        maybeNotifyEnded("iframe_message_ended");
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

      if (playerInstance) {
        playerInstance.getCurrentTime((value) => {
          if (!isMounted) return;
          const currentTime = toFiniteNumber(value);
          if (typeof currentTime !== "number") return;

          const previous = lastTrackedTimeRef.current;
          if (Math.abs(currentTime - previous) < 0.1) return;
          sendProgressWindow(
            currentTime,
            lastKnownDurationRef.current,
            "playerjs_poll_current_time",
          );
        });

        probePlayerDuration();
      }
    };

    window.addEventListener("message", handleMessage);
    const pollId = window.setInterval(requestPlayerState, 2000);

    requestPlayerState();

    return () => {
      isMounted = false;
      try {
        cleanupPlayerJs?.();
      } catch (error) {
        console.warn("[BUNNY TRACKING] cleanup playerjs ignoré", {
          lessonId,
          error,
        });
      }
      window.removeEventListener("message", handleMessage);
      window.clearInterval(pollId);
    };
  }, [
    isIframeEmbedUrl,
    lessonId,
    onEnded,
    parseBunnyMessage,
    maybeNotifyCompleted,
    maybeNotifyEnded,
    durationHintSeconds,
    resolvedIframeUrl,
    toFiniteNumber,
  ]);

  // Gestionnaire d'erreur vidéo - retente de récupérer une nouvelle URL signée
  const handleVideoError = useCallback(() => {
    // En cas d'erreur de lecture (possiblement expiration), retenter
    fetchSignedUrl();
  }, [fetchSignedUrl]);

  const flushTracking = useCallback(() => {
    const progressHandler = onProgressWindowRef.current;
    if (!videoRef.current || !progressHandler) return;
    const currentTime = Number(videoRef.current.currentTime) || 0;
    const duration = Number(videoRef.current.duration) || 0;
    if (duration > 0) {
      lastKnownDurationRef.current = duration;
    }
    progressHandler(lastTrackedTimeRef.current, currentTime, duration);
    lastTrackedTimeRef.current = currentTime;
    maybeNotifyCompleted(currentTime, duration, "html5_flush");
  }, [maybeNotifyCompleted]);

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      window.clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!onProgressWindowRef.current) return;
    stopTracking();
    trackingIntervalRef.current = window.setInterval(() => {
      flushTracking();
    }, TRACKING_TICK_SECONDS * 1000);
  }, [flushTracking, stopTracking]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  const normalizedClassName = className.trim();
  const containerClassName = normalizedClassName
    ? `relative w-full overflow-hidden bg-black ${normalizedClassName}`
    : "relative w-full aspect-video overflow-hidden bg-black";

  if (loading) {
    return (
      <div className={`${containerClassName} flex items-center justify-center`}>
        <div className="text-center text-white">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm">Chargement de la vidéo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${containerClassName} flex items-center justify-center`}>
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
            className="px-4 py-2 bg-[#002c75] text-white text-sm rounded hover:bg-[#001f54] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {isPlayerLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center text-white">
            <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <p className="text-sm">Chargement de la vidéo...</p>
          </div>
        </div>
      )}
      {videoUrl ? (
        isIframeEmbedUrl(videoUrl) ? (
          <iframe
            ref={iframeRef}
            src={resolvedIframeUrl}
            title={title}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            className="h-full w-full border-0"
            onLoad={() => {
              setIsPlayerLoading(false);
              console.log("[BUNNY TRACKING] iframe chargé", {
                lessonId,
                videoUrl: resolvedIframeUrl,
              });
            }}
            onError={() => {
              setIsPlayerLoading(false);
            }}
          />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full"
            title={title}
            onLoadStart={() => {
              setIsPlayerLoading(true);
            }}
            onLoadedMetadata={() => {
              lastTrackedTimeRef.current = Number(videoRef.current?.currentTime) || 0;
              const duration = Number(videoRef.current?.duration) || 0;
              if (duration > 0) {
                lastKnownDurationRef.current = duration;
              }
            }}
            onLoadedData={() => {
              setIsPlayerLoading(false);
            }}
            onCanPlay={() => {
              setIsPlayerLoading(false);
            }}
            onPlay={startTracking}
            onPause={() => {
              stopTracking();
              flushTracking();
            }}
            onSeeking={flushTracking}
            onSeeked={flushTracking}
            onTimeUpdate={() => {
              const currentTime = Number(videoRef.current?.currentTime) || 0;
              const duration = Number(videoRef.current?.duration) || 0;
              maybeNotifyCompleted(currentTime, duration, "html5_timeupdate");
            }}
            onEnded={() => {
              stopTracking();
              flushTracking();
              maybeNotifyEnded("html5_ended");
            }}
            onError={() => {
              stopTracking();
              setIsPlayerLoading(false);
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
