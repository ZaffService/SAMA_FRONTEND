import { BackendCourse, CoursesApi } from "@/infrastructure/api/courses-api";
import { Course, CourseDetails } from "@/domain/entities/course";
import { CourseSearchOptions } from "@/infrastructure/api/baseConfig";

export class CoursesUseCases {
  /**
   * Récupérer la liste des cours avec gestion d'erreurs avancée
   * @param page - Numéro de page (défaut: 1)
   * @param perPage - Nombre de cours par page (défaut: 10)
   * @param searchOptions - Options de recherche et filtrage
   * @returns Objet contenant la liste des cours et les métadonnées de pagination
   */
  static async getCourses(
    page: number = 1,
    perPage: number = 10,
    searchOptions?: CourseSearchOptions,
  ): Promise<{
    courses: BackendCourse[];
    total: number;
    pages: number;
    hasCoursesInDatabase: boolean;
  }> {
    try {
      console.log("🔄 Récupération des cours depuis l'API...", {
        page,
        perPage,
        searchOptions,
      });

      const result = await CoursesApi.getCourses(page, perPage, searchOptions);

      console.log(`✅ ${result.courses.length} cours récupérés avec succès`);
      return result;
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des cours:", error);

      // Gestion d'erreur réseau
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.warn(
          "🌐 Erreur réseau détectée - Le backend est probablement arrêté",
        );
        throw new Error(
          "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.",
        );
      }

      // Erreur générique
      throw new Error(
        `Erreur lors du chargement des cours: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Récupérer les détails d'un cours spécifique
   * @param id - ID du cours (ObjectId MongoDB en string)
   * @returns Détails complets du cours
   */
  static async getCourseDetails(id: string): Promise<CourseDetails> {
    try {
      console.log(`🔍 Récupération des détails du cours: ${id}`);

      const courseDetailsResponse = await CoursesApi.getCourseDetails(id);

      // ✅ DEBUG : Afficher la structure complète
      console.log(
        "📦 Réponse API complète:",
        JSON.stringify(courseDetailsResponse, null, 2),
      );
      console.log(
        "📚 Nombre de modules:",
        courseDetailsResponse.modules?.length || 0,
      );

      // ✅ Vérifier que modules existe et n'est pas vide
      if (
        !courseDetailsResponse.modules ||
        courseDetailsResponse.modules.length === 0
      ) {
        console.warn("⚠️ AUCUN MODULE TROUVÉ pour ce cours");
      }

      // Map CourseDetailsResponse to CourseDetails
      const courseDetails: CourseDetails = {
        // ✅ CORRECTION: Utiliser id comme retourné par l'API
        id: courseDetailsResponse.course.id,
        title: courseDetailsResponse.course.title,
        content: courseDetailsResponse.course.description,
        categoryId: courseDetailsResponse.course.categoryId,
        categoryName: courseDetailsResponse.course.categoryName || "Non catégorisé",
        thumbnailUrl: courseDetailsResponse.course.thumbnailUrl || "",
        thumbnail: courseDetailsResponse.course.thumbnailUrl || "",
        price: courseDetailsResponse.course.price,
        instructor: { name: "Instructeur" },
        level: courseDetailsResponse.course.level,
        description: courseDetailsResponse.course.description,

        // ✅ CORRECTION : Mapper correctement les lessons
        lessons: (courseDetailsResponse.modules || []).flatMap((module) => {
          console.log(
            `📖 Module: ${module.title}, Leçons: ${module.lessons?.length || 0}`,
          );
          return (module.lessons || []).map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            content: lesson.content,
            order: lesson.orderIndex,
            videoUrl: undefined, // Pas disponible dans la réponse API actuelle
            duration: lesson.duration?.toString(),
          }));
        }),

        quizzes: [], // Not in response
      };

      console.log(`✅ Détails du cours récupérés: ${courseDetails.title}`);
      console.log(`📊 Nombre total de leçons: ${courseDetails.lessons.length}`);

      return courseDetails;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des détails du cours:",
        error,
      );

      if (error instanceof Error && error.message.includes("not found")) {
        throw new Error("Cours non trouvé. Il a peut-être été supprimé.");
      }

      throw new Error(
        `Impossible de charger les détails du cours: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Récupérer le contenu d'un cours (leçons, quizzes)
   * @param id - ID du cours
   * @returns Contenu structuré du cours
   */
  static async getCourseContents(id: string): Promise<any> {
    try {
      console.log(`🔄 Récupération du contenu du cours: ${id}`);

      const contents = await CoursesApi.getCourseContents(id);

      console.log(`✅ Contenu du cours récupéré`);
      return contents;
    } catch (error) {
      console.warn("⚠️ Contenu du cours non disponible:", error);
      // Ne pas lancer d'erreur pour le contenu, juste retourner un tableau vide
      return [];
    }
  }

  /**
   * Récupérer les leçons d'un cours
   * @param topicId - ID du cours
   * @returns Liste des leçons
   */
  static async getLessons(topicId: string): Promise<any[]> {
    try {
      console.log(`🔄 Récupération des leçons du cours: ${topicId}`);

      const lessons = await CoursesApi.getLessons(topicId);

      console.log(`✅ ${lessons.length} leçons récupérées`);
      return lessons;
    } catch (error) {
      console.warn("Leçons non disponibles:", error);
      return [];
    }
  }

  /**
   * S'inscrire à un cours (gratuit ou payant)
   * @param courseId - ID du cours
   * @returns Objet contenant soit payment_url pour cours payant, soit les détails d'inscription pour cours gratuit
   */
  static async followCourse(courseId: string): Promise<{
    payment_url?: string;
    course?: any;
    progress?: number;
    status?: string;
  }> {
    try {
      console.log(`🔄 Inscription au cours: ${courseId}`);

      const result = await CoursesApi.followCourse(courseId);

      console.log(`✅ Inscription réussie pour le cours: ${courseId}`);
      return result;
    } catch (error) {
      console.error("❌ Erreur lors de l'inscription au cours:", error);

      throw new Error(
        `Impossible de s'inscrire au cours: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Récupérer les catégories disponibles
   * @returns Liste des catégories
   */
  static async getCategories(): Promise<
    Array<{ id: string; name: string; description?: string }>
  > {
    try {
      console.log("🔄 Récupération des catégories depuis l'API...");

      const categories = await CoursesApi.getCategories();

      console.log(`✅ ${categories.length} catégories récupérées avec succès`);
      return categories;
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des catégories:", error);

      // Gestion d'erreur réseau
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.warn(
          "🌐 Erreur réseau détectée - Le backend est probablement arrêté",
        );
        throw new Error(
          "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.",
        );
      }

      // Erreur générique
      throw new Error(
        `Erreur lors du chargement des catégories: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Récupérer les données de filtrage pour les cours
   * @returns Objet contenant les catégories, niveaux et plages de prix avec leurs comptes
   */
  static async getCourseFilters(): Promise<{
    categories: Array<{ id: string; name: string; count: number }>;
    levels: Array<{ id: string; name: string; count: number }>;
    priceRanges: Array<{ id: string; name: string; count: number }>;
  }> {
    try {
      console.log("🔄 Récupération des données de filtrage...");

      // Récupérer toutes les catégories
      const categories = await this.getCategories();

      // Pour les niveaux, on utilise des valeurs prédéfinies
      const levels = [
        { id: "BEGINNER", name: "Débutant", count: 0 },
        { id: "INTERMEDIATE", name: "Intermédiaire", count: 0 },
        { id: "ADVANCED", name: "Avancé", count: 0 },
      ];

      // Pour les plages de prix, on utilise des valeurs prédéfinies
      const priceRanges = [
        { id: "0-50", name: "0 - 50€", count: 0 },
        { id: "50-100", name: "50 - 100€", count: 0 },
        { id: "100-200", name: "100 - 200€", count: 0 },
        { id: "200+", name: "200€+", count: 0 },
      ];

      // TODO: Implémenter le comptage réel en récupérant les cours et en comptant
      // Pour l'instant, on retourne les structures avec count = 0

      console.log(`✅ Données de filtrage récupérées`);
      return {
        categories: categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          count: 0,
        })),
        levels,
        priceRanges,
      };
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des filtres:", error);

      throw new Error(
        `Erreur lors du chargement des filtres: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Helper pour créer un hook React optimisé
   * Cette méthode retourne la configuration nécessaire pour créer un hook
   */
  static getCoursesHookConfig() {
    return {
      /**
       * Configuration pour le hook useAllCourses
       * Retourne les méthodes et la logique métier sans les hooks React
       */
      useAllCourses: () => {
        // Cette méthode sera implémentée dans un hook séparé
        // Ici on retourne juste la structure pour l'instant
        return {
          courses: [] as Course[],
          loading: false,
          error: null as string | null,
          total: 0,
          pages: 0,
          refresh: () => Promise.resolve(),
          refetch: () => Promise.resolve(),
        };
      },
    };
  }
}
