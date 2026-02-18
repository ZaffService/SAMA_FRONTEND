export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export type AgeRange = string;

export type CurrentStatus = string;

export type ReferralSource = string;

export type SexeType =
  | "M"
  | "F"
  | "O"
  | "NOT_SPECIFIED"
  | "MASCULIN"
  | "FEMININ";

export type ResidenceType = "URBAN" | "RURAL" | "URBAIN";

export type DisabilityType =
  | "VISUAL"
  | "HEARING"
  | "MOTOR"
  | "COGNITIVE"
  | "OTHER"
  | "VISUEL"
  | "AUDITIF"
  | "MOTEUR"
  | "MENTAL"
  | "AUTRE";

export interface UserProfile {
  phone?: string;
  address?: string;
  bio?: string;
  avatar?: string;
  ageRange?: AgeRange;
  currentStatus?: CurrentStatus;
  referralSource?: ReferralSource;
  sexe?: SexeType;
  region?: string;
  residenceType?: ResidenceType;
  disability?: boolean;
  disabilityType?: DisabilityType;
  disabilityDetails?: string;
  consentGiven?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  telephone?: string;
  phoneVerified?: boolean;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
  userProfile?: UserProfile;
  isProfileComplete?: boolean;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface GetUsersParams {
  role?: Role;
  page?: number;
  limit?: number;
  search?: string;
}
