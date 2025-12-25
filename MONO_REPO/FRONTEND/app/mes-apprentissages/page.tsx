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
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { BackButton } from "@/components/back-button";

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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <BackButton href="/" text="Retour à l'accueil" />
      </div>

      {/* Header Section */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Mes Apprentissages
              </h1>
            </div>
          </div>
          <p className="text-gray-600 text-sm lg:text-base">
            Continuez votre progression et atteignez vos objectifs
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-4 px-1 relative font-medium text-sm lg:text-base transition-colors ${
                activeTab === "all"
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tous les cours
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                {courses.length}
              </span>
              {activeTab === "all" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("active")}
              className={`pb-4 px-1 relative font-medium text-sm lg:text-base transition-colors ${
                activeTab === "active"
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              En cours
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                {activeCourses}
              </span>
              {activeTab === "active" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`pb-4 px-1 relative font-medium text-sm lg:text-base transition-colors ${
                activeTab === "completed"
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Terminés
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                {completedCourses}
              </span>
              {activeTab === "completed" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </nav>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16 lg:py-24">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun cours dans cette catégorie
            </h3>
            <p className="text-gray-600 mb-6">
              Explorez notre catalogue pour commencer votre apprentissage
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Découvrir les cours
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="group bg-white border border-gray-200 rounded-xl hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full"
              >
                {/* Course Thumbnail */}
                <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-gray-300" />
                  </div>

                  {/* Status Badge */}
                  {course.status === "COMPLETED" && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Terminé
                    </div>
                  )}

                  {course.status === "ACTIVE" &&
                    course.progressPercentage > 0 && (
                      <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        En cours
                      </div>
                    )}
                </div>

                {/* Course Content */}
                <div className="p-5 flex flex-col flex-grow">
                  {/* Category Badge */}
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-md">
                      {course.title.includes("Design")
                        ? "DESIGN"
                        : "PROGRAMMING"}
                    </span>
                  </div>

                  {/* Course Title */}
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
                    {course.title}
                  </h3>

                  {/* Instructor */}
                  <p className="text-sm text-gray-600 mb-4">
                    {course.instructorName !== "undefined undefined"
                      ? course.instructorName
                      : "Instructeur BIBOCOM"}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        Progression
                      </span>
                      <span className="text-xs font-bold text-gray-900">
                        {course.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          course.status === "COMPLETED"
                            ? "bg-green-500"
                            : "bg-primary"
                        }`}
                        style={{ width: `${course.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Enrollment Date */}
                  <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {course.status === "COMPLETED" && course.completionDate
                        ? `Terminé le ${new Date(
                            course.completionDate,
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}`
                        : `Inscrit le ${new Date(
                            course.enrollmentDate,
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}`}
                    </span>
                  </div>

                  {/* Spacer pour pousser le bouton en bas */}
                  <div className="flex-grow"></div>

                  {/* CTA Button */}
                  <Link
                    href={`/cours/${course.id}/learn`}
                    className="block w-full text-center bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors group/btn mt-auto"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {course.status === "COMPLETED"
                        ? "Revoir le cours"
                        : course.progressPercentage === 0
                          ? "Commencer"
                          : "Continuer"}
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
