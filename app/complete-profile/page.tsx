"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import { ProfileCompletionShell } from "@/components/profile-completion-shell";
import { Step1Personal } from "@/components/profile-completion/step1-personal";
import { Step2Location } from "@/components/profile-completion/step2-location";
import { Step3Finalize } from "@/components/profile-completion/step3-finalize";
import { stepTransition } from "@/components/profile-completion/animations";
import { useProtectRoute } from "@/application/use-cases/useProtectRoute";
import { getErrorMapping } from "@/shared/helpers/error-mapping";
import {
  UserApi,
  ProfileFormData,
  toProfileFormData,
  sortProfileMetadataItems,
  type ProfileMetadataResponse,
} from "@/infrastructure/api/user-api";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { COUNTRIES } from "@/lib/countries";
import logger from "@/shared/helpers/logger";

const extractLocalNumber = (fullPhone: string, indicatif: string): string => {
  if (!fullPhone) return "";
  if (fullPhone.startsWith(indicatif)) {
    return fullPhone.slice(indicatif.length);
  }
  if (fullPhone.startsWith("+")) {
    const country = COUNTRIES.find((c) => fullPhone.startsWith(c.indicatif));
    if (country) return fullPhone.slice(country.indicatif.length);
  }
  return fullPhone.replace(/\D/g, "");
};

const extractIndicatif = (
  fullPhone: string,
  defaultIndicatif: string,
): string => {
  if (!fullPhone || !fullPhone.startsWith("+")) return defaultIndicatif;
  const country = COUNTRIES.find((c) => fullPhone.startsWith(c.indicatif));
  return country ? country.indicatif : defaultIndicatif;
};

const getPhonePlaceholder = (indicatif: string): string => {
  const country = COUNTRIES.find((c) => c.indicatif === indicatif);
  if (country?.localLength === 9) return "7XXXXXXXX";
  if (country) return "X".repeat(country.localLength);
  return "XXXXXXXX";
};

const navigateToDashboard = (
  router: ReturnType<typeof useRouter>,
  role?: string,
) => {
  if (role === "ADMIN") router.push("/admin-dashboard");
  else if (role === "INSTRUCTOR") router.push("/instructor-dashboard");
  else router.push("/student-dashboard");
};

const getInitialFormData = (user: any): ProfileFormData => ({
  firstName: user?.firstName || user?.first_name || "",
  lastName: user?.lastName || user?.last_name || "",
  email: user?.email || "",
  telephone: extractLocalNumber(user?.telephone || "", "+221"),
  indicatif: extractIndicatif(user?.telephone || "", "+221"),
  ageRange: "",
  currentStatus: "",
  referralSource: "",
  sexe: "",
  region: "",
  residenceType: "",
  disability: false,
  disabilityType: "",
  disabilityDetails: "",
  consentGiven: false,
});

const TOTAL_STEPS = 3;

