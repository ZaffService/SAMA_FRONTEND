import type { Course, CourseDetails } from "@/domain/entities/course";
import type { Module, Lesson } from "@/domain/entities/module";
import Cookies from "js-cookie";

// {
//     "courses": [
//         {
//             "id": "9c27de41-9ca3-4a0c-8098-69c5f48c06d3",
//             "title": "Architecture Backend et APIs",
//             "description": "Construisez des backends scalables avec Node.js/Express ou Python/Django. Maîtrisez les APIs REST/GraphQL, les bases de données SQL/NoSQL, les microservices, Docker, Kubernetes et la sécurité backend.",
//             "thumbnailUrl": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=400&fit=crop",
//             "price": 200,
//             "level": "ADVANCED",
//             "status": "DRAFT",
//             "instructorName": "Alice Johnson",
//             "categoryName": "Développement web",
//             "previewAvailable": true,
//             "enrollmentCount": 0
//         },
//       ]
//     "total": 26,
//     "page": 3,
//     "limit": 8,
//     "totalPages": 4,
//     "hasCoursesInDatabase": true
// }

// Lesson status enum
export enum LessonStatus {
  PENDING_VIDEO = "PENDING_VIDEO",
  VIDEO_UPLOADED = "VIDEO_UPLOADED",
  READY = "READY",
}

// Helper function to decode base64url
function base64UrlDecode(str: string): string {
  // Replace URL-safe characters with base64 characters
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return atob(base64);
}

export interface BackendCourse {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  thumbnailUrl?: string;
  price: number;
  level: string;
  status: string;
  instructorName?: string;
  previewAvailable?: boolean;
  enrollmentCount?: number;
}

interface BackendResponse {
  courses: BackendCourse[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasCoursesInDatabase: boolean;
}

interface CourseDetailsResponse {
  course: {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    categoryName?: string;
    level: string;
    price: number;
    thumbnailUrl?: string;
    isFree?: boolean;
    isComplete?: boolean;
  };
  modules: Array<{
    id: string;
    title: string;
    description: string;
    orderIndex: number;
    lessons: Array<{
      id: string;
      title: string;
      content: string;
      hasVideo?: boolean;
      orderIndex: number;
      duration: number;
      status: LessonStatus | string;
    }>;
  }>;
  moduleCount: number;
}

interface FollowCourseResult {
  course: Course;
  progress: number;
  status: string;
}

import { buildApiUrl, API_ENDPOINTS } from "./baseConfig";

export class CoursesApi {
  /**
   * Récupère tous les cours pour les administrateurs (tous statuts confondus)
   */
  static async getAdminCourses(
    page: number = 1,
    perPage: number = 100,
    searchOptions?: any,
  ): Promise<{
    courses: BackendCourse[];
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
    hasCoursesInDatabase: boolean;
  }> {
    // Utiliser l'endpoint admin qui retourne tous les cours
    const url = new URL(buildApiUrl(API_ENDPOINTS.COURSES.ADMIN_COURSES));
    url.searchParams.append("page", page.toString());
    url.searchParams.append("limit", perPage.toString());

    // Ajouter les paramètres de recherche si fournis
    if (searchOptions?.query) {
      url.searchParams.append("query", searchOptions.query);
    }
    if (searchOptions?.categoryId) {
      url.searchParams.append("categoryId", searchOptions.categoryId);
    }
    if (searchOptions?.level) {
      url.searchParams.append("level", searchOptions.level);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch admin courses: ${response.status}`);
    }

    const data = (await response.json()) as BackendResponse;

    console.log(
      "🔍 API getAdminCourses - Données brutes:",
      JSON.stringify(data, null, 2),
    );

    const courses = data.courses;

    return {
      courses,
      total: data.total ?? courses.length,
      pages: data.totalPages ?? Math.ceil(courses.length / perPage),
      currentPage: data.page ?? page,
      limit: data.limit ?? perPage,
      hasCoursesInDatabase: data.hasCoursesInDatabase,
    };
  }

  /**
   * Récupère la liste des cours pour l'affichage en grille avec pagination
   */
  static async getCourses(
    page: number = 1,
    perPage: number = 8,
    searchOptions?: any,
  ): Promise<{
    courses: BackendCourse[];
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
    hasCoursesInDatabase: boolean;
  }> {
    // Construire l'URL avec les paramètres de pagination
    const url = new URL(buildApiUrl(API_ENDPOINTS.COURSES.SEARCH));
    url.searchParams.append("page", page.toString());
    url.searchParams.append("limit", perPage.toString());

    // Ajouter les paramètres de recherche si fournis
    if (searchOptions?.query) {
      url.searchParams.append("query", searchOptions.query);
    }
    if (searchOptions?.categoryId) {
      url.searchParams.append("categoryId", searchOptions.categoryId);
    }
    if (searchOptions?.level) {
      url.searchParams.append("level", searchOptions.level);
    }
    if (searchOptions?.userRole) {
      url.searchParams.append("userRole", searchOptions.userRole);
    }
    if (searchOptions?.status) {
      url.searchParams.append("status", searchOptions.status);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.status}`);
    }

    const data = await response.json();

    // DEBUG: Afficher les données brutes pour diagnostiquer
    console.log(
      "🔍 API getCourses - Données brutes:",
      JSON.stringify(data, null, 2),
    );

    const courses = data.courses;

    return {
      courses,
      total: data.total ?? courses.length,
      pages: data.totalPages ?? Math.ceil(courses.length / perPage),
      currentPage: data.page ?? page,
      limit: data.limit ?? perPage,
      hasCoursesInDatabase: data.hasCoursesInDatabase,
    };
  }

