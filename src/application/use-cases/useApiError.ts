import logger from "@/shared/helpers/logger";
import { useCallback } from "react";
import Swal from "sweetalert2";

export interface ApiError {
  code: string;
  status: number;
  message: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  TIMEOUT: "Connexion lente. Vérifiez votre réseau et réessayez.",
  NETWORK_ERROR: "Problème de connexion internet. Vérifiez votre réseau.",
  OFFLINE: "Vous êtes hors ligne. Vérifiez votre connexion internet.",

  // Authentication errors
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect.",
  USER_NOT_FOUND: "Cet utilisateur n'existe pas.",
  UNAUTHORIZED: "Vous devez vous connecter.",
  FORBIDDEN: "Vous n'avez pas la permission d'accéder à cette ressource.",

  // Validation errors
  VALIDATION_ERROR: "Vérifiez vos données et réessayez.",
  INVALID_EMAIL: "Adresse email invalide.",
  PASSWORD_TOO_WEAK: "Le mot de passe est trop faible.",
  USER_EXISTS: "Cet email est déjà utilisé.",

  // Server errors
  SERVER_ERROR:
    "Service temporairement indisponible. Réessayez dans quelques instants.",
  INTERNAL_ERROR: "Une erreur interne s'est produite.",

  // Data errors
  NOT_FOUND: "Ressource non trouvée.",
  NO_DATA: "Aucune donnée disponible.",
};

const ERROR_TITLES: Record<string, string> = {
  TIMEOUT: "Délai dépassé",
  NETWORK_ERROR: "Erreur réseau",
  INVALID_CREDENTIALS: "Connexion échouée",
  SERVER_ERROR: "Service indisponible",
  VALIDATION_ERROR: "Données invalides",
};

/**
 * Hook pour gérer les erreurs API avec messages user-friendly
 * Masque les détails techniques (WordPress, URLs, etc.)
 */
export function useApiError() {
  const showError = useCallback((error: unknown, customMessage?: string) => {
    logger.error("[useApiError]", error);

    let code = "SERVER_ERROR";
    let status = 500;
    let message = customMessage || "Une erreur est survenue";

    if (error instanceof Error) {
      // Déterminer le code d'erreur
      if (
        error.message.includes("timeout") ||
        error.message.includes("AbortError")
      ) {
        code = "TIMEOUT";
      } else if (error.message.includes("Failed to fetch")) {
        code = "NETWORK_ERROR";
      } else if (
        error.message.includes("network") ||
        error.message.includes("offline")
      ) {
        code = "OFFLINE";
      }

      // Parser les réponses API
      if (error.message.includes("401")) {
        code = "UNAUTHORIZED";
        status = 401;
      } else if (error.message.includes("403")) {
        code = "FORBIDDEN";
        status = 403;
      } else if (error.message.includes("404")) {
        code = "NOT_FOUND";
        status = 404;
      } else if (error.message.includes("500")) {
        code = "SERVER_ERROR";
        status = 500;
      }
    }

    // Utiliser le message personnalisé ou le message par défaut
    message = ERROR_MESSAGES[code] || message;

    // Afficher le toast avec titre et description
    const Toast = Swal.mixin({
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: false,
    });

    Toast.fire({
      icon: "error",
      title: ERROR_TITLES[code] || "Erreur",
      text: message,
    });

    return { code, status, message };
  }, []);

  const handleApiError = useCallback(
    (response: Response): ApiError => {
      let code = "SERVER_ERROR";
      let message = ERROR_MESSAGES[code];

      if (response.status === 401) {
        code = "UNAUTHORIZED";
        message = ERROR_MESSAGES[code];
      } else if (response.status === 403) {
        code = "FORBIDDEN";
        message = ERROR_MESSAGES[code];
      } else if (response.status === 404) {
        code = "NOT_FOUND";
        message = ERROR_MESSAGES[code];
      } else if (response.status >= 400 && response.status < 500) {
        code = "VALIDATION_ERROR";
        message = ERROR_MESSAGES[code];
      }

      showError(new Error(message), message);

      return {
        code,
        status: response.status,
        message,
      };
    },
    [showError],
  );

  return { showError, handleApiError };
}
