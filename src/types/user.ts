export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface UserProfile {
  phone?: string;
  address?: string;
  bio?: string;
  avatar?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
  userProfile?: UserProfile;
  isProfileComplete: boolean;
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
}
