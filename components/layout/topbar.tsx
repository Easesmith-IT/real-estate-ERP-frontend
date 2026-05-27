"use client";

import { useEffect, useRef } from "react";
import { Bell, ChevronsLeftRight, Menu, Plus, Sparkles, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getBreadcrumbs, roleLabelMap } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar({ scrolled = false }: { scrolled?: boolean }) {
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const role = useUiStore((state) => state.role);
  const setRole = useUiStore((state) => state.setRole);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);
  const toggleCommandPalette = useUiStore((state) => state.toggleCommandPalette);
  const breadcrumbs = getBreadcrumbs(pathname);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
        const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
        if (activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
          event.preventDefault();
          searchRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header
      className={cn(
        "topbar-floating sticky-layer sticky top-0 z-[var(--z-topbar)]",
        scrolled ? "px-4 py-3 lg:px-5" : "px-5 py-4 lg:px-6",
      )}
      data-scrolled={scrolled ? "true" : "false"}
    >
      <div className="flex min-h-12 flex-wrap items-center gap-2 lg:flex-nowrap lg:gap-3">
        <Button variant="ghost" size="sm" onClick={() => toggleMobileSidebar(true)} className="shrink-0 lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={toggleSidebar} className="hidden shrink-0 text-text-secondary lg:inline-flex">
          <ChevronsLeftRight className="h-4 w-4" />
          <span>Layout</span>
        </Button>

        <div className="min-w-[220px] flex-1 lg:max-w-[680px]">
          <Input
            ref={searchRef}
            placeholder="Global search: projects, workforce, materials ( / )"
            className={cn(
              "search-elevated h-11 bg-surface placeholder:text-text-muted placeholder:tracking-[0.01em]",
              scrolled ? "shadow-soft" : "shadow-search",
            )}
          />
        </div>

        <Button variant="ai" size="md" onClick={() => toggleCommandPalette(true)} className="hidden shrink-0 md:inline-flex">
          <Sparkles className="h-4 w-4" />
          <span>AI Command</span>
          <span className="ml-1 hidden rounded bg-surface-secondary px-1.5 py-0.5 text-label text-text-muted xl:inline">
            Ctrl + K
          </span>
        </Button>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <select
            aria-label="Select project cluster"
            className="hidden h-10 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-body text-text-secondary subtle-hover focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] xl:block"
            defaultValue="north-zone"
          >
            <option value="north-zone">North Zone Portfolio</option>
            <option value="south-zone">South Zone Portfolio</option>
            <option value="west-zone">West Zone Portfolio</option>
          </select>

          <select
            aria-label="Select role"
            className="h-10 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-body text-text-secondary subtle-hover focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]"
            value={role}
            onChange={(event) => setRole(event.target.value as typeof role)}
          >
            {Object.entries(roleLabelMap).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>

          <Button variant="secondary" size="md" className="hidden 2xl:inline-flex">
            <Plus className="h-4 w-4" />
            Quick Actions
          </Button>

          <Button variant="ghost" size="sm" title="Notifications" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" title="Profile" aria-label="Profile">
            <UserCircle2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <nav
        aria-label="Breadcrumb"
        className="topbar-breadcrumbs mt-3 flex flex-wrap items-center gap-1.5 border-t border-border-soft pt-3 text-label text-text-muted subtle-hover"
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <span key={`${crumb.href}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {isLast ? (
                <span className="text-text-secondary" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-text-primary subtle-hover">
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </header>
  );
}
