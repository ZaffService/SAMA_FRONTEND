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
  BookOpen,
  Users,
  BarChart3,
  Plus,
  LogOut,
  Settings,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { CourseWizard } from "@/components/CourseWizard";

type DashboardView = "overview" | "create-course";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useLocalAuth();
  const [currentView, setCurrentView] = useState<DashboardView>("overview");

  const handleCreateCourse = () => {
    setCurrentView("create-course");
  };

  const handleBackToDashboard = () => {
    setCurrentView("overview");
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
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span>Gestion des Cours</span>
                  </CardTitle>
                  <CardDescription>
                    Créer, modifier et gérer tous les cours de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Voir tous les cours (Bientôt disponible)
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

              {/* Gestion des Utilisateurs */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Utilisateurs</span>
                  </CardTitle>
                  <CardDescription>
                    Gérer les comptes utilisateurs, rôles et permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Gérer utilisateurs (Bientôt disponible)
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
                  <Button className="w-full" disabled>
                    Gérer catégories (Bientôt disponible)
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
      </div>
    </ProtectedRoute>
  );
}
