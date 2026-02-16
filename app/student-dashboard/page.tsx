"use client";

import {
  BookOpen,
  CheckCircle,
  Play,
  Award,
  ArrowUpRight,
  Trophy,
  XCircle,
} from "lucide-react";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileCompletionBanner } from "@/components/profile-completion-banner";

import { useStudentDashboard } from "@/application/use-cases/useStudentDashboard";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import logger from "@/shared/helpers/logger";

const StudentDashboard = () => {
  const { user } = useLocalAuth();
  const { dashboard, courses, loading, error } = useStudentDashboard({
    userId: user?.id?.toString() || null,
  });

  // Statistiques réelles des cours
  const completedCourses = dashboard?.completed_courses || 0;
  const totalCourses = dashboard?.enrolled_course_count || 0;

  // ✅ STATISTIQUES RÉELLES DES QUIZ
  const passedQuizzes = dashboard?.passed_quizzes || 0;
  const failedQuizzes = dashboard?.failed_quizzes || 0;

  // Activité récente basée sur les vraies données de cours
  const recentActivities =
    courses?.enrolled_courses?.slice(0, 5).map((course, index) => {
      logger.log("🎨 [Dashboard UI] Cours à afficher:", course);
      logger.log(
        "🎨 [Dashboard UI] Progression:",
        course.progressPercentage,
        course.progress,
      );

      return {
        id: course.id || index,
        type: course.status === "COMPLETED" ? "completed" : "in_progress",
        title: course.title || "Cours sans titre",
        progress: Math.round(course.progressPercentage || course.progress || 0),
        completed: course.status === "COMPLETED",
        time: "Récemment",
      };
    }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] pt-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-lg text-muted-foreground">
              Chargement du dashboard...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] pt-20">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/25"
          >
            Réessayer
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <Header />
      <ProfileCompletionBanner />

      {/* Ajout de padding-top plus important pour mobile et tablette */}
      <main className="container mx-auto px-4 pt-24 sm:pt-28 md:pt-32 lg:pt-28 pb-12 space-y-6 md:space-y-8">
        {/* En-tête avec salutation - Meilleure visibilité mobile */}
        <div className="space-y-2 pt-4 sm:pt-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Bonjour
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Voici un aperçu de votre progression d'apprentissage
          </p>
        </div>

        {/* Cartes de Statistiques - AVEC QUIZ RÉUSSIS ET ÉCHOUÉS - Responsive optimisé */}
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {/* Cours Inscrits */}
          <Card className="group relative overflow-hidden bg-white hover:shadow-xl transition-all duration-300 border-slate-200">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">
                Cours Inscrits
              </CardTitle>
              <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {totalCourses}
                </div>
                <ArrowUpRight className="h-4 w-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-slate-500 mt-1 sm:mt-2">
                Total des cours
              </p>
            </CardContent>
          </Card>

          {/* Cours Terminés */}
          <Card className="group relative overflow-hidden bg-white hover:shadow-xl transition-all duration-300 border-slate-200">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">
                Cours Terminés
              </CardTitle>
              <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {completedCourses}
                </div>
                <ArrowUpRight className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-slate-500 mt-1 sm:mt-2">
                Sur {totalCourses} inscrits
              </p>
            </CardContent>
          </Card>

          {/* ✅ QUIZ RÉUSSIS - DONNÉES RÉELLES */}
          <Card className="group relative overflow-hidden bg-white hover:shadow-xl transition-all duration-300 border-slate-200">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">
                Quiz Réussis
              </CardTitle>
              <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {passedQuizzes}
                </div>
                <ArrowUpRight className="h-4 w-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-slate-500 mt-1 sm:mt-2">
                Score ≥ 70% (seuil de réussite)
              </p>
            </CardContent>
          </Card>

          {/* ❌ QUIZ ÉCHOUÉS - DONNÉES RÉELLES */}
          <Card className="group relative overflow-hidden bg-white hover:shadow-xl transition-all duration-300 border-slate-200">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">
                Quiz Échoués
              </CardTitle>
              <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {failedQuizzes}
                </div>
                <ArrowUpRight className="h-4 w-4 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-slate-500 mt-1 sm:mt-2">
                Score {"<"} 70% (à recommencer)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Section Activité Récente - Responsive optimisé */}
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <CardTitle className="text-base sm:text-xl font-semibold text-slate-900">
                  Activité Récente
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            <div className="space-y-2 sm:space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shadow-sm ${
                          activity.completed
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25"
                            : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25"
                        }`}
                      >
                        {activity.completed ? (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        ) : (
                          <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-slate-900 truncate group-hover:text-primary transition-colors">
                        {activity.title}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {activity.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <div
                          className={`text-base sm:text-lg font-bold ${
                            activity.completed
                              ? "text-emerald-600"
                              : "text-blue-600"
                          }`}
                        >
                          {activity.progress}%
                        </div>
                        <div className="text-xs text-slate-500 hidden sm:block">
                          progression
                        </div>
                      </div>
                      {activity.completed && (
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 sm:py-16">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                  </div>
                  <p className="text-slate-600 text-base sm:text-lg font-medium mb-2">
                    Aucune activité récente
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 px-4">
                    Commencez un cours pour voir votre progression ici
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default StudentDashboard;
