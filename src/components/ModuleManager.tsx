"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { LessonManager } from "./LessonManager";
import { Module, Lesson } from "@/domain/entities/module";

interface ModuleManagerProps {
  modules: Module[];
  onModulesChange: (modules: Module[]) => void;
  courseId?: string;
  expandedModules?: Record<number, boolean>;
  onToggleModule?: (index: number) => void;
}

export function ModuleManager({
  modules,
  onModulesChange,
  courseId,
  expandedModules = {},
  onToggleModule,
}: ModuleManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addModule = () => {
    const newModule: Module = {
      id: `temp-${Date.now()}`,
      title: "",
      orderIndex: modules.length + 1,
      lessons: [],
    };
    onModulesChange([...modules, newModule]);
  };

  const updateModule = (index: number, updates: Partial<Module>) => {
    const updatedModules = modules.map((module, i) =>
      i === index ? { ...module, ...updates } : module,
    );
    onModulesChange(updatedModules);
  };

  const removeModule = (index: number) => {
    const updatedModules = modules.filter((_, i) => i !== index);
    const reorderedModules = updatedModules.map((module, i) => ({
      ...module,
      orderIndex: i + 1,
    }));
    onModulesChange(reorderedModules);
  };

  // Force re-render when modules change by using a timestamp
  const [accordionKey, setAccordionKey] = useState(Date.now());

  // Update the key when modules change to force re-render
  const handleModulesChangeWithKey = (modules: Module[]) => {
    onModulesChange(modules);
    // Force re-render of the Accordion to reflect new order
    setAccordionKey(Date.now());
  };

  const handleLessonsChange = (moduleIndex: number, lessons: Lesson[]) => {
    updateModule(moduleIndex, { lessons });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    console.log(`[ModuleManager] Drag start: index ${index}`);
    e.stopPropagation();
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    console.log(`[ModuleManager] Drag over: index ${index}, draggedIndex: ${draggedIndex}`);
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    console.log(`[ModuleManager] Drop: from index ${draggedIndex} to index ${index}`);
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === index) return;

    const newModules = [...modules];
    const draggedModule = newModules[draggedIndex];

    // Retirer le module dragué
    newModules.splice(draggedIndex, 1);
    // Insérer à la nouvelle position
    newModules.splice(index, 0, draggedModule);

    // Recalculer les orderIndex
    const reorderedModules = newModules.map((module, i) => ({
      ...module,
      orderIndex: i + 1,
    }));

    console.log(`[ModuleManager] Calling handleModulesChangeWithKey with ${reorderedModules.length} modules`);
    handleModulesChangeWithKey(reorderedModules);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    console.log(`[ModuleManager] Drag end`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only handle drag leave if we're actually leaving the element, not just entering a child
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (e.currentTarget.contains(relatedTarget)) {
      // We're still within the element (entered a child)
      return;
    }
    console.log(`[ModuleManager] Drag leave`);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Modules du cours</h2>
          <p className="text-sm text-gray-600">
            Organisez votre cours en modules et ajoutez des leçons à chaque
            module.
          </p>
        </div>
        <Button
          type="button"
          onClick={addModule}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un module</span>
        </Button>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Aucun module créé</h3>
            <p>
              Commencez par ajouter votre premier module pour structurer votre
              cours.
            </p>
            <Button type="button" onClick={addModule} className="mt-4">
              Créer le premier module
            </Button>
          </div>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4" key={accordionKey}>
          {modules.map((module, index) => (
            <div
              key={module.id || module.tempId || `module-${index}`}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragLeave={(e) => handleDragLeave(e)}
              className={`transition-all ${
                dragOverIndex === index && draggedIndex !== index
                  ? "border-2 border-blue-500 bg-blue-50"
                  : ""
              } ${draggedIndex === index ? "opacity-50" : ""}`}
            >
              <AccordionItem
                value={module.id || module.tempId || `module-${index}`}
                className="border rounded-lg"
              >
                <div className="flex items-center">
                  {/* Zone de drag séparée */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    className="cursor-move p-4 hover:bg-gray-50 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* AccordionTrigger sans drag */}
                  <AccordionTrigger
                    className="flex-1 px-4 py-4 hover:no-underline"
                    onClick={() => onToggleModule?.(index)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="text-left flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">
                            Module {index + 1}: {module.title || "Sans titre"}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          {module.lessons.length} leçon{module.lessons.length !== 1 ? "s" : ""} • Glissez pour réorganiser
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                </div>

                <AccordionContent className="px-6 pb-6">
                  <Card className="border-0 shadow-none">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Détails du module
                        </CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeModule(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Titre du module *
                        </label>
                        <Input
                          value={module.title}
                          onChange={(e) =>
                            updateModule(index, { title: e.target.value })
                          }
                          placeholder="Entrez le titre du module"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description du module (optionnel)
                        </label>
                        <Textarea
                          value={module.description || ""}
                          onChange={(e) =>
                            updateModule(index, { description: e.target.value })
                          }
                          placeholder="Décrivez le contenu de ce module..."
                          rows={3}
                        />
                      </div>

                      <div className="border-t pt-6">
                        <LessonManager
                          lessons={module.lessons}
                          onLessonsChange={(lessons) =>
                            handleLessonsChange(index, lessons)
                          }
                          courseId={courseId}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </div>
          ))}
        </Accordion>
      )}
    </div>
  );
}