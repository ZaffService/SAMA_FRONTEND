"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, ArrowLeft, Loader2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { QuizService } from "@/infrastructure/api/quizService";
import logger from "@/shared/helpers/logger";
// import { AddQuizDialog } from "./AddQuizDialog";

interface Module {
  id: string;
  title: string;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  questionsCount: number;
}

interface QuizEditorProps {
  courseId: string;
  onBack: () => void;
}

export function QuizEditor({ courseId, onBack }: QuizEditorProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddQuizDialog, setShowAddQuizDialog] = useState(false);

  useEffect(() => {
    loadModules();
  }, [courseId]);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      const details = await CoursesApi.getCourseDetails(courseId);
      setModules(details.modules || []);
      if (details.modules && details.modules.length > 0) {
        setSelectedModuleId(details.modules[0].id);
      }
    } catch (error) {
      logger.error("Erreur lors du chargement des modules:", error);
      toast.error("Erreur lors du chargement des modules");
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuizzes = async (moduleId: string) => {
    setIsLoading(true);
    try {
      // TODO: Implementer l'API pour charger les quiz d'un module
      setQuizzes([]);
    } catch (error) {
      logger.error("Erreur lors du chargement des quiz:", error);
      toast.error("Erreur lors du chargement des quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce quiz ?")) return;
    
    try {
      await QuizService.deleteQuiz(quizId);
      toast.success("Quiz supprimé avec succès");
      if (selectedModuleId) {
        loadQuizzes(selectedModuleId);
      }
    } catch (error) {
      logger.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression du quiz");
    }
  };

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  if (isLoading && modules.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
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

        <h2 className="text-3xl font-bold mb-8">Gérer les quiz</h2>

        {/* Sélecteur de module */}
        <div className="mb-8">
          <label className="block text-lg font-medium mb-4">
            Sélectionner un module
          </label>
          <Select 
            value={selectedModuleId || ""} 
            onValueChange={setSelectedModuleId}
          >
            <SelectTrigger className="h-14 text-base">
              <SelectValue placeholder="Choisissez un module" />
            </SelectTrigger>
            <SelectContent>
              {modules.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  Module {module.order} - {module.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedModuleId ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                Quiz de "{selectedModule?.title}"
              </h3>
              <Button 
                size="lg" 
                onClick={() => setShowAddQuizDialog(true)}
                className="h-12 px-8"
              >
                <Plus className="h-5 w-5 mr-2" />
                Ajouter un quiz
              </Button>
            </div>

            {/* Liste des quiz */}
            <div className="space-y-4">
              {quizzes.length === 0 ? (
                <Card className="p-12 shadow-lg text-center">
                  <CardContent className="flex flex-col items-center">
                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                      <HelpCircle className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Aucun quiz</h3>
                    <p className="text-gray-500 mb-6">
                      Ce module ne contient pas encore de quiz
                    </p>
                    <Button 
                      size="lg" 
                      onClick={() => setShowAddQuizDialog(true)}
                      className="h-12 px-8"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Ajouter un quiz
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                quizzes.map((quiz) => (
                  <Card key={quiz.id} className="p-6 shadow-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-semibold">{quiz.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {quiz.questionsCount} questions • Score de passage: {quiz.passingScore}%
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline"
                          className="h-10 px-4"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="h-10 px-4"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        ) : (
          <Card className="p-12 shadow-lg text-center">
            <CardContent className="flex flex-col items-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <HelpCircle className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucun module</h3>
              <p className="text-gray-500">
                Vous devez d'abord créer des modules avant d'ajouter des quiz
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
