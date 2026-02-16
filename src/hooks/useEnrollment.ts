"use client";

import { useState, useCallback, useEffect } from "react";
import Cookies from "js-cookie";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { PaymentApi } from "@/infrastructure/api/payment-api";
import {
  EnrollmentError,
  EnrollmentErrorCode,
  PendingEnrollment,
  PaymentStatus,
} from "@/types/enrollment";
import logger from "@/shared/helpers/logger";

interface UseEnrollmentReturn {
  // States
  isEnrolled: boolean;
  isLoading: boolean;
  isRedirecting: boolean;
  error: EnrollmentError | null;
  paymentStatus: PaymentStatus | null;
  courseId: string | null;

  // Actions
  enroll: (
    courseId: string,
  ) => Promise<{ paymentUrl?: string; enrolled?: boolean }>;
  checkStatus: (courseId: string) => Promise<boolean>;
  clearError: () => void;
  resetState: () => void;

  // Payment callback
  handlePaymentReturn: (token: string) => Promise<void>;

  // Utility
  getPendingEnrollment: () => PendingEnrollment | null;
  clearPendingEnrollment: () => void;
}

const ENROLLMENT_COOKIE_NAME = "pendingEnrollment";
const ENROLLMENT_COOKIE_EXPIRY = 1; // 1 day

