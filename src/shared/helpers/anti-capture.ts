import { useEffect } from "react";

/**
 * Hook pour prévenir la capture d'écran et l'enregistrement
 * Version mockée pour la démo
 */
export function useAntiCapture() {
  useEffect(() => {
    console.log("🛡️ Protection anti-capture activée (mode démo)");

    // Empêcher le clic droit
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Empêcher certaines combinaisons de touches
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+I (DevTools), Ctrl+U (View Source), etc.
      if (
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.key === "s") ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
        console.log("🛡️ Action de capture bloquée");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
