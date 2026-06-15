/**
 * Centralized Error Mapping System
 * Maps backend error codes to user-friendly UI messages
 *
 * Rules:
 * - Always match error.code, never raw message text
 * - Business errors (4xx) show explicit user messages
 * - Server errors (500) show fallback only if no mapping exists
 * - Backend is source of truth, frontend handles UX
 */

export type ErrorAction =
  | "REDIRECT_TO_PAYMENT_OR_ENROLL"
  | "REDIRECT_TO_PAYMENT"
  | "REDIRECT_TO_RESULTS"
  | "RETRY"
  | "LOGOUT"
  | "NONE";

export interface ErrorMapping {
  title: string;
  message: string;
  action: ErrorAction;
}

export interface ParsedApiError {
  code: string;
  message: string;
  timestamp?: string;
  path?: string;
  status?: number;
}

export const ERROR_UI_MAPPING: Record<string, ErrorMapping> = {
  // Authentication errors
  CONFLICTING_OPERATION: {
    title: "Email déjà utilisé",
    message: "Un compte avec cet email existe déjà.",
    action: "NONE",
  },

  EMAIL_NOT_FOUND: {
    title: "Email introuvable",
    message: "Aucun compte trouvé avec cet email",
    action: "NONE",
  },

  INCORRECT_PASSWORD: {
    title: "Mot de passe incorrect",
    message: "Mot de passe incorrect",
    action: "NONE",
  },

  EMAIL_NOT_VERIFIED: {
    title: "Email non vérifié",
    message: "Veuillez vérifier votre email avant de vous connecter",
    action: "NONE",
  },

  INVALID_CREDENTIALS: {
    title: "Identifiants invalides",
    message: "Email ou mot de passe incorrect.",
    action: "NONE",
  },

  UNAUTHORIZED: {
    title: "Session expirée",
    message: "Veuillez vous reconnecter.",
    action: "LOGOUT",
  },

  INVALID_TOKEN: {
    title: "Session invalide",
    message: "Votre session n'est plus valide. Veuillez vous reconnecter.",
    action: "LOGOUT",
  },

  TOKEN_EXPIRED: {
    title: "Session expirée",
    message: "Votre session a expiré. Veuillez vous reconnecter",
    action: "LOGOUT",
  },

  TOKEN_INVALID: {
    title: "Token invalide",
    message: "Token is invalid",
    action: "LOGOUT",
  },

  WEAK_PASSWORD: {
    title: "Mot de passe faible",
    message: "Password does not meet security requirements",
    action: "RETRY",
  },

  // User creation & validation errors
  USER_ALREADY_EXISTS: {
    title: "Utilisateur déjà inscrit",
    message: "Un compte avec cet email existe déjà",
    action: "NONE",
  },

  EMAIL_ALREADY_EXIST: {
    title: "Email déjà utilisé",
    message: "Un compte avec cet email existe déjà.",
    action: "NONE",
  },

  TELEPHONE_ALREADY_EXIST: {
    title: "Téléphone déjà utilisé",
    message: "Un compte avec ce numéro de téléphone existe déjà.",
    action: "NONE",
  },

  TELEPHONE_INVALID: {
    title: "Numéro invalide",
    message: "Le numéro de téléphone n'est pas valide.",
    action: "RETRY",
  },

  TELEPHONE_FORMAT_INVALID: {
    title: "Format invalide",
    message: "Le format du numéro de téléphone est incorrect.",
    action: "RETRY",
  },

  EXTERNAL_SERVICE_ERROR: {
    title: "Service SMS indisponible",
    message:
      "L'envoi du SMS est temporairement indisponible. Réessayez dans quelques instants.",
    action: "RETRY",
  },

  OTP_INVALID: {
    title: "Code invalide",
    message: "Le code de vérification est incorrect. Vérifiez le code reçu par SMS.",
    action: "RETRY",
  },

  OTP_EXPIRED: {
    title: "Code expiré",
    message: "Le code a expiré. Demandez un nouveau code.",
    action: "RETRY",
  },

  PHONE_NOT_VERIFIED: {
    title: "Téléphone non vérifié",
    message: "Veuillez vérifier votre numéro de téléphone avant de vous connecter.",
    action: "RETRY",
  },

  TELEPHONE_ALREADY_VERIFIED: {
    title: "Téléphone déjà vérifié",
    message: "Ce numéro est déjà vérifié. Vous pouvez vous connecter.",
    action: "NONE",
  },

  INDICATEUR_INVALIDE: {
    title: "Indicatif invalide",
    message: "L'indicatif téléphonique n'est pas valide.",
    action: "RETRY",
  },

  INVALID_EMAIL_FORMAT: {
    title: "Email invalide",
    message: "Le format de l'email n'est pas valide.",
    action: "RETRY",
  },

  INVALID_EMAIL: {
    title: "Email invalide",
    message: "L'adresse email n'est pas valide.",
    action: "RETRY",
  },

  EMAIL_ALREADY_VERIFIED: {
    title: "Email déjà vérifié",
    message: "Cette adresse email est déjà vérifiée.",
    action: "NONE",
  },

  TOKEN_MISSING: {
    title: "Token manquant",
    message: "Token d'authentification manquant.",
    action: "LOGOUT",
  },

  TOKEN_REVOKED: {
    title: "Token révoqué",
    message: "Le token a été révoqué.",
    action: "LOGOUT",
  },

  SESSION_EXPIRED: {
    title: "Session expirée",
    message: "Votre session a expiré.",
    action: "LOGOUT",
  },

  UNAUTHORIZED_ACCESS: {
    title: "Accès non autorisé",
    message: "Tentative d'accès non autorisée.",
    action: "LOGOUT",
  },

  ACCESS_DENIED: {
    title: "Accès refusé",
    message: "Accès refusé. Rôle non autorisé.",
    action: "NONE",
  },

  AUTHENTICATION_REQUIRED: {
    title: "Authentification requise",
    message: "L'authentification est requise.",
    action: "LOGOUT",
  },

  USER_CREATION_FAILED: {
    title: "Échec création compte",
    message: "Échec de la création du compte utilisateur.",
    action: "RETRY",
  },

  USER_DISABLED: {
    title: "Compte désactivé",
    message: "Le compte utilisateur a été désactivé.",
    action: "NONE",
  },

  PASSWORD_RESET_FAILED: {
    title: "Échec réinitialisation",
    message: "Échec de la réinitialisation du mot de passe.",
    action: "RETRY",
  },

  // Validation errors
  VALIDATION_ERROR: {
    title: "Données invalides",
    message:
      "Les informations fournies ne sont pas valides. Veuillez vérifier et réessayer.",
    action: "RETRY",
  },

  MISSING_REQUIRED_FIELD: {
    title: "Champ manquant",
    message: "Certains champs obligatoires sont manquants.",
    action: "RETRY",
  },

  // Resource not found errors
  COURSE_NOT_FOUND: {
    title: "Cours non trouvé",
    message: "Ce cours n'existe pas ou a été supprimé.",
    action: "NONE",
  },

  MODULE_NOT_FOUND: {
    title: "Module non trouvé",
    message: "Ce module n'existe pas.",
    action: "NONE",
  },

  LESSON_NOT_FOUND: {
    title: "Leçon non trouvée",
    message: "Cette leçon n'existe pas.",
    action: "NONE",
  },

  QUIZ_NOT_FOUND: {
    title: "Quiz non trouvé",
    message: "Ce quiz n'existe pas.",
    action: "NONE",
  },

  // Course enrollment errors
  COURSE_NOT_ENROLLED: {
    title: "Accès refusé",
    message: "Vous devez vous inscrire ou acheter ce cours pour continuer.",
    action: "REDIRECT_TO_PAYMENT_OR_ENROLL",
  },

  COURSE_PAID_REQUIRED: {
    title: "Cours payant",
    message:
      "Ce cours est payant. Veuillez procéder au paiement pour accéder au contenu.",
    action: "REDIRECT_TO_PAYMENT",
  },

  COURSE_ALREADY_ENROLLED: {
    title: "Déjà inscrit",
    message: "Vous êtes déjà inscrit à ce cours.",
    action: "NONE",
  },

  // Permission errors
  FORBIDDEN: {
    title: "Accès refusé",
    message: "Vous n'avez pas l'autorisation d'accéder à cette ressource.",
    action: "NONE",
  },

  INSUFFICIENT_PERMISSIONS: {
    title: "Permissions insuffisantes",
    message:
      "Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
    action: "NONE",
  },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: {
    title: "Trop de requêtes",
    message:
      "Vous avez effectué trop de requêtes. Veuillez patienter avant de réessayer.",
    action: "RETRY",
  },

  // Server errors (fallback)
  INTERNAL_SERVER_ERROR: {
    title: "Erreur serveur",
    message:
      "Une erreur inattendue est survenue. Veuillez réessayer plus tard.",
    action: "RETRY",
  },

  DATABASE_ERROR: {
    title: "Erreur de base de données",
    message:
      "Une erreur est survenue avec la base de données. Veuillez réessayer.",
    action: "RETRY",
  },

  // Network errors
  NETWORK_ERROR: {
    title: "Erreur de connexion",
    message: "Impossible de se connecter au serveur. Vérifiez votre connexion.",
    action: "RETRY",
  },

  TIMEOUT_ERROR: {
    title: "Délai dépassé",
    message: "La requête a expiré. Veuillez réessayer.",
    action: "RETRY",
  },
};

