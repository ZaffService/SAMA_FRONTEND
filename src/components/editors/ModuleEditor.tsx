"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { ModulesList } from "@/components/ModulesList";
import { Module } from "@/domain/entities/module";
import Swal from "sweetalert2";

interface ModuleEditorProps {
  courseId: string;
  onBack: () => void;
  onManageLessons?: (moduleId: string) => void;
}

export function ModuleEditor({ courseId, onBack, onManageLessons }: ModuleEditorProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, [courseId]);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      const details = await CoursesApi.getCourseDetails(courseId);
      // Convert API response to match Module interface
      const loadedModules: Module[] = (details.modules || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description || "",
        orderIndex: m.order || m.orderIndex,
        lessons: m.lessons || [],
      }));
      setModules(loadedModules);
    } catch (error) {
      console.error("Erreur lors du chargement des modules:", error);
      toast.error("Erreur lors du chargement des modules");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModulesChange = (updatedModules: Module[]) => {
    setModules(updatedModules);
  };

  const handleSaveModule = async (module: Module, index: number) => {
    try {
      // Calculer l'orderIndex basé sur les modules existants
      const orderIndex = modules.length > 0 
        ? Math.max(...modules.map(m => m.orderIndex || 0)) + 1 
        : 0;

      // Préparer les données du module avec ses leçons
      const moduleData = {
        title: module.title,
        description: module.description || "",
        order: orderIndex,
        lessons: module.lessons?.map((lesson) => ({
          tempId: lesson.tempId || `lesson-${Date.now()}-${Math.random()}`,
          title: lesson.title,
          content: lesson.content || "",
          orderIndex: lesson.orderIndex || 0,
          duration: lesson.duration || 0,
        })) || [],
        quizzes: module.quizzes || [],
      };

      // Appeler l'API pour ajouter le module avec ses leçons
      const response = await CoursesApi.addModuleToCourse(courseId, moduleData);

      // Afficher le message de succès
      Swal.fire({
        icon: "success",
        title: "Module ajouté !",
        text: `Le module \"${module.title}\" a été ajouté avec succès au cours.`,
        confirmButtonColor: "#2563eb",
      });

      // Recharger les modules pour inclure l'ID du nouveau module
      await loadModules();
    } catch (error) {
      console.error("Erreur lors de l'ajout du module:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Une erreur est survenue lors de l'ajout du module. Veuillez réessayer.",
        confirmButtonColor: "#dc3545",
      });
      throw error; // Rethrow pour que ModulesList ne ferme pas le formulaire
    }
  };

  const handleManageLessons = (moduleId: string) => {
    if (onManageLessons) {
      onManageLessons(moduleId);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Chargement des modules...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header avec bouton retour */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </Button>
        </div>

        {/* Liste des modules */}
        <ModulesList
          modules={modules}
          onModulesChange={handleModulesChange}
          onManageLessons={handleManageLessons}
          onSaveModule={handleSaveModule}
          courseId={courseId}
        />
      </div>
    </div>
  );
}
