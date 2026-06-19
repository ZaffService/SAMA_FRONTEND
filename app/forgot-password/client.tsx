"use client";

import React, { useState } from "react";
import {
  Loader2,
  Mail,
  ArrowLeft,
  CheckCircle,
  Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/infrastructure/api/auth-api";
import {
  getPhonePlaceholder,
  getVerifyPhoneUrl,
  sanitizePhoneInput,
  validatePhone,
} from "@/lib/phone-auth";
import { COUNTRIES } from "@/lib/countries";
import logger from "@/shared/helpers/logger";
import {
  getErrorMapping,
  parseApiError,
} from "@/shared/helpers/error-mapping";

type ResetTab = "email" | "phone";

export default function ForgotPassword() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ResetTab>("email");

  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [indicatif, setIndicatif] = useState("+221");
  const [telephone, setTelephone] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    if (!email) {
      setEmailError("Veuillez entrer votre adresse email");
      return;
    }

    setEmailLoading(true);
    try {
      await AuthApi.requestPasswordReset(email);
      setEmailSuccess(true);
    } catch (err: unknown) {
      logger.error("Erreur demande reset email:", err);
      setEmailError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue. Veuillez réessayer.",
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");

    const phoneValidation = validatePhone(telephone, indicatif);
    if (phoneValidation) {
      setPhoneError(phoneValidation);
      return;
    }

    setPhoneLoading(true);
    try {
      await AuthApi.requestPasswordResetPhoneValidated(indicatif, telephone);
      const params = new URLSearchParams({ indicatif, telephone });
      router.push(`/reset-password-phone?${params.toString()}`);
    } catch (err: unknown) {
      logger.error("Erreur demande reset phone:", err);
      const code = parseApiError(err).code?.toUpperCase() || "";

      if (
        code === "TELEPHONE_NOT_VERIFIED" ||
        code === "PHONE_NOT_VERIFIED"
      ) {
        router.push(
          getVerifyPhoneUrl(indicatif, telephone, { fromForgotPassword: true }),
        );
        return;
      }

      setPhoneError(getErrorMapping(err).message);
    } finally {
      setPhoneLoading(false);
    }
  };

  if (emailSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden p-4">
        <div className="absolute inset-0 overflow-hidden opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-red-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              Email envoyé !
            </h1>
            <p className="text-gray-600 mb-6">
              Un lien de réinitialisation a été envoyé à{" "}
              <strong className="text-gray-800">{email}</strong>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <Mail className="inline w-4 h-4 mr-2" />
                Vérifiez votre boîte de réception et cliquez sur le lien pour
                réinitialiser votre mot de passe.
              </p>
            </div>

            <button
              onClick={() => (window.location.href = "/login")}
              className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour à la connexion
            </button>

            <p className="text-sm text-gray-500 mt-6">
              Vous n&apos;avez pas reçu l&apos;email ?{" "}
              <button
                onClick={() => setEmailSuccess(false)}
                className="text-blue-600 hover:underline font-semibold"
              >
                Renvoyer
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      <div className="lg:hidden flex items-center justify-start px-4 py-3 border-b bg-white sticky top-0 z-20">
        <button
          onClick={() => (window.location.href = "/login")}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </button>
      </div>

      <div className="hidden lg:block absolute top-4 left-4 z-10">
        <button
          onClick={() => (window.location.href = "/login")}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la connexion
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-blue-600">BIBOCOM</span>
              <span className="text-xs font-semibold text-red-500 bg-red-100 px-2 py-1 rounded">
                DIGITAL
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 text-gray-800">
              Mot de passe oublié ?
            </h1>
            <p className="text-gray-600 text-sm">
              Choisissez comment réinitialiser votre mot de passe.
            </p>
          </div>

          <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
            <button
              type="button"
              onClick={() => setActiveTab("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                activeTab === "email"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                activeTab === "phone"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Téléphone
            </button>
          </div>

          {activeTab === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Adresse email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      emailError ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-red-500 mt-1">{emailError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={emailLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {emailLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le lien de réinitialisation"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Numéro de téléphone <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={indicatif}
                    onChange={(e) => {
                      setIndicatif(e.target.value);
                      setTelephone("");
                      setPhoneError("");
                    }}
                    className="w-28 px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.indicatif} value={country.indicatif}>
                        {country.indicatif}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder={getPhonePlaceholder(indicatif)}
                    value={telephone}
                    onChange={(e) => {
                      setTelephone(
                        sanitizePhoneInput(e.target.value, indicatif),
                      );
                      setPhoneError("");
                    }}
                    className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      phoneError ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Un code SMS sera envoyé si un compte vérifié est associé à ce
                numéro.
              </p>

              <button
                type="submit"
                disabled={phoneLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {phoneLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Envoi du code...
                  </>
                ) : (
                  "Recevoir un code par SMS"
                )}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-600 mt-6">
            Vous vous souvenez de votre mot de passe ?{" "}
            <button
              onClick={() => (window.location.href = "/login")}
              className="text-blue-600 hover:underline font-semibold"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 items-center justify-center relative overflow-hidden">
        <div className="max-w-md text-white relative z-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
              {activeTab === "email" ? (
                <Mail className="w-12 h-12 text-white" />
              ) : (
                <Smartphone className="w-12 h-12 text-white" />
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {activeTab === "email"
              ? "Réinitialisation par email"
              : "Réinitialisation par SMS"}
          </h2>
          <p className="text-white/80 text-sm">
            {activeTab === "email"
              ? "Nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe."
              : "Recevez un code à 6 chiffres par SMS pour définir un nouveau mot de passe."}
          </p>
        </div>
      </div>
    </div>
  );
}
