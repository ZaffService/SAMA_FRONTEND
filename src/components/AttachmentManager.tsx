"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  File,
  X,
  AlertCircle,
  CheckCircle,
  FileText,
  Image,
  Archive,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Attachment {
  file: File;
  id: string;
  preview?: string;
}

interface AttachmentManagerProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-rar-compressed",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
];

export function AttachmentManager({
  attachments,
  onAttachmentsChange,
  maxFiles = 10,
  maxFileSize = 50,
}: AttachmentManagerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Type de fichier non supporté: ${file.type}. Types acceptés: PDF, Word, Excel, PowerPoint, ZIP, images.`;
    }
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${maxFileSize}MB.`;
    }
    if (attachments.length >= maxFiles) {
      return `Maximum ${maxFiles} fichiers autorisés.`;
    }
    return null;
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/"))
      return <Image className="h-5 w-5 text-blue-500" />;
    if (type === "application/pdf")
      return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes("zip") || type.includes("rar"))
      return <Archive className="h-5 w-5 text-yellow-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      const newAttachments = fileArray.map((file) => ({
        file,
        id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      }));

      onAttachmentsChange([...attachments, ...newAttachments]);
    },
    [attachments, onAttachmentsChange, maxFiles, maxFileSize],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    const updated = attachments.filter((att) => att.id !== id);
    // Clean up preview URLs
    const removed = attachments.find((att) => att.id === id);
    if (removed?.preview) {
      URL.revokeObjectURL(removed.preview);
    }
    onAttachmentsChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Fichiers joints au cours</h3>
          <p className="text-sm text-white/70">
            Ajoutez des ressources supplémentaires pour vos étudiants (PDF,
            documents, archives, etc.)
          </p>
        </div>
        <div className="text-sm text-white/65">
          {attachments.length}/{maxFiles} fichiers
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${
            isDragOver
              ? "border-[#3B82F6] bg-[#1E2A45]"
              : "border-[#3B3754] bg-[#181721] hover:border-[#4C476A]"
          }
        `}
      >
        <Upload
          className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? "text-[#60A5FA]" : "text-white/45"}`}
        />
        <div className="space-y-2">
          <p className="text-lg font-medium text-white">
            Glissez-déposez vos fichiers ici
          </p>
          <p className="text-sm text-white/70">
            ou{" "}
            <label
              htmlFor="attachment-upload"
              className="cursor-pointer font-medium text-[#60A5FA] hover:text-[#93C5FD]"
            >
              parcourez vos fichiers
            </label>
          </p>
          <p className="text-xs text-white/55">
            Formats acceptés: PDF, Word, Excel, PowerPoint, ZIP, images • Max{" "}
            {maxFileSize}MB par fichier
          </p>
        </div>
        <input
          id="attachment-upload"
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-white">
            Fichiers ajoutés ({attachments.length})
          </h4>
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="border-[#302D47] bg-[#181721] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getFileIcon(attachment.file)}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {attachment.file.name}
                    </p>
                    <p className="text-xs text-white/65">
                      {formatFileSize(attachment.file.size)} •{" "}
                      {attachment.file.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(attachment.id)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {attachment.preview && (
                <div className="mt-3">
                  <img
                    src={attachment.preview}
                    alt="Preview"
                    className="max-h-32 max-w-xs rounded border border-[#3B3754] object-cover"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {attachments.length === 0 && (
        <div className="py-8 text-center text-white/65">
          <File className="mx-auto mb-4 h-12 w-12 text-white/35" />
          <p className="text-sm">Aucun fichier joint pour le moment</p>
          <p className="mt-1 text-xs text-white/45">
            Les fichiers joints sont optionnels mais peuvent enrichir
            l'expérience d'apprentissage
          </p>
        </div>
      )}
    </div>
  );
}
