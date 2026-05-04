import type { User, LoginData, AuthResponse } from "@/domain/entities/user";
import type { RegisterData } from "@/types/auth";
import { buildApiUrl, API_ENDPOINTS, API_BASE_URL } from "./baseConfig";
import logger from "@/shared/helpers/logger";

export class AuthApi {
  static async login(credentials: LoginData): Promise<AuthResponse> {
    logger.log("🔐 [AuthApi] Login pour:", credentials.email);
    const res = await fetch(buildApiUrl(API_ENDPOINTS.USER.LOGIN), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    const data = await res.json();

    if (!res.ok) {
      // Propager l'objet d'erreur complet avec code et message pour permettre le mapping
      if (data?.error) {
        const errorObj = new Error(data.error.message || "Échec de la connexion");
        (errorObj as any).code = data.error.code;
        (errorObj as any).timestamp = data.error.timestamp;
        (errorObj as any).path = data.error.path;
        throw errorObj;
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
      if (responseData?.error) {
        // Propager l'erreur avec code pour permettre le mapping
        const errorObj = new Error(responseData.error.message || "Échec de l'inscription");
        (errorObj as any).code = responseData.error.code;
        (errorObj as any).timestamp = responseData.error.timestamp;
        (errorObj as any).path = responseData.error.path;
        throw errorObj;
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
      logger.error("Erreur lors de la récupération du profil:", error);
      return null;
    }
  }

  static async validateSession(): Promise<User | null> {
    logger.log("🔍 [AuthApi] Début validateSession()");
    logger.log(
      "🔍 [AuthApi] URL appelée:",
      buildApiUrl(API_ENDPOINTS.USER.PROFILE),
    );

    try {
      logger.log(
        '🔍 [AuthApi] Envoi requête GET /user/profile avec credentials: "include"',
      );
      let res = await fetch(buildApiUrl(API_ENDPOINTS.USER.PROFILE), {
        method: "GET",
        credentials: "include",
      });

      logger.log("🔍 [AuthApi] Réponse reçue:", res.status, res.statusText);

      if (res.status === 401) {
        // Le refresh est déjà géré de manière centralisée par fetch-auth-interceptor.
        // Ici on évite de relancer un second cycle refresh/retry qui spamme le réseau.
        logger.log("❌ [AuthApi] Session invalide (401), aucun refresh local");
        return null;
      }

      if (!res.ok) {
        logger.log("❌ [AuthApi] Réponse non-ok:", res.status, res.statusText);
        return null;
      }

      const userData = await res.json();
      logger.log("✅ [AuthApi] User profile récupéré:", userData);
      return userData;
    } catch (error) {
      logger.error("❌ [AuthApi] Erreur validateSession:", error);
      return null;
    }
  }

  static async completeProfile(data: {
    userId?: string | number;
    firstName?: string;
    lastName?: string;
    telephone?: string;
    indicatif?: string;
    ageRangeId?: string;
    currentStatusId?: string;
    referralSourceId?: string;
    ageRange?: string;
    currentStatus?: string;
    referralSource?: string;
    sexe?: "M" | "F" | "O" | "NOT_SPECIFIED";
    region?: string;
    residenceType?: "URBAN" | "RURAL";
    disability?: boolean;
    disabilityType?: "VISUAL" | "HEARING" | "MOTOR" | "COGNITIVE" | "OTHER";
    disabilityDetails?: string;
    consentGiven?: boolean;
  }): Promise<User> {
    const payload: Record<string, unknown> = {};

    if (data.userId !== undefined) payload.userId = data.userId;
    if (data.firstName !== undefined) payload.firstName = data.firstName;
    if (data.lastName !== undefined) payload.lastName = data.lastName;
    if (data.telephone !== undefined) payload.telephone = data.telephone;
    if (data.indicatif !== undefined) payload.indicatif = data.indicatif;

    const ageRangeId = data.ageRangeId ?? data.ageRange;
    if (ageRangeId) payload.ageRangeId = ageRangeId;

    const currentStatusId = data.currentStatusId ?? data.currentStatus;
    if (currentStatusId) payload.currentStatusId = currentStatusId;

    const referralSourceId = data.referralSourceId ?? data.referralSource;
    if (referralSourceId) payload.referralSourceId = referralSourceId;

    if (data.sexe !== undefined) payload.sexe = data.sexe;
    if (data.region !== undefined) payload.region = data.region;
    if (data.residenceType !== undefined)
      payload.residenceType = data.residenceType;
    if (data.disability !== undefined) payload.disability = data.disability;
    if (data.disabilityType !== undefined)
      payload.disabilityType = data.disabilityType;
    if (data.disabilityDetails !== undefined)
      payload.disabilityDetails = data.disabilityDetails;
    if (data.consentGiven !== undefined)
      payload.consentGiven = data.consentGiven;

    const res = await fetch(buildApiUrl(API_ENDPOINTS.USER.COMPLETE_PROFILE), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const errorData = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Vérifier si c'est une erreur de téléphone duplicata
      const errorMessage = errorData?.message || errorData?.error?.message || "Échec de la mise à jour du profil";
      const errorCode = errorData?.errorCode || errorData?.error?.errorCode || "";
      
      // Codes d'erreur possibles pour téléphone duplicata
      const isPhoneConflict = 
        errorCode === "TELEPHONE_ALREADY_EXIST" ||
        errorCode === "TELEPHONE_CONFLICT" ||
        errorCode === "PHONE_ALREADY_EXISTS" ||
        errorMessage.toLowerCase().includes("telephone") ||
        errorMessage.toLowerCase().includes("phone") ||
        errorMessage.toLowerCase().includes("téléphone") ||
        res.status === 401;

      if (isPhoneConflict) {
        throw new Error("TELEPHONE_ALREADY_EXIST");
      }

      throw new Error(errorMessage);
    }

    return res.json();
  }

  static async logout(): Promise<void> {
    logger.log("🚪 [AuthApi] Début logout - Envoi requête POST /logout");
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER.LOGOUT), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      logger.log(
        "🚪 [AuthApi] Réponse logout:",
        response.status,
        response.statusText,
      );
      if (!response.ok) {
        logger.error(
          "🚪 [AuthApi] Erreur logout - Status non-ok:",
          response.status,
        );
      }
    } catch (error) {
      logger.error("🚪 [AuthApi] Erreur réseau lors du logout:", error);
    }
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
      // Propager l'erreur avec code pour permettre le mapping
      if (data?.error) {
        const errorObj = new Error(data.error.message || "Échec de vérification");
        (errorObj as any).code = data.error.code;
        (errorObj as any).timestamp = data.error.timestamp;
        (errorObj as any).path = data.error.path;
        throw errorObj;
      }
      throw new Error(data.message || "Échec de vérification");
    }

    return data;
  }

