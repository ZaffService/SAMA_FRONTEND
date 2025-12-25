import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { getYoutubeVideoId } from "@/lib/utils";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYoutubePlayerOptions {
  videoId?: string;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onError?: (error: any) => void;
}

interface YoutubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  loadVideoById: (videoId: string) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getPlayerState: () => number;
  destroy: () => void;
}

export function useYoutubePlayer(options: UseYoutubePlayerOptions = {}): {
  playerRef: React.RefObject<HTMLDivElement | null>;
  isReady: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  loadVideoById: (videoId: string) => void;
  requestFullscreen: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
} {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<YoutubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  const { videoId, onReady, onStateChange, onError } = options;

  // Load YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      console.log("YouTube API already loaded");
      setIsApiLoaded(true);
      return;
    }

    console.log("Loading YouTube API...");
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;

    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube API ready");
      setIsApiLoaded(true);
    };

    script.onerror = () => {
      console.error("Failed to load YouTube API");
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize player when API is loaded and videoId is available
  useEffect(() => {
    if (!isApiLoaded || !playerRef.current || !videoId) return;

    // Destroy existing player
    if (playerInstanceRef.current) {
      playerInstanceRef.current.destroy();
    }

    try {
      console.log("Creating YouTube player with videoId:", videoId);
      // Create new player with videoId
      playerInstanceRef.current = new window.YT.Player(playerRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          showinfo: 0,
          disablekb: 1,
          enablejsapi: 1,
          cc_load_policy: 0,
          hl: "en",
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            console.log("YouTube player ready");
            setIsReady(true);
            onReady?.();
          },
          onStateChange: (event: any) => {
            console.log("YouTube player state changed:", event.data);
            onStateChange?.(event.data);
          },
          onError: (error: any) => {
            console.error("YouTube player error:", error);
            onError?.(error);
          },
        },
      });
      console.log("YouTube player created successfully");
    } catch (error) {
      console.error("Error creating YouTube player:", error);
    }

    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
    };
  }, [isApiLoaded, videoId, onReady, onStateChange, onError]);

  const play = useCallback(() => {
    if (playerInstanceRef.current && isReady) {
      try {
        playerInstanceRef.current.playVideo();
      } catch (error) {
        console.error("Error playing video:", error);
      }
    } else {
      console.warn("Player not ready or not available");
    }
  }, [isReady]);

  const pause = useCallback(() => {
    playerInstanceRef.current?.pauseVideo();
  }, []);

  const stop = useCallback(() => {
    playerInstanceRef.current?.stopVideo();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerInstanceRef.current?.seekTo(seconds);
  }, []);

  const setVolume = useCallback((volume: number) => {
    playerInstanceRef.current?.setVolume(volume);
  }, []);

  const getCurrentTime = useCallback(() => {
    return playerInstanceRef.current?.getCurrentTime() || 0;
  }, []);

  const getDuration = useCallback(() => {
    return playerInstanceRef.current?.getDuration() || 0;
  }, []);

  const mute = useCallback(() => {
    playerInstanceRef.current?.mute();
  }, []);

  const unMute = useCallback(() => {
    playerInstanceRef.current?.unMute();
  }, []);

  const isMuted = useCallback(() => {
    try {
      return playerInstanceRef.current?.isMuted?.() || false;
    } catch (error) {
      console.warn("isMuted method not available:", error);
      return false;
    }
  }, []);

  const loadVideoById = useCallback((videoId: string) => {
    playerInstanceRef.current?.loadVideoById(videoId);
  }, []);

  const requestFullscreen = useCallback(() => {
    if (playerRef.current) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      }
    }
  }, []);

  const getPlayerState = useCallback(() => {
    return playerInstanceRef.current?.getPlayerState() || -1;
  }, []);

  return {
    playerRef,
    isReady,
    play,
    pause,
    stop,
    seekTo,
    setVolume,
    mute,
    unMute,
    isMuted,
    loadVideoById,
    requestFullscreen,
    getCurrentTime,
    getDuration,
    getPlayerState,
  };
}
