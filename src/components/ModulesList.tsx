"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Edit3, 
  Settings, 
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Module } from "@/domain/entities/module";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import Swal from "sweetalert2";

interface ModulesListProps {
  modules: Module[];
  onModulesChange: (modules: Module[]) => void;
  onManageLessons: (moduleId: string) => void;
  onSaveModule?: (module: Module, index: number) => Promise<void>;
  courseId?: string;
}

export function ModulesList({ modules, onModulesChange, onManageLessons, onSaveModule, courseId }: ModulesListProps) {
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [deleteConfirmModule, setDeleteConfirmModule] = useState<Module | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<Record<number, { title: string; description: string }>>({});

  // Log pour déboguer les changements de props modules
  useEffect(() => {
    console.log('📦 [ModulesList] Props modules mis à jour:', modules.length, 'modules');
    modules.forEach((m, i) => {
      console.log(`  Module ${i + 1}: ${m.title} (id: ${m.id || 'temp'})`);
    });
  }, [modules]);

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

    const moduleToSave = {
      ...modules[index],
      title: values.title,
      description: values.description,
    };

    try {
      if (moduleToSave.id) {
        // Module existant - utiliser l'endpoint de modification
        await CoursesApi.updateModule(moduleToSave.id, {
          title: moduleToSave.title,
          description: moduleToSave.description
        });

        // Mettre à jour le module dans la liste locale
        const updatedModules = modules.map((module, i) =>
          i === index ? { ...module, title: values.title, description: values.description } : module
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
          const orderIndex = modules.length > 0
            ? Math.max(...modules.map(m => m.orderIndex || 0)) + 1
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

      setExpandedModules({ ...expandedModules, [index]: false });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du module:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Une erreur est survenue lors de la sauvegarde du module",
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
    
    console.log('🗑️ [ModulesList] Suppression du module:', moduleTitle, '(id:', moduleId + ')');
    
    // D'abord fermer le dialog
    setDeleteConfirmModule(null);
    
    try {
      // Appel à l'API via CoursesApi.deleteModule
      const data = await CoursesApi.deleteModule(moduleId);
      console.log('✅ [ModulesList] Module supprimé du serveur:', data.message);

      // Supprimer le module de la liste locale
      const updatedModules = modules.filter(m => m.id !== moduleId);
      console.log('📦 [ModulesList] Modules restants après filtrage:', updatedModules.length);
      
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
      console.error('❌ [ModulesList] Erreur lors de la suppression:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Une erreur est survenue lors de la suppression du module.',
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

  const lessonsCount = (module: Module) => {
    return module.lessons?.length || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Modules du cours
          </h2>
          <p className="text-gray-600 mt-1">
            Gérez les modules de votre cours ({modules.length} {modules.length === 1 ? 'module' : 'modules'})
          </p>
        </div>
        <Button
          onClick={addModule}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Ajouter un module
        </Button>
      </div>

      {modules.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun module créé
            </h3>
            <p className="text-gray-600 mb-4">
              Commencez par ajouter votre premier module
            </p>
            <Button onClick={addModule} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((module, index) => (
            <Card 
              key={module.id || module.tempId} 
              className={`overflow-hidden transition-all ${
                dragOverIndex === index && draggedIndex !== index
                  ? "border-2 border-blue-500 bg-blue-50"
                  : ""
              } ${draggedIndex === index ? "opacity-50" : ""}`}
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
                    className="cursor-move p-2 hover:bg-gray-100 transition-colors rounded mr-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold text-lg">
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md">
                        Module
                      </span>
                      {!module.id && (
                        <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-md">
                          Non sauvegardé
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {module.title || "Sans titre"}
                    </h3>
                    {module.description && !expandedModules[index] && (
                      <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                        {module.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {lessonsCount(module)} {lessonsCount(module) === 1 ? 'leçon' : 'leçons'}
                      {modules.length > 1 && ' • Glissez pour réorganiser'}
                    </p>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleModule(index)}
                      className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Edit3 className="h-4 w-4" />
                      {expandedModules[index] ? 'Fermer' : 'Modifier'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageLessons(module.id || module.tempId || '')}
                      disabled={!module.id}
                      className={`flex items-center gap-1 border-gray-200 hover:bg-gray-50 ${
                        !module.id ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-600'
                      }`}
                      title={!module.id ? "Enregistrez le module pour gérer les leçons" : "Gérer les leçons"}
                    >
                      <Settings className="h-4 w-4" />
                      Gérer
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
                      className={`flex items-center gap-1 ${!module.id ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-red-600 border-red-200 hover:bg-red-50'}`}
                      title={!module.id ? "Enregistrez le module pour pouvoir le supprimer" : "Supprimer ce module"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedModules[index] && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Module {index + 1}: {editingValues[index]?.title || "Sans titre"}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelEdit(index)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Titre du module *
                        </label>
                        <Input
                          value={editingValues[index]?.title || ""}
                          onChange={(e) => updateEditingValue(index, 'title', e.target.value)}
                          placeholder="Entrez le titre du module"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description du module
                        </label>
                        <Textarea
                          value={editingValues[index]?.description || ""}
                          onChange={(e) => updateEditingValue(index, 'description', e.target.value)}
                          placeholder="Décrivez le contenu de ce module..."
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          onClick={() => cancelEdit(index)}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Annuler
                        </Button>
                        <Button
                          onClick={() => saveModule(index)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
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
          ))}
        </div>
      )}

      <Dialog open={!!deleteConfirmModule} onOpenChange={(open) => !open && setDeleteConfirmModule(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Êtes-vous sûr de vouloir supprimer le module "{deleteConfirmModule?.title}" ?
            </p>
            {deleteConfirmModule && deleteConfirmModule.lessons && deleteConfirmModule.lessons.length > 0 && (
              <p className="text-sm text-red-600 mt-2">
                Ce module contient {deleteConfirmModule.lessons.length} leçon(s) qui sera/seront également supprimée(s).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmModule(null)}>
              Annuler
            </Button>
            <Button onClick={stableHandleDeleteModule} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
