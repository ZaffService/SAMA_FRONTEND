import { AuthApi } from "@/infrastructure/api/auth-api";
import { UserApi, type CreateUserData, type User as ApiUser } from "@/infrastructure/api/user-api";
import type { LoginData, AuthResponse } from "@/domain/entities/user";
import type { RegisterData } from "@/types/auth";
import type { User } from "@/domain/entities/user";

export class AuthUseCases {
  static async login(credentials: LoginData): Promise<AuthResponse> {
    return AuthApi.login(credentials);
  }

  static async register(userData: RegisterData): Promise<User> {
    return AuthApi.register(userData);
  }

  static async logout(): Promise<void> {
    return AuthApi.logout();
  }

  static async getCurrentUser(): Promise<any> {
    return AuthApi.validateSession();
  }

  static async refreshToken(): Promise<boolean> {
    return AuthApi.refreshToken();
  }

  static getGoogleAuthUrl(): string {
    return AuthApi.getGoogleAuthUrl();
  }

  static async adminCreateUser(data: CreateUserData): Promise<ApiUser> {
    return UserApi.adminCreateUser(data);
  }
}
