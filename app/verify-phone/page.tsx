"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, Loader2, Info } from "lucide-react";
import { AuthApi } from "@/infrastructure/api/auth-api";
import {
  getErrorMapping,
  isSmsDeliveryError,
  parseApiError,
} from "@/shared/helpers/error-mapping";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import {
  AUTH_PHONE_FLOW,
  clearPendingPhoneAuth,
  formatFullPhone,
  getPendingPhoneAuth,
  matchesPendingPhoneAuth,
} from "@/lib/phone-auth";
import logger from "@/shared/helpers/logger";

export const dynamic = "force-dynamic";

type VerifyStatus =
  | "idle"
  | "loading"
  | "success"
  | "connecting"
  | "error"
  | "otp_expired";

function VerifyPhoneContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useLocalAuth();
  const indicatif = searchParams.get("indicatif") || "+221";
  const telephone = searchParams.get("telephone") || "";
  const fromParam = searchParams.get("from");
  const fromLogin = fromParam === "login";
  const fromForgotPassword = fromParam === "forgot-password";

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  const pendingAuth = getPendingPhoneAuth();
  const hasPendingAutoLogin = matchesPendingPhoneAuth(
    pendingAuth,
    indicatif,
    telephone,
  );

  useEffect(() => {
    if (!telephone) {
      setStatus("error");
      setMessage(AUTH_PHONE_FLOW.missingPhone);
      return;
    }
    if (fromLogin) {
      setMessage(AUTH_PHONE_FLOW.otpSentOnLogin);
    } else if (fromForgotPassword) {
      setMessage(AUTH_PHONE_FLOW.otpSentOnForgotPassword);
    }
  }, [telephone, fromLogin, fromForgotPassword]);

  const completeRegistrationFlow = async () => {
    const pending = getPendingPhoneAuth();

    if (!matchesPendingPhoneAuth(pending, indicatif, telephone)) {
      setStatus("success");
      setMessage(
        fromLogin
          ? AUTH_PHONE_FLOW.verifiedLoginFallback
          : "Votre numéro a été vérifié. Vous pouvez vous connecter.",
      );
      setTimeout(() => {
        const params = new URLSearchParams({
          verified: "1",
          indicatif,
          telephone,
        });
        router.push(`/login?${params.toString()}`);
      }, 2000);
      return;
    }

    setStatus("success");
    setMessage(
      hasPendingAutoLogin
        ? fromLogin
          ? "Numéro vérifié. Connexion en cours..."
          : AUTH_PHONE_FLOW.accountCreated
        : "Votre numéro a été vérifié.",
    );

    setTimeout(() => setStatus("connecting"), 600);

    try {
      const result = await login({
        indicatif: pending!.indicatif,
        telephone: pending!.telephone,
        password: pending!.password,
      });

      clearPendingPhoneAuth();
      router.push(result.redirectUrl || "/complete-profile");
    } catch (loginErr) {
      logger.error("Erreur connexion auto après OTP:", loginErr);
      clearPendingPhoneAuth();
      setStatus("success");
      setMessage(AUTH_PHONE_FLOW.verifiedLoginFallback);
      setTimeout(() => {
        const params = new URLSearchParams({
          verified: "1",
          indicatif,
          telephone,
        });
        router.push(`/login?${params.toString()}`);
      }, 2500);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    const cleanOtp = otp.replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      setOtpError("Le code doit contenir 6 chiffres");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      await AuthApi.verifyPhone({
        indicatif,
        telephone,
        otp: cleanOtp,
      });

      if (fromForgotPassword) {
        setStatus("loading");
        setMessage(AUTH_PHONE_FLOW.verifiedForgotPasswordRedirect);

        await AuthApi.requestPasswordResetPhone(indicatif, telephone);
        const params = new URLSearchParams({ indicatif, telephone });
        router.push(`/reset-password-phone?${params.toString()}`);
        return;
      }

      await completeRegistrationFlow();
    } catch (err) {
      logger.error("Erreur vérification téléphone:", err);
      const parsed = parseApiError(err);
      if (parsed.code === "OTP_EXPIRED") {
        setStatus("otp_expired");
        setMessage(AUTH_PHONE_FLOW.otpExpiredMessage);
        return;
      }
      setStatus("error");
      setMessage(getErrorMapping(err).message);
    }
  };

  const handleResend = async (silent = false) => {
    if (!telephone || isResending) return;

    setIsResending(true);
    setOtpError("");
    if (!silent) {
      setMessage("");
    }

    try {
      const data = await AuthApi.sendPhoneOtp({ indicatif, telephone });
      setStatus("idle");
      setMessage(data.message || AUTH_PHONE_FLOW.otpResendSuccess);
    } catch (err) {
      logger.error("Erreur renvoi OTP:", err);
      setStatus("idle");
      setMessage(
        isSmsDeliveryError(err)
          ? AUTH_PHONE_FLOW.otpResendUnavailable
          : getErrorMapping(err).message,
      );
    } finally {
      setIsResending(false);
    }
  };

  const showSuccessScreen = status === "success" || status === "connecting";
  const isFormDisabled =
    !telephone || status === "loading" || isResending;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {showSuccessScreen ? (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  {status === "connecting" ? (
                    <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  )}
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {status === "connecting"
                  ? "Presque terminé !"
                  : fromLogin
                    ? "Numéro vérifié"
                    : "Compte créé avec succès !"}
              </h1>
              <p className="text-muted-foreground mb-3">{message}</p>
              {status === "connecting" ? (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{AUTH_PHONE_FLOW.autoLogin}</p>
                  <p>{AUTH_PHONE_FLOW.redirectDashboard}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Préparation de votre espace...
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">
                  Vérification du téléphone
                </h1>
                <p className="text-sm text-muted-foreground">
                  {AUTH_PHONE_FLOW.verifyIntro}
                </p>
                <p className="text-sm font-semibold mt-2">
                  {formatFullPhone(indicatif, telephone)}
                </p>
              </div>

              {(fromLogin || fromForgotPassword) && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    {fromForgotPassword
                      ? AUTH_PHONE_FLOW.otpSentOnForgotPassword
                      : AUTH_PHONE_FLOW.unverifiedLoginMessage}
                  </span>
                </div>
              )}

              {status === "otp_expired" && message && (
                <div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{message}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-amber-300 bg-white hover:bg-amber-100"
                    onClick={() => handleResend()}
                    disabled={isResending || !telephone}
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      "Renvoyer le code"
                    )}
                  </Button>
                </div>
              )}

              {status === "error" && message && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              {status === "idle" && message && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {message}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <Label htmlFor="otp">Code de vérification</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      if (otpError) setOtpError("");
                      if (status === "otp_expired") setStatus("idle");
                    }}
                    className={`mt-1.5 h-12 text-center text-lg tracking-[0.4em] ${
                      otpError ? "border-red-500" : ""
                    }`}
                    disabled={isFormDisabled}
                  />
                  {otpError && (
                    <p className="text-red-600 text-xs mt-1">{otpError}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#002c75] hover:bg-[#001a4d]"
                  disabled={isFormDisabled}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    "Vérifier mon numéro"
                  )}
                </Button>
              </form>

              <div className="mt-4 space-y-2 text-center text-sm">
                <button
                  type="button"
                  onClick={() => handleResend()}
                  disabled={!telephone || isResending || status === "loading"}
                  className="text-[#002c75] hover:underline disabled:opacity-50"
                >
                  {isResending ? "Envoi en cours..." : "Renvoyer le code"}
                </button>
                <p className="text-xs text-muted-foreground">
                  Vous n&apos;avez pas reçu le code ? Utilisez le bouton ci-dessus.
                </p>
                <p>
                  <Link
                    href={
                      fromForgotPassword
                        ? "/forgot-password"
                        : fromLogin
                          ? "/login"
                          : "/register"
                    }
                    className="text-muted-foreground hover:underline"
                  >
                    {fromForgotPassword
                      ? "Retour à la réinitialisation"
                      : fromLogin
                        ? "Retour à la connexion"
                        : "Retour à l'inscription"}
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#002c75]" />
        </div>
      }
    >
      <VerifyPhoneContent />
    </Suspense>
  );
}
