"use client";

import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminOverview } from "./AdminOverview";
import { CategoriesManagement } from "./CategoriesManagement";

export type DashboardView =
  | "overview"
  | "create-course"
  | "manage-courses"
  | "manage-users"
  | "manage-categories"
  | "video-status";

interface AdminLayoutProps {
  user: any;
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onLogout: () => void;
  onOpenCategoryDialog: () => void;
  renderManageCourses?: () => ReactNode;
  renderCreateCourse?: () => ReactNode;
  renderManageUsers?: () => ReactNode;
  renderVideoStatus?: () => ReactNode;
  onCategoryUpdated?: () => void;
}

export function AdminLayout({
  user,
  currentView,
  onViewChange,
  onLogout,
  onOpenCategoryDialog,
  renderManageCourses,
  renderCreateCourse,
  renderManageUsers,
  renderVideoStatus,
  onCategoryUpdated,
}: AdminLayoutProps) {
  const renderContent = () => {
    switch (currentView) {
      case "overview":
        return (
          <AdminOverview
            onViewChange={onViewChange}
            onOpenCategoryDialog={onOpenCategoryDialog}
          />
        );
      case "manage-courses":
        return renderManageCourses ? (
          renderManageCourses()
        ) : (
          <div>Gestion des cours</div>
        );
      case "create-course":
        return renderCreateCourse ? (
          renderCreateCourse()
        ) : (
          <div>Créer un cours</div>
        );
      case "manage-users":
        return renderManageUsers ? (
          renderManageUsers()
        ) : (
          <div>Gestion des utilisateurs</div>
        );
      case "manage-categories":
        return (
          <CategoriesManagement
            onBack={() => onViewChange("overview")}
            onCategoryUpdated={onCategoryUpdated}
          />
        );
      case "video-status":
        return renderVideoStatus ? (
          renderVideoStatus()
        ) : (
          <div>Statut des vidéos</div>
        );
      default:
        return (
          <AdminOverview
            onViewChange={onViewChange}
            onOpenCategoryDialog={onOpenCategoryDialog}
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7FC]">
      {/* Sidebar */}
      <AdminSidebar
        user={user}
        currentView={currentView}
        onViewChange={onViewChange}
        onLogout={onLogout}
        onOpenCategoryDialog={onOpenCategoryDialog}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <main className="min-h-screen px-6 py-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px]">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
