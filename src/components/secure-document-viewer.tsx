"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";
import { useAntiCapture } from "@/shared/helpers/anti-capture";
import { Watermark, useStudentData } from "@/components/watermark";

interface SecureDocumentViewerProps {
  documentUrl: string;
  documentName: string;
  documentType: "pdf" | "docx" | "xlsx";
  trigger?: React.ReactNode;
}

export function SecureDocumentViewer({
  documentUrl,
  documentName,
  documentType,
  trigger,
}: SecureDocumentViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const studentData = useStudentData();

  // Activer les protections dans la modal
  useAntiCapture();

  const getViewerUrl = (url: string, type: string) => {
    // Pour les PDFs, utiliser un viewer sécurisé
    if (type === "pdf") {
      // Utiliser Google Docs viewer ou un service similaire
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    // Pour Word/Excel, utiliser Google Docs viewer aussi
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <FileText className="h-4 w-4 mr-2" />
      Voir
    </Button>
  );

  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)}>{trigger || defaultTrigger}</div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">{documentName}</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative flex-1">
          {/* Filigrane sur le document */}
          {studentData && (
            <Watermark
              studentId={studentData.id}
              studentEmail={studentData.email}
              className="z-10"
            />
          )}

          <iframe
            src={getViewerUrl(documentUrl, documentType)}
            className="w-full h-full border-0 rounded-b-lg"
            title={documentName}
            sandbox="allow-scripts allow-same-origin"
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Overlay pour empêcher les captures */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "transparent",
              zIndex: 5,
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* Message d'avertissement */}
        <div className="p-4 bg-muted border-t text-sm text-muted-foreground">
          Ce document est protégé. Les captures d'écran et le téléchargement
          sont interdits.
        </div>
      </div>
    </div>
  );
}
