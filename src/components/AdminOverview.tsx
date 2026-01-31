"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  FolderOpen,
  Plus,
  UserCheck,
  Settings,
} from "lucide-react";
import { useAdminStats } from "@/application/use-cases/useAdminStats";

type DashboardView =
  | "overview"
  | "create-course"
  | "manage-courses"
  | "manage-users"
  | "video-status";

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
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Utilisateurs",
      value: loading ? "..." : totalUsers,
      description: "Inscrits",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Catégories",
      value: loading ? "..." : totalCategories,
      description: "Créées",
      icon: FolderOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const quickActions = [
    {
      title: "Créer un nouveau cours",
      description: "Ajouter un cours à la plateforme",
      icon: Plus,
      action: () => onViewChange("create-course"),
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Gérer les utilisateurs",
      description: "Administrer les comptes utilisateur",
      icon: UserCheck,
      action: () => onViewChange("manage-users"),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Gérer les catégories",
      description: "Organiser les catégories de cours",
      icon: Settings,
      action: onOpenCategoryDialog,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
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
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">
              Erreur lors du chargement des statistiques: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-2">
          Vue d'ensemble de votre plateforme d'apprentissage
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={action.action}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.bgColor}`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Welcome Message */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bienvenue</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">
              Bienvenue sur votre tableau de bord d'administration. Utilisez les
              actions rapides ci-dessus pour gérer votre plateforme
              d'apprentissage.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