/**
 * Fallback error for unknown error codes
 */
const FALLBACK_ERROR: ErrorMapping = {
  title: "Erreur inattendue",
  message: "Une erreur inattendue est survenue. Veuillez réessayer.",
  action: "RETRY",
};

/**
 * Parse API error response into structured format
 */
export function parseApiError(error: unknown): ParsedApiError {
  // Handle Error objects
  if (error instanceof Error) {
    const apiError = error as any;
    return {
      code: apiError.code || "UNKNOWN_ERROR",
      message: apiError.message || "Une erreur est survenue",
      timestamp: apiError.timestamp,
      path: apiError.path,
      status: apiError.status,
    };
  }

  // Handle API response objects
  if (error && typeof error === "object") {
    const errorObj = error as any;

    // Check for standard API error format
    if (errorObj.error && errorObj.error.code) {
      return {
        code: errorObj.error.code,
        message: errorObj.error.message || "Une erreur est survenue",
        timestamp: errorObj.error.timestamp,
        path: errorObj.error.path,
        status: errorObj.status || errorObj.statusCode,
      };
    }

    // Check for simple error object
    if (errorObj.code) {
      return {
        code: errorObj.code,
        message: errorObj.message || "Une erreur est survenue",
        timestamp: errorObj.timestamp,
        path: errorObj.path,
        status: errorObj.status,
      };
    }

    // Check for status-based errors
    if (errorObj.status === 401 || errorObj.statusCode === 401) {
      return {
        code: "UNAUTHORIZED",
        message: "Session expirée",
        status: 401,
      };
    }

    if (errorObj.status === 403 || errorObj.statusCode === 403) {
      return {
        code: "FORBIDDEN",
        message: "Accès refusé",
        status: 403,
      };
    }

    if (errorObj.status === 404 || errorObj.statusCode === 404) {
      return {
        code: "NOT_FOUND",
        message: "Ressource non trouvée",
        status: 404,
      };
    }

    if (errorObj.status >= 500 || errorObj.statusCode >= 500) {
      return {
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur serveur",
        status: errorObj.status,
      };
    }
  }

  // Default fallback
  return {
    code: "UNKNOWN_ERROR",
    message: "Une erreur est survenue",
  };
}

