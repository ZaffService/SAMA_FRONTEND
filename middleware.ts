import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes protégées
  const protectedRoutes = [
    "/student-dashboard",
    "/instructor-dashboard",
    "/admin-dashboard",
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Routes publiques
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/verify-email",
    "/verify-phone",
    "/",
  ];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/reset-password"),
  );

  // Vérifier la présence du cookie d'authentification
  const accessToken = request.cookies.get("access_token")?.value;

  if (isProtectedRoute && !accessToken) {
    // Rediriger vers login avec URL de retour
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Supprimé : Plus de redirection automatique pour les utilisateurs connectés
  // Cela permet aux utilisateurs connectés de voir les boutons de connexion si nécessaire

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
