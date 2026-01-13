"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePayment } from "@/application/use-cases/usePayment";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import Cookies from 'js-cookie';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { verifyPayment } = usePayment();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [message, setMessage] = useState("Vérification du paiement...");

  useEffect(() => {
    if (!token) {
      setStatus("failed");
      return;
    }

    console.log(`🔍 PaymentSuccess: Token reçu: ${token}`);

    // APPEL API RÉEL - PAS DE SIMULATION
    verifyPayment(token)
      .then(async (result) => {
        console.log(`🔍 Résultat vérification:`, result);

        let finalCourseId = result.courseId;
        if (result.status === "success" && !finalCourseId) {
          // Récupérer le courseId sauvegardé si non fourni par le backend
          finalCourseId = Cookies.get('pendingCourseId') || undefined;
          console.log(`🔍 CourseId récupéré des cookies: ${finalCourseId}`);
        }

        if (result.status === "success" && finalCourseId) {
          // Inscrire l'utilisateur au cours (au cas où l'IPN n'a pas fonctionné)
          setMessage("Inscription au cours en cours...");
          try {
            await CoursesApi.enrollUser(finalCourseId);

            setStatus("success");
            setCourseId(finalCourseId);
            setMessage("Paiement réussi! Inscription confirmée.");

            // Marquer que le paiement vient d'être effectué
            Cookies.set('justPaidCourse', finalCourseId, { expires: 1 });

            // Nettoyer le stockage
            Cookies.remove('pendingCourseId');

            setTimeout(() => {
              router.push(`/course-details/${finalCourseId}`);
            }, 2000);
          } catch (enrollError) {
            console.error("Erreur inscription:", enrollError);
            // Même si l'inscription échoue, le paiement est validé
            setStatus("success");
            setMessage("Paiement réussi! Redirection...");
            Cookies.set('justPaidCourse', finalCourseId, { expires: 1 });
            Cookies.remove('pendingCourseId');
            setTimeout(() => {
              router.push(`/course-details/${finalCourseId}`);
            }, 2000);
          }
        } else {
          setStatus("failed");
          setMessage("Le paiement n'a pas pu être vérifié");
          // Nettoyer en cas d'échec
          Cookies.remove('pendingCourseId');
        }
      })
      .catch((error) => {
        console.error("❌ Erreur vérification paiement:", error);
        setStatus("failed");
        setMessage(`Erreur lors de la vérification du paiement: ${error.message}`);
        // Nettoyer en cas d'erreur
        Cookies.remove('pendingCourseId');
      });
  }, [token, verifyPayment, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Vérification du paiement en cours...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl text-green-600 mb-4">✓</div>
          <h1 className="text-3xl font-bold mb-2">Paiement réussi !</h1>
          <p className="text-gray-600">Vous êtes maintenant inscrit au cours.</p>
          <p className="text-sm text-gray-500 mt-2">Redirection automatique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-6xl text-red-600 mb-4">✗</div>
        <h1 className="text-3xl font-bold mb-2">Échec du paiement</h1>
        <p className="text-gray-600 mb-4">Le paiement n'a pas pu être vérifié.</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}