import type { User, LoginData, AuthResponse } from "@/domain/entities/user";
import type { RegisterData } from "@/types/auth";
import { buildApiUrl, API_ENDPOINTS } from "./baseConfig";

export class AuthApi {
  static async login(credentials: LoginData): Promise<AuthResponse> {
    console.log("🔐 [AuthApi] Login pour:", credentials.email);
    const res = await fetch(buildApiUrl(API_ENDPOINTS.USER.LOGIN), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    const data = await res.json();

    if (!res.ok) {
      // Propager les codes d'erreur spécifiques
      if (data?.error?.code) {
        throw new Error(data.error.code);
      }
      throw new Error(data.message || "Échec de la connexion");
    }

    return data;
  }

  static async register(data: RegisterData): Promise<User> {
    const { acceptTerms, ...payload } = data;
    const res = await fetch(buildApiUrl(API_ENDPOINTS.USER.CREATE_ACCOUNT), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok)
      throw new Error((await res.json()).message || "Échec de l'inscription");
    return res.json();
  }

  static async validateSession(): Promise<User | null> {
    console.log("🔍 [AuthApi] Début validateSession()");
    console.log(
      "🔍 [AuthApi] URL appelée:",
      buildApiUrl(API_ENDPOINTS.USER.PROFILE),
    );

    try {
      console.log(
        '🔍 [AuthApi] Envoi requête GET /user/profile avec credentials: "include"',
      );
      const res = await fetch(buildApiUrl(API_ENDPOINTS.USER.PROFILE), {
        method: "GET",
        credentials: "include",
      });

      console.log("🔍 [AuthApi] Réponse reçue:", res.status, res.statusText);

      if (!res.ok) {
        console.log("❌ [AuthApi] Réponse non-ok:", res.status, res.statusText);
        return null;
      }

      const userData = await res.json();
      console.log("✅ [AuthApi] User profile récupéré:", userData);
      return userData;
    } catch (error) {
      console.error("❌ [AuthApi] Erreur validateSession:", error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      await fetch(buildApiUrl(API_ENDPOINTS.USER.LOGOUT), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch {}
  }

  static async verifyEmail(token: string): Promise<{ message: string }> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.USER.VERIFY_EMAIL), {
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

  static async requestPasswordReset(
    email: string,
  ): Promise<{ message: string }> {
    const res = await fetch(
      buildApiUrl(API_ENDPOINTS.USER.REQUEST_PASSWORD_RESET),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message || "Échec de la demande de réinitialisation",
      );
    }

    return data;
  }

  static async resetPassword(
    token: string,
    password: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.USER.RESET_PASSWORD), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message || "Échec de la réinitialisation du mot de passe",
      );
    }

    return data;
  }

  static getGoogleAuthUrl(): string {
    // TODO: Implement Google auth URL
    return "";
  }
}
