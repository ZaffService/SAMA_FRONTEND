"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploadProgress } from "./FileUploadProgress";
import { toast } from "sonner";
import { AlertCircle, Clock, Video } from "lucide-react";

interface VideoFile {
  id: string;
  file: File;
  lessonTitle: string;
  endpoint: string;
}

interface VideoUploadManagerProps {
  videos: VideoFile[];
  onVideoSuccess: (videoId: string, fileUrl: string) => void;
  onVideoError: (videoId: string, error: string) => void;
  onRemoveVideo: (videoId: string) => void;
  className?: string;
}

const panelClassName =
  "border-[#302D47] bg-[#181721] text-white shadow-none";

export function VideoUploadManager({
  videos,
  onVideoSuccess,
  onVideoError,
  onRemoveVideo,
  className = "",
}: VideoUploadManagerProps) {
  // Calculer les statistiques globales (simplifié pour l'instant)
  const stats = useMemo(
    () => ({
      total: videos.length,
      completed: 0, // Sera calculé plus tard avec les vrais états
      failed: 0,
      uploading: 0,
      pending: videos.length,
    }),
    [videos.length],
  );

  const hasVideos = videos.length > 0;

  if (!hasVideos) {
    return (
      <Card className={`${panelClassName} ${className}`}>
        <CardContent className="pt-6">
          <div className="py-8 text-center text-white/65">
            <Video className="mx-auto mb-4 h-12 w-12 text-white/35" />
            <p className="font-medium text-white">Aucune vidéo à uploader</p>
            <p className="mt-1 text-sm text-white/55">
              Ajoutez des vidéos aux leçons pour les voir ici
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${panelClassName} ${className}`}>
      <CardHeader className="border-b border-[#302D47]">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-base font-semibold text-white">
            <Video className="h-5 w-5 text-[#93C5FD]" />
            <span>Upload des Vidéos</span>
          </CardTitle>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-white/65">
              {stats.completed}/{stats.total} terminés
            </span>
            {stats.uploading > 0 && (
              <span className="flex items-center space-x-1 text-[#93C5FD]">
                <Clock className="h-4 w-4" />
                <span>{stats.uploading} en cours</span>
              </span>
            )}
            {stats.failed > 0 && (
              <span className="flex items-center space-x-1 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{stats.failed} échoués</span>
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Alertes globales - Sera implémenté avec la vraie logique de stats */}

        {/* Liste des uploads individuels */}
        <div className="space-y-4">
          {videos.map((video) => (
            <FileUploadProgress
              key={video.id}
              file={video.file}
              endpoint={video.endpoint}
              onSuccess={(fileUrl) => {
                onVideoSuccess(video.id, fileUrl);
                toast.success(
                  `Vidéo "${video.lessonTitle}" uploadée avec succès`,
                );
              }}
              onError={(error) => {
                onVideoError(video.id, error);
                toast.error(
                  `Échec de l'upload pour "${video.lessonTitle}": ${error}`,
                );
              }}
              onCancel={() => {
                toast.info(`Upload annulé pour "${video.lessonTitle}"`);
              }}
              uploadOptions={{
                maxFileSizeMB: 100,
                allowedFileTypes: [], // Permettre tous les types de fichiers pour l'upload de vidéos
                timeout: 600000, // 10 minutes
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
