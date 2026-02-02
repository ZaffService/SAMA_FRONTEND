"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  BookOpen,
  Plus,
  Users,
  UserPlus,
  FolderOpen,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

type DashboardView =
  | "overview"
  | "create-course"
  | "manage-courses"
  | "manage-users"
  | "video-status";

interface AdminSidebarProps {
  user: any;
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onLogout: () => void;
  onOpenCategoryDialog?: () => void;
}

export function AdminSidebar({
  user,
  currentView,
  onViewChange,
  onLogout,
  onOpenCategoryDialog,
}: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: "overview" as const,
      label: "Tableau de bord",
      icon: LayoutDashboard,
      active: currentView === "overview",
    },
    {
      id: "manage-courses" as const,
      label: "Gestion des cours",
      icon: BookOpen,
      active: currentView === "manage-courses",
    },
    {
      id: "create-course" as const,
      label: "Créer un cours",
      icon: Plus,
      active: currentView === "create-course",
    },
    {
      id: "manage-users" as const,
      label: "Gérer utilisateurs",
      icon: Users,
      active: currentView === "manage-users",
    },
    {
      id: "create-user" as const,
      label: "Créer utilisateur",
      icon: UserPlus,
      active: false,
      disabled: true,
      badge: "Bientôt",
    },
    {
      id: "categories" as const,
      label: "Catégories",
      icon: FolderOpen,
      active: false,
      disabled: false,
      badge: null,
    },
    {
      id: "stats" as const,
      label: "Statistiques",
      icon: BarChart3,
      active: false,
      disabled: true,
      badge: "Bientôt",
    },
    {
      id: "settings" as const,
      label: "Paramètres",
      icon: Settings,
      active: false,
      disabled: true,
      badge: "Bientôt",
    },
  ];

  const handleMenuClick = (item: (typeof menuItems)[0]) => {
    if (item.disabled) {
      toast.info(
        `${item.label} - Cette fonctionnalité est en cours de développement`,
      );
      return;
    }
    if (
      item.id === "overview" ||
      item.id === "create-course" ||
      item.id === "manage-courses" ||
      item.id === "manage-users"
    ) {
      onViewChange(item.id);
    } else if (item.id === "categories" && onOpenCategoryDialog) {
      onOpenCategoryDialog();
    }
  };

  return (
    <div
      className={`bg-[#171c26] border-r border-white/10 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } flex flex-col h-screen`}
    >
      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`w-full justify-start h-11 transition-all ${
              item.active
                ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            } ${
              item.disabled ? "opacity-60 cursor-not-allowed" : ""
            } ${isCollapsed ? "px-2" : "px-6"}`}
            onClick={() => handleMenuClick(item)}
            disabled={item.disabled}
          >
            <item.icon
              className={`h-5 w-5 ${
                item.active ? "text-white" : "text-gray-400"
              } ${isCollapsed ? "" : "mr-3"}`}
            />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left font-medium">
                  {item.label}
                </span>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-gray-700 text-gray-300 border-0"
                  >
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          className={`w-full justify-start h-11 text-gray-300 hover:bg-white/10 hover:text-white ${
            isCollapsed ? "px-2" : "px-4"
          }`}
          onClick={onLogout}
        >
          <LogOut
            className={`h-5 w-5 text-gray-400 ${isCollapsed ? "" : "mr-3"}`}
          />
          {!isCollapsed && <span className="font-medium">Déconnexion</span>}
        </Button>
      </div>

      {/* Collapse Button */}
      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 text-gray-400 hover:bg-white/10 hover:text-white"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
