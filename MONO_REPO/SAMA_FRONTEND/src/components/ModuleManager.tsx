"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { LessonManager } from "./LessonManager";
import { Module, Lesson } from "@/domain/entities/module";

interface ModuleManagerProps {
  modules: Module[];
  onModulesChange: (modules: Module[]) => void;
  courseId?: string;
}

export function ModuleManager({ modules, onModulesChange, courseId }: ModuleManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addModule = () => {
    const newModule: Module = {
      id: `temp-${Date.now()}`,
      title: '',
      orderIndex: modules.length + 1,  // ✅ COMMENCE À 1, pas 0 !
      lessons: [],
    };
    onModulesChange([...modules, newModule]);
    console.log('➕ Module ajouté avec orderIndex:', newModule.orderIndex);
  };

  const updateModule = (index: number, updates: Partial<Module>) => {
    const updatedModules = modules.map((module, i) =>
      i === index ? { ...module, ...updates } : module
    );
    onModulesChange(updatedModules);
  };

  const removeModule = (index: number) => {
    const updatedModules = modules.filter((_, i) => i !== index);
    // Recalculer les orderIndex
    const reorderedModules = updatedModules.map((module, i) => ({
      ...module,
      orderIndex: i + 1,  // ✅ COMMENCE À 1, pas 0 !
    }));
    onModulesChange(reorderedModules);
  };

  const handleLessonsChange = (moduleIndex: number, lessons: Lesson[]) => {
    updateModule(moduleIndex, { lessons });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newModules = [...modules];
    const draggedModule = newModules[draggedIndex];
    newModules.splice(draggedIndex, 1);
    newModules.splice(index, 0, draggedModule);

    // Recalculer les orderIndex
    const reorderedModules = newModules.map((module, i) => ({
      ...module,
      orderIndex: i + 1,  // ✅ COMMENCE À 1, pas 0 !
    }));

    onModulesChange(reorderedModules);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Modules du cours</h2>
          <p className="text-sm text-gray-600">
            Organisez votre cours en modules et ajoutez des leçons à chaque module.
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
            <p>Commencez par ajouter votre premier module pour structurer votre cours.</p>
            <Button
              type="button"
              onClick={addModule}
              className="mt-4"
            >
              Créer le premier module
            </Button>
          </div>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {modules.map((module, index) => (
            <AccordionItem
              key={module.id || module.tempId || `module-${index}`}
              value={module.id || module.tempId || `module-${index}`}
              className="border rounded-lg"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center space-x-4 flex-1">
                  <GripVertical
                    className="h-5 w-5 text-gray-400 cursor-move"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Le drag and drop sera géré au niveau du Card
                    }}
                  />
                  <div className="text-left">
                    <h3 className="font-semibold">
                      Module {index + 1}: {module.title || 'Sans titre'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {module.lessons.length} leçon{module.lessons.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-6">
                <Card
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="cursor-move border-0 shadow-none"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Détails du module</CardTitle>
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
                        onChange={(e) => updateModule(index, { title: e.target.value })}
                        placeholder="Entrez le titre du module"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description du module (optionnel)
                      </label>
                      <Textarea
                        value={module.description || ''}
                        onChange={(e) => updateModule(index, { description: e.target.value })}
                        placeholder="Décrivez le contenu de ce module..."
                        rows={3}
                      />
                    </div>

                    <div className="border-t pt-6">
                      <LessonManager
                        lessons={module.lessons}
                        onLessonsChange={(lessons) => handleLessonsChange(index, lessons)}
                        courseId={courseId}
                      />
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}