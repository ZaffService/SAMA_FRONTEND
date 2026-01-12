"use client";

import { useVideoProgress } from "@/hooks/useVideoProgress";
import { Button } from "@/components/ui/button";
import { Play, Pause, CheckCircle } from "lucide-react";
import { useState, useRef } from "react";

interface VideoPlayerProps {
  lessonId: string;
  videoUrl: string;
  title: string;
  duration?: number;
  isCompleted?: boolean;
  onComplete?: () => void;
  onProgressUpdate?: (progress: number) => void;
}

export function VideoPlayer({
  lessonId,
  videoUrl,
  title,
  duration,
  isCompleted = false,
  onComplete,
  onProgressUpdate,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);

  const { videoRef, handleTimeUpdate, markAsCompleted } = useVideoProgress({
    lessonId,
    videoUrl,
    duration,
    onProgressUpdate: (prog) => {
      setProgress(prog);
      onProgressUpdate?.(prog);
    },
    onComplete,
  });

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdateInternal = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      handleTimeUpdate();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleManualComplete = async () => {
    try {
      await markAsCompleted();
    } catch (error) {
      console.error("Erreur lors du marquage manuel:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Video Container */}
      <div className="relative bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto max-h-96"
          onTimeUpdate={handleTimeUpdateInternal}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            markAsCompleted();
          }}
        />

        {/* Play/Pause Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            onClick={togglePlay}
            size="lg"
            className="bg-black/50 hover:bg-black/70 text-white border-0"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8" />
            )}
          </Button>
        </div>

        {/* Completion Badge */}
        {isCompleted && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Terminé
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>{Math.round(progress)}% terminé</span>
            {!isCompleted && (
              <button
                onClick={handleManualComplete}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Marquer comme terminé
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
