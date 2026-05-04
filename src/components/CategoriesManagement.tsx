"use client";

import { useState, useEffect } from "react";
import { CategoriesApi } from "@/infrastructure/api/categories-api";
import type { Category } from "@/domain/entities/course";
import Swal from "sweetalert2";
import {
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  FolderOpen,
  Calendar,
  X,
} from "lucide-react";
import logger from "@/shared/helpers/logger";

interface CategoriesManagementProps {
  onBack: () => void;
  onCategoryUpdated?: () => void;
}

export function CategoriesManagement({
  onBack,
  onCategoryUpdated,
}: CategoriesManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Charger les catégories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CategoriesApi.getCategories();
      setCategories(data);
      logger.log("✅ Catégories chargées:", data);
    } catch (err) {
      logger.error("❌ Erreur lors du chargement des catégories:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Créer une catégorie
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategoryName.trim()) {
      Swal.fire({
        title: "Erreur",
        text: "Le nom de la catégorie est requis",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      await CategoriesApi.createCategory({
        name: newCategoryName,
        description: newCategoryDescription,
      });

      Swal.fire({
        title: "Succès !",
        text: "Catégorie créée avec succès",
        icon: "success",
        confirmButtonColor: "#3b82f6",
      });

      // Réinitialiser le formulaire
      setNewCategoryName("");
      setNewCategoryDescription("");
      setShowCreateForm(false);

      // Rafraîchir la liste
      await fetchCategories();
      onCategoryUpdated?.();
    } catch (err) {
      logger.error("❌ Erreur lors de la création:", err);
      Swal.fire({
        title: "Erreur",
        text:
          err instanceof Error ? err.message : "Impossible de créer la catégorie",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  // Ouvrir le modal de modification
  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditDescription(category.description || "");
    setShowEditModal(true);
  };

  // Modifier une catégorie
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCategory?.id) return;

    if (!editName.trim()) {
      Swal.fire({
        title: "Erreur",
        text: "Le nom de la catégorie est requis",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    try {
      await CategoriesApi.updateCategory(editingCategory.id, {
        name: editName,
        description: editDescription,
      });

      Swal.fire({
        title: "Succès !",
        text: "Catégorie modifiée avec succès",
        icon: "success",
        confirmButtonColor: "#3b82f6",
      });

      // Fermer le modal
      setShowEditModal(false);
      setEditingCategory(null);

      // Rafraîchir la liste
      await fetchCategories();
      onCategoryUpdated?.();
    } catch (err) {
      logger.error("❌ Erreur lors de la modification:", err);
      Swal.fire({
        title: "Erreur",
        text:
          err instanceof Error ? err.message : "Impossible de modifier la catégorie",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  // Supprimer une catégorie
  const handleDelete = async (categoryId: string) => {
    // Demander confirmation
    const result = await Swal.fire({
      title: "Êtes-vous sûr ?",
      text: "Cette action est irréversible !",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      await CategoriesApi.deleteCategory(categoryId);

      Swal.fire({
        title: "Supprimée !",
        text: "La catégorie a été supprimée avec succès",
        icon: "success",
        confirmButtonColor: "#3b82f6",
      });

      // Rafraîchir la liste
      await fetchCategories();
      onCategoryUpdated?.();
    } catch (err) {
      logger.error("❌ Erreur lors de la suppression:", err);

      // Gérer les erreurs spécifiques
      if (
        err instanceof Error &&
        err.message.includes("utilisée par des cours")
      ) {
        Swal.fire({
          title: "Suppression impossible",
          text: err.message,
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        Swal.fire({
          title: "Erreur",
          text:
            err instanceof Error
              ? err.message
              : "Impossible de supprimer la catégorie",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      }
    }
  };

  // Formater la date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <h2 className="text-xl font-bold text-white">
          Gestion des Catégories
        </h2>

        <div className="w-24"></div>
      </div>

      {/* Contenu principal */}
      {!showCreateForm && !editingCategory && (
        <>
          {/* Liste des catégories ou message si vide */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchCategories}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Réessayer
              </button>
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-xl border border-[#302D47] bg-[#1F1D2B] py-12 text-center">
              <FolderOpen className="mx-auto mb-4 h-16 w-16 text-white/40" />
              <p className="mb-4 text-white/70">
                Aucune catégorie créée pour le moment
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-2 mx-auto w-fit"
              >
                <Plus className="w-5 h-5" />
                Créer la première catégorie
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#302D47] bg-[#1F1D2B]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[#302D47] bg-[#26233A]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/85">
                        Nom
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/85">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/85">
                        Date de création
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-white/85">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A273D]">
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className="transition-colors hover:bg-[#26233A]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2B2841]">
                              <FolderOpen className="h-5 w-5 text-[#A9F5E5]" />
                            </div>
                            <span className="font-medium text-white">
                              {category.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white/75">
                            {category.description || (
                              <span className="italic text-white/45">
                                Aucune description
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-2 text-white/70">
                            <Calendar className="h-4 w-4 text-white/50" />
                            {formatDate(category.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(category)}
                              className="rounded-lg p-2 text-amber-400 transition-colors hover:bg-[#332e24]"
                              title="Modifier"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() =>
                                category.id && handleDelete(category.id)
                              }
                              className="rounded-lg p-2 text-red-400 transition-colors hover:bg-[#33242a]"
                              title="Supprimer"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bouton fléchi pour créer une nouvelle catégorie */}
          {!loading && !error && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#3B3754] py-4 font-medium text-white/70 transition-colors hover:border-[#A9F5E5] hover:text-[#A9F5E5]"
            >
              <Plus className="w-5 h-5" />
              Ajouter une nouvelle catégorie
            </button>
          )}
        </>
      )}

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="rounded-xl border border-[#302D47] bg-[#1F1D2B] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">
              Créer une nouvelle catégorie
            </h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewCategoryName("");
                setNewCategoryDescription("");
              }}
              className="p-2 text-white/45 transition-colors hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-white/80"
              >
                Nom de la catégorie *
              </label>
              <input
                type="text"
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full rounded-lg border border-[#3B3754] bg-[#181721] px-4 py-2 text-white transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Développement Web"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-white/80"
              >
                Description
              </label>
              <textarea
                id="description"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#3B3754] bg-[#181721] px-4 py-2 text-white transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                placeholder="Description optionnelle de la catégorie..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewCategoryName("");
                  setNewCategoryDescription("");
                }}
                className="rounded-lg px-4 py-2 text-white/80 transition-colors hover:bg-[#26233A]"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Créer la catégorie
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#302D47] bg-[#1F1D2B]">
            <div className="flex items-center justify-between border-b border-[#302D47] p-6">
              <h3 className="text-lg font-semibold text-white">
                Modifier la catégorie
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                }}
                className="p-2 text-white/45 transition-colors hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="editName"
                  className="mb-1 block text-sm font-medium text-white/80"
                >
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-[#3B3754] bg-[#181721] px-4 py-2 text-white transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="editDescription"
                  className="mb-1 block text-sm font-medium text-white/80"
                >
                  Description
                </label>
                <textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[#3B3754] bg-[#181721] px-4 py-2 text-white transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                  }}
                  className="rounded-lg px-4 py-2 text-white/80 transition-colors hover:bg-[#26233A]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

