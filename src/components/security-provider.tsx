"use client";

import { useEffect } from "react";
import { useAntiCapture } from "@/shared/helpers/anti-capture";
import logger from "@/shared/helpers/logger";

interface SecurityProviderProps {
  children: React.ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  useAntiCapture();

  useEffect(() => {
    // Protection supplémentaire contre les captures
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquer tous les raccourcis de capture
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.key === "p") ||
        (e.ctrlKey && e.shiftKey && e.key === "S")
      ) {
        e.preventDefault();
        e.stopPropagation();
        // Afficher avertissement
        alert("Capture d'écran détectée et bloquée !");
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Ne bloquer que sur le contenu protégé
      const target = e.target as HTMLElement;
      if (
        target.closest(".protected-content") ||
        target.tagName === "VIDEO" ||
        target.closest("video")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Laisser le menu contextuel normal ailleurs
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Possible capture détectée
        logger.warn("Tentative de capture détectée");
      }
    };

    // Ajouter les listeners avec capture
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Désactiver les gestes de capture sur mobile
    const metaViewport = document.querySelector("meta[name=viewport]");
    if (metaViewport) {
      const content = metaViewport.getAttribute("content") || "";
      if (!content.includes("user-scalable=no")) {
        metaViewport.setAttribute("content", content + ", user-scalable=no");
      }
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
}
