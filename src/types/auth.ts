import type { User, LastActivity } from "@/domain/entities/user";

export interface AuthLoginResult {
  success: boolean;
  redirectUrl?: string;
  lastActivity?: LastActivity;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  telephone?: string;
  indicatif?: string;
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
  ) => Promise<AuthLoginResult>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<AuthLoginResult>;
  logout: () => Promise<void>;
  canAccessCourse: (courseId: number, isPaid: boolean) => boolean;
  redirectAfterLogin: string | null;
  setRedirectAfterLogin: (url: string | null) => void;
  setProfileComplete: (complete: boolean) => void;
}
