"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import {
  EnrollmentApi,
  type EnrolledCourse,
} from "@/infrastructure/api/enrollment-api";
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
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";

type TabType = "all" | "active" | "completed";

export default function MesApprentissagesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useLocalAuth();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
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
      const data = await EnrollmentApi.getEnrolledCourses();
      setCourses(data.courses);
    } catch (error) {
      console.error("Erreur chargement des cours:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les cours selon l'onglet actif
  const filteredCourses = courses.filter((course) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return course.status === "ACTIVE";
    if (activeTab === "completed") return course.status === "COMPLETED";
    return true;
  });

  const activeCourses = courses.filter((c) => c.status === "ACTIVE").length;
  const completedCourses = courses.filter(
    (c) => c.status === "COMPLETED",
  ).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryFromTitle = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("design") || lowerTitle.includes("figma")) return "Design";
    if (lowerTitle.includes("react")) return "React";
    if (lowerTitle.includes("javascript")) return "JavaScript";
    if (lowerTitle.includes("python")) return "Python";
    if (lowerTitle.includes("typescript")) return "Développement";
    return "PROGRAMMING";
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Header Section */}
      <header className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </div>

          {/* Title Section */}
          <div className="py-8 sm:py-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Mes Apprentissages
                </h1>
                <p className="text-gray-600 mt-1 text-sm">
                  Continuez votre progression et atteignez vos objectifs
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total des cours */}
          <div
            className="bg-white border border-gray-200 rounded-lg p-4 opacity-0 animate-[slideUp_0.4s_ease-out_0ms_forwards]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total des cours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.length}
                </p>
              </div>
            </div>
          </div>

          {/* En cours */}
          <div
            className="bg-white border border-gray-200 rounded-lg p-4 opacity-0 animate-[slideUp_0.4s_ease-out_100ms_forwards]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeCourses}
                </p>
              </div>
            </div>
          </div>

          {/* Terminés */}
          <div
            className="bg-white border border-gray-200 rounded-lg p-4 opacity-0 animate-[slideUp_0.4s_ease-out_200ms_forwards]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Terminés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedCourses}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Tabs */}
        <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 px-1 relative font-medium text-sm transition-colors ${
              activeTab === "all"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tous
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
              {courses.length}
            </span>
            {activeTab === "all" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("active")}
            className={`pb-3 px-1 relative font-medium text-sm transition-colors ${
              activeTab === "active"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            En cours
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
              {activeCourses}
            </span>
            {activeTab === "active" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`pb-3 px-1 relative font-medium text-sm transition-colors ${
              activeTab === "completed"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Terminés
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
              {completedCourses}
            </span>
            {activeTab === "completed" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {/* Courses List */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16 lg:py-24">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun cours dans cette catégorie
            </h3>
            <p className="text-gray-600 mb-6">
              Explorez notre catalogue pour commencer votre apprentissage et
              développer de nouvelles compétences.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Découvrir les cours
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course, index) => {
              const isCompleted = course.status === "COMPLETED";
              const hasStarted = course.progressPercentage > 0;
              const category = getCategoryFromTitle(course.title);

              return (
                <div
                  key={course.id}
                  className="group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 opacity-0 animate-[slideUp_0.4s_ease-out_forwards]"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-32 h-24 sm:h-auto bg-gray-100 flex-shrink-0">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gray-300" />
                      </div>

                      {/* Status Badge */}
                      {isCompleted && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Terminé
                        </div>
                      )}
                      {!isCompleted && hasStarted && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          En cours
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        {/* Category */}
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-600 mb-2">
                          {category}
                        </span>

                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                          {course.title}
                        </h3>

                        {/* Instructor & Date */}
                        <p className="text-sm text-gray-600 mb-3">
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
                      <div className="flex items-center gap-4">
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                isCompleted ? "bg-green-500" : "bg-blue-600"
                              }`}
                              style={{
                                width: `${course.progressPercentage}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-900 min-w-[2.5rem] text-right">
                            {course.progressPercentage}%
                          </span>
                        </div>

                        {/* CTA Button */}
                        <Link
                          href={`/course-details/${course.id}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isCompleted
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              Revoir
                            </>
                          ) : hasStarted ? (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              Continuer
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
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
      </main>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}