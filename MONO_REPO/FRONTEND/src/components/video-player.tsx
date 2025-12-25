"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  FileText,
} from "lucide-react";
import { Watermark, useStudentData } from "@/components/watermark";
import { useAntiCapture } from "@/shared/helpers/anti-capture";

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({
  videoUrl,
  title = "Vidéo du cours",
  poster,
  className = "",
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const studentData = useStudentData();
  useAntiCapture();

  // Extraire l'ID YouTube de l'URL
  const getYouTubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(videoUrl);

  // Masquer les contrôles après 3 secondes d'inactivité
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    resetControlsTimeout();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
    resetControlsTimeout();
  };

  // Si c'est une vidéo YouTube, utiliser l'iframe intégré
  if (videoId) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`;

    return (
      <div
        ref={containerRef}
        className={`relative bg-black aspect-video group cursor-pointer ${className}`}
        onMouseMove={resetControlsTimeout}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* Lecteur YouTube intégré */}
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Filigrane dynamique */}
        {studentData && (
          <Watermark
            studentId={studentData.id}
            studentEmail={studentData.email}
            className="z-10"
          />
        )}

        {/* Overlay de protection anti-capture */}
        <div
          className="absolute inset-0 pointer-events-none z-5"
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Contrôles personnalisés (optionnels) */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Message de protection */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
          Vidéo protégée - Captures interdites
        </div>
      </div>
    );
  }

  // Pour les autres types de vidéos (fallback)
  return (
    <div
      ref={containerRef}
      className={`relative bg-black aspect-video group ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        muted={isMuted}
        onContextMenu={(e) => e.preventDefault()}
        controls={false}
        disablePictureInPicture
        controlsList="nodownload"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Filigrane dynamique */}
      {studentData && (
        <Watermark
          studentId={studentData.id}
          studentEmail={studentData.email}
          className="z-10"
        />
      )}

      {/* Contrôles personnalisés */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Overlay de protection */}
      <div
        className="absolute inset-0"
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Message de protection */}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
        Vidéo protégée - Captures interdites
      </div>
    </div>
  );
}
