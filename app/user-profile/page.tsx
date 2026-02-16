"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import Swal from "sweetalert2";
import {
  Mail,
  User,
  ArrowLeft,
  Shield,
  CheckCircle2,
  Save,
  MapPin,
  Home,
  Heart,
  Info,
} from "lucide-react";

import {
  UserApi,
  UserProfileData,
  ProfileFormData,
  toProfileFormData,
  getChangedFields,
  SEXE_LABELS,
  REGION_LABELS,
  RESIDENCE_LABELS,
  DISABILITY_TYPE_LABELS,
  SexeType,
  RegionType,
  ResidenceType,
  DisabilityType,
} from "@/infrastructure/api/user-api";
import logger from "@/shared/helpers/logger";

// SweetAlert2 configuration for French locale
const showSuccessAlert = async () => {
  await Swal.fire({
    title: "Félicitations !",
    text: "Votre profil a été mis à jour avec succès !",
    icon: "success",
    confirmButtonColor: "#2563eb",
    confirmButtonText: "Fermer",
    timer: undefined, // No auto-close, user must click
  });
};

const showErrorAlert = (message: string) => {
  Swal.fire({
    title: "Erreur !",
    text: message,
    icon: "error",
    confirmButtonColor: "#dc2626",
    confirmButtonText: "Réessayer",
  });
};

const showCancelAlert = () => {
  Swal.fire({
    title: "Modifications annulées",
    text: "Vos modifications ont été annulées.",
    icon: "info",
    confirmButtonColor: "#2563eb",
    confirmButtonText: "OK",
    timer: 2000,
    timerProgressBar: true,
  });
};

const showNoChangesAlert = () => {
  Swal.fire({
    title: "Aucune modification",
    text: "Vous n'avez effectué aucune modification.",
    icon: "info",
    confirmButtonColor: "#2563eb",
    confirmButtonText: "OK",
    timer: 2000,
    timerProgressBar: true,
  });
};

