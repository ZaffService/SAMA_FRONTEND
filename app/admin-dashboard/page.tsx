"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { CourseWizard } from "@/components/CourseWizard";
import { CourseManagement } from "@/components/CourseManagement";
import { CategoryDialog } from "@/components/category-dialog";
import UserManagement from "@/components/UserManagement";
import { VideoStatusIndicator } from "@/components/VideoStatusIndicator";
import { useCategories } from "@/application/use-cases/useCategories";
import { AdminLayout, type DashboardView } from "@/components/AdminLayout";
import { toast } from "sonner";
import logger from "@/shared/helpers/logger";

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useLocalAuth();
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { refresh: refreshCategories } = useCategories();

  // Vérifier si on vient de créer un cours (paramètre courseCreated=true)
  useEffect(() => {
    const focus = searchParams.get("focus");
    const courseCreated = searchParams.get("courseCreated");
    if (focus === "courses" || courseCreated === "true") {
      // Rediriger vers la gestion des cours
      setCurrentView("manage-courses");
    }
    if (focus === "courses" || courseCreated === "true") {
      // Nettoyer l'URL
      router.replace("/admin-dashboard", undefined);
    }
  }, [searchParams, router]);

  const handleViewVideoStatus = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView("video-status");
  };

  const handleCategoryCreated = async () => {
    await refreshCategories();
    toast.success("Catégorie créée avec succès!");
  };

  const handleOpenCategoryDialog = () => {
    setIsCategoryDialogOpen(true);
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={logout}
        onOpenCategoryDialog={handleOpenCategoryDialog}
        renderManageCourses={() => (
          <CourseManagement
            onEditCourse={(courseId) =>
              router.push(`/admin/create-course?edit=${courseId}`)
            }
            onViewVideoStatus={handleViewVideoStatus}
          />
        )}
        renderCreateCourse={() => (
          <CourseWizard
            onCourseCreated={() => setCurrentView("manage-courses")}
          />
        )}
        renderManageUsers={() => <UserManagement />}
        renderVideoStatus={() =>
          selectedCourseId && (
            <VideoStatusIndicator
              courseId={selectedCourseId}
              onStatusChange={(isComplete) => {
                logger.log("Statut du cours mis à jour:", isComplete);
              }}
            />
          )
        }
      />
      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onCategoryCreated={handleCategoryCreated}
      />
    </ProtectedRoute>
  );
}
