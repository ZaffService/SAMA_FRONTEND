"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  FolderPlus,
  BookOpen,
  HelpCircle,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CourseBasicInfoEditor } from "@/components/editors/CourseBasicInfoEditor";
import { ModuleEditor } from "@/components/editors/ModuleEditor";
import { LessonEditor } from "@/components/editors/LessonEditor";
import { QuizEditor } from "@/components/editors/QuizEditor";
import { CertificationEditor } from "@/components/editors/CertificationEditor";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import logger from "@/shared/helpers/logger";

interface CourseActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "outline";
  gradient?: string;
}

function CourseActionCard({ 
  title, 
  description, 
  icon, 
  onClick, 
  variant = "default",
  gradient = "from-blue-500 to-indigo-600"
}: CourseActionCardProps) {
  return (
    <Card
      className={`group cursor-pointer overflow-hidden border transition-all duration-300 hover:-translate-y-1 ${
        variant === "outline"
          ? "border-dashed border-white/20 bg-white/[0.02]"
          : "border-white/10 bg-[#121621]/95 hover:border-blue-400/40 hover:shadow-[0_24px_60px_-30px_rgba(59,130,246,0.65)]"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div
          className={`relative p-6 bg-gradient-to-br ${gradient} ${
            variant === "outline" ? "opacity-0" : ""
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_55%)]" />
          <div className="relative flex items-center justify-between">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/80">
              Action
            </div>
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <div className="text-white">{icon}</div>
            </div>
          </div>
        </div>
        <div className="space-y-2 p-6">
          <h3 className="text-xl font-bold text-white transition-colors group-hover:text-blue-300">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-white/65">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface EditCoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default function EditCoursePage({ params }: EditCoursePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedEditor = searchParams.get("editor");
  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [selectedModuleForLessons, setSelectedModuleForLessons] = useState<string | null>(null);
  const [isCertifying, setIsCertifying] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);

  // Extraire courseId des params 
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      logger.log("📄 Course ID from params:", resolvedParams.courseId);
      setCourseId(resolvedParams.courseId);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!courseId) return;

    const loadCourse = async () => {
      setCourseLoading(true);
      try {
        const data = await CoursesApi.getCourseForEdit(courseId);
        const course = data.course as any;
        const certifying =
          course?.isCertifying ?? course?.is_certifying ?? false;
        logger.log("🔎 [EditCourse] isCertifying:", certifying);
        setIsCertifying(Boolean(certifying));
      } catch (error) {
        logger.error("Erreur lors du chargement du cours:", error);
        toast.error("Impossible de charger les informations du cours");
      } finally {
        setCourseLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  useEffect(() => {
    if (requestedEditor === "certification") {
      setActiveEditor("certification");
    }
  }, [requestedEditor]);

  const handleBack = () => {
    router.push("/admin-dashboard");
  };

  const handleCourseUpdated = () => {
    toast.success("Informations du cours mises à jour avec succès");
    // Rafraîchir la page ou les données si nécessaire
  };

  const renderEditor = () => {
    if (!courseId) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-spin border-4 border-white shadow-lg"></div>
            <span className="text-gray-600 font-medium">Chargement...</span>
          </div>
        </div>
      );
    }

    switch (activeEditor) {
      case "basic-info":
        return (
          <CourseBasicInfoEditor
            courseId={courseId}
            onBack={() => setActiveEditor(null)}
            onCourseUpdated={handleCourseUpdated}
          />
        );
      case "modules":
        return (
          <ModuleEditor
            courseId={courseId}
            onBack={() => setActiveEditor(null)}
            onManageLessons={(moduleId) => {
              setSelectedModuleForLessons(moduleId);
              setActiveEditor("lessons");
            }}
          />
        );
      case "lessons":
        return (
          <LessonEditor
            courseId={courseId}
            selectedModuleId={selectedModuleForLessons}
            onBack={() => {
              setActiveEditor("modules");
              setSelectedModuleForLessons(null);
            }}
          />
        );
      case "quizzes":
        return <QuizEditor courseId={courseId} onBack={() => setActiveEditor(null)} />;
      case "certification":
        return (
          <CertificationEditor
            courseId={courseId}
            onBack={() => setActiveEditor(null)}
          />
        );
      default:
        return null;
    }
  };

  if (activeEditor) {
    return (
      <div className="min-h-screen bg-[#090B13]">
        {renderEditor()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090B13] text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-56 right-0 h-[26rem] w-[26rem] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/2 -left-32 h-[24rem] w-[24rem] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:34px_34px] opacity-20" />
      </div>

      <div className="relative mx-auto max-w-7xl p-6 md:p-10">
        <div className="mb-8 flex items-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="group rounded-xl border border-white/10 bg-white/[0.03] px-4 text-white/80 transition-all duration-200 hover:border-blue-400/50 hover:bg-blue-500/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </Button>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-[#101522]/95 p-7 shadow-[0_36px_80px_-44px_rgba(0,0,0,0.9)] md:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200">
            <BookOpen className="h-4 w-4" />
            <span>ÉDITEUR DE COURS</span>
          </div>
          
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Modifier le cours
          </h1>
          
          <p className="max-w-2xl text-base text-white/65 md:text-lg">
            Gérez les différents aspects de votre cours pour créer une expérience d'apprentissage exceptionnelle.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <CourseActionCard
            title="Informations de base"
            description="Modifier le titre, la description, le prix et les paramètres généraux du cours"
            icon={<Edit3 className="h-8 w-8" />}
            onClick={() => setActiveEditor("basic-info")}
            gradient="from-[#1D4ED8] via-[#2563EB] to-[#1E40AF]"
          />

          <CourseActionCard
            title="Gérer les modules"
            description="Ajouter, modifier ou supprimer des modules et organiser le contenu"
            icon={<FolderPlus className="h-8 w-8" />}
            onClick={() => setActiveEditor("modules")}
            gradient="from-[#5B21B6] via-[#7C3AED] to-[#4338CA]"
          />

          {!courseLoading && isCertifying && (
            <CourseActionCard
              title="Certification"
              description="Configurer le quiz de certification et suivre son état"
              icon={<BadgeCheck className="h-8 w-8" />}
              onClick={() => setActiveEditor("certification")}
              gradient="from-[#047857] via-[#059669] to-[#0D9488]"
            />
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0F1422]/95 p-6 shadow-[0_24px_60px_-38px_rgba(59,130,246,0.5)]">
          <div className="flex items-start gap-4">
            <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-3">
              <HelpCircle className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-white">Besoin d'aide ?</h3>
              <p className="text-sm text-white/65">
                Sélectionnez une option ci-dessus pour commencer à éditer votre cours. 
                Vous pouvez modifier les informations de base ou gérer le contenu de vos modules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
