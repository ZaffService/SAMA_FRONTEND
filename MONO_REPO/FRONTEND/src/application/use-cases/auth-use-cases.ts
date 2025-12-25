import { AuthApi } from "@/infrastructure/api/auth-api";
import type {
  LoginData,
  RegisterData,
  AuthResponse,
} from "@/domain/entities/user";

export class AuthUseCases {
  static async login(credentials: LoginData): Promise<AuthResponse> {
    return AuthApi.login(credentials);
  }

  static async register(userData: RegisterData): Promise<AuthResponse> {
    return AuthApi.register(userData);
  }

  static async logout(): Promise<void> {
    return AuthApi.logout();
  }

  static async getCurrentUser(): Promise<any> {
    return AuthApi.getCurrentUser();
  }

  static async refreshToken(): Promise<boolean> {
    return AuthApi.refreshToken();
  }

  static getGoogleAuthUrl(): string {
    return AuthApi.getGoogleAuthUrl();
  }
}
