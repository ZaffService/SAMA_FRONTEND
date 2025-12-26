import type {
  User,
  LoginData,
  RegisterData,
  AuthResponse,
} from "@/domain/entities/user";

export class AuthApi {
  private static readonly BASE_URL = "http://localhost:3006";

  static async login(credentials: LoginData): Promise<AuthResponse> {
    const res = await fetch(`${this.BASE_URL}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    const data = await res.json();

    if (!res.ok) {
      // Propager les codes d'erreur spécifiques
      if (data.error?.code) {
        throw new Error(data.error.code);
      }
      throw new Error(data.message || "Échec de la connexion");
    }

    return data;
  }

  static async register(data: RegisterData): Promise<User> {
    const res = await fetch(`${this.BASE_URL}/user/create-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error((await res.json()).message || "Échec de l'inscription");
    return res.json();
  }

  static async validateSession(): Promise<boolean> {
    try {
      const res = await fetch(`${this.BASE_URL}/user/profile`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  static async logout(): Promise<void> {
    try {
      await fetch(`${this.BASE_URL}/user/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch {}
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const res = await fetch(`${this.BASE_URL}/user/profile`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  static async verifyEmail(token: string): Promise<{ message: string }> {
    const res = await fetch(`${this.BASE_URL}/user/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Échec de la vérification");
    }

    return data;
  }

  static async refreshToken(): Promise<boolean> {
    // TODO: Implement refresh token logic
    return false;
  }

  static async requestPasswordReset(email: string): Promise<{ message: string }> {
    const res = await fetch(`${this.BASE_URL}/user/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Échec de la demande de réinitialisation");
    }

    return data;
  }

  static async resetPassword(token: string, password: string, confirmPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${this.BASE_URL}/user/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Échec de la réinitialisation du mot de passe");
    }

    return data;
  }

  static getGoogleAuthUrl(): string {
    // TODO: Implement Google auth URL
    return "";
  }
}
