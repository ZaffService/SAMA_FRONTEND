"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AccessDenied() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Veuillez vous connecter d'abord.");
  const [countdown, setCountdown] = useState(5);
  const [returnTo, setReturnTo] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer le message et returnTo
    const msg =
      searchParams?.get("message") ||
      sessionStorage.getItem("accessDeniedMessage");
    const returnUrl =
      searchParams?.get("returnTo") || sessionStorage.getItem("returnTo");

    if (msg) setMessage(msg);
    if (returnUrl) setReturnTo(returnUrl);

    // Nettoyer sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("accessDeniedMessage");
      sessionStorage.removeItem("returnTo");
    }
  }, [searchParams]);

  // Redirection automatique après 5 secondes
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/login?returnTo=" + (returnTo || "/student-dashboard"));
      return;
    }

    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router, returnTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Icône */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18z"
              />
            </svg>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-900">
          Accès Requis
        </h1>

        {/* Message */}
        <p className="text-center text-gray-600 mb-6">{message}</p>

        {/* Détails */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Redirection automatique:</strong> Vous serez redirigé vers
            la page de connexion dans{" "}
            <span className="font-bold text-blue-600">{countdown}</span>{" "}
            secondes.
          </p>
        </div>

        {/* Boutons */}
        <div className="flex flex-col gap-3">
          {/* Bouton Login avec returnTo */}
          <Link
            href={`/login?returnTo=${encodeURIComponent(returnTo || "/student-dashboard")}`}
          >
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Aller à la Connexion
            </Button>
          </Link>

          {/* Bouton Retour */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.back()}
          >
            Retour
          </Button>

          {/* Bouton Accueil */}
          <Link href="/">
            <Button variant="ghost" className="w-full">
              Retour à l'Accueil
            </Button>
          </Link>
        </div>

        {/* Info supplémentaire */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Vous n'avez pas de compte?{" "}
            <Link
              href="/register"
              className="text-blue-600 hover:underline font-semibold"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
