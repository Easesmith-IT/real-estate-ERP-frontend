"use client";

import { create } from "zustand";
import { UserRole } from "@/types/navigation";

type UiState = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  commandPaletteOpen: boolean;
  assistantPanelOpen: boolean;
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: (open?: boolean) => void;
  toggleCommandPalette: (open?: boolean) => void;
  toggleAssistantPanel: (open?: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  commandPaletteOpen: false,
  assistantPanelOpen: false,
  role: "manager",
  setRole: (role) => set({ role }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleMobileSidebar: (open) =>
    set((state) => ({ mobileSidebarOpen: typeof open === "boolean" ? open : !state.mobileSidebarOpen })),
  toggleCommandPalette: (open) =>
    set((state) => ({ commandPaletteOpen: typeof open === "boolean" ? open : !state.commandPaletteOpen })),
  toggleAssistantPanel: (open) =>
    set((state) => ({ assistantPanelOpen: typeof open === "boolean" ? open : !state.assistantPanelOpen })),
}));
