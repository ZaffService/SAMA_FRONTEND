"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

export function ProfileCompletionBanner() {
  const router = useRouter();
  const { isProfileComplete, isAuthenticated, user } = useLocalAuth();

  // Debug logging
  useEffect(() => {
    console.log("🔔 [ProfileCompletionBanner] Auth state:", {
      isAuthenticated,
      isProfileComplete,
      userRole: user?.role,
      userEmail: user?.email,
    });
  }, [isAuthenticated, isProfileComplete, user]);

  // Only show for authenticated STUDENT or INSTRUCTOR (not ADMIN)
  const shouldShow =
    isAuthenticated &&
    isProfileComplete === false &&
    user?.role !== "ADMIN";

  useEffect(() => {
    console.log("🔔 [ProfileCompletionBanner] Should show?", shouldShow);
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="w-full bg-amber-50 border-b-2 border-amber-400 sticky top-[68px] sm:top-[72px] lg:top-[80px] z-40">
      <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 lg:h-6 lg:w-6 text-amber-600" />
            </div>
            <div className="text-sm lg:text-base">
              <span className="font-semibold text-amber-800">
                Profil incomplet
              </span>
              <span className="text-amber-700 ml-2">
                - Veuillez compléter votre profil pour accéder à toutes les fonctionnalités.
              </span>
            </div>
          </div>
          <Button
            onClick={() => router.push("/complete-profile")}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm lg:text-base font-medium px-4 lg:px-6 h-9 lg:h-10"
          >
            Compléter mon profil
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

