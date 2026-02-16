"use client";

import { useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { AuthApi } from "@/infrastructure/api/auth-api";
import { setupAuthFetchInterceptor } from "@/infrastructure/api/fetch-auth-interceptor";
import {
  isProtectedRoutePath,
  setAuthClientStatus,
} from "@/infrastructure/storage/auth-client-state";
import { UserApi } from "@/infrastructure/api/user-api";
import { clearTokens } from "@/shared/helpers/auth";
import type { AuthContextType, RegisterData } from "@/types/auth";
import type { User } from "@/domain/entities/user";
import logger from "@/shared/helpers/logger";

// Fonction utilitaire pour forcer la suppression des cookies d'authentification
function clearAuthCookies(): void {
  const domains = [
    window.location.hostname,
    "." + window.location.hostname,
    window.location.hostname.split(".").slice(-2).join("."),
  ];

  // Liste des noms de cookies potentiels à supprimer
  const cookiesToClear = [
    "access_token",
    "refresh_token",
    "auth_token",
    "session_id",
    "jwt",
    "token",
    "user_session",
    "auth_user",
    "bibocom_session",
  ];

  cookiesToClear.forEach((cookieName) => {
    domains.forEach((domain) => {
      // Supprimer le cookie du domaine actuel
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
      
      // Pour les cookies sécurisés
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}; secure;`;
    });
  });

  // Nettoyer localStorage et sessionStorage
  const storageKeys = Object.keys(localStorage);
  storageKeys.forEach((key) => {
    if (
      key.toLowerCase().includes("auth") ||
      key.toLowerCase().includes("token") ||
      key.toLowerCase().includes("user") ||
      key.toLowerCase().includes("session")
    ) {
      localStorage.removeItem(key);
    }
  });

  sessionStorage.clear();
}

export function useLocalAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useLocalAuth must be used inside LocalAuthProvider");
  return context;
}

export function useProvideAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(
    null,
  );
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(
    null,
  );

  const mapBackendUserToLocalUser = (rawUser: any): User => {
    return {
      id: rawUser?.id,
      email: rawUser?.email || "",
      firstName: rawUser?.firstName || rawUser?.first_name || "",
      lastName: rawUser?.lastName || rawUser?.last_name || "",
      telephone: rawUser?.telephone || "",
      role: rawUser?.role,
      createdAt: rawUser?.createdAt || rawUser?.created_at || "",
      first_name: rawUser?.first_name,
      last_name: rawUser?.last_name,
      created_at: rawUser?.created_at,
    };
  };

  const clearClientCaches = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(new CustomEvent("auth:clear-client-cache"));
  }, []);

  const handleSessionExpired = useCallback(() => {
    setAuthClientStatus("anonymous");
    setUser(null);
    setIsAuthenticated(false);
    setIsProfileComplete(null);
    setIsLoading(false);
    localStorage.removeItem("user_profile_cache");
    clearTokens();
    clearAuthCookies();
    clearClientCaches();

    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (!isProtectedRoutePath(currentPath)) {
        return;
      }

      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
    }
  }, [clearClientCaches]);

  useEffect(() => {
    setupAuthFetchInterceptor();

    const onSessionExpired = () => {
      logger.warn(
        "🚪 [useAuth] Session expirée détectée (event global), déconnexion...",
      );
      handleSessionExpired();
    };

    window.addEventListener(
      "auth:session-expired",
      onSessionExpired as EventListener,
    );

    return () => {
      window.removeEventListener(
        "auth:session-expired",
        onSessionExpired as EventListener,
      );
    };
  }, [handleSessionExpired]);

  useEffect(() => {
    logger.log("🎬 [useAuth] useEffect déclenché - App montée");

    const initAuth = async () => {
      logger.log("🔄 [useAuth] Début initAuth()");
      setAuthClientStatus("unknown");
      setIsLoading(true);

      try {
        logger.log("🔄 [useAuth] Appel AuthApi.validateSession()...");
        const currentUser = await AuthApi.validateSession();
        logger.log("🔄 [useAuth] Résultat validateSession:", currentUser);

        if (currentUser && currentUser.id && currentUser.email) {
          logger.log(
            "✅ [useAuth] User trouvé:",
            currentUser.email,
            "Role:",
            currentUser.role,
            "Telephone:",
            currentUser.telephone,
          );
          const mappedUser = mapBackendUserToLocalUser(currentUser);

          setUser(mappedUser);
          setIsAuthenticated(true);
          setAuthClientStatus("authenticated");

          // Fetch user profile to get isProfileComplete
          try {
            const profile = await UserApi.getUserProfile();
            logger.log("🔄 [useAuth] Profile fetched:", profile);
            setIsProfileComplete(profile?.isProfileComplete ?? null);
          } catch (error) {
            logger.error("❌ [useAuth] Error fetching profile:", error);
            setIsProfileComplete(null);
          }
        } else {
          logger.log("❌ [useAuth] Aucun user trouvé (session invalide)");
          setUser(null);
          setIsAuthenticated(false);
          setAuthClientStatus("anonymous");
          setIsProfileComplete(null);
        }
      } catch (error) {
        logger.error("❌ [useAuth] Erreur initAuth:", error);
        setUser(null);
        setIsAuthenticated(false);
        setAuthClientStatus("anonymous");
        setIsProfileComplete(null);
      } finally {
        logger.log("🔄 [useAuth] Fin initAuth, isLoading = false");
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const validateCurrentSession = async () => {
      const currentUser = await AuthApi.validateSession();
      if (!currentUser || !currentUser.id || !currentUser.email) {
        logger.warn(
          "🚪 [useAuth] Session devenue invalide lors de la revalidation",
        );
        handleSessionExpired();
      }
    };

    const handleFocus = () => {
      void validateCurrentSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void validateCurrentSession();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = window.setInterval(() => {
      void validateCurrentSession();
    }, 60_000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, handleSessionExpired]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await AuthApi.login({ email, password });
      logger.log("🔐 [useAuth] Login response:", response);
      logger.log("🔐 [useAuth] Login response.user:", response.user);

      // Check if isProfileComplete exists in the response
      const isComplete = (response.user as any).isProfileComplete;
      logger.log("🔐 [useAuth] isProfileComplete from response:", isComplete);

      const mappedUser = mapBackendUserToLocalUser(response.user);

      setUser(mappedUser);
      setIsAuthenticated(true);
      setAuthClientStatus("authenticated");
      // Capture isProfileComplete from login response
      setIsProfileComplete(isComplete ?? null);

      logger.log("🔐 [useAuth] isProfileComplete state set to:", isComplete);

      let redirectUrl: string | undefined;
      switch (mappedUser.role) {
        case "ADMIN":
          redirectUrl = "/admin-dashboard";
          break;
        case "INSTRUCTOR":
          redirectUrl = "/instructor-dashboard";
          break;
        case "STUDENT":
        default:
          redirectUrl = undefined;
          break;
      }

      if (redirectAfterLogin) {
        redirectUrl = redirectAfterLogin;
        setRedirectAfterLogin(null);
      }

      return { success: true, redirectUrl };
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthClientStatus("anonymous");
      setIsProfileComplete(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);

    try {
      await AuthApi.register(data);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    setIsLoading(true);

    try {
      const response = await AuthApi.loginWithGoogle(idToken);
      logger.log("🔐 [useAuth] Google Login response:", response);

      const isComplete = (response.user as any).isProfileComplete;

      const mappedUser = mapBackendUserToLocalUser(response.user);

      setUser(mappedUser);
      setIsAuthenticated(true);
      setAuthClientStatus("authenticated");
      setIsProfileComplete(isComplete ?? null);

      let redirectUrl: string | undefined;
      switch (mappedUser.role) {
        case "ADMIN":
          redirectUrl = "/admin-dashboard";
          break;
        case "INSTRUCTOR":
          redirectUrl = "/instructor-dashboard";
          break;
        case "STUDENT":
        default:
          redirectUrl = undefined;
          break;
      }

      if (redirectAfterLogin) {
        redirectUrl = redirectAfterLogin;
        setRedirectAfterLogin(null);
      }

      return { success: true, redirectUrl };
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthClientStatus("anonymous");
      setIsProfileComplete(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    logger.log("🚪 [useAuth] Début logout - Réinitialisation état local");
    // Logout volontaire: basculer immédiatement en anonyme avant tout appel réseau.
    setAuthClientStatus("anonymous");
    setUser(null);
    setIsAuthenticated(false);
    setIsProfileComplete(null);
    // Clear profile cache
    localStorage.removeItem("user_profile_cache");
    clearTokens(); // Vider les tokens locaux immédiatement
    clearClientCaches();
    setIsLoading(true);

    try {
      logger.log("🚪 [useAuth] Appel AuthApi.logout()");
      await AuthApi.logout();
      logger.log("🚪 [useAuth] AuthApi.logout() terminé");
    } catch (error) {
      logger.error("🚪 [useAuth] Erreur lors de AuthApi.logout():", error);
      // Continue même en cas d'erreur
    } finally {
      // Nettoyage forcé des cookies pour la compatibilité mobile
      clearAuthCookies();

      setIsLoading(false);
      logger.log("🚪 [useAuth] Redirection vers /");

      // Redirection avec prévention du cache pour mobile
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      const redirectUrl = isMobile ? `/?logout=${Date.now()}` : "/";
      window.location.href = redirectUrl;
    }
  };

  const canAccessCourse = (courseId: number, isPaid: boolean): boolean => {
    if (!isAuthenticated) return false;
    if (!isPaid) return true;
    // ✅ Admins ont accès à tous les cours
    if (user?.role === "ADMIN") return true;
    return user?.role === "INSTRUCTOR";
  };

  const setProfileComplete = (complete: boolean) => {
    setIsProfileComplete(complete);
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    isProfileComplete,
    login,
    register,
    loginWithGoogle,
    logout,
    canAccessCourse,
    redirectAfterLogin,
    setRedirectAfterLogin,
    setProfileComplete,
  };
}
