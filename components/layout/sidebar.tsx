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
  HelpCircle,
  LogOut,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSectionDefaultHref, getPageHref, navSections, roleLabelMap } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";

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
  Search,
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

const collapsedGroups = [
  {
    title: "Core Workspace",
    sections: [
      { slug: "home", icon: "House", label: "Dashboard" },
      { type: "search", icon: "Search", label: "Search" }
    ]
  },
  {
    title: "Operations",
    sections: [
      { slug: "projects", icon: "Building2", label: "Projects" },
      { slug: "people", icon: "Users", label: "Workforce" },
      { slug: "materials", icon: "Boxes", label: "Materials" },
      { slug: "purchases", icon: "ShoppingCart", label: "Procurement" }
    ]
  },
  {
    title: "Business",
    sections: [
      { slug: "sales", icon: "Handshake", label: "Sales" },
      { slug: "reports-analytics", icon: "BarChart3", label: "Reports" },
      { slug: "management", icon: "BriefcaseBusiness", label: "Management" }
    ]
  }
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
  onSearchClick,
}: {
  isExpanded: boolean;
  searchQuery: string;
  onRouteClick?: () => void;
  onSearchClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useUiStore((state) => state.role);
  const setRole = useUiStore((state) => state.setRole);
  const toggleAssistantPanel = useUiStore((state) => state.toggleAssistantPanel);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [profileMenuOpen]);
  
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

  // Group sections by headers for expanded sidebar
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

  const scrollableGroups = useMemo(() => {
    return groupedSections.filter((g) => g.title !== "SYSTEM");
  }, [groupedSections]);

  const systemGroup = useMemo(() => {
    return groupedSections.find((g) => g.title === "SYSTEM");
  }, [groupedSections]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleOpen = (slug: string) => {
    setOpenSections((previous) => ({
      ...previous,
      [slug]: !previous[slug],
    }));
  };

  // Filtered groups for collapsed state
  const filteredCollapsedGroups = useMemo(() => {
    return collapsedGroups.map(group => {
      const activeSections = group.sections.filter(sec => {
        if (sec.type === "search") return true;
        return filteredSections.some(fs => fs.slug === sec.slug);
      });
      return {
        ...group,
        sections: activeSections
      };
    }).filter(g => g.sections.length > 0);
  }, [filteredSections]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {isExpanded ? (
        <>
          {/* Scrollable Navigation Items */}
          <nav className="flex-1 space-y-3.5 overflow-y-auto pb-2 pr-1 scrollbar-none">
            {scrollableGroups.map((group, groupIndex) => (
              <div key={group.title} className="space-y-1">
                {/* Header */}
                <span
                  className={cn(
                    "text-[10px] font-bold tracking-wider text-text-muted/65 uppercase px-3 block origin-left",
                    "opacity-100 translate-x-0 max-h-6 mt-3.5 mb-1"
                  )}
                  style={{
                    transition: "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, transform 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, max-height 320ms cubic-bezier(0.22, 1, 0.36, 1), margin 320ms cubic-bezier(0.22, 1, 0.36, 1)"
                  }}
                >
                  {group.title}
                </span>

                {/* Group Sections Container */}
                <div className="bg-slate-500/[0.02] border border-border-soft/30 rounded-xl p-1 space-y-0.5">
                  {group.sections.map((section, sectionIdx) => {
                    const Icon = iconMap[section.icon as keyof typeof iconMap] ?? House;
                    const sectionDefaultHref = getSectionDefaultHref(section);
                    const sectionActive = pathname === `/${section.slug}` || pathname.startsWith(`/${section.slug}/`);
                    // Force expand sections if search query is active
                    const expanded = searchQuery ? true : (openSections[section.slug] ?? sectionActive);

                    return (
                      <div key={section.slug} className="w-full space-y-0.5">
                        <div className="flex items-center gap-1 relative group">
                          <Link
                            href={sectionDefaultHref}
                            onClick={onRouteClick}
                            className={cn(
                              "flex items-center rounded-lg text-body relative min-w-0 transition-all duration-180 ease-out",
                              "flex-1 h-9.5 gap-3 px-3 justify-start",
                              sectionActive
                                ? "bg-accent-primary/[0.08] font-semibold text-accent-primary shadow-[var(--shadow-active-nav)]"
                                : "text-text-secondary hover:bg-hover hover:text-text-primary hover:scale-[1.03] hover:shadow-[0_2px_5px_-1px_rgba(15,23,42,0.05)]",
                            )}
                          >
                            {/* Active Left Accent Rail */}
                            {sectionActive && (
                              <div className="absolute bg-accent-primary rounded-full animate-[active-rail-in_240ms_cubic-bezier(0.16,1,0.3,1)_forwards] left-1.5 top-2.5 bottom-2.5 w-[3px]" />
                            )}
                            
                            <Icon className={cn("h-4.5 w-4.5 shrink-0 transition-transform duration-180", !sectionActive && "group-hover:scale-105")} />
                            
                            {/* Label with Fade-In Animation */}
                            <span
                              className="truncate origin-left text-[13px] opacity-100 translate-x-0 max-w-[150px]"
                              style={{
                                transition: "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, transform 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, max-width 320ms cubic-bezier(0.22, 1, 0.36, 1)",
                                transitionDelay: `${100 + sectionIdx * 15}ms`,
                              }}
                            >
                              {section.label}
                            </span>
                          </Link>

                          {/* Section Expand Chevron */}
                          {!searchQuery ? (
                            <button
                              type="button"
                              onClick={() => toggleOpen(section.slug)}
                              aria-label={expanded ? `Collapse ${section.label}` : `Expand ${section.label}`}
                              className="flex h-8.5 w-8.5 items-center justify-center rounded-lg text-text-muted hover:bg-hover hover:text-text-primary hover:-translate-y-[1px] hover:shadow-[0_2px_5px_-1px_rgba(15,23,42,0.05)] shrink-0"
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
                            maxHeight: expanded ? "500px" : "0px",
                            opacity: expanded ? 1 : 0,
                            transform: expanded ? "translateY(0)" : "translateY(-6px)",
                            marginTop: expanded ? "4px" : "0px",
                          }}
                        >
                          <div className="ml-5 space-y-0.5 border-l border-border-soft pl-3.5 py-0.5">
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
                                  {active && (
                                    <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-[3px] h-3 bg-accent-primary rounded-r-md" />
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

          {/* Pinned Bottom Navigation (Settings) */}
          {systemGroup && (
            <div className="pt-2 border-t border-border-soft/45 mt-2 space-y-1">
              <span
                className="text-[10px] font-bold tracking-wider text-text-muted/65 uppercase px-3 block origin-left opacity-100 translate-x-0 max-h-6 mb-1"
                style={{
                  transition: "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, transform 220ms cubic-bezier(0.22, 1, 0.36, 1) 100ms"
                }}
              >
                {systemGroup.title}
              </span>
              <div className="bg-slate-500/[0.02] border border-border-soft/30 rounded-xl p-1 space-y-0.5">
                {systemGroup.sections.map((section) => {
                  const Icon = iconMap[section.icon as keyof typeof iconMap] ?? House;
                  const sectionDefaultHref = getSectionDefaultHref(section);
                  const sectionActive = pathname === `/${section.slug}` || pathname.startsWith(`/${section.slug}/`);
                  const expanded = searchQuery ? true : (openSections[section.slug] ?? sectionActive);

                  return (
                    <div key={section.slug} className="w-full space-y-0.5">
                      <div className="flex items-center gap-1 relative group">
                        <Link
                          href={sectionDefaultHref}
                          onClick={onRouteClick}
                          className={cn(
                            "flex items-center rounded-lg text-body relative min-w-0 transition-all duration-180 ease-out",
                            "flex-1 h-9.5 gap-3 px-3 justify-start",
                            sectionActive
                              ? "bg-accent-primary/[0.08] font-semibold text-accent-primary shadow-[var(--shadow-active-nav)]"
                              : "text-text-secondary hover:bg-hover hover:text-text-primary hover:scale-[1.03] hover:shadow-[0_2px_5px_-1px_rgba(15,23,42,0.05)]",
                          )}
                        >
                          {sectionActive && (
                            <div className="absolute bg-accent-primary rounded-full animate-[active-rail-in_240ms_cubic-bezier(0.16,1,0.3,1)_forwards] left-1.5 top-2.5 bottom-2.5 w-[3px]" />
                          )}
                          <Icon className={cn("h-4.5 w-4.5 shrink-0 transition-transform duration-180", !sectionActive && "group-hover:scale-105")} />
                          <span className="truncate origin-left text-[13px] opacity-100 translate-x-0 max-w-[150px]">
                            {section.label}
                          </span>
                        </Link>
                        {!searchQuery ? (
                          <button
                            type="button"
                            onClick={() => toggleOpen(section.slug)}
                            className="flex h-8.5 w-8.5 items-center justify-center rounded-lg text-text-muted hover:bg-hover hover:text-text-primary hover:-translate-y-[1px] shrink-0 transition-all duration-200"
                          >
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", expanded ? "rotate-180" : "")} />
                          </button>
                        ) : null}
                      </div>
                      <div
                        className="overflow-hidden"
                        style={{
                          transition: "max-height 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1), margin-top 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                          maxHeight: expanded ? "500px" : "0px",
                          opacity: expanded ? 1 : 0,
                          transform: expanded ? "translateY(0)" : "translateY(-6px)",
                          marginTop: expanded ? "4px" : "0px",
                        }}
                      >
                        <div className="ml-5 space-y-0.5 border-l border-border-soft pl-3.5 py-0.5">
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
                                {active && (
                                  <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-[3px] h-3 bg-accent-primary rounded-r-md" />
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
          )}
        </>
      ) : (
        <>
          {/* Collapsed Rail Scrollable Navigation */}
          <nav className="flex-1 space-y-3 overflow-y-auto pb-2 pr-0.5 scrollbar-none flex flex-col items-center w-full">
            {filteredCollapsedGroups.map((group, groupIndex) => (
              <div key={group.title} className="w-full flex flex-col items-center space-y-1">
                {/* Separator Line between groups */}
                {groupIndex > 0 && (
                  <div className="h-[1px] bg-border-soft/45 w-8 mx-auto my-1.5" />
                )}

                {/* Group Sections Card */}
                <div className="flex flex-col items-center gap-1.5 bg-slate-500/[0.02] border border-border-soft/20 rounded-xl p-1 w-12 mx-auto">
                  {group.sections.map((section) => {
                    const isSearch = section.type === "search";
                    const sectionActive = !isSearch && (pathname === `/${section.slug}` || pathname.startsWith(`/${section.slug}/`) || (section.slug === "home" && pathname === "/"));
                    const Icon = iconMap[section.icon as keyof typeof iconMap] ?? House;

                    if (isSearch) {
                      return (
                        <div key="search-section" className="relative group flex items-center justify-center w-full">
                          <button
                            type="button"
                            onClick={onSearchClick}
                            aria-label="Search navigation"
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-hover hover:text-text-primary hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary transition-all duration-180 ease-out"
                          >
                            <Search className="h-4.5 w-4.5 shrink-0" />
                          </button>

                          {/* Tooltip */}
                          <div role="tooltip" className="pointer-events-none absolute left-full ml-4 z-[var(--z-modal)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 ease-out">
                            <div className="flex items-center rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-enterprise whitespace-nowrap">
                              Search Navigation
                              <div className="absolute right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900 mr-[-0.5px]" />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const href = getSectionDefaultHref(navSections.find(ns => ns.slug === section.slug)!);

                    return (
                      <div key={section.slug} className="relative group flex items-center justify-center w-full">
                        {/* Active Left Indicator Bar */}
                        {sectionActive && (
                          <div className="absolute left-[3px] top-2 bottom-2 w-[3px] bg-accent-primary rounded-full animate-[active-rail-in_240ms_cubic-bezier(0.16,1,0.3,1)_forwards]" />
                        )}

                        <Link
                          href={href}
                          onClick={onRouteClick}
                          aria-label={section.label}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary transition-all duration-180 ease-out",
                            sectionActive
                              ? "bg-accent-primary/[0.08] text-accent-primary shadow-soft font-semibold"
                              : "text-text-secondary hover:bg-hover hover:text-text-primary hover:scale-[1.02]"
                          )}
                        >
                          <Icon className="h-4.5 w-4.5 shrink-0" />
                        </Link>

                        {/* Tooltip */}
                        <div role="tooltip" className="pointer-events-none absolute left-full ml-4 z-[var(--z-modal)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 ease-out">
                          <div className="flex items-center rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-enterprise whitespace-nowrap">
                            {section.label}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900 mr-[-0.5px]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Divider above utilities */}
          <div className="h-[1px] bg-border-soft/40 w-8 mx-auto my-2 shrink-0" />

          {/* Collapsed Bottom Utility Block */}
          <div className="flex flex-col items-center gap-1.5 bg-slate-500/[0.02] border border-border-soft/20 rounded-xl p-1 w-12 mx-auto shrink-0 mb-1">
            {/* Settings */}
            <div className="relative group flex items-center justify-center w-full">
              <Link
                href="/settings/company-settings"
                onClick={onRouteClick}
                aria-label="Settings"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary transition-all duration-180 ease-out",
                  pathname.startsWith("/settings")
                    ? "bg-accent-primary/[0.08] text-accent-primary shadow-soft"
                    : "text-text-secondary hover:bg-hover hover:text-text-primary hover:scale-[1.02]"
                )}
              >
                <Settings2 className="h-4.5 w-4.5 shrink-0" />
              </Link>
              {pathname.startsWith("/settings") && (
                <div className="absolute left-[3px] top-2 bottom-2 w-[3px] bg-accent-primary rounded-full animate-[active-rail-in_240ms_cubic-bezier(0.16,1,0.3,1)_forwards]" />
              )}
              <div role="tooltip" className="pointer-events-none absolute left-full ml-4 z-[var(--z-modal)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 ease-out">
                <div className="flex items-center rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-enterprise whitespace-nowrap">
                  Settings
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900 mr-[-0.5px]" />
                </div>
              </div>
            </div>


            {/* Profile Avatar Trigger */}
            <div className="relative group flex items-center justify-center w-full">
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-label={`User Profile: ${user?.name || "User"}`}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary transition-all duration-180 ease-out",
                  profileMenuOpen
                    ? "bg-accent-primary/20 text-accent-primary shadow-soft"
                    : "bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 hover:scale-[1.02]"
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                  {user?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                </span>
              </button>
              
              {/* Tooltip */}
              {!profileMenuOpen && (
                <div role="tooltip" className="pointer-events-none absolute left-full ml-4 z-[var(--z-modal)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 ease-out">
                  <div className="flex items-center rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-enterprise whitespace-nowrap">
                    Profile: {user?.name || "User"}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900 mr-[-0.5px]" />
                  </div>
                </div>
              )}

              {/* Profile Context Switcher Floating Panel */}
              {profileMenuOpen && (
                <div 
                  ref={profileMenuRef}
                  className="absolute left-full ml-3 bottom-0 w-[240px] rounded-2xl border border-border-soft bg-surface p-3 shadow-floating animate-page-in z-[var(--z-modal)] text-left"
                >
                  {/* Summary */}
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-border-soft">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-primary text-xs font-semibold text-white shadow-soft">
                      {user?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary text-xs truncate leading-none">{user?.name || "User"}</p>
                      <p className="text-[10px] text-text-muted truncate mt-1">{user?.email}</p>
                    </div>
                  </div>
                  
                  {/* Switch Profile */}
                  <div className="mt-3">
                    <p className="px-1 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-text-muted">
                      Switch User Profile
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {(Object.keys(roleLabelMap) as Array<keyof typeof roleLabelMap>).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            setRole(r);
                            setProfileMenuOpen(false);
                            router.refresh();
                          }}
                          className={cn(
                            "rounded-lg px-2 py-1 text-center text-[9px] font-semibold transition-colors subtle-hover uppercase tracking-wider",
                            role === r
                              ? "bg-accent-primary text-white shadow-soft"
                              : "bg-surface-secondary text-text-secondary hover:bg-hover"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sign Out */}
                  <div className="mt-3 pt-2 border-t border-border-soft">
                    <button
                      onClick={() => {
                        logout();
                        router.push("/login");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-error hover:bg-error/10 hover:text-error transition-colors subtle-hover"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
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
          "sidebar-rail fixed bottom-5 left-5 top-5 z-[var(--z-sidebar)] hidden flex-col lg:flex select-none transition-all duration-320",
          isExpanded ? "w-[260px] px-4 py-5" : "w-[64px] px-2 py-4",
        )}
      >
        {/* Brand Logo */}
        <SidebarBrand isExpanded={isExpanded} />

        {/* Sidebar Search Bar */}
        {isExpanded && (
          <div
            className="relative mx-1 mb-3.5 animate-[backdrop-fade-in_250ms_cubic-bezier(0.22,1,0.36,1)_forwards]"
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
        )}

        {/* Navigation List */}
        <SidebarNav isExpanded={isExpanded} searchQuery={searchQuery} onSearchClick={handleSearchClick} />

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
            "flex items-center gap-3 rounded-xl text-label text-text-muted hover:bg-hover hover:text-text-primary border border-transparent hover:border-border-soft hover:scale-[1.03] transition-all relative group mt-3",
            isExpanded ? "w-full h-9.5 px-3" : "w-9 h-9 justify-center p-0 mx-auto"
          )}
          style={{
            transition: "all 180ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {!sidebarCollapsed ? (
            <>
              <ChevronLeft className="h-4.5 w-4.5 shrink-0 transition-transform duration-300" />
              <span
                className={cn(
                  "origin-left whitespace-nowrap text-[12px]",
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
                  "origin-left whitespace-nowrap text-[12px]",
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

          {/* Custom Tooltip */}
          {!isExpanded && (
            <div className="pointer-events-none absolute left-full ml-4 z-[var(--z-modal)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-180 ease-out">
              <div className="flex items-center rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-enterprise whitespace-nowrap">
                {!sidebarCollapsed ? "Collapse" : "Pin Sidebar"}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900 mr-[-0.5px]" />
              </div>
            </div>
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

        <SidebarNav isExpanded={true} searchQuery={searchQuery} onRouteClick={() => toggleMobileSidebar(false)} onSearchClick={() => {}} />
      </aside>
    </>
  );
}
