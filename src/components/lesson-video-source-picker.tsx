"use client";

import { useId } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle,
  FileVideo,
  Link2,
  Loader2,
  Trash2,
  Upload,
  Youtube,
} from "lucide-react";
import {
  getYouTubeVideoId,
  type LessonVideoSourceMode,
  validateYouTubeUrl,
} from "@/lib/youtube";
import { cn } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export interface LessonVideoSourcePickerProps {
  mode: LessonVideoSourceMode;
  videoFile?: File | null;
  videoUrl?: string;
  error?: string;
  isDragOver?: boolean;
  uploadProgress?: number;
  /** "dark" = admin sombre (ModuleManager), "light" = formulaires clairs */
  variant?: "dark" | "light";
  className?: string;
  onModeChange: (mode: LessonVideoSourceMode) => void;
  onFileSelect: (file: File) => void;
  onVideoUrlChange: (url: string) => void;
  onClear: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function LessonVideoSourcePicker({
  mode,
  videoFile,
  videoUrl = "",
  error,
  isDragOver = false,
  uploadProgress = 0,
  variant = "dark",
  className,
  onModeChange,
  onFileSelect,
  onVideoUrlChange,
  onClear,
  onDragOver,
  onDragLeave,
  onDrop,
}: LessonVideoSourcePickerProps) {
  const reactId = useId();
  const fileInputId = `video-upload-${reactId}`;
  const isDark = variant === "dark";
  const youtubeId = getYouTubeVideoId(videoUrl);
  const youtubeError =
    mode === "youtube" && videoUrl.trim()
      ? validateYouTubeUrl(videoUrl)
      : null;
  const displayError = error || youtubeError;

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "inline-flex rounded-xl p-1 gap-1",
          isDark ? "bg-[#12111A] border border-[#3B3754]" : "bg-muted border border-border",
        )}
        role="tablist"
        aria-label="Source vidéo"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "file"}
          onClick={() => onModeChange("file")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
            mode === "file"
              ? isDark
                ? "bg-[#2A2640] text-white shadow-sm"
                : "bg-background text-foreground shadow-sm"
              : isDark
                ? "text-white/55 hover:text-white/80"
                : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Upload className="h-4 w-4" />
          Fichier
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "youtube"}
          onClick={() => onModeChange("youtube")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
            mode === "youtube"
              ? isDark
                ? "bg-[#2A2640] text-white shadow-sm"
                : "bg-background text-foreground shadow-sm"
              : isDark
                ? "text-white/55 hover:text-white/80"
                : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Youtube className="h-4 w-4" />
          YouTube
        </button>
      </div>

      {displayError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {mode === "file" ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragOver
              ? isDark
                ? "border-[#3B82F6] bg-[#1E335F]/30"
                : "border-primary bg-primary/5"
              : isDark
                ? "border-[#3B3754] hover:border-[#5B5680]"
                : "border-border hover:border-primary/40",
            videoFile &&
              (isDark
                ? "border-[#34D399] bg-[#12352D]"
                : "border-emerald-400 bg-emerald-50"),
          )}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {videoFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span
                  className={cn(
                    "text-sm font-medium",
                    isDark ? "text-[#A9F5E5]" : "text-emerald-700",
                  )}
                >
                  Vidéo ajoutée
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center justify-between rounded border p-3",
                  isDark
                    ? "border-[#3B3754] bg-[#181721]"
                    : "border-border bg-background",
                )}
              >
                <div className="flex items-center space-x-3">
                  <FileVideo className="h-8 w-8 text-blue-500" />
                  <div className="text-left">
                    <p
                      className={cn(
                        "max-w-xs truncate text-sm font-medium",
                        isDark ? "text-white" : "text-foreground",
                      )}
                    >
                      {videoFile.name}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        isDark ? "text-white/65" : "text-muted-foreground",
                      )}
                    >
                      {formatFileSize(videoFile.size)} • {videoFile.type}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : uploadProgress > 0 && uploadProgress < 100 ? (
            <div className="space-y-3">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
              <div className="space-y-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isDark ? "text-white" : "text-foreground",
                  )}
                >
                  Préparation...
                </p>
                <div
                  className={cn(
                    "h-2 w-full rounded-full",
                    isDark ? "bg-[#2B2841]" : "bg-muted",
                  )}
                >
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p
                  className={cn(
                    "text-xs",
                    isDark ? "text-white/65" : "text-muted-foreground",
                  )}
                >
                  {uploadProgress}%
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload
                className={cn(
                  "mx-auto h-10 w-10",
                  isDragOver
                    ? "text-[#3B82F6]"
                    : isDark
                      ? "text-white/55"
                      : "text-muted-foreground",
                )}
              />
              <div className="space-y-2">
                <p
                  className={cn(
                    "text-lg font-medium",
                    isDark ? "text-white" : "text-foreground",
                  )}
                >
                  {isDragOver
                    ? "Déposez votre vidéo ici"
                    : "Glissez-déposez une vidéo"}
                </p>
                <p
                  className={cn(
                    "text-sm",
                    isDark ? "text-white/75" : "text-muted-foreground",
                  )}
                >
                  ou{" "}
                  <label
                    htmlFor={fileInputId}
                    className="cursor-pointer font-medium text-[#3B82F6] hover:text-[#60A5FA]"
                  >
                    parcourez vos fichiers
                  </label>
                </p>
                <p
                  className={cn(
                    "text-xs",
                    isDark ? "text-white/60" : "text-muted-foreground",
                  )}
                >
                  MP4, WebM, MOV… • Max 500MB (hébergé sur Bunny)
                </p>
              </div>
              <input
                type="file"
                accept="video/*"
                id={fileInputId}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFileSelect(file);
                  e.target.value = "";
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "space-y-3 rounded-lg border p-4",
            isDark ? "border-[#3B3754] bg-[#181721]" : "border-border bg-muted/30",
            youtubeId &&
              (isDark
                ? "border-[#34D399]/60 bg-[#12352D]/40"
                : "border-emerald-300 bg-emerald-50/50"),
          )}
        >
          <div className="flex items-center gap-2">
            <Link2
              className={cn(
                "h-4 w-4",
                isDark ? "text-white/60" : "text-muted-foreground",
              )}
            />
            <label
              className={cn(
                "text-sm font-medium",
                isDark ? "text-white" : "text-foreground",
              )}
            >
              Lien YouTube
            </label>
          </div>
          <div className="flex gap-2">
            <Input
              value={videoUrl}
              onChange={(e) => onVideoUrlChange(e.target.value)}
              placeholder="https://youtu.be/… ou https://www.youtube.com/watch?v=…"
              className={cn(
                isDark &&
                  "border-[#3B3754] bg-[#12111A] text-white placeholder:text-white/45",
              )}
            />
            {videoUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="shrink-0 text-red-400 hover:text-red-300"
                aria-label="Effacer le lien"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          {youtubeId ? (
            <div className="flex items-start gap-3">
              <img
                src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                alt="Aperçu YouTube"
                className="h-16 w-28 rounded object-cover"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                  Lien valide
                </div>
                <p
                  className={cn(
                    "truncate text-xs",
                    isDark ? "text-white/55" : "text-muted-foreground",
                  )}
                >
                  ID : {youtubeId}
                </p>
              </div>
            </div>
          ) : (
            <p
              className={cn(
                "text-xs",
                isDark ? "text-white/50" : "text-muted-foreground",
              )}
            >
              Collez un lien YouTube. Aucun fichier ne sera uploadé sur Bunny.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
