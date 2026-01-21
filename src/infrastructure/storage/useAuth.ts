"use client";

import { useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { AuthApi } from "@/infrastructure/api/auth-api";
import { UserApi } from "@/infrastructure/api/user-api";
import type { AuthContextType, RegisterData } from "@/types/auth";
import type { User } from "@/domain/entities/user";

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
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(
    null,
  );

  useEffect(() => {
    console.log("🎬 [useAuth] useEffect déclenché - App montée");

    const initAuth = async () => {
      console.log("🔄 [useAuth] Début initAuth()");
      setIsLoading(true);

      try {
        console.log("🔄 [useAuth] Appel AuthApi.validateSession()...");
        const currentUser = await AuthApi.validateSession();
        console.log("🔄 [useAuth] Résultat validateSession:", currentUser);

        if (currentUser && currentUser.id && currentUser.email) {
          console.log(
            "✅ [useAuth] User trouvé:",
            currentUser.email,
            "Role:",
            currentUser.role,
          );
          const mappedUser: User = {
            id: currentUser.id,
            email: currentUser.email,
            firstName: currentUser.firstName || currentUser.first_name || "",
            lastName: currentUser.lastName || currentUser.last_name || "",
            role: currentUser.role,
            createdAt: currentUser.createdAt || currentUser.created_at || "",
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            created_at: currentUser.created_at,
          };

          setUser(mappedUser);
          setIsAuthenticated(true);

          // Fetch user profile to get isProfileComplete
          try {
            const profile = await UserApi.getUserProfile();
            console.log("🔄 [useAuth] Profile fetched:", profile);
            setIsProfileComplete(profile?.isProfileComplete ?? null);
          } catch (error) {
            console.error("❌ [useAuth] Error fetching profile:", error);
            setIsProfileComplete(null);
          }
        } else {
          console.log("❌ [useAuth] Aucun user trouvé (session invalide)");
          setUser(null);
          setIsAuthenticated(false);
          setIsProfileComplete(null);
        }
      } catch (error) {
        console.error("❌ [useAuth] Erreur initAuth:", error);
        setUser(null);
        setIsAuthenticated(false);
        setIsProfileComplete(null);
      } finally {
        console.log("🔄 [useAuth] Fin initAuth, isLoading = false");
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await AuthApi.login({ email, password });
      console.log("🔐 [useAuth] Login response:", response);
      console.log("🔐 [useAuth] Login response.user:", response.user);
      
      // Check if isProfileComplete exists in the response
      const isComplete = (response.user as any).isProfileComplete;
      console.log("🔐 [useAuth] isProfileComplete from response:", isComplete);
      
      const mappedUser: User = {
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.first_name || "",
        lastName: response.user.last_name || "",
        role: response.user.role,
        createdAt: response.user.created_at || "",
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        created_at: response.user.created_at,
      };

      setUser(mappedUser);
      setIsAuthenticated(true);
      // Capture isProfileComplete from login response
      setIsProfileComplete(isComplete ?? null);

      console.log("🔐 [useAuth] isProfileComplete state set to:", isComplete);

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

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsProfileComplete(null);
    setIsLoading(true);

    try {
      await AuthApi.logout();
    } catch (error) {
      // Continue même en cas d'erreur
    } finally {
      setIsLoading(false);
      window.location.href = "/";
    }
  };

  const canAccessCourse = (courseId: number, isPaid: boolean): boolean => {
    if (!isAuthenticated) return false;
    if (!isPaid) return true;
    return user?.role === "ADMIN" || user?.role === "INSTRUCTOR";
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
    logout,
    canAccessCourse,
    redirectAfterLogin,
    setRedirectAfterLogin,
    setProfileComplete,
  };
}
