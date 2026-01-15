"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import {
  EnrollmentApi,
  type EnrolledCourse,
} from "@/infrastructure/api/enrollment-api";
import { StudentApi } from "@/infrastructure/api/student-api";
import {
  Loader2,
  BookOpen,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  ArrowLeft,
  Play,
  RotateCcw,
  Award,
  Target,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";

type TabType = "all" | "active" | "completed";

export default function MesApprentissagesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useLocalAuth();
  const [courses, setCourses] = useState<
    (EnrolledCourse & {
      completedLessons?: number;
      totalLessons?: number;
      lastAccessed?: string;
    })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Protection de la route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/mes-apprentissages");
    }
  }, [authLoading, isAuthenticated, router]);

  // Récupération des cours
  useEffect(() => {
    if (isAuthenticated) {
      loadEnrolledCourses();
    }
  }, [isAuthenticated]);

  const loadEnrolledCourses = async () => {
    try {
      setIsLoading(true);
      console.log("📚 [Mes Apprentissages] Chargement des cours inscrits...");

      const data = await EnrollmentApi.getEnrolledCourses();
      console.log(
        `📚 [Mes Apprentissages] ${data.courses.length} cours récupérés depuis enrollment`,
      );

      // ✅ FETCH PROGRESS FOR EACH ENROLLED COURSE - COMME LE DASHBOARD
      console.log(
        "📊 [Mes Apprentissages] Début récupération progression pour",
        data.courses.length,
        "cours",
      );
      const coursesWithProgress = await Promise.all(
        data.courses.map(async (course) => {
          try {
            const courseId = course.id;
            if (!courseId) {
              console.log("⚠️ [Mes Apprentissages] Cours sans ID:", course);
              return course;
            }

            console.log(
              `📚 [Mes Apprentissages] Récupération progression pour cours ID: ${courseId} - ${course.title}`,
            );
            const progressData = await StudentApi.getCourseProgress(courseId);

            console.log(
              `✅ [Mes Apprentissages] Progression reçue pour cours ${courseId}:`,
              {
                progress: progressData.progress,
                completed_lessons: progressData.completed_lessons,
                total_lessons: progressData.total_lessons,
                last_accessed: progressData.last_accessed,
                timestamp: new Date().toISOString(),
              },
            );

            return {
              ...course,
              progressPercentage: progressData.progress,
              completedLessons: progressData.completed_lessons,
              totalLessons: progressData.total_lessons,
              lastAccessed: progressData.last_accessed,
            };
          } catch (error) {
            console.error(
              `❌ [Mes Apprentissages] Erreur récupération progression pour cours ${course.id}:`,
              error,
            );
            // Return course with default progress if API fails
            return {
              ...course,
              progressPercentage: course.progressPercentage || 0,
              completedLessons: (course as any).completedLessons || 0,
              totalLessons: (course as any).totalLessons || 0,
            };
          }
        }),
      );

      console.log(
        "✅ [Mes Apprentissages] Progression chargée pour tous les cours",
      );
      console.log("📊 [Mes Apprentissages] Résumé des progressions:");
      coursesWithProgress.forEach((course) => {
        console.log(
          `  - Cours ${course.id}: ${course.progressPercentage}% (${(course as any).completedLessons}/${(course as any).totalLessons} leçons)`,
        );
      });

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error(
        "❌ [Mes Apprentissages] Erreur globale chargement des cours:",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction helper pour déterminer le statut d'un cours basé sur la progression
  const getCourseStatus = (progressPercentage: number) => {
    if (progressPercentage >= 100) return "completed";
    if (progressPercentage > 0) return "active";
    return "not-started";
  };

  // Filtrer les cours selon l'onglet actif
  const filteredCourses = courses.filter((course) => {
    if (activeTab === "all") return true;
    const status = getCourseStatus(course.progressPercentage || 0);
    if (activeTab === "active") return status === "active";
    if (activeTab === "completed") return status === "completed";
    return true;
  });

  // ✅ CALCULER LES STATISTIQUES BASÉ SUR LA PROGRESSION RÉELLE
  const activeCourses = courses.filter((c) => {
    const progress = c.progressPercentage || 0;
    return progress > 0 && progress < 100;
  }).length;

  const completedCourses = courses.filter((c) => {
    const progress = c.progressPercentage || 0;
    return progress >= 100;
  }).length;

  const notStartedCourses = courses.filter((c) => {
    const progress = c.progressPercentage || 0;
    return progress === 0;
  }).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-slate-600 font-medium">
            Chargement de vos cours...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-12 space-y-8">
        {/* En-tête avec bouton retour */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium group"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retour à l'accueil
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Mes Apprentissages
              </h1>
              <p className="text-slate-600 mt-1">
                Continuez votre progression et atteignez vos objectifs
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {/* Total des cours */}
          <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  Total des cours
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {courses.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* En cours */}
          <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  En cours
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {activeCourses}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Terminés */}
          <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  Terminés
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {completedCourses}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs avec design moderne */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 p-2 border-b border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === "all"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              Tous
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                {courses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === "active"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              En cours
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                {activeCourses}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === "completed"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              Terminés
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                {completedCourses}
              </span>
            </button>
          </div>

          {/* Liste des cours */}
          <div className="p-6">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 mx-auto mb-6 flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Aucun cours dans cette catégorie
                </h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Explorez notre catalogue pour commencer votre apprentissage et
                  développer de nouvelles compétences.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-600/25"
                >
                  Découvrir les cours
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.map((course, index) => {
                  const progress = course.progressPercentage || 0;
                  const courseStatus = getCourseStatus(progress);
                  const isCompleted = courseStatus === "completed";
                  const isActive = courseStatus === "active";
                  const notStarted = courseStatus === "not-started";

                  return (
                    <div
                      key={course.id}
                      className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 overflow-hidden hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Thumbnail avec gradient */}
                        <div className="relative w-full sm:w-40 h-32 sm:h-auto bg-gradient-to-br from-blue-100 to-blue-50 flex-shrink-0">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-blue-300" />
                          </div>

                          {/* Status Badge basé sur la vraie progression */}
                          {isCompleted && (
                            <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Terminé
                            </div>
                          )}
                          {isActive && (
                            <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                              <Play className="w-3.5 h-3.5" />
                              En cours
                            </div>
                          )}
                          {notStarted && (
                            <div className="absolute top-3 right-3 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                              <Clock className="w-3.5 h-3.5" />
                              Non commencé
                            </div>
                          )}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 p-5 flex flex-col justify-between">
                          <div>
                            {/* Titre */}
                            <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                              {course.title}
                            </h3>

                            {/* Instructeur & Date */}
                            <p className="text-sm text-slate-600">
                              {course.instructorName !== "undefined undefined"
                                ? course.instructorName
                                : "Instructeur BIBOCOM"}{" "}
                              •{" "}
                              {isCompleted && course.completionDate
                                ? `Terminé le ${formatDate(course.completionDate)}`
                                : `Inscrit le ${formatDate(course.enrollmentDate)}`}
                            </p>
                          </div>

                          {/* Progress & CTA */}
                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex-1 flex items-center gap-3">
                              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    isCompleted
                                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                                      : "bg-gradient-to-r from-blue-500 to-blue-600"
                                  }`}
                                  style={{
                                    width: `${course.progressPercentage}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-bold text-slate-900 min-w-[3rem] text-right">
                                {course.progressPercentage}%
                              </span>
                            </div>

                            {/* CTA Button */}
                            <Link
                              href={`/course-details/${course.id}`}
                              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                                isCompleted
                                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-md"
                                  : isActive
                                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-600/25"
                                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-600/25"
                              }`}
                            >
                              {isCompleted ? (
                                <>
                                  <RotateCcw className="w-4 h-4" />
                                  Revoir
                                </>
                              ) : isActive ? (
                                <>
                                  <Play className="w-4 h-4" />
                                  Continuer
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4" />
                                  Commencer
                                </>
                              )}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
