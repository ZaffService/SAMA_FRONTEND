// src/infrastructure/api/enrollment-api.ts

export interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  progressPercentage: number;
  status: "ACTIVE" | "COMPLETED";
  enrollmentDate: string;
  completionDate?: string;
}

export interface EnrolledCoursesResponse {
  courses: EnrolledCourse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EnrollmentRequest {
  courseId: string;
  userId: string;
}

export interface EnrollmentResponse {
  success: boolean;
  message: string;
  enrollmentId?: string;
}

export interface PaymentInfo {
  amount: number;
  method: string;
  courseId: string;
}

export class EnrollmentApi {
  private static readonly BASE_URL = "http://localhost:3006";

  /**
   * Récupérer les cours auxquels l'étudiant est inscrit
   */
  static async getEnrolledCourses(
    page: number = 1,
    limit: number = 10,
  ): Promise<EnrolledCoursesResponse> {
    try {
      console.log(
        `📤 [ENROLLMENT-API] Récupération des cours inscrits (page ${page})...`,
      );

      const response = await fetch(
        `${this.BASE_URL}/course/enrolled?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // ✅ IMPORTANT : Envoyer les cookies
        },
      );

      if (!response.ok) {
        console.error("❌ [ENROLLMENT-API] Erreur:", response.status);
        throw new Error("Impossible de récupérer les cours");
      }

      const data = await response.json();
      console.log(`✅ [ENROLLMENT-API] ${data.total} cours récupérés`);

      return data;
    } catch (error) {
      console.error("❌ [ENROLLMENT-API] Exception:", error);
      throw error;
    }
  }

  static async enrollInCourse(
    request: EnrollmentRequest,
  ): Promise<EnrollmentResponse> {
    // TODO: Implement enrollment
    return { success: false, message: "Not implemented" };
  }

  static async unenrollFromCourse(
    courseId: number,
  ): Promise<{ success: boolean; message: string }> {
    // TODO: Implement unenrollment
    return { success: false, message: "Not implemented" };
  }

  static async getEnrollmentStatus(courseId: number): Promise<{
    enrolled: boolean;
    enrollment_date?: string;
    progress?: number;
    status?: "active" | "completed" | "cancelled";
  }> {
    // TODO: Implement status check
    return { enrolled: false };
  }

  static async processPayment(paymentInfo: PaymentInfo): Promise<{
    success: boolean;
    transaction_id: string;
    message: string;
  }> {
    // TODO: Implement payment processing
    return { success: false, transaction_id: "", message: "Not implemented" };
  }

  static async getPaymentMethods(): Promise<
    Array<{
      id: string;
      name: string;
      type: "card" | "bank_transfer" | "mobile_money";
      enabled: boolean;
    }>
  > {
    // TODO: Implement payment methods
    return [];
  }

  static async getEnrollmentHistory(): Promise<
    Array<{
      id: number;
      course_id: number;
      course_title: string;
      enrollment_date: string;
      status: string;
      progress: number;
    }>
  > {
    // TODO: Implement history
    return [];
  }
}
