import { UserApi } from "@/infrastructure/api/user-api";

const ROLE_DASHBOARDS: Record<string, string> = {
  ADMIN: "/admin-dashboard",
  INSTRUCTOR: "/instructor-dashboard",
  STUDENT: "/student-dashboard",
};

export function getRoleDashboard(role?: string | null): string {
  if (!role) return "/student-dashboard";
  return ROLE_DASHBOARDS[role.toUpperCase()] ?? "/student-dashboard";
}

/** Étudiants / formateurs : profil obligatoire avant tout accès. */
export function mustCompleteProfile(role?: string | null): boolean {
  const normalized = role?.toUpperCase();
  return normalized === "STUDENT" || normalized === "INSTRUCTOR";
}

export async function resolvePostAuthRedirect(
  role?: string | null,
  fallback?: string | null,
): Promise<string> {
  if (!mustCompleteProfile(role)) {
    return fallback || getRoleDashboard(role);
  }

  try {
    const profile = await UserApi.getUserProfile();
    if (profile?.isProfileComplete !== true) {
      return "/complete-profile";
    }
  } catch {
    return "/complete-profile";
  }

  return fallback || getRoleDashboard(role);
}