/**
 * Get user-friendly error mapping from error code
 */
export function getErrorMapping(error: unknown): ErrorMapping {
  const parsed = parseApiError(error);

  // Check if we have a mapping for this code
  if (ERROR_UI_MAPPING[parsed.code]) {
    return ERROR_UI_MAPPING[parsed.code];
  }

  // Message patterns (before generic 5xx fallback)
  const message = parsed.message.toLowerCase();
  if (
    message.includes("orange") ||
    message.includes("token orange") ||
    (message.includes("sms") && message.includes("token"))
  ) {
    return ERROR_UI_MAPPING.EXTERNAL_SERVICE_ERROR;
  }
  if (message.includes("otp") && message.includes("expir")) {
    return ERROR_UI_MAPPING.OTP_EXPIRED;
  }
  if (message.includes("otp") && message.includes("invalid")) {
    return ERROR_UI_MAPPING.OTP_INVALID;
  }

  // Handle status-based errors without specific code
  if (parsed.status) {
    if (parsed.status === 401) {
      return ERROR_UI_MAPPING.UNAUTHORIZED;
    }
    if (parsed.status === 403) {
      return ERROR_UI_MAPPING.FORBIDDEN;
    }
    if (parsed.status === 404) {
      return ERROR_UI_MAPPING.COURSE_NOT_FOUND;
    }
    if (parsed.status >= 500) {
      return ERROR_UI_MAPPING.INTERNAL_SERVER_ERROR;
    }
  }

  if (message.includes("enroll") || message.includes("inscription")) {
    return ERROR_UI_MAPPING.COURSE_NOT_ENROLLED;
  }
  if (message.includes("payment") || message.includes("paiement")) {
    return ERROR_UI_MAPPING.PAYMENT_FAILED;
  }
  if (message.includes("quiz")) {
    if (message.includes("already") || message.includes("déjà")) {
      return ERROR_UI_MAPPING.QUIZ_ALREADY_SUBMITTED;
    }
    if (message.includes("not available") || message.includes("indisponible")) {
      return ERROR_UI_MAPPING.QUIZ_NOT_AVAILABLE;
    }
  }

  // Return fallback for unknown errors
  return FALLBACK_ERROR;
}

