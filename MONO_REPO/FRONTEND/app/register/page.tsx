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

export const dynamic = "force-dynamic";

// Regex de validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
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
    if (!/[@$!%*?&]/.test(password)) return "Au moins un caractère spécial requis (@$!%*?&)";
    if (!PASSWORD_REGEX.test(password)) return "Format de mot de passe invalide";
    return null;
  };

  const validateName = (name: string, field: string): string | null => {
    if (!name.trim()) return `${field} requis`;
    if (name.length < 2) return `${field} trop court (min 2 caractères)`;
    if (name.length > 50) return `${field} trop long (max 50 caractères)`;
    if (!NAME_REGEX.test(name)) return `${field} invalide (lettres, espaces et tirets uniquement)`;
    return null;
  };


  const validateForm = () => {
    const errors: Record<string, string> = {};

    const firstNameError = validateName(formData.firstName, "Prénom");
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = validateName(formData.lastName, "Nom");
    if (lastNameError) errors.lastName = lastNameError;

    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.password = passwordError;

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (!formData.acceptTerms) {
      errors.acceptTerms = "Vous devez accepter les conditions d'utilisation";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
              <p className="text-xs text-blue-900 mb-2">
                📧 <strong>Vérifiez votre boîte email !</strong>
              </p>
              <p className="text-xs text-blue-800">
                Un email de confirmation a été envoyé à <strong>{registeredEmail}</strong>.
                <br />
                Ouvrez votre boîte mail et cliquez sur le lien de vérification pour activer votre compte.
              </p>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              L'email n'arrive pas ? Vérifiez vos spams.
            </p>

            <div className="space-y-2">
              <Button
                onClick={() => window.open('https://mail.google.com', '_blank')}
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
      <div className="flex-1 flex items-center justify-center px-4 py-3 lg:p-6 overflow-auto">
        <div className="w-full max-w-md">
          <div className="mb-2 lg:mb-4">
            <h1 className="text-lg lg:text-2xl font-bold mb-0.5">
              Créer votre compte
            </h1>
            <p className="text-muted-foreground text-xs lg:text-sm">
              Rejoignez nos milliers d'apprenants
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-1.5 lg:space-y-3">
            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-1.5 lg:gap-3">
              <div>
                <Label htmlFor="firstName" className="text-[11px] lg:text-sm">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="Jean"
                  value={formData.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (formErrors.firstName) {
                      const error = validateName(e.target.value, "Prénom");
                      if (!error) {
                        const newErrors = { ...formErrors };
                        delete newErrors.firstName;
                        setFormErrors(newErrors);
                      }
                    }
                  }}
                  className={`mt-0.5 h-8 lg:h-9 text-xs ${formErrors.firstName ? "border-red-500" : ""}`}
                />
                {formErrors.firstName && (
                  <p className="text-[10px] text-red-500 mt-0.5">
                    {formErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="text-[11px] lg:text-sm">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                    if (formErrors.lastName) {
                      const error = validateName(e.target.value, "Nom");
                      if (!error) {
                        const newErrors = { ...formErrors };
                        delete newErrors.lastName;
                        setFormErrors(newErrors);
                      }
                    }
                  }}
                  className={`mt-0.5 h-8 lg:h-9 text-xs ${formErrors.lastName ? "border-red-500" : ""}`}
                />
                {formErrors.lastName && (
                  <p className="text-[10px] text-red-500 mt-0.5">
                    {formErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-[11px] lg:text-sm">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (formErrors.email) {
                    const error = validateEmail(e.target.value);
                    if (!error) {
                      const newErrors = { ...formErrors };
                      delete newErrors.email;
                      setFormErrors(newErrors);
                    }
                  }
                }}
                className={`mt-0.5 h-8 lg:h-9 text-xs ${formErrors.email ? "border-red-500" : ""}`}
              />
              {formErrors.email && (
                <p className="text-[10px] text-red-500 mt-0.5">
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Mot de passe avec feedback dynamique */}
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
                  onFocus={() => setShowPasswordFeedback(true)}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (formErrors.password) {
                      const error = validatePassword(e.target.value);
                      if (!error) {
                        const newErrors = { ...formErrors };
                        delete newErrors.password;
                        setFormErrors(newErrors);
                      }
                    }
                  }}
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

              {/* Feedback dynamique du mot de passe */}
              {showPasswordFeedback && formData.password && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200 space-y-1">
                  <p className="text-[10px] font-semibold text-gray-700 mb-1">
                    Critères du mot de passe:
                  </p>
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.minLength ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-[10px] ${passwordStrength.minLength ? "text-green-600" : "text-gray-600"}`}
                    >
                      Minimum 8 caractères
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.hasUppercase ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-[10px] ${passwordStrength.hasUppercase ? "text-green-600" : "text-gray-600"}`}
                    >
                      Au moins une majuscule
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.hasLowercase ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-[10px] ${passwordStrength.hasLowercase ? "text-green-600" : "text-gray-600"}`}
                    >
                      Au moins une minuscule
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.hasNumber ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-[10px] ${passwordStrength.hasNumber ? "text-green-600" : "text-gray-600"}`}
                    >
                      Au moins un chiffre
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordStrength.hasSpecial ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-[10px] ${passwordStrength.hasSpecial ? "text-green-600" : "text-gray-600"}`}
                    >
                      Au moins un caractère spécial (@$!%*?&)
                    </span>
                  </div>
                </div>
              )}

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
                Confirmez le mot de passe <span className="text-red-500">*</span>
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
                    if (formErrors.confirmPassword && e.target.value === formData.password) {
                      const newErrors = { ...formErrors };
                      delete newErrors.confirmPassword;
                      setFormErrors(newErrors);
                    }
                  }}
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