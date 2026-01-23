"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GraduationCap,
  Users,
  BarChart3,
  Plus,
  LogOut,
  Settings,
  ArrowLeft,
  List,
  BookOpen,
  UserPlus,
  Layers,
  ChevronLeft,
} from "lucide-react";
import { CourseWizard } from "@/components/CourseWizard";
import { CourseManagement } from "@/components/CourseManagement";
import { CategoryDialog } from "@/components/category-dialog";
import UserManagement from "@/components/UserManagement";
import { useCategories } from "@/application/use-cases/useCategories";
import { toast } from "sonner";

type DashboardView = "overview" | "create-course" | "manage-courses" | "manage-users";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useLocalAuth();
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { refresh: refreshCategories } = useCategories();

  const handleCreateCourse = () => {
    setCurrentView("create-course");
  };

  const handleManageCourses = () => {
    setCurrentView("manage-courses");
  };

  const handleManageUsers = () => {
    setCurrentView("manage-users");
  };

  const handleCreateUser = () => {
    router.push("/admin/create-user");
  };

  const handleBackToDashboard = () => {
    setCurrentView("overview");
  };

  const handleOpenCategoryDialog = () => {
    setIsCategoryDialogOpen(true);
  };

  const handleCategoryCreated = async () => {
    await refreshCategories();
    toast.success("Catégorie créée avec succès!");
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Vues avec sidebar
  if (currentView === "create-course") {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={toggleSidebar}
            onNavigate={handleBackToDashboard}
            currentView="create-course"
          />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <CourseWizard />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (currentView === "manage-courses") {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={toggleSidebar}
            onNavigate={handleBackToDashboard}
            currentView="manage-courses"
          />

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion des Cours
              </h1>
              <p className="text-gray-600 mt-2">
                Gérez, modifiez et supervisez tous les cours de la plateforme
              </p>
            </div>
            <CourseManagement
              onEditCourse={(courseId) => {
                router.push(`/admin/create-course?edit=${courseId}`);
              }}
            />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (currentView === "manage-users") {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={toggleSidebar}
            onNavigate={handleBackToDashboard}
            currentView="manage-users"
          />

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-y-auto">
            <UserManagement />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Vue d'overview avec sidebar
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={toggleSidebar}
          currentView="overview"
          onManageCourses={handleManageCourses}
          onCreateCourse={handleCreateCourse}
          onOpenCategories={handleOpenCategoryDialog}
          onManageUsers={handleManageUsers}
          onCreateUser={handleCreateUser}
        />

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Actions rapides */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Actions rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Gestion des Cours */}
              <Card className="hover:shadow-lg transition-all border-2 hover:-translate-y-0.5">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <List className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">Gestion des Cours</CardTitle>
                      <CardDescription className="text-sm">
                        Lister, modifier et gérer tous les cours de la plateforme
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    onClick={handleManageCourses}
                  >
                    Gérer les cours
                  </Button>
                </CardContent>
              </Card>

              {/* Créer un Cours */}
              <Card className="hover:shadow-lg transition-all border-2 hover:-translate-y-0.5">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Plus className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">Créer un Cours</CardTitle>
                      <CardDescription className="text-sm">
                        Ajouter un nouveau cours à la plateforme
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    onClick={handleCreateCourse}
                  >
                    Créer un cours
                  </Button>
                </CardContent>
              </Card>

              {/* Créer un Utilisateur */}
              <Card className="hover:shadow-lg transition-all border-2 hover:-translate-y-0.5">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-100 rounded-lg">
                      <UserPlus className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">Créer un Utilisateur</CardTitle>
                      <CardDescription className="text-sm">
                        Ajouter un nouvel utilisateur à la plateforme
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                    onClick={handleCreateUser}
                  >
                    Créer un utilisateur
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Gestion */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestion</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Gérer les Utilisateurs */}
              <Card className="hover:shadow-lg transition-all border-2 hover:-translate-y-0.5">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">Gérer les Utilisateurs</CardTitle>
                      <CardDescription className="text-sm">
                        Gérer les comptes utilisateurs, rôles et permissions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    onClick={handleManageUsers}
                  >
                    Gérer utilisateurs
                  </Button>
                </CardContent>
              </Card>

              {/* Catégories */}
              <Card className="hover:shadow-lg transition-all border-2 hover:-translate-y-0.5">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Layers className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">Catégories</CardTitle>
                      <CardDescription className="text-sm">
                        Gérer les catégories de cours
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={handleOpenCategoryDialog}
                  >
                    Gérer catégories
                  </Button>
                </CardContent>
              </Card>

              {/* Statistiques */}
              <Card className="hover:shadow-lg transition-all border-2 hover:-translate-y-0.5">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">Statistiques</CardTitle>
                      <CardDescription className="text-sm">
                        Analyser les métriques globales de la plateforme
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full bg-purple-200 hover:bg-purple-300 text-purple-700" 
                    disabled
                  >
                    Voir stats globales (Bientôt disponible)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Système */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Système</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Paramètres */}
              <Card className="hover:shadow-lg transition-all border-2 hover:-translate-y-0.5">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Settings className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">Paramètres</CardTitle>
                      <CardDescription className="text-sm">
                        Configuration système et paramètres globaux
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700" 
                    disabled
                  >
                    Paramètres système (Bientôt disponible)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>

        {/* Dialog pour créer une catégorie */}
        <CategoryDialog
          open={isCategoryDialogOpen}
          onOpenChange={setIsCategoryDialogOpen}
          onCategoryCreated={handleCategoryCreated}
        />
      </div>
    </ProtectedRoute>
  );
}

