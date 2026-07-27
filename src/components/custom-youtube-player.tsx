"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TRACKING_INTERVAL_MS = 5000;

type ProgressPayload = {
  lessonId: string;
  fromTime: number;
  toTime: number;
  duration: number;
};

type YtPlayer = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getVolume: () => number;
};

type YtNamespace = {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YtPlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
};

function getYt(): YtNamespace | undefined {
  return (window as unknown as { YT?: YtNamespace }).YT;
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (getYt()?.Player) return Promise.resolve();

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const w = window as unknown as {
        onYouTubeIframeAPIReady?: () => void;
      };
      const previous = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };

      if (!document.getElementById("youtube-iframe-api")) {
        const script = document.createElement("script");
        script.id = "youtube-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.body.appendChild(script);
      }

      const poll = window.setInterval(() => {
        if (getYt()?.Player) {
          window.clearInterval(poll);
          resolve();
        }
      }, 100);
    });
  }

  return youtubeApiPromise;
}

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "00:00";
  const s = Math.floor(totalSeconds);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export interface CustomYouTubePlayerProps {
  lessonId: string;
  videoId: string;
  title?: string;
  /** Cadre géré par le parent (comme Bunny) — ne pas forcer 16:9 ici. */
  orientation?: "portrait" | "landscape";
  className?: string;
  onTrackProgress: (payload: ProgressPayload) => void;
  onEnded?: () => void;
  onMediaSize?: (size: { width: number; height: number }) => void;
}

/**
 * Lecteur YouTube avec contrôles custom.
 * Le ratio (portrait / paysage) est décidé par le parent, comme pour Bunny.
 */
