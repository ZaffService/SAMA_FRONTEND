"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
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

  useEffect(() => {
    if (isAuthenticated && user) {
      logger.log(" [ProfileCompletionBanner] Checking profile status...");
      checkProfile().then(() => {
        setHasCheckedProfile(true);
      });
    } else {
      setHasCheckedProfile(false);
    }
  }, [isAuthenticated, user, checkProfile]);

  useEffect(() => {
    logger.log(" [ProfileCompletionBanner] Auth state:", {
      isAuthenticated,
      isComplete,
      userRole: user?.role,
      userEmail: user?.email,
      hasCheckedProfile,
    });
  }, [isAuthenticated, isComplete, user, hasCheckedProfile]);

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
      <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white px-4 py-4 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.12)] sm:px-5 sm:py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <Sparkles
                className="h-5 w-5 text-slate-600"
                strokeWidth={1.75}
              />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400">
                Suggestion
              </p>
              <p className="text-sm leading-relaxed text-gray-600">
                <span className="font-semibold text-gray-900">
                  Profil incomplet.
                </span>{" "}
                Complétez votre profil pour personnaliser votre expérience.
              </p>
            </div>
          </div>

          <Button
            onClick={() => router.push("/complete-profile")}
            className="group h-10 w-full shrink-0 rounded-full bg-[#0f2847] px-5 text-sm font-medium text-white shadow-none transition-colors hover:bg-[#0a1d33] sm:w-auto"
          >
            Compléter mon profil
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
