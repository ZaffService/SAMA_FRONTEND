"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { CourseWizard } from "@/components/CourseWizard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";

export default function CreateCoursePage() {
  const router = useRouter();
  const { logout } = useLocalAuth();
  const [courseCreated, setCourseCreated] = useState(false);

  const handleBackToDashboard = () => {
    router.push("/admin-dashboard");
  };

  const handleCourseCreated = () => {
    setCourseCreated(true);
  };

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

        {/* Wizard de création de cours */}
        <main className="py-6">
          <CourseWizard onCourseCreated={handleCourseCreated} />
        </main>

        {/* Message de succès */}
        {courseCreated && (
          <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
            <p className="text-green-800 font-medium">
              ✓ Cours créé avec succès ! Vous pouvez créer un autre cours ou
              retourner au dashboard.
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

