"use client";

import { create } from "zustand";
import { useUiStore } from "@/store/ui-store";
import { UserRole } from "@/types/navigation";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  permissions: string[];
  demoMode: boolean;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => void;
};

const STORAGE_KEY = "nimbus-auth";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: (token, user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    useUiStore.getState().setRole(user.role);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    useUiStore.getState().resetUi();
  },
  setLoading: (loading) => set({ isLoading: loading }),
  hydrate: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { token, user } = JSON.parse(stored);
        if (token && user) {
          useUiStore.getState().setRole(user.role);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return;
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ isLoading: false });
  },
}));
