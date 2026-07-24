"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { VideoApi } from "@/infrastructure/api/video-api";
import {
  isDirectPlayableVideoUrl,
  shouldFetchSignedVideoUrl,
} from "@/lib/video-url-utils";
import logger from "@/shared/helpers/logger";

interface SecureVideoPlayerProps {
  lessonId: string;
  url?: string; // URL directe de la vidéo (si fournie, pas de fetch)
  durationHintSeconds?: number;
  title?: string;
  className?: string;
  orientation?: "portrait" | "landscape" | "auto";
  aspectRatio?: number;
  fitMode?: "contain" | "cover";
  /** Called with width/height when HTML5 metadata is available (Bunny MP4, etc.) */
  onMediaSize?: (size: { width: number; height: number }) => void;
  onProgressWindow?: (
    fromTime: number,
    toTime: number,
    duration: number,
  ) => void;
  onEnded?: () => void;
}

const TRACKING_TICK_SECONDS = 5;
const MIN_PROGRESS_DELTA_SEC = 2.5;
const FALLBACK_POLL_MS = 10_000;
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
  orientation = "landscape",
  aspectRatio,
  fitMode = "contain",
  onMediaSize,
  onProgressWindow,
  onEnded,
}: SecureVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | undefined>(url);
  const [loading, setLoading] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [detectedRatio, setDetectedRatio] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const trackingIntervalRef = useRef<number | null>(null);
  const lastTrackedTimeRef = useRef(0);
  const lastKnownDurationRef = useRef(0);
  const completionNotifiedRef = useRef(false);
  const completionThresholdNotifiedRef = useRef(false);
  const playbackStartedRef = useRef(false);
  const onProgressWindowRef = useRef(onProgressWindow);

  useEffect(() => {
    onProgressWindowRef.current = onProgressWindow;
  }, [onProgressWindow]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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
      parsed.searchParams.set("cb", String(reloadToken));
      return parsed.toString();
    } catch {
      return videoUrl;
    }
  }, [reloadToken, videoUrl]);

  const maybeNotifyCompleted = useCallback(
    (currentTime: number, duration: number, source: string) => {
      if (completionThresholdNotifiedRef.current) return;
      if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
        return;
      }

      const ratio = currentTime / duration;
      if (ratio >= COMPLETION_THRESHOLD) {
        completionThresholdNotifiedRef.current = true;
        logger.log("[TRACKING][player] seuil 95% atteint", {
          lessonId,
          source,
          currentTime,
          duration,
          ratio: Number((ratio * 100).toFixed(2)),
        });
      }
    },
    [lessonId],
  );

  const maybeNotifyEnded = useCallback(
    (source: string) => {
      if (completionNotifiedRef.current) return;
      completionNotifiedRef.current = true;
      logger.log("[TRACKING][player] fin de lecture", { lessonId, source });
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
      logger.error("Erreur lors de la récupération de l'URL signée:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    if (url && isDirectPlayableVideoUrl(url)) {
      setVideoUrl(url);
      setLoading(false);
      return;
    }

    if (shouldFetchSignedVideoUrl(url) && lessonId) {
      fetchSignedUrl();
      return;
    }

    if (url) {
      setVideoUrl(url);
      setLoading(false);
      return;
    }

    setVideoUrl(undefined);
    setLoading(false);
    setError("Identifiant de leçon manquant pour charger la vidéo.");
  }, [url, lessonId, fetchSignedUrl]);

  useEffect(() => {
    lastTrackedTimeRef.current = 0;
    lastKnownDurationRef.current =
      typeof durationHintSeconds === "number" && durationHintSeconds > 0
        ? durationHintSeconds
        : 0;
    completionNotifiedRef.current = false;
    completionThresholdNotifiedRef.current = false;
    playbackStartedRef.current = false;
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

    let isMounted = true;
    let playerInstance: PlayerJsInstance | null = null;
    let pollId: number | null = null;
    let playerJsReady = false;
    let durationLogged = false;
    let lastProgressEmitAt = 0;

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
      options?: { force?: boolean },
    ) => {
      const nextTime = toFiniteNumber(nextTimeCandidate);
      if (typeof nextTime !== "number" || nextTime < 0) return;

      const duration = resolveDuration(toFiniteNumber(durationCandidate));
      const previousTime = lastTrackedTimeRef.current;
      const progressHandler = onProgressWindowRef.current;
      const force = options?.force === true;
      const delta = Math.abs(nextTime - previousTime);
      const nearEnd =
        duration > 0 && nextTime / duration >= COMPLETION_THRESHOLD;

      if (nextTime > 0.5) {
        playbackStartedRef.current = true;
      }

      // Seek arrière : on recentre sans flood
      if (nextTime + 0.5 < previousTime) {
        lastTrackedTimeRef.current = nextTime;
        maybeNotifyCompleted(nextTime, duration, source);
        return;
      }

      const now = Date.now();
      const shouldEmit =
        force ||
        nearEnd ||
        (delta >= MIN_PROGRESS_DELTA_SEC &&
          now - lastProgressEmitAt >= MIN_PROGRESS_DELTA_SEC * 1000);

      if (shouldEmit && progressHandler && duration > 0) {
        progressHandler(previousTime, nextTime, duration);
        lastProgressEmitAt = now;
      }

      lastTrackedTimeRef.current = nextTime;
      maybeNotifyCompleted(nextTime, duration, source);
    };

    const probePlayerDuration = () => {
      if (!playerInstance) return;
      // Déjà connue : ne pas re-polluer getDuration / logs
      if (lastKnownDurationRef.current > 0) return;

      playerInstance.getDuration((value) => {
        if (!isMounted) return;
        const duration = toFiniteNumber(value);
        if (typeof duration === "number" && duration > 0) {
          lastKnownDurationRef.current = duration;
          if (!durationLogged) {
            durationLogged = true;
            logger.log("[BUNNY TRACKING][playerjs] durée réelle détectée", {
              lessonId,
              duration,
            });
          }
          maybeNotifyCompleted(
            lastTrackedTimeRef.current,
            duration,
            "playerjs_duration_probe",
          );
        }
      });
    };

    const stopPolling = () => {
      if (pollId !== null) {
        window.clearInterval(pollId);
        pollId = null;
      }
    };

    const initPlayerJs = async () => {
      try {
        await loadPlayerJs();
        if (!isMounted) return;
        if (!iframeRef.current || !window.playerjs?.Player) return;

        playerInstance = new window.playerjs.Player(iframeRef.current);

        const onReady: PlayerJsCallback = () => {
          playerJsReady = true;
          // playerjs fournit timeupdate → plus besoin du polling postMessage
          stopPolling();
          probePlayerDuration();
        };

        const onTimeUpdate: PlayerJsCallback = (payload) => {
          const data =
            payload && typeof payload === "object"
              ? (payload as Record<string, unknown>)
              : {};
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
            payload && typeof payload === "object"
              ? (payload as Record<string, unknown>)
              : {};
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

          sendProgressWindow(seconds, resolvedDuration, "playerjs_seeked", {
            force: true,
          });
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
          } catch {
            /* ignore */
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
        logger.warn("[BUNNY TRACKING][playerjs] indisponible, fallback postMessage", {
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

      // Si playerjs est actif, on ignore le flood postMessage
      if (playerJsReady) return;

      const parsed = parseBunnyMessage(event.data);
      sendProgressWindow(parsed.currentTime, parsed.duration, "iframe_message");

      if (parsed.ended) {
        maybeNotifyEnded("iframe_message_ended");
      }
    };

    const requestPlayerState = () => {
      if (!isMounted || playerJsReady) return;

      if (playerInstance) {
        playerInstance.getCurrentTime((value) => {
          if (!isMounted || playerJsReady) return;
          const currentTime = toFiniteNumber(value);
          if (typeof currentTime !== "number") return;
          sendProgressWindow(
            currentTime,
            lastKnownDurationRef.current,
            "playerjs_poll_current_time",
          );
        });
        probePlayerDuration();
        return;
      }

      const target = iframeRef.current?.contentWindow;
      if (!target) return;

      // Un seul format par commande (évite 6 postMessage × 2s)
      target.postMessage({ event: "getCurrentTime" }, "*");
      if (lastKnownDurationRef.current <= 0) {
        target.postMessage({ event: "getDuration" }, "*");
      }
    };

    window.addEventListener("message", handleMessage);
    // Polling de secours uniquement (ralentit fortement le spam)
    pollId = window.setInterval(requestPlayerState, FALLBACK_POLL_MS);
    // Premier tick différé pour laisser playerjs démarrer
    const bootId = window.setTimeout(requestPlayerState, 1500);

    return () => {
      isMounted = false;
      window.clearTimeout(bootId);
      stopPolling();
      try {
        cleanupPlayerJs?.();
      } catch {
        /* ignore */
      }
      window.removeEventListener("message", handleMessage);
    };
  }, [
    isIframeEmbedUrl,
    lessonId,
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
    VideoApi.invalidateCache(lessonId);
    fetchSignedUrl();
  }, [fetchSignedUrl, lessonId]);

  useEffect(() => {
    if (!resolvedIframeUrl || !resolvedIframeUrl.includes("mediadelivery.net/")) {
      return;
    }

    let attempt = 0;
    const intervalId = window.setInterval(() => {
      if (playbackStartedRef.current) {
        window.clearInterval(intervalId);
        return;
      }

      attempt += 1;
      if (attempt > 20) {
        window.clearInterval(intervalId);
        return;
      }

      setError(null);
      setIsPlayerLoading(true);
      setReloadToken((prev) => prev + 1);
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [resolvedIframeUrl]);

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
  const ratio =
    aspectRatio ??
    detectedRatio ??
    (orientation === "portrait" ? 9 / 16 : 16 / 9);
  const isPortrait = ratio < 1;
  const frameStyle = isPortrait
    ? isMobile
      ? { width: "100%", aspectRatio: `${ratio}` }
      : { width: "min(100%, 380px)", aspectRatio: `${ratio}` }
    : { width: "100%", aspectRatio: `${ratio}` };
  const mediaClassName =
    fitMode === "cover"
      ? "absolute inset-0 h-full w-full border-0 object-cover object-center"
      : "absolute inset-0 h-full w-full border-0 object-contain";

  const shellClassName = normalizedClassName
    ? `flex w-full justify-center ${normalizedClassName}`
    : "flex w-full justify-center";

  const renderShell = (content: ReactNode) => (
    <div className={shellClassName}>
      <div
        className="relative overflow-hidden rounded-2xl bg-black shadow-lg"
        style={frameStyle}
      >
        {content}
      </div>
    </div>
  );

  if (loading) {
    return renderShell(
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-sm">Chargement de la vidéo...</p>
        </div>
      </div>,
    );
  }

  if (error) {
    return renderShell(
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="px-4 text-center text-white">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500">
            <svg
              className="h-6 w-6"
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
          <p className="mb-2 text-sm">{error}</p>
          <button
            onClick={fetchSignedUrl}
            className="rounded bg-[#002c75] px-4 py-2 text-sm text-white transition-colors hover:bg-[#001f54]"
          >
            Réessayer
          </button>
        </div>
      </div>,
    );
  }

  return renderShell(
    <>
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
            key={`${lessonId}-iframe-${reloadToken}`}
            ref={iframeRef}
            src={resolvedIframeUrl}
            title={title}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            className={mediaClassName}
            onLoad={() => {
              setIsPlayerLoading(false);
              logger.log("[BUNNY TRACKING] iframe chargé", {
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
            key={`${lessonId}-video-${reloadToken}`}
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            className={mediaClassName}
            title={title}
            onLoadStart={() => {
              setIsPlayerLoading(true);
            }}
            onLoadedMetadata={() => {
              lastTrackedTimeRef.current =
                Number(videoRef.current?.currentTime) || 0;
              const duration = Number(videoRef.current?.duration) || 0;
              if (duration > 0) {
                lastKnownDurationRef.current = duration;
              }
              const width = Number(videoRef.current?.videoWidth) || 0;
              const height = Number(videoRef.current?.videoHeight) || 0;
              if (width > 0 && height > 0) {
                setDetectedRatio(width / height);
                onMediaSize?.({ width, height });
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
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Vidéo indisponible
        </div>
      )}
    </>,
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
