"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUploadProgress } from "./FileUploadProgress";
import { UploadStatus } from "@/services/fileUploadService";
import { toast } from "sonner";
import {
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  Video,
} from "lucide-react";

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

export function VideoUploadManager({
  videos,
  onVideoSuccess,
  onVideoError,
  onRemoveVideo,
  className = "",
}: VideoUploadManagerProps) {
  const [uploadingAll, setUploadingAll] = useState(false);

  // Calculer les statistiques globales (simplifié pour l'instant)
  const stats = useMemo(() => ({
    total: videos.length,
    completed: 0, // Sera calculé plus tard avec les vrais états
    failed: 0,
    uploading: 0,
    pending: videos.length,
  }), [videos.length]);

  const handleUploadAll = useCallback(async () => {
    setUploadingAll(true);
    toast.info("Démarrage de l'upload de toutes les vidéos...");

    try {
      // Ici, on pourrait implémenter une logique pour uploader toutes les vidéos
      // Pour l'instant, on affiche juste un message
      toast.success("Uploads démarrés. Surveillez la progression individuelle.");
    } catch (error) {
      toast.error("Erreur lors du démarrage des uploads");
    } finally {
      setUploadingAll(false);
    }
  }, []);

  const hasVideos = videos.length > 0;

  if (!hasVideos) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">
            <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune vidéo à uploader</p>
            <p className="text-sm">Ajoutez des vidéos aux leçons pour les voir ici</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span>Upload des Vidéos</span>
          </CardTitle>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600">
              {stats.completed}/{stats.total} terminés
            </span>
            {stats.uploading > 0 && (
              <span className="text-blue-600 flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{stats.uploading} en cours</span>
              </span>
            )}
            {stats.failed > 0 && (
              <span className="text-red-600 flex items-center space-x-1">
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
                toast.success(`Vidéo "${video.lessonTitle}" uploadée avec succès`);
              }}
              onError={(error) => {
                onVideoError(video.id, error);
                toast.error(`Échec de l'upload pour "${video.lessonTitle}": ${error}`);
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