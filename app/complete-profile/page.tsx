"use client";

import type React from "react";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  User,
  ArrowLeft,
  CheckCircle2,
  Save,
  MapPin,
  Home,
  Heart,
  Info,
} from "lucide-react";
import { useProtectRoute } from "@/application/use-cases/useProtectRoute";
import { getErrorMapping } from "@/shared/helpers/error-mapping";

import {
  UserApi,
  ProfileFormData,
  toProfileFormData,
  SEXE_LABELS,
  REGION_LABELS,
  RESIDENCE_LABELS,
  DISABILITY_TYPE_LABELS,
  sortProfileMetadataItems,
  type ProfileMetadataResponse,
  SexeType,
  RegionType,
  ResidenceType,
  DisabilityType,
} from "@/infrastructure/api/user-api";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { COUNTRIES } from "@/lib/countries";
import logger from "@/shared/helpers/logger";

// Helper to extract local number from full phone number
const extractLocalNumber = (fullPhone: string, indicatif: string): string => {
  if (!fullPhone) return "";
  if (fullPhone.startsWith(indicatif)) {
    return fullPhone.slice(indicatif.length);
  }
  if (fullPhone.startsWith("+")) {
    const country = COUNTRIES.find((c) => fullPhone.startsWith(c.indicatif));
    if (country) {
      return fullPhone.slice(country.indicatif.length);
    }
  }
  return fullPhone.replace(/\D/g, "");
};

