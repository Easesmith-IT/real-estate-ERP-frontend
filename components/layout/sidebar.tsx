"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BellRing,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Handshake,
  House,
  Settings2,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSectionDefaultHref, getPageHref, navSections } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

const iconMap = {
  House,
  Users,
  Handshake,
  Building2,
  Boxes,
  ShoppingCart,
  BarChart3,
  BriefcaseBusiness,
  BellRing,
  Settings2,
};

function SidebarBrand({ collapsed, className }: { collapsed: boolean; className?: string }) {
  return (
    <div className={cn("mb-5 flex items-center", collapsed ? "justify-center" : "gap-3 px-2", className)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary text-white shadow-soft">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate font-secondary text-card-title text-text-primary">NimbusOS</p>
          <p className="text-label text-text-muted">Construction ERP</p>
        </div>
      ) : null}
    </div>
  );
}

function SidebarNav({
  collapsed,
  onRouteClick,
}: {
  collapsed: boolean;
  onRouteClick?: () => void;
}) {
  const pathname = usePathname();
  const role = useUiStore((state) => state.role);
  const filteredSections = useMemo(
    () => navSections.filter((section) => section.roles.includes(role)),
    [role],
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleOpen = (slug: string) => {
    setOpenSections((previous) => ({
      ...previous,
      [slug]: !previous[slug],
    }));
  };

  return (
    <nav className="flex-1 space-y-2 overflow-y-auto pb-4">
      {filteredSections.map((section) => {
        const Icon = iconMap[section.icon as keyof typeof iconMap] ?? House;
        const sectionDefaultHref = getSectionDefaultHref(section);
        const sectionActive = pathname === `/${section.slug}` || pathname.startsWith(`/${section.slug}/`);
        const expanded = openSections[section.slug] ?? sectionActive;

        return (
          <div key={section.slug} className="space-y-1">
            <div className="flex items-center gap-1">
              <Link
                href={sectionDefaultHref}
                onClick={onRouteClick}
                title={collapsed ? section.label : undefined}
                className={cn(
                  "subtle-hover flex h-11 items-center gap-3 rounded-[12px] text-body",
                  collapsed ? "w-full justify-center px-0" : "min-w-0 flex-1 px-3",
                  sectionActive
                    ? "bg-active-soft font-medium text-accent-primary shadow-[var(--shadow-active-nav)]"
                    : "text-text-secondary hover:bg-hover hover:text-text-primary",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span className="truncate">{section.label}</span> : null}
              </Link>
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleOpen(section.slug)}
                  aria-label={expanded ? `Collapse ${section.label}` : `Expand ${section.label}`}
                  className="subtle-hover flex h-10 w-10 items-center justify-center rounded-[12px] text-text-muted hover:bg-hover hover:text-text-primary"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "")} />
                </button>
              ) : null}
            </div>

            {!collapsed && expanded ? (
              <div className="ml-7 space-y-1 border-l border-border-soft pl-3">
                {section.pages.map((page) => {
                  const href = getPageHref(section.slug, page.slug);
                  const active = pathname === href;

                  return (
                    <Link
                      key={page.slug}
                      href={href}
                      onClick={onRouteClick}
                      className={cn(
                        "subtle-hover block rounded-[10px] px-3 py-2 text-body",
                        active
                          ? "bg-active-soft font-medium text-accent-primary"
                          : "text-text-secondary hover:bg-hover hover:text-text-primary",
                      )}
                    >
                      {page.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);

  useEffect(() => {
    toggleMobileSidebar(false);
  }, [pathname, toggleMobileSidebar]);

  return (
    <>
      <aside
        className={cn(
          "sidebar-rail fixed bottom-5 left-5 top-5 z-[var(--z-sidebar)] hidden flex-col px-4 py-5 lg:flex",
          sidebarCollapsed ? "w-[88px]" : "w-[320px]",
        )}
      >
        <SidebarBrand collapsed={sidebarCollapsed} />
        <SidebarNav collapsed={sidebarCollapsed} />
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "subtle-hover mt-2 flex h-9 items-center gap-2 rounded-xl px-3 text-label text-text-muted hover:bg-hover hover:text-text-primary",
            sidebarCollapsed ? "justify-center" : "",
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-[var(--z-overlay)] bg-overlay transition-opacity lg:hidden",
          mobileSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => toggleMobileSidebar(false)}
      />
      <aside
        className={cn(
          "sidebar-rail fixed bottom-4 left-4 top-4 z-[calc(var(--z-overlay)+1)] flex w-[300px] flex-col px-4 py-5 transition-transform duration-200 lg:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-[115%]",
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <SidebarBrand collapsed={false} className="mb-0" />
          <button
            type="button"
            onClick={() => toggleMobileSidebar(false)}
            className="subtle-hover inline-flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-hover hover:text-text-primary"
            aria-label="Close mobile sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarNav collapsed={false} onRouteClick={() => toggleMobileSidebar(false)} />
      </aside>
    </>
  );
}
