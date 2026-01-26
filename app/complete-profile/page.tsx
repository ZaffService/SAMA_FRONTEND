"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  AlertTriangle,
} from "lucide-react";
import { useProtectRoute } from "@/application/use-cases/useProtectRoute";

import {
  UserApi,
  UserProfileData,
  ProfileFormData,
  toProfileFormData,
  SEXE_LABELS,
  REGION_LABELS,
  RESIDENCE_LABELS,
  DISABILITY_TYPE_LABELS,
  SexeType,
  RegionType,
  ResidenceType,
  DisabilityType,
} from "@/infrastructure/api/user-api";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useProfile } from "@/hooks/useProfile";

// Initial form data pre-filled with user info
const getInitialFormData = (user: any): ProfileFormData => ({
  firstName: user?.firstName || user?.first_name || "",
  lastName: user?.lastName || user?.last_name || "",
  email: user?.email || "",
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
  const { completeProfile, isComplete } = useProfile();

  const {
    canAccess,
    loading: protectLoading,
    showAuthModal,
  } = useProtectRoute({
    message: "Veuillez vous connecter pour compléter votre profil.",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(getInitialFormData(user));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Redirect if profile is already complete
  useEffect(() => {
    if (!protectLoading && isComplete === true) {
      // Redirect based on user role
      if (user?.role === "ADMIN") {
        router.push("/admin-dashboard");
      } else if (user?.role === "INSTRUCTOR") {
        router.push("/instructor-dashboard");
      } else {
        router.push("/student-dashboard");
      }
    }
  }, [protectLoading, isComplete, user, router]);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profileData = await UserApi.getUserProfile();
        if (profileData) {
          const form = toProfileFormData(profileData);
          setFormData(form);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error);
        // Continue even if profile fetch fails - user can still fill the form
      } finally {
        setIsLoading(false);
      }
    };

    if (canAccess) {
      fetchProfile();
    }
  }, [canAccess]);

  // Handle input changes
  const handleChange = useCallback(
    (field: keyof ProfileFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Handle form submission
  const handleSave = async () => {
    const errors: Record<string, string> = {};

    // Validate required fields (firstName and lastName are pre-filled from registration)
    if (!formData.sexe) {
      errors.sexe = "Le genre est obligatoire";
    }
    if (!formData.region) {
      errors.region = "La région est obligatoire";
    }
    if (!formData.residenceType) {
      errors.residenceType = "Le type de résidence est obligatoire";
    }
    if (!formData.consentGiven) {
      errors.consentGiven = "Vous devez accepter les conditions pour continuer";
    }

    // Validate conditional fields
    if (formData.disability && !formData.disabilityType) {
      errors.disabilityType = "Veuillez sélectionner un type de handicap";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await completeProfile({
        sexe: formData.sexe as SexeType,
        region: formData.region as RegionType,
        residenceType: formData.residenceType as ResidenceType,
        disability: formData.disability,
        disabilityType: formData.disabilityType || undefined,
        disabilityDetails: formData.disabilityDetails || undefined,
        consentGiven: formData.consentGiven,
      });

      if (result) {
        toast.success("Félicitations ! Votre profil a été complété avec succès !");

        // Redirect based on user role
        setTimeout(() => {
          if (user?.role === "ADMIN") {
            router.push("/admin-dashboard");
          } else if (user?.role === "INSTRUCTOR") {
            router.push("/instructor-dashboard");
          } else {
            router.push("/student-dashboard");
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Erreur lors de la completion du profil:", error);
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Impossible de compléter le profil"
        }`
      );
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
          <div className="container mx-auto px-4 max-w-3xl text-center">
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
          <div className="container mx-auto px-4 max-w-3xl text-center">
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
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Compléter votre profil
              </h1>
              <p className="text-muted-foreground">
                Renseignez vos informations pour accéder à toutes les fonctionnalités
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">
                  Complétez votre profil pour continuer
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Certaines fonctionnalités nécessitent que votre profil soit complet.
                  Les champs marqués d&apos;une étoile (*) sont obligatoires.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Informations personnelles
                  </CardTitle>
                  <CardDescription>
                    Ces informations nous permettront de mieux vous connaître
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 md:p-8">
              <div className="space-y-8">
                {/* Section: Identité */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Identité
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        Prénom
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        readOnly
                        className="h-12 px-4 border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Nom
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        readOnly
                        className="h-12 px-4 border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Section: Préférences personnelles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-blue-600" />
                    Préférences personnelles
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sexe" className="text-sm font-medium text-gray-700">
                        Genre <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.sexe}
                        onValueChange={(value) => {
                          handleChange("sexe", value as SexeType);
                          if (fieldErrors.sexe) {
                            setFieldErrors(prev => ({ ...prev, sexe: "" }));
                          }
                        }}
                        disabled={isSaving}
                      >
                        <SelectTrigger
                          id="sexe"
                          className={`h-12 px-4 ${fieldErrors.sexe ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200"}`}
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
                        <p className="text-sm text-red-600">{fieldErrors.sexe}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="region" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        Région <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.region}
                        onValueChange={(value) => {
                          handleChange("region", value as RegionType);
                          if (fieldErrors.region) {
                            setFieldErrors(prev => ({ ...prev, region: "" }));
                          }
                        }}
                        disabled={isSaving}
                      >
                        <SelectTrigger
                          id="region"
                          className={`h-12 px-4 ${fieldErrors.region ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200"}`}
                        >
                          <SelectValue placeholder="Sélectionnez votre région" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(REGION_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.region && (
                        <p className="text-sm text-red-600">{fieldErrors.region}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-400" />
                      Type de résidence <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      {Object.entries(RESIDENCE_LABELS).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            handleChange("residenceType", value as ResidenceType);
                            if (fieldErrors.residenceType) {
                              setFieldErrors(prev => ({ ...prev, residenceType: "" }));
                            }
                          }}
                          disabled={isSaving}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border-2 transition-all duration-200 ${
                            formData.residenceType === value
                              ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                              : fieldErrors.residenceType
                                ? "border-red-500 bg-red-50 text-red-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                          } ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {fieldErrors.residenceType && (
                      <p className="text-sm text-red-600">{fieldErrors.residenceType}</p>
                    )}
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Section: Accessibilité */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Accessibilité
                  </h3>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="disability"
                      checked={formData.disability}
                      onCheckedChange={(checked) =>
                        handleChange("disability", checked === true)
                      }
                      disabled={isSaving}
                    />
                    <Label
                      htmlFor="disability"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Je suis en situation de handicap
                    </Label>
                  </div>

                  {formData.disability && (
                    <div className="space-y-4 pl-4 border-l-2 border-blue-200 ml-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="disabilityType"
                          className="text-sm font-medium text-gray-700"
                        >
                          Type de handicap <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.disabilityType}
                          onValueChange={(value) => {
                            handleChange("disabilityType", value as DisabilityType);
                            if (fieldErrors.disabilityType) {
                              setFieldErrors(prev => ({ ...prev, disabilityType: "" }));
                            }
                          }}
                          disabled={isSaving}
                        >
                          <SelectTrigger
                            id="disabilityType"
                            className={`h-12 px-4 ${fieldErrors.disabilityType ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200"}`}
                          >
                            <SelectValue placeholder="Sélectionnez le type de handicap" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(DISABILITY_TYPE_LABELS).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        {fieldErrors.disabilityType && (
                          <p className="text-sm text-red-600">{fieldErrors.disabilityType}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="disabilityDetails"
                          className="text-sm font-medium text-gray-700"
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
                          className="w-full min-h-[100px] px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-gray-200" />

                {/* Section: Consentement */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    Consentement
                  </h3>

                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="consentGiven"
                      checked={formData.consentGiven}
                      onCheckedChange={(checked) =>
                        handleChange("consentGiven", checked === true)
                      }
                      disabled={isSaving}
                    />
                    <Label
                      htmlFor="consentGiven"
                      className="text-sm font-medium cursor-pointer leading-relaxed"
                    >
                      J&apos;accepte que mes données soient utilisées pour améliorer mon
                      expérience sur la plateforme. Je peux retirer mon consentement
                      à tout moment. <span className="text-red-500">*</span>
                    </Label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none h-12 px-6"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none h-12 px-8 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer et continuer
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

