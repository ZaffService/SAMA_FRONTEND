"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2, CheckCircle, Check, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { AnimatedMascot } from "@/components/animated-mascot";
import { BackButton } from "@/components/back-button";
import { AuthApi } from "@/infrastructure/api/auth-api";
import { useToast } from "@/infrastructure/storage/ToastContext";
import Swal from "sweetalert2";

export const dynamic = "force-dynamic";

// Regex de validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;

interface PasswordStrength {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export default function Register() {
  const router = useRouter();
  const { registerSuccess, error } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const [showPasswordFeedback, setShowPasswordFeedback] = useState(false);

  // Analyse de la force du mot de passe en temps réel
  useEffect(() => {
    const pwd = formData.password;
    setPasswordStrength({
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecial: /[@$!%*?&]/.test(pwd),
    });
  }, [formData.password]);

  // Validation stricte des champs
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return "Email requis";
    if (email.length > 255) return "Email trop long (max 255 caractères)";
    if (!EMAIL_REGEX.test(email)) return "Format email invalide";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Mot de passe requis";
    if (password.length < 8) return "Minimum 8 caractères requis";
    if (!/[a-z]/.test(password)) return "Au moins une minuscule requise";
    if (!/[A-Z]/.test(password)) return "Au moins une majuscule requise";
    if (!/\d/.test(password)) return "Au moins un chiffre requis";
    if (!/[@$!%*?&]/.test(password))
      return "Au moins un caractère spécial requis (@$!%*?&)";
    if (!PASSWORD_REGEX.test(password))
      return "Format de mot de passe invalide";
    return null;
  };

