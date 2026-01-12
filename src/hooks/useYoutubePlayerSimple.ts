"use client";

import { useEffect, useRef, useState } from "react";

interface UseYoutubePlayerSimpleProps {
  videoId?: string;
}

export function useYoutubePlayerSimple({
  videoId,
}: UseYoutubePlayerSimpleProps) {
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!videoId || typeof window === "undefined") {
      setYoutubeUrl(null);
      setIsReady(false);
      return;
    }

    const params = new URLSearchParams({
      autoplay: "1",
      controls: "1",
      modestbranding: "1",
      rel: "0",
      playsinline: "1",
      enablejsapi: "0",
      start: "0",
      origin: window.location.origin,
    });

    setYoutubeUrl(
      `https://www.youtube.com/embed/${videoId}?${params.toString()}&t=${Date.now()}`,
    );

    setIsReady(true);
  }, [videoId]);

  return {
    youtubeUrl,
    isReady,
  };
}
