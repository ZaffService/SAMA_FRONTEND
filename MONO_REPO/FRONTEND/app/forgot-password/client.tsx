"use client";

import React, { useState } from "react";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Veuillez entrer votre adresse email");
      return;
    }

    setIsLoading(true);

    // Simulation de l'envoi
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden p-4">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-red-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* BIBOCOM Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-3xl font-bold text-blue-600">BIBOCOM</span>
              <span className="text-xs font-semibold text-red-500 bg-red-100 px-2 py-1 rounded">
                DIGITAL
              </span>
            </div>
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            {/* Success Icon */}
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
                📧 Vérifiez votre boîte de réception et cliquez sur le lien pour
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
              Vous n'avez pas reçu l'email ?{" "}
              <button
                onClick={() => setIsSuccess(false)}
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
      {/* Back Button Mobile */}
      <div className="lg:hidden flex items-center justify-start px-4 py-3 border-b bg-white sticky top-0 z-20">
        <button
          onClick={() => (window.location.href = "/login")}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </button>
      </div>

      {/* Back Button Desktop */}
      <div className="hidden lg:block absolute top-4 left-4 z-10">
        <button
          onClick={() => (window.location.href = "/login")}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la connexion
        </button>
      </div>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md">
          {/* BIBOCOM Logo Mobile */}
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
              Pas de problème. Entrez votre adresse email et nous vous enverrons
              un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
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
                    setError("");
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer le lien de réinitialisation"
              )}
            </button>
          </div>

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

      {/* Right Side - Info (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-40 right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-md text-white relative z-10">
          {/* BIBOCOM Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-3xl font-bold text-white">BIBOCOM</span>
              <span className="text-xs font-semibold text-red-500 bg-white px-2 py-1 rounded">
                DIGITAL
              </span>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                <Mail className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Réinitialisation sécurisée
            </h2>
            <p className="text-white/80 text-sm">
              Nous vous enverrons un lien sécurisé pour réinitialiser votre mot
              de passe
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    Recevez le lien
                  </h4>
                  <p className="text-xs text-white/70">
                    Un email avec un lien sécurisé vous sera envoyé
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    Cliquez sur le lien
                  </h4>
                  <p className="text-xs text-white/70">
                    Accédez à la page de réinitialisation sécurisée
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    Créez un nouveau mot de passe
                  </h4>
                  <p className="text-xs text-white/70">
                    Choisissez un mot de passe fort et sécurisé
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/20">
            <p className="text-xs text-white/70 text-center">
              Le lien de réinitialisation expire après 1 heure pour votre
              sécurité
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
