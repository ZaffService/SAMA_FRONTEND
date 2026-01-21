import type { User } from "@/domain/entities/user";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; redirectUrl?: string }>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  canAccessCourse: (courseId: number, isPaid: boolean) => boolean;
  redirectAfterLogin: string | null;
  setRedirectAfterLogin: (url: string | null) => void;
  setProfileComplete: (complete: boolean) => void;
}
