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
import Swal from "sweetalert2";

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
    return (
      email.includes("@") &&
      email.includes(".") &&
      email.indexOf("@") < email.lastIndexOf(".")
    );
  };

  const validatePassword = (password: string): boolean => {
    return password.trim().length > 0;
  };

  // Fonction pour afficher les erreurs avec SweetAlert2
  const showError = (title: string, text: string) => {
    Swal.fire({
      icon: "error",
      title: title,
      text: text,
      confirmButtonText: "Fermer",
      confirmButtonColor: "#2563eb",
      backdrop: true,
      allowOutsideClick: true,
      allowEscapeKey: true,
      customClass: {
        popup: "swal-responsive",
        title: "swal-title",
        htmlContainer: "swal-text",
        confirmButton: "swal-button",
      },
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation personnalisée avec SweetAlert2
    if (!validateEmail(email)) {
      showError(
        "Email invalide",
        "L'adresse email doit contenir '@' et un point",
      );
      return;
    }

    if (!validatePassword(password)) {
      showError("Mot de passe requis", "Veuillez entrer votre mot de passe");
      return;
    }

    setIsLoading(true);

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

      // Gestion spécifique des erreurs backend avec SweetAlert2
      if (err.message === "EMAIL_NOT_FOUND") {
        showError("Email introuvable", "Cette adresse email n'existe pas");
      } else if (err.message === "INCORRECT_PASSWORD") {
        showError(
          "Mot de passe incorrect",
          "Le mot de passe saisi est incorrect",
        );
      } else if (err.message === "EMAIL_NOT_VERIFIED") {
        showError(
          "Email non vérifié",
          "Veuillez vérifier votre email avant de vous connecter",
        );
      } else {
        showError(
          "Erreur de connexion",
          err.message || "Une erreur s'est produite lors de la connexion",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        /* Styles SweetAlert2 responsifs */
        .swal-responsive {
          width: 90% !important;
          max-width: 400px !important;
          padding: 1.5rem !important;
          border-radius: 1rem !important;
        }

        .swal-title {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          color: #1f2937 !important;
        }

        .swal-text {
          font-size: 0.95rem !important;
          color: #6b7280 !important;
        }

        .swal-button {
          padding: 0.65rem 2rem !important;
          font-size: 0.95rem !important;
          font-weight: 600 !important;
          border-radius: 0.5rem !important;
        }

        @media (max-width: 640px) {
          .swal-responsive {
            width: 95% !important;
            padding: 1.25rem !important;
          }

          .swal-title {
            font-size: 1.1rem !important;
          }

          .swal-text {
            font-size: 0.875rem !important;
          }

          .swal-button {
            padding: 0.6rem 1.5rem !important;
            font-size: 0.875rem !important;
          }
        }
      `}</style>

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
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md lg:max-w-lg">
            <div className="mb-6 lg:mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2 lg:mb-3">
                Bienvenue !
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Connectez-vous à votre compte pour continuer
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 lg:space-y-5">
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm lg:text-base mb-2 block"
                >
                  Adresse email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 h-10 lg:h-12 text-sm lg:text-base"
                />
              </div>

              <div>
                <Label
                  htmlFor="password"
                  className="text-sm lg:text-base mb-2 block"
                >
                  Mot de passe <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 h-10 lg:h-12 text-sm lg:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 lg:h-5 lg:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 lg:h-5 lg:w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 lg:py-2">
                <div className="flex items-center gap-2 lg:gap-2.5">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                    className="lg:h-5 lg:w-5"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm lg:text-base text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                  >
                    Se souvenir
                  </label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm lg:text-base text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-10 lg:h-12 text-sm lg:text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 lg:h-5 lg:w-5 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            <p className="text-center text-sm lg:text-base text-muted-foreground mt-5 lg:mt-6">
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
    </>
  );
}
