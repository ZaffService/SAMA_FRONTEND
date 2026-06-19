"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  BarChart3,
  GraduationCap,
  Plus,
  Users,
  FolderOpen,
  Settings,
  LogOut,
  // Banknote,
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
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered;

  const menuItems = [
    {
      id: "overview" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
      active: currentView === "overview",
    },
    {
      id: "kpis" as const,
      label: "KPIs",
      icon: BarChart3,
      active: currentView === "kpis",
    },
    {
      id: "manage-courses" as const,
      label: "Gestion Cours",
      icon: GraduationCap,
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
      label: "Gerer Utilisateur",
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
      label: "Categorie",
      icon: FolderOpen,
      active: currentView === "manage-categories",
      disabled: false,
      badge: null,
    },
    // Revenus par cours : nécessite GET /course/admin/all (non disponible sur l'API).
    // Les totaux revenus sont sur le Dashboard (GET /api/dashboard/kpis).
    // {
    //   id: "manage-revenue" as const,
    //   label: "Revenus",
    //   icon: Banknote,
    //   active: currentView === "manage-revenue",
    //   disabled: false,
    //   badge: null,
    // },
    {
      id: "settings" as const,
      label: "Parametre",
      icon: Settings,
      active: false,
      disabled: false,
      badge: null,
    },
  ];

  const handleMenuClick = (item: (typeof menuItems)[0]) => {
    if (item.id === "settings") {
      toast.info("Parametre - Cette fonctionnalite sera disponible bientot");
      return;
    }

    if (item.disabled) {
      toast.info(
        `${item.label} - Cette fonctionnalité est en cours de développement`,
      );
      return;
    }
    if (
      item.id === "overview" ||
      item.id === "kpis" ||
      item.id === "create-course" ||
      item.id === "manage-courses" ||
      item.id === "manage-users" ||
      item.id === "manage-categories"
      // || item.id === "manage-revenue"
    ) {
      onViewChange(item.id);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex h-screen flex-col overflow-hidden border-r border-white/10 bg-[#181721] text-white transition-all duration-300 ${
        isExpanded ? "w-72" : "w-[72px]"
      }`}
    >
      {/* Brand Icon */}
      <div className="px-3 pt-6 pb-4">
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
            <div className="h-3 w-3 rounded-full bg-[#A9F5E5]" />
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1.5 px-3 pb-4">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`group relative h-11 w-full justify-start rounded-xl transition-all duration-200 ${
              item.active
                ? "bg-[#A9F5E5] text-[#181721] hover:bg-[#97e9d8]"
                : "text-white/75 hover:bg-[#26233A] hover:text-[#FFFFFF]"
            } ${item.disabled ? "opacity-60 cursor-not-allowed" : ""} ${
              isExpanded ? "px-4" : "px-2"
            }`}
            onClick={() => handleMenuClick(item)}
            disabled={item.disabled}
          >
            {item.active && isExpanded && (
              <span className="absolute left-0 top-2 h-7 w-1 rounded-full bg-[#A9F5E5]" />
            )}
            <item.icon
              className={`h-5 w-5 ${
                item.active ? "text-[#181721]" : "text-white/60 group-hover:text-[#FFFFFF]"
              } ${isExpanded ? "mr-3" : "mx-auto"}`}
            />
            {isExpanded && (
              <>
                <span className="flex-1 text-left font-medium">
                  {item.label}
                </span>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="text-[11px] bg-white/10 text-white/80 border border-white/20"
                  >
                    {/* {item.badge} */}
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
          className={`h-11 w-full justify-start rounded-xl text-white/80 transition-all duration-200 hover:bg-[#26233A] hover:text-[#FFFFFF] ${
            isExpanded ? "px-4" : "px-2"
          }`}
          onClick={onLogout}
        >
          <LogOut
            className={`h-5 w-5 text-white/60 ${isExpanded ? "mr-3" : "mx-auto"}`}
          />
          {isExpanded && <span className="font-medium">Déconnexion</span>}
        </Button>
      </div>
    </div>
  );
}
