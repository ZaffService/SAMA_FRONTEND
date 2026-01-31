"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
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
        return <FileVideo className="h-5 w-5 text-gray-500" />;
      case UploadStatus.UPLOADING:
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case UploadStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case UploadStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      case UploadStatus.CANCELLED:
        return <X className="h-5 w-5 text-gray-500" />;
      default:
        return <FileVideo className="h-5 w-5 text-gray-500" />;
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
        return "text-gray-600";
      case UploadStatus.UPLOADING:
        return "text-blue-600";
      case UploadStatus.COMPLETED:
        return "text-green-600";
      case UploadStatus.FAILED:
        return "text-red-600";
      case UploadStatus.CANCELLED:
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={`border rounded-lg p-4 bg-white ${className}`}>
      {/* En-tête avec informations du fichier */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <p className="font-medium text-sm truncate max-w-xs">{file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {uploadState.progress && (
            <span className="text-xs text-gray-500">
              {uploadState.progress.percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      {uploadState.progress && (
        <div className="mb-3">
          <Progress value={uploadState.progress.percentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
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
            <p className="text-xs text-orange-600">
              Tentative {uploadState.retryCount + 1} sur{" "}
              {uploadState.maxRetries + 1}
            </p>
          </div>
        )}

      {/* Message d'erreur */}
      {isFailed && uploadState.result?.error && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
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
            className="flex items-center space-x-1"
          >
            <X className="h-4 w-4" />
            <span>Annuler</span>
          </Button>
        )}

        {isFailed && uploadState.retryCount < uploadState.maxRetries && (
          <Button
            size="sm"
            onClick={handleRetry}
            className="flex items-center space-x-1"
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
            className="flex items-center space-x-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Réinitialiser</span>
          </Button>
        )}
      </div>
    </div>
  );
}
