"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Edit3, 
  Settings, 
  ListChecks,
  Loader2,
  Trash2, 
  BookOpen,
  X,
  Save,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Module } from "@/domain/entities/module";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { QuizService } from "@/infrastructure/api/quizService";
import Swal from "sweetalert2";
import logger from "@/shared/helpers/logger";

interface ModulesListProps {
  modules: Module[];
  onModulesChange: (modules: Module[]) => void;
  onManageLessons: (moduleId: string) => void;
  onSaveModule?: (module: Module, index: number) => Promise<void>;
  courseId?: string;
}

export function ModulesList({ modules, onModulesChange, onManageLessons, onSaveModule, courseId }: ModulesListProps) {
  const router = useRouter();
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [deleteConfirmModule, setDeleteConfirmModule] = useState<Module | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<Record<number, { title: string; description: string }>>({});
  const [quizMetaByModuleId, setQuizMetaByModuleId] = useState<Record<string, { quizId: string; questionsCount: number } | null>>({});
  const [quizLoadingByModuleId, setQuizLoadingByModuleId] = useState<Record<string, boolean>>({});

  // Log pour déboguer les changements de props modules
  useEffect(() => {
    logger.log('📦 [ModulesList] Props modules mis à jour:', modules.length, 'modules');
    modules.forEach((m, i) => {
      logger.log(`  Module ${i + 1}: ${m.title} (id: ${m.id || 'temp'})`);
    });
  }, [modules]);

  useEffect(() => {
    const moduleIds = modules
      .map((module) => module.id)
      .filter((id): id is string => Boolean(id));

    if (moduleIds.length === 0) return;

    const idsToFetch = moduleIds.filter(
      (id) => quizMetaByModuleId[id] === undefined && !quizLoadingByModuleId[id],
    );

    if (idsToFetch.length === 0) return;

    idsToFetch.forEach(async (moduleId) => {
      setQuizLoadingByModuleId((prev) => ({ ...prev, [moduleId]: true }));

      try {
        const quiz = await QuizService.getQuizByModule(moduleId);
        if (quiz) {
          const questionsCount =
            quiz.questions?.length ?? quiz.questionsCount ?? 0;
          setQuizMetaByModuleId((prev) => ({
            ...prev,
            [moduleId]: { quizId: quiz.id, questionsCount },
          }));
        } else {
          setQuizMetaByModuleId((prev) => ({ ...prev, [moduleId]: null }));
        }
      } catch (error) {
        logger.error("❌ [ModulesList] Erreur chargement quiz module:", error);
        setQuizMetaByModuleId((prev) => ({ ...prev, [moduleId]: null }));
      } finally {
        setQuizLoadingByModuleId((prev) => ({ ...prev, [moduleId]: false }));
      }
    });
  }, [modules, quizMetaByModuleId, quizLoadingByModuleId]);

  const addModule = () => {
    const newModule: Module = {
      tempId: `temp-${Date.now()}`,
      title: "",
      description: "",
      orderIndex: modules.length + 1,
      lessons: [],
    };
    onModulesChange([...modules, newModule]);
    setExpandedModules({ ...expandedModules, [modules.length]: true });
    setEditingValues({ 
      ...editingValues, 
      [modules.length]: { title: "", description: "" } 
    });
  };

  const toggleModule = (index: number) => {
    const isOpening = !expandedModules[index];
    setExpandedModules({
      ...expandedModules,
      [index]: isOpening,
    });
    
    if (isOpening) {
      setEditingValues({
        ...editingValues,
        [index]: {
          title: modules[index].title,
          description: modules[index].description || "",
        },
      });
    }
  };

  const updateEditingValue = (index: number, field: 'title' | 'description', value: string) => {
    setEditingValues({
      ...editingValues,
      [index]: {
        ...editingValues[index],
        [field]: value,
      },
    });
  };

  const saveModule = async (index: number) => {
    const values = editingValues[index];
    if (!values?.title.trim()) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Le titre du module est requis",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    // Récupérer les modules actuels via callback pour éviter le stale state
    let currentModules = modules;
    const moduleToSave = {
      ...currentModules[index],
      title: values.title,
      description: values.description,
    };

    try {
      if (moduleToSave.id) {
        // Module existant - utiliser l'endpoint de modification
        logger.log(`🔄 [ModulesList] Début modification module existant: ${moduleToSave.id}`);
        logger.log(`📦 [ModulesList] Données envoyées:`, {
          title: moduleToSave.title,
          description: moduleToSave.description
        });
        
        const response = await CoursesApi.updateModule(moduleToSave.id, {
          title: moduleToSave.title,
          description: moduleToSave.description
        });

        logger.log(`✅ [ModulesList] Réponse API:`, response);
        logger.log(`✅ [ModulesList] Module mis à jour par le serveur:`, response.module);

        // Vérifier que les données ont été correctement persistées
        if (response.module && response.module.title === moduleToSave.title) {
          logger.log(`✅ [ModulesList] Vérification de persistance: SUCCÈS`);
          
          // Mettre à jour le module avec les données du serveur (depuis la closure de handleModulesChange)
          const updatedModules = currentModules.map((module, i) =>
            i === index ? { 
              ...module, 
              title: response.module.title, 
              description: response.module.description 
            } : module
          );
          onModulesChange(updatedModules);

          Swal.fire({
            icon: "success",
            title: "Succès !",
            text: "Le module a été modifié avec succès",
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          logger.warn(`⚠️ [ModulesList] Vérification de persistance: ÉCHEC`);
          logger.warn(`📊 [ModulesList] Données attendues:`, moduleToSave.title);
          logger.warn(`📊 [ModulesList] Données reçues:`, response.module?.title);

          Swal.fire({
            icon: "warning",
            title: "Attention",
            text: "La modification peut ne pas avoir été sauvegardée. Veuillez vérifier.",
            confirmButtonColor: "#2563eb",
          });
        }
      } else {
        // Nouveau module - utiliser l'endpoint d'ajout
        if (!courseId) {
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: "ID du cours manquant pour ajouter un module",
            confirmButtonColor: "#dc3545",
          });
          return;
        }

        if (onSaveModule) {
          await onSaveModule(moduleToSave, index);
        } else {
          // Fallback si onSaveModule n'est pas fourni
          const orderIndex = currentModules.length > 0
            ? Math.max(...currentModules.map(m => m.orderIndex || 0)) + 1
            : 1;

          const moduleData = {
            title: moduleToSave.title,
            description: moduleToSave.description || "",
            order: orderIndex,
            lessons: moduleToSave.lessons?.map((lesson) => ({
              tempId: lesson.tempId || `lesson-${Date.now()}-${Math.random()}`,
              title: lesson.title,
              content: lesson.content || "",
              orderIndex: lesson.orderIndex || 0,
              duration: lesson.duration || 0,
            })) || [],
            quizzes: moduleToSave.quizzes || [],
          };

          await CoursesApi.addModuleToCourse(courseId, moduleData);

          Swal.fire({
            icon: "success",
            title: "Succès !",
            text: "Le module a été ajouté avec succès",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      }

      setExpandedModules(prev => ({ ...prev, [index]: false }));
    } catch (error) {
      logger.error("❌ [ModulesList] Erreur lors de la sauvegarde du module:", error);

      // Utiliser le système de mapping d'erreurs
      const { getErrorMapping } = await import("@/shared/helpers/error-mapping");
      const errorMapping = getErrorMapping(error);

      Swal.fire({
        icon: "error",
        title: errorMapping.title,
        text: errorMapping.message,
        confirmButtonColor: "#dc3545",
      });
    }
  };

  const cancelEdit = (index: number) => {
    setExpandedModules({ ...expandedModules, [index]: false });
    
    if (!modules[index].title && !modules[index].description && !modules[index].id) {
      const updatedModules = modules.filter((_, i) => i !== index);
      const reorderedModules = updatedModules.map((m, i) => ({
        ...m,
        orderIndex: i + 1,
      }));
      onModulesChange(reorderedModules);
    }
  };

  // Callback stable pour les changements de modules
  const stableOnModulesChange = useCallback((updatedModules: Module[]) => {
    onModulesChange(updatedModules);
  }, [onModulesChange]);

  // Callback stable pour handleDeleteModule
  const stableHandleDeleteModule = useCallback(async () => {
    if (!deleteConfirmModule?.id) return;
    
    const moduleTitle = deleteConfirmModule.title;
    const moduleId = deleteConfirmModule.id;
    
    logger.log('🗑️ [ModulesList] Suppression du module:', moduleTitle, '(id:', moduleId + ')');
    
    // D'abord fermer le dialog
    setDeleteConfirmModule(null);
    
    try {
      // Appel à l'API via CoursesApi.deleteModule
      const data = await CoursesApi.deleteModule(moduleId);
      logger.log('✅ [ModulesList] Module supprimé du serveur:', data.message);

      // Supprimer le module de la liste locale
      const updatedModules = modules.filter(m => m.id !== moduleId);
      logger.log('📦 [ModulesList] Modules restants après filtrage:', updatedModules.length);
      
      const reorderedModules = updatedModules.map((m, i) => ({
        ...m,
        orderIndex: i + 1,
      }));
      
      // Mettre à jour l'état parent
      stableOnModulesChange(reorderedModules);

      // Ensuite afficher le message de succès
      Swal.fire({
        icon: 'success',
        title: 'Module supprimé avec succès',
        text: data.message || `Le module "${moduleTitle}" a été supprimé avec succès`,
        confirmButtonColor: '#2563eb',
      });
    } catch (error: any) {
      logger.error('❌ [ModulesList] Erreur lors de la suppression:', error);

      // Utiliser le système de mapping d'erreurs
      const { getErrorMapping } = await import("@/shared/helpers/error-mapping");
      const errorMapping = getErrorMapping(error);

      Swal.fire({
        icon: 'error',
        title: errorMapping.title,
        text: errorMapping.message,
        confirmButtonColor: '#dc3545',
      });
    }
  }, [deleteConfirmModule, modules, stableOnModulesChange]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === index) return;

    const newModules = [...modules];
    const draggedModule = newModules[draggedIndex];
    newModules.splice(draggedIndex, 1);
    newModules.splice(index, 0, draggedModule);

    const reorderedModules = newModules.map((module, i) => ({
      ...module,
      orderIndex: i + 1,
    }));

    onModulesChange(reorderedModules);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (e.currentTarget.contains(relatedTarget)) {
      return;
    }
    setDragOverIndex(null);
  };

  const handleManageQuiz = (moduleId: string) => {
    if (!courseId) return;
    router.push(`/admin/edit-course/${courseId}/quiz/${moduleId}`);
  };

  const lessonsCount = (module: Module) => {
    return module.lessons?.length || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">
            Modules du cours
          </h2>
          <p className="mt-1 text-white/65">
            Gérez les modules de votre cours ({modules.length} {modules.length === 1 ? 'module' : 'modules'})
          </p>
        </div>
        <Button
          onClick={addModule}
          className="flex items-center gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500"
        >
          <Plus className="h-5 w-5" />
          Ajouter un module
        </Button>
      </div>

      {modules.length === 0 ? (
        <Card className="border-2 border-dashed border-white/20 bg-[#111827]/80">
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-white/40" />
            <h3 className="mb-2 text-lg font-medium text-white">
              Aucun module créé
            </h3>
            <p className="mb-4 text-white/60">
              Commencez par ajouter votre premier module
            </p>
            <Button onClick={addModule} className="bg-blue-600 text-white hover:bg-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((module, index) => {
            const moduleId = module.id;
            const quizMeta = moduleId ? quizMetaByModuleId[moduleId] : undefined;
            const isQuizKnown = quizMeta !== undefined;
            const isQuizLoading = moduleId ? quizLoadingByModuleId[moduleId] : false;
            const hasQuiz = Boolean(quizMeta);
            const questionsCount = quizMeta?.questionsCount ?? 0;
            const quizLabel = isQuizKnown
              ? hasQuiz
                ? "Gérer Quiz"
                : "Créer Quiz"
              : "Quiz...";

            return (
              <Card 
              key={module.id || module.tempId} 
              className={`overflow-hidden transition-all ${
                dragOverIndex === index && draggedIndex !== index
                  ? "border-2 border-blue-500/70 bg-blue-500/10"
                  : ""
              } ${draggedIndex === index ? "opacity-50" : ""} border border-white/10 bg-[#0F172A]/95`}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragLeave={(e) => handleDragLeave(e)}
              >
              <CardContent className="p-0">
                <div className="flex items-center p-4">
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    className="mr-2 cursor-move rounded p-2 transition-colors hover:bg-white/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-5 w-5 text-white/45" />
                  </div>

                  <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                    <span className="text-lg font-bold text-blue-300">
                      {index + 1}
                    </span>
                  </div>

                  <div className="grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center rounded-md bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-200">
                        Module
                      </span>
                      {!module.id && (
                        <span className="inline-flex items-center rounded-md bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-200">
                          Non sauvegardé
                        </span>
                      )}
                    </div>
                    <h3 className="truncate text-lg font-semibold text-white">
                      {module.title || "Sans titre"}
                    </h3>
                    {module.description && !expandedModules[index] && (
                      <p className="mt-1 line-clamp-1 text-sm text-white/65">
                        {module.description}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-white/50">
                      {lessonsCount(module)} {lessonsCount(module) === 1 ? 'leçon' : 'leçons'}
                      {modules.length > 1 && ' • Glissez pour réorganiser'}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleModule(index)}
                      className="flex items-center gap-1 border-blue-400/35 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20"
                    >
                      <Edit3 className="h-4 w-4" />
                      {expandedModules[index] ? 'Fermer' : 'Modifier'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageLessons(module.id || module.tempId || '')}
                      disabled={!module.id}
                      className={`flex items-center gap-1 border-white/20 bg-white/5 hover:bg-white/10 ${
                        !module.id ? 'cursor-not-allowed opacity-50 text-white/35' : 'text-white/80'
                      }`}
                      title={!module.id ? "Enregistrez le module pour gérer les leçons" : "Gérer les leçons"}
                    >
                      <Settings className="h-4 w-4" />
                      Gérer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moduleId && handleManageQuiz(moduleId)}
                      disabled={!moduleId || isQuizLoading}
                      className={`flex items-center gap-1 border-indigo-400/35 bg-indigo-500/10 hover:bg-indigo-500/20 ${
                        !moduleId
                          ? "opacity-50 cursor-not-allowed text-white/35"
                          : "text-indigo-200"
                      }`}
                      title={
                        !moduleId
                          ? "Enregistrez le module pour gérer le quiz"
                          : hasQuiz
                          ? "Gérer le quiz du module"
                          : "Créer un quiz pour ce module"
                      }
                    >
                      {isQuizLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ListChecks className="h-4 w-4" />
                      )}
                      {quizLabel}
                      {hasQuiz && !isQuizLoading && (
                        <Badge
                          variant="secondary"
                          className="ml-1 border border-indigo-400/30 bg-indigo-500/20 text-indigo-100"
                        >
                          {questionsCount}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (module.id) {
                          setDeleteConfirmModule(module);
                        } else {
                          // Pour les modules non sauvegardés, suppression directe
                          const updatedModules = modules.filter(
                            (_, i) => i !== index
                          );
                          const reorderedModules = updatedModules.map((m, i) => ({
                            ...m,
                            orderIndex: i + 1,
                          }));
                          onModulesChange(reorderedModules);
                        }
                      }}
                      disabled={!module.id}
                      className={`flex items-center gap-1 ${!module.id ? 'opacity-50 cursor-not-allowed text-white/35' : 'border-red-400/35 bg-red-500/10 text-red-200 hover:bg-red-500/20'}`}
                      title={!module.id ? "Enregistrez le module pour pouvoir le supprimer" : "Supprimer ce module"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedModules[index] && (
                  <div className="border-t border-white/10 bg-[#0B1220] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">
                        Module {index + 1}: {editingValues[index]?.title || "Sans titre"}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelEdit(index)}
                        className="text-white/55 hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white/80">
                          Titre du module *
                        </label>
                        <Input
                          value={editingValues[index]?.title || ""}
                          onChange={(e) => updateEditingValue(index, 'title', e.target.value)}
                          placeholder="Entrez le titre du module"
                          required
                          className="border-white/15 bg-[#111827] text-white placeholder:text-white/45"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white/80">
                          Description du module
                        </label>
                        <Textarea
                          value={editingValues[index]?.description || ""}
                          onChange={(e) => updateEditingValue(index, 'description', e.target.value)}
                          placeholder="Décrivez le contenu de ce module..."
                          rows={3}
                          className="border-white/15 bg-[#111827] text-white placeholder:text-white/45"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => cancelEdit(index)}
                          className="flex items-center gap-2 border-white/20 bg-transparent text-white hover:bg-white/10"
                        >
                          <X className="h-4 w-4" />
                          Annuler
                        </Button>
                        <Button
                          onClick={() => saveModule(index)}
                          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-500"
                        >
                          <Save className="h-4 w-4" />
                          Enregistrer le module
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!deleteConfirmModule} onOpenChange={(open) => !open && setDeleteConfirmModule(null)}>
        <DialogContent className="sm:max-w-md border-white/15 bg-[#0F172A] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-300">
              <Trash2 className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-white/80">
              Êtes-vous sûr de vouloir supprimer le module "{deleteConfirmModule?.title}" ?
            </p>
            {deleteConfirmModule && deleteConfirmModule.lessons && deleteConfirmModule.lessons.length > 0 && (
              <p className="mt-2 text-sm text-red-300">
                Ce module contient {deleteConfirmModule.lessons.length} leçon(s) qui sera/seront également supprimée(s).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmModule(null)} className="border-white/20 bg-transparent text-white hover:bg-white/10">
              Annuler
            </Button>
            <Button onClick={stableHandleDeleteModule} className="bg-red-600 text-white hover:bg-red-500">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
