"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { type DashboardView } from "./AdminLayout";

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
    // {
    //   id: "create-user" as const,
    //   label: "Créer utilisateur",
    //   icon: UserPlus,
    //   active: false,
    //   disabled: true,
    //   badge: "Bientôt",
    // },
    {
      id: "manage-categories" as const,
      label: "Catégories",
      icon: FolderOpen,
      active: currentView === "manage-categories",
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
      item.id === "manage-users" ||
      item.id === "manage-categories"
    ) {
      onViewChange(item.id);
    }
  };

  return (
    <div
      className={`relative flex h-screen flex-col overflow-hidden border-r border-white/10 bg-[#001B4D] text-white transition-all duration-300 ${
        isCollapsed ? "w-[72px]" : "w-72"
      }`}
    >
      {/* Brand */}
      <div className={`${isCollapsed ? "px-3" : "px-5"} pt-6 pb-4`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
                Bibocom
              </p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-white">Admin</p>
                <span className="h-2 w-2 rounded-full bg-[#FF3B3F]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1.5 px-3 pb-4">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`group relative w-full justify-start rounded-xl h-11 transition-all ${
              item.active
                ? "bg-[#002c75] text-white hover:bg-[#01338A]"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            } ${item.disabled ? "opacity-60 cursor-not-allowed" : ""} ${
              isCollapsed ? "px-2" : "px-4"
            }`}
            onClick={() => handleMenuClick(item)}
            disabled={item.disabled}
          >
            {item.active && !isCollapsed && (
              <span className="absolute left-0 top-2 h-7 w-1 rounded-full bg-[#FF3B3F]" />
            )}
            <item.icon
              className={`h-5 w-5 ${
                item.active ? "text-white" : "text-white/60"
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
                    className="text-[11px] bg-white/10 text-white/80 border border-white/20"
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
      <div className="px-3 pb-4 border-t border-white/10">
        <Button
          variant="ghost"
          className={`w-full justify-start h-11 rounded-xl text-white/80 hover:bg-white/10 hover:text-white ${
            isCollapsed ? "px-2" : "px-4"
          }`}
          onClick={onLogout}
        >
          <LogOut
            className={`h-5 w-5 text-white/60 ${isCollapsed ? "" : "mr-3"}`}
          />
          {!isCollapsed && <span className="font-medium">Déconnexion</span>}
        </Button>
      </div>

      {/* Collapse Button */}
      <div className="px-3 pb-6 border-t border-white/10">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-9 rounded-xl text-white/70 hover:bg-white/15 hover:text-white"
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
