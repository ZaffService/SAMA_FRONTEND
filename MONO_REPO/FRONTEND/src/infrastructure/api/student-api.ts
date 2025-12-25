// src/infrastructure/api/StudentApi.ts

export interface Student {
  id: number;
  username: string;
  email: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  region?: string;
  roles: string[];
  avatar?: string;
}

export interface Enrollment {
  id: string;
  course_id?: string;
  student_id?: string;
  enrollment_date?: string;
  status: string;
  progress?: number;
  completed_lessons?: number;
  total_lessons?: number;
  title?: string;
  description?: string;
  instructorName?: string;
  progressPercentage?: number;
  completionDate?: string;
}

export interface StudentDashboard {
  enrolled_courses: Enrollment[];
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_progress: number;
}

export class StudentApi {
  private static readonly BASE_URL = "http://localhost:3006";

  static async getCurrentStudent(): Promise<Student> {
    // This should get user info from auth context or another source
    // For now, return a basic structure
    throw new Error("Use auth context instead of this endpoint");
  }

  static async getStudentDashboard(): Promise<StudentDashboard> {
    try {
      const enrolledResponse = await fetch(`${this.BASE_URL}/course/enrolled`, {
        method: "GET",
        credentials: "include",
      });

      let enrolledCourses: Enrollment[] = [];

      if (enrolledResponse.ok) {
        const enrolledResult = await enrolledResponse.json();
        enrolledCourses =
          enrolledResult.courses || enrolledResult.data || enrolledResult || [];
      }

      // Calculate dashboard data from enrolled courses
      const completedCourses = enrolledCourses.filter(
        (course) =>
          course.status === "COMPLETED" ||
          (course.progressPercentage ?? 0) >= 100,
      ).length;

      const totalProgress =
        enrolledCourses.length > 0
          ? enrolledCourses.reduce(
              (sum, course) => sum + (course.progressPercentage ?? 0),
              0,
            ) / enrolledCourses.length
          : 0;

      return {
        enrolled_courses: enrolledCourses,
        total_courses: enrolledCourses.length,
        completed_courses: completedCourses,
        in_progress_courses: enrolledCourses.length - completedCourses,
        total_progress: Math.round(totalProgress),
      };
    } catch (error) {
      // Return default data on error
      return {
        enrolled_courses: [],
        total_courses: 0,
        completed_courses: 0,
        in_progress_courses: 0,
        total_progress: 0,
      };
    }
  }

  static async updateStudentProfile(data: Partial<Student>): Promise<Student> {
    const response = await fetch(`${this.BASE_URL}/student/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la mise à jour du profil");
    }

    return response.json();
  }

  static async getEnrolledCourses(): Promise<Enrollment[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/course/enrolled`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expirée");
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data.courses ?? data.data ?? data ?? [];
    } catch (error) {
      console.error("Erreur getEnrolledCourses:", error);
      throw error;
    }
  }

  static async getCourseProgress(courseId: number): Promise<{
    progress: number;
    completed_lessons: number;
    total_lessons: number;
    last_accessed: string;
  }> {
    const response = await fetch(
      `${this.BASE_URL}/course/progress/${courseId}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération de la progression");
    }

    return response.json();
  }

  static async markLessonComplete(lessonId: number): Promise<void> {
    // This endpoint might not exist, handle gracefully
    try {
      const response = await fetch(
        `${this.BASE_URL}/course/lessons/${lessonId}/complete`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        console.warn("Lesson completion endpoint not available");
      }
    } catch (error) {
      console.warn("Lesson completion not supported:", error);
    }
  }

  static async submitQuiz(
    quizId: number,
    answers: Record<number, string>,
  ): Promise<{
    score: number;
    total_questions: number;
    correct_answers: number;
    passed: boolean;
  }> {
    const response = await fetch(`${this.BASE_URL}/course/quiz/${quizId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la soumission du quiz");
    }

    return response.json();
  }

  static async getAvailableCourses(options?: {
    page?: number;
    limit?: number;
    query?: string;
    categoryId?: string;
    level?: string;
  }): Promise<{
    courses: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.query) params.append("query", options.query);
      if (options?.categoryId) params.append("categoryId", options.categoryId);
      if (options?.level) params.append("level", options.level);

      const url = `${this.BASE_URL}/course/search${params.toString() ? "?" + params.toString() : ""}`;

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return {
        courses: data.courses || [],
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 10,
        totalPages: data.totalPages || 0,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des cours disponibles:",
        error,
      );
      return {
        courses: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
    }
  }

  static async getCategories(): Promise<
    {
      id: string;
      name: string;
    }[]
  > {
    try {
      const response = await fetch(`${this.BASE_URL}/course/categories`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories:", error);
      return [];
    }
  }
}
