"use client";

import { BookOpen, CheckCircle, Play, Award } from "lucide-react";
import Link from "next/link";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileCompletionBanner } from "@/components/profile-completion-banner";
import { CourseCard } from "@/components/course-card";

import { useStudentDashboard } from "@/application/use-cases/useStudentDashboard";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import logger from "@/shared/helpers/logger";
import type { BackendCourse } from "@/infrastructure/api/courses-api";

const StudentDashboard = () => {
  const { user } = useLocalAuth();
  const { courses, loading, error } = useStudentDashboard({
    userId: user?.id?.toString() || null,
  });

  type EnrolledCourseCard = BackendCourse & { progress?: number };

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
        id: course.id || course.course_id || index,
        courseId: course.id || course.course_id,
        lessonId: course.lastAccessed || course.last_accessed || null,
        type: course.status === "COMPLETED" ? "completed" : "in_progress",
        title: course.title || "Cours sans titre",
        progress: Math.round(course.progressPercentage || course.progress || 0),
        completed: course.status === "COMPLETED",
        time: "Récemment",
      };
    }) || [];

  const enrolledCourses: EnrolledCourseCard[] = (
    courses?.enrolled_courses ?? []
  )
    .map<EnrolledCourseCard | null>((course: any) => {
      const id = course.id || course.course_id;
      if (!id) return null;

      const description =
        typeof course.description === "string" ? course.description : undefined;

      return {
        id,
        title: course.title || "Cours sans titre",
        description,
        thumbnailUrl:
          course.thumbnailUrl ||
          course.thumbnail_url ||
          course.thumbnail ||
          course._thumbnail ||
          course.thumbnail?.url ||
          course.image ||
          course.coverImage ||
          course.cover_image,
        price:
          typeof course.price === "number" && Number.isFinite(course.price)
            ? course.price
            : 0,
        level: course.level || "BEGINNER",
        status: course.status || "ACTIVE",
        instructorName:
          course.instructorName ||
          course.instructor_name ||
          course.instructor,
        previewAvailable:
          course.previewAvailable ?? course.preview_available ?? false,
        enrollmentCount: course.enrollmentCount || course.enrollment_count || 0,
        progress:
          typeof course.progressPercentage === "number"
            ? course.progressPercentage
            : course.progress,
      };
    })
    .filter((course): course is EnrolledCourseCard => course !== null);

  const buildCourseHref = (
    courseId?: string | number | null,
    lessonId?: string | number | null,
  ) => {
    if (!courseId) return null;
    const encodedCourseId = encodeURIComponent(courseId.toString());
    if (lessonId) {
      return `/course-details/${encodedCourseId}?lessonId=${encodeURIComponent(
        lessonId.toString(),
      )}`;
    }
    return `/course-details/${encodedCourseId}`;
  };

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

      {/* Ajout de padding-top plus important pour mobile et tablette */}
      <main className="container mx-auto px-4 pt-24 sm:pt-28 md:pt-32 lg:pt-28 pb-12 space-y-6 md:space-y-8">
        <ProfileCompletionBanner
          stickyClassName="top-[96px] sm:top-[100px] lg:top-[104px]"
        />

        {/* En-tête avec salutation - Meilleure visibilité mobile */}
        <div className="space-y-2 pt-4 sm:pt-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Bonjour
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Voici un aperçu de votre progression d'apprentissage
          </p>
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
                recentActivities.map((activity) => {
                  const href = buildCourseHref(
                    activity.courseId,
                    activity.lessonId,
                  );

                  // Contenu inline flex — tout sur la même ligne
                  const activityContent = (
                    <div className="flex flex-row items-center gap-3 sm:gap-4 w-full">
                      {/* Icône */}
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

                      {/* Titre + temps */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-slate-900 truncate group-hover:text-primary transition-colors">
                          {activity.title}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500">
                          {activity.time}
                        </p>
                      </div>

                      {/* Progression */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
                  );

                  if (!href) {
                    return (
                      <div
                        key={activity.id}
                        className="group flex w-full items-center p-3 sm:p-4 rounded-xl border border-slate-200 bg-white"
                      >
                        {activityContent}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={activity.id}
                      href={href}
                      className="group w-full flex items-center p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      {activityContent}
                    </Link>
                  );
                })
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

        {/* Section Cours Inscrits - Style Udemy */}
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <CardTitle className="text-base sm:text-xl font-semibold text-slate-900">
                  Mes cours inscrits
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {enrolledCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isEnrolled={true}
                    progress={course.progress}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                </div>
                <p className="text-slate-600 text-base sm:text-lg font-medium mb-2">
                  Aucun cours inscrit
                </p>
                <p className="text-xs sm:text-sm text-slate-500 px-4">
                  Inscrivez-vous à un cours pour le retrouver ici avec son
                  aperçu complet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default StudentDashboard;