export function useEnrollment(): UseEnrollmentReturn {
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [error, setError] = useState<EnrollmentError | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null,
  );
  const [courseId, setCourseId] = useState<string | null>(null);

  /**
   * Clear pending enrollment cookies
   */
  const clearPendingEnrollment = useCallback(() => {
    logger.log("🗑️ [useEnrollment] Nettoyage des cookies d'inscription");
    Cookies.remove(ENROLLMENT_COOKIE_NAME);
    sessionStorage.removeItem("pendingCourseId");
    sessionStorage.removeItem("pendingEnrollment");
  }, []);

  /**
   * Get pending enrollment from cookies
   */
  const getPendingEnrollment = useCallback((): PendingEnrollment | null => {
    try {
      const data = Cookies.get(ENROLLMENT_COOKIE_NAME);
      if (!data) {
        logger.log("ℹ️ [useEnrollment] Aucune inscription en attente trouvée");
        return null;
      }

      const pending: PendingEnrollment = JSON.parse(data);
      logger.log("📋 [useEnrollment] Inscription en attente:", pending);
      return pending;
    } catch (err) {
      logger.error("❌ [useEnrollment] Erreur lecture cookie:", err);
      return null;
    }
  }, []);

  /**
   * Store pending enrollment in cookies
   */
  const storePendingEnrollment = useCallback(
    (courseId: string, paymentToken?: string) => {
      const pending: PendingEnrollment = {
        courseId,
        timestamp: Date.now(),
        paymentToken,
        status: "pending",
      };

      logger.log("💾 [useEnrollment] Stockage inscription en cours:", pending);

      Cookies.set(ENROLLMENT_COOKIE_NAME, JSON.stringify(pending), {
        expires: ENROLLMENT_COOKIE_EXPIRY,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      sessionStorage.setItem("pendingCourseId", courseId);
      sessionStorage.setItem("pendingEnrollment", "true");
    },
    [],
  );

  /**
   * Enroll in a course (free or paid)
   */
  const enroll = useCallback(
    async (
      id: string,
    ): Promise<{ paymentUrl?: string; enrolled?: boolean }> => {
      setIsLoading(true);
      setError(null);
      setCourseId(id);

      try {
        logger.log(
          `🔄 [useEnrollment] Tentative d'inscription au cours: ${id}`,
        );

        // Check if already enrolled
        const alreadyEnrolled = await CoursesApi.checkEnrollmentStatus(id);
        if (alreadyEnrolled) {
          logger.log("✅ [useEnrollment] Utilisateur déjà inscrit");
          setIsEnrolled(true);
          return { enrolled: true };
        }

        // Attempt to follow the course
        const result = await CoursesApi.followCourse(id);

        // ✅ GESTION DES RÉSULTATS
        if (result.status === "DUPLICATE") {
          // Vérifier si l'utilisateur est maintenant inscrit
          const checkResult = await CoursesApi.checkEnrollmentStatus(id);
          if (checkResult) {
            logger.log(
              "✅ [useEnrollment] Inscription confirmée malgré duplicate",
            );
            setIsEnrolled(true);
            setPaymentStatus("COMPLETED");
            clearPendingEnrollment();
            return { enrolled: true };
          }
        }

        if (result.payment_url) {
          // 🔄 Paid course - Redirect to PayDunya
          logger.log(
            "💳 [useEnrollment] Redirection vers paiement:",
            result.payment_url,
          );
          setIsRedirecting(true);
          setPaymentStatus("PENDING");

          // Store pending enrollment
          storePendingEnrollment(id, result.payment_url);

          // Redirect to payment
          window.location.href = result.payment_url;

          return { paymentUrl: result.payment_url };
        } else if (result.course && result.status === "ACTIVE") {
          // ✅ Free course - Enrollment successful
          logger.log("✅ [useEnrollment] Inscription gratuite réussie");
          setIsEnrolled(true);
          setPaymentStatus("COMPLETED");
          clearPendingEnrollment();

          return { enrolled: true };
        } else {
          // Unexpected response
          logger.warn("⚠️ [useEnrollment] Réponse inattendue:", result);
          throw new Error("Réponse inattendue du serveur");
        }
      } catch (err) {
        logger.error("❌ [useEnrollment] Erreur d'inscription:", err);

        // Handle specific error codes
        let errorCode: EnrollmentErrorCode = EnrollmentErrorCode.UNKNOWN_ERROR;
        let errorMessage = "Une erreur s'est produite lors de l'inscription";

        if (err instanceof Error) {
          if (err.message.includes("401") || err.message.includes("TOKEN")) {
            errorCode = EnrollmentErrorCode.TOKEN_MISSING;
          } else if (
            err.message.includes("404") ||
            err.message.includes("not found")
          ) {
            errorCode = EnrollmentErrorCode.COURSE_NOT_FOUND;
          } else if (
            err.message.includes("403") ||
            err.message.includes("already enrolled")
          ) {
            errorCode = EnrollmentErrorCode.ALREADY_ENROLLED;
          } else if (err.message.includes("500")) {
            errorCode = EnrollmentErrorCode.SERVER_ERROR;
          } else if (
            err.message.includes("network") ||
            err.message.includes("fetch")
          ) {
            errorCode = EnrollmentErrorCode.NETWORK_ERROR;
          }
        }

        const enrollmentError: EnrollmentError = {
          code: errorCode,
          message: errorMessage,
          action:
            errorCode === EnrollmentErrorCode.TOKEN_MISSING ? "login" : "retry",
        };

        setError(enrollmentError);
        setPaymentStatus("ERROR");

        throw err;
      } finally {
        setIsLoading(false);
        setIsRedirecting(false);
      }
    },
    [storePendingEnrollment, clearPendingEnrollment],
  );

  /**
   * Check enrollment status for a course
   */
  const checkStatus = useCallback(async (id: string): Promise<boolean> => {
    try {
      logger.log(`🔍 [useEnrollment] Vérification statut inscription: ${id}`);

      const isEnrolledStatus = await CoursesApi.checkEnrollmentStatus(id);

      if (isEnrolledStatus) {
        logger.log("✅ [useEnrollment] Utilisateur inscrit");
        setIsEnrolled(true);
        setPaymentStatus("COMPLETED");
      } else {
        logger.log("ℹ️ [useEnrollment] Utilisateur non inscrit");
        setIsEnrolled(false);
      }

      return isEnrolledStatus;
    } catch (err) {
      logger.error("❌ [useEnrollment] Erreur vérification statut:", err);
      return false;
    }
  }, []);

  /**
   * Handle payment return from PayDunya
   */
  const handlePaymentReturn = useCallback(
    async (token: string): Promise<void> => {
      setIsLoading(true);
      setPaymentStatus("VERIFYING");

      try {
        logger.log(
          `🔍 [useEnrollment] Vérification paiement avec token: ${token}`,
        );

        // Update pending enrollment status
        const pending = getPendingEnrollment();
        if (pending) {
          pending.status = "processing";
          Cookies.set(ENROLLMENT_COOKIE_NAME, JSON.stringify(pending), {
            expires: ENROLLMENT_COOKIE_EXPIRY,
          });
        }

        // Verify payment with backend
        const result = await PaymentApi.verifyPayment(token);

        if (result.status === "success") {
          logger.log("✅ [useEnrollment] Paiement confirmé");
          setPaymentStatus("COMPLETED");
          setIsEnrolled(true);
          clearPendingEnrollment();

          // Navigate to course or show success
          if (result.courseId) {
            setCourseId(result.courseId);
          }
        } else if (result.status === "pending") {
          logger.log("⏳ [useEnrollment] Paiement en attente");
          setPaymentStatus("PENDING");
        } else {
          logger.error("❌ [useEnrollment] Paiement échoué:", result);
          setPaymentStatus("ERROR");
          setError({
            code: EnrollmentErrorCode.PAYMENT_FAILED,
            message: result.message || "Le paiement a échoué",
            action: "retry",
          });
        }
      } catch (err) {
        logger.error("❌ [useEnrollment] Erreur vérification paiement:", err);

        // Check if already enrolled despite error
        const pending = getPendingEnrollment();
        if (pending) {
          try {
            const alreadyEnrolled = await CoursesApi.checkEnrollmentStatus(
              pending.courseId,
            );
            if (alreadyEnrolled) {
              logger.log(
                "✅ [useEnrollment] Utilisateur déjà inscrit (vérification par cours)",
              );
              setPaymentStatus("COMPLETED");
              setIsEnrolled(true);
              clearPendingEnrollment();
              return;
            }
          } catch {
            // Continue to error
          }
        }

        setPaymentStatus("ERROR");
        setError({
          code: EnrollmentErrorCode.NETWORK_ERROR,
          message: "Erreur lors de la vérification du paiement",
          action: "retry",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [getPendingEnrollment, clearPendingEnrollment],
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    logger.log("🧹 [useEnrollment] Nettoyage erreur");
    setError(null);
  }, []);

  /**
   * Reset all states
   */
  const resetState = useCallback(() => {
    logger.log("🔄 [useEnrollment] Réinitialisation état");
    setIsEnrolled(false);
    setIsLoading(false);
    setIsRedirecting(false);
    setError(null);
    setPaymentStatus(null);
    setCourseId(null);
  }, []);

  /**
   * Check for pending enrollment on mount
   */
  useEffect(() => {
    const pending = getPendingEnrollment();
    if (pending) {
      logger.log(
        "📋 [useEnrollment] Inscription en attente détectée au montage",
      );
      setCourseId(pending.courseId);

      // Check if enrollment was completed via webhook
      checkStatus(pending.courseId).then((enrolled) => {
        if (enrolled) {
          clearPendingEnrollment();
        }
      });
    }
  }, [getPendingEnrollment, checkStatus, clearPendingEnrollment]);

  return {
    isEnrolled,
    isLoading,
    isRedirecting,
    error,
    paymentStatus,
    courseId,
    enroll,
    checkStatus,
    clearError,
    resetState,
    handlePaymentReturn,
    getPendingEnrollment,
    clearPendingEnrollment,
  };
}
