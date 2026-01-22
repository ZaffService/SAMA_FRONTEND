import type { Course, CourseDetails } from "@/domain/entities/course";
import type { Module, Lesson } from "@/domain/entities/module";
import Cookies from "js-cookie";

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

interface BackendCourse {
  courseId?: string;
  id?: string;
  _id?: string;
  title?: string;
  _title?: string;
  description?: string;
  _description?: string;
  thumbnailUrl?: string;
  _thumbnailUrl?: string;
  price?: number;
  _price?: number;
  duration?: string;
  _duration?: string;
  level?: string;
  _level?: string;
  category?: any;
  categoryId?: string;
  _category?: any;
  instructor?: any;
  _instructor?: any;
  _enrollments?: any[];
  enrollments?: any[];
  rating?: number;
  _rating?: number;
  _tags?: string[];
  tags?: string[];
  _status?: string;
  status?: string;
  _attachment?: string;
  attachment?: string;
  _createdAt?: string;
  createdAt?: string;
  _updatedAt?: string;
  updatedAt?: string;
  _modules?: any[];
  modules?: any[];
  lessons?: any[];
  _quizzes?: any[];
  quizzes?: any[];
}

interface CourseDetailsResponse {
  course: {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    level: string;
    price: number;
    thumbnailUrl?: string;
    isFree?: boolean;
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
      videoUrl?: string;
      orderIndex: number;
      duration: number;
      status: string;
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
    courses: Course[];
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

    const data = await response.json();

    console.log(
      "🔍 API getAdminCourses - Données brutes:",
      JSON.stringify(data, null, 2),
    );

    const courses = (data.courses || []).map((backendCourse: BackendCourse) =>
      this.mapBackendCourseToFrontend(backendCourse),
    );

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
    courses: Course[];
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

    const courses = (data.courses || []).map((backendCourse: BackendCourse) =>
      this.mapBackendCourseToFrontend(backendCourse),
    );

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
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  ): Promise<any> {
    console.log(`🔄 API: Mise à jour du statut du cours ${courseId} vers ${status}`);

    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.COURSES.UPDATE_STATUS(courseId)),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Erreur lors de la mise à jour du statut: ${response.status}`
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
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Erreur lors de la suppression: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ Cours supprimé:", data);
    return data;
  }

  /**
   * Mapper pour les cours de la liste (léger)
   */
  private static mapBackendCourseToFrontend(
    backendCourse: BackendCourse,
  ): Course {
    // ✅ CORRECTION: Utiliser id du backend (comme retourné par l'API)
    const id =
      backendCourse.id || backendCourse.courseId || backendCourse._id || "";

    const title = backendCourse.title || backendCourse._title || "";
    const description =
      backendCourse.description || backendCourse._description || "";

    const thumbnailUrl =
      backendCourse.thumbnailUrl ||
      backendCourse._thumbnailUrl ||
      "/Fallback.png";

    // ✅ Extraction du categoryId pour le filtrage
    const categoryId =
      backendCourse.categoryId ||
      backendCourse._category?.id ||
      backendCourse._category?._id;

    const category =
      backendCourse._category?._name ||
      backendCourse._category?.name ||
      backendCourse.category ||
      "Non catégorisé";

    return {
      id,
      title,
      content: description,
      category,
      categoryId, // ✅ Ajout du categoryId pour le filtrage
      thumbnailUrl,
      thumbnail: thumbnailUrl,
      price: backendCourse.price ?? backendCourse._price ?? 0,
      duration: backendCourse.duration || backendCourse._duration,
      instructor: {
        id: backendCourse._instructor?._id || backendCourse.instructor?.id,
        name: backendCourse._instructor
          ? `${backendCourse._instructor._firstName || ""} ${backendCourse._instructor._lastName || ""}`.trim()
          : "Instructeur",
        firstName: backendCourse._instructor?._firstName,
        lastName: backendCourse._instructor?._lastName,
        email: backendCourse._instructor?._email,
        role: backendCourse._instructor?._role,
      },
      studentsCount:
        backendCourse._enrollments?.length ||
        backendCourse.enrollments?.length ||
        0,
      rating: backendCourse.rating ?? backendCourse._rating ?? 0,
      level: backendCourse.level || backendCourse._level || "BEGINNER",
      description,
      tags: backendCourse._tags || backendCourse.tags || [],
      status: (backendCourse._status || backendCourse.status) as
        | "DRAFT"
        | "PUBLISHED"
        | "ARCHIVED"
        | undefined,
      attachment: backendCourse._attachment || backendCourse.attachment,
      createdAt: backendCourse._createdAt || backendCourse.createdAt,
      updatedAt: backendCourse._updatedAt || backendCourse.updatedAt,
      lessons:
        backendCourse._modules ||
        backendCourse.modules ||
        backendCourse.lessons ||
        [],
      quizzes: backendCourse._quizzes || backendCourse.quizzes || [],
    };
  }
}
