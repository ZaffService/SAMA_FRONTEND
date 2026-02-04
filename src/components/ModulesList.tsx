"use client";

import { useState } from "react";
import { 
  Plus, 
  Edit3, 
  Settings, 
  Trash2, 
  BookOpen,
  X,
  Save
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

interface ModulesListProps {
  modules: Module[];
  onModulesChange: (modules: Module[]) => void;
  onManageLessons: (moduleId: string) => void;
}

export function ModulesList({ modules, onModulesChange, onManageLessons }: ModulesListProps) {
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deleteConfirmModule, setDeleteConfirmModule] = useState<Module | null>(null);

  const addModule = () => {
    const newModule: Module = {
      tempId: `temp-${Date.now()}`,
      title: "",
      description: "",
      orderIndex: modules.length + 1,
      lessons: [],
    };
    onModulesChange([...modules, newModule]);
    // Ouvrir l'édition du nouveau module
    setEditingModule(newModule);
  };

  const handleSaveModule = () => {
    if (editingModule) {
      const index = modules.findIndex(
        m => m.id === editingModule.id || m.tempId === editingModule.tempId
      );
      if (index !== -1) {
        const updatedModules = [...modules];
        updatedModules[index] = editingModule;
        onModulesChange(updatedModules);
      }
      setEditingModule(null);
    }
  };

  const handleDeleteModule = () => {
    if (deleteConfirmModule) {
      const updatedModules = modules.filter(
        m => m.id !== deleteConfirmModule.id && m.tempId !== deleteConfirmModule.tempId
      );
      // Recalculer les orderIndex
      const reorderedModules = updatedModules.map((m, i) => ({
        ...m,
        orderIndex: i + 1,
      }));
      onModulesChange(reorderedModules);
      setDeleteConfirmModule(null);
    }
  };

  const lessonsCount = (module: Module) => {
    return module.lessons?.length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Liste des modules */}
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
            <Card key={module.id || module.tempId} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center p-4">
                  {/* Numéro du module */}
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold text-lg">
                      {index + 1}
                    </span>
                  </div>

                  {/* Informations du module */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md">
                        Module
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {module.title || "Sans titre"}
                    </h3>
                    {module.description && (
                      <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                        {module.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {lessonsCount(module)} {lessonsCount(module) === 1 ? 'leçon' : 'leçons'}
                    </p>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex-shrink-0 flex items-center gap-2 ml-4">
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingModule(module)}
                      className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Edit3 className="h-4 w-4" />
                      Modifier
                    </Button> */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageLessons(module.id || module.tempId || '')}
                      className="flex items-center gap-1 text-gray-600 border-gray-200 hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4" />
                      Gérer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmModule(module)}
                      className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog d'édition du module */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingModule?.id ? 'Modifier le module' : 'Nouveau module'}
            </DialogTitle>
          </DialogHeader>
          {editingModule && (
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du module *
                </label>
                <Input
                  value={editingModule.title}
                  onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                  placeholder="Entrez le titre du module"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description du module
                </label>
                <Textarea
                  value={editingModule.description || ''}
                  onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                  placeholder="Décrivez le contenu de ce module..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModule(null)}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSaveModule} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
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
            <Button onClick={handleDeleteModule} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
