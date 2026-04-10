"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface VoiceRecorderProps {
  onAudioReady: (blob: Blob | null) => void;
  existingAudio?: Blob | null;
  existingAudioUrl?: string | null;
  onRemoveExistingAudio?: () => void;
}

export function VoiceRecorder({
  onAudioReady,
  existingAudio = null,
  existingAudioUrl = null,
  onRemoveExistingAudio,
}: VoiceRecorderProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const resetAudio = (nextBlob: Blob | null) => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (nextBlob) {
      const url = URL.createObjectURL(nextBlob);
      setAudioUrl(url);
      blobRef.current = nextBlob;
    } else {
      setAudioUrl(null);
      blobRef.current = null;
    }
  };

  useEffect(() => {
    if (existingAudio === blobRef.current) return;
    resetAudio(existingAudio ?? null);
  }, [existingAudio]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleSelectFile = () => {
    setError(null);
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setError("Veuillez sélectionner un fichier audio.");
      return;
    }

    resetAudio(file);
    onAudioReady(file);
  };

  const deleteAudio = () => {
    setError(null);
    const hadLocalAudio = Boolean(blobRef.current);
    resetAudio(null);
    onAudioReady(null);
    if (!hadLocalAudio && existingAudioUrl) {
      onRemoveExistingAudio?.();
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const resolvedAudioUrl = audioUrl ?? existingAudioUrl;

  return (
    <div className="flex flex-col items-start gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {!resolvedAudioUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectFile}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Uploader audio
        </Button>
      )}

      {resolvedAudioUrl && (
        <div className="flex items-center gap-2">
          <audio controls src={resolvedAudioUrl} className="h-9" />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSelectFile}
            className="whitespace-nowrap"
          >
            Changer
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={deleteAudio}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {resolvedAudioUrl && (
        <p className="text-xs text-emerald-700">Vocal disponible</p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
