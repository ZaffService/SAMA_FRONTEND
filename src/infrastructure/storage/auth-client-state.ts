"use client";

export type AuthClientStatus = "unknown" | "authenticated" | "anonymous";

const AUTH_CLIENT_STATUS_KEY = "__SAMA_AUTH_CLIENT_STATUS__";

const PROTECTED_ROUTE_PREFIXES = [
  "/admin",
  "/admin-dashboard",
  "/student-dashboard",
  "/instructor-dashboard",
  "/video-learning-module",
  "/complete-profile",
  "/course-details",
  "/mes-apprentissages",
  "/user-profile",
  "/parametres",
  "/quiz",
  "/quiz-assessment",
];

type WindowWithAuthStatus = Window & {
  [AUTH_CLIENT_STATUS_KEY]?: AuthClientStatus;
};

export function getAuthClientStatus(): AuthClientStatus {
  if (typeof window === "undefined") {
    return "unknown";
  }

  const windowWithStatus = window as WindowWithAuthStatus;
  return windowWithStatus[AUTH_CLIENT_STATUS_KEY] ?? "unknown";
}

export function setAuthClientStatus(status: AuthClientStatus): void {
  if (typeof window === "undefined") {
    return;
  }

  const windowWithStatus = window as WindowWithAuthStatus;
  windowWithStatus[AUTH_CLIENT_STATUS_KEY] = status;
}

export function isProtectedRoutePath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