const showLoadingAlert = () => {
  Swal.fire({
    title: "En cours...",
    text: "Mise à jour de votre profil...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Initial empty form data
const getEmptyFormData = (): ProfileFormData => ({
  firstName: "",
  lastName: "",
  email: "",
  telephone: "",
  indicatif: "+221",
  sexe: "",
  region: "",
  residenceType: "",
  disability: false,
  disabilityType: "",
  disabilityDetails: "",
  consentGiven: false,
});

export default function UserProfile() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(getEmptyFormData());
  const [initialData, setInitialData] = useState<ProfileFormData | null>(null);

  // Check if form has unsaved changes
  const hasChanges = initialData
    ? Object.keys(getChangedFields(initialData, formData)).length > 0
    : false;

  // Fetch user profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Function to fetch/refresh profile data
  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const profileData = await UserApi.getUserProfile();
      if (profileData) {
        const form = toProfileFormData(profileData);
        setFormData(form);
        setInitialData(form);
      }
    } catch (error) {
      logger.error("Erreur lors de la récupération du profil:", error);
      await showErrorAlert(
        "Impossible de charger votre profil. Veuillez réessayer.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleChange = useCallback(
    (field: keyof ProfileFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Reset form to initial values
  const handleReset = useCallback(() => {
    if (initialData) {
      setFormData(initialData);
      showCancelAlert();
    }
  }, [initialData]);

  // Handle form submission
  const handleSave = async () => {
    // Validate required fields
    if (!formData.firstName.trim()) {
      await showErrorAlert("Le prénom est obligatoire");
      return;
    }
    if (!formData.lastName.trim()) {
      await showErrorAlert("Le nom est obligatoire");
      return;
    }

    // Check for changes
    if (!initialData) {
      await showErrorAlert("Aucune donnée initiale à comparer");
      return;
    }

    const changedFields = getChangedFields(initialData, formData);
    const hasChangesNow = Object.keys(changedFields).length > 0;

    if (!hasChangesNow) {
      showNoChangesAlert();
      return;
    }

    // Validate conditional fields
    if (formData.disability && !formData.disabilityType) {
      await showErrorAlert("Veuillez sélectionner un type de handicap");
      return;
    }

    // Show loading alert
    showLoadingAlert();
    setIsSaving(true);

    try {
      await UserApi.completeProfile(changedFields);

      // Close loading and show success
      Swal.close();
      await showSuccessAlert();

      // Refetch profile from backend to get latest data
      await fetchProfile();
    } catch (error) {
      logger.error("Erreur lors de la mise à jour du profil:", error);
      Swal.close();
      await showErrorAlert(
        error instanceof Error
          ? error.message
          : "Impossible de mettre à jour le profil",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Display name helper
  const displayName =
    formData.firstName && formData.lastName
      ? `${formData.firstName} ${formData.lastName}`
      : "Mon Profil";

  // Check if disability details should be visible
  // Show only when disability type is "OTHER"
  const showDisabilityDetails =
    formData.disability && formData.disabilityType === "OTHER";

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#e9eff4] to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center py-8 md:py-12 pt-20 sm:pt-24 lg:pt-28">
          <div className="w-full max-w-[1600px] px-6 lg:px-12 xl:px-16 mx-auto text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">
              Chargement du profil...
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
        {/* Full width container */}
        <div className="w-full max-w-[1600px] px-6 lg:px-12 xl:px-16 mx-auto">
          {/* Header avec bouton retour */}
          <div className="flex items-center gap-4 mb-8 lg:mb-10">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/student-dashboard")}
              className="rounded-full shrink-0 w-12 h-12 lg:w-14 lg:h-14"
            >
              <ArrowLeft className="h-5 w-5 lg:h-6 lg:w-6" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                Mon Profil
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg">
                Gérez vos informations personnelles
              </p>
            </div>
          </div>

          {/* Profile Header Card - Full width */}
          <Card className="mb-6 lg:mb-8 overflow-hidden border-0 shadow-lg w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 md:p-8 lg:p-12">
              <div className="flex flex-col md:flex-row items-center gap-6 lg:gap-8">
                {/* Avatar */}
                <div className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full border-4 border-white shadow-xl bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                    {formData.firstName?.[0]?.toUpperCase() ||
                      formData.email?.[0]?.toUpperCase() ||
                      "U"}
                  </span>
                </div>

                {/* User Info */}
                <div className="text-center md:text-left text-white">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                    {displayName}
                  </h2>
                  <p className="text-blue-100 mt-1 text-base lg:text-lg">
                    {formData.email}
                  </p>
                  {formData.consentGiven && (
                    <div className="inline-flex items-center gap-1 lg:gap-2 mt-2 lg:mt-3 bg-white/20 px-3 py-1 lg:px-4 lg:py-2 rounded-full text-sm lg:text-base">
                      <CheckCircle2 className="h-4 w-4 lg:h-5 lg:w-5" />
                      Consentement donné
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Form Card - Full width layout */}
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
                    Mettez à jour vos informations de profil
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
                        Prénom <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleChange("firstName", e.target.value)
                        }
                        disabled={isSaving}
                        placeholder="Votre prénom"
                        className="h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2 lg:space-y-3">
                      <Label
                        htmlFor="lastName"
                        className="text-sm lg:text-base font-medium text-gray-700"
                      >
                        Nom <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleChange("lastName", e.target.value)
                        }
                        disabled={isSaving}
                        placeholder="Votre nom"
                        className="h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 lg:space-y-3">
                    <Label
                      htmlFor="email"
                      className="text-sm lg:text-base font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200"
                    />
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      L&apos;email ne peut pas être modifié
                    </p>
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
                        htmlFor="sexe"
                        className="text-sm lg:text-base font-medium text-gray-700"
                      >
                        Genre
                      </Label>
                      <Select
                        value={formData.sexe}
                        onValueChange={(value) =>
                          handleChange("sexe", value as SexeType)
                        }
                        disabled={isSaving}
                      >
                        <SelectTrigger
                          id="sexe"
                          className="h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg border-gray-200"
                        >
                          <SelectValue placeholder="Sélectionnez..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SEXE_LABELS).map(([value, label]) => (
                            <SelectItem
                              key={value}
                              value={value}
                              className="text-base lg:text-lg py-3"
                            >
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        onValueChange={(value) =>
                          handleChange("region", value as RegionType)
                        }
                        disabled={isSaving}
                      >
                        <SelectTrigger
                          id="region"
                          className="h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg border-gray-200"
                        >
                          <SelectValue placeholder="Sélectionnez votre région" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(REGION_LABELS).map(
                            ([value, label]) => (
                              <SelectItem
                                key={value}
                                value={value}
                                className="text-base lg:text-lg py-3"
                              >
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
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
                            onClick={() =>
                              handleChange(
                                "residenceType",
                                value as ResidenceType,
                              )
                            }
                            disabled={isSaving}
                            className={`flex-1 px-3 py-2 text-sm rounded-lg border-2 transition-all duration-200 ${
                              formData.residenceType === value
                                ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                                : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                            } ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            {label}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
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
                        </Label>
                        <Select
                          value={formData.disabilityType}
                          onValueChange={(value) =>
                            handleChange(
                              "disabilityType",
                              value as DisabilityType,
                            )
                          }
                          disabled={isSaving}
                        >
                          <SelectTrigger
                            id="disabilityType"
                            className="h-12 lg:h-16 px-4 lg:px-5 text-base lg:text-lg border-gray-200"
                          >
                            <SelectValue placeholder="Sélectionnez le type de handicap" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(DISABILITY_TYPE_LABELS).map(
                              ([value, label]) => (
                                <SelectItem
                                  key={value}
                                  value={value}
                                  className="text-base lg:text-lg py-3"
                                >
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Details field only visible when "OTHER" is selected */}
                      {showDisabilityDetails && (
                        <div className="space-y-2 lg:space-y-3 animate-fadeIn">
                          <Label
                            htmlFor="disabilityDetails"
                            className="text-sm lg:text-base font-medium text-gray-700"
                          >
                            Détails supplémentaires
                          </Label>
                          <textarea
                            id="disabilityDetails"
                            value={formData.disabilityDetails}
                            onChange={(e) =>
                              handleChange("disabilityDetails", e.target.value)
                            }
                            disabled={isSaving}
                            placeholder="Précisez votre handicap..."
                            className="w-full min-h-[100px] lg:min-h-[120px] px-4 lg:px-5 py-3 lg:py-4 text-base lg:text-lg border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <hr className="border-gray-200 my-8 lg:my-10" />

                {/* Section: Consentement */}
                <div className="space-y-4 lg:space-y-6">
                  <h3 className="text-lg lg:text-2xl font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b-2 border-gray-200">
                    <Shield className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                    Consentement
                  </h3>

                  <div className="flex items-start space-x-3 lg:space-x-4 p-4 lg:p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <Checkbox
                      id="consentGiven"
                      checked={formData.consentGiven}
                      onCheckedChange={(checked) =>
                        handleChange("consentGiven", checked === true)
                      }
                      disabled={isSaving}
                      className="h-5 w-5 lg:h-6 lg:w-6 mt-0.5"
                    />
                    <Label
                      htmlFor="consentGiven"
                      className="text-sm lg:text-base font-medium cursor-pointer leading-relaxed"
                    >
                      J&apos;accepte que mes données soient utilisées pour
                      améliorer mon expérience sur la plateforme. Je peux
                      retirer mon consentement à tout moment.
                    </Label>
                  </div>
                </div>

                {/* Buttons - Full width, aligned right */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 lg:gap-4 pt-6 lg:pt-10 border-t-2 border-gray-200 mt-8 lg:mt-10">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSaving || !hasChanges}
                    className="flex-1 sm:flex-none h-12 lg:h-16 px-6 lg:px-10 text-base lg:text-lg"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className={`flex-1 sm:flex-none h-12 lg:h-16 px-8 lg:px-12 text-base lg:text-lg ${
                      hasChanges
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-300 hover:bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                        Enregistrer les modifications
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