export function CustomYouTubePlayer({
  lessonId,
  videoId,
  title,
  orientation = "landscape",
  className,
  onTrackProgress,
  onEnded,
  onMediaSize,
}: CustomYouTubePlayerProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  /** Conteneur stable : l’API YT remplace l’hôte par un <iframe>. */
  const stageRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const trackingIntervalRef = useRef<number | null>(null);
  const lastTrackedTimeRef = useRef(0);
  const uiTimerRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChrome, setShowChrome] = useState(true);

  const thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const thumbnailFallback = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const flushTrackedWindow = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const current = Number(player.getCurrentTime()) || 0;
    const dur = Number(player.getDuration()) || 0;
    onTrackProgress({
      lessonId,
      fromTime: lastTrackedTimeRef.current,
      toTime: current,
      duration: dur,
    });
    lastTrackedTimeRef.current = current;
  }, [lessonId, onTrackProgress]);

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      window.clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }, []);

  const startTracking = useCallback(() => {
    stopTracking();
    trackingIntervalRef.current = window.setInterval(() => {
      flushTrackedWindow();
      const player = playerRef.current;
      if (player) {
        setCurrentTime(Number(player.getCurrentTime()) || 0);
        setDuration(Number(player.getDuration()) || 0);
      }
    }, TRACKING_INTERVAL_MS);
  }, [flushTrackedWindow, stopTracking]);

  const revealChromeTemporarily = useCallback(() => {
    setShowChrome(true);
    if (uiTimerRef.current) window.clearTimeout(uiTimerRef.current);
    uiTimerRef.current = window.setTimeout(() => {
      if (playerRef.current?.getPlayerState() === getYt()?.PlayerState.PLAYING) {
        setShowChrome(false);
      }
    }, 2800);
  }, []);

  const fitIframe = useCallback(() => {
    const stage = stageRef.current;
    const iframe = stage?.querySelector("iframe");
    if (!iframe) return;
    Object.assign(iframe.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      border: "0",
      pointerEvents: "none",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsReady(false);
    setHasError(false);
    setIsPlaying(false);
    setHasEnded(false);
    setCurrentTime(0);
    setDuration(0);
    lastTrackedTimeRef.current = 0;

    const boot = async () => {
      await loadYouTubeIframeApi();
      const YT = getYt();
      const stage = stageRef.current;
      if (cancelled || !stage || !YT?.Player) return;

      stage.replaceChildren();
      const host = document.createElement("div");
      host.style.width = "100%";
      host.style.height = "100%";
      stage.appendChild(host);

      playerRef.current = new YT.Player(host, {
        videoId,
        width: "100%",
        height: "100%",
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          /** Limite les suggestions (même chaîne uniquement ; on masque le reste via overlays). */
          rel: 0,
          cc_load_policy: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: { target: YtPlayer }) => {
            if (cancelled) return;
            const player = event.target;
            player.setVolume(80);
            setIsReady(true);
            setHasEnded(false);
            setDuration(Number(player.getDuration()) || 0);
            lastTrackedTimeRef.current = Number(player.getCurrentTime()) || 0;
            fitIframe();
            // Ne pas forcer 16:9 : le parent cadre selon portrait/paysage (comme Bunny).
            onMediaSize?.(
              orientation === "portrait"
                ? { width: 9, height: 16 }
                : { width: 16, height: 9 },
            );
          },
          onError: () => {
            if (!cancelled) {
              setHasError(true);
              setIsReady(false);
              stopTracking();
            }
          },
          onStateChange: (event: { data: number; target: YtPlayer }) => {
            const api = getYt();
            if (!api) return;
            const state = event.data;

            if (state === api.PlayerState.PLAYING) {
              setIsPlaying(true);
              setHasEnded(false);
              setDuration(Number(event.target.getDuration()) || 0);
              startTracking();
              revealChromeTemporarily();
              return;
            }

            if (state === api.PlayerState.ENDED) {
              const dur = Number(event.target.getDuration()) || 0;
              const endTime = dur > 0 ? dur : Number(event.target.getCurrentTime()) || 0;
              // Flush tracking jusqu’à la vraie fin (getCurrentTime() peut renvoyer 0 sur ENDED)
              onTrackProgress({
                lessonId,
                fromTime: lastTrackedTimeRef.current,
                toTime: endTime,
                duration: dur,
              });
              lastTrackedTimeRef.current = endTime;
              stopTracking();
              setDuration(dur);
              setCurrentTime(endTime);
              setIsPlaying(false);
              setHasEnded(true);
              setShowChrome(true);
              onEnded?.();
              return;
            }

            stopTracking();
            flushTrackedWindow();
            setCurrentTime(Number(event.target.getCurrentTime()) || 0);
            setIsPlaying(false);
            setShowChrome(true);
          },
        },
      });
    };

    void boot();

    return () => {
      cancelled = true;
      stopTracking();
      if (uiTimerRef.current) window.clearTimeout(uiTimerRef.current);
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, [
    videoId,
    lessonId,
    orientation,
    onEnded,
    onMediaSize,
    onTrackProgress,
    fitIframe,
    flushTrackedWindow,
    revealChromeTemporarily,
    startTracking,
    stopTracking,
  ]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      setCurrentTime(Number(player.getCurrentTime()) || 0);
      setDuration(Number(player.getDuration()) || 0);
    }, 250);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  const play = () => playerRef.current?.playVideo();
  const pause = () => playerRef.current?.pauseVideo();
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      pause();
      return;
    }
    // Rejouer uniquement sur action utilisateur (après ENDED)
    if (hasEnded) {
      playerRef.current.seekTo(0, true);
      setHasEnded(false);
      setCurrentTime(0);
      lastTrackedTimeRef.current = 0;
    }
    play();
  };

  const onSeek = (value: number) => {
    playerRef.current?.seekTo(value, true);
    setCurrentTime(value);
    lastTrackedTimeRef.current = value;
    if (hasEnded) setHasEnded(false);
  };

  const onVolumeChange = (value: number) => {
    setVolume(value);
    playerRef.current?.setVolume(value);
    if (value === 0) {
      playerRef.current?.mute();
      setIsMuted(true);
    } else {
      playerRef.current?.unMute();
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted || volume === 0) {
      playerRef.current.unMute();
      if (volume === 0) {
        playerRef.current.setVolume(80);
        setVolume(80);
      }
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const toggleFullscreen = async () => {
    const el = shellRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  const blockChromeClick = (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  /** Dès que la lecture est arrêtée, on masque l’UI YouTube (suggestions, fin, etc.). */
  const showPoster = !isPlaying;
  const sliderMax = Math.max(duration, 0.1);
  const sliderValue = Math.min(Math.max(currentTime, 0), sliderMax);

  return (
    <div
      ref={shellRef}
      className={cn(
        "relative h-full w-full isolate overflow-hidden bg-black select-none",
        className,
      )}
      onPointerMove={revealChromeTemporarily}
      onClick={revealChromeTemporarily}
    >
      <div
        ref={stageRef}
        className="absolute inset-0 z-0 overflow-hidden bg-black [&_iframe]:pointer-events-none [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
        aria-hidden={!isReady}
        title={title || "Vidéo"}
      />

      {/*
        Filets anti-suggestions pendant la lecture (panneau « Plus de vidéos » à droite,
        titre / liens en haut). pointer-events pour bloquer toute navigation hors site.
      */}
      {isPlaying && (
        <>
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 z-20 h-16"
            onPointerDown={blockChromeClick}
          />
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 z-20 w-[min(42%,14rem)]"
            onPointerDown={blockChromeClick}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 z-20 h-14"
            onPointerDown={blockChromeClick}
          />
        </>
      )}

      {/* Couverture totale à l’arrêt / fin → cache suggestions & écran de fin YouTube */}
      {showPoster && (
        <button
          type="button"
          className="absolute inset-0 z-30 flex items-center justify-center bg-black"
          onClick={togglePlay}
          disabled={!isReady || hasError}
          aria-label={hasEnded ? "Rejouer la vidéo" : "Lire la vidéo"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt=""
            onError={(e) => {
              const el = e.currentTarget;
              if (el.src !== thumbnailFallback) {
                el.src = thumbnailFallback;
              }
            }}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          />
          <span className="absolute inset-0 bg-black/50" />
          <span className="relative z-10 flex flex-col items-center gap-3">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg shadow-blue-900/40 transition hover:bg-[#1D4ED8] sm:h-20 sm:w-20">
              <Play className="ml-1 h-8 w-8 fill-white sm:h-10 sm:w-10" />
            </span>
            {hasEnded && (
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                Rejouer
              </span>
            )}
          </span>
        </button>
      )}

      {hasError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black px-4 text-center text-white">
          <p className="text-sm text-white/80">
            Vidéo indisponible pour le moment.
          </p>
        </div>
      )}

      {(showChrome || !isPlaying) && isReady && !hasError && (
        <div
          className={cn(
            "pointer-events-auto absolute inset-x-0 bottom-0 z-50 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10 transition-opacity",
            isPlaying && !showChrome ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="relative mb-2 h-1.5 w-full">
            <div className="absolute inset-0 rounded-full bg-white/25" />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#2563EB]"
              style={{ width: `${progress}%` }}
            />
            <div
              className="pointer-events-none absolute top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB] shadow"
              style={{ left: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={sliderMax}
              step={0.1}
              value={sliderValue}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
              aria-label="Progression"
            />
          </div>

          <div className="flex items-center gap-2 text-white">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-white" />
              ) : (
                <Play className="ml-0.5 h-4 w-4 fill-white" />
              )}
            </button>

            <span className="min-w-[5.5rem] text-xs tabular-nums text-white/90">
              {formatTime(sliderValue)} / {formatTime(duration)}
            </span>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#60A5FA] hover:bg-white/10"
                aria-label={isMuted ? "Activer le son" : "Couper le son"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="hidden w-20 accent-[#2563EB] sm:block"
                aria-label="Volume"
              />
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-white/10"
                aria-label={isFullscreen ? "Quitter plein écran" : "Plein écran"}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <span className="sr-only">{Math.round(progress)}% visionné</span>
        </div>
      )}
    </div>
  );
}
