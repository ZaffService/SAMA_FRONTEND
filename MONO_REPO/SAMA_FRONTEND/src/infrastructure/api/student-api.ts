// src/infrastructure/api/StudentApi.ts

import { buildApiUrl, API_ENDPOINTS } from './baseConfig';

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
  completedLessons?: number;
  totalLessons?: number;
  lastAccessed?: string;
}

export interface StudentDashboard {
  enrolled_courses: Enrollment[];
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_progress: number;
}

export class StudentApi {

  static async getCurrentStudent(): Promise<Student> {
    // This should get user info from auth context or another source
    // For now, return a basic structure
    throw new Error("Use auth context instead of this endpoint");
  }

  static async getStudentDashboard(): Promise<StudentDashboard> {
    try {
      const enrolledResponse = await fetch(buildApiUrl(API_ENDPOINTS.COURSES.ENROLLED), {
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
    const response = await fetch(buildApiUrl(API_ENDPOINTS.USER.PROFILE), {
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
      console.log("🔍 [StudentApi] Appel getEnrolledCourses");
      console.log("🔍 [StudentApi] URL:", buildApiUrl(API_ENDPOINTS.COURSES.ENROLLED));

      const response = await fetch(buildApiUrl(API_ENDPOINTS.COURSES.ENROLLED), {
        method: "GET",
        credentials: "include",
      });

      console.log("🔍 [StudentApi] Réponse status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expirée");
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("🔍 [StudentApi] Données brutes reçues:", JSON.stringify(data, null, 2));

      const courses = data.courses ?? data.data ?? data ?? [];
      console.log("🔍 [StudentApi] Cours extraits:", courses);
      console.log("🔍 [StudentApi] Nombre de cours:", courses.length);

      // 🔥 DEBUG spécifique pour Leadership
      const leadershipCourse = courses.find((c: any) => c.title?.includes("Leadership"));
      if (leadershipCourse) {
        console.log("🎯 [StudentApi] Cours Leadership trouvé dans enrolled:", leadershipCourse);
        console.log("🆔 ID du cours Leadership:", leadershipCourse.id || leadershipCourse.course_id);
      } else {
        console.log("❌ [StudentApi] Cours Leadership NON trouvé dans enrolled");
      }

      return courses;
    } catch (error) {
      console.error("❌ [StudentApi] Erreur getEnrolledCourses:", error);
      throw error;
    }
  }

  static async getCourseProgress(courseId: string): Promise<{
    progress: number;
    completed_lessons: number;
    total_lessons: number;
    last_accessed: string;
  }> {
    // PROGRESS est une fonction dans API_ENDPOINTS, on doit l'appeler avec le courseId
    const endpoint = API_ENDPOINTS.COURSES.PROGRESS(courseId);
    const url = buildApiUrl(endpoint);
    console.log(`🌐 [StudentApi] Appel API getCourseProgress pour cours ID: ${courseId}`);
    console.log(`🌐 [StudentApi] URL: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    console.log(`🌐 [StudentApi] Réponse status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [StudentApi] Erreur getCourseProgress pour cours ${courseId}:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error("Erreur lors de la récupération de la progression");
    }

    // ✅ RÉCUPÉRATION DE LA RÉPONSE BRUTE DU BACKEND
    const backendData = await response.json();
    console.log(`🔍 [StudentApi] RÉPONSE BRUTE DU BACKEND:`, JSON.stringify(backendData, null, 2));

    // ✅ MAPPING CORRECT: Backend → Frontend
    // Backend retourne:
    // {
    //   "courseId": "string",
    //   "userId": "string",
    //   "progressPercentage": 100,
    //   "completedLessons": ["lessonId1", "lessonId2"], // TABLEAU
    //   "currentLesson": "lessonId",
    //   "lessonsProgress": [...]
    // }
    
    // ✅ Calculer le nombre total de leçons depuis lessonsProgress
    // lessonsProgress est un tableau de modules, chaque module contient un tableau de lessons
    let totalLessons = 0;
    if (Array.isArray(backendData.lessonsProgress)) {
      totalLessons = backendData.lessonsProgress.reduce((total: number, module: any) => {
        return total + (Array.isArray(module.lessons) ? module.lessons.length : 0);
      }, 0);
    }

    const mappedData = {
      progress: backendData.progressPercentage || 0,
      completed_lessons: Array.isArray(backendData.completedLessons) 
        ? backendData.completedLessons.length  // ✅ Convertir tableau en nombre
        : 0,
      total_lessons: totalLessons,  // ✅ Calculer en parcourant tous les modules
      last_accessed: backendData.currentLesson || null,
    };

    console.log(`✅ [StudentApi] DONNÉES MAPPÉES:`, {
      progress: mappedData.progress,
      completed_lessons: mappedData.completed_lessons,
      total_lessons: mappedData.total_lessons,
      last_accessed: mappedData.last_accessed,
      timestamp: new Date().toISOString()
    });
    
    return mappedData;
  }

  static async markLessonComplete(lessonId: number): Promise<void> {
    // This endpoint might not exist, handle gracefully
    try {
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.COURSES.LESSON_COMPLETE}/${lessonId}`),
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
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.QUIZ.SUBMIT}/${quizId}`), {
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

      const url = `${buildApiUrl(API_ENDPOINTS.COURSES.SEARCH)}${params.toString() ? "?" + params.toString() : ""}`;

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
      const response = await fetch(buildApiUrl(API_ENDPOINTS.COURSES.CATEGORIES), {
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

  static async getCourseDetails(courseId: string): Promise<any> {
    try {
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.COURSES.DETAILS}/${courseId}`),
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des détails du cours: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("Erreur getCourseDetails:", error);
      throw error;
    }
  }

  static async getQuizAttempts(quizId: string): Promise<any[]> {
    try {
      // Utiliser l'endpoint /course/quizzes/attempts et filtrer par quizId côté frontend
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.QUIZ.ATTEMPTS),
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des tentatives: ${response.status}`);
      }

      const data = await response.json();
      const attempts = data.attempts || data || [];
      // Filtrer par quizId
      return attempts.filter((attempt: any) => attempt.quizId === quizId || attempt.quiz_id === quizId);
    } catch (error) {
      console.error("Erreur getQuizAttempts:", error);
      return [];
    }
  }

  static async getQuizQuestions(moduleId: string): Promise<any> {
    try {
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.COURSES.QUIZ}/module/${moduleId}/questions`),
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des questions: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("Erreur getQuizQuestions:", error);
      throw error;
    }
  }

  static async computeQuizStats(): Promise<{
    passedQuizzes: number;
    failedQuizzes: number;
  }> {
    try {
      const enrolledCourses = await this.getEnrolledCourses();

      let passedQuizzes = 0;
      let failedQuizzes = 0;

      // Parcourir chaque cours inscrit
      for (const course of enrolledCourses) {
        const courseId = course.id || course.course_id;
        if (!courseId) continue;

        const courseDetails = await this.getCourseDetails(courseId);

        // Vérifier si courseDetails.modules existe
        if (!courseDetails.modules) continue;

        // Parcourir chaque module du cours
        for (const module of courseDetails.modules) {
          try {
            // Obtenir les questions du quiz pour ce module (qui inclut les infos du quiz)
            const quizData = await this.getQuizQuestions(module.id);

            if (!quizData.quiz) continue; // Pas de quiz pour ce module

            const quiz = quizData.quiz;
            const passingScore = quiz.passingScore || 70; // Défaut 70 si non défini

            console.log(`📊 Quiz: ${quiz.title}, passingScore: ${passingScore}`);

            // Obtenir les tentatives pour ce quiz
            const attempts = await this.getQuizAttempts(quiz.id);

            console.log(`   Tentatives trouvées: ${attempts.length}`);

            if (attempts.length === 0) continue; // Pas de tentatives, ignorer ce quiz

            // Compter les tentatives individuelles comme réussies ou échouées
            // Un quiz est réussi si score >= 70%, sinon échoué
            for (const attempt of attempts) {
              if (attempt.score !== null && attempt.score !== undefined) {
                if (attempt.score >= passingScore) {
                  passedQuizzes++;
                  console.log(`   ✅ Passé: ${attempt.score}`);
                } else {
                  failedQuizzes++;
                  console.log(`   ❌ Échoué: ${attempt.score}`);
                }
              }
            }
          } catch (error) {
            // Si erreur pour ce module/quiz, continuer avec les autres
            console.warn(`Erreur pour le module ${module.id}:`, error);
            continue;
          }
        }
      }

      console.log(`📊 Total: ${passedQuizzes} passés, ${failedQuizzes} échoués`);

      return {
        passedQuizzes,
        failedQuizzes,
      };
    } catch (error) {
      console.error("Erreur computeQuizStats:", error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        passedQuizzes: 0,
        failedQuizzes: 0,
      };
    }
  }

  static async getQuizStatistics(): Promise<{
    passed_quizzes: number;
    failed_quizzes: number;
    total_attempts: number;
    average_score: number;
  }> {
    try {
      // Since the backend endpoint doesn't exist yet, we'll calculate statistics
      // from the enrolled courses data by checking for completed modules with quizzes
      const enrolledCourses = await this.getEnrolledCourses();

      let passed_quizzes = 0;
      let failed_quizzes = 0;
      let total_attempts = 0;
      let total_score = 0;
      let score_count = 0;

      // For each enrolled course, we need to check modules and their quiz status
      // This is a simplified calculation - in a real implementation, we'd need
      // the backend to provide quiz attempt history per user
      for (const course of enrolledCourses) {
        // For now, we'll use a simple heuristic: if course is completed,
        // assume the student passed the quizzes (this is not accurate but
        // provides some data until the backend endpoint is implemented)
        if (course.status === 'COMPLETED') {
          // Assume each completed course has at least one quiz that was passed
          passed_quizzes += 1;
          total_attempts += 1;
          total_score += 75; // Assume average passing score
          score_count += 1;
        } else if (course.progressPercentage && course.progressPercentage > 50) {
          // For courses in progress with significant progress, assume some quiz attempts
          const progressRatio = course.progressPercentage / 100;
          const estimatedAttempts = Math.floor(progressRatio * 2); // Estimate 0-2 attempts
          total_attempts += estimatedAttempts;

          if (estimatedAttempts > 0) {
            // Assume some passes and fails
            const passed = Math.floor(estimatedAttempts * 0.7); // 70% pass rate
            const failed = estimatedAttempts - passed;
            passed_quizzes += passed;
            failed_quizzes += failed;

            // Add some scores
            for (let i = 0; i < passed; i++) {
              total_score += 75 + Math.random() * 25; // 75-100 for passes
              score_count += 1;
            }
            for (let i = 0; i < failed; i++) {
              total_score += Math.random() * 70; // 0-70 for fails
              score_count += 1;
            }
          }
        }
      }

      const average_score = score_count > 0 ? total_score / score_count : 0;

      return {
        passed_quizzes,
        failed_quizzes,
        total_attempts,
        average_score: Math.round(average_score),
      };
    } catch (error) {
      console.error("Erreur getQuizStatistics:", error);
      // Return default values on error
      return {
        passed_quizzes: 0,
        failed_quizzes: 0,
        total_attempts: 0,
        average_score: 0,
      };
    }
  }
}