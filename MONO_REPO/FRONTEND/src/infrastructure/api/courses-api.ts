import type { Course, CourseDetails } from "@/domain/entities/course";

interface BackendCourse {
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

export class CoursesApi {
  private static readonly BASE_URL = "http://localhost:3006";

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
  }> {
    // Construire l'URL avec les paramètres de pagination
    const url = new URL(`${this.BASE_URL}/course/search`);
    url.searchParams.append("page", page.toString());
    url.searchParams.append("limit", perPage.toString());

    // Ajouter les paramètres de recherche si fournis
    if (searchOptions?.query) {
      url.searchParams.append("query", searchOptions.query);
    }
    if (searchOptions?.category) {
      url.searchParams.append("category", searchOptions.category);
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
      `${this.BASE_URL}/course/details/${courseId}`,
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
   * Mapper pour les cours de la liste (léger)
   */
  private static mapBackendCourseToFrontend(
    backendCourse: BackendCourse,
  ): Course {
    const id = backendCourse.id || backendCourse._id || "";
    const title = backendCourse.title || backendCourse._title || "";
    const description =
      backendCourse.description || backendCourse._description || "";

    const thumbnailUrl =
      backendCourse.thumbnailUrl ||
      backendCourse._thumbnailUrl ||
      "/Fallback.png";

    return {
      id,
      title,
      content: description,
      category:
        backendCourse._category?._name ||
        backendCourse._category?.name ||
        backendCourse.category ||
        "Non catégorisé",
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
