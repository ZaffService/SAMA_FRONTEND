"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Lock,
} from "lucide-react";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  // Simuler la récupération du token depuis l'URL
  useEffect(() => {
    // Dans une vraie app: const params = new URLSearchParams(window.location.search)
    // const urlToken = params.get('token')
    const urlToken = "demo-token-123"; // Simulation

    if (!urlToken) {
      setIsTokenValid(false);
    } else {
      setToken(urlToken);
    }
  }, []);

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      newErrors.password =
        "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulation de l'appel API
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);

      // Redirection après 3 secondes
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    }, 2000);
  };

  // Token invalide ou expiré
  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden p-4">
        <div className="absolute inset-0 overflow-hidden opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-red-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-3xl font-bold text-blue-600">BIBOCOM</span>
              <span className="text-xs font-semibold text-red-500 bg-red-100 px-2 py-1 rounded">
                DIGITAL
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              Lien invalide ou expiré
            </h1>
            <p className="text-gray-600 mb-6">
              Ce lien de réinitialisation n'est plus valide. Veuillez demander
              un nouveau lien.
            </p>

            <button
              onClick={() => (window.location.href = "/forgot-password")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Demander un nouveau lien
            </button>

            <p className="text-sm text-gray-500 mt-6">
              <button
                onClick={() => (window.location.href = "/login")}
                className="text-blue-600 hover:underline"
              >
                Retour à la connexion
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Succès
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden p-4">
        <div className="absolute inset-0 overflow-hidden opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-red-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-3xl font-bold text-blue-600">BIBOCOM</span>
              <span className="text-xs font-semibold text-red-500 bg-red-100 px-2 py-1 rounded">
                DIGITAL
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              Mot de passe réinitialisé !
            </h1>
            <p className="text-gray-600 mb-6">
              Votre mot de passe a été modifié avec succès. Vous pouvez
              maintenant vous connecter avec votre nouveau mot de passe.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Redirection vers la page de connexion dans quelques secondes...
              </p>
            </div>

            <button
              onClick={() => (window.location.href = "/login")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Se connecter maintenant
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire de réinitialisation
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
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
              Nouveau mot de passe
            </h1>
            <p className="text-gray-600 text-sm">
              Choisissez un mot de passe fort et sécurisé pour votre compte.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Nouveau mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Nouveau mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors({ ...errors, password: undefined });
                  }}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Minimum caractères</p>
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Confirmer le mot de passe{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword)
                      setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Indicateur de force du mot de passe */}
            {password && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-800 mb-2">
                  Force du mot de passe :
                </p>
                <div className="flex gap-1">
                  <div
                    className={`h-1.5 flex-1 rounded ${password.length >= 8 ? "bg-blue-600" : "bg-gray-300"}`}
                  ></div>
                  <div
                    className={`h-1.5 flex-1 rounded ${password.length >= 10 ? "bg-blue-600" : "bg-gray-300"}`}
                  ></div>
                  <div
                    className={`h-1.5 flex-1 rounded ${password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? "bg-blue-600" : "bg-gray-300"}`}
                  ></div>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            <button
              onClick={() => (window.location.href = "/login")}
              className="text-blue-600 hover:underline font-semibold"
            >
              Retour à la connexion
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Security Info (Hidden on mobile) */}
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
                <Lock className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Sécurité renforcée</h2>
            <p className="text-white/80 text-sm">
              Créez un mot de passe fort pour protéger votre compte
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h4 className="font-semibold text-sm mb-2">
                ✓ Conseils pour un bon mot de passe :
              </h4>
              <ul className="text-xs text-white/70 space-y-1.5">
                <li>• Au moins 6 caractères</li>
                <li>• Utilisez des majuscules et minuscules</li>
                <li>• Incluez des chiffres et symboles</li>
                <li>• Évitez les mots courants</li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h4 className="font-semibold text-sm mb-2">
                {" "}
                Votre sécurité est importante
              </h4>
              <p className="text-xs text-white/70">
                Nous chiffrons toutes vos données et ne partageons jamais vos
                informations personnelles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
