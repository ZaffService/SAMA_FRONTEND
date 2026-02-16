"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthApi } from "@/infrastructure/api/auth-api";
import logger from "@/shared/helpers/logger";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const hashParams = typeof window !== "undefined"
        ? new URLSearchParams(window.location.hash.replace(/^#/, ""))
        : new URLSearchParams();

      const getParam = (key: string) =>
        searchParams.get(key) || hashParams.get(key);

      const idToken =
        getParam("id_token") ||
        getParam("access_token") ||
        getParam("credential") ||
        getParam("token");
      const errorParam = getParam("error");
      const stateParam = getParam("state");

      if (typeof window !== "undefined" && window.location.hash) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }

      if (errorParam) {
        setError(`Erreur d'authentification Google: ${errorParam}`);
        return;
      }

      try {
        const expectedState = sessionStorage.getItem("google_oauth_state");
        if (expectedState && stateParam && expectedState !== stateParam) {
          setError("État OAuth invalide. Veuillez réessayer.");
          return;
        }
      } finally {
        try {
          sessionStorage.removeItem("google_oauth_state");
          sessionStorage.removeItem("google_oauth_nonce");
        } catch {
          // Ignore storage errors
        }
      }

      if (!idToken || !idToken.trim()) {
        setError("Token d'authentification manquant");
        return;
      }

      try {
        await AuthApi.loginWithGoogle(idToken);

        // Redirection vers la page d'accueil après succès
        router.push("/");
      } catch (err: any) {
        logger.error("Erreur lors de l'authentification Google:", err);
        setError(err.message || "Erreur lors de l'authentification");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Erreur d'authentification
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-[#002c75] text-white py-2 px-4 rounded hover:bg-[#001a4d] transition-colors"
            >
              Retour à la page de connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#002c75] mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">
          Connexion avec Google en cours...
        </h2>
        <p className="text-gray-500 mt-2">
          Veuillez patienter pendant que nous vérifions votre compte.
        </p>
      </div>
    </div>
  );
}
