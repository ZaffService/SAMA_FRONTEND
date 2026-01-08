import {
  EnrollmentApi,
  EnrollmentRequest,
  EnrollmentResponse,
  PaymentInfo,
} from "@/infrastructure/api/enrollment-api";

export class EnrollmentUseCases {
  static async enrollInCourse(
    request: EnrollmentRequest,
  ): Promise<EnrollmentResponse> {
    return EnrollmentApi.enrollInCourse(request);
  }

  static async unenrollFromCourse(
    courseId: number,
  ): Promise<{ success: boolean; message: string }> {
    return EnrollmentApi.unenrollFromCourse(courseId);
  }

  static async getEnrollmentStatus(courseId: number): Promise<{
    enrolled: boolean;
    enrollment_date?: string;
    progress?: number;
    status?: "active" | "completed" | "cancelled";
  }> {
    return EnrollmentApi.getEnrollmentStatus(courseId);
  }

  static async processPayment(paymentInfo: PaymentInfo): Promise<{
    success: boolean;
    transaction_id: string;
    message: string;
  }> {
    return EnrollmentApi.processPayment(paymentInfo);
  }

  static async getPaymentMethods(): Promise<
    Array<{
      id: string;
      name: string;
      type: "card" | "bank_transfer" | "mobile_money";
      enabled: boolean;
    }>
  > {
    return EnrollmentApi.getPaymentMethods();
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
    return EnrollmentApi.getEnrollmentHistory();
  }
}