// Composant Sidebar
function Sidebar({ 
  collapsed, 
  onToggle, 
  currentView,
  onNavigate,
  onManageCourses,
  onCreateCourse,
  onOpenCategories,
  onManageUsers,
  onCreateUser
}: { 
  collapsed: boolean;
  onToggle: () => void;
  currentView?: string;
  onNavigate?: () => void;
  onManageCourses?: () => void;
  onCreateCourse?: () => void;
  onOpenCategories?: () => void;
  onManageUsers?: () => void;
  onCreateUser?: () => void;
}) {
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-slate-800 text-white transition-all duration-300 flex flex-col`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-semibold">Tableau de bord</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Section COURS */}
        <div className="mb-6">
          {!collapsed && (
            <div className="text-xs text-slate-400 font-semibold mb-2 px-3 uppercase tracking-wide">
              COURS
            </div>
          )}
          <button 
            onClick={onNavigate || onManageCourses}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
              currentView === 'overview' || currentView === 'manage-courses' 
                ? 'bg-blue-600 text-white' 
                : 'hover:bg-slate-700 text-slate-300'
            }`}
          >
            <List className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Gestion des Cours</span>}
          </button>
          <button 
            onClick={onCreateCourse}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
              currentView === 'create-course' 
                ? 'bg-blue-600 text-white' 
                : 'hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Plus className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Créer un Cours</span>}
          </button>
          <button 
            onClick={onOpenCategories}
            className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Layers className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Catégories</span>}
          </button>
        </div>

        {/* Section UTILISATEURS */}
        <div className="mb-6">
          {!collapsed && (
            <div className="text-xs text-slate-400 font-semibold mb-2 px-3 uppercase tracking-wide">
              UTILISATEURS
            </div>
          )}
          <button 
            onClick={onManageUsers}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
              currentView === 'manage-users' 
                ? 'bg-blue-600 text-white' 
                : 'hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Users className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Gérer les Utilisateurs</span>}
          </button>
          <button 
            onClick={onCreateUser}
            className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <UserPlus className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Créer un Utilisateur</span>}
          </button>
        </div>

        {/* Section SYSTÈME */}
        <div>
          {!collapsed && (
            <div className="text-xs text-slate-400 font-semibold mb-2 px-3 uppercase tracking-wide">
              SYSTÈME
            </div>
          )}
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-700 text-slate-300 transition-colors">
            <BarChart3 className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Statistiques</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-700 text-slate-300 transition-colors">
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Paramètres</span>}
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ChevronLeft className={`h-5 w-5 flex-shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </aside>
  );
}