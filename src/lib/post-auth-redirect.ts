import { UserApi } from "@/infrastructure/api/user-api";
import { StudentApi } from "@/infrastructure/api/student-api";
import { APP_ROUTES } from "@/lib/app-routes";
import type { User } from "@/domain/entities/user";

const ROLE_DASHBOARDS: Record<string, string> = {
  ADMIN: APP_ROUTES.adminDashboard,
  INSTRUCTOR: APP_ROUTES.instructorDashboard,
  STUDENT: APP_ROUTES.studentDashboard,
};

/** @deprecated Utiliser APP_ROUTES.studentDiscoveryHome */
export const STUDENT_COURSES_CATALOG = APP_ROUTES.studentDiscoveryHome;

export function getRoleDashboard(role?: string | null): string {
  if (!role) return APP_ROUTES.studentDashboard;
  return ROLE_DASHBOARDS[role.toUpperCase()] ?? APP_ROUTES.studentDashboard;
}

/** Étudiants / formateurs : profil obligatoire avant tout accès. */
export function mustCompleteProfile(role?: string | null): boolean {
  const normalized = role?.toUpperCase();
  return normalized === "STUDENT" || normalized === "INSTRUCTOR";
}

function countProgressEnrollments(payload: {
  total?: number;
  data?: unknown[];
  courses?: unknown[];
  results?: unknown[];
  items?: unknown[];
}): number {
  if (typeof payload.total === "number" && Number.isFinite(payload.total)) {
    return payload.total;
  }

  const lists = [
    payload.data,
    payload.courses,
    payload.results,
    payload.items,
  ].filter(Array.isArray) as unknown[][];

  return lists.reduce((max, list) => Math.max(max, list.length), 0);
}

/** True si l'étudiant a au moins une inscription / progression en cours. */
export async function studentHasEnrollments(): Promise<boolean> {
  try {
    const progressPage = await StudentApi.getProgressPage(1, 1);
    return countProgressEnrollments(progressPage) > 0;
  } catch {
    return false;
  }
}

/**
 * Destination étudiant après auth / complétion de profil :
 * - aucun cours → page découverte (racine par défaut)
 * - au moins un cours → tableau de bord
 */
export async function resolveStudentHomePath(): Promise<string> {
  const hasEnrollments = await studentHasEnrollments();
  return hasEnrollments
    ? getRoleDashboard("STUDENT")
    : APP_ROUTES.studentDiscoveryHome;
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
      return APP_ROUTES.completeProfile;
    }
  } catch {
    return APP_ROUTES.completeProfile;
  }

  if (role?.toUpperCase() === "STUDENT") {
    const target = fallback || getRoleDashboard(role);
    if (target === getRoleDashboard("STUDENT")) {
      return resolveStudentHomePath();
    }
    return target;
  }

  return fallback || getRoleDashboard(role);
}

export async function resolveLoginRedirectUrl(
  mappedUser: User,
  isCompleteFromResponse: boolean | null | undefined,
  lastActivityRedirect?: string | null,
  explicitRedirect?: string | null,
): Promise<string> {
  let redirectUrl = getRoleDashboard(mappedUser.role);

  if (mappedUser.role === "STUDENT" && lastActivityRedirect) {
    redirectUrl = lastActivityRedirect;
  }

  if (explicitRedirect) {
    redirectUrl = explicitRedirect;
  }

  if (!mustCompleteProfile(mappedUser.role)) {
    return redirectUrl;
  }

  if (isCompleteFromResponse === true) {
    if (
      mappedUser.role === "STUDENT" &&
      redirectUrl === getRoleDashboard("STUDENT")
    ) {
      return resolveStudentHomePath();
    }
    return redirectUrl;
  }

  try {
    const profile = await UserApi.getUserProfile();
    if (profile?.isProfileComplete === true) {
      if (
        mappedUser.role === "STUDENT" &&
        redirectUrl === getRoleDashboard("STUDENT")
      ) {
        return resolveStudentHomePath();
      }
      return redirectUrl;
    }
  } catch {
    // Profil inaccessible → forcer la complétion.
  }

  return APP_ROUTES.completeProfile;
}

export async function resolvePostProfileRedirect(
  role?: string | null,
): Promise<string> {
  if (role === "ADMIN") return APP_ROUTES.adminDashboard;
  if (role === "INSTRUCTOR") return APP_ROUTES.instructorDashboard;
  return resolveStudentHomePath();
}
