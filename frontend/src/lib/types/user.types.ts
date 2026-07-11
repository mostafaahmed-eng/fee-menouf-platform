export type UserRole = "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "TA" | "ADVISOR" | "HEAD" | "STUDENT";

export interface User {
  id: string;
  email: string;
  fullNameEn: string;
  fullNameAr?: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  isVerified?: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    studentId: string;
    level: number;
    department?: { id: string; nameAr: string; nameEn: string };
    program?: { id: string; nameAr: string; nameEn: string };
  };
  doctor?: {
    id: string;
    employeeId: string;
    specialization?: string;
    department?: { id: string; nameAr: string; nameEn: string };
  };
  ta?: {
    id: string;
    employeeId: string;
    department?: { id: string; nameAr: string; nameEn: string };
  };
  advisor?: {
    id: string;
    employeeId: string;
    department?: { id: string; nameAr: string; nameEn: string };
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullNameAr: string;
  fullNameEn: string;
  role: UserRole;
  phone?: string;
}

export function isBackendRole(role: string): role is UserRole {
  return ["SUPER_ADMIN", "ADMIN", "DOCTOR", "TA", "ADVISOR", "HEAD", "STUDENT"].includes(role);
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile extends User {
  nationalId?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  address?: string;
  emergencyContact?: string;
  bloodType?: string;
}
