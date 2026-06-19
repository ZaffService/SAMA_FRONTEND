"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { mustCompleteProfile } from "@/lib/post-auth-redirect";
import { LoadingSpinner } from "@/components/loading-spinner";

const ALLOWED_PREFIXES = [
  "/complete-profile",
  "/login",
  "/register",
  "/verify-phone",
  "/verify-email",
  "/verify-email-pending",
  "/forgot-password",
  "/reset-password",
  "/reset-password-phone",
];

function isAllowedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function ProfileCompletionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading: authLoading } = useLocalAuth();
  const { isComplete, hasCheckedProfile, checkProfile } = useProfile();
  const hasRequestedCheck = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    if (!mustCompleteProfile(user?.role)) return;
    if (hasRequestedCheck.current) return;
    hasRequestedCheck.current = true;
    void checkProfile();
  }, [isAuthenticated, authLoading, user?.role, checkProfile]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    if (!mustCompleteProfile(user?.role)) return;
    if (!hasCheckedProfile) return;
    if (isComplete === true) return;
    if (isAllowedPath(pathname)) return;

    router.replace("/complete-profile");
  }, [
    isAuthenticated,
    authLoading,
    user?.role,
    hasCheckedProfile,
    isComplete,
    pathname,
    router,
  ]);

  const blocking =
    isAuthenticated &&
    !authLoading &&
    mustCompleteProfile(user?.role) &&
    hasCheckedProfile &&
    isComplete === false &&
    !isAllowedPath(pathname);

  if (blocking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#002976] via-[#0a3585] to-[#001a4d]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-white/80 text-sm">
          Redirection vers la complétion de profil…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
