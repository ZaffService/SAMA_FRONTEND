"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

export function VideoModal({
  isOpen,
  onClose,
  videoUrl,
  title,
}: VideoModalProps) {
  const [isYouTube, setIsYouTube] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string>("");

  // Extraire l'ID YouTube depuis différents formats d'URL
  const extractYoutubeId = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return "";
  };

  useEffect(() => {
    if (!isOpen) return;

    // Vérifier si c'est une URL YouTube
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      const id = extractYoutubeId(videoUrl);
      if (id) {
        setYoutubeId(id);
        setIsYouTube(true);
      }
    } else {
      setIsYouTube(false);
      setYoutubeId("");
    }
  }, [videoUrl, isOpen]);

  if (!isOpen) return null;

  // Vérifier que l'URL est valide
  if (!videoUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <X
              className="h-12 w-12 text-red-500 cursor-pointer"
              onClick={onClose}
            />
            <p className="text-white text-center text-lg">
              ❌ Vidéo non disponible
            </p>
            <p className="text-gray-400 text-center">
              Impossible de charger la vidéo. Veuillez réessayer plus tard.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl">
        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {isYouTube && youtubeId ? (
            // YouTube Player
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&modestbranding=1&fs=1`}
              title={title}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              className="absolute inset-0"
            />
          ) : (
            // HTML5 Video Player
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full"
              crossOrigin="anonymous"
              controlsList="nodownload"
            >
              <p className="text-white p-4">
                Votre navigateur ne supporte pas la lecture vidéo.
              </p>
            </video>
          )}
        </div>
      </div>
    </div>
  );
}
