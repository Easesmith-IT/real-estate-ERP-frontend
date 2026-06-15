"use client";

import { create } from "zustand";
import type { AssistantCommandResponse } from "@/lib/erp-types";
import { UserRole } from "@/types/navigation";

export type ToastMessage = {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
};

type UiState = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  commandPaletteOpen: boolean;
  assistantPanelOpen: boolean;
  notificationCenterOpen: boolean;
  assistantSession: AssistantCommandResponse | null;
  role: UserRole;
  toasts: ToastMessage[];
  setRole: (role: UserRole) => void;
  setAssistantSession: (session: AssistantCommandResponse | null) => void;
  clearAssistantSession: () => void;
  resetUi: () => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: (open?: boolean) => void;
  toggleCommandPalette: (open?: boolean) => void;
  toggleAssistantPanel: (open?: boolean) => void;
  toggleNotificationCenter: (open?: boolean) => void;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  commandPaletteOpen: false,
  assistantPanelOpen: false,
  notificationCenterOpen: false,
  assistantSession: null,
  role: "manager",
  toasts: [],
  setRole: (role) => set({ role }),
  setAssistantSession: (assistantSession) => set({ assistantSession }),
  clearAssistantSession: () => set({ assistantSession: null }),
  resetUi: () => set({
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    commandPaletteOpen: false,
    assistantPanelOpen: false,
    notificationCenterOpen: false,
    assistantSession: null,
    role: "manager",
    toasts: [],
  }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleMobileSidebar: (open) =>
    set((state) => ({ mobileSidebarOpen: typeof open === "boolean" ? open : !state.mobileSidebarOpen })),
  toggleCommandPalette: (open) =>
    set((state) => ({ commandPaletteOpen: typeof open === "boolean" ? open : !state.commandPaletteOpen })),
  toggleAssistantPanel: (open) =>
    set((state) => ({ assistantPanelOpen: typeof open === "boolean" ? open : !state.assistantPanelOpen })),
  toggleNotificationCenter: (open) =>
    set((state) => ({ notificationCenterOpen: typeof open === "boolean" ? open : !state.notificationCenterOpen })),
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { ...toast, id: Math.random().toString(36).substring(2, 9) }],
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}));

