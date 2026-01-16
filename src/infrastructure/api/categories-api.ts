import type { Category } from "@/domain/entities/course";
import { buildApiUrl, API_ENDPOINTS } from "./baseConfig";

export class CategoriesApi {
  /**
   * Récupère la liste des catégories depuis l'API
   */
  static async getCategories(): Promise<Category[]> {
    const url = buildApiUrl(API_ENDPOINTS.COURSES.CATEGORIES);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    const data = await response.json();

    // DEBUG
    console.log("🔍 API getCategories - Données brutes:", data);

    // Gérer différents formats de réponse
    const categories = Array.isArray(data)
      ? data
      : data.categories || data.data || [];

    // Mapper les catégories pour assurer une structure cohérente
    return categories.map((cat: any) => ({
      id: cat.id || cat._id,
      name: cat.name || cat._name,
      description: cat.description || cat._description,
    }));
  }

  /**
   * Crée une nouvelle catégorie
   * @param categoryData - Données de la catégorie { name, description? }
   * @returns La catégorie créée
   */
  static async createCategory(categoryData: {
    name: string;
    description?: string;
  }): Promise<Category> {
    const url = buildApiUrl(API_ENDPOINTS.COURSES.CATEGORIES);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const errorMessage = `Failed to create category: ${response.status}`;
      console.error("❌ Erreur lors de la création de la catégorie:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // DEBUG
    console.log("✅ Catégorie créée avec succès:", data);

    // Mapper la réponse pour assurer une structure cohérente
    return {
      id: data.id || data._id,
      name: data.name || data._name,
      description: data.description || data._description || "",
    };
  }
}

