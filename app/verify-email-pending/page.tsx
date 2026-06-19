"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info, Loader2, Mail } from "lucide-react";
import { AuthApi } from "@/infrastructure/api/auth-api";
import { getErrorMapping } from "@/shared/helpers/error-mapping";
import { ACCOUNT_VERIFICATION_FLOW } from "@/lib/account-auth";
import logger from "@/shared/helpers/logger";

export const dynamic = "force-dynamic";

function VerifyEmailPendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const fromLogin = searchParams.get("from") === "login";

  const [infoMessage, setInfoMessage] = useState(
    fromLogin ? ACCOUNT_VERIFICATION_FLOW.emailLinkSentOnLogin : "",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!email || isResending) return;

    setIsResending(true);
    setErrorMessage("");

    try {
      const data = await AuthApi.sendEmailVerification(email);
      setInfoMessage(
        data.message || ACCOUNT_VERIFICATION_FLOW.emailResendSuccess,
      );
    } catch (err) {
      logger.error("Erreur renvoi lien email:", err);
      setErrorMessage(getErrorMapping(err).message);
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <p className="text-gray-600">Adresse email manquante.</p>
          <Button onClick={() => router.push("/login")}>Retour à la connexion</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-7 w-7 text-[#002c75]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Vérification de l&apos;email</h1>
            <p className="text-sm text-muted-foreground break-all">{email}</p>
          </div>

          {fromLogin && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{ACCOUNT_VERIFICATION_FLOW.unverifiedEmailMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {infoMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3 text-sm text-muted-foreground mb-6">
            <p>
              Cliquez sur le lien reçu par email pour activer votre compte, puis
              revenez vous connecter.
            </p>
            <p>
              Le lien peut mettre quelques minutes à arriver. Pensez à vérifier
              vos spams.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Renvoyer le lien de vérification"
            )}
          </Button>

          <p className="mt-6 text-center text-sm">
            <Link href="/login" className="text-[#002c75] hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#002c75]" />
        </div>
      }
    >
      <VerifyEmailPendingContent />
    </Suspense>
  );
}
