"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { useToast } from "@/infrastructure/storage/ToastContext";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { AnimatedMascot } from "@/components/animated-mascot";
import { BackButton } from "@/components/back-button";
import { Checkbox } from "@/components/ui/checkbox";

export default function ClientLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginError } = useToast();
  const {
    login,
    isAuthenticated,
    isLoading: authLoading,
    redirectAfterLogin,
    setRedirectAfterLogin,
  } = useLocalAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Gérer le paramètre de redirection depuis l'URL
    const redirectParam = searchParams.get("redirect");
    if (redirectParam) {
      setRedirectAfterLogin(redirectParam);
    }
  }, [searchParams, setRedirectAfterLogin]);

  useEffect(() => {
    // Si l'utilisateur est déjà authentifié et qu'il y a une redirection sauvegardée, rediriger
    if (isAuthenticated && redirectAfterLogin) {
      router.push(redirectAfterLogin);
    } else if (isAuthenticated) {
      // Rester sur la page actuelle (généralement la page d'accueil)
      // L'utilisateur peut accéder au dashboard via le menu quand il le souhaite
      // router.push("/student-dashboard"); // Commenté pour rester sur la page actuelle
    }
  }, [isAuthenticated, redirectAfterLogin, router]);

  // Fonctions de validation personnalisées
  const validateEmail = (email: string): boolean => {
    return email.includes("@") && email.includes(".") && email.indexOf("@") < email.lastIndexOf(".");
  };

  const validatePassword = (password: string): boolean => {
    return password.trim().length > 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    // Validation personnalisée
    if (!validateEmail(email)) {
      errors.email = "L'adresse email doit contenir '@' et un point";
    }

    if (!validatePassword(password)) {
      errors.password = "Le mot de passe est requis";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    setFormErrors({});

    try {
      const result = await login(email, password);

      if (result.success) {
        if (result.redirectUrl) {
          // Redirection spécifique (admin/instructor)
          router.push(result.redirectUrl);
        } else {
          // Pour les étudiants : redirection vers la page d'accueil
          router.push("/");
        }
      }
    } catch (err: any) {
      console.error("Erreur login:", err);

      // Gestion spécifique des erreurs backend
      if (err.message === 'EMAIL_NOT_FOUND') {
        setFormErrors({ email: "Cette adresse email n'existe pas" });
      } else if (err.message === 'INCORRECT_PASSWORD') {
        setFormErrors({ password: 'Mot de passe incorrect' });
      } else {
        setFormErrors({ general: err.message || 'Erreur de connexion' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);

    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Header Mobile avec padding réduit */}
      <div className="lg:hidden flex items-center justify-start px-4 py-3 border-b bg-white sticky top-0 z-20">
        <BackButton href="/" text="Retour" />
      </div>

      {/* Back Button Desktop */}
      <div className="hidden lg:block absolute top-4 left-4 z-10">
        <BackButton href="/" text="Retour à l'accueil" />
      </div>

      {/* Left Side - Form - Centré verticalement sur mobile */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:mb-6">
            <h1 className="text-2xl lg:text-2xl font-bold mb-2">Bienvenue !</h1>
            <p className="text-muted-foreground text-sm lg:text-sm">
              Connectez-vous à votre compte pour continuer
            </p>
          </div>

          {/* Erreur générale */}
          {formErrors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{formErrors.general}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 lg:space-y-3">
            <div>
              <Label htmlFor="email" className="text-sm lg:text-sm">
                Adresse email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`mt-1.5 h-10 lg:h-9 text-sm ${formErrors.email ? "border-red-500" : ""}`}
              />
              {formErrors.email && (
                <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm lg:text-sm">
                Mot de passe <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`pr-10 h-10 lg:h-9 text-sm ${formErrors.password ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 lg:h-4 lg:w-4" />
                  ) : (
                    <Eye className="h-4 w-4 lg:h-4 lg:w-4" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                />
                <label
                  htmlFor="remember"
                  className="text-sm lg:text-sm text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                >
                  Se souvenir
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-10 lg:h-9 text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 lg:h-4 lg:w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5 lg:mt-4">
            Vous n'avez pas de compte ?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-semibold"
            >
              Créer un compte
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
            <AnimatedMascot />
          </div>

          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-1">Prêt à apprendre ?</h2>
            <p className="text-white/80 text-xs">
              Rejoignez des milliers d'apprenants
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
