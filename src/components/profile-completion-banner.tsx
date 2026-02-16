"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useProfile } from "@/hooks/useProfile";
import logger from "@/shared/helpers/logger";

export function ProfileCompletionBanner() {
  const router = useRouter();
  const { isAuthenticated, user } = useLocalAuth();
  const { isComplete, checkProfile } = useProfile();
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);

  // Check profile status on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      logger.log("🔔 [ProfileCompletionBanner] Checking profile status...");
      checkProfile().then(() => {
        setHasCheckedProfile(true);
      });
    } else {
      setHasCheckedProfile(false);
    }
  }, [isAuthenticated, user, checkProfile]);

  // Debug logging
  useEffect(() => {
    logger.log("🔔 [ProfileCompletionBanner] Auth state:", {
      isAuthenticated,
      isComplete,
      userRole: user?.role,
      userEmail: user?.email,
      hasCheckedProfile,
    });
  }, [isAuthenticated, isComplete, user, hasCheckedProfile]);

  // Only show for authenticated STUDENT or INSTRUCTOR (not ADMIN) and profile not complete
  const shouldShow =
    isAuthenticated &&
    hasCheckedProfile &&
    isComplete === false &&
    user?.role !== "ADMIN";

  useEffect(() => {
    logger.log("🔔 [ProfileCompletionBanner] Should show?", shouldShow);
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="sticky top-[68px] sm:top-[72px] lg:top-[80px] z-40">
      <div className="relative overflow-hidden border-b border-[#D6E3FF] bg-gradient-to-r from-[#EEF4FF] via-white to-[#FFF3E6]">
        <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[#002c75]/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-52 w-52 rounded-full bg-[#d93030]/15 blur-3xl" />

        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-[#002c75]/10">
              <AlertTriangle className="h-5 w-5 text-[#d93030]" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#002c75]/70">
                Action requise
              </p>
              <h3 className="text-lg font-bold text-[#101828] sm:text-xl">
                Profil incomplet
              </h3>
              <p className="max-w-2xl text-sm text-[#475467] sm:text-base">
                Finalisez votre profil pour débloquer l&apos;accès complet aux
                cours, au suivi de progression et aux certificats.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#344054]">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#002c75]/10">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Accès total aux cours
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#002c75]/10">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Suivi de progression
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button
              onClick={() => router.push("/complete-profile")}
              className="group w-full rounded-xl bg-[#002c75] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#002c75]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#001f54] sm:w-auto sm:text-base"
            >
              Compléter mon profil
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
