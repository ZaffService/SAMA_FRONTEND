"use client";

import { useState, useRef, useEffect } from "react";
import { VideoPlayer } from "./video-player";

interface LazyVideoPlayerProps {
  videoUrl: string;
  title?: string;
  poster?: string;
  className?: string;
  threshold?: number; // Pourcentage de visibilité requis (0-1)
  rootMargin?: string; // Marge autour du viewport
}

export function LazyVideoPlayer({
  videoUrl,
  title,
  poster,
  className = "",
  threshold = 0.1,
  rootMargin = "50px",
}: LazyVideoPlayerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasBeenVisible(true);
            // Une fois chargé, on peut arrêter d'observer
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {hasBeenVisible ? (
        // Vidéo chargée et visible
        <VideoPlayer
          videoUrl={videoUrl}
          title={title}
          poster={poster}
          className={className}
        />
      ) : (
        // Placeholder avant chargement
        <div className="relative bg-black aspect-video rounded-lg overflow-hidden flex items-center justify-center">
          {/* Poster image si disponible */}
          {poster && (
            <img
              src={poster}
              alt={title || "Vidéo en cours de chargement"}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Overlay de chargement */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium">Chargement de la vidéo...</p>
              <p className="text-xs text-white/70 mt-1">
                La vidéo se chargera automatiquement
              </p>
            </div>
          </div>

          {/* Indicateur de lazy loading */}
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
            Lazy Load
          </div>
        </div>
      )}
    </div>
  );
}

// Hook personnalisé pour gérer le lazy loading des vidéos
export function useLazyVideoLoader(videoId: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            setIsInView(true);
            // Précharger la vidéo
            if (videoRef.current) {
              videoRef.current.preload = "metadata";
              setIsLoaded(true);
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, [isLoaded]);

  return {
    videoRef,
    isLoaded,
    isInView,
    shouldLoad: isInView && !isLoaded,
  };
}
