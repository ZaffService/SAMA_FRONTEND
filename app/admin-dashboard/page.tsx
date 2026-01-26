"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GraduationCap,
  Users,
  BarChart3,
  Plus,
  LogOut,
  Settings,
  Shield,
  ArrowLeft,
  List,
} from "lucide-react";
import { CourseWizard } from "@/components/CourseWizard";
import { CourseManagement } from "@/components/CourseManagement";
import { CategoryDialog } from "@/components/category-dialog";
import { UserCreationForm } from "@/components/UserCreationForm";
import UserManagement from "@/components/UserManagement";
import { VideoStatusIndicator } from "@/components/VideoStatusIndicator";
import { useCategories } from "@/application/use-cases/useCategories";
import { toast } from "sonner";

type DashboardView = "overview" | "create-course" | "manage-courses" | "manage-users" | "video-status";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useLocalAuth();
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { refresh: refreshCategories } = useCategories();

  const handleCreateCourse = () => {
    setCurrentView("create-course");
  };

  const handleManageCourses = () => {
    setCurrentView("manage-courses");
  };

  const handleManageUsers = () => {
    setCurrentView("manage-users");
  };

  const handleCreateUser = () => {
    // Temporairement désactivé
    console.log("Fonctionnalité de création d'utilisateur temporairement désactivée");
    // router.push("/admin/create-user");
  };

  const handleBackToDashboard = () => {
    setCurrentView("overview");
  };

  const handleOpenCategoryDialog = () => {
    setIsCategoryDialogOpen(true);
  };

  const handleCategoryCreated = async () => {
    await refreshCategories();
    toast.success("Catégorie créée avec succès!");
  };

  const handleViewVideoStatus = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView("video-status");
  };

  if (currentView === "create-course") {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className="min-h-screen bg-gray-50">
          {/* Header avec bouton retour */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    onClick={handleBackToDashboard}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Retour au dashboard</span>
                  </Button>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Formulaire de création */}
          <main className="py-6">
            <CourseWizard />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (currentView === "manage-courses") {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className="min-h-screen bg-gray-50">
          {/* Header avec bouton retour */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    onClick={handleBackToDashboard}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Retour au dashboard</span>
                  </Button>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Gestion des cours */}
          <main className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion des Cours
              </h1>
              <p className="text-gray-600 mt-2">
                Gérez, modifiez et supervisez tous les cours de la plateforme
              </p>
            </div>
            <CourseManagement
              onEditCourse={(courseId) => {
                // Pour l'instant, on redirige vers la création avec pré-remplissage
                // Dans une version ultérieure, on pourrait avoir une page d'édition
                router.push(`/admin/create-course?edit=${courseId}`);
              }}
              onViewVideoStatus={handleViewVideoStatus}
            />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (currentView === "manage-users") {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className="min-h-screen bg-gray-50">
          {/* Header avec bouton retour */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    onClick={handleBackToDashboard}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Retour au dashboard</span>
                  </Button>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Gestion des utilisateurs */}
          <main className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <UserManagement />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (currentView === "video-status" && selectedCourseId) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className="min-h-screen bg-gray-50">
          {/* Header avec bouton retour */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    onClick={handleBackToDashboard}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Retour au dashboard</span>
                  </Button>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Statut des vidéos */}
          <main className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Statut des Vidéos
              </h1>
              <p className="text-gray-600 mt-2">
                Suivez l'état d'upload des vidéos de votre cours
              </p>
            </div>
            <VideoStatusIndicator
              courseId={selectedCourseId}
              onStatusChange={(isComplete) => {
                // Peut être utilisé pour mettre à jour l'interface si nécessaire
                console.log("Statut du cours mis à jour:", isComplete);
              }}
            />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard Administrateur
                  </h1>
                  <p className="text-sm text-gray-600">
                    Bienvenue, {user?.firstName} {user?.lastName}
                  </p>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Gestion des Cours */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <List className="h-5 w-5 text-blue-600" />
                    <span>Gestion des Cours</span>
                  </CardTitle>
                  <CardDescription>
                    Lister, modifier et gérer tous les cours de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={handleManageCourses}>
                    Gérer les cours
                  </Button>
                </CardContent>
              </Card>

              {/* Créer un Cours */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5 text-green-600" />
                    <span>Créer un Cours</span>
                  </CardTitle>
                  <CardDescription>
                    Ajouter un nouveau cours à la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={handleCreateCourse}>
                    Créer un cours
                  </Button>
                </CardContent>
              </Card>

              {/* Créer un Utilisateur */}
              <Card className="hover:shadow-lg transition-shadow opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-500">Créer un Utilisateur</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Fonctionnalité temporairement désactivée - Maintenance en cours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Indisponible pour le moment
                  </Button>
                </CardContent>
              </Card>

              {/* Gestion des Utilisateurs */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Gérer les Utilisateurs</span>
                  </CardTitle>
                  <CardDescription>
                    Gérer les comptes utilisateurs, rôles et permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={handleManageUsers}>
                    Gérer utilisateurs
                  </Button>
                </CardContent>
              </Card>

              {/* Statistiques Globales */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <span>Statistiques</span>
                  </CardTitle>
                  <CardDescription>
                    Analyser les métriques globales de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Voir stats globales (Bientôt disponible)
                  </Button>
                </CardContent>
              </Card>

              {/* Paramètres Système */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <span>Paramètres</span>
                  </CardTitle>
                  <CardDescription>
                    Configuration système et paramètres globaux
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Paramètres système (Bientôt disponible)
                  </Button>
                </CardContent>
              </Card>

              {/* Gestion des Catégories */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                    <span>Catégories</span>
                  </CardTitle>
                  <CardDescription>
                    Gérer les catégories de cours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={handleOpenCategoryDialog}
                  >
                    Gérer catégories
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Message d'information */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex"></div>
            </div>
          </div>
        </main>

        {/* Dialog pour créer une catégorie */}
        <CategoryDialog
          open={isCategoryDialogOpen}
          onOpenChange={setIsCategoryDialogOpen}
          onCategoryCreated={handleCategoryCreated}
        />
      </div>
    </ProtectedRoute>
  );
}
