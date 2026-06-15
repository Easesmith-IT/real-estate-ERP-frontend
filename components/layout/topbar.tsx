"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Bell, 
  LogOut, 
  Menu, 
  Plus, 
  Sparkles, 
  Search, 
  ChevronDown, 
  User, 
  Settings, 
  ShieldCheck, 
  TriangleAlert, 
  BadgeCheck, 
  IndianRupee, 
  Activity,
  Layers,
  Building2,
  Briefcase,
  Package,
  Clock3,
  Bookmark
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/erp-api";
import type {
  NotificationsResponse,
  AssistantOverviewResponse,
  AssistantCommandResponse,
  DashboardOverviewResponse,
} from "@/lib/erp-types";
import { getBreadcrumbs, roleLabelMap, navSections } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Topbar({ scrolled = false }: { scrolled?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  
  // UI States & Actions
  const role = useUiStore((state) => state.role);
  const setRole = useUiStore((state) => state.setRole);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);
  const toggleCommandPalette = useUiStore((state) => state.toggleCommandPalette);
  const toggleAssistantPanel = useUiStore((state) => state.toggleAssistantPanel);
  const toggleNotificationCenter = useUiStore((state) => state.toggleNotificationCenter);
  const setAssistantSession = useUiStore((state) => state.setAssistantSession);
  const breadcrumbs = getBreadcrumbs(pathname);

  // Dropdown states
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState<
    "Pending Approvals" | "Material Alerts" | "Collections Due" | "Follow-Ups Due"
  >("Pending Approvals");

  // Dropdown refs for click outside
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Queries
  const notificationsQuery = useQuery({
    queryKey: ["erp-notifications-summary", role],
    queryFn: async () => (await apiRequest<NotificationsResponse>("/api/notifications", { role })).data,
  });

  const aiOverviewQuery = useQuery({
    queryKey: ["erp-ai-overview", role],
    queryFn: async () => (await apiRequest<AssistantOverviewResponse>("/api/ai/overview", { role })).data,
  });

  const dashboardOverviewQuery = useQuery({
    queryKey: ["erp-dashboard-overview-topbar", role],
    queryFn: async () => (await apiRequest<DashboardOverviewResponse>("/api/dashboard/overview", { role })).data,
  });

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setSearchFocused(false);
      }
      if (aiRef.current && !aiRef.current.contains(target)) {
        setAiMenuOpen(false);
      }
      if (createRef.current && !createRef.current.contains(target)) {
        setCreateMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Keyboard shortcut listener
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

  // AI Command Execution helper
  const runAiCommand = async (promptQuery: string) => {
    setAiMenuOpen(false);
    try {
      const res = await apiRequest<AssistantCommandResponse>("/api/ai/command", {
        role,
        method: "POST",
        body: { query: promptQuery },
      });
      if (res.success) {
        setAssistantSession(res.data);
        toggleCommandPalette(false);
        toggleAssistantPanel(true);
      }
    } catch (err) {
      console.error("Failed to run AI command", err);
    }
  };

  // Quick Action creation helper
  const handleQuickCreate = (type: string) => {
    setCreateMenuOpen(false);
    const routes: Record<string, string> = {
      Lead: "/sales/leads",
      Customer: "/sales/customers",
      "Purchase Request": "/purchases/requests",
      "Purchase Order": "/purchases/purchase-orders",
      Vendor: "/purchases/vendors",
      Employee: "/people/employees",
      Contractor: "/people/contractors",
    };

    if (routes[type]) {
      router.push(routes[type]);
      // Trigger AI command assistant to assist with creation
      setTimeout(() => {
        runAiCommand(`Create ${type}`);
      }, 500);
    }
  };

  // Switch role helper for demo purposes
  const handleSwitchRole = (newRole: "admin" | "manager" | "accountant" | "sales") => {
    setRole(newRole);
    setProfileMenuOpen(false);
    router.refresh();
  };

  // Mock global search engine
  const searchItems = () => {
    if (!searchQuery.trim()) return [];
    const results: Array<{
      type: string;
      label: string;
      description: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [];
    const query = searchQuery.toLowerCase();

    // Search Pages
    navSections.forEach((section) => {
      section.pages.forEach((page) => {
        if (
          page.label.toLowerCase().includes(query) ||
          page.description.toLowerCase().includes(query)
        ) {
          results.push({
            type: "Navigation",
            label: page.label,
            description: page.description,
            href: `/${section.slug}/${page.slug}`,
            icon: Layers,
          });
        }
      });
    });

    // Search Mock Records
    const mockRecords = [
      { type: "Project", label: "Apex Tower (Phase 1)", description: "Active construction site in North Zone", href: "/projects/all-projects", icon: Building2 },
      { type: "Project", label: "Green Valley Residences", description: "Excavation and foundation phase", href: "/projects/all-projects", icon: Building2 },
      { type: "Lead", label: "Sarah Jenkins", description: "Warm lead interested in 3BHK Apartment", href: "/sales/leads", icon: User },
      { type: "Lead", label: "Michael Chang", description: "Follow-up due for booking confirmation", href: "/sales/leads", icon: User },
      { type: "Vendor", label: "Steel Dynamics Inc", description: "Primary vendor for reinforcement bars", href: "/purchases/vendors", icon: Briefcase },
      { type: "Vendor", label: "Cement Masters Corp", description: "Active purchase order contract", href: "/purchases/vendors", icon: Briefcase },
      { type: "Material", label: "Cement Grade 53", description: "Warehouse 1 - Stock: 450 bags", href: "/materials/materials-list", icon: Package },
      { type: "Material", label: "TMT Steel Bars", description: "Warehouse 2 - Stock: 12 tons (Low)", href: "/materials/materials-list", icon: Package },
    ];

    mockRecords.forEach((record) => {
      if (
        record.label.toLowerCase().includes(query) ||
        record.description.toLowerCase().includes(query) ||
        record.type.toLowerCase().includes(query)
      ) {
        results.push(record);
      }
    });

    return results.slice(0, 6);
  };

  const matchingSearchResults = searchItems();

  // Notification categorization logic
  const notifications = notificationsQuery.data?.notifications || [];
  
  const getMappedCategory = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("approval") || c.includes("comply") || c.includes("compliance")) return "Pending Approvals";
    if (c.includes("material") || c.includes("stock") || c.includes("inventory") || c.includes("warehouse")) return "Material Alerts";
    if (c.includes("collection") || c.includes("payment") || c.includes("finance") || c.includes("receivable")) return "Collections Due";
    return "Follow-Ups Due";
  };

  const categorizedNotifications = notifications.map(item => ({
    ...item,
    mappedCategory: getMappedCategory(item.category)
  }));

  const categoryCounts = {
    "Pending Approvals": categorizedNotifications.filter(n => n.mappedCategory === "Pending Approvals").length,
    "Material Alerts": categorizedNotifications.filter(n => n.mappedCategory === "Material Alerts").length,
    "Collections Due": categorizedNotifications.filter(n => n.mappedCategory === "Collections Due").length,
    "Follow-Ups Due": categorizedNotifications.filter(n => n.mappedCategory === "Follow-Ups Due").length,
  };

  const activeCategoryNotifications = categorizedNotifications.filter(
    (n) => n.mappedCategory === activeNotificationTab
  );

  // Dynamic values for the Business Status Strip
  const pendingApprovalsCount = aiOverviewQuery.data?.signals.find(s => s.label.toLowerCase().includes("approval"))?.value || "12";
  const materialAlertsCount = aiOverviewQuery.data?.signals.find(s => s.label.toLowerCase().includes("stock"))?.value || "4";
  const workforceHealthText = aiOverviewQuery.data?.signals.find(s => s.label.toLowerCase().includes("attendance"))?.value || "94% Present";
  const collectionRate = dashboardOverviewQuery.data?.revenueCollections.totals.collectionRate;
  const projectHealthSummary = dashboardOverviewQuery.data?.projectHealth.summary;
  const healthyProjects = projectHealthSummary?.healthy ?? 0;
  const attentionProjects = projectHealthSummary?.attention ?? 0;
  const criticalProjects = projectHealthSummary?.critical ?? 0;
  const totalProjects = healthyProjects + attentionProjects + criticalProjects;
  const collectionToneClass =
    typeof collectionRate === "number" && collectionRate >= 80
      ? "bg-success"
      : typeof collectionRate === "number" && collectionRate >= 50
        ? "bg-warning"
        : "bg-error";
  const projectToneClass =
    criticalProjects > 0 ? "bg-error" : attentionProjects > 0 ? "bg-warning" : "bg-success";

  return (
    <>
      <header
        className={cn(
          "topbar-floating sticky-layer sticky top-0 z-[var(--z-topbar)]",
          scrolled ? "px-4 py-3 lg:px-5" : "px-5 py-4 lg:px-6",
        )}
        data-scrolled={scrolled ? "true" : "false"}
      >
        <div className="flex min-h-12 items-center justify-between gap-4">
          
          {/* Mobile Sidebar Trigger */}
          <Button variant="ghost" size="sm" onClick={() => toggleMobileSidebar(true)} className="shrink-0 lg:hidden">
            <Menu className="h-4 w-4" />
          </Button>

          {/* LEFT: Large Global Search (Notion/Linear style) */}
          <div ref={searchContainerRef} className="relative z-10 flex-1 max-w-[650px] min-w-[280px]">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-text-muted" />
              <Input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search projects, leads, customers, vendors, materials..."
                className={cn(
                  "h-11 bg-surface pl-10 pr-10 text-body transition-all duration-200 border border-border-soft hover:border-text-muted/40 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 placeholder:text-text-muted placeholder:font-normal",
                  scrolled ? "shadow-soft" : "shadow-search",
                )}
              />
              <div className="absolute right-3 flex items-center gap-1 pointer-events-none">
                <kbd className="hidden md:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border-soft bg-surface-secondary px-1.5 font-mono text-[10px] font-medium text-text-muted shadow-soft">
                  /
                </kbd>
              </div>
            </div>

            {/* Notion-style Global Search Results Dropdown */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-border-soft bg-surface/90 backdrop-blur-xl p-3 shadow-floating animate-page-in max-h-[380px] overflow-y-auto">
                <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-text-muted flex justify-between">
                  <span>Search results</span>
                  <span>{matchingSearchResults.length} found</span>
                </div>
                {matchingSearchResults.length > 0 ? (
                  <div className="space-y-1">
                    {matchingSearchResults.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchFocused(false);
                            setSearchQuery("");
                            router.push(item.href);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-body hover:bg-hover transition-colors subtle-hover"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary border border-border-soft text-text-secondary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium text-text-primary text-sm">{item.label}</p>
                            <p className="truncate text-xs text-text-muted">{item.description}</p>
                          </div>
                          <Badge tone="neutral" className="shrink-0 text-[10px] uppercase font-semibold tracking-wider">
                            {item.type}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-6 text-center text-body text-text-muted">
                    No results found for &ldquo;<span className="font-semibold text-text-primary">{searchQuery}</span>&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CENTER: AI Command Center (Ctrl + K) */}
          <div ref={aiRef} className="relative hidden lg:block">
            <button
              onClick={() => setAiMenuOpen(!aiMenuOpen)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-accent-primary/20 bg-linear-to-r from-accent-primary/5 via-surface to-accent-secondary/5 px-4 text-body font-medium text-text-primary shadow-soft hover:border-accent-primary/40 transition-all subtle-hover select-none"
            >
              <Sparkles className="h-4 w-4 text-accent-primary animate-pulse" />
              <span>AI Command Center</span>
              <kbd className="ml-1.5 hidden rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-text-muted md:inline">
                Ctrl + K
              </kbd>
              <ChevronDown className={cn("h-3.5 w-3.5 text-text-muted transition-transform duration-200", aiMenuOpen && "rotate-180")} />
            </button>

            {/* AI Command Center Dropdown */}
            {aiMenuOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[340px] rounded-2xl border border-border-soft bg-surface/90 backdrop-blur-xl p-4 shadow-floating animate-page-in">
                <div className="flex items-center gap-2 pb-3 border-b border-border-soft">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary text-sm">AI Copilot Workflows</h4>
                    <p className="text-[11px] text-text-muted">Instantly trigger command shortcuts</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">Suggested prompts</p>
                  {[
                    "Create Purchase Request",
                    "Create Lead",
                    "Create Customer",
                    "Show Delayed Projects",
                    "Show Low Stock Materials",
                    "Open Workforce Insights",
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => runAiCommand(prompt)}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-text-secondary hover:bg-hover hover:text-text-primary transition-colors subtle-hover"
                    >
                      <span className="truncate">{prompt}</span>
                      <kbd className="font-mono text-[9px] text-text-muted">Enter</kbd>
                    </button>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border-soft text-center">
                  <button
                    onClick={() => {
                      setAiMenuOpen(false);
                      toggleCommandPalette(true);
                    }}
                    className="text-xs font-semibold text-accent-primary hover:underline inline-flex items-center gap-1"
                  >
                    Open AI Launcher Panel &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Quick Actions, Notifications, User Profile */}
          <div className="flex items-center gap-3 shrink-0">

            {/* 1. Quick Actions Dropdown */}
            <div ref={createRef} className="relative">
              <Button
                variant="primary"
                size="md"
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className="h-11 rounded-xl shadow-soft font-semibold"
              >
                <Plus className="h-4 w-4" />
                <span>Create</span>
                <ChevronDown className="h-3.5 w-3.5 text-white/80" />
              </Button>

              {createMenuOpen && (
                <div className="absolute right-0 mt-2 w-[200px] rounded-2xl border border-border-soft bg-surface/90 backdrop-blur-xl p-2 shadow-floating animate-page-in">
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    New Record Wizard
                  </div>
                  {[
                    "Lead",
                    "Customer",
                    "Purchase Request",
                    "Purchase Order",
                    "Vendor",
                    "Employee",
                    "Contractor",
                  ].map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickCreate(action)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-body text-text-secondary hover:bg-hover hover:text-text-primary transition-colors subtle-hover"
                    >
                      <Plus className="h-3.5 w-3.5 text-accent-primary" />
                      <span>{action}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Notifications Dropdown */}
            <div ref={notificationsRef} className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotificationsMenuOpen(!notificationsMenuOpen)}
                className="relative h-11 w-11 rounded-xl border border-border-soft bg-surface hover:bg-hover shadow-soft"
              >
                <Bell className="h-4.5 w-4.5 text-text-secondary" />
                {notificationsQuery.data?.summary.unread ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white shadow-enterprise animate-bounce">
                    {Math.min(99, notificationsQuery.data.summary.unread)}
                  </span>
                ) : null}
              </Button>

              {notificationsMenuOpen && (
                <div className="absolute right-0 mt-2 w-[380px] rounded-2xl border border-border-soft bg-surface/95 backdrop-blur-xl p-4 shadow-floating animate-page-in">
                  <div className="flex items-center justify-between pb-3 border-b border-border-soft">
                    <h4 className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                      <Bell className="h-4 w-4 text-accent-primary" />
                      <span>Activity Notifications</span>
                    </h4>
                    <span className="text-xs text-text-muted">
                      {notificationsQuery.data?.summary.unread || 0} unread
                    </span>
                  </div>

                  {/* Tabs */}
                  <div className="mt-3 grid grid-cols-2 gap-1.5 border-b border-border-soft pb-3">
                    {(Object.keys(categoryCounts) as Array<keyof typeof categoryCounts>).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveNotificationTab(cat)}
                        className={cn(
                          "rounded-lg px-2 py-1.5 text-left text-xs transition-colors subtle-hover flex items-center justify-between",
                          activeNotificationTab === cat
                            ? "bg-accent-primary/10 text-accent-primary font-semibold"
                            : "text-text-muted hover:bg-hover hover:text-text-primary"
                        )}
                      >
                        <span className="truncate">{cat.split(" ")[0]}</span>
                        <Badge
                          tone={
                            activeNotificationTab === cat
                              ? "info"
                              : categoryCounts[cat] > 0
                              ? "warning"
                              : "neutral"
                          }
                          className="px-1.5 py-0 text-[9px]"
                        >
                          {categoryCounts[cat]}
                        </Badge>
                      </button>
                    ))}
                  </div>

                  {/* Notification List Container */}
                  <div className="mt-3 max-h-[240px] overflow-y-auto space-y-2.5 pr-1">
                    {activeCategoryNotifications.length > 0 ? (
                      activeCategoryNotifications.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-border-soft bg-surface-secondary/50 p-2.5 hover:bg-hover/30 transition-colors subtle-hover"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-xs text-text-primary">
                              {item.title}
                            </span>
                            <Badge
                              tone={
                                item.severity === "Critical"
                                  ? "error"
                                  : item.severity === "High"
                                  ? "warning"
                                  : "neutral"
                              }
                              className="text-[9px] px-1 py-0"
                            >
                              {item.severity}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">
                            {item.message}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[9px] text-text-muted">
                            <span className="flex items-center gap-1">
                              <Clock3 className="h-3 w-3" />
                              {new Date(item.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <button
                              onClick={() => {
                                setNotificationsMenuOpen(false);
                                router.push(item.actionRoute || "/home/dashboard");
                              }}
                              className="text-accent-primary hover:underline font-semibold"
                            >
                              {item.actionLabel || "Manage"}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-text-muted flex flex-col items-center gap-2">
                        <Bookmark className="h-5 w-5 text-text-muted/65" />
                        <span>No alerts in this category</span>
                      </div>
                    )}
                  </div>

                  {/* View All */}
                  <div className="mt-3 pt-3 border-t border-border-soft text-center">
                    <button
                      onClick={() => {
                        setNotificationsMenuOpen(false);
                        toggleNotificationCenter(true);
                      }}
                      className="text-xs font-semibold text-accent-primary hover:underline"
                    >
                      Open Notification Feed Drawer &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Compact User Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 rounded-xl border border-border-soft bg-surface p-1.5 pr-2.5 hover:bg-hover transition-colors shadow-soft subtle-hover"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10 text-xs font-semibold text-accent-primary shadow-soft">
                  {user?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                </div>
                <div className="hidden text-left md:block">
                  <p className="truncate text-xs font-semibold text-text-primary leading-none">
                    {user?.name || "User"}
                  </p>
                  <p className="truncate text-[9px] text-text-muted mt-0.5 uppercase tracking-wider font-bold">
                    {user?.role || role}
                  </p>
                </div>
                <ChevronDown className="h-3 w-3 text-text-secondary" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-[280px] rounded-2xl border border-border-soft bg-surface/95 backdrop-blur-xl p-4 shadow-floating animate-page-in">
                  <div className="flex items-center gap-3 pb-3 border-b border-border-soft">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10 text-sm font-semibold text-accent-primary">
                      {user?.name?.split(" ").map((n) => n[0]).join("") || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary text-sm truncate">{user?.name || "User"}</p>
                      <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* Settings quick links */}
                  <div className="mt-3 space-y-1">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        router.push("/settings/company-settings");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-text-secondary hover:bg-hover hover:text-text-primary transition-colors subtle-hover"
                    >
                      <Settings className="h-3.5 w-3.5 text-text-muted" />
                      <span>Company Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        router.push("/settings/users-permissions");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-text-secondary hover:bg-hover hover:text-text-primary transition-colors subtle-hover"
                    >
                      <User className="h-3.5 w-3.5 text-text-muted" />
                      <span>Users & Permissions</span>
                    </button>
                  </div>

                  {/* Demo Role Switcher Section */}
                  <div className="mt-4 pt-3 border-t border-border-soft">
                    <p className="px-2 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-text-muted">
                      Switch Demo Persona
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(roleLabelMap) as Array<keyof typeof roleLabelMap>).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleSwitchRole(r)}
                          className={cn(
                            "rounded-lg px-2 py-1.5 text-center text-[10px] font-semibold transition-colors subtle-hover uppercase tracking-wider",
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

                  {/* Logout */}
                  <div className="mt-4 pt-3 border-t border-border-soft">
                    <button
                      onClick={() => {
                        logout();
                        router.push("/login");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-error hover:bg-error/10 hover:text-error transition-colors subtle-hover"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Dynamic Breadcrumbs Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="topbar-breadcrumbs mt-3 flex flex-wrap items-center gap-1.5 border-t border-border-soft pt-3 text-label text-text-muted subtle-hover"
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <span key={`${crumb.href}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden="true" className="text-text-muted/40">/</span> : null}
                {isLast ? (
                  <span className="text-text-secondary font-semibold" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="hover:text-text-primary transition-colors subtle-hover">
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      </header>

      {/* BUSINESS STATUS STRIP */}
      <section className="mt-3 flex w-full overflow-x-auto select-none gap-2 px-1 py-1 no-scrollbar scroll-smooth">
        <div className="flex items-center gap-2.5 w-full flex-wrap lg:flex-nowrap">
          
          {/* Workforce Health */}
          <Link
            href="/people/workforce-insights"
            className="flex items-center gap-2 rounded-full border border-border-soft bg-surface px-3.5 py-1.5 text-xs font-medium text-text-secondary shadow-soft hover:bg-hover hover:border-text-muted/20 transition-all subtle-hover shrink-0"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span>Workforce: {workforceHealthText}</span>
          </Link>

          {/* Pending Approvals */}
          <Link
            href="/purchases/approvals"
            className="flex items-center gap-2 rounded-full border border-border-soft bg-surface px-3.5 py-1.5 text-xs font-medium text-text-secondary shadow-soft hover:bg-hover hover:border-text-muted/20 transition-all subtle-hover shrink-0"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
            </span>
            <BadgeCheck className="h-3.5 w-3.5 text-warning" />
            <span>{pendingApprovalsCount} Pending Approvals</span>
          </Link>

          {/* Material Alerts */}
          <Link
            href="/materials/stock-management"
            className="flex items-center gap-2 rounded-full border border-border-soft bg-surface px-3.5 py-1.5 text-xs font-medium text-text-secondary shadow-soft hover:bg-hover hover:border-text-muted/20 transition-all subtle-hover shrink-0"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
            </span>
            <TriangleAlert className="h-3.5 w-3.5 text-error" />
            <span>{materialAlertsCount} Critical Material Alerts</span>
          </Link>

          {/* Collections */}
          <Link
            href="/reports-analytics/financial-reports"
            className="flex items-center gap-2 rounded-full border border-border-soft bg-surface px-3.5 py-1.5 text-xs font-medium text-text-secondary shadow-soft hover:bg-hover hover:border-text-muted/20 transition-all subtle-hover shrink-0"
          >
            <span className="relative flex h-2 w-2">
              <span className={cn("relative inline-flex rounded-full h-2 w-2", collectionToneClass)}></span>
            </span>
            <IndianRupee className="h-3.5 w-3.5 text-success" />
            <span>
              {typeof collectionRate === "number" ? `Collections at ${collectionRate}% of revenue` : "Collections loading"}
            </span>
          </Link>

          {/* Project Status */}
          <Link
            href="/projects/all-projects"
            className="flex items-center gap-2 rounded-full border border-border-soft bg-surface px-3.5 py-1.5 text-xs font-medium text-text-secondary shadow-soft hover:bg-hover hover:border-text-muted/20 transition-all subtle-hover shrink-0"
          >
            <span className="relative flex h-2 w-2">
              <span className={cn("relative inline-flex rounded-full h-2 w-2", projectToneClass)}></span>
            </span>
            <Activity className="h-3.5 w-3.5 text-success" />
            <span>{totalProjects > 0 ? `${healthyProjects}/${totalProjects} Projects Healthy` : "Project health loading"}</span>
          </Link>
          
        </div>
      </section>
    </>
  );
}
