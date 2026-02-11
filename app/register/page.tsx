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
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useToast } from "@/infrastructure/storage/ToastContext";
import { getAuthErrorMessage, getErrorMapping } from "@/shared/helpers/error-mapping";
import { COUNTRIES, type Country } from "@/lib/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useGoogleLogin } from "@react-oauth/google";
import { showLoginError } from "@/shared/helpers/sweet-alert";

export const dynamic = "force-dynamic";

// Regex de validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
// Regex pour numéro sénégalais (9 chiffres commençant par 70, 75, 76, 77, 78)
// const SENEGAL_PHONE_REGEX = /^(70|75|76|77|78)\d{7}$/;

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

  const { loginWithGoogle } = useLocalAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    telephone: "",
    indicatif: "+221", // Default to Senegal
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

  // États d'erreur pour chaque champ
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");
  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (response) => {
      setIsLoading(true);
      try {

        // @ts-ignore - credential est disponible dans le flux implicite
        const result = await loginWithGoogle(response.access_token);
        if (result.success) {
          if (result.redirectUrl) {
            router.push(result.redirectUrl);
          } else {
            router.push("/");
          }
        }
      } catch (err: any) {
        console.error("Erreur Google login:", err);
        const errorMapping = getErrorMapping(err);
        showLoginError(errorMapping.message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      showLoginError("Échec de la connexion Google. Veuillez réessayer.");
    },
  });

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

  const validatePhone = (
    telephone: string,
    indicatif: string,
  ): string | null => {
    // Phone is optional, so if both are empty, it's valid
    if (!telephone.trim() && !indicatif) return null;

    // If one is provided, both must be provided
    if (!telephone.trim() || !indicatif) {
      return "Numéro de téléphone requis";
    }

    // Check if indicatif is valid
    const country = COUNTRIES.find((c) => c.indicatif === indicatif);
    if (!country) {
      return "Indicatif invalide";
    }

    // Check if telephone contains only digits
    if (!/^\d+$/.test(telephone)) {
      return "Le numéro doit contenir uniquement des chiffres";
    }

    // Check length based on country
    if (telephone.length !== country.localLength) {
      return `Le numéro doit contenir ${country.localLength} chiffres pour ${country.name}`;
    }

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

  const validateForm = () => {
    // Réinitialiser toutes les erreurs
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setTermsError("");

    let hasErrors = false;

    const firstNameValidation = validateName(formData.firstName, "Prénom");
    if (firstNameValidation) {
      setFirstNameError(firstNameValidation);
      hasErrors = true;
    }

    const lastNameValidation = validateName(formData.lastName, "Nom");
    if (lastNameValidation) {
      setLastNameError(lastNameValidation);
      hasErrors = true;
    }

    const emailValidation = validateEmail(formData.email);
    if (emailValidation) {
      setEmailError(emailValidation);
      hasErrors = true;
    }

    const phoneValidation = validatePhone(
      formData.telephone,
      formData.indicatif,
    );
    if (phoneValidation) {
      setPhoneError(phoneValidation);
      hasErrors = true;
    }

    const passwordValidation = validatePassword(formData.password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      hasErrors = true;
    }

    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError("Les mots de passe ne correspondent pas");
      hasErrors = true;
    }

    if (!formData.acceptTerms) {
      setTermsError("Vous devez accepter les conditions d'utilisation");
      hasErrors = true;
    }

    return !hasErrors;
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
        telephone: formData.telephone || undefined, // Optional
        indicatif: formData.indicatif || undefined, // Optional
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
      console.error("Erreur inscription:", err);

      // Utiliser le système de mapping d'erreurs pour traduire en français
      const errorMapping = getErrorMapping(err);
      const errorMessage = errorMapping.message;

      // Si l'erreur a un code connu, utiliser le message du mapping
      const displayMessage = (err as any)?.code && errorMapping 
        ? errorMessage 
        : (err as any)?.message || errorMessage;

      // Déterminer si l'erreur concerne l'email ou le téléphone
      const code = (err as any)?.code?.toLowerCase() || "";
      const originalMessage = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      
      if (
        code.includes("email") || 
        code.includes("user") ||
        originalMessage.includes("email") ||
        originalMessage.includes("user")
      ) {
        setEmailError(displayMessage);
      } else if (
        code.includes("phone") || 
        code.includes("telephone") ||
        code.includes("téléphone") ||
        originalMessage.includes("phone") ||
        originalMessage.includes("telephone") ||
        originalMessage.includes("téléphone")
      ) {
        setPhoneError(displayMessage);
      } else {
        setEmailError(displayMessage); // Par défaut sur email
      }
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
                <CheckCircle className="h-7 w-7 text-[#002c75]" />
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
              <p className="text-xs text-[#002c75] mb-2">
                📧 <strong>Vérifiez votre boîte email !</strong>
              </p>
              <p className="text-xs text-[#002c75]">
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
          <div className="w-full max-w-md lg:max-w-2xl">
            <div className="mb-2 lg:mb-6">
              <h1 className="text-lg lg:text-3xl font-bold mb-0.5 lg:mb-2">
                Créer votre compte
              </h1>
              <p className="text-muted-foreground text-xs lg:text-base">
                Rejoignez nos milliers d'apprenants
              </p>
            </div>

            <div className="mb-4 lg:mb-6">
              <GoogleSignInButton onClick={handleGoogleSignIn} isLoading={isLoading} />
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">ou avec votre email</span>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-2.5 lg:space-y-5">
              {/* Prénom et Nom */}
              <div className="grid grid-cols-2 gap-2.5 lg:gap-4">
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
                      if (firstNameError) setFirstNameError("");
                    }}
                    className={`mt-0.5 h-9 lg:h-12 text-xs lg:text-base transition-colors ${
                      firstNameError ? "border-red-500" : ""
                    }`}
                  />
                  {firstNameError && (
                    <p className="text-red-600 text-xs mt-1 animate-in slide-in-from-top-1 duration-200">
                      {firstNameError}
                    </p>
                  )}
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
                      if (lastNameError) setLastNameError("");
                    }}
                    className={`mt-0.5 h-9 lg:h-12 text-xs lg:text-base transition-colors ${
                      lastNameError ? "border-red-500" : ""
                    }`}
                  />
                  {lastNameError && (
                    <p className="text-red-600 text-xs mt-1 animate-in slide-in-from-top-1 duration-200">
                      {lastNameError}
                    </p>
                  )}
                </div>
              </div>

              {/* Email et Téléphone sur la même ligne */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-4">
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
                      if (emailError) setEmailError("");
                    }}
                    className={`mt-0.5 h-9 lg:h-12 text-xs lg:text-base transition-colors ${
                      emailError ? "border-red-500" : ""
                    }`}
                  />
                  {emailError && (
                    <p className="text-red-600 text-xs mt-1 animate-in slide-in-from-top-1 duration-200">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Téléphone avec indicatif intégré */}
                <div>
                  <Label
                    htmlFor="phone"
                    className="text-[11px] lg:text-base mb-1.5 block"
                  >
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={`${formData.indicatif} ${COUNTRIES.find((c) => c.indicatif === formData.indicatif)?.localLength === 9 ? "701234567" : "12345678"}`}
                    value={formData.telephone}
                    onChange={(e) => {
                      // Ne garder que les chiffres
                      const value = e.target.value.replace(/\D/g, "");
                      // Limiter selon le pays sélectionné
                      const selectedCountry = COUNTRIES.find(
                        (c) => c.indicatif === formData.indicatif,
                      );
                      const maxLength = selectedCountry?.localLength || 15;

                      if (value.length <= maxLength) {
                        setFormData({ ...formData, telephone: value });
                        if (phoneError) setPhoneError("");
                      }
                    }}
                    className={`mt-0.5 h-9 lg:h-12 text-xs lg:text-base transition-colors ${
                      phoneError ? "border-red-500" : ""
                    }`}
                    maxLength={
                      COUNTRIES.find((c) => c.indicatif === formData.indicatif)
                        ?.localLength || 15
                    }
                  />
                  {phoneError && (
                    <p className="text-red-600 text-xs mt-1 animate-in slide-in-from-top-1 duration-200">
                      {phoneError}
                    </p>
                  )}
                  {formData.telephone && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Numéro complet: {formData.indicatif} {formData.telephone}
                    </p>
                  )}
                </div>
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
                      if (passwordError) setPasswordError("");
                    }}
                    className={`pr-10 h-9 lg:h-12 text-xs lg:text-base transition-colors ${
                      passwordError ? "border-red-500" : ""
                    }`}
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
                {passwordError && (
                  <p className="text-red-600 text-xs mt-1 animate-in slide-in-from-top-1 duration-200">
                    {passwordError}
                  </p>
                )}

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
                      if (confirmPasswordError) setConfirmPasswordError("");
                    }}
                    className={`pr-10 h-9 lg:h-12 text-xs lg:text-base transition-colors ${
                      confirmPasswordError ? "border-red-500" : ""
                    }`}
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
                {confirmPasswordError && (
                  <p className="text-red-600 text-xs mt-1 animate-in slide-in-from-top-1 duration-200">
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1 py-0.5 lg:py-1.5">
                <div className="flex items-start gap-2 lg:gap-2.5">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        acceptTerms: checked as boolean,
                      });
                      if (termsError) setTermsError("");
                    }}
                    className={`mt-0.5 h-3.5 w-3.5 lg:h-5 lg:w-5 ${
                      termsError ? "border-red-500" : ""
                    }`}
                  />
                  <label
                    htmlFor="terms"
                    className="text-[11px] lg:text-base cursor-pointer leading-tight hover:text-foreground transition-colors"
                  >
                    J'accepte les conditions d'utilisation
                  </label>
                </div>
                {termsError && (
                  <p className="text-red-600 text-xs ml-6 animate-in slide-in-from-top-1 duration-200">
                    {termsError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-10 lg:h-12 text-xs lg:text-base font-medium bg-[#002c75] hover:bg-[#001a4d] transition-colors"
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
                className="hover:underline font-semibold text-[#002c75]"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Benefits (Hidden on mobile) */}
        <div className="hidden lg:flex flex-1 bg-[#002c75] p-6 items-center justify-center relative overflow-hidden">
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