/**
 * Erreur d'envoi SMS (ex. token Orange) — le compte peut déjà exister côté backend.
 */
export function isSmsDeliveryError(error: unknown): boolean {
  const parsed = parseApiError(error);
  if (parsed.code === "EXTERNAL_SERVICE_ERROR") {
    return true;
  }

  const message = parsed.message.toLowerCase();
  return (
    message.includes("orange") ||
    message.includes("token orange") ||
    (message.includes("sms") && message.includes("token")) ||
    message.includes("impossible d'obtenir le token")
  );
}

/**
 * Check if error requires specific action
 */
export function getErrorAction(error: unknown): ErrorAction {
  return getErrorMapping(error).action;
}

/**
 * Check if error is retryable (should show retry option)
 */
export function isRetryableError(error: unknown): boolean {
  const action = getErrorAction(error);
  return action === "RETRY" || action === "REDIRECT_TO_PAYMENT_OR_ENROLL";
}

/**
 * Check if error is authentication-related (should logout)
 */
export function isAuthError(error: unknown): boolean {
  const action = getErrorAction(error);
  return action === "LOGOUT";
}

/**
 * Check if error is payment/enrollment related
 */
export function isPaymentRequiredError(error: unknown): boolean {
  const action = getErrorAction(error);
  return (
    action === "REDIRECT_TO_PAYMENT" ||
    action === "REDIRECT_TO_PAYMENT_OR_ENROLL"
  );
}

/**
 * Create error display object for UI components
 */
