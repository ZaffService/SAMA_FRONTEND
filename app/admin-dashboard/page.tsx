"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { CourseWizard } from "@/components/CourseWizard";
import { CourseManagement } from "@/components/CourseManagement";
import { CategoryDialog } from "@/components/category-dialog";
import UserManagement from "@/components/UserManagement";
import { VideoStatusIndicator } from "@/components/VideoStatusIndicator";
import { useCategories } from "@/application/use-cases/useCategories";
import { AdminLayout } from "@/components/AdminLayout";
import { toast } from "sonner";

type DashboardView =
  | "overview"
  | "create-course"
  | "manage-courses"
  | "manage-users"
  | "video-status";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useLocalAuth();
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { refresh: refreshCategories } = useCategories();

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
        renderCreateCourse={() => <CourseWizard />}
        renderManageUsers={() => <UserManagement />}
        renderVideoStatus={() =>
          selectedCourseId && (
            <VideoStatusIndicator
              courseId={selectedCourseId}
              onStatusChange={(isComplete) => {
                console.log("Statut du cours mis à jour:", isComplete);
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
