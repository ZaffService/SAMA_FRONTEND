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

    const responseData = await res.json();

    if (!res.ok) {
      if (responseData?.error?.message) {
        throw new Error(responseData.error.message);
      }
      throw new Error(responseData.message || "Échec de l'inscription");
    }

    return responseData;
  }

  static async getProfile(): Promise<User | null> {
    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.USER.PROFILE), {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        return null;
      }

      return await res.json();
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      return null;
    }
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

  static async completeProfile(data: {
    firstName?: string;
    lastName?: string;
    sexe?: "M" | "F" | "O" | "NOT_SPECIFIED";
    region?: string;
    residenceType?: "URBAN" | "RURAL";
    disability?: boolean;
    disabilityType?: "VISUAL" | "HEARING" | "MOTOR" | "COGNITIVE" | "OTHER";
    disabilityDetails?: string;
    consentGiven?: boolean;
  }): Promise<User> {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.USER.COMPLETE_PROFILE), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Échec de la mise à jour du profil");
    }

    return res.json();
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

 static async adminCreateAccount(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}): Promise<User> {
  const res = await fetch(buildApiUrl(API_ENDPOINTS.USER.CREATE_ACCOUNT), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // JWT admin
    body: JSON.stringify({
      ...data,

      // 🔑 FLAGS CRITIQUES
      emailVerified: true,        // pas d’email de vérification
      adminCreation: true,        // compte créé par admin
      sendWelcomeEmail: true,     // email de bienvenue avec mot de passe
    }),
  });

  const responseData = await res.json();

  if (!res.ok) {
    throw new Error(responseData.message || "Échec de la création du compte");
  }

  return responseData;
}

  static getGoogleAuthUrl(): string {
    // TODO: Implement Google auth URL
    return "";
  }
}
