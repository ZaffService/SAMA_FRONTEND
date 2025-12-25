"use client";

import { useState } from "react";
import Link from "next/link";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DashboardSkeleton } from "@/components/ui/skeleton";

import { BookOpen, CheckCircle2 } from "lucide-react";

import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useStudentDashboard } from "@/application/use-cases/useStudentDashboard";

export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default function StudentDashboard() {
  // ✅ TOUJOURS appeler les hooks au même endroit, dans le même ordre
  const { user, isLoading: authLoading } = useLocalAuth();
  const [selectedTab, setSelectedTab] = useState<"available" | "enrolled">(
    "enrolled",
  );

  // ✅ Déterminer si on doit charger le dashboard AVANT d'appeler le hook
  const userId = user?.id ? String(user.id) : null;
  const isStudent = user?.role === "STUDENT";
  const shouldLoadDashboard = !!userId && !isStudent;

  // ✅ Hook TOUJOURS appelé, mais enabled contrôle le chargement
  const {
    dashboard,
    courses,
    loading: dashboardLoading,
  } = useStudentDashboard({
    userId,
    enabled: shouldLoadDashboard,
  });

  // ✅ Maintenant on peut faire les checks conditionnels APRÈS tous les hooks

  // Loading global
  if (authLoading || (shouldLoadDashboard && dashboardLoading)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <DashboardSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  // Pas d'utilisateur
  if (!user) {
    return null;
  }

  // Étudiant simple (sans Tabs)
  if (isStudent) {
    return <StudentWelcome user={user} />;
  }

  // Dashboard complet (admin/instructor)
  return (
    <AdminStudentDashboard
      selectedTab={selectedTab}
      onTabChange={setSelectedTab}
      courses={courses?.enrolled_courses ?? []}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                              STUDENT WELCOME                                */
/* -------------------------------------------------------------------------- */

function StudentWelcome({ user }: { user: any }) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col pt-16">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="bg-card rounded-xl border shadow-sm p-8">
            <h1 className="text-3xl font-bold mb-4">
              Bienvenue, {user.firstName} 👋
            </h1>
            <p className="text-muted-foreground mb-6">
              Vous êtes connecté en tant qu'étudiant.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 text-left mb-6">
              <p>
                <strong>Email :</strong> {user.email}
              </p>
              <p>
                <strong>Nom :</strong> {user.firstName} {user.lastName}
              </p>
              <p>
                <strong>Membre depuis :</strong>{" "}
                {new Date(user.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>

            <Button asChild className="w-full">
              <Link href="/courses">Explorer les cours</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         DASHBOARD AVEC TABS (STABLE)                         */
/* -------------------------------------------------------------------------- */

function AdminStudentDashboard({
  selectedTab,
  onTabChange,
  courses,
}: {
  selectedTab: string;
  onTabChange: (v: any) => void;
  courses: any[];
}) {
  const enrolledCourses = courses.map((course: any) => {
    const progress = Number(course.progressPercentage ?? 0);
    return {
      id: String(course.id ?? course.ID),
      title: course.title,
      progress,
      image: course.thumbnail || "/placeholder.svg",
      isCompleted: progress >= 100,
      status: course.status,
      enrollmentDate: course.enrollmentDate,
      completionDate: course.completionDate,
    };
  });

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col pt-16">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs
          value={selectedTab}
          onValueChange={onTabChange}
          className="space-y-6"
        >
          <TabsList className="bg-card border shadow-sm p-1 rounded-xl">
            <TabsTrigger value="available">Cours à suivre</TabsTrigger>
            <TabsTrigger value="enrolled">Mes apprentissages</TabsTrigger>
          </TabsList>

          <TabsContent value="enrolled">
            {enrolledCourses.length === 0 ? (
              <EmptyCourses />
            ) : (
              <CoursesGrid courses={enrolledCourses} />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

function EmptyCourses() {
  return (
    <div className="text-center py-12">
      <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">Aucun cours inscrit</h3>
      <p className="text-muted-foreground mb-6">
        Découvrez nos cours et commencez votre apprentissage.
      </p>
      <Button asChild>
        <Link href="/courses">Explorer les cours</Link>
      </Button>
    </div>
  );
}

function CoursesGrid({ courses }: { courses: any[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <div
          key={course.id}
          className="bg-card rounded-xl overflow-hidden border shadow-sm"
        >
          <div className="relative">
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-36 object-cover"
            />
            {course.isCompleted && (
              <div className="absolute inset-0 bg-emerald-500/90 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
            )}
          </div>

          <div className="p-4 space-y-3">
            <h3 className="font-semibold line-clamp-2">{course.title}</h3>

            <div className="text-sm">Progression : {course.progress}%</div>

            <Progress value={course.progress} />

            <Button asChild className="w-full">
              <Link href={`/course-details/${course.id}`}>
                {course.isCompleted ? "Revoir" : "Continuer"}
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
