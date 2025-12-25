"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { AnimatedMascot } from "@/components/animated-mascot";
import { BackButton } from "@/components/back-button";
import { AuthApi } from "@/infrastructure/api/auth-api";
import { useToast } from "@/infrastructure/storage/ToastContext";

export const dynamic = "force-dynamic";

export default function Register() {
  const router = useRouter();
  const { registerSuccess, error } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fonctions de validation personnalisées
  const validateEmail = (email: string): boolean => {
    return email.includes("@") && email.includes(".") && email.indexOf("@") < email.lastIndexOf(".");
  };

  const validatePassword = (password: string): boolean => {
    return password.trim().length > 0;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.first_name.trim()) errors.first_name = "Prénom requis";
    if (!formData.last_name.trim()) errors.last_name = "Nom requis";
    if (!formData.phone.trim()) errors.phone = "Téléphone requis";
    if (!validateEmail(formData.email)) errors.email = "L'adresse email doit contenir '@' et un point";
    if (!validatePassword(formData.password)) errors.password = "Le mot de passe est requis";
    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!formData.acceptTerms) errors.acceptTerms = "Acceptez les conditions";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await AuthApi.register({
        username: formData.email.split("@")[0],
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        region: "",
      });

      if (response.success) {
        setVerificationSent(true);
        setRegisteredEmail(formData.email);
        await registerSuccess(formData.email);
      }
    } catch (err) {
      error(
        "Erreur d'inscription",
        err instanceof Error ? err.message : "Impossible de créer le compte",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-blue-600" />
              </div>
            </div>

            <h1 className="text-xl font-bold mb-2">Inscription réussie !</h1>
            <p className="text-muted-foreground mb-3 text-sm">
              Un email de confirmation a été envoyé à:
            </p>
            <p className="font-semibold text-foreground mb-4 break-all text-sm">
              {registeredEmail}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
              <p className="text-xs text-blue-900">
                📧 <strong>Cliquez sur le lien</strong> dans l'email pour
                vérifier votre adresse.
              </p>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              L'email n'arrive pas ? Vérifiez vos spams.
            </p>

            <Button
              onClick={() => setVerificationSent(false)}
              variant="outline"
              className="w-full"
            >
              Retour à l'inscription
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Header Mobile - Sans logo, juste le bouton retour */}
      <div className="lg:hidden flex items-center justify-start px-4 py-2 border-b bg-white sticky top-0 z-20">
        <BackButton href="/" text="Retour" />
      </div>

      {/* Back Button Desktop */}
      <div className="hidden lg:block absolute top-4 left-4 z-10">
        <BackButton href="/" text="Retour à l'accueil" />
      </div>

      {/* Left Side - Form - Optimisé pour éviter le scroll */}
      <div className="flex-1 flex items-center justify-center px-4 py-3 lg:p-6 overflow-hidden">
        <div className="w-full max-w-md">
          <div className="mb-2 lg:mb-4">
            <h1 className="text-lg lg:text-2xl font-bold mb-0.5">
              Créer votre compte
            </h1>
            <p className="text-muted-foreground text-xs lg:text-sm">
              Rejoignez nos milliers d'apprenants
            </p>
          </div>

          {/* Registration Form - Espacement ultra-réduit en mobile */}
          <form onSubmit={handleSubmit} className="space-y-1.5 lg:space-y-3">
            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-1.5 lg:gap-3">
              <div>
                <Label htmlFor="first_name" className="text-[11px] lg:text-sm">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  placeholder="Habib"
                  value={formData.first_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className={`mt-0.5 h-8 lg:h-9 text-xs ${formErrors.first_name ? "border-red-500" : ""}`}
                />
                {formErrors.first_name && (
                  <p className="text-[10px] text-red-500 mt-0.5">
                    {formErrors.first_name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name" className="text-[11px] lg:text-sm">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  placeholder="Ndiaye"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className={`mt-0.5 h-8 lg:h-9 text-xs ${formErrors.last_name ? "border-red-500" : ""}`}
                />
                {formErrors.last_name && (
                  <p className="text-[10px] text-red-500 mt-0.5">
                    {formErrors.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <Label htmlFor="phone" className="text-[11px] lg:text-sm">
                Téléphone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="784441909"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className={`mt-0.5 h-8 lg:h-9 text-xs ${formErrors.phone ? "border-red-500" : ""}`}
              />
              {formErrors.phone && (
                <p className="text-[10px] text-red-500 mt-0.5">
                  {formErrors.phone}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-[11px] lg:text-sm">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="email@gmail.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`mt-0.5 h-8 lg:h-9 text-xs ${formErrors.email ? "border-red-500" : ""}`}
              />
              {formErrors.email && (
                <p className="text-[10px] text-red-500 mt-0.5">
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <Label htmlFor="password" className="text-[11px] lg:text-sm">
                Mot de passe <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-0.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`pr-10 h-8 lg:h-9 text-xs ${formErrors.password ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-[10px] text-red-500 mt-0.5">
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Confirmez le mot de passe */}
            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-[11px] lg:text-sm"
              >
                Confirmez <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-0.5">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={`pr-10 h-8 lg:h-9 text-xs ${formErrors.confirmPassword ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-[10px] text-red-500 mt-0.5">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 py-0.5">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, acceptTerms: checked as boolean })
                }
                className="mt-0.5 h-3.5 w-3.5"
              />
              <label
                htmlFor="terms"
                className="text-[11px] lg:text-sm cursor-pointer leading-tight hover:text-foreground transition-colors"
              >
                J'accepte les conditions d'utilisation
              </label>
            </div>
            {formErrors.acceptTerms && (
              <p className="text-[10px] text-red-500">
                {formErrors.acceptTerms}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-8 lg:h-9 text-xs"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Inscription...
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground mt-2 lg:mt-4">
            Vous avez déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-semibold"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Benefits (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-blue-600 to-blue-800 p-6 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-40 right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-sm text-white relative z-10">
          <div className="mb-6">
            <AnimatedMascot message="Rejoignez-nous !" />
          </div>

          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-1">Rejoignez-nous !</h2>
            <p className="text-white/80 text-xs">
              Commencez votre parcours d'apprentissage
            </p>
          </div>

          <div className="space-y-3">
            <div className="group relative overflow-hidden bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all duration-500 hover:shadow-2xl hover:shadow-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-orange-500/10 to-yellow-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <h4 className="font-bold text-sm mb-1 relative z-10">
                Contenu Premium
              </h4>
              <p className="text-xs text-white/60 relative z-10">
                Cours créés par des experts
              </p>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all duration-500 hover:shadow-2xl hover:shadow-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-emerald-500/10 to-green-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <h4 className="font-bold text-sm mb-1 relative z-10">
                Flexibilité Totale
              </h4>
              <p className="text-xs text-white/60 relative z-10">
                Apprenez à votre rythme
              </p>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all duration-500 hover:shadow-2xl hover:shadow-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-pink-500/10 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <h4 className="font-bold text-sm mb-1 relative z-10">
                Apprentissage Interactif
              </h4>
              <p className="text-xs text-white/60 relative z-10">
                Exercices pratiques et quiz
              </p>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all duration-500 hover:shadow-2xl hover:shadow-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-blue-500/10 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <h4 className="font-bold text-sm mb-1 relative z-10">
                Support Dédié
              </h4>
              <p className="text-xs text-white/60 relative z-10">
                Accompagnement personnalisé
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
