"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AnimatedMascot } from "@/components/animated-mascot";
import { BackButton } from "@/components/back-button";
import { AuthApi } from "@/infrastructure/api/auth-api";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useToast } from "@/infrastructure/storage/ToastContext";
import { getErrorMapping, isSmsDeliveryError } from "@/shared/helpers/error-mapping";
import {
  getPhonePlaceholder,
  sanitizePhoneInput,
  validatePhone,
  validatePassword,
  MIN_PASSWORD_LENGTH,
  buildRegisterPayload,
  WEB_REGISTRATION_PLATFORM,
  getVerifyPhoneUrl,
  storePendingPhoneAuth,
  getRegisterFieldError,
} from "@/lib/phone-auth";
import { COUNTRIES } from "@/lib/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { showLoginError } from "@/shared/helpers/sweet-alert";
import logger from "@/shared/helpers/logger";

export const dynamic = "force-dynamic";

const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;

export default function Register() {
  const router = useRouter();
  const { registerSuccess } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { loginWithGoogle } = useLocalAuth();

  const [formData, setFormData] = useState({
    password: "",
    firstName: "",
    lastName: "",
    telephone: "",
    indicatif: "+221",
    confirmPassword: "",
    acceptTerms: false,
  });

  // États d'erreur pour chaque champ
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");

  useEffect(() => {
    if (formData.telephone && /\D/.test(formData.telephone)) {
      setFormData((prev) => ({
        ...prev,
        telephone: sanitizePhoneInput(prev.telephone, prev.indicatif),
      }));
    }
  }, [formData.telephone, formData.indicatif]);

  const handleGoogleSignIn = async (idToken: string) => {
    setIsLoading(true);
    try {
      const result = await loginWithGoogle(idToken);
      if (result.success) {
        if (result.redirectUrl) {
          router.push(result.redirectUrl);
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      logger.error("Erreur Google login:", err);
      const errorMapping = getErrorMapping(err);
      showLoginError(errorMapping.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Validation stricte des champs
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

    const goToPhoneVerification = async () => {
      storePendingPhoneAuth({
        indicatif: formData.indicatif,
        telephone: formData.telephone,
        password: formData.password,
      });
      await registerSuccess(`${formData.indicatif} ${formData.telephone}`);
      router.push(getVerifyPhoneUrl(formData.indicatif, formData.telephone));
    };

    try {
      const response = await AuthApi.register(
        buildRegisterPayload(WEB_REGISTRATION_PLATFORM, {
          indicatif: formData.indicatif,
          telephone: formData.telephone,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        }),
      );

      if (response?.id) {
        await goToPhoneVerification();
      } else {
        throw new Error("Réponse inattendue du serveur");
      }
    } catch (err) {
      logger.error("Erreur inscription:", err);

      // Compte créé + OTP en base même si l'envoi SMS échoue (500)
      if (isSmsDeliveryError(err)) {
        logger.warn(
          "Envoi SMS indisponible après création de compte — poursuite vers verify-phone",
        );
        await goToPhoneVerification();
        return;
      }

      const { field, message } = getRegisterFieldError(err);
      const displayMessage =
        field === "general" ? getErrorMapping(err).message : message;

      switch (field) {
        case "firstName":
          setFirstNameError(displayMessage);
          break;
        case "lastName":
          setLastNameError(displayMessage);
          break;
        case "password":
          setPasswordError(displayMessage);
          break;
        case "phone":
          setPhoneError(displayMessage);
          break;
        default:
          setPhoneError(displayMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
        {/* Header Mobile */}
        <div className="lg:hidden flex items-center justify-start px-4 py-2 border-b bg-white sticky top-0 z-20">
          <BackButton href="/" text="Retour" />
        </div>

        {/* Back Button Desktop */}
        <div className="hidden lg:block absolute top-4 left-4 z-10">
          <BackButton href="/" text="Retour à l'accueil" />
        </div>

        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-3 lg:p-8 overflow-hidden">
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
              <GoogleSignInButton
                onSuccess={handleGoogleSignIn}
                onError={() =>
                  showLoginError("Échec de la connexion Google. Veuillez réessayer.")
                }
                isLoading={isLoading}
              />
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">ou avec votre téléphone</span>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-2.5 lg:space-y-5"
              autoComplete="off"
            >
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
                    name="given-name"
                    autoComplete="given-name"
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
                    name="family-name"
                    autoComplete="family-name"
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

              {/* Téléphone */}
              <div>
                <Label
                  htmlFor="phone"
                  className="text-[11px] lg:text-base mb-1.5 block"
                >
                  Téléphone <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2 mt-0.5">
                  <Select
                    value={formData.indicatif}
                    onValueChange={(value) => {
                      setFormData({ ...formData, indicatif: value, telephone: "" });
                      if (phoneError) setPhoneError("");
                    }}
                  >
                    <SelectTrigger className="w-[100px] lg:w-[120px] h-9 lg:h-12 text-xs lg:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem
                          key={country.indicatif}
                          value={country.indicatif}
                        >
                          {country.indicatif}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    name="telephone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder={getPhonePlaceholder(formData.indicatif)}
                    value={formData.telephone}
                    onChange={(e) => {
                      const value = sanitizePhoneInput(
                        e.target.value,
                        formData.indicatif,
                      );
                      setFormData({ ...formData, telephone: value });
                      if (phoneError) setPhoneError("");
                    }}
                    onInput={(e) => {
                      const value = sanitizePhoneInput(
                        e.currentTarget.value,
                        formData.indicatif,
                      );
                      if (value !== formData.telephone) {
                        setFormData({ ...formData, telephone: value });
                        if (phoneError) setPhoneError("");
                      }
                    }}
                    onBlur={(e) => {
                      const value = sanitizePhoneInput(
                        e.target.value,
                        formData.indicatif,
                      );
                      if (value !== formData.telephone) {
                        setFormData({ ...formData, telephone: value });
                      }
                    }}
                    className={`flex-1 h-9 lg:h-12 text-xs lg:text-base transition-colors ${
                      phoneError ? "border-red-500" : ""
                    }`}
                    maxLength={
                      COUNTRIES.find((c) => c.indicatif === formData.indicatif)
                        ?.localLength || 15
                    }
                  />
                </div>
                {phoneError && (
                  <p className="text-red-600 text-xs mt-1 animate-in slide-in-from-top-1 duration-200">
                    {phoneError}
                  </p>
                )}
                {formData.telephone && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Numéro complet : {formData.indicatif} {formData.telephone}
                  </p>
                )}
              </div>

              {/* Mot de passe */}
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
                    name="new-password"
                    autoComplete="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
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
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum {MIN_PASSWORD_LENGTH} caractères
                </p>
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
                    name="confirm-password"
                    autoComplete="new-password"
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
