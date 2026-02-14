"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Users,
  FolderOpen,
  Plus,
  UserCheck,
  List,
} from "lucide-react";
import { useAdminStats } from "@/application/use-cases/useAdminStats";
import { type DashboardView } from "./AdminLayout";

interface AdminOverviewProps {
  onViewChange: (view: DashboardView) => void;
  onOpenCategoryDialog: () => void;
}

export function AdminOverview({
  onViewChange,
  onOpenCategoryDialog,
}: AdminOverviewProps) {
  const {
    totalUsers,
    totalCourses,
    totalCategories,
    recentActivities,
    loading,
    error,
  } = useAdminStats();

  const stats = [
    {
      title: "Total Cours",
      value: loading ? "..." : totalCourses,
      description: "Cours actifs",
      icon: BookOpen,
      iconColor: "text-[#002c75]",
      iconBg: "bg-[#EAF1FF]",
    },
    {
      title: "Utilisateurs",
      value: loading ? "..." : totalUsers,
      description: "Inscrits",
      icon: Users,
      iconColor: "text-[#002c75]",
      iconBg: "bg-[#EDF2FF]",
    },
    {
      title: "Catégories",
      value: loading ? "..." : totalCategories,
      description: "Créées",
      icon: FolderOpen,
      iconColor: "text-[#002c75]",
      iconBg: "bg-[#F1F5FF]",
    },
  ];

  const quickActions = [
    {
      title: "Créer un nouveau cours",
      description: "Ajouter un cours à la plateforme",
      icon: Plus,
      action: () => onViewChange("create-course"),
      isPrimary: true,
    },
    {
      title: "Gérer les utilisateurs",
      description: "Administrer les comptes utilisateur",
      icon: UserCheck,
      action: () => onViewChange("manage-users"),
      isPrimary: false,
    },
    {
      title: "Créer une catégorie",
      description: "Ajouter une nouvelle catégorie",
      icon: Plus,
      action: onOpenCategoryDialog,
      isPrimary: false,
    },
    {
      title: "Détails des catégories",
      description: "Voir et gérer toutes les catégories",
      icon: List,
      action: () => onViewChange("manage-categories"),
      isPrimary: false,
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-2">
            Vue d'ensemble de votre plateforme d'apprentissage
          </p>
        </div>
        <Card className="border-[#FF3B3F]/30 bg-[#FFE9EA]">
          <CardContent className="p-6">
            <p className="text-[#C1121F]">
              Erreur lors du chargement des statistiques: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#101828] md:text-4xl">
          Tableau de bord
        </h1>
        <p className="text-sm text-[#475467] md:text-base">
          Vue d'ensemble de votre plateforme d'apprentissage
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="group relative overflow-hidden border border-[#E3EAF6] bg-white py-5 shadow-none transition-colors duration-200 hover:border-[#002c75]/30"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-[#667085]">
                {stat.title}
              </CardTitle>
              <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-[#101828]">
                {stat.value}
              </div>
              <p className="text-xs text-[#667085] mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-[#101828] mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className={`group relative cursor-pointer overflow-hidden border bg-white py-5 transition-colors duration-200 ${
                action.isPrimary
                  ? "border-[#FF3B3F]/50 hover:border-[#FF3B3F]"
                  : "border-[#E3EAF6] hover:border-[#002c75]/40"
              }`}
              onClick={action.action}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1.5 ${
                  action.isPrimary ? "bg-[#FF3B3F]" : "bg-[#002c75]"
                }`}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      action.isPrimary ? "bg-[#FFE8E9]" : "bg-[#EAF1FF]"
                    }`}
                  >
                    <action.icon
                      className={`h-5 w-5 ${
                        action.isPrimary ? "text-[#FF3B3F]" : "text-[#002c75]"
                      }`}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base text-[#101828]">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-[#667085]">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em]">
                  <span
                    className={`${
                      action.isPrimary ? "text-[#FF3B3F]" : "text-[#002c75]/70"
                    }`}
                  >
                    Action
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      action.isPrimary ? "text-[#FF3B3F]" : "text-[#002c75]"
                    }`}
                  >
                    Aller →
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Welcome Message */}
      <div>
        <h2 className="text-xl font-semibold text-[#101828] mb-4">Bienvenue</h2>
        <Card className="border border-[#E3EAF6] bg-white shadow-none">
          <CardContent className="p-6">
            <p className="text-[#475467]">
              Bienvenue sur votre tableau de bord d&apos;administration. Utilisez les
              actions rapides ci-dessus pour gérer votre plateforme
              d&apos;apprentissage.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
