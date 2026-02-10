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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar
        user={user}
        currentView={currentView}
        onViewChange={onViewChange}
        onLogout={onLogout}
        onOpenCategoryDialog={onOpenCategoryDialog}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">{renderContent()}</main>
      </div>
    </div>
  );
}
