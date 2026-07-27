"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LessonStatus, CoursesApi } from "@/infrastructure/api/courses-api";
import {
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  Youtube,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import logger from "@/shared/helpers/logger";
import {
  isYouTubeUrl,
  normalizeYouTubeUrl,
  validateYouTubeUrl,
  type LessonVideoSourceMode,
} from "@/lib/youtube";
import { cn } from "@/lib/utils";

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
  const [mode, setMode] = useState<LessonVideoSourceMode>("file");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showReplacePanel, setShowReplacePanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusIcon = (status: LessonStatus) => {
    switch (status) {
      case LessonStatus.READY:
      case LessonStatus.VIDEO_UPLOADED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case LessonStatus.PENDING_VIDEO:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: LessonStatus) => {
    switch (status) {
      case LessonStatus.READY:
      case LessonStatus.VIDEO_UPLOADED:
        return "bg-green-500/15 text-green-300 border-green-500/30";
      case LessonStatus.PENDING_VIDEO:
        return "bg-yellow-500/15 text-yellow-200 border-yellow-500/30";
      default:
        return "bg-red-500/15 text-red-300 border-red-500/30";
    }
  };

  const getStatusText = (status: LessonStatus) => {
    switch (status) {
      case LessonStatus.READY:
        return "Prêt";
      case LessonStatus.VIDEO_UPLOADED:
        return "Vidéo uploadée";
      case LessonStatus.PENDING_VIDEO:
        return "En attente de vidéo";
      default:
        return status;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Veuillez sélectionner un fichier vidéo");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 500MB");
      return;
    }
    setSelectedFile(file);
    setMode("file");
    setYoutubeUrl("");
  };

  const submitSource = async (source: File | { videoUrl: string }) => {
    onUploadStart();
    try {
      await CoursesApi.uploadLessonVideo(lesson.id, source);
      toast.success(
        source instanceof File
          ? "Vidéo enregistrée avec succès !"
          : "Lien YouTube enregistré !",
      );
      setSelectedFile(null);
      setYoutubeUrl("");
      setShowReplacePanel(false);
      onUploadSuccess();
    } catch (error) {
      logger.error("Erreur vidéo leçon:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'enregistrement",
      );
    } finally {
      onUploadEnd();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (mode === "file") {
      if (!selectedFile) {
        toast.error("Sélectionnez un fichier vidéo");
        return;
      }
      await submitSource(selectedFile);
      return;
    }

    const err = validateYouTubeUrl(youtubeUrl);
    if (err) {
      toast.error(err);
      return;
    }
    const normalized = normalizeYouTubeUrl(youtubeUrl)!;
    await submitSource({ videoUrl: normalized });
  };

  const needsVideo = lesson.status === LessonStatus.PENDING_VIDEO;
  const canReplace =
    lesson.status === LessonStatus.VIDEO_UPLOADED ||
    lesson.status === LessonStatus.READY;

  const sourceToggle = (
    <div className="inline-flex rounded-lg border border-[#3A3950] bg-[#12111A] p-0.5 gap-0.5">
      <button
        type="button"
        disabled={isUploading}
        onClick={() => {
          setMode("file");
          setYoutubeUrl("");
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
          mode === "file"
            ? "bg-[#2A2640] text-white"
            : "text-white/55 hover:text-white/80",
        )}
      >
        <Upload className="h-3.5 w-3.5" />
        Fichier
      </button>
      <button
        type="button"
        disabled={isUploading}
        onClick={() => {
          setMode("youtube");
          setSelectedFile(null);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
          mode === "youtube"
            ? "bg-[#2A2640] text-white"
            : "text-white/55 hover:text-white/80",
        )}
      >
        <Youtube className="h-3.5 w-3.5" />
        YouTube
      </button>
    </div>
  );

  return (
    <div className="space-y-3 rounded-xl border border-[#302D47] bg-[#181721] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {getStatusIcon(lesson.status)}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white">
              {lesson.title}
            </div>
            <div className="text-xs text-white/60">
              Statut: {getStatusText(lesson.status)}
              {lesson.videoUrl && isYouTubeUrl(lesson.videoUrl) ? (
                <span className="ml-2 text-[#F87171]">· YouTube</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={`border ${getStatusColor(lesson.status)}`}
          >
            {getStatusText(lesson.status)}
          </Badge>

          {canReplace && !showReplacePanel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplacePanel(true)}
              disabled={isUploading}
              className="border-[#3A3950] bg-transparent text-white hover:bg-white/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Changer la vidéo
            </Button>
          )}
        </div>
      </div>

      {(needsVideo || showReplacePanel) && (
        <div className="space-y-3 rounded-lg border border-[#3A3950] bg-[#12111A] p-3">
          {sourceToggle}

          {mode === "file" ? (
            <div className="flex flex-wrap items-center gap-2">
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
                <Upload className="mr-2 h-4 w-4" />
                Choisir fichier
              </Button>
              {selectedFile && (
                <span className="max-w-48 truncate text-xs text-white/60">
                  {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                <Input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={isUploading}
                  placeholder="https://youtu.be/…"
                  className="border-[#3A3950] bg-[#181721] pl-8 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleUpload}
              disabled={
                isUploading ||
                (mode === "file" ? !selectedFile : !youtubeUrl.trim())
              }
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : mode === "youtube" ? (
                "Enregistrer le lien"
              ) : (
                "Uploader"
              )}
            </Button>
            {showReplacePanel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploading}
                onClick={() => {
                  setShowReplacePanel(false);
                  setSelectedFile(null);
                  setYoutubeUrl("");
                  setMode("file");
                }}
                className="text-white/70 hover:text-white"
              >
                Annuler
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
