import api from "./api";
import type { User, UserRole, LoginCredentials, RegisterData } from "./types/user.types";
import type { ApiResponse } from "./types/api.types";

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `auth-token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Lax';
}

export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  const { role, ...loginPayload } = credentials as LoginCredentials & { role?: string };
  const response = await api.post<ApiResponse<AuthResult>>("/auth/login", loginPayload);
  const data = response.data.data;

  setAuthCookie(data.accessToken);
  return data;
}

export function normalizeRole(role: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
    DOCTOR: "DOCTOR",
    TA: "TA",
    ADVISOR: "ADVISOR",
    HEAD: "HEAD",
    STUDENT: "STUDENT",
  };
  return roleMap[role] || "STUDENT";
}

export async function register(data: RegisterData): Promise<AuthResult> {
  const response = await api.post<ApiResponse<AuthResult>>("/auth/register", data);
  const result = response.data.data;

  setAuthCookie(result.accessToken);
  return result;
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  await api.post("/auth/change-password", payload);
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(payload: { token: string; newPassword: string }): Promise<void> {
  await api.post("/auth/reset-password", payload);
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
  } catch {
    // Silently handle logout errors
  } finally {
    clearAuthCookie();
  }
}

export function getDashboardRoute(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    SUPER_ADMIN: "/admin",
    ADMIN: "/admin",
    DOCTOR: "/faculty",
    TA: "/ta",
    ADVISOR: "/advisor",
    HEAD: "/head",
    STUDENT: "/student",
  };
  return routes[role] || "/admin";
}

export const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  TA: "Teaching Assistant",
  ADVISOR: "Advisor",
  HEAD: "Department Head",
  STUDENT: "Student",
};

export const roleLabelsAr: Record<UserRole, string> = {
  SUPER_ADMIN: "المشرف العام",
  ADMIN: "مدير النظام",
  DOCTOR: "دكتور",
  TA: "معيد",
  ADVISOR: "مرشد أكاديمي",
  HEAD: "رئيس القسم",
  STUDENT: "طالب",
};
