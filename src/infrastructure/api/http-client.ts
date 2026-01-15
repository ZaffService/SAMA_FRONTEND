import { buildApiUrl } from "./baseConfig";

// Types for HTTP client
interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
}

interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

class HttpClient {
  private baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      console.log("🔄 [HttpClient] Tentative de refresh du token...");

      const response = await fetch(`${this.baseURL}/user/refresh-token`, {
        method: "POST",
        credentials: "include", // ✅ COOKIES INCLUS
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log("✅ [HttpClient] Token refreshé avec succès");
        return true;
      } else {
        console.log("❌ [HttpClient] Échec du refresh du token");
        return false;
      }
    } catch (error) {
      console.error("❌ [HttpClient] Erreur lors du refresh:", error);
      return false;
    }
  }

  private async handle401Error(originalRequest: Request): Promise<Response> {
    console.log("🚨 [HttpClient] Erreur 401 détectée, tentative de refresh...");

    // Si un refresh est déjà en cours, attendre
    if (this.isRefreshing) {
      if (this.refreshPromise) {
        const refreshSuccess = await this.refreshPromise;
        if (refreshSuccess) {
          console.log("🔄 [HttpClient] Retry après refresh réussi");
          return fetch(originalRequest);
        }
      }
      throw new Error("Session expirée");
    }

    // Démarrer le refresh
    this.isRefreshing = true;
    this.refreshPromise = this.refreshToken();

    try {
      const refreshSuccess = await this.refreshPromise;

      if (refreshSuccess) {
        console.log("🔄 [HttpClient] Retry après refresh réussi");
        // Retry la requête originale
        return fetch(originalRequest);
      } else {
        // Refresh échoué, déconnecter l'utilisateur
        console.log("🚪 [HttpClient] Refresh échoué, déconnexion...");
        this.logoutUser();
        throw new Error("Session expirée");
      }
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private logoutUser() {
    // Supprimer les cookies côté client
    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Rediriger vers login sans popup
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<HttpResponse<T>> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseURL}${endpoint}`;

    const requestConfig: RequestInit = {
      method: config.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      credentials: "include", // ✅ COOKIES INCLUS DANS TOUTES LES REQUÊTES
    };

    // Ajouter le body si présent
    if (config.body) {
      if (config.body instanceof FormData) {
        // Pour FormData, ne pas définir Content-Type (fetch le fait automatiquement)
        if (
          requestConfig.headers &&
          typeof requestConfig.headers === "object" &&
          !Array.isArray(requestConfig.headers)
        ) {
          delete (requestConfig.headers as Record<string, string>)[
            "Content-Type"
          ];
        }
        requestConfig.body = config.body;
      } else {
        requestConfig.body = JSON.stringify(config.body);
      }
    }

    let response = await fetch(url, requestConfig);

    // Gérer les erreurs 401 (token expiré)
    if (response.status === 401) {
      try {
        response = await this.handle401Error(new Request(url, requestConfig));
      } catch (error) {
        throw error;
      }
    }

    // Traiter la réponse
    let data: T;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = (await response.text()) as any;
    }

    if (!response.ok) {
      // Ne pas afficher de popup d'erreur pour les erreurs 401 (gérées automatiquement)
      if (response.status === 401) {
        throw new Error("Session expirée");
      }

      const errorMessage =
        (data as any)?.message || `Erreur ${response.status}`;
      throw new Error(errorMessage);
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
  }

  // Méthodes helper
  async get<T = any>(
    endpoint: string,
    config?: Omit<RequestConfig, "method" | "body">,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: Omit<RequestConfig, "method" | "body">,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "POST", body: data });
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: Omit<RequestConfig, "method" | "body">,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "PUT", body: data });
  }

  async delete<T = any>(
    endpoint: string,
    config?: Omit<RequestConfig, "method" | "body">,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }

  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: Omit<RequestConfig, "method" | "body">,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: data,
    });
  }
}

// Instance globale
export const httpClient = new HttpClient(buildApiUrl(""));

// Helper pour les uploads de fichiers (FormData)
export const uploadClient = new HttpClient(buildApiUrl(""));

// Fonction helper pour vérifier la session
export async function validateSession(): Promise<boolean> {
  try {
    const response = await httpClient.get("/user/profile");
    return response.status === 200;
  } catch {
    return false;
  }
}

// Fonction helper pour refresh manuel (si besoin)
export async function manualRefresh(): Promise<boolean> {
  return httpClient["refreshToken"]();
}
