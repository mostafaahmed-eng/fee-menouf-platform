"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "../types/user.types";
import * as authService from "../auth";

function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `auth-token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Lax';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullNameAr: string;
    fullNameEn: string;
    role: UserRole;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  clearError: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setTokens: (accessToken: string, refreshToken: string) => {
        setAuthCookie(accessToken);
        set({ token: accessToken, refreshToken });
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.login(credentials);
          setAuthCookie(result.accessToken);
          set({
            user: result.user,
            token: result.accessToken,
            refreshToken: result.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Login failed";
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.register(data);
          setAuthCookie(result.accessToken);
          set({
            user: result.user,
            token: result.accessToken,
            refreshToken: result.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Registration failed";
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } finally {
          clearAuthCookie();
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAuthCookie(state.token);
        }
      },
    }
  )
);
