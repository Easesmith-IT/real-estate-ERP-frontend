"use client";

import { useEffect, useMemo, useState, useRef, CSSProperties } from "react";
import {
  BarChart3,
  BellRing,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronLeft,
  Handshake,
  House,
  Settings2,
  ShoppingCart,
  Users,
  X,
  Search,
  Pin,
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

const groups = [
  {
    title: "INSIGHTS",
    slugs: ["home", "management", "reports-analytics"],
  },
  {
    title: "OPERATIONS",
    slugs: ["projects", "materials", "purchases"],
  },
  {
    title: "WORKFORCE",
    slugs: ["people"],
  },
  {
    title: "SALES & CRM",
    slugs: ["sales"],
  },
  {
    title: "SYSTEM",
    slugs: ["settings"],
  },
];

function SidebarBrand({ isExpanded, className }: { isExpanded: boolean; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-center transition-all duration-300", isExpanded ? "gap-3 px-2" : "justify-center px-0", className)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary text-white shadow-soft transition-transform duration-300 hover:rotate-6">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <div
        className={cn(
          "min-w-0 origin-left",
          isExpanded ? "opacity-100 translate-x-0 max-w-[150px]" : "opacity-0 -translate-x-2 max-w-0 pointer-events-none"
        )}
        style={{
          transition: isExpanded
            ? "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, transform 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, max-width 320ms cubic-bezier(0.22, 1, 0.36, 1)"
            : "opacity 120ms cubic-bezier(0.22, 1, 0.36, 1), transform 120ms cubic-bezier(0.22, 1, 0.36, 1), max-width 200ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <p className="truncate font-secondary text-card-title text-text-primary tracking-tight">NimbusOS</p>
        <p className="text-[10px] font-semibold text-text-muted/80 uppercase tracking-wider">ERP Platform</p>
      </div>
    </div>
  );
}

function SidebarNav({
  isExpanded,
  searchQuery,
  onRouteClick,
}: {
  isExpanded: boolean;
  searchQuery: string;
  onRouteClick?: () => void;
}) {
  const pathname = usePathname();
  const role = useUiStore((state) => state.role);
  
  // Filter sections by role
  const filteredSections = useMemo(
    () => navSections.filter((section) => section.roles.includes(role)),
    [role],
  );

  // Filter sections and pages by search query
  const searchedSections = useMemo(() => {
    if (!searchQuery) return filteredSections;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = (text: string) => text.toLowerCase().includes(query);

    return filteredSections
      .map((section) => {
        const sectionMatches = matchesQuery(section.label);
        const matchedPages = section.pages.filter((page) =>
          matchesQuery(page.label)
        );

        if (sectionMatches || matchedPages.length > 0) {
          return {
            ...section,
            pages: matchedPages.length > 0 ? matchedPages : section.pages,
          };
        }
        return null;
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [filteredSections, searchQuery]);

  // Group sections by headers
  const groupedSections = useMemo(() => {
    return groups
      .map((group) => {
        const sectionsInGroup = searchedSections.filter((s) => group.slugs.includes(s.slug));
        return {
          ...group,
          sections: sectionsInGroup,
        };
      })
      .filter((g) => g.sections.length > 0);
  }, [searchedSections]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleOpen = (slug: string) => {
    setOpenSections((previous) => ({
      ...previous,
      [slug]: !previous[slug],
    }));
  };

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto pb-4 pr-1 scrollbar-none">
      {groupedSections.map((group, groupIndex) => (
        <div key={group.title} className="space-y-1">
          {/* Header */}
          <span
            className={cn(
              "text-[10px] font-bold tracking-wider text-text-muted/65 uppercase px-3 block origin-left",
              isExpanded ? "opacity-100 translate-x-0 max-h-6 mt-4 mb-1" : "opacity-0 -translate-x-2 max-h-0 overflow-hidden pointer-events-none mt-0 mb-0"
            )}
            style={{
              transition: isExpanded
                ? "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, transform 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, max-height 320ms cubic-bezier(0.22, 1, 0.36, 1), margin 320ms cubic-bezier(0.22, 1, 0.36, 1)"
                : "opacity 120ms cubic-bezier(0.22, 1, 0.36, 1), transform 120ms cubic-bezier(0.22, 1, 0.36, 1), max-height 200ms cubic-bezier(0.22, 1, 0.36, 1), margin 200ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {group.title}
          </span>
          {!isExpanded && groupIndex > 0 && (
            <div className="h-[1px] bg-border-soft/45 my-3 mx-2" />
          )}

          {/* Group Sections */}
          <div className="space-y-1">
            {group.sections.map((section, sectionIdx) => {
              const Icon = iconMap[section.icon as keyof typeof iconMap] ?? House;
              const sectionDefaultHref = getSectionDefaultHref(section);
              const sectionActive = pathname === `/${section.slug}` || pathname.startsWith(`/${section.slug}/`);
              // Force expand sections if search query is active
              const expanded = searchQuery ? true : (openSections[section.slug] ?? sectionActive);

              return (
                <div key={section.slug} className="space-y-0.5">
                  <div className="flex items-center gap-1 relative group">
                    <Link
                      href={sectionDefaultHref}
                      onClick={onRouteClick}
                      title={!isExpanded ? section.label : undefined}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-lg text-body relative flex-1 px-3 min-w-0",
                        sectionActive
                          ? "bg-active-soft font-semibold text-accent-primary shadow-[var(--shadow-active-nav)]"
                          : "text-text-secondary hover:bg-hover hover:text-text-primary hover:-translate-y-[1px] hover:shadow-[0_2px_5px_-1px_rgba(15,23,42,0.05)]",
                      )}
                      style={{
                        transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    >
                      {/* Active Left Accent Rail */}
                      {sectionActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-accent-primary rounded-r-md animate-[active-rail-in_200ms_cubic-bezier(0.16,1,0.3,1)_forwards]" />
                      )}
                      
                      <Icon className={cn("h-4.5 w-4.5 shrink-0 transition-transform duration-300", !sectionActive && "group-hover:scale-105")} />
                      
                      {/* Label with Fade-In Animation */}
                      <span
                        className={cn(
                          "truncate origin-left text-[13px]",
                          isExpanded ? "opacity-100 translate-x-0 max-w-[150px]" : "opacity-0 -translate-x-2 max-w-0 pointer-events-none"
                        )}
                        style={{
                          transition: isExpanded
                            ? "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, transform 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, max-width 320ms cubic-bezier(0.22, 1, 0.36, 1)"
                            : "opacity 120ms cubic-bezier(0.22, 1, 0.36, 1), transform 120ms cubic-bezier(0.22, 1, 0.36, 1), max-width 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                          transitionDelay: isExpanded ? `${100 + sectionIdx * 15}ms` : "0ms",
                        }}
                      >
                        {section.label}
                      </span>
                    </Link>

                    {/* Section Expand Chevron */}
                    {isExpanded && !searchQuery ? (
                      <button
                        type="button"
                        onClick={() => toggleOpen(section.slug)}
                        aria-label={expanded ? `Collapse ${section.label}` : `Expand ${section.label}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-hover hover:text-text-primary hover:-translate-y-[1px] hover:shadow-[0_2px_5px_-1px_rgba(15,23,42,0.05)] shrink-0"
                        style={{
                          transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", expanded ? "rotate-180" : "")} />
                      </button>
                    ) : null}
                  </div>

                  {/* Submenu Slide-Down */}
                  <div
                    className="overflow-hidden"
                    style={{
                      transition: "max-height 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1), margin-top 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                      maxHeight: expanded && isExpanded ? "500px" : "0px",
                      opacity: expanded && isExpanded ? 1 : 0,
                      transform: expanded && isExpanded ? "translateY(0)" : "translateY(-6px)",
                      marginTop: expanded && isExpanded ? "4px" : "0px",
                    }}
                  >
                    <div className="ml-6.5 space-y-0.5 border-l border-border-soft pl-3 py-0.5">
                      {section.pages.map((page) => {
                        const href = getPageHref(section.slug, page.slug);
                        const active = pathname === href;

                        return (
                          <Link
                            key={page.slug}
                            href={href}
                            onClick={onRouteClick}
                            className={cn(
                              "block rounded-md px-3 py-1.5 text-xs relative",
                              active
                                ? "bg-active-soft font-semibold text-accent-primary"
                                : "text-text-secondary hover:bg-hover hover:text-text-primary hover:-translate-y-[0.5px] hover:shadow-[0_1px_3px_rgba(15,23,42,0.03)]",
                            )}
                            style={{
                              transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                            }}
                          >
                            {/* Active Dot / Rail inside border guide */}
                            {active && (
                              <div className="absolute left-[-13.5px] top-1/2 -translate-y-1/2 w-[3px] h-3 bg-accent-primary rounded-r-md" />
                            )}
                            {page.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);

  const [isHovered, setIsHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    toggleMobileSidebar(false);
  }, [pathname, toggleMobileSidebar]);

  // Collapsed hover delay handlers
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (sidebarCollapsed) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(true);
      }, 150);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (sidebarCollapsed) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 200);
    }
  };

  // Expand collapsed sidebar & focus search input
  const handleSearchClick = () => {
    setIsHovered(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 180);
  };

  // Document Click outside listener for hover-expanded sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsHovered(false);
      }
    };

    if (isHovered) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHovered]);

  const isExpanded = !sidebarCollapsed || isHovered;

  return (
    <>
      {/* Backdrop for Desktop Hover-Expanded state */}
      {sidebarCollapsed && isHovered && (
        <div
          className="fixed inset-0 z-[calc(var(--z-sidebar)-1)] bg-slate-900/[0.04] backdrop-blur-[2px] pointer-events-auto animate-[backdrop-fade-in_250ms_cubic-bezier(0.22,1,0.36,1)_forwards]"
          onClick={() => setIsHovered(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "sidebar-rail fixed bottom-5 left-5 top-5 z-[var(--z-sidebar)] hidden flex-col px-4 py-5 lg:flex select-none",
          isExpanded ? "w-[260px]" : "w-[80px]",
        )}
      >
        {/* Brand Logo */}
        <SidebarBrand isExpanded={isExpanded} />

        {/* Sidebar Search Bar */}
        {isExpanded ? (
          <div
            className="relative mx-1 mb-4 animate-[backdrop-fade-in_250ms_cubic-bezier(0.22,1,0.36,1)_forwards]"
          >
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search navigation..."
              className="w-full h-9 rounded-lg border border-border-soft/60 bg-surface-secondary/40 pl-8 pr-8 text-xs placeholder:text-text-muted/70 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent-primary/20 focus:border-accent-primary/30 transition-all subtle-hover"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary subtle-hover"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSearchClick}
            title="Search navigation"
            className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-text-muted hover:bg-hover hover:text-text-primary hover:-translate-y-[1px] hover:shadow-[0_2px_5px_-1px_rgba(15,23,42,0.05)] transition-all"
            style={{
              transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <Search className="h-4.5 w-4.5" />
          </button>
        )}

        {/* Navigation List */}
        <SidebarNav isExpanded={isExpanded} searchQuery={searchQuery} />

        {/* Bottom Pinned / Collapse Button */}
        <button
          type="button"
          onClick={() => {
            toggleSidebar();
            if (sidebarCollapsed) {
              setIsHovered(false);
            }
          }}
          className={cn(
            "flex h-10 items-center gap-3 rounded-xl px-3 text-label text-text-muted hover:bg-hover hover:text-text-primary border border-transparent hover:border-border-soft hover:-translate-y-[1px] hover:shadow-[0_2px_5px_-1px_rgba(15,23,42,0.05)] transition-all",
            !isExpanded ? "w-10 h-10 justify-center p-0 mx-auto" : "w-full"
          )}
          style={{
            transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {!sidebarCollapsed ? (
            <>
              <ChevronLeft className="h-4.5 w-4.5 shrink-0 transition-transform duration-300" />
              <span
                className={cn(
                  "origin-left whitespace-nowrap",
                  isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                )}
                style={{
                  transition: isExpanded
                    ? "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, transform 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms"
                    : "opacity 120ms cubic-bezier(0.22, 1, 0.36, 1), transform 120ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                Collapse
              </span>
            </>
          ) : (
            <>
              <Pin className={cn("h-4 w-4 shrink-0 transition-all duration-300", isHovered ? "rotate-45 text-accent-primary" : "")} />
              <span
                className={cn(
                  "origin-left whitespace-nowrap",
                  isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                )}
                style={{
                  transition: isExpanded
                    ? "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, transform 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms"
                    : "opacity 120ms cubic-bezier(0.22, 1, 0.36, 1), transform 120ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                Pin Sidebar
              </span>
            </>
          )}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay/Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[var(--z-overlay)] bg-overlay transition-opacity lg:hidden",
          mobileSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => toggleMobileSidebar(false)}
      />

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "sidebar-rail fixed bottom-4 left-4 top-4 z-[calc(var(--z-overlay)+1)] flex w-[260px] flex-col px-4 py-5 transition-transform duration-300 lg:hidden select-none",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-[115%]",
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <SidebarBrand isExpanded={true} className="mb-0" />
          <button
            type="button"
            onClick={() => toggleMobileSidebar(false)}
            className="subtle-hover inline-flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-hover hover:text-text-primary"
            aria-label="Close mobile sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Search Bar */}
        <div className="relative mx-1 mb-4">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search navigation..."
            className="w-full h-9 rounded-lg border border-border-soft/60 bg-surface-secondary/40 pl-8 pr-8 text-xs placeholder:text-text-muted/70 focus:bg-surface focus:outline-none transition-all subtle-hover"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary subtle-hover"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <SidebarNav isExpanded={true} searchQuery={searchQuery} onRouteClick={() => toggleMobileSidebar(false)} />
      </aside>
    </>
  );
}
