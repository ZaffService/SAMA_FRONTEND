"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  X,
  Loader2,
  FileVideo,
  AlertCircle,
} from "lucide-react";
import { useFileUpload, UseFileUploadOptions } from "@/hooks/useFileUpload";
import { UploadStatus } from "@/services/fileUploadService";

interface FileUploadProgressProps {
  file: File;
  endpoint: string;
  onSuccess?: (fileUrl: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  uploadOptions?: UseFileUploadOptions;
  className?: string;
}

export function FileUploadProgress({
  file,
  endpoint,
  onSuccess,
  onError,
  onCancel,
  uploadOptions = {},
  className = "",
}: FileUploadProgressProps) {
  const [hasStarted, setHasStarted] = useState(false);

  const {
    uploadState,
    upload,
    retry,
    cancel,
    reset,
    isUploading,
    isCompleted,
    isFailed,
    isCancelled,
  } = useFileUpload({
    autoStart: false, // On contrôle manuellement le démarrage
    ...uploadOptions,
  });

  const handleStartUpload = useCallback(async () => {
    setHasStarted(true);
    const result = await upload(file, endpoint);
    if (result.success && result.fileUrl) {
      onSuccess?.(result.fileUrl);
    } else {
      onError?.(result.error || "Upload failed");
    }
  }, [file, endpoint, upload, onSuccess, onError]);

  const handleRetry = useCallback(async () => {
    const result = await retry();
    if (result.success && result.fileUrl) {
      onSuccess?.(result.fileUrl);
    } else {
      onError?.(result.error || "Retry failed");
    }
  }, [retry, onSuccess, onError]);

  const handleCancel = useCallback(() => {
    cancel();
    onCancel?.();
  }, [cancel, onCancel]);

  const handleReset = useCallback(() => {
    reset();
    setHasStarted(false);
  }, [reset]);

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case UploadStatus.PENDING:
        return <FileVideo className="h-5 w-5 text-white/45" />;
      case UploadStatus.UPLOADING:
        return (
          <Loader2 className="h-5 w-5 animate-spin text-[#93C5FD]" />
        );
      case UploadStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case UploadStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-400" />;
      case UploadStatus.CANCELLED:
        return <X className="h-5 w-5 text-white/45" />;
      default:
        return <FileVideo className="h-5 w-5 text-white/45" />;
    }
  };

  const getStatusText = () => {
    switch (uploadState.status) {
      case UploadStatus.PENDING:
        return hasStarted ? "En attente..." : "";
      case UploadStatus.UPLOADING:
        return "Upload en cours...";
      case UploadStatus.COMPLETED:
        return "Upload terminé";
      case UploadStatus.FAILED:
        return "Échec de l'upload";
      case UploadStatus.CANCELLED:
        return "Upload annulé";
      default:
        return "Statut inconnu";
    }
  };

  const getStatusColor = () => {
    switch (uploadState.status) {
      case UploadStatus.PENDING:
        return "text-white/55";
      case UploadStatus.UPLOADING:
        return "text-[#93C5FD]";
      case UploadStatus.COMPLETED:
        return "text-emerald-300";
      case UploadStatus.FAILED:
        return "text-red-400";
      case UploadStatus.CANCELLED:
        return "text-white/55";
      default:
        return "text-white/55";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const btnOutline =
    "border-[#3B3754] bg-[#181721] text-white hover:bg-[#2B2740]";

  return (
    <div
      className={`rounded-lg border border-[#302D47] bg-[#1F1D2B] p-4 text-white ${className}`}
    >
      {/* En-tête avec informations du fichier */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <p className="max-w-xs truncate text-sm font-medium text-white">
              {file.name}
            </p>
            <p className="text-xs text-white/55">{formatFileSize(file.size)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {uploadState.progress && (
            <span className="text-xs text-white/50">
              {uploadState.progress.percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      {uploadState.progress && (
        <div className="mb-3">
          <Progress
            value={uploadState.progress.percentage}
            className="h-2 bg-white/10"
          />
          <div className="mt-1 flex justify-between text-xs text-white/50">
            <span>
              {formatFileSize(uploadState.progress.loaded)} /{" "}
              {formatFileSize(uploadState.progress.total)}
            </span>
            <span>{uploadState.progress.percentage}%</span>
          </div>
        </div>
      )}

      {/* Informations de retry */}
      {uploadState.retryCount > 0 &&
        uploadState.retryCount < uploadState.maxRetries && (
          <div className="mb-3">
            <p className="text-xs text-amber-400/90">
              Tentative {uploadState.retryCount + 1} sur{" "}
              {uploadState.maxRetries + 1}
            </p>
          </div>
        )}

      {/* Message d'erreur */}
      {isFailed && uploadState.result?.error && (
        <Alert
          variant="destructive"
          className="mb-3 border border-[#EF4444]/50 bg-[#35181D] text-[#FECACA]"
        >
          <AlertCircle className="h-4 w-4 text-[#FCA5A5]" />
          <AlertDescription className="text-sm text-[#FECACA]">
            {uploadState.result.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-end space-x-2">
        {isUploading && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className={`flex items-center space-x-1 ${btnOutline}`}
          >
            <X className="h-4 w-4" />
            <span>Annuler</span>
          </Button>
        )}

        {isFailed && uploadState.retryCount < uploadState.maxRetries && (
          <Button
            size="sm"
            onClick={handleRetry}
            className="flex items-center space-x-1 bg-[#3B82F6] text-white hover:bg-[#2563EB]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Réessayer</span>
          </Button>
        )}

        {(isCompleted || isFailed || isCancelled) && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className={`flex items-center space-x-1 ${btnOutline}`}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Réinitialiser</span>
          </Button>
        )}
      </div>
    </div>
  );
}
