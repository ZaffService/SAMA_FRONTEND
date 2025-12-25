"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { AuthApi } from "@/infrastructure/api/auth-api";

export const dynamic = "force-dynamic";

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(
        "Lien de vérification invalide ou manquant. Veuillez cliquer sur le lien reçu dans votre email.",
      );
      return;
    }

    // Appeler l'endpoint backend pour vérifier l'email
    const verifyEmail = async () => {
      try {
        console.log("🔍 Vérification de l'email avec le token:", token);

        const data = await AuthApi.verifyEmail(token);
        console.log("📊 Réponse de vérification:", data);

        // ✅ Email vérifié avec succès!
        // Afficher le message de succès
        setStatus("success");
        setMessage(
          data.message || "Votre email a été vérifié avec succès! Vous pouvez maintenant vous connecter.",
        );

        // Redirection vers LOGIN après 2 secondes
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (err) {
        console.error("❌ Erreur de vérification:", err);
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "Erreur lors de la vérification",
        );
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Loading State */}
          {status === "loading" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center animate-spin">
                  <Loader2 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">
                Vérification en cours...
              </h1>
              <p className="text-gray-600">Patientez quelques secondes</p>
            </>
          )}

          {/* Success State */}
          {status === "success" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-green-600">
                Succès !
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button
                onClick={() => router.push("/login")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Se connecter
              </Button>
            </>
          )}

          {/* Error State */}
          {status === "error" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-red-600">
                Erreur de vérification
              </h1>
              <p className="text-gray-600 mb-6 whitespace-pre-wrap">
                {message}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                >
                  Se connecter
                </Button>
                <Button
                  onClick={() => router.push("/register")}
                  variant="outline"
                  className="w-full"
                >
                  S'inscrire à nouveau
                </Button>
              </div>
            </>
          )}

          <p className="text-sm text-gray-500 mt-6">
            <Link href="/" className="text-blue-600 hover:underline">
              Retour à l'accueil
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
