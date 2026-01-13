/**
 * Enrollment Error Codes
 * Comprehensive error handling for enrollment system
 */

export enum EnrollmentErrorCode {
  TOKEN_MISSING = 'TOKEN_MISSING',
  COURSE_NOT_FOUND = 'COURSE_NOT_FOUND',
  ALREADY_ENROLLED = 'ALREADY_ENROLLED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_TIMEOUT = 'PAYMENT_TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Error recovery actions
 */
export type ErrorAction = 'login' | 'retry' | 'contact' | 'home' | 'none';

/**
 * Enrollment error interface
 */
export interface EnrollmentError {
  code: EnrollmentErrorCode;
  message: string;
  action: ErrorAction;
  originalError?: Error;
}

/**
 * Payment verification status
 */
export type PaymentStatus = 
  | 'VERIFYING'    // Checking payment with backend
  | 'COMPLETED'    // Payment confirmed, enrollment created
  | 'PENDING'      // Still waiting (within timeout)
  | 'TIMEOUT'      // Max attempts reached, still pending
  | 'ERROR'        // Payment failed or error occurred
  | 'CANCELLED';   // Payment was cancelled by user

/**
 * Verification state interface
 */
export interface VerificationState {
  status: PaymentStatus;
  attemptCount: number;
  maxAttempts: number;
  courseId?: string;
  error?: string;
}

/**
 * Pending enrollment data stored in cookies
 */
export interface PendingEnrollment {
  courseId: string;
  timestamp: number;
  paymentToken?: string;
  status: 'pending' | 'processing' | 'completed';
}

/**
 * French error messages map
 */
export const ERROR_MESSAGES: Record<EnrollmentErrorCode, { message: string; action: ErrorAction }> = {
  [EnrollmentErrorCode.TOKEN_MISSING]: {
    message: 'Vous devez être connecté pour vous inscrire à un cours.',
    action: 'login'
  },
  [EnrollmentErrorCode.COURSE_NOT_FOUND]: {
    message: 'Ce cours n\'existe pas ou a été supprimé.',
    action: 'home'
  },
  [EnrollmentErrorCode.ALREADY_ENROLLED]: {
    message: 'Vous êtes déjà inscrit à ce cours.',
    action: 'none'
  },
  [EnrollmentErrorCode.PAYMENT_FAILED]: {
    message: 'Le paiement a échoué. Veuillez réessayer ou contacter le support.',
    action: 'retry'
  },
  [EnrollmentErrorCode.PAYMENT_PENDING]: {
    message: 'Votre paiement est en cours de vérification. Veuillez patienter...',
    action: 'none'
  },
  [EnrollmentErrorCode.PAYMENT_TIMEOUT]: {
    message: 'La vérification du paiement a expiré. Veuillez contacter le support.',
    action: 'contact'
  },
  [EnrollmentErrorCode.NETWORK_ERROR]: {
    message: 'Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer.',
    action: 'retry'
  },
  [EnrollmentErrorCode.VALIDATION_FAILED]: {
    message: 'Les données fournies sont invalides. Veuillez réessayer.',
    action: 'retry'
  },
  [EnrollmentErrorCode.SERVER_ERROR]: {
    message: 'Erreur serveur. Veuillez réessayer plus tard ou contacter le support.',
    action: 'contact'
  },
  [EnrollmentErrorCode.UNKNOWN_ERROR]: {
    message: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
    action: 'retry'
  }
};

/**
 * Get enrollment error from API response
 */
export function getEnrollmentError(errorData: any): EnrollmentError {
  // Handle different error response formats
  const code = errorData?.errorCode || errorData?.code || errorData?.error?.code || EnrollmentErrorCode.UNKNOWN_ERROR;
  const message = errorData?.message || errorData?.error?.message || errorData?.errorMessage;
  
  // Validate the code
  const validCode = Object.values(EnrollmentErrorCode).includes(code as EnrollmentErrorCode)
    ? code as EnrollmentErrorCode
    : EnrollmentErrorCode.UNKNOWN_ERROR;
  
  const errorInfo = ERROR_MESSAGES[validCode];
  
  return {
    code: validCode,
    message: message || errorInfo.message,
    action: errorInfo.action,
    originalError: errorData instanceof Error ? errorData : undefined
  };
}

/**
 * Get error display properties
 */
export function getErrorDisplay(error: EnrollmentError): {
  icon: string;
  color: string;
  title: string;
} {
  const errorDisplays: Record<EnrollmentErrorCode, { icon: string; color: string; title: string }> = {
    [EnrollmentErrorCode.TOKEN_MISSING]: {
      icon: '🔐',
      color: 'yellow',
      title: 'Connexion requise'
    },
    [EnrollmentErrorCode.COURSE_NOT_FOUND]: {
      icon: '❓',
      color: 'gray',
      title: 'Cours non trouvé'
    },
    [EnrollmentErrorCode.ALREADY_ENROLLED]: {
      icon: '✅',
      color: 'green',
      title: 'Déjà inscrit'
    },
    [EnrollmentErrorCode.PAYMENT_FAILED]: {
      icon: '💳',
      color: 'red',
      title: 'Paiement échoué'
    },
    [EnrollmentErrorCode.PAYMENT_PENDING]: {
      icon: '⏳',
      color: 'yellow',
      title: 'Paiement en attente'
    },
    [EnrollmentErrorCode.PAYMENT_TIMEOUT]: {
      icon: '⏰',
      color: 'orange',
      title: 'Délai dépassé'
    },
    [EnrollmentErrorCode.NETWORK_ERROR]: {
      icon: '🌐',
      color: 'yellow',
      title: 'Erreur de connexion'
    },
    [EnrollmentErrorCode.VALIDATION_FAILED]: {
      icon: '📋',
      color: 'yellow',
      title: 'Validation échouée'
    },
    [EnrollmentErrorCode.SERVER_ERROR]: {
      icon: '🖥️',
      color: 'red',
      title: 'Erreur serveur'
    },
    [EnrollmentErrorCode.UNKNOWN_ERROR]: {
      icon: '❌',
      color: 'gray',
      title: 'Erreur inconnue'
    }
  };

  return errorDisplays[error.code];
}

