"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { AuthApi } from "@/infrastructure/api/auth-api";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import {
  clearPendingEmailAuth,
  getPendingEmailAuth,
} from "@/lib/account-auth";
import { getErrorMapping, parseApiError } from "@/shared/helpers/error-mapping";
import logger from "@/shared/helpers/logger";

export const dynamic = "force-dynamic";

type VerifyStatus = "loading" | "success" | "error" | "already" | "connecting";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useLocalAuth();
  const [status, setStatus] = useState<VerifyStatus>("loading");
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

    const verifyEmail = async () => {
      try {
        const data = await AuthApi.verifyEmail(token);
        setStatus("success");
        setMessage(
          data.message ||
            "Votre email a été vérifié avec succès. Connexion en cours…",
        );

        const pending = getPendingEmailAuth();
        if (pending?.email && pending.password) {
          setStatus("connecting");
          try {
            const result = await login({
              email: pending.email,
              password: pending.password,
            });
            clearPendingEmailAuth();
            router.replace(result.redirectUrl || "/student-dashboard");
            return;
          } catch (loginErr) {
            logger.error("Auto-login après vérification email:", loginErr);
            const emailForLogin = pending.email;
            clearPendingEmailAuth();
            setStatus("success");
            setMessage(
              "Votre email est vérifié. Connectez-vous avec votre mot de passe.",
            );
            setTimeout(() => {
              router.push(
                `/login?${new URLSearchParams({
                  email: emailForLogin,
                  verified: "1",
                }).toString()}`,
              );
            }, 2000);
            return;
          }
        }

        setTimeout(() => {
          router.push("/login?verified=1");
        }, 2000);
      } catch (err) {
        logger.error("Erreur de vérification:", err);
        const parsed = parseApiError(err);
        const errorCode = parsed.code;

        if (errorCode === "EMAIL_ALREADY_VERIFIED") {
          setStatus("already");
          setMessage(
            "Votre email a déjà été vérifié. Vous pouvez vous connecter à votre compte.",
          );
          return;
        }

        setStatus("error");
        if (errorCode === "TOKEN_INVALID") {
          setMessage(
            "Le lien de vérification est invalide. Veuillez demander un nouveau lien.",
          );
        } else if (errorCode === "TOKEN_EXPIRED") {
          setMessage(
            "Le lien de vérification a expiré. Veuillez demander un nouveau lien.",
          );
        } else {
          setMessage(getErrorMapping(err).message);
        }
      }
    };

    void verifyEmail();
  }, [token, router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {(status === "loading" || status === "connecting") && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {status === "connecting"
                  ? "Connexion en cours…"
                  : "Vérification en cours..."}
              </h1>
              <p className="text-gray-600">
                {status === "connecting"
                  ? "Préparation de votre espace"
                  : "Patientez quelques secondes"}
              </p>
            </>
          )}

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
                  onClick={() => router.push("/verify-email-pending")}
                  variant="outline"
                  className="w-full"
                >
                  Renvoyer un lien
                </Button>
              </div>
            </>
          )}

          {status === "already" && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-green-600">
                Email déjà vérifié
              </h1>
              <p className="text-gray-600 mb-6 whitespace-pre-wrap">
                {message}
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Se connecter
              </Button>
            </>
          )}

          <p className="text-sm text-gray-500 mt-6">
            <Link href="/" className="text-blue-600 hover:underline">
              Retour à l&apos;accueil
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#002c75]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
