"use client";

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
} from "lucide-react";

export default function InstructorDashboard() {
  const { user, logout } = useLocalAuth();

  return (
    <ProtectedRoute requiredRole="INSTRUCTOR">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <GraduationCap className="h-8 w-8 text-green-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard Instructeur
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
              {/* Mes Cours */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span>Mes Cours</span>
                  </CardTitle>
                  <CardDescription>
                    Gérer vos cours et leur contenu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Voir mes cours</Button>
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
                  <Button className="w-full">Créer</Button>
                </CardContent>
              </Card>

              {/* Étudiants */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Mes Étudiants</span>
                  </CardTitle>
                  <CardDescription>
                    Voir les étudiants inscrits à vos cours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Voir étudiants</Button>
                </CardContent>
              </Card>

              {/* Statistiques */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <span>Statistiques</span>
                  </CardTitle>
                  <CardDescription>
                    Analyser les performances de vos cours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Voir stats</Button>
                </CardContent>
              </Card>
            </div>

            {/* Message d'information */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <GraduationCap className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Dashboard Instructeur
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Cette page est un placeholder pour le dashboard
                      instructeur. Les fonctionnalités complètes seront
                      implémentées prochainement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
