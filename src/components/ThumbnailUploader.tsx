"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Upload, X, Loader2 } from "lucide-react";
import { showErrorToast } from "@/shared/helpers/sweet-alert";
import logger from "@/shared/helpers/logger";

interface ThumbnailUploaderProps {
  courseId?: string;
  onThumbnailUploaded: (fileOrUrl: File | string) => void;
  onThumbnailRemoved: () => void;
  existingThumbnailUrl?: string;
}

export function ThumbnailUploader({
  courseId,
  onThumbnailUploaded,
  onThumbnailRemoved,
  existingThumbnailUrl,
}: ThumbnailUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    existingThumbnailUrl || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showErrorToast("Erreur", "Veuillez sélectionner un fichier image valide");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast("Erreur", "L'image ne doit pas dépasser 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // For now, just create a local URL for preview
      // In a real implementation, you would upload to a server
      const localUrl = URL.createObjectURL(file);
      setThumbnailUrl(localUrl);
      onThumbnailUploaded(file);
    } catch (error) {
      logger.error("Error uploading thumbnail:", error);
      showErrorToast("Erreur", "Impossible de charger l'image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (thumbnailUrl && thumbnailUrl.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailUrl);
    }
    setThumbnailUrl(null);
    onThumbnailRemoved();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full border border-[#3B3754] bg-[#181721]">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Image className="h-5 w-5 text-[#A9F5E5]" />
            <h3 className="text-lg font-semibold text-white">
              Image de couverture du cours
            </h3>
          </div>

          <div className="rounded-lg border-2 border-dashed border-[#3B3754] bg-[#1F1D2B] p-6">
            {thumbnailUrl ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={thumbnailUrl}
                    alt="Course thumbnail"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-center">
                  <Button
                    type="button"
                    className="border border-[#3B3754] bg-[#181721] text-white hover:bg-[#26233A]"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Changer l'image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="mx-auto h-12 w-12 text-[#A9F5E5]/70">
                  <Image className="h-12 w-12" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Ajoutez une image de couverture pour votre cours
                  </p>
                  <p className="mt-1 text-xs font-medium text-white/75">
                    PNG, JPG jusqu'à 5MB
                  </p>
                </div>
                <Button
                  type="button"
                  className="bg-[#3B82F6] font-semibold text-white hover:bg-[#2563EB]"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Choisir une image
                </Button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}