export default function CompleteProfile() {
  const router = useRouter();
  const { user } = useLocalAuth();
  const { completeProfile, isComplete, checkProfile } = useProfile();

  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    canAccess,
    loading: protectLoading,
    showAuthModal,
  } = useProtectRoute({
    message: "Veuillez vous connecter pour compléter votre profil.",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(
    getInitialFormData(user),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [phoneConflictError, setPhoneConflictError] = useState<string | null>(
    null,
  );
  const [originalPhone, setOriginalPhone] = useState<string>("");
  const [profileMetadata, setProfileMetadata] =
    useState<ProfileMetadataResponse | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const ageRangeOptions = useMemo(
    () => sortProfileMetadataItems(profileMetadata?.ageRanges ?? []),
    [profileMetadata],
  );
  const currentStatusOptions = useMemo(
    () => sortProfileMetadataItems(profileMetadata?.currentStatuses ?? []),
    [profileMetadata],
  );
  const referralSourceOptions = useMemo(
    () => sortProfileMetadataItems(profileMetadata?.referralSources ?? []),
    [profileMetadata],
  );
  const metadataReady = Boolean(profileMetadata);

  const firstName =
    formData.firstName || user?.firstName || user?.first_name || "";

  const validatePhone = (phone: string, dialCode: string): string | null => {
    if (!phone.trim()) return "Le numéro de téléphone est obligatoire";
    const country = COUNTRIES.find((c) => c.indicatif === dialCode);
    if (!country) return "Indicatif invalide";
    if (!/^\d+$/.test(phone)) {
      return "Le numéro doit contenir uniquement des chiffres";
    }
    if (phone.length !== country.localLength) {
      return `Le numéro doit contenir ${country.localLength} chiffres pour ${country.name}`;
    }
    return null;
  };

  const buildProfilePayload = () => {
    const payload: Record<string, unknown> = {};
    if (formData.firstName.trim()) payload.firstName = formData.firstName.trim();
    if (formData.lastName.trim()) payload.lastName = formData.lastName.trim();
    if (formData.ageRange) payload.ageRangeId = formData.ageRange;
    if (formData.currentStatus) payload.currentStatusId = formData.currentStatus;
    if (formData.referralSource) payload.referralSourceId = formData.referralSource;
    if (formData.sexe) payload.sexe = formData.sexe;
    if (formData.region) payload.region = formData.region;
    if (formData.residenceType) payload.residenceType = formData.residenceType;
    if (formData.disability) {
      payload.disability = true;
      if (formData.disabilityType) payload.disabilityType = formData.disabilityType;
      if (formData.disabilityDetails.trim()) {
        payload.disabilityDetails = formData.disabilityDetails.trim();
      }
    }
    if (formData.consentGiven) payload.consentGiven = true;
    if (!originalPhone && formData.telephone.trim()) {
      payload.telephone = formData.telephone;
      payload.indicatif = formData.indicatif;
    }
    return payload;
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.ageRange) {
        errors.ageRange = "Veuillez sélectionner votre tranche d'âge";
      }
      if (!formData.currentStatus) {
        errors.currentStatus = "Veuillez sélectionner votre statut actuel";
      }
      if (!formData.referralSource) {
        errors.referralSource =
          "Veuillez indiquer comment vous nous avez connus";
      }
    }

    if (step === 1) {
      if (!formData.sexe) errors.sexe = "Veuillez sélectionner votre genre";
      if (!formData.region) errors.region = "Veuillez sélectionner votre région";
      if (!formData.residenceType) {
        errors.residenceType = "Veuillez choisir votre type de résidence";
      }
      if (!originalPhone) {
        const phoneError = validatePhone(formData.telephone, formData.indicatif);
        if (phoneError) errors.telephone = phoneError;
      }
    }

    if (step === 2) {
      if (formData.disability && !formData.disabilityType) {
        errors.disabilityType = "Veuillez sélectionner un type de handicap";
      }
      if (!formData.consentGiven) {
        errors.consentGiven =
          "Vous devez accepter les conditions pour continuer";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    if (!protectLoading && isComplete === true) {
      navigateToDashboard(router, user?.role);
    }
  }, [protectLoading, isComplete, user, router]);

  useEffect(() => {
    if (!canAccess) return;

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setMetadataError(null);

      let metadata: ProfileMetadataResponse | null = null;

      try {
        metadata = await UserApi.getProfileMetadata();
        if (!cancelled) setProfileMetadata(metadata);
      } catch (error) {
        logger.error("Erreur lors du chargement des métadonnées:", error);
        if (!cancelled) {
          setMetadataError(
            "Impossible de charger les options de profil. Veuillez réessayer.",
          );
        }
      }

      try {
        const profileData = await UserApi.getUserProfile();
        if (!cancelled && profileData) {
          const form = toProfileFormData(profileData, metadata);
          setFormData(form);
          if (form.telephone) setOriginalPhone(form.telephone);
        }
      } catch (error) {
        logger.error("Erreur lors de la récupération du profil:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [canAccess]);

  const handleSave = async () => {
    for (let step = 0; step < TOTAL_STEPS; step += 1) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    setIsSaving(true);
    try {
      const result = await completeProfile(buildProfilePayload());

      if (result) {
        toast.success("Félicitations ! Votre profil a été complété avec succès !");
        localStorage.removeItem("user_profile_cache");
        await checkProfile();
        setShowSuccess(true);

        setTimeout(() => {
          navigateToDashboard(router, user?.role);
        }, 2800);
      }
    } catch (error) {
      logger.error("Erreur lors de la completion du profil:", error);
      const errorMapping = getErrorMapping(error);
      const displayMessage =
        (error as any)?.code && errorMapping
          ? errorMapping.message
          : (error as Error)?.message || errorMapping.message;

      const code = (error as any)?.code?.toLowerCase() || "";
      const errorMsg = (error as Error)?.message?.toLowerCase() || "";

      if (
        code.includes("telephone") ||
        code.includes("phone") ||
        errorMsg.includes("téléphone") ||
        errorMsg.includes("telephone") ||
        errorMsg.includes("phone")
      ) {
        setPhoneConflictError(displayMessage);
        setCurrentStep(1);
        setTimeout(() => setPhoneConflictError(null), 5000);
      } else {
        toast.error(`Erreur: ${displayMessage}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const pageLoading = protectLoading || showAuthModal || isLoading;

  const stepActions = (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      {currentStep > 0 ? (
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={isSaving}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Précédent
        </button>
      ) : (
        <div className="hidden sm:block" />
      )}

      {currentStep < TOTAL_STEPS - 1 ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleNextStep}
          disabled={isSaving || !metadataReady}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[oklch(0.50_0.24_268)] to-[oklch(0.58_0.22_285)] px-8 text-sm font-semibold text-white shadow-lg shadow-[oklch(0.50_0.24_268)]/25 transition-opacity disabled:opacity-50 sm:ml-auto sm:w-auto"
        >
          Continuer
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      ) : (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving || !metadataReady}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#DA1712] to-[#e11d48] px-8 text-sm font-semibold text-white shadow-lg shadow-[#DA1712]/25 transition-opacity disabled:opacity-50 sm:ml-auto sm:w-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Finalisation…
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Terminer mon profil
            </>
          )}
        </motion.button>
      )}
    </div>
  );

  return (
    <ProfileCompletionShell
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      firstName={firstName}
      isLoading={pageLoading}
      showSuccess={showSuccess}
      loadingMessage={
        protectLoading || showAuthModal
          ? "Vérification de votre session…"
          : "Chargement de votre profil…"
      }
      actions={stepActions}
    >
      {!pageLoading && (
        <>
          {metadataError && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {metadataError}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={currentStep} {...stepTransition}>
              {currentStep === 0 && (
                <Step1Personal
                  data={{
                    ageRange: formData.ageRange,
                    currentStatus: formData.currentStatus,
                    referralSource: formData.referralSource,
                  }}
                  onChange={(d) =>
                    setFormData((prev) => ({ ...prev, ...d }))
                  }
                  ageRangeOptions={ageRangeOptions}
                  currentStatusOptions={currentStatusOptions}
                  referralSourceOptions={referralSourceOptions}
                  errors={{
                    ageRange: fieldErrors.ageRange,
                    currentStatus: fieldErrors.currentStatus,
                    referralSource: fieldErrors.referralSource,
                  }}
                  disabled={isSaving}
                  metadataReady={metadataReady}
                />
              )}

              {currentStep === 1 && (
                <Step2Location
                  data={{
                    sexe: formData.sexe,
                    region: formData.region,
                    residenceType: formData.residenceType,
                    indicatif: formData.indicatif,
                    telephone: formData.telephone,
                  }}
                  onChange={(d) =>
                    setFormData((prev) => ({ ...prev, ...d }))
                  }
                  originalPhone={originalPhone}
                  phonePlaceholder={getPhonePlaceholder(formData.indicatif)}
                  errors={{
                    sexe: fieldErrors.sexe,
                    region: fieldErrors.region,
                    residenceType: fieldErrors.residenceType,
                    telephone: fieldErrors.telephone,
                  }}
                  phoneConflictError={phoneConflictError}
                  disabled={isSaving}
                />
              )}

              {currentStep === 2 && (
                <Step3Finalize
                  data={{
                    disability: formData.disability,
                    consent: formData.consentGiven,
                    disabilityType: formData.disabilityType,
                    disabilityDetails: formData.disabilityDetails,
                  }}
                  onChange={(d) =>
                    setFormData((prev) => ({
                      ...prev,
                      disability: d.disability,
                      consentGiven: d.consent,
                      disabilityType: d.disabilityType,
                      disabilityDetails: d.disabilityDetails,
                    }))
                  }
                  errors={{
                    disabilityType: fieldErrors.disabilityType,
                    consent: fieldErrors.consentGiven,
                  }}
                  disabled={isSaving}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </ProfileCompletionShell>
  );
}