  static async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(buildApiUrl("/user/refresh-token"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        logger.warn(
          "❌ [AuthApi] Refresh token échoué:",
          response.status,
          response.statusText,
        );
        return false;
      }

      logger.log("✅ [AuthApi] Token refreshé avec succès");
      return true;
    } catch (error) {
      logger.error("❌ [AuthApi] Erreur lors du refresh token:", error);
      return false;
    }
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
        emailVerified: true, // pas d’email de vérification
        adminCreation: true, // compte créé par admin
        sendWelcomeEmail: true, // email de bienvenue avec mot de passe
      }),
    });

    const responseData = await res.json();

    if (!res.ok) {
      if (responseData?.error) {
        // Propager l'erreur avec code pour permettre le mapping
        const errorObj = new Error(responseData.error.message || "Échec de la création du compte");
        (errorObj as any).code = responseData.error.code;
        (errorObj as any).timestamp = responseData.error.timestamp;
        (errorObj as any).path = responseData.error.path;
        throw errorObj;
      }
      throw new Error(responseData.message || "Échec de la création du compte");
    }

    return responseData;
  }

  static getGoogleAuthUrl(): string {
    const backendUrl = API_BASE_URL.replace("/api", "");
    return `${backendUrl}/oauth2/authorization/google`;
  }

  static async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    if (!idToken || !idToken.trim()) {
      throw new Error("Token d'authentification Google manquant");
    }
    if (idToken.split(".").length !== 3) {
      throw new Error(
        "Token Google invalide: le frontend doit envoyer un ID Token JWT.",
      );
    }

    logger.log("🔐 [AuthApi] Login Google via:", API_ENDPOINTS.AUTH.GOOGLE);
    const res = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.GOOGLE), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data?.error) {
        const errorObj = new Error(data.error.message || "Échec de la connexion Google");
        (errorObj as any).code = data.error.code;
        (errorObj as any).timestamp = data.error.timestamp;
        (errorObj as any).path = data.error.path;
        throw errorObj;
      }
      throw new Error(
        data.message ||
          data.error?.message ||
          "Échec de la connexion Google",
      );
    }

    return data;
  }
}
