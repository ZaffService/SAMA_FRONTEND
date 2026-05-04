"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LessonStatus, CoursesApi } from "@/infrastructure/api/courses-api";
import { buildApiUrl, API_ENDPOINTS } from "@/infrastructure/api/baseConfig";
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import logger from "@/shared/helpers/logger";

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  orderIndex: number;
  duration: number;
  status: LessonStatus;
}

interface VideoStatusItemProps {
  lesson: Lesson;
  onUploadSuccess: () => void;
  isUploading: boolean;
  onUploadStart: () => void;
  onUploadEnd: () => void;
}

export function VideoStatusItem({
  lesson,
  onUploadSuccess,
  isUploading,
  onUploadStart,
  onUploadEnd,
}: VideoStatusItemProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const changeVideoFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validation du fichier
      if (!file.type.startsWith("video/")) {
        toast.error("Veuillez sélectionner un fichier vidéo");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        // 100MB
        toast.error("Le fichier ne doit pas dépasser 100MB");
        return;
      }
      setSelectedFile(file);
      setUploadProgress(0);
    }
  };

  const handleChangeVideoFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validation du fichier
      if (!file.type.startsWith("video/")) {
        toast.error("Veuillez sélectionner un fichier vidéo");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        // 100MB
        toast.error("Le fichier ne doit pas dépasser 100MB");
        return;
      }
      handleChangeVideoUpload(file);
    }
  };

  const handleChangeVideoUpload = async (file: File) => {
    onUploadStart();

    try {
      await CoursesApi.uploadLessonVideo(lesson.id, file);
      toast.success("Vidéo changée avec succès !");
      onUploadSuccess();
    } catch (error) {
      logger.error("Erreur lors du changement de vidéo:", error);
      toast.error(
        `Erreur lors du changement de vidéo: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    } finally {
      onUploadEnd();
      // Reset the file input
      if (changeVideoFileInputRef.current) {
        changeVideoFileInputRef.current.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Veuillez d'abord sélectionner un fichier vidéo");
      return;
    }

    onUploadStart();

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.LESSONS.UPLOAD_VIDEO(lesson.id)),
        {
          method: "PUT",
          credentials: "include",
          body: formData,
          // Note: onUploadProgress n'est pas disponible dans fetch natif
          // Pour la progression, on pourrait utiliser une bibliothèque comme axios
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const result = await response.json();
      toast.success("Vidéo uploadée avec succès !");
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onUploadSuccess();
    } catch (error) {
      logger.error("Erreur upload:", error);
      toast.error(
        `Erreur lors de l'upload: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    } finally {
      onUploadEnd();
    }
  };

  const getStatusText = (status: LessonStatus) => {
    switch (status) {
      case LessonStatus.PENDING_VIDEO:
        return "En attente";
      case LessonStatus.VIDEO_UPLOADED:
        return "Uploadée";
      case LessonStatus.READY:
        return "Prête";
      default:
        return status;
    }
  };

  const getStatusColor = (status: LessonStatus) => {
    switch (status) {
      case LessonStatus.PENDING_VIDEO:
        return "bg-amber-500/15 text-amber-200 border-amber-500/30";
      case LessonStatus.VIDEO_UPLOADED:
        return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
      case LessonStatus.READY:
        return "bg-sky-500/15 text-sky-200 border-sky-500/30";
      default:
        return "bg-white/10 text-white/80 border-white/15";
    }
  };

  const getStatusIcon = (status: LessonStatus) => {
    switch (status) {
      case LessonStatus.PENDING_VIDEO:
        return <Clock className="h-4 w-4" />;
      case LessonStatus.VIDEO_UPLOADED:
        return <CheckCircle className="h-4 w-4" />;
      case LessonStatus.READY:
        return <FileText className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-4 bg-[#141320] rounded-xl border border-[#2A2938]">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {getStatusIcon(lesson.status)}
        <div>
          <div className="font-medium text-sm text-white line-clamp-1">
            {lesson.title}
          </div>
          <div className="text-xs text-white/60">
            Statut: {getStatusText(lesson.status)}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Badge
          variant="outline"
          className={`border ${getStatusColor(lesson.status)}`}
        >
          {getStatusText(lesson.status)}
        </Badge>

        {/* Bouton Changer la vidéo pour les vidéos déjà uploadées ou prêtes */}
        {(lesson.status === LessonStatus.VIDEO_UPLOADED ||
          lesson.status === LessonStatus.READY) && (
          <div className="flex items-center space-x-2">
            <input
              ref={changeVideoFileInputRef}
              type="file"
              accept="video/*"
              onChange={handleChangeVideoFileSelect}
              disabled={isUploading}
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => changeVideoFileInputRef.current?.click()}
              disabled={isUploading}
              className="border-[#3A3950] bg-transparent text-white hover:bg-white/10"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isUploading ? "Changement en cours..." : "Changer la vidéo"}
            </Button>
          </div>
        )}

        {/* Bouton Upload UNIQUEMENT pour les vidéos en attente */}
        {lesson.status === LessonStatus.PENDING_VIDEO && (
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="border-[#3A3950] bg-transparent text-white hover:bg-white/10"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choisir vidéo
            </Button>

            {selectedFile && (
              <span className="text-xs text-white/60 max-w-32 truncate">
                {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
              </span>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploading ? "Upload en cours..." : "Uploader"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
