"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileCompletionBanner } from "@/components/profile-completion-banner";
import { CourseCard } from "@/components/course-card";

import { useStudentDashboard } from "@/application/use-cases/useStudentDashboard";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { UserApi } from "@/infrastructure/api/user-api";
import logger from "@/shared/helpers/logger";
import type { BackendCourse } from "@/infrastructure/api/courses-api";

const StudentDashboard = () => {
  const { user } = useLocalAuth();
  const [page, setPage] = useState(1);
  const limit = 8;

  const { courses, loading, error } = useStudentDashboard({
    userId: user?.id?.toString() || null,
    page,
    limit,
  });

  const [profileName, setProfileName] = useState<string | null>(null);

  const authName = useMemo(() => {
    const first =
      (user as any)?.firstName ||
      (user as any)?.first_name ||
      (user as any)?.name?.split?.(" ")?.[0] ||
      "";
    const last =
      (user as any)?.lastName || (user as any)?.last_name || "";

    const full = `${String(first).trim()} ${String(last).trim()}`.trim();
    return full || String(first).trim() || null;
  }, [user]);

  const greetingName = authName || profileName;

  useEffect(() => {
    if (authName) return;

    let cancelled = false;
    const load = async () => {
      try {
        // Fallback: endpoint profil (sans modifier le backend)
        const profile = await UserApi.getUserProfile();
        const first = (profile as any)?.firstName || (profile as any)?.user?.firstName;
        const last = (profile as any)?.lastName || (profile as any)?.user?.lastName;
        const full = `${String(first ?? "").trim()} ${String(last ?? "").trim()}`.trim();
        if (!cancelled) setProfileName(full || String(first ?? "").trim() || null);
      } catch (e) {
        logger.warn("Impossible de récupérer le nom utilisateur pour la salutation", e);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authName]);

  type EnrolledCourseCard = BackendCourse & { progress?: number };

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
        // champs utiles pour "Reprendre"
        currentLesson:
          course.currentLesson ||
          course.current_lesson ||
          course.currentLessonId ||
          course.current_lesson_id ||
          course.lastAccessed ||
          course.last_accessed ||
          course.current_lesson?.lessonId ||
          course.current_lesson?.lesson_id,
      };
    })
    .filter((course): course is EnrolledCourseCard => course !== null);
  const totalPages = courses?.totalPages ?? 1;

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
            Bonjour{greetingName ? ` ${greetingName}` : ""}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Voici un aperçu de votre progression d'apprentissage
          </p>
        </div>

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
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {enrolledCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isEnrolled={true}
                    progress={course.progress}
                    variant="compact"
                    resumeLessonId={(course as any).currentLesson}
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
