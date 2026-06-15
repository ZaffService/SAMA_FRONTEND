export interface User {
  id: number | string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
  createdAt: string;
  telephone?: string;
  indicatif?: string;
  isProfileComplete?: boolean;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  username?: string;
  displayName?: string;
  display_name?: string;
  roles?: string[];
  avatar?: string;
  avatar_url?: string;
  isEmailVerified?: boolean;
}

export interface LastActivity {
  courseId: string;
  lessonId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "in_progress" | "completed";
  redirectTo: string;
  courseTitle?: string;
  lessonTitle?: string;
}

export interface LoginData {
  username?: string;
  email?: string;
  telephone?: string;
  indicatif?: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResponse {
  success?: boolean;
  user: User;
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  lastActivity?: LastActivity;
  code?: string;
  message?: string;
}