export function createErrorDisplay(error: unknown): {
  title: string;
  message: string;
  action: ErrorAction;
  showRetry: boolean;
  showLogout: boolean;
  showPayment: boolean;
} {
  const mapping = getErrorMapping(error);
  return {
    title: mapping.title,
    message: mapping.message,
    action: mapping.action,
    showRetry: mapping.action === "RETRY",
    showLogout: mapping.action === "LOGOUT",
    showPayment:
      mapping.action === "REDIRECT_TO_PAYMENT" ||
      mapping.action === "REDIRECT_TO_PAYMENT_OR_ENROLL",
  };
}

/**
 * Get authentication error message for inline display
 * Maps common backend error messages/codes to French error messages
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!error) return "";

  // First, try to parse the error using the standard error parsing
  const parsedError = parseApiError(error);

  // Check if we have a mapping for the parsed error code
  if (parsedError.code && ERROR_UI_MAPPING[parsedError.code]) {
    return ERROR_UI_MAPPING[parsedError.code].message;
  }

  // Fallback: Handle Error objects with message-based mapping
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Map common English error messages to French
    if (
      message.includes("user with this email already exists") ||
      message.includes("email already exists") ||
      message.includes("user already exists") ||
      message.includes("account already exists")
    ) {
      return "Cet email est déjà utilisé.";
    }
    if (
      message.includes("email not found") ||
      message.includes("user not found") ||
      message.includes("account not found")
    ) {
      return "Cette adresse email n'existe pas.";
    }
    if (
      message.includes("incorrect password") ||
      message.includes("wrong password") ||
      message.includes("invalid password")
    ) {
      return "Le mot de passe saisi est incorrect.";
    }
    if (
      message.includes("email not verified") ||
      message.includes("account not verified") ||
      message.includes("email verification required")
    ) {
      return "Veuillez vérifier votre email avant de vous connecter.";
    }
    if (
      message.includes("invalid credentials") ||
      message.includes("bad credentials") ||
      message.includes("authentication failed") ||
      message.includes("login failed")
    ) {
      return "Email ou mot de passe incorrect.";
    }
    if (
      message.includes("account locked") ||
      message.includes("too many attempts")
    ) {
      return "Compte temporairement verrouillé. Réessayez plus tard.";
    }
    if (message.includes("email already verified")) {
      return "Cet email est déjà vérifié.";
    }
    if (
      message.includes("invalid token") ||
      message.includes("token expired")
    ) {
      return "Lien de vérification invalide ou expiré.";
    }

    // Return the original message if it's already in French or unknown
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string") {
    const message = error.toLowerCase();

    if (
      message.includes("user with this email already exists") ||
      message.includes("email already exists") ||
      message.includes("user already exists") ||
      message.includes("account already exists")
    ) {
      return "Cet email est déjà utilisé.";
    }
    if (
      message.includes("email not found") ||
      message.includes("user not found") ||
      message.includes("account not found")
    ) {
      return "Cette adresse email n'existe pas.";
    }
    if (
      message.includes("incorrect password") ||
      message.includes("wrong password") ||
      message.includes("invalid password")
    ) {
      return "Le mot de passe saisi est incorrect.";
    }
    if (
      message.includes("email not verified") ||
      message.includes("account not verified") ||
      message.includes("email verification required")
    ) {
      return "Veuillez vérifier votre email avant de vous connecter.";
    }
    if (
      message.includes("invalid credentials") ||
      message.includes("bad credentials") ||
      message.includes("authentication failed") ||
      message.includes("login failed")
    ) {
      return "Email ou mot de passe incorrect.";
    }
    if (
      message.includes("account locked") ||
      message.includes("too many attempts")
    ) {
      return "Compte temporairement verrouillé. Réessayez plus tard.";
    }
    if (message.includes("email already verified")) {
      return "Cet email est déjà vérifié.";
    }
    if (
      message.includes("invalid token") ||
      message.includes("token expired")
    ) {
      return "Lien de vérification invalide ou expiré.";
    }

    return error;
  }

  return "Une erreur s'est produite.";
}
