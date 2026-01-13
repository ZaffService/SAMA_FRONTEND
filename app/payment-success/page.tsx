"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PaymentApi } from "@/infrastructure/api/payment-api";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import Swal from "sweetalert2";
import { CheckCircle, XCircle, Loader2, ArrowLeft, RefreshCw, Home, MessageCircle } from "lucide-react";
import Cookies from "js-cookie";
import type { PaymentStatus, VerificationState } from "@/types/enrollment";

// Configuration
const POLLING_INTERVAL = 3000; // 3 seconds
const MAX_ATTEMPTS = 20; // 20 * 3s = 60 seconds max
const AUTO_REDIRECT_DELAY = 2000; // 2 seconds after success

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  
  const [state, setState] = useState<VerificationState>({
    status: 'VERIFYING',
    attemptCount: 0,
    maxAttempts: MAX_ATTEMPTS,
    courseId: undefined,
    error: undefined
  });

  const token = searchParams.get("token");
  const statusParam = searchParams.get("status");

  /**
   * Clear all cookies and storage
   */
  const clearPendingEnrollment = useCallback(() => {
    console.log("🗑️ [PaymentSuccess] Nettoyage cookies et storage");
    Cookies.remove("pendingEnrollment");
    sessionStorage.removeItem("pendingCourseId");
    sessionStorage.removeItem("pendingEnrollment");
  }, []);

  /**
   * Verify payment with backend
   */
  const verifyPayment = useCallback(async (paymentToken: string): Promise<{
    success: boolean;
    status: string;
    courseId?: string;
    message?: string;
  }> => {
    try {
      console.log(`🔍 [PaymentSuccess] Vérification paiement, tentative ${state.attemptCount + 1}/${MAX_ATTEMPTS}`);
      
      const result = await PaymentApi.verifyPayment(paymentToken);
      
      console.log("✅ [PaymentSuccess] Réponse vérification:", result);
      
      return {
        success: result.status === "success",
        status: result.status,
        courseId: result.courseId,
        message: result.message
      };
    } catch (error) {
      console.error("❌ [PaymentSuccess] Erreur vérification:", error);
      throw error;
    }
  }, [state.attemptCount]);

  /**
   * Check enrollment status directly
   */
  const checkEnrollmentStatus = useCallback(async (courseId: string): Promise<boolean> => {
    try {
      const isEnrolled = await CoursesApi.checkEnrollmentStatus(courseId);
      console.log(`📊 [PaymentSuccess] Statut inscription pour ${courseId}:`, isEnrolled);
      return isEnrolled;
    } catch (error) {
      console.error("❌ [PaymentSuccess] Erreur vérification inscription:", error);
      return false;
    }
  }, []);

  /**
   * Handle successful payment
   */
  const handleSuccess = useCallback((courseId?: string) => {
    console.log("✅ [PaymentSuccess] Paiement réussi!");
    clearPendingEnrollment();
    
    setState(prev => ({
      ...prev,
      status: 'COMPLETED',
      courseId: courseId || prev.courseId
    }));

    // Auto-redirect after delay
    setTimeout(() => {
      if (courseId) {
        router.push(`/course-details/${courseId}`);
      } else {
        router.push("/mes-apprentissages");
      }
    }, AUTO_REDIRECT_DELAY);
  }, [clearPendingEnrollment, router]);

  /**
   * Handle payment failure
   */
  const handleError = useCallback((errorMessage: string) => {
    console.error("❌ [PaymentSuccess] Erreur paiement:", errorMessage);
    
    setState(prev => ({
      ...prev,
      status: 'ERROR',
      error: errorMessage
    }));
  }, []);

  /**
   * Handle timeout
   */
  const handleTimeout = useCallback(() => {
    console.log("⏰ [PaymentSuccess] Délai dépassé");
    
    setState(prev => ({
      ...prev,
      status: 'TIMEOUT'
    }));
  }, []);

  /**
   * Main verification loop
   */
  const verificationLoop = useCallback(async () => {
    // Check if we should stop
    if (state.status === 'COMPLETED' || state.status === 'ERROR' || state.status === 'TIMEOUT') {
      console.log("🛑 [PaymentSuccess] Arrêt du polling - statut:", state.status);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // Check max attempts
    if (state.attemptCount >= MAX_ATTEMPTS) {
      console.log("⏰ [PaymentSuccess] Nombre max de tentatives atteint");
      handleTimeout();
      return;
    }

    // Increment attempt count
    setState(prev => ({
      ...prev,
      attemptCount: prev.attemptCount + 1
    }));

    try {
      // If we have a token, verify with backend
      if (token) {
        const result = await verifyPayment(token);
        
        if (result.success) {
          handleSuccess(result.courseId);
        } else if (result.status === 'pending' || result.status === 'processing') {
          // Continue polling
          console.log("⏳ [PaymentSuccess] Paiement en attente...");
        } else {
          handleError(result.message || "Le paiement n'a pas pu être confirmé");
        }
      } else if (statusParam === 'completed') {
        // Payment completed via webhook (no token)
        const pendingCourseId = Cookies.get("pendingEnrollment") 
          ? JSON.parse(Cookies.get("pendingEnrollment")!).courseId 
          : sessionStorage.getItem("pendingCourseId");

        if (pendingCourseId) {
          // Verify enrollment status
          const isEnrolled = await checkEnrollmentStatus(pendingCourseId);
          if (isEnrolled) {
            handleSuccess(pendingCourseId);
          } else {
            // Continue polling to wait for webhook
            console.log("⏳ [PaymentSuccess] En attente du webhook...");
          }
        } else {
          // Check enrolled courses
          try {
            const enrolledCourses = await CoursesApi.getEnrolledCourses();
            if (enrolledCourses.length > 0) {
              handleSuccess(enrolledCourses[0].id);
            } else {
              handleError("Aucun cours trouvé. Veuillez contacter le support.");
            }
          } catch {
            handleError("Erreur lors de la vérification de votre inscription.");
          }
        }
      } else if (statusParam === 'cancelled') {
        handleError("Le paiement a été annulé. Vous pouvez réessayer.");
      } else {
        // No token or status - check pending enrollment
        const pendingCourseId = sessionStorage.getItem("pendingCourseId");
        if (pendingCourseId) {
          const isEnrolled = await checkEnrollmentStatus(pendingCourseId);
          if (isEnrolled) {
            handleSuccess(pendingCourseId);
          } else {
            handleError("Inscription non trouvée. Veuillez contacter le support.");
          }
        } else {
          handleError("Statut de paiement inconnu.");
        }
      }
    } catch (error) {
      console.error("❌ [PaymentSuccess] Erreur dans la boucle:", error);
      
      // On network error, continue polling unless we've exceeded max attempts
      if (state.attemptCount >= MAX_ATTEMPTS - 1) {
        handleError("Erreur de connexion. Le serveur ne répond pas.");
      }
    }
  }, [state.status, state.attemptCount, token, statusParam, verifyPayment, handleSuccess, handleError, handleTimeout, checkEnrollmentStatus]);

  /**
   * Start verification on mount
   */
  useEffect(() => {
    console.log("🔄 [PaymentSuccess] Montage du composant, début vérification");
    
    // Initial verification
    verificationLoop();

    // Start polling if not completed
    if (state.status !== 'COMPLETED' && state.status !== 'ERROR' && state.status !== 'TIMEOUT') {
      console.log("🔄 [PaymentSuccess] Démarrage du polling");
      pollingRef.current = setInterval(verificationLoop, POLLING_INTERVAL);
    }

    // Cleanup on unmount
    return () => {
      console.log("🧹 [PaymentSuccess] Démontage - arrêt du polling");
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []); // Run once on mount

  /**
   * Restart verification (for timeout or error states)
   */
  const handleRetry = () => {
    console.log("🔄 [PaymentSuccess] Nouvelle tentative");
    setState({
      status: 'VERIFYING',
      attemptCount: 0,
      maxAttempts: MAX_ATTEMPTS,
      courseId: undefined,
      error: undefined
    });
  };

  /**
   * Navigate to courses
   */
  const handleGoToCourses = () => {
    router.push("/courses");
  };

  /**
   * Navigate to home
   */
  const handleGoHome = () => {
    router.push("/");
  };

  /**
   * Contact support
   */
  const handleContactSupport = () => {
    Swal.fire({
      title: "Contacter le support",
      text: "Envoyez un email à support@bibocomdigital.com avec les détails de votre paiement.",
      icon: "info",
      confirmButtonText: "Envoyer un email",
      confirmButtonColor: "#6366f1",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "mailto:support@bibocomdigital.com";
      }
    });
  };

  /**
   * Calculate estimated time remaining
   */
  const getEstimatedTimeRemaining = () => {
    const remaining = (MAX_ATTEMPTS - state.attemptCount) * (POLLING_INTERVAL / 1000);
    return remaining > 0 ? remaining : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        
        {/* VERIFYING STATE */}
        {state.status === 'VERIFYING' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Vérification en cours...
            </h2>
            <p className="text-gray-600 mb-6">
              Nous vérifions votre paiement auprès de PayDunya.
            </p>
            
            {/* Progress indicator */}
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Tentative {state.attemptCount}/{MAX_ATTEMPTS}</span>
                <span>≈ {getEstimatedTimeRemaining()}s restantes</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(state.attemptCount / MAX_ATTEMPTS) * 100}%` }}
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              Veuillez patienter pendant que nous confirmons votre paiement.
            </p>
          </>
        )}

        {/* COMPLETED STATE */}
        {state.status === 'COMPLETED' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Paiement confirmé !
            </h2>
            <p className="text-gray-600 mb-6">
              Votre inscription a été créée avec succès. Redirection vers votre cours...
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span>Inscription réussie</span>
            </div>
            
            <button
              onClick={() => state.courseId 
                ? router.push(`/course-details/${state.courseId}`) 
                : router.push("/mes-apprentissages")
              }
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
            >
              Accéder à mon cours
            </button>
          </>
        )}

        {/* TIMEOUT STATE */}
        {state.status === 'TIMEOUT' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-100 flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Vérification en attente
            </h2>
            <p className="text-gray-600 mb-6">
              Le serveur met plus de temps que prévu pour confirmer votre paiement. 
              Votre paiement a peut-être déjà été traité.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                💡 Votre inscription a probablement été créée. 
                Cliquez sur "Vérifier à nouveau" pour vérifier votre statut.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Vérifier à nouveau
              </button>
              <button
                onClick={handleGoToCourses}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Voir les autres cours
              </button>
            </div>
          </>
        )}

        {/* ERROR STATE */}
        {state.status === 'ERROR' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Problème avec le paiement
            </h2>
            <p className="text-gray-600 mb-6">
              {state.error || "Une erreur s'est produite lors de la vérification de votre paiement."}
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                💡 Si vous avez effectué un paiement, ne vous inquiétez pas. 
                Notre équipe va vérifier manuellement votre transaction.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Réessayer le paiement
              </button>
              <button
                onClick={handleContactSupport}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Contacter le support
              </button>
              <button
                onClick={handleGoHome}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Retour à l'accueil
              </button>
            </div>
          </>
        )}

        {/* CANCELLED STATE */}
        {statusParam === 'cancelled' && state.status === 'VERIFYING' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Paiement annulé
            </h2>
            <p className="text-gray-600 mb-6">
              Vous avez annulé le processus de paiement. 
              Vous pouvez réessayer quand vous le souhaitez.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Réessayer le paiement
              </button>
              <button
                onClick={handleGoToCourses}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
              >
                Voir les autres cours
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

