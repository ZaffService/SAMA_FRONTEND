"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useProfile } from "@/hooks/useProfile";
import logger from "@/shared/helpers/logger";

interface ProfileCompletionBannerProps {
  className?: string;
  stickyClassName?: string;
}

export function ProfileCompletionBanner({
  className,
  stickyClassName,
}: ProfileCompletionBannerProps = {}) {
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
    <div
      className={cn(
        "sticky top-[68px] z-40 mb-6 sm:top-[72px] lg:top-[80px]",
        stickyClassName,
        className,
      )}
    >
      <Alert className="border-l-4 border-l-amber-400 border-amber-200 bg-amber-50/90 px-4 py-3 shadow-sm">
        <AlertTriangle className="h-4 w-4 text-amber-600" />

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
              Action requise
            </p>
            <p className="text-sm leading-6 text-slate-700">
              <span className="font-semibold text-slate-900">
                Profil incomplet.
              </span>{" "}
              Finalisez votre profil pour débloquer l&apos;accès complet aux
              cours, au suivi de progression et aux certificats.
            </p>
          </div>

          <Button
            onClick={() => router.push("/complete-profile")}
            size="sm"
            className="group h-8 shrink-0 rounded-full bg-[#002c75] px-3 text-xs font-semibold text-white shadow-none transition-colors hover:bg-[#001f54] sm:text-sm"
          >
            Compléter mon profil
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}
