import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

export interface UseProtectRouteOptions {
  redirectIfNotAuth?: boolean;
  requiredRole?: "student" | "instructor" | "admin";
  message?: string;
}

export function useProtectRoute(options?: UseProtectRouteOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useLocalAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // ✅ Vérifier l'authentification directement via isAuthenticated
  // qui est basé sur les cookies et l'état LocalAuthContext
  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (isLoading) return;

    // Si pas connecté
    if (!isAuthenticated) {
      // Sauvegarder l'URL pour redirection après connexion
      if (typeof window !== "undefined") {
        sessionStorage.setItem("returnTo", pathname);
        if (options?.message) {
          sessionStorage.setItem("accessDeniedMessage", options.message);
        }
      }

      // Afficher la modale
      setShowAuthModal(true);

      // Marquer la redirection pour après (dans un autre useEffect)
      setShouldRedirect(true);
    } else if (isAuthenticated) {
      // Utilisateur authentifié, ne pas montrer la modale
      setShowAuthModal(false);
      setShouldRedirect(false);
    }
  }, [isAuthenticated, isLoading, pathname, options]);

  // Effet séparé pour la redirection (après que le composant ait rendu)
  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
      }, 3000); // 3 secondes pour lire le message

      return () => clearTimeout(timer);
    }
  }, [shouldRedirect, pathname, router]);

  // Effet pour vérifier les rôles (si disponible dans le système local)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (options?.requiredRole && user?.role) {
        // Normaliser les rôles pour la comparaison (convertir en lowercase)
        const userRoleLower = user.role.toLowerCase();
        if (userRoleLower !== options.requiredRole) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "accessDeniedMessage",
              "Vous n'avez pas l'accès à cette ressource.",
            );
          }
          router.push("/403");
        }
      }
    }
  }, [isAuthenticated, isLoading, user, options, router]);

  return {
    isAuthenticated: isAuthenticated,
    loading: isLoading,
    user,
    showAuthModal: showAuthModal && isLoading === false,
    canAccess:
      isAuthenticated &&
      (!options?.requiredRole ||
        (user?.role && user.role.toLowerCase() === options.requiredRole)),
  };
}