  /**
   * Récupère UNIQUEMENT les détails d'un cours spécifique (rapide, optimisé)
   */
  static async getCourseDetails(
    courseId: string,
  ): Promise<CourseDetailsResponse> {
    console.log(`🔍 API: Récupération des détails du cours: ${courseId}`);

    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.COURSES.DETAILS}/${courseId}`),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch course details: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      "📦 API: Réponse backend complète:",
      JSON.stringify(data, null, 2),
    );
    console.log("📚 API: Nombre de modules:", data.modules?.length || 0);

    return data;
  }

  /**
   * Récupère le contenu d'un cours (modules et leçons)
   */
  static async getCourseContents(courseId: string): Promise<any> {
    // Since getCourseDetails already returns the content, we can reuse it
    const details = await this.getCourseDetails(courseId);
    return details.modules || [];
  }

  /**
   * Récupère les leçons d'un module
   */
  static async getLessons(topicId: string): Promise<any[]> {
    // For now, return empty array as we don't have a specific endpoint
    // In a real implementation, this would call an API endpoint
    return [];
  }

  /**
   * Récupère le contenu d'un cours avec la progression de l'utilisateur (pour utilisateurs inscrits)
   */
  static async getCourseWithProgress(courseId: string): Promise<any> {
    console.log(`🔍 API: Récupération du cours avec progression: ${courseId}`);

    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.COURSES.FOLLOW}/${courseId}`),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch course with progress: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log(
      "📦 API: Réponse backend complète avec progression:",
      JSON.stringify(data, null, 2),
    );

    return data;
  }

  /**
   * Marque une leçon comme terminée
   */
  static async markLessonCompleted(
    lessonId: string,
  ): Promise<{ success: boolean }> {
    console.log(`✅ API: Marquage de la leçon ${lessonId} comme terminée`);

    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.COURSES.LESSON_COMPLETE}/${lessonId}`),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to mark lesson completed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Récupère les catégories disponibles
   */
  static async getCategories(): Promise<Array<{ id: string; name: string }>> {
    console.log("🔍 [API] Récupération des catégories...");
    console.log("🔍 [API] URL:", buildApiUrl(API_ENDPOINTS.COURSES.CATEGORIES));

    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.COURSES.CATEGORIES),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // credentials: "include", // ❌ Pas nécessaire pour les catégories
      },
    );

    console.log(
      "📡 [API] Statut de la réponse:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      console.error("❌ [API] Erreur HTTP:", response.status);
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    const data = await response.json();

    // DEBUG: Afficher la structure complète
    console.log(
      "📦 [API] Données brutes reçues:",
      JSON.stringify(data, null, 2),
    );
    console.log(
      "📦 [API] Type de données:",
      Array.isArray(data) ? "Array" : typeof data,
    );

    // Gérer les différents formats de réponse possibles
    let categories: Array<{ id: string; name: string }>;

    if (Array.isArray(data)) {
      // Format 1: Tableau direct
      categories = data;
      console.log("✅ [API] Format: Tableau direct");
    } else if (data.categories && Array.isArray(data.categories)) {
      // Format 2: { categories: [...] }
      categories = data.categories;
      console.log("✅ [API] Format: Objet avec clé 'categories'");
    } else if (data.data && Array.isArray(data.data)) {
      // Format 3: { data: [...] }
      categories = data.data;
      console.log("✅ [API] Format: Objet avec clé 'data'");
    } else {
      console.error("❌ [API] Format de réponse non reconnu:", data);
      throw new Error("Format de réponse invalide");
    }

    console.log(`✅ [API] ${categories.length} catégories chargées`);
    console.log(
      "📋 [API] Liste des catégories:",
      categories.map((c) => c.name).join(", "),
    );

    return categories;
  }

  /**
   * Sauvegarde un brouillon de cours
   */
  static async saveDraft(courseData: any): Promise<any> {
    console.log("🚀 [CoursesApi] Début sauvegarde brouillon...");

    // ✅ RÉCUPÉRER L'ID DE L'UTILISATEUR DEPUIS LE JWT
    const accessToken = Cookies.get("access_token");

    if (!accessToken) {
      console.error("❌ [CoursesApi] Token absent");
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }

    // Décoder le JWT pour extraire userId
    let userId: string;
    try {
      const payload = JSON.parse(base64UrlDecode(accessToken.split(".")[1]));
      userId = payload.userId || payload.sub || payload.id;

      console.log("👤 [CoursesApi] User ID extrait:", userId);

      if (!userId) {
        throw new Error("userId non trouvé dans le token");
      }

      // Vérifier l'expiration
      const now = Date.now() / 1000;
      if (now > payload.exp) {
        console.error("❌ [CoursesApi] Token expiré");
        window.location.href = "/login";
        throw new Error("Token expiré");
      }

      const timeLeft = Math.floor((payload.exp - now) / 60);
      console.log(`⏰ [CoursesApi] Token valide encore ${timeLeft} minutes`);
    } catch (err) {
      console.error("❌ [CoursesApi] Erreur extraction userId:", err);
      throw err;
    }

    const formData = new FormData();

    // ✅ Gestion du thumbnail : optionnel si URL valide
    let thumbnailUrl: string | undefined;

    // Si c'est une URL string valide, on l'utilise
    if (
      courseData.thumbnailUrl &&
      typeof courseData.thumbnailUrl === "string"
    ) {
      thumbnailUrl = courseData.thumbnailUrl;
    }
    // Si c'est un fichier, thumbnailUrl reste undefined (sera envoyé séparément)

    // ✅ Format exact attendu par le backend
    const courseJsonData: any = {
      title: courseData.title,
      description: courseData.description,
      categoryId: courseData.categoryId,
      level: courseData.level,
      price: Number(courseData.price) || 0,
      status: courseData.status || "DRAFT", // Inclure le statut (DRAFT ou PUBLISHED)
      modules: courseData.modules.map((module: any) => ({
        title: module.title,
        orderIndex: Number(module.orderIndex) || 0,
        description: module.description || undefined,
        lessons:
          module.lessons?.map((lesson: any) => ({
            tempId: lesson.tempId,
            title: lesson.title,
            content: lesson.content || "",
            orderIndex: Number(lesson.orderIndex) || 0,
            duration: Number(lesson.duration) || 0,
          })) || [],
        quizzes:
          module.quizzes?.map((quiz: any) => ({
            title: quiz.title,
            description: quiz.description || undefined,
            passingScore: Number(quiz.passingScore) || undefined,
            questions:
              quiz.questions?.map((q: any) => ({
                question: q.question,
                questionType: q.questionType || "MULTIPLE_CHOICE",
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                points: Number(q.points) || undefined,
              })) || [],
          })) || [],
      })),
    };

    // Ajouter thumbnailUrl seulement si c'est une URL valide
    if (thumbnailUrl) {
      courseJsonData.thumbnailUrl = thumbnailUrl;
    }

    // ✅ Le champ "data" contient le JSON stringifié
    formData.append("data", JSON.stringify(courseJsonData));
    console.log(
      "📦 [CoursesApi] Données JSON:",
      JSON.stringify(courseJsonData, null, 2),
    );
    console.log("🖼️ [CoursesApi] Thumbnail:", thumbnailUrl);

    // ✅ Ajouter le fichier thumbnail si c'est un File
    if (courseData.thumbnail && typeof courseData.thumbnail !== "string") {
      formData.append("thumbnail", courseData.thumbnail);
      console.log("🖼️ [CoursesApi] Fichier thumbnail ajouté");
    }

    // Ajouter les vidéos
    let videoCount = 0;
    courseData.modules.forEach((module: Module) => {
      module.lessons.forEach((lesson: Lesson) => {
        if (lesson.videoFile) {
          const videoKey = `lessonVideos[${lesson.tempId}]`;
          formData.append(videoKey, lesson.videoFile);
          videoCount++;
          console.log(`🎥 [CoursesApi] Vidéo ajoutée: ${videoKey}`);
        }
      });
    });
    console.log(`📹 [CoursesApi] Total vidéos: ${videoCount}`);

    // ⚠️ CRITIQUE : Envoyer la requête avec credentials
    console.log(
      "📡 [CoursesApi] Envoi vers:",
      buildApiUrl(API_ENDPOINTS.COURSES.CREATE),
    );
    console.log("🔐 [CoursesApi] Credentials: include");

    const response = await fetch(buildApiUrl(API_ENDPOINTS.COURSES.CREATE), {
      method: "POST",
      credentials: "include", // ✅ CRITIQUE : Envoyer les cookies (JWT)
      body: formData,
      // ⚠️ NE PAS METTRE Content-Type avec FormData (fetch le fait automatiquement)
    });

    console.log(
      "📡 [CoursesApi] Statut réponse:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;

      try {
        const errorData = await response.json();
        console.error("❌ [CoursesApi] Erreur backend:", errorData);
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch (err) {
        console.error("❌ [CoursesApi] Impossible de parser l'erreur");
      }

      // Si 401, proposer de se reconnecter
      if (response.status === 401) {
        window.location.href = "/login";
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("✅ [CoursesApi] Brouillon sauvegardé:", responseData);

    return responseData;
  }

  /**
   * Vérifie si l'utilisateur est inscrit à un cours
   */
  static async checkEnrollmentStatus(courseId: string): Promise<boolean> {
    console.log(
      `🔍 API: Vérification du statut d'inscription pour le cours ${courseId}`,
    );

    try {
      // ✅ Vérifier si l'utilisateur est un admin (accès automatique à tous les cours)
      const accessToken = Cookies.get("access_token");
      if (accessToken) {
        try {
          const payload = JSON.parse(
            base64UrlDecode(accessToken.split(".")[1]),
          );
          const userRole = payload.role;

          if (userRole === "ADMIN") {
            console.log("👑 Admin détecté - Accès automatique au cours");
            return true;
          }
        } catch (err) {
          console.error("❌ Erreur extraction rôle depuis token:", err);
          // Continue avec la vérification normale
        }
      }

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.COURSES.PROGRESS(courseId)),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (response.ok) {
        console.log("✅ Utilisateur inscrit au cours");
        return true;
      } else if (response.status === 403 || response.status === 404) {
        console.log("ℹ️ Utilisateur non inscrit ou accès refusé");
        return false;
      } else {
        console.error(
          "❌ Erreur inattendue lors de la vérification:",
          response.status,
        );
        return false;
      }
    } catch (error) {
      console.error(
        "💥 Erreur lors de la vérification du statut d'inscription:",
        error,
      );
      return false;
    }
  }

  /**
   * Suit un cours (inscription ou redirection paiement)
   */
  static async followCourse(courseId: string): Promise<{
    payment_url?: string;
    course?: any;
    progress?: number;
    status?: string;
  }> {
    console.log(`🔄 API: Tentative de suivi du cours ${courseId}`);

    // ✅ SÉCURITÉ: Vérifier d'abord si déjà inscrit pour éviter les duplicatas
    const alreadyEnrolled = await this.checkEnrollmentStatus(courseId);
    if (alreadyEnrolled) {
      console.log("✅ Utilisateur déjà inscrit, retour immédiat");
      return {
        status: "ACTIVE",
        progress: 0,
        course: { id: courseId },
      };
    }

    // ✅ Vérifier si l'utilisateur est un admin (pas besoin d'inscription)
    const accessToken = Cookies.get("access_token");
    if (accessToken) {
      try {
        const payload = JSON.parse(base64UrlDecode(accessToken.split(".")[1]));
        const userRole = payload.role;

        if (userRole === "ADMIN") {
          console.log("👑 Admin détecté - Inscription automatique au cours");
          return {
            status: "ACTIVE",
            progress: 0,
            course: { id: courseId },
          };
        }
      } catch (err) {
        console.error("❌ Erreur extraction rôle depuis token:", err);
        // Continue avec la procédure normale
      }
    }

    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.COURSES.FOLLOW(courseId)),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    // ✅ GESTION DES ERREURS DE DUPLICATION
    if (response.status === 409 || response.status === 400) {
      // L'utilisateur est peut-être déjà inscrit (race condition)
      console.log("⚠️ Erreur 409/400, vérification de l'état actuel...");

      // Vérifier si l'utilisateur est maintenant inscrit
      const checkResult = await this.checkEnrollmentStatus(courseId);
      if (checkResult) {
        console.log("✅ Inscription confirmée malgré l'erreur 409");
        return {
          status: "ACTIVE",
          progress: 0,
          course: { id: courseId },
        };
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // ✅ GESTION SPÉCIFIQUE DES ERREURS
      if (response.status === 409) {
        console.log("⚠️ Inscription duplicate détectée");
        return {
          status: "DUPLICATE",
          course: { id: courseId },
        };
      }

      throw new Error(
        errorData.message || `Erreur lors de l'inscription: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log(
      "📦 API: Réponse du suivi de cours:",
      JSON.stringify(data, null, 2),
    );

    // Retourner un objet cohérent avec des propriétés optionnelles
    return {
      payment_url: data.payment_url,
      course: data.course,
      progress: data.progress,
      status: data.status,
    };
  }

  /**
   * Inscrit un utilisateur à un cours (après paiement)
   */
  static async enrollUser(courseId: string): Promise<any> {
    console.log(`🔄 API: Inscription de l'utilisateur au cours ${courseId}`);

    const response = await fetch(buildApiUrl(API_ENDPOINTS.COURSES.ENROLL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ courseId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Erreur lors de l'inscription: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log(
      "📦 API: Réponse de l'inscription:",
      JSON.stringify(data, null, 2),
    );

    return data;
  }

  /**
   * Crée un nouveau cours
   */
  static async createCourse(courseData: any): Promise<any> {
    console.log("🚀 [CoursesApi] Début création cours...");

    const formData = new FormData();

    // ✅ Gestion du thumbnail : optionnel si URL valide
    let thumbnailUrl: string | undefined;

    // Si c'est une URL string valide, on l'utilise
    if (
      courseData.thumbnailUrl &&
      typeof courseData.thumbnailUrl === "string"
    ) {
      thumbnailUrl = courseData.thumbnailUrl;
    }
    // Si c'est un fichier, thumbnailUrl reste undefined (sera envoyé séparément)

    // ✅ Format exact attendu par le backend
    const courseJsonData: any = {
      title: courseData.title,
      description: courseData.description,
      categoryId: courseData.categoryId,
      level: courseData.level,
      price: Number(courseData.price) || 0,
      status: courseData.status || "DRAFT", // Inclure le statut (DRAFT ou PUBLISHED)
      modules: courseData.modules.map((module: any) => ({
        title: module.title,
        orderIndex: Number(module.orderIndex) || 0,
        description: module.description || undefined,
        lessons:
          module.lessons?.map((lesson: any) => ({
            tempId: lesson.tempId,
            title: lesson.title,
            content: lesson.content || "",
            orderIndex: Number(lesson.orderIndex) || 0,
            duration: Number(lesson.duration) || 0,
          })) || [],
        quizzes:
          module.quizzes?.map((quiz: any) => ({
            title: quiz.title,
            description: quiz.description || undefined,
            passingScore: Number(quiz.passingScore) || undefined,
            questions:
              quiz.questions?.map((q: any) => ({
                question: q.question,
                questionType: q.questionType || "MULTIPLE_CHOICE",
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                points: Number(q.points) || undefined,
              })) || [],
          })) || [],
      })),
    };

    // ✅ Le champ "data" contient le JSON stringifié
    formData.append("data", JSON.stringify(courseJsonData));
    console.log(
      "📦 [CoursesApi] Données JSON:",
      JSON.stringify(courseJsonData, null, 2),
    );
    console.log("🖼️ [CoursesApi] Thumbnail:", thumbnailUrl);

    // ✅ Ajouter le fichier thumbnail si c'est un File
    if (courseData.thumbnail && typeof courseData.thumbnail !== "string") {
      formData.append("thumbnail", courseData.thumbnail);
      console.log("🖼️ [CoursesApi] Fichier thumbnail ajouté");
    }

    // Ajouter les vidéos
    let videoCount = 0;
    courseData.modules.forEach((module: Module) => {
      module.lessons.forEach((lesson: Lesson) => {
        if (lesson.videoFile) {
          const videoKey = `lessonVideos[${lesson.tempId}]`;
          formData.append(videoKey, lesson.videoFile);
          videoCount++;
          console.log(`🎥 [CoursesApi] Vidéo ajoutée: ${videoKey}`);
        }
      });
    });
    console.log(`📹 [CoursesApi] Total vidéos: ${videoCount}`);

    // Ajouter les fichiers joints
    let attachmentCount = 0;
    if (courseData.attachments && courseData.attachments.length > 0) {
      courseData.attachments.forEach((attachment: any) => {
        formData.append("attachments", attachment.file);
        attachmentCount++;
        console.log(
          `📎 [CoursesApi] Fichier joint ajouté: ${attachment.file.name}`,
        );
      });
    }
    console.log(`📎 [CoursesApi] Total fichiers joints: ${attachmentCount}`);

    console.log(
      "📡 [CoursesApi] Envoi vers:",
      buildApiUrl(API_ENDPOINTS.COURSES.CREATE),
    );
    console.log("🔐 [CoursesApi] Credentials: include");

    const response = await fetch(buildApiUrl(API_ENDPOINTS.COURSES.CREATE), {
      method: "POST",
      credentials: "include", // ✅ Les cookies HttpOnly sont envoyés automatiquement
      body: formData,
    });

    console.log(
      "📡 [CoursesApi] Statut réponse:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;

      try {
        const errorData = await response.json();
        console.error("❌ [CoursesApi] Erreur backend:", errorData);
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch (err) {
        console.error("❌ [CoursesApi] Impossible de parser l'erreur");
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("✅ [CoursesApi] Succès:", responseData);

    return responseData;
  }

  /**
   * Met à jour un cours existant
   */
  static async updateCourse(courseId: string, courseData: any): Promise<any> {
    console.log(` [CoursesApi] Début mise à jour du cours ${courseId}...`);

    const formData = new FormData();

    // ✅ Gestion du thumbnail : optionnel si URL valide
    let thumbnailUrl: string | undefined;

    // Si c'est une URL string valide, on l'utilise
    if (
      courseData.thumbnailUrl &&
      typeof courseData.thumbnailUrl === "string"
    ) {
      thumbnailUrl = courseData.thumbnailUrl;
    }

    // ✅ Format exact attendu par le backend
    const courseJsonData: any = {
      title: courseData.title,
      description: courseData.description,
      categoryId: courseData.categoryId,
      level: courseData.level,
      price: Number(courseData.price) || 0,
      status: courseData.status || "DRAFT",
      modules: courseData.modules.map((module: any) => ({
        id: module.id || undefined,
        title: module.title,
        orderIndex: Number(module.orderIndex) || 0,
        description: module.description || undefined,
        lessons:
          module.lessons?.map((lesson: any) => ({
            id: lesson.id || undefined,
            tempId: lesson.tempId,
            title: lesson.title,
            content: lesson.content || "",
            orderIndex: Number(lesson.orderIndex) || 0,
            duration: Number(lesson.duration) || 0,
          })) || [],
        quizzes:
          module.quizzes?.map((quiz: any) => ({
            id: quiz.id || undefined,
            title: quiz.title,
            description: quiz.description || undefined,
            passingScore: Number(quiz.passingScore) || undefined,
            questions:
              quiz.questions?.map((q: any) => ({
                id: q.id || undefined,
                question: q.question,
                questionType: q.questionType || "MULTIPLE_CHOICE",
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                points: Number(q.points) || undefined,
              })) || [],
          })) || [],
      })),
    };

    // Ajouter thumbnailUrl seulement si c'est une URL valide
    if (thumbnailUrl) {
      courseJsonData.thumbnailUrl = thumbnailUrl;
    }

    // ✅ Le champ "data" contient le JSON stringifié
    formData.append("data", JSON.stringify(courseJsonData));
    console.log(
      "📦 [CoursesApi] Données JSON:",
      JSON.stringify(courseJsonData, null, 2),
    );
    console.log("🖼️ [CoursesApi] Thumbnail:", thumbnailUrl);

    // ✅ Ajouter le fichier thumbnail si c'est un File
    if (courseData.thumbnail && typeof courseData.thumbnail !== "string") {
      formData.append("thumbnail", courseData.thumbnail);
      console.log("🖼️ [CoursesApi] Fichier thumbnail ajouté");
    }

    // Ajouter les vidéos
    let videoCount = 0;
    courseData.modules.forEach((module: any) => {
      module.lessons?.forEach((lesson: any) => {
        if (lesson.videoFile) {
          const videoKey = `lessonVideos[${lesson.tempId}]`;
          formData.append(videoKey, lesson.videoFile);
          videoCount++;
          console.log(`🎥 [CoursesApi] Vidéo ajoutée: ${videoKey}`);
        }
      });
    });
    console.log(`📹 [CoursesApi] Total vidéos: ${videoCount}`);

    // Ajouter les fichiers joints
    let attachmentCount = 0;
    if (courseData.attachments && courseData.attachments.length > 0) {
      courseData.attachments.forEach((attachment: any) => {
        if (attachment.file && typeof attachment.file !== "string") {
          formData.append("attachments", attachment.file);
          attachmentCount++;
          console.log(
            `📎 [CoursesApi] Fichier joint ajouté: ${attachment.file.name}`,
          );
        }
      });
    }
    console.log(`📎 [CoursesApi] Total fichiers joints: ${attachmentCount}`);

    console.log(
      "📡 [CoursesApi] Envoi vers:",
      buildApiUrl(API_ENDPOINTS.COURSES.UPDATE(courseId)),
    );
    console.log("🔐 [CoursesApi] Credentials: include");

    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.COURSES.UPDATE(courseId)),
      {
        method: "PUT",
        credentials: "include",
        body: formData,
      },
    );

    console.log(
      "📡 [CoursesApi] Statut réponse:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;

      try {
        const errorData = await response.json();
        console.error("❌ [CoursesApi] Erreur backend:", errorData);
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch (err) {
        console.error("❌ [CoursesApi] Impossible de parser l'erreur");
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("✅ [CoursesApi] Cours mis à jour:", responseData);

    return responseData;
  }

  /**
   * Met à jour les informations basiques d'un cours (version simplifiée)
   * Endpoint: PUT /course/update-simple/{courseId}
   * Format: multipart/form-data avec champ "data" (JSON stringifié)
   */
  static async updateCourseSimple(
    courseId: string,
    courseData: {
      title?: string;
      description?: string;
      categoryId?: string;
      level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
      price?: number;
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      thumbnailUrl?: string;
    },
    thumbnailFile?: File | null,
  ): Promise<{ message: string }> {
    console.log(`🔄 [CoursesApi] Mise à jour simple du cours: ${courseId}`);
    console.log("📦 [CoursesApi] Données à mettre à jour:", courseData);

    const formData = new FormData();

    // Le champ "data" est requis et contient les données JSON
    // Tous les champs sont optionnels dans data
    const courseJsonData: any = {};

    if (courseData.title !== undefined) {
      courseJsonData.title = courseData.title;
    }
    if (courseData.description !== undefined) {
      courseJsonData.description = courseData.description;
    }
    if (courseData.categoryId !== undefined) {
      courseJsonData.categoryId = courseData.categoryId;
    }
    if (courseData.level !== undefined) {
      courseJsonData.level = courseData.level;
    }
    if (courseData.price !== undefined) {
      courseJsonData.price = Number(courseData.price) || 0;
    }
    if (courseData.status !== undefined) {
      courseJsonData.status = courseData.status;
    }
    if (courseData.thumbnailUrl !== undefined) {
      courseJsonData.thumbnailUrl = courseData.thumbnailUrl;
    }

    // Append le JSON stringifié dans le champ "data"
    formData.append("data", JSON.stringify(courseJsonData));
    console.log("📦 [CoursesApi] JSON data:", JSON.stringify(courseJsonData, null, 2));

    // Append le fichier thumbnail si présent
    if (thumbnailFile) {
      formData.append("thumbnail", thumbnailFile);
      console.log("🖼️ [CoursesApi] Fichier thumbnail ajouté:", thumbnailFile.name);
    }

    const url = buildApiUrl(API_ENDPOINTS.COURSES.UPDATE_SIMPLE(courseId));
    console.log("📡 [CoursesApi] URL:", url);

    const response = await fetch(url, {
      method: "PUT",
      credentials: "include",
      body: formData,
      // Note: Ne pas set Content-Type avec FormData - le navigateur le fait automatiquement
    });

    console.log(
      "📡 [CoursesApi] Statut réponse:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;

      try {
        const errorData = await response.json();
        console.error("❌ [CoursesApi] Erreur backend:", errorData);
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch (err) {
        console.error("❌ [CoursesApi] Impossible de parser l'erreur");
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("✅ [CoursesApi] Réponse:", responseData);

    return responseData;
  }

  /**
   * Récupère les cours auxquels l'utilisateur est inscrit
   */
  static async getEnrolledCourses(): Promise<any[]> {
    console.log("🔍 API: Récupération des cours inscrits");

    const response = await fetch(buildApiUrl(API_ENDPOINTS.COURSES.ENROLLED), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      console.error(
        "❌ Erreur lors de la récupération des cours inscrits:",
        response.status,
      );
      return [];
    }

    const data = await response.json();
    console.log("📦 API: Cours inscrits:", data);

    // Le format peut varier selon le backend
    if (Array.isArray(data)) {
      return data;
    }
    if (data.courses && Array.isArray(data.courses)) {
      return data.courses;
    }
    if (data.enrollments && Array.isArray(data.enrollments)) {
      return data.enrollments;
    }

    return [];
  }

  /**
   * Vérifier l'inscription à un cours et inscrire automatiquement si gratuit
   */
  static async checkAndEnrollIfFree(courseId: string): Promise<{
    enrolled: boolean;
    isFree: boolean;
    paymentRequired: boolean;
    paymentUrl?: string;
  }> {
    console.log(`🔍 API: Vérification d'inscription pour le cours ${courseId}`);

    try {
      // ✅ Vérifier si l'utilisateur est un admin (accès automatique)
      const accessToken = Cookies.get("access_token");
      if (accessToken) {
        try {
          const payload = JSON.parse(
            base64UrlDecode(accessToken.split(".")[1]),
          );
          const userRole = payload.role;

          if (userRole === "ADMIN") {
            console.log("👑 Admin détecté - Accès automatique au cours");
            return {
              enrolled: true,
              isFree: true,
              paymentRequired: false,
            };
          }
        } catch (err) {
          console.error("❌ Erreur extraction rôle depuis token:", err);
          // Continue avec la vérification normale
        }
      }

      // D'abord, vérifier si l'utilisateur est déjà inscrit
      const enrolledResponse = await fetch(
        buildApiUrl(API_ENDPOINTS.COURSES.PROGRESS(courseId)),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (enrolledResponse.ok) {
        console.log("✅ Utilisateur déjà inscrit au cours");
        return {
          enrolled: true,
          isFree: false, // Peu importe, il est déjà inscrit
          paymentRequired: false,
        };
      }

      // Si pas inscrit, récupérer les détails du cours pour vérifier s'il est gratuit
      const courseDetails = await this.getCourseDetails(courseId);
      const isFree =
        courseDetails.course.price === 0 ||
        courseDetails.course.price === undefined;

      if (isFree) {
        console.log("💰 Cours gratuit détecté, inscription automatique");

        // Tenter l'inscription automatique
        const enrollResponse = await fetch(
          buildApiUrl(API_ENDPOINTS.COURSES.FOLLOW(courseId)),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          },
        );

        if (enrollResponse.ok) {
          console.log("✅ Inscription automatique réussie");
          return {
            enrolled: true,
            isFree: true,
            paymentRequired: false,
          };
        } else {
          console.error("❌ Échec de l'inscription automatique");
          return {
            enrolled: false,
            isFree: true,
            paymentRequired: false,
          };
        }
      } else {
        console.log("💳 Cours payant détecté, redirection paiement");

        // Pour les cours payants, obtenir l'URL de paiement
        const followResponse = await fetch(
          buildApiUrl(API_ENDPOINTS.COURSES.FOLLOW(courseId)),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          },
        );

        if (followResponse.ok) {
          const followData = await followResponse.json();
          return {
            enrolled: false,
            isFree: false,
            paymentRequired: true,
            paymentUrl: followData.payment_url,
          };
        } else {
          console.error("❌ Impossible d'obtenir l'URL de paiement");
          return {
            enrolled: false,
            isFree: false,
            paymentRequired: true,
          };
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la vérification d'inscription:", error);
      return {
        enrolled: false,
        isFree: false,
        paymentRequired: false,
      };
    }
  }

  /**
   * Met à jour le statut d'un cours
   */
  static async updateCourseStatus(
    courseId: string,
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  ): Promise<any> {
    console.log(
      `🔄 API: Mise à jour du statut du cours ${courseId} vers ${status}`,
    );

    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.COURSES.UPDATE_STATUS(courseId)),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Erreur lors de la mise à jour du statut: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log("✅ Statut mis à jour:", data);
    return data;
  }

  /**
   * Supprime un cours
   */
  static async deleteCourse(courseId: string): Promise<any> {
    console.log(`🗑️ API: Suppression du cours ${courseId}`);

    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.COURSES.DELETE(courseId)}`),
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Créer une erreur avec le code pour pouvoir le détecter côté frontend
      const error = new Error(
        errorData.error?.message ||
          errorData.message ||
          `Erreur lors de la suppression: ${response.status}`,
      );
      (error as any).code = errorData.error?.code || errorData.code;
      (error as any).timestamp = errorData.error?.timestamp;
      (error as any).path = errorData.error?.path;
      throw error;
    }

    const data = await response.json();
    console.log("✅ Cours supprimé:", data);
    return data;
  }

  /**
   * Upload une vidéo pour une leçon spécifique
   */
  static async uploadLessonVideo(
    lessonId: string,
    videoFile: File,
  ): Promise<any> {
    console.log(`🎥 API: Upload de vidéo pour la leçon ${lessonId}`);

    const formData = new FormData();
    formData.append("video", videoFile);

    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.LESSONS.UPLOAD_VIDEO(lessonId)),
      {
        method: "PUT",
        credentials: "include",
        body: formData,
      },
    );

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;

      try {
        const errorData = await response.json();
        console.error("❌ [CoursesApi] Erreur upload vidéo:", errorData);
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch (err) {
        console.error("❌ [CoursesApi] Impossible de parser l'erreur");
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("✅ [CoursesApi] Vidéo uploadée:", responseData);

    return responseData;
  }

  /**
   * Ajoute un nouveau module à un cours existant
   * Endpoint: POST /course/course/{courseId}/modules
   * Format: {"modules": [{"title": ..., "orderIndex": ..., "description": ..., "lessons": [...], "quizzes": [...]}]}
   */
  static async addModuleToCourse(
    courseId: string,
    moduleData: { 
      title: string; 
      description: string; 
      order?: number;
      lessons?: Array<{
        tempId: string;
        title: string;
        content: string;
        orderIndex: number;
        duration: number;
      }>;
      quizzes?: Array<{
        title: string;
        description?: string;
        passingScore?: number;
        questions?: Array<{
          question: string;
          questionType?: string;
          options?: string[];
          correctAnswer?: string;
          points?: number;
        }>;
      }>;
    },
  ): Promise<any> {
    console.log(`🔄 API: Ajout d'un module au cours ${courseId}`);

    const formData = new FormData();
    
    // Format exact attendu par le backend: {"modules": [...]}
    const moduleJsonData = {
      modules: [{
        title: moduleData.title,
        orderIndex: moduleData.order || 0,
        description: moduleData.description || "",
        lessons: moduleData.lessons || [],
        quizzes: moduleData.quizzes || [],
      }]
    };
    
    // Le backend attend {"data": "{"modules": [...]}"}
    formData.append("data", JSON.stringify(moduleJsonData));
    console.log("📦 [CoursesApi] Données module:", JSON.stringify(moduleJsonData, null, 2));
    
    const response = await fetch(
      buildApiUrl(`/course/course/${courseId}/modules`),
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );
    
    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error("❌ [CoursesApi] Erreur ajout module:", errorData);
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch (err) {
        console.error("❌ [CoursesApi] Impossible de parser l'erreur");
      }
      
      throw new Error(errorMessage);
    }
    
    const responseData = await response.json();
    console.log("✅ [CoursesApi] Module ajouté:", responseData);
    
    return responseData;
  }

  /**
   * Ajoute de nouvelles leçons à un module existant
   * Endpoint: POST /course/module/{moduleId}/lessons
   */
  static async addLessonsToModule(
    moduleId: string,
    lessons: Array<{
      tempId: string;
      title: string;
      content: string;
      duration?: number;
      videoFile?: File;
      orderIndex: number; // Calculé côté frontend
    }>,
  ): Promise<{
    message: string;
    lessonsAdded: number;
    lessons: Array<{
      id: string;
      title: string;
      orderIndex: number;
      status: string;
    }>;
  }> {
    console.log(`🎓 API: Ajout de ${lessons.length} leçon(s) au module ${moduleId}`);

    const formData = new FormData();

    // Préparer les données des leçons AVEC orderIndex
    const lessonsData = lessons.map((lesson) => ({
      tempId: lesson.tempId,
      title: lesson.title,
      content: lesson.content,
      orderIndex: lesson.orderIndex, // Envoyé par le frontend
      ...(lesson.duration && { duration: lesson.duration }),
    }));

    // Ajouter le JSON des leçons
    formData.append("data", JSON.stringify({ lessons: lessonsData }));
    console.log("📦 [CoursesApi] Données leçons:", JSON.stringify(lessonsData, null, 2));

    // Ajouter les vidéos avec leur tempId
    let videoCount = 0;
    lessons.forEach((lesson) => {
      if (lesson.videoFile) {
        formData.append(`lessonVideos[${lesson.tempId}]`, lesson.videoFile);
        videoCount++;
        console.log(`🎥 [CoursesApi] Vidéo ajoutée pour ${lesson.tempId}: ${lesson.videoFile.name}`);
      }
    });
    console.log(`📹 [CoursesApi] Total vidéos: ${videoCount}`);

    const url = buildApiUrl(API_ENDPOINTS.MODULES.ADD_LESSONS(moduleId));
    console.log("📡 [CoursesApi] URL:", url);

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      body: formData,
      // ⚠️ NE PAS définir Content-Type - laisse le navigateur le faire pour multipart/form-data
    });

    console.log(
      "📡 [CoursesApi] Statut réponse:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;

      try {
        const errorData = await response.json();
        console.error("❌ [CoursesApi] Erreur backend:", errorData);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch (err) {
        console.error("❌ [CoursesApi] Impossible de parser l'erreur");
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("✅ [CoursesApi] Leçons ajoutées:", responseData);

    return responseData;
  }

  /**
   * Met à jour les leçons d'un module
   */
  static async updateModuleLessons(
    moduleId: string,
    lessons: Lesson[],
  ): Promise<any> {
    console.log(`🔄 API: Mise à jour des leçons du module ${moduleId}`);
    
    const formData = new FormData();
    
    const lessonsData = lessons.map((lesson) => ({
      id: lesson.id || undefined,
      tempId: lesson.tempId || undefined,
      title: lesson.title,
      content: lesson.content || "",
      orderIndex: lesson.orderIndex,
      duration: lesson.duration || 0,
    }));
    
    const moduleData = {
      lessons: lessonsData,
    };
    
    formData.append("data", JSON.stringify(moduleData));
    
    // Ajouter les vidéos
    let videoCount = 0;
    lessons.forEach((lesson) => {
      if (lesson.videoFile) {
        const videoKey = `lessonVideos[${lesson.tempId || lesson.id}]`;
        formData.append(videoKey, lesson.videoFile);
        videoCount++;
        console.log(`🎥 API: Vidéo ajoutée: ${videoKey}`);
      }
    });
    console.log(`📹 API: Total vidéos: ${videoCount}`);
    
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.MODULES.UPDATE(moduleId)),
      {
        method: "PUT",
        credentials: "include",
        body: formData,
      },
    );
    
    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error("❌ [CoursesApi] Erreur mise à jour leçons:", errorData);
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch (err) {
        console.error("❌ [CoursesApi] Impossible de parser l'erreur");
      }
      
      throw new Error(errorMessage);
    }
    
    const responseData = await response.json();
    console.log("✅ [CoursesApi] Leçons mises à jour:", responseData);
    
    return responseData;
  }

  /**
   * Met à jour une leçon spécifique
   * Endpoint: PUT /course/lesson/{lessonId}
   * Body: {title, content, duration}
   */
  static async updateLesson(
    lessonId: string,
    lessonData: {
      title: string;
      content: string;
      duration: number;
    },
  ): Promise<{ message: string }> {
    console.log(`🔄 [CoursesApi] Mise à jour de la leçon ${lessonId}`);
    console.log("📦 [CoursesApi] Données:", lessonData);

    const response = await fetch(
      buildApiUrl(`/course/lesson/${lessonId}`),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(lessonData),
      },
    );

    console.log(
      "📡 [CoursesApi] Statut réponse:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;

      try {
        const errorData = await response.json();
        console.error("❌ [CoursesApi] Erreur mise à jour leçon:", errorData);
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch (err) {
        console.error("❌ [CoursesApi] Impossible de parser l'erreur");
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("✅ [CoursesApi] Leçon mise à jour:", responseData);

    return responseData;
  }

  /**
   * Met à jour un module spécifique
   * Endpoint: PUT /course/module/{moduleId}
   * Format: multipart/form-data avec champ "data" (JSON stringifié)
   */
  static async updateModule(
    moduleId: string,
    moduleData: {
      title?: string;
      description?: string;
    },
  ): Promise<{
    message: string;
    module: {
      id: string;
      title: string;
      description: string;
      orderIndex: number;
    };
  }> {
    console.log(`🔄 [CoursesApi] Mise à jour du module ${moduleId}`);
    console.log("📦 [CoursesApi] Données:", moduleData);

    const formData = new FormData();

    // Le backend attend {"data": "{"title": "...", "description": "..."}"}
    formData.append("data", JSON.stringify(moduleData));
    console.log("📦 [CoursesApi] JSON data:", JSON.stringify(moduleData, null, 2));

    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.MODULES.UPDATE_MODULE(moduleId)),
      {
        method: "PUT",
        credentials: "include",
        body: formData,
        // ⚠️ NE PAS définir Content-Type - laisse le navigateur le faire pour multipart/form-data
      },
    );

    console.log(
      "📡 [CoursesApi] Statut réponse:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;

      try {
        const errorData = await response.json();
        console.error("❌ [CoursesApi] Erreur mise à jour module:", errorData);
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch (err) {
        console.error("❌ [CoursesApi] Impossible de parser l'erreur");
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("✅ [CoursesApi] Module mis à jour:", responseData);

    return responseData;
  }

  /**
   * Supprime une leçon spécifique
   * Endpoint: DELETE /course/lesson/{lessonId}
   */
  static async deleteLesson(lessonId: string): Promise<{ message: string }> {
    console.log(`🗑️ [CoursesApi] Suppression de la leçon ${lessonId}`);

    const response = await fetch(
      buildApiUrl(`/course/lesson/${lessonId}`),
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;

      try {
        const errorData = await response.json();
        console.error("❌ [CoursesApi] Erreur suppression leçon:", errorData);
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch (err) {
        console.error("❌ [CoursesApi] Impossible de parser l'erreur");
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("✅ [CoursesApi] Leçon supprimée:", responseData);

    return responseData;
  }

  /**
   * Supprime un module spécifique
   * Endpoint: DELETE /course/module/{moduleId}
   */
  static async deleteModule(moduleId: string): Promise<{ message: string }> {
    console.log(`🗑️ [CoursesApi] Suppression du module ${moduleId}`);

    const response = await fetch(
      buildApiUrl(`/course/module/${moduleId}`),
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;

      try {
        const errorData = await response.json();
        console.error("❌ [CoursesApi] Erreur suppression module:", errorData);
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch (err) {
        console.error("❌ [CoursesApi] Impossible de parser l'erreur");
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("✅ [CoursesApi] Module supprimé:", responseData);

    return responseData;
  }
}