  const validateName = (name: string, field: string): string | null => {
    if (!name.trim()) return `${field} requis`;
    if (name.length < 2) return `${field} trop court (min 2 caractères)`;
    if (name.length > 50) return `${field} trop long (max 50 caractères)`;
    if (!NAME_REGEX.test(name))
      return `${field} invalide (lettres, espaces et tirets uniquement)`;
    return null;
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

  const validateForm = () => {
    const firstNameError = validateName(formData.firstName, "Prénom");
    if (firstNameError) {
      showError("Prénom invalide", firstNameError);
      return false;
    }

    const lastNameError = validateName(formData.lastName, "Nom");
    if (lastNameError) {
      showError("Nom invalide", lastNameError);
      return false;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      showError("Email invalide", emailError);
      return false;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      showError("Mot de passe invalide", passwordError);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showError(
        "Mots de passe différents",
        "Les mots de passe ne correspondent pas",
      );
      return false;
    }

    if (!formData.acceptTerms) {
      showError(
        "Conditions non acceptées",
        "Vous devez accepter les conditions d'utilisation",
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Données à envoyer selon l'interface RegisterData du backend
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: "STUDENT", // Role par défaut géré en background
        acceptTerms: formData.acceptTerms,
      };

      const response = await AuthApi.register(registrationData);

      // L'API retourne directement les données utilisateur en cas de succès
      if (response && response.id) {
        setVerificationSent(true);
        setRegisteredEmail(formData.email);
        await registerSuccess(formData.email);
      } else {
        throw new Error("Réponse inattendue du serveur");
      }
    } catch (err) {
      showError(
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
              <p className="text-xs text-blue-900 mb-2">
                📧 <strong>Vérifiez votre boîte email !</strong>
              </p>
              <p className="text-xs text-blue-800">
                Un email de confirmation a été envoyé à{" "}
                <strong>{registeredEmail}</strong>.
                <br />
                Ouvrez votre boîte mail et cliquez sur le lien de vérification
                pour activer votre compte.
              </p>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              L'email n'arrive pas ? Vérifiez vos spams.
            </p>

            <div className="space-y-2">
              <Button
                onClick={() => window.open("https://mail.google.com", "_blank")}
                className="w-full"
              >
                Ouvrir ma boîte mail
              </Button>

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
      </div>
    );
  }

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
        {/* Header Mobile */}
        <div className="lg:hidden flex items-center justify-start px-4 py-2 border-b bg-white sticky top-0 z-20">
          <BackButton href="/" text="Retour" />
        </div>

        {/* Back Button Desktop */}
        <div className="hidden lg:block absolute top-4 left-4 z-10">
          <BackButton href="/" text="Retour à l'accueil" />
        </div>

        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-3 lg:p-8 overflow-auto">
          <div className="w-full max-w-md lg:max-w-lg">
            <div className="mb-2 lg:mb-6">
              <h1 className="text-lg lg:text-3xl font-bold mb-0.5 lg:mb-2">
                Créer votre compte
              </h1>
              <p className="text-muted-foreground text-xs lg:text-base">
                Rejoignez nos milliers d'apprenants
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-1.5 lg:space-y-4">
              {/* Prénom et Nom */}
              <div className="grid grid-cols-2 gap-1.5 lg:gap-4">
                <div>
                  <Label
                    htmlFor="firstName"
                    className="text-[11px] lg:text-base mb-1.5 block"
                  >
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData({ ...formData, firstName: e.target.value });
                    }}
                    className="mt-0.5 h-8 lg:h-12 text-xs lg:text-base"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="lastName"
                    className="text-[11px] lg:text-base mb-1.5 block"
                  >
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData({ ...formData, lastName: e.target.value });
                    }}
                    className="mt-0.5 h-8 lg:h-12 text-xs lg:text-base"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label
                  htmlFor="email"
                  className="text-[11px] lg:text-base mb-1.5 block"
                >
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                  }}
                  className="mt-0.5 h-8 lg:h-12 text-xs lg:text-base"
                />
              </div>

              {/* Mot de passe avec feedback dynamique */}
              <div>
                <Label
                  htmlFor="password"
                  className="text-[11px] lg:text-base mb-1.5 block"
                >
                  Mot de passe <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-0.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onFocus={() => setShowPasswordFeedback(true)}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                    }}
                    className="pr-10 h-8 lg:h-12 text-xs lg:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 lg:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5 lg:h-5 lg:w-5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 lg:h-5 lg:w-5" />
                    )}
                  </button>
                </div>

                {/* Feedback dynamique du mot de passe */}
                {showPasswordFeedback && formData.password && (
                  <div className="mt-2 p-2 lg:p-3 bg-gray-50 rounded-md border border-gray-200 space-y-1 lg:space-y-1.5">
                    <p className="text-[10px] lg:text-sm font-semibold text-gray-700 mb-1">
                      Critères du mot de passe:
                    </p>
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      {passwordStrength.minLength ? (
                        <Check className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 lg:h-4 lg:w-4 text-red-500" />
                      )}
                      <span
                        className={`text-[10px] lg:text-sm ${passwordStrength.minLength ? "text-green-600" : "text-gray-600"}`}
                      >
                        Minimum 8 caractères
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      {passwordStrength.hasUppercase ? (
                        <Check className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 lg:h-4 lg:w-4 text-red-500" />
                      )}
                      <span
                        className={`text-[10px] lg:text-sm ${passwordStrength.hasUppercase ? "text-green-600" : "text-gray-600"}`}
                      >
                        Au moins une majuscule
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      {passwordStrength.hasLowercase ? (
                        <Check className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 lg:h-4 lg:w-4 text-red-500" />
                      )}
                      <span
                        className={`text-[10px] lg:text-sm ${passwordStrength.hasLowercase ? "text-green-600" : "text-gray-600"}`}
                      >
                        Au moins une minuscule
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      {passwordStrength.hasNumber ? (
                        <Check className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 lg:h-4 lg:w-4 text-red-500" />
                      )}
                      <span
                        className={`text-[10px] lg:text-sm ${passwordStrength.hasNumber ? "text-green-600" : "text-gray-600"}`}
                      >
                        Au moins un chiffre
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      {passwordStrength.hasSpecial ? (
                        <Check className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 lg:h-4 lg:w-4 text-red-500" />
                      )}
                      <span
                        className={`text-[10px] lg:text-sm ${passwordStrength.hasSpecial ? "text-green-600" : "text-gray-600"}`}
                      >
                        Au moins un caractère spécial (@$!%*?&)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmez le mot de passe */}
              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="text-[11px] lg:text-base mb-1.5 block"
                >
                  Confirmez le mot de passe{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-0.5">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      });
                    }}
                    className="pr-10 h-8 lg:h-12 text-xs lg:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 lg:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3.5 w-3.5 lg:h-5 lg:w-5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 lg:h-5 lg:w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 lg:gap-2.5 py-0.5 lg:py-1.5">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      acceptTerms: checked as boolean,
                    })
                  }
                  className="mt-0.5 h-3.5 w-3.5 lg:h-5 lg:w-5"
                />
                <label
                  htmlFor="terms"
                  className="text-[11px] lg:text-base cursor-pointer leading-tight hover:text-foreground transition-colors"
                >
                  J'accepte les conditions d'utilisation
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-8 lg:h-12 text-xs lg:text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 lg:h-5 lg:w-5 animate-spin" />
                    Inscription...
                  </>
                ) : (
                  "Créer mon compte"
                )}
              </Button>
            </form>

            <p className="text-center text-[11px] lg:text-base text-muted-foreground mt-2 lg:mt-5">
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
    </>
  );
}
