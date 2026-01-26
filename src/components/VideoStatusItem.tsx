"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LessonStatus, CoursesApi } from "@/infrastructure/api/courses-api";
import { buildApiUrl, API_ENDPOINTS } from "@/infrastructure/api/baseConfig";
import { Upload, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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
  onUploadEnd
}: VideoStatusItemProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validation du fichier
      if (!file.type.startsWith('video/')) {
        toast.error('Veuillez sélectionner un fichier vidéo');
        return;
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB
        toast.error('Le fichier ne doit pas dépasser 100MB');
        return;
      }
      setSelectedFile(file);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Veuillez d\'abord sélectionner un fichier vidéo');
      return;
    }

    onUploadStart();

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.LESSONS.UPLOAD_VIDEO(lesson.id)),
        {
          method: "PUT",
          credentials: "include",
          body: formData,
          // Note: onUploadProgress n'est pas disponible dans fetch natif
          // Pour la progression, on pourrait utiliser une bibliothèque comme axios
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const result = await response.json();
      toast.success('Vidéo uploadée avec succès !');
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess();

    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      onUploadEnd();
    }
  };

  const getStatusText = (status: LessonStatus) => {
    switch (status) {
      case LessonStatus.PENDING_VIDEO: return 'En attente';
      case LessonStatus.VIDEO_UPLOADED: return 'Uploadée';
      case LessonStatus.READY: return 'Prête';
      default: return status;
    }
  };

  const getStatusColor = (status: LessonStatus) => {
    switch (status) {
      case LessonStatus.PENDING_VIDEO: return 'bg-yellow-100 text-yellow-800';
      case LessonStatus.VIDEO_UPLOADED: return 'bg-green-100 text-green-800';
      case LessonStatus.READY: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: LessonStatus) => {
    switch (status) {
      case LessonStatus.PENDING_VIDEO: return <Clock className="h-4 w-4" />;
      case LessonStatus.VIDEO_UPLOADED: return <CheckCircle className="h-4 w-4" />;
      case LessonStatus.READY: return <FileText className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center space-x-3 flex-1">
        {getStatusIcon(lesson.status)}
        <div>
          <div className="font-medium text-sm">{lesson.title}</div>
          <div className="text-xs text-gray-600">Statut: {getStatusText(lesson.status)}</div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Badge variant="outline" className={getStatusColor(lesson.status)}>
          {getStatusText(lesson.status)}
        </Badge>

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
            >
              <Upload className="h-4 w-4 mr-2" />
              Choisir vidéo
            </Button>

            {selectedFile && (
              <span className="text-xs text-gray-600 max-w-32 truncate">
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
              </span>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? 'Upload en cours...' : 'Uploader'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}