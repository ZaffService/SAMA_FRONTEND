import { buildApiUrl, API_ENDPOINTS } from "@/infrastructure/api/baseConfig";
import type { GetUsersParams, UsersResponse, User, Role } from "@/types/user";

export const userService = {
  /**
   * Récupérer tous les utilisateurs
   */
  async getAllUsers(
    params?: Omit<GetUsersParams, "role">,
  ): Promise<UsersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const url = `${buildApiUrl(API_ENDPOINTS.USER.BY_ROLE)}?${queryParams}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }

    return response.json();
  },

  /**
   * Récupérer les utilisateurs par rôle
   */
  async getUsersByRole(params: GetUsersParams): Promise<UsersResponse> {
    const queryParams = new URLSearchParams();
    if (params.role) queryParams.append("role", params.role);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);

    const url = `${buildApiUrl(API_ENDPOINTS.USER.BY_ROLE)}?${queryParams}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }

    return response.json();
  },

  /**
   * Récupérer les statistiques rapides
   */
  async getUserStats(): Promise<{
    total: number;
    students: number;
    instructors: number;
    admins: number;
  }> {
    const [all, students, instructors, admins] = await Promise.all([
      this.getAllUsers({ limit: 1 }),
      this.getUsersByRole({ role: "STUDENT", limit: 1 }),
      this.getUsersByRole({ role: "INSTRUCTOR", limit: 1 }),
      this.getUsersByRole({ role: "ADMIN", limit: 1 }),
    ]);

    return {
      total: all.total,
      students: students.total,
      instructors: instructors.total,
      admins: admins.total,
    };
  },
};
