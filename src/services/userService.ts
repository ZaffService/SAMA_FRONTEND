import { buildApiUrl, API_ENDPOINTS } from "@/infrastructure/api/baseConfig";
import type {
  GetUsersParams,
  UsersResponse,
  User,
  Role,
  UserProfile,
} from "@/types/user";

const normalizeProfileValue = (value: any): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.id ?? value.code ?? value.label;
  }
  return undefined;
};

const normalizeUserProfile = (rawProfile: any): UserProfile | undefined => {
  if (!rawProfile) return undefined;

  return {
    phone: rawProfile.phone ?? rawProfile.telephone ?? rawProfile.phone_number,
    address: rawProfile.address ?? rawProfile.adresse,
    bio: rawProfile.bio,
    avatar: rawProfile.avatar ?? rawProfile.avatar_url,
    ageRange: normalizeProfileValue(
      rawProfile.ageRangeId ?? rawProfile.ageRange ?? rawProfile.age_range,
    ),
    currentStatus: normalizeProfileValue(
      rawProfile.currentStatusId ??
        rawProfile.currentStatus ??
        rawProfile.current_status,
    ),
    referralSource: normalizeProfileValue(
      rawProfile.referralSourceId ??
        rawProfile.referralSource ??
        rawProfile.referral_source,
    ),
    sexe: rawProfile.sexe ?? rawProfile.gender,
    region: rawProfile.region,
    residenceType: rawProfile.residenceType ?? rawProfile.residence_type,
    disability: rawProfile.disability ?? rawProfile.handicap,
    disabilityType: rawProfile.disabilityType ?? rawProfile.disability_type,
    disabilityDetails:
      rawProfile.disabilityDetails ?? rawProfile.disability_details,
    consentGiven: rawProfile.consentGiven ?? rawProfile.consent_given,
  };
};

const normalizeUser = (raw: any): User => {
  const base = raw?.user || raw;
  const profile =
    base?.userProfile ||
    base?.profile ||
    raw?.userProfile ||
    raw?.profile ||
    raw?.user_profile ||
    raw?.userprofile;

  return {
    id: base?.id,
    email: base?.email || "",
    firstName: base?.firstName || base?.first_name || "",
    lastName: base?.lastName || base?.last_name || "",
    telephone:
      base?.telephone ||
      base?.phone ||
      base?.phoneNumber ||
      base?.phone_number,
    phoneVerified: base?.phoneVerified ?? base?.phone_verified,
    role: base?.role,
    emailVerified: base?.emailVerified ?? base?.email_verified,
    createdAt: base?.createdAt || base?.created_at,
    userProfile: normalizeUserProfile(profile),
    isProfileComplete:
      base?.isProfileComplete ??
      base?.is_profile_complete ??
      base?.profileComplete ??
      undefined,
  };
};

const normalizeUsersResponse = (data: any): UsersResponse => {
  const rawUsers = Array.isArray(data) ? data : data?.users || data?.data || [];
  const users = rawUsers.map(normalizeUser);

  const total =
    typeof data?.total === "number" ? data.total : rawUsers.length;
  const page = typeof data?.page === "number" ? data.page : 1;
  const limit = typeof data?.limit === "number" ? data.limit : users.length;

  return { users, total, page, limit };
};

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

    const data = await response.json();
    return normalizeUsersResponse(data);
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

    const data = await response.json();
    return normalizeUsersResponse(data);
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
