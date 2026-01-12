"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { LoadingSpinner } from "@/components/loading-spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "INSTRUCTOR" | "STUDENT";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useLocalAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Rediriger vers login si non authentifié
        router.push("/login");
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        // Rediriger vers dashboard approprié si rôle insuffisant
        switch (user?.role) {
          case "ADMIN":
            router.push("/admin-dashboard");
            break;
          case "INSTRUCTOR":
            router.push("/instructor-dashboard");
            break;
          case "STUDENT":
          default:
            router.push("/student-dashboard");
            break;
        }
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router]);

  // Afficher le spinner pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Ne rien afficher si non authentifié (la redirection se fait dans useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Vérifier le rôle si requis
  if (requiredRole && user?.role !== requiredRole) {
    return null; // La redirection se fait dans useEffect
  }

  return <>{children}</>;
}