// Helper to extract dial code from full phone number
const extractIndicatif = (fullPhone: string, defaultIndicatif: string): string => {
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

// Bordure rouge en bas : champ incomplet (indication visuelle) ou erreur de validation
const fieldStateClass = (showRedBorder: boolean) =>
  showRedBorder
    ? "!border-0 !border-b-2 !border-b-red-500 !rounded-none focus:!border-0 focus:!border-b-2 focus:!border-b-red-500 focus:!ring-0 shadow-none"
    : "border-gray-200";

const navigateToDashboard = (
  router: ReturnType<typeof useRouter>,
  role?: string,
) => {
  if (role === "ADMIN") router.push("/admin-dashboard");
  else if (role === "INSTRUCTOR") router.push("/instructor-dashboard");
  else router.push("/student-dashboard");
};

// Initial form data pre-filled with user info
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

export default function CompleteProfile() {
  const router = useRouter();
  const { user } = useLocalAuth();
  const { completeProfile, isComplete, checkProfile } = useProfile();

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
  const [phoneConflictError, setPhoneConflictError] = useState<string | null>(null);
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

  const incompleteFields = useMemo(
    () => ({
      firstName: !formData.firstName.trim(),
      lastName: !formData.lastName.trim(),
      ageRange: !formData.ageRange,
      currentStatus: !formData.currentStatus,
      referralSource: !formData.referralSource,
      sexe: !formData.sexe,
      region: !formData.region,
      residenceType: !formData.residenceType,
      telephone: !originalPhone && !formData.telephone.trim(),
      disabilityType: formData.disability && !formData.disabilityType,
      consentGiven: !formData.consentGiven,
    }),
    [formData, originalPhone],
  );

  const displayName =
    formData.firstName && formData.lastName
      ? `${formData.firstName} ${formData.lastName}`
      : "Mon Profil";

  // Valide le téléphone uniquement s'il est renseigné (champ optionnel côté backend)
  const validatePhone = (phone: string, dialCode: string): string | null => {
    if (!phone.trim()) return null;

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

  // Redirect if profile is already complete
  useEffect(() => {
    if (!protectLoading && isComplete === true) {
      navigateToDashboard(router, user?.role);
    }
  }, [protectLoading, isComplete, user, router]);

  // Fetch profile metadata and user profile on mount
  useEffect(() => {
    if (!canAccess) return;

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setMetadataError(null);

      let metadata: ProfileMetadataResponse | null = null;

      try {
        metadata = await UserApi.getProfileMetadata();
        if (!cancelled) {
          setProfileMetadata(metadata);
        }
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
          if (form.telephone) {
            setOriginalPhone(form.telephone);
          }
        }
      } catch (error) {
        logger.error("Erreur lors de la récupération du profil:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [canAccess]);

  // Handle input changes
  const handleChange = useCallback(
    (field: keyof ProfileFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSkip = () => {
    navigateToDashboard(router, user?.role);
  };

  // Handle form submission — tous les champs sont optionnels (aligné sur CompleteProfileDto)
  const handleSave = async () => {
    const errors: Record<string, string> = {};

    if (formData.disability && !formData.disabilityType) {
      errors.disabilityType = "Veuillez sélectionner un type de handicap";
    }

    if (!originalPhone && formData.telephone.trim()) {
      const phoneError = validatePhone(formData.telephone, formData.indicatif);
      if (phoneError) errors.telephone = phoneError;
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const profilePayload = buildProfilePayload();

    if (Object.keys(profilePayload).length === 0) {
      toast.info("Aucune information à enregistrer.");
      handleSkip();
      return;
    }

    setIsSaving(true);
    try {
      const result = await completeProfile(profilePayload);

      if (result) {
        const message = result.isProfileComplete
          ? "Félicitations ! Votre profil a été complété avec succès !"
          : "Vos informations ont été enregistrées.";
        toast.success(message);

        localStorage.removeItem("user_profile_cache");
        await checkProfile();

        setTimeout(() => {
          navigateToDashboard(router, user?.role);
        }, 1500);
      }
    } catch (error) {
      logger.error("Erreur lors de la completion du profil:", error);
      
      // Utiliser le système de mapping d'erreurs
      const errorMapping = getErrorMapping(error);
      const errorMessage = errorMapping.message;
      
      // Si l'erreur a un code connu, utiliser le message du mapping
      const displayMessage = (error as any)?.code && errorMapping 
        ? errorMessage 
        : (error as Error)?.message || errorMessage;
      
      // Vérifier si c'est une erreur de téléphone duplicata
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
        setTimeout(() => setPhoneConflictError(null), 5000);
      } else {
        toast.error(`Erreur: ${displayMessage}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state while checking auth
  if (protectLoading || showAuthModal) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#e9eff4] to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center py-8 md:py-12 pt-20 sm:pt-24 lg:pt-28">
          <div className="w-full max-w-[1600px] px-6 lg:px-12 xl:px-16 mx-auto text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Vérification...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#e9eff4] to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center py-8 md:py-12 pt-20 sm:pt-24 lg:pt-28">
          <div className="w-full max-w-[1600px] px-6 lg:px-12 xl:px-16 mx-auto text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">
              Chargement de votre profil...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#e9eff4] to-white">
      <Header />

      <main className="flex-1 py-8 md:py-12 pt-20 sm:pt-24 lg:pt-28">
        <div className="w-full max-w-[1600px] px-6 lg:px-12 xl:px-16 mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 lg:mb-10">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full shrink-0 w-12 h-12 lg:w-14 lg:h-14"
            >
              <ArrowLeft className="h-5 w-5 lg:h-6 lg:w-6" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                Compléter votre profil
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg">
                Complétez votre profil à votre rythme pour personnaliser votre
                expérience. Tous les champs sont optionnels.
              </p>
            </div>
          </div>

          {/* Profile Header Card - same style as "Mon Profil" */}
          <Card className="mb-6 lg:mb-8 overflow-hidden border-0 shadow-lg w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 md:p-8 lg:p-12">
              <div className="flex flex-col md:flex-row items-center gap-6 lg:gap-8">
                <div className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full border-4 border-white shadow-xl bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                    {formData.firstName?.[0]?.toUpperCase() ||
                      formData.email?.[0]?.toUpperCase() ||
                      "U"}
                  </span>
                </div>

                <div className="text-center md:text-left text-white">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                    {displayName}
                  </h2>
                  {formData.email && (
                    <p className="text-blue-100 mt-1 text-base lg:text-lg">
                      {formData.email}
                    </p>
                  )}
                  <div className="inline-flex items-center gap-1 lg:gap-2 mt-2 lg:mt-3 bg-white/20 px-3 py-1 lg:px-4 lg:py-2 rounded-full text-sm lg:text-base">
                    <CheckCircle2 className="h-4 w-4 lg:h-5 lg:w-5" />
                    Profil optionnel
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {metadataError && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {metadataError}
            </div>
          )}

          {/* Form Card */}
          <Card className="border-0 shadow-lg w-full">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-5 lg:px-10 lg:py-7">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 lg:h-7 lg:w-7 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg lg:text-2xl">
                    Informations personnelles
                  </CardTitle>
                  <CardDescription className="text-sm lg:text-base">
                    Ces informations nous permettront de mieux vous connaître.
                    Les champs non remplis sont soulignés en rouge pour vous
                    rappeler de les compléter plus tard.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 md:p-8 lg:p-12">
              <div className="space-y-8 lg:space-y-12">
                {/* Section: Identité */}
                <div className="space-y-4 lg:space-y-6">
                  <h3 className="text-lg lg:text-2xl font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b-2 border-gray-200">
                    <User className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                    Identité
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-10">
                    <div className="space-y-2 lg:space-y-3">
                      <Label
                        htmlFor="firstName"
                        className="text-sm lg:text-base font-medium text-gray-700"
                      >
                        Prénom
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => {
                          handleChange("firstName", e.target.value);
                          if (fieldErrors.firstName) {
                            setFieldErrors((prev) => ({ ...prev, firstName: "" }));
                          }
                        }}
                        disabled={isSaving}
                        aria-invalid={Boolean(fieldErrors.firstName)}
                        placeholder="Votre prénom"
                        className={`h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg bg-white ${fieldStateClass(incompleteFields.firstName || Boolean(fieldErrors.firstName))}`}
                      />
                      {fieldErrors.firstName && (
                        <p className="text-sm text-red-600">{fieldErrors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2 lg:space-y-3">
                      <Label
                        htmlFor="lastName"
                        className="text-sm lg:text-base font-medium text-gray-700"
                      >
                        Nom
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => {
                          handleChange("lastName", e.target.value);
                          if (fieldErrors.lastName) {
                            setFieldErrors((prev) => ({ ...prev, lastName: "" }));
                          }
                        }}
                        disabled={isSaving}
                        aria-invalid={Boolean(fieldErrors.lastName)}
                        placeholder="Votre nom"
                        className={`h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg bg-white ${fieldStateClass(incompleteFields.lastName || Boolean(fieldErrors.lastName))}`}
                      />
                      {fieldErrors.lastName && (
                        <p className="text-sm text-red-600">{fieldErrors.lastName}</p>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200 my-8 lg:my-10" />

                {/* Section: Préférences personnelles */}
                <div className="space-y-4 lg:space-y-6">
                  <h3 className="text-lg lg:text-2xl font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b-2 border-gray-200">
                    <Heart className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                    Préférences personnelles
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-10">
                    <div className="space-y-2 lg:space-y-3">
                      <Label
                        htmlFor="ageRange"
                        className="text-sm lg:text-base font-medium text-gray-700"
                      >
                        Tranche d&apos;âge
                      </Label>
                      <Select
                        value={formData.ageRange}
                        onValueChange={(value) => {
                          handleChange("ageRange", value);
                          if (fieldErrors.ageRange) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              ageRange: "",
                            }));
                          }
                        }}
                        disabled={isSaving || !metadataReady}
                      >
                        <SelectTrigger
                          id="ageRange"
                          aria-invalid={Boolean(fieldErrors.ageRange)}
                          className={`h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg w-full ${fieldStateClass(incompleteFields.ageRange || Boolean(fieldErrors.ageRange))}`}
                        >
                          <SelectValue placeholder="Sélectionnez..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ageRangeOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.ageRange && (
                        <p className="text-sm text-red-600">
                          {fieldErrors.ageRange}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 lg:space-y-3">
                      <Label
                        htmlFor="currentStatus"
                        className="text-sm lg:text-base font-medium text-gray-700"
                      >
                        Statut actuel
                      </Label>
                      <Select
                        value={formData.currentStatus}
                        onValueChange={(value) => {
                          handleChange("currentStatus", value);
                          if (fieldErrors.currentStatus) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              currentStatus: "",
                            }));
                          }
                        }}
                        disabled={isSaving || !metadataReady}
                      >
                        <SelectTrigger
                          id="currentStatus"
                          aria-invalid={Boolean(fieldErrors.currentStatus)}
                          className={`h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg w-full ${fieldStateClass(incompleteFields.currentStatus || Boolean(fieldErrors.currentStatus))}`}
                        >
                          <SelectValue placeholder="Sélectionnez..." />
                        </SelectTrigger>
                        <SelectContent>
                          {currentStatusOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.currentStatus && (
                        <p className="text-sm text-red-600">
                          {fieldErrors.currentStatus}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 lg:space-y-3 md:col-span-2">
                      <Label
                        htmlFor="referralSource"
                        className="text-sm lg:text-base font-medium text-gray-700"
                      >
                        Comment nous avez-vous connus ?
                      </Label>
                      <Select
                        value={formData.referralSource}
                        onValueChange={(value) => {
                          handleChange("referralSource", value);
                          if (fieldErrors.referralSource) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              referralSource: "",
                            }));
                          }
                        }}
                        disabled={isSaving || !metadataReady}
                      >
                        <SelectTrigger
                          id="referralSource"
                          aria-invalid={Boolean(fieldErrors.referralSource)}
                          className={`h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg w-full ${fieldStateClass(incompleteFields.referralSource || Boolean(fieldErrors.referralSource))}`}
                        >
                          <SelectValue placeholder="Sélectionnez..." />
                        </SelectTrigger>
                        <SelectContent>
                          {referralSourceOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.referralSource && (
                        <p className="text-sm text-red-600">
                          {fieldErrors.referralSource}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-10">
                    <div className="space-y-2 lg:space-y-3">
                      <Label
                        htmlFor="sexe"
                        className="text-sm lg:text-base font-medium text-gray-700"
                      >
                        Genre
                      </Label>
                      <Select
                        value={formData.sexe}
                        onValueChange={(value) => {
                          handleChange("sexe", value as SexeType);
                          if (fieldErrors.sexe) {
                            setFieldErrors((prev) => ({ ...prev, sexe: "" }));
                          }
                        }}
                        disabled={isSaving}
                      >
                        <SelectTrigger
                          id="sexe"
                          aria-invalid={Boolean(fieldErrors.sexe)}
                          className={`h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg w-full ${fieldStateClass(incompleteFields.sexe || Boolean(fieldErrors.sexe))}`}
                        >
                          <SelectValue placeholder="Sélectionnez..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SEXE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.sexe && (
                        <p className="text-sm text-red-600">
                          {fieldErrors.sexe}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 lg:space-y-3">
                      <Label
                        htmlFor="region"
                        className="text-sm lg:text-base font-medium text-gray-700 flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                        Région
                      </Label>
                      <Select
                        value={formData.region}
                        onValueChange={(value) => {
                          handleChange("region", value as RegionType);
                          if (fieldErrors.region) {
                            setFieldErrors((prev) => ({ ...prev, region: "" }));
                          }
                        }}
                        disabled={isSaving}
                      >
                        <SelectTrigger
                          id="region"
                          aria-invalid={Boolean(fieldErrors.region)}
                          className={`h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg w-full ${fieldStateClass(incompleteFields.region || Boolean(fieldErrors.region))}`}
                        >
                          <SelectValue placeholder="Sélectionnez votre région" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(REGION_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      {fieldErrors.region && (
                        <p className="text-sm text-red-600">
                          {fieldErrors.region}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm lg:text-base font-medium text-gray-700 flex items-center gap-2">
                      <Home className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                      Type de résidence
                    </Label>
                    <div className="flex gap-2">
                      {Object.entries(RESIDENCE_LABELS).map(
                        ([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              handleChange(
                                "residenceType",
                                value as ResidenceType,
                              );
                              if (fieldErrors.residenceType) {
                                setFieldErrors((prev) => ({
                                  ...prev,
                                  residenceType: "",
                                }));
                              }
                            }}
                            disabled={isSaving}
                          className={`flex-1 px-3 py-2 lg:px-4 lg:py-3 text-sm lg:text-base rounded-lg transition-all duration-200 ${
                              formData.residenceType === value
                                ? "border border-blue-600 bg-blue-50 text-blue-700 font-medium"
                                : incompleteFields.residenceType || fieldErrors.residenceType
                                  ? "border-0 border-b-2 border-b-red-500 bg-white text-gray-700"
                                  : "border border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                            } ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            {label}
                          </button>
                        ),
                      )}
                    </div>
                    {fieldErrors.residenceType && (
                      <p className="text-sm text-red-600">
                        {fieldErrors.residenceType}
                      </p>
                    )}
                  </div>

                  {/* Champ téléphone avec indicatif */}
                  {originalPhone ? (
                    <div className="space-y-2">
                      <Label
                        className="text-sm lg:text-base font-medium text-gray-700 flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                        Téléphone
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.indicatif}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-24 lg:w-28 h-12 lg:h-16 bg-gray-50 text-base lg:text-lg">
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
                          type="tel"
                          value={`${formData.indicatif} ${formData.telephone}`}
                          disabled
                          className="flex-1 h-12 lg:h-16 bg-gray-50 text-gray-600 cursor-not-allowed text-base lg:text-lg"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Votre numéro de téléphone est déjà enregistré
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-sm lg:text-base font-medium text-gray-700 flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                        Téléphone
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.indicatif}
                          onValueChange={(value) => {
                            handleChange("indicatif", value);
                            if (fieldErrors.telephone) {
                              setFieldErrors((prev) => ({ ...prev, telephone: "" }));
                            }
                          }}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-24 lg:w-28 h-12 lg:h-16 text-base lg:text-lg">
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
                          type="tel"
                          placeholder={getPhonePlaceholder(formData.indicatif)}
                          aria-invalid={Boolean(fieldErrors.telephone || phoneConflictError)}
                          value={formData.telephone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            const selectedCountry = COUNTRIES.find(
                              (c) => c.indicatif === formData.indicatif,
                            );
                            const maxLength = selectedCountry?.localLength || 15;
                            if (value.length <= maxLength) {
                              handleChange("telephone", value);
                              if (fieldErrors.telephone) {
                                setFieldErrors((prev) => ({ ...prev, telephone: "" }));
                              }
                              if (phoneConflictError) {
                                setPhoneConflictError(null);
                              }
                            }
                          }}
                          disabled={isSaving}
                          className={`flex-1 h-12 lg:h-16 text-base lg:text-lg ${fieldStateClass(incompleteFields.telephone || Boolean(fieldErrors.telephone || phoneConflictError))}`}
                          maxLength={COUNTRIES.find((c) => c.indicatif === formData.indicatif)?.localLength || 15}
                        />
                      </div>
                      {fieldErrors.telephone && (
                        <p className="text-sm text-red-600">
                          {fieldErrors.telephone}
                        </p>
                      )}
                      {phoneConflictError && (
                        <p className="text-sm text-red-600 font-medium">
                          {phoneConflictError}
                        </p>
                      )}
                      {formData.telephone && !fieldErrors.telephone && (
                        <p className="text-xs text-muted-foreground">
                          Numéro complet: {formData.indicatif} {formData.telephone}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <hr className="border-gray-200 my-8 lg:my-10" />

                {/* Section: Accessibilité */}
                <div className="space-y-4 lg:space-y-6">
                  <h3 className="text-lg lg:text-2xl font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b-2 border-gray-200">
                    <Info className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                    Accessibilité
                  </h3>

                  <div className="flex items-center space-x-3 lg:space-x-4 p-4 lg:p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <Checkbox
                      id="disability"
                      checked={formData.disability}
                      onCheckedChange={(checked) =>
                        handleChange("disability", checked === true)
                      }
                      disabled={isSaving}
                      className="h-5 w-5 lg:h-6 lg:w-6"
                    />
                    <Label
                      htmlFor="disability"
                      className="text-sm lg:text-base font-medium cursor-pointer"
                    >
                      Je suis en situation de handicap
                    </Label>
                  </div>

                  {formData.disability && (
                    <div className="space-y-4 lg:space-y-6 pl-4 lg:pl-8 border-l-2 lg:border-l-4 border-blue-200 ml-2">
                      <div className="space-y-2 lg:space-y-3">
                        <Label
                          htmlFor="disabilityType"
                          className="text-sm lg:text-base font-medium text-gray-700"
                        >
                          Type de handicap
                          {formData.disability && (
                            <span className="text-red-500"> *</span>
                          )}
                        </Label>
                        <Select
                          value={formData.disabilityType}
                          onValueChange={(value) => {
                            handleChange(
                              "disabilityType",
                              value as DisabilityType,
                            );
                            if (fieldErrors.disabilityType) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                disabilityType: "",
                              }));
                            }
                          }}
                          disabled={isSaving}
                        >
                          <SelectTrigger
                            id="disabilityType"
                            aria-invalid={Boolean(fieldErrors.disabilityType)}
                            className={`h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg w-full ${fieldStateClass(incompleteFields.disabilityType || Boolean(fieldErrors.disabilityType))}`}
                          >
                            <SelectValue placeholder="Sélectionnez le type de handicap" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(DISABILITY_TYPE_LABELS).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        {fieldErrors.disabilityType && (
                          <p className="text-sm text-red-600">
                            {fieldErrors.disabilityType}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 lg:space-y-3">
                        <Label
                          htmlFor="disabilityDetails"
                          className="text-sm lg:text-base font-medium text-gray-700"
                        >
                          Détails supplémentaires (optionnel)
                        </Label>
                        <textarea
                          id="disabilityDetails"
                          value={formData.disabilityDetails}
                          onChange={(e) =>
                            handleChange("disabilityDetails", e.target.value)
                          }
                          disabled={isSaving}
                          placeholder="Précisez si besoin..."
                          className="w-full min-h-[100px] lg:min-h-[120px] px-4 lg:px-5 py-3 lg:py-4 text-base lg:text-lg border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-gray-200 my-8 lg:my-10" />

                {/* Section: Consentement */}
                <div className="space-y-4 lg:space-y-6">
                  <h3 className="text-lg lg:text-2xl font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b-2 border-gray-200">
                    <CheckCircle2 className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                    Consentement
                  </h3>

                  <div
                    className={`flex items-start space-x-3 lg:space-x-4 p-4 lg:p-6 rounded-xl bg-gray-50 ${
                      incompleteFields.consentGiven || fieldErrors.consentGiven
                        ? "border-0 border-b-2 border-b-red-500"
                        : "border border-gray-200"
                    }`}
                  >
                    <Checkbox
                      id="consentGiven"
                      checked={formData.consentGiven}
                      onCheckedChange={(checked) => {
                        handleChange("consentGiven", checked === true);
                        if (checked && fieldErrors.consentGiven) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            consentGiven: "",
                          }));
                        }
                      }}
                      disabled={isSaving}
                      className="h-5 w-5 lg:h-6 lg:w-6 mt-0.5"
                    />
                    <Label
                      htmlFor="consentGiven"
                      className="text-sm lg:text-base font-medium cursor-pointer leading-relaxed"
                    >
                      J'accepte que mes données soient utilisées pour
                      améliorer mon expérience sur la plateforme. Je peux
                      retirer mon consentement à tout moment.
                    </Label>
                  </div>
                  {fieldErrors.consentGiven && (
                    <p className="text-sm text-red-600 font-medium">
                      {fieldErrors.consentGiven}
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 lg:gap-4 pt-6 lg:pt-10 border-t-2 border-gray-200 mt-8 lg:mt-10">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none h-12 lg:h-16 px-6 lg:px-10 text-base lg:text-lg"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !metadataReady}
                    className="flex-1 sm:flex-none h-12 lg:h-16 px-8 lg:px-12 text-base lg:text-lg bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
