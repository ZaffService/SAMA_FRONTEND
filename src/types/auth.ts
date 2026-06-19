import type { User, LastActivity, LoginData } from "@/domain/entities/user";

export type AuthPlatform = "web" | "mobile";

export interface PhoneCredentials {
  indicatif: string;
  telephone: string;
}

export interface PhoneLoginData extends PhoneCredentials {
  password: string;
}

/** POST /user/create-account — aligné sur createAccountSchema backend */
export interface WebRegisterPayload extends PhoneCredentials {
  platform: "web";
  password: string;
  firstName: string;
  lastName: string;
}

export interface MobileRegisterPayload extends PhoneCredentials {
  platform: "mobile";
  password: string;
  firstName?: string;
  lastName?: string;
}

export type RegisterPayload = WebRegisterPayload | MobileRegisterPayload;

export interface VerifyPhonePayload extends PhoneCredentials {
  otp: string;
}

export interface AuthLoginResult {
  success: boolean;
  redirectUrl?: string;
  lastActivity?: LastActivity;
}

export interface RegisterData {
  password: string;
  firstName: string;
  lastName: string;
  telephone: string;
  indicatif: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean | null;
  login: (credentials: LoginData) => Promise<AuthLoginResult>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<AuthLoginResult>;
  logout: () => Promise<void>;
  canAccessCourse: (courseId: number, isPaid: boolean) => boolean;
  redirectAfterLogin: string | null;
  setRedirectAfterLogin: (url: string | null) => void;
  setProfileComplete: (complete: boolean) => void;
}
