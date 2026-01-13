"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
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
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Camera,
  Mail,
  Phone,
  User,
  ArrowLeft,
  Shield,
  CheckCircle2,
  Save,
} from "lucide-react";
import { useProtectRoute } from "@/application/use-cases/useProtectRoute";

import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useAvatar } from "@/infrastructure/storage/AvatarContext";

interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  email_verified: boolean;
  avatar_url?: string;
}

export default function UserProfile() {
  const router = useRouter();

  const { user: authUser } = useLocalAuth();
  const { updateAvatar } = useAvatar();
  const {
    canAccess,
    loading: protectLoading,
    showAuthModal,
  } = useProtectRoute({
    message: "Veuillez vous connecter pour acceder a votre profil.",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authUser?.avatar_url) {
      setProfileImage(authUser.avatar_url);
    }
  }, [authUser]);

  useEffect(() => {
    // Utiliser les données de l'utilisateur connecté depuis le contexte local
    if (authUser) {
      const userData: UserData = {
        id: parseInt(String(authUser.id)) || 0,
        email: authUser.email,
        first_name:
          authUser.firstName || authUser.display_name?.split(" ")[0] || "",
        last_name:
          authUser.lastName ||
          authUser.display_name?.split(" ").slice(1).join(" ") ||
          "",
        phone: "", // Pas stocké dans le système local
        email_verified: authUser.isEmailVerified || false,
        avatar_url: authUser.avatar_url || authUser.avatar,
      };

      setUserData(userData);
      setFormData({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone,
      });

      if (userData.avatar_url) {
        setProfileImage(userData.avatar_url);
      }
    }

    setIsLoading(false);
  }, [authUser]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Pour la démo, on simule l'upload en créant une URL locale
      const reader = new FileReader();
      reader.onload = (e) => {
        const avatarUrl = e.target?.result as string;
        setProfileImage(avatarUrl);
        updateAvatar(
          avatarUrl,
          userData?.first_name || "",
          userData?.last_name || "",
        );
        toast.success("Photo mise a jour !");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(`Erreur: ${(error as Error).message}`);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Simulation de sauvegarde pour la démo
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mettre à jour les données utilisateur dans le contexte
      const updatedUser = {
        ...authUser,
        firstName: formData.first_name,
        lastName: formData.last_name,
        display_name: `${formData.first_name} ${formData.last_name}`.trim(),
      };

      // Ici on pourrait mettre à jour le contexte, mais pour la démo on simule
      toast.success("Profil sauvegarde avec succes !");
    } catch (error) {
      toast.error(`Erreur: ${(error as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const displayUser = userData || {
    id: authUser?.id || 0,
    email: authUser?.email || "",
    first_name: authUser?.display_name?.split(" ")[0] || "",
    last_name: authUser?.display_name?.split(" ").slice(1).join(" ") || "",
    phone: "",
    email_verified: false,
  };

  const displayAvatar = profileImage || authUser?.avatar_url || "";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#e9eff4] to-white">
      <Header />

      <main className="flex-1 py-8 md:py-12 pt-20 sm:pt-24 lg:pt-28">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/student-dashboard")}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Mon Profil
              </h1>
              <p className="text-muted-foreground">
                Gerez vos informations personnelles
              </p>
            </div>
          </div>

          {/* Profile Card */}
          <Card className="mb-6 overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar || "/placeholder.svg"}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                        <span className="text-4xl font-bold text-blue-600">
                          {displayUser.first_name?.[0] ||
                            displayUser.email?.[0]?.toUpperCase() ||
                            "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Camera className="h-5 w-5 text-gray-700" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* User Info */}
                <div className="text-center md:text-left text-white">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {displayUser.first_name || displayUser.last_name
                      ? `${displayUser.first_name} ${displayUser.last_name}`.trim()
                      : authUser?.display_name || "Bienvenue !"}
                  </h2>
                  <p className="text-blue-100 mt-1">
                    {displayUser.email || authUser?.email}
                  </p>
                  {displayUser.email_verified && (
                    <div className="inline-flex items-center gap-1 mt-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Email verifie
                    </div>
                  )}
                </div>
              </div>
            </div>
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
                    Mettez a jour vos informations de contact
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 md:p-8">
              <div className="space-y-6">
                {/* Prenom et Nom */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="first_name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Prenom
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      disabled={isSaving}
                      placeholder="Votre prenom"
                      className="h-12 px-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="last_name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Nom
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      disabled={isSaving}
                      placeholder="Votre nom"
                      className="h-12 px-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Email et Telephone */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4 text-gray-400" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="h-12 px-4 bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200"
                    />
                    <p className="text-xs text-muted-foreground">
                      L'email ne peut pas etre modifie
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4 text-gray-400" />
                      Telephone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      disabled={isSaving}
                      placeholder="+221 77 XXX XX XX"
                      className="h-12 px-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/student-dashboard")}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none h-12 px-6"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
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
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="mt-6 border-0 shadow-lg">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Securite</CardTitle>
                  <CardDescription>
                    Gerez la securite de votre compte
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Mot de passe</p>
                  <p className="text-sm text-muted-foreground">
                    Derniere modification il y a 30 jours
                  </p>
                </div>
                <Button variant="outline">Modifier</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
