/**
 * Routes applicatives centralisées (éviter les chemins en dur dans les composants).
 * Certaines routes peuvent être surchargées via les variables d'environnement publiques.
 */
export const APP_ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  completeProfile: "/complete-profile",
  courses: "/courses",
  studentDashboard: "/student-dashboard",
  instructorDashboard: "/instructor-dashboard",
  adminDashboard: "/admin-dashboard",
  /**
   * Page d'accueil pour un étudiant sans inscription :
   * par défaut la racine `/`, configurable via NEXT_PUBLIC_STUDENT_DISCOVERY_HOME.
   */
  studentDiscoveryHome:
    process.env.NEXT_PUBLIC_STUDENT_DISCOVERY_HOME?.trim() || "/",
} as const;

export type AppRouteKey = keyof typeof APP_ROUTES;
