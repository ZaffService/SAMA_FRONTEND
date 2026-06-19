"use client";

import React, { useState, Suspense } from "react";
import {
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  Smartphone,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthApi } from "@/infrastructure/api/auth-api";
import { getErrorMapping } from "@/shared/helpers/error-mapping";
import {
  formatFullPhone,
  storePendingPhoneAuth,
  validatePassword,
} from "@/lib/phone-auth";
import logger from "@/shared/helpers/logger";

export const dynamic = "force-dynamic";

function ResetPasswordPhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const indicatif = searchParams.get("indicatif") || "+221";
  const telephone = searchParams.get("telephone") || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const handleResend = async () => {
    if (!telephone) {
      return;
    }
    setIsResending(true);
    setError("");
    try {
      const data = await AuthApi.requestPasswordResetPhone(indicatif, telephone);
      setInfoMessage(
        data.message ||
          "Si un compte vérifié est associé à ce numéro, un code de vérification a été envoyé.",
      );
    } catch (err) {
      logger.error("Erreur renvoi OTP reset:", err);
      setError(getErrorMapping(err).message);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanOtp = otp.replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      setError("Le code doit contenir 6 chiffres");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);
    try {
      await AuthApi.resetPasswordPhone({
        indicatif,
        telephone,
        otp: cleanOtp,
        password,
        confirmPassword,
      });
      storePendingPhoneAuth({ indicatif, telephone, password });
      setIsSuccess(true);
      setTimeout(() => {
        const params = new URLSearchParams({
          indicatif,
          telephone,
          reset: "1",
        });
        router.push(`/login?${params.toString()}`);
      }, 2500);
    } catch (err) {
      logger.error("Erreur reset password phone:", err);
      setError(getErrorMapping(err).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!telephone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <p className="text-gray-600">Numéro de téléphone manquant.</p>
          <button
            onClick={() => router.push("/forgot-password")}
            className="text-blue-600 hover:underline font-semibold"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Mot de passe réinitialisé</h1>
          <p className="text-gray-600">
            Redirection vers la connexion avec votre nouveau mot de passe…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      <div className="lg:hidden px-4 py-3 border-b">
        <button
          onClick={() => router.push("/forgot-password")}
          className="inline-flex items-center text-sm text-gray-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 text-gray-800">
              Nouveau mot de passe
            </h1>
            <p className="text-gray-600 text-sm">
              Code envoyé au{" "}
              <strong>{formatFullPhone(indicatif, telephone)}</strong>
            </p>
          </div>

          {infoMessage && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              {infoMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Code OTP <span className="text-red-500">*</span>
              </label>
              <input
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 tracking-widest text-center text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nouveau mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Vous n&apos;avez pas reçu le code ?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-blue-600 hover:underline font-semibold disabled:opacity-50"
            >
              {isResending ? "Envoi..." : "Renvoyer le code"}
            </button>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-6 text-white">
        <div className="max-w-sm text-center">
          <Smartphone className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl font-bold mb-2">Réinitialisation par SMS</h2>
          <p className="text-white/80 text-sm">
            Saisissez le code reçu par SMS puis choisissez un nouveau mot de
            passe sécurisé.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPhonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ResetPasswordPhoneContent />
    </Suspense>
  );
}
