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
      className={`group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-0 overflow-hidden ${
        variant === "outline" ? "bg-white border-2 border-dashed border-gray-300" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className={`p-8 bg-gradient-to-br ${gradient} ${variant === "outline" ? "opacity-0" : ""}`}>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
              <div className="text-white">
                {icon}
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white">
          <h3 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
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
            open={true}
            onOpenChange={(open) => !open && setActiveEditor(null)}
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        {renderEditor()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-8">
        {/* Header avec bouton retour */}
        <div className="flex items-center mb-12">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="group hover:bg-blue-800 hover:shadow-md transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </Button>
        </div>

        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium mb-6 shadow-lg">
            <BookOpen className="h-4 w-4" />
            <span>ÉDITEUR DE COURS</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Modifier le cours
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl">
            Gérez les différents aspects de votre cours pour créer une expérience d'apprentissage exceptionnelle.
          </p>
        </div>

        {/* Menu de gestion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <CourseActionCard
            title="Informations de base"
            description="Modifier le titre, la description, le prix et les paramètres généraux du cours"
            icon={<Edit3 className="h-8 w-8" />}
            onClick={() => setActiveEditor("basic-info")}
            gradient="from-blue-500 to-blue-600"
          />

          <CourseActionCard
            title="Gérer les modules"
            description="Ajouter, modifier ou supprimer des modules et organiser le contenu"
            icon={<FolderPlus className="h-8 w-8" />}
            onClick={() => setActiveEditor("modules")}
            gradient="from-indigo-500 to-purple-600"
          />

          {!courseLoading && isCertifying && (
            <CourseActionCard
              title="Certification"
              description="Configurer le quiz de certification et suivre son état"
              icon={<BadgeCheck className="h-8 w-8" />}
              onClick={() => setActiveEditor("certification")}
              gradient="from-emerald-500 to-teal-600"
            />
          )}
        </div>

        {/* Helper Section */}
        <div className="mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <HelpCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Besoin d'aide ?</h3>
              <p className="text-sm text-gray-600">
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
