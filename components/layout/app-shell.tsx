"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AICommandPalette } from "@/components/ai/command-palette";
import { NotificationCenter } from "@/components/ai/notification-center";
import { WorkflowAssistantPanel } from "@/components/ai/workflow-assistant-panel";
import { ToastContainer } from "@/components/ui/toast";

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleCommandPalette = useUiStore((state) => state.toggleCommandPalette);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const sidebarWidth = sidebarCollapsed ? "80px" : "260px";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggleCommandPalette();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCommandPalette]);

  useEffect(() => {
    const node = scrollRootRef.current;
    if (!node) return;

    const onScroll = () => setScrolled(node.scrollTop > 6);
    onScroll();
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="h-dvh overflow-hidden bg-app p-4 text-text-primary lg:p-5"
      style={{ "--sidebar-width": sidebarWidth } as CSSProperties}
    >
      <Sidebar />
      <div
        ref={scrollRootRef}
        className={cn(
          "scroll-root h-[calc(100dvh-var(--app-pad-sm)*2)] overflow-y-auto overflow-x-hidden lg:h-[calc(100dvh-var(--app-pad-lg)*2)]",
          "ml-0 lg:ml-[calc(var(--sidebar-width)+var(--app-pad-lg))]",
        )}
        style={{ transition: "margin-left 320ms cubic-bezier(0.22, 1, 0.36, 1)" } as CSSProperties}
        data-scrolled={scrolled ? "true" : "false"}
      >
        <Topbar scrolled={scrolled} />
        <main className="surface-workspace section-separator animate-page-in relative z-[var(--z-content)] mt-[var(--section-gap)] px-6 pb-8 pt-6 lg:px-7">
          {children}
        </main>
      </div>
      <AICommandPalette />
      <NotificationCenter />
      <WorkflowAssistantPanel />
      <ToastContainer />
    </div>
  );
}

