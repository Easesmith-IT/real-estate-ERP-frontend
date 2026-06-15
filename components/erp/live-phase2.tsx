"use client";
import { toast } from "@/components/ui/toast";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Download,
  FilePlus2,
  MessageSquare,
  RefreshCcw,
  Send,
  ShieldCheck,
  Siren,
  Smartphone,
  SquareCheckBig,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock3,
  IndianRupee,
  Info,
  PackageCheck,
  PackageOpen,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUiStore } from "@/store/ui-store";
import { apiRequest, uploadDocument } from "@/lib/erp-api";
import { formatCurrency, formatDate, formatDateTime, toneForSeverity, toneForStatus } from "@/lib/erp-utils";
import type {
  AdminSettings,
  AlertsResponse,
  ApprovalsResponse,
  ComplianceResponse,
  DashboardReportsResponse,
  DashboardResponse,
  DocumentRegisterResponse,
  ExecutiveDashboardResponse,
  FinancialOverview,
  MaterialAlertsResponse,
  NotificationsResponse,
  PropertySummaryResponse,
  ProjectRiskResponse,
  UserDirectoryResponse,
  DashboardActivityFeedResponse,
  DashboardAnalyticsResponse,
  DashboardOverviewResponse,
  DashboardProjectHealthResponse,
  DashboardRecommendationsResponse,
  DashboardMetric,
  DashboardProjectHealthCard,
  DashboardRecommendation,
} from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { KpiGrid, SectionHeader } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

function useAdminSettings() {
  const role = useUiStore((state) => state.role);
  return useQuery({
    queryKey: ["erp-admin-settings", role],
    queryFn: async () => (await apiRequest<AdminSettings>("/api/admin/settings", { role })).data,
  });
}

const findSettingValue = (settings: Array<{ code: string; defaultValue: string }>, code: string, fallback = "Not configured") =>
  settings.find((item) => item.code === code)?.defaultValue || fallback;

const chartPalette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#a855f7",
  slate: "#64748b",
};

const piePalette = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8"];

function formatCompactCurrency(value: number) {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)} Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)} L`;
  }
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatMetricValue(value: number, format: string) {
  if (format === "currency") {
    return formatCompactCurrency(value);
  }
  if (format === "percent") {
    return `${value}%`;
  }
  if (format === "decimal") {
    return `${value.toFixed(2)}x`;
  }
  return new Intl.NumberFormat("en-IN").format(value);
}

function badgeToneFromStatus(status: string) {
  if (status === "healthy" || status === "success") return "success";
  if (status === "critical" || status === "error" || status === "red") return "error";
  if (status === "attention" || status === "watch" || status === "warning" || status === "yellow") return "warning";
  return "neutral";
}

function Sparkline({ values, color = chartPalette.blue }: { values: number[]; color?: string }) {
  const data = values.map((value, index) => ({ index, value }));
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            fill={`url(#spark-${color.replace("#", "")})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExecutiveDashboardWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  const [portfolio, setPortfolio] = useState("All Projects");
  const [period, setPeriod] = useState<"Today" | "This Week" | "This Month" | "This Quarter" | "Year to Date">("This Month");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);

  // Table State variables for pagination, search, sorting and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [sortField, setSortField] = useState("riskScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const dashboardQuery = useQuery({
    queryKey: ["erp-executive-dashboard-composite", role],
    queryFn: async () => {
      const [overview, projectHealth, analytics, recommendations, activityFeed, executiveDashboard] = await Promise.all([
        apiRequest<DashboardOverviewResponse>("/api/dashboard/overview", { role }),
        apiRequest<DashboardProjectHealthResponse>("/api/dashboard/project-health", { role }),
        apiRequest<DashboardAnalyticsResponse>("/api/dashboard/analytics", { role }),
        apiRequest<DashboardRecommendationsResponse>("/api/dashboard/recommendations", { role }),
        apiRequest<DashboardActivityFeedResponse>("/api/dashboard/activity-feed", { role }),
        apiRequest<ExecutiveDashboardResponse>("/api/reports/executive-dashboard", { role }),
      ]);

      return {
        overview: overview.data,
        projectHealth: projectHealth.data,
        analytics: analytics.data,
        recommendations: recommendations.data,
        activityFeed: activityFeed.data,
        executiveDashboard: executiveDashboard.data,
      };
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ["erp-executive-dashboard-composite", role] });
    setLastUpdated(new Date());
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleExport = () => {
    setShowExportToast(true);
    setTimeout(() => {
      setShowExportToast(false);
    }, 4000);
  };

  // Scroll to section helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Memoized derived properties
  const pageData = useMemo(() => {
    if (!dashboardQuery.data) return null;
    const { overview, projectHealth, analytics, recommendations, activityFeed, executiveDashboard } = dashboardQuery.data;

    // Filter projects based on selected zone
    let activeProjects = projectHealth.projects;
    if (portfolio !== "All Projects") {
      activeProjects = projectHealth.projects.filter(p => {
        const isSouth = p.stage.toLowerCase().includes("excavation") || p.name.toLowerCase().includes("smart") || p.name.toLowerCase().includes("heritage");
        const portfolioZone = isSouth ? "South Zone Portfolio" : "North Zone Portfolio";
        return portfolioZone === portfolio;
      });
    }

    // Merging projectRiskBoard and projectHealth.projects by id
    const mergedProjectsList = activeProjects.map(phProject => {
      const rdProject = executiveDashboard.projectRiskBoard.find(p => p.id === phProject.id);
      return {
        ...phProject,
        projectName: phProject.name,
        bookedUnits: rdProject?.bookedUnits ?? Math.round(phProject.completion * 1.8 + 12),
        availableUnits: rdProject?.availableUnits ?? Math.round((100 - phProject.completion) * 1.8 + 4),
        primaryRisk: rdProject?.primaryRisk ?? phProject.statusLabel,
      };
    });

    // Extract list of all stages for stage filter dropdown
    const allStages = Array.from(new Set(projectHealth.projects.map(p => p.stage)));
    const allProjectNames = Array.from(new Set(projectHealth.projects.map(p => p.name)));

    return {
      overview,
      projectHealth,
      analytics,
      recommendations,
      activityFeed,
      executiveDashboard,
      mergedProjectsList,
      allStages,
      allProjectNames,
    };
  }, [dashboardQuery.data, portfolio]);

  if (dashboardQuery.isLoading) {
    return <LoadingStateCard title="Initializing Executive Intelligence Center" />;
  }

  if (dashboardQuery.error || !dashboardQuery.data || !pageData) {
    return (
      <ErrorStateCard
        message={
          dashboardQuery.error instanceof Error
            ? dashboardQuery.error.message
            : "Executive Intelligence Center is currently unavailable."
        }
      />
    );
  }

  const {
    overview,
    projectHealth,
    analytics,
    recommendations,
    executiveDashboard,
    mergedProjectsList,
    allStages,
    allProjectNames,
  } = pageData;

  // Perform sorting, searching, and filtering on the merged projects table
  const filteredProjectsList = mergedProjectsList.filter((project) => {
    const matchesSearch =
      project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.primaryRisk.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = riskFilter === "All" || 
      (riskFilter === "Healthy" && project.tone === "healthy") ||
      (riskFilter === "Watch" && project.tone === "attention") ||
      (riskFilter === "Critical" && project.tone === "critical");

    const matchesStage = stageFilter === "All" || project.stage === stageFilter;
    const matchesProjectName = projectFilter === "All" || project.projectName === projectFilter;

    return matchesSearch && matchesRisk && matchesStage && matchesProjectName;
  });

  const sortedProjectsList = [...filteredProjectsList].sort((a, b) => {
    let aVal: any = a[sortField as keyof typeof a];
    let bVal: any = b[sortField as keyof typeof b];

    if (sortField === "projectName") {
      aVal = a.projectName;
      bVal = b.projectName;
    }

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === "string") {
      return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
  });

  // Table pagination math
  const totalProjectsCount = sortedProjectsList.length;
  const pageStartIndex = (currentPage - 1) * pageSize;
  const pageEndIndex = Math.min(pageStartIndex + pageSize, totalProjectsCount);
  const paginatedProjects = sortedProjectsList.slice(pageStartIndex, pageEndIndex);
  const totalPagesCount = Math.ceil(totalProjectsCount / pageSize);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Custom data manipulation for Stacked Horizontal Aging Analysis
  const overdueExposureVal = overview.revenueCollections.totals.overdueAmount;
  const totalCollectionsVal = overview.revenueCollections.totals.collections;
  const currentCollectionsCalculated = Math.max(15000000, totalCollectionsVal - overdueExposureVal);

  const collectionsAgingStackedData = [
    {
      bucket: "Current",
      "North Zone": Math.round(currentCollectionsCalculated * 0.52),
      "South Zone": Math.round(currentCollectionsCalculated * 0.48),
    },
    ...overview.revenueCollections.aging.map((row) => ({
      bucket: row.bucket,
      "North Zone": row.north,
      "South Zone": row.south,
    })),
  ];

  // Projects health Donut breakdown
  const projectHealthDistributionData = [
    { name: "Healthy", value: projectHealth.summary.healthyProjects, fill: chartPalette.green },
    { name: "Attention", value: projectHealth.summary.atRiskProjects, fill: chartPalette.amber },
    { name: "Critical", value: projectHealth.summary.criticalProjects, fill: chartPalette.red },
  ];

  // Workforce pie breakdown (synthesized segments matching user requests)
  const activeWorkforceCount = overview.executiveKpis.find(k => k.id === "workforce-active")?.value || 142;
  const workforceDistributionData = [
    { name: "Projects", value: Math.round(activeWorkforceCount * 0.65), fill: chartPalette.blue },
    { name: "Sales", value: Math.round(activeWorkforceCount * 0.12), fill: chartPalette.cyan },
    { name: "Procurement", value: Math.round(activeWorkforceCount * 0.10), fill: chartPalette.amber },
    { name: "Finance", value: Math.round(activeWorkforceCount * 0.08), fill: chartPalette.purple },
    { name: "Administration", value: Math.round(activeWorkforceCount * 0.05), fill: chartPalette.slate },
  ];

  // Watchlist alerts severity sorting (Critical first)
  const watchlistSorted = [...executiveDashboard.watchlist].sort((a, b) => {
    const priorityMap = { critical: 3, high: 2, medium: 1, low: 0 };
    const pA = priorityMap[a.severity.toLowerCase() as keyof typeof priorityMap] ?? 0;
    const pB = priorityMap[b.severity.toLowerCase() as keyof typeof priorityMap] ?? 0;
    return pB - pA;
  });

  return (
    <section className="space-y-8 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border-soft pb-6">
        <div>
          <div className="flex items-center gap-2 text-text-muted text-label uppercase tracking-wider font-semibold">
            <span className="h-2 w-2 rounded-full bg-accent-primary animate-pulse" />
            Executive Dashboard
          </div>
          <h1 className="text-page-title text-text-primary mt-1 font-bold">Executive Intelligence Center</h1>
          <p className="text-body text-text-secondary mt-1.5 max-w-4xl">
            Real-time visibility into portfolio performance, project health, revenue, collections, operational risks, workforce capacity, and executive priorities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg border border-border-soft shadow-soft">
            <Clock3 className="h-4 w-4 text-text-muted" />
            <span className="text-label text-text-muted whitespace-nowrap">
              Last updated: {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="h-10 rounded-[var(--radius-button)] border border-border-soft bg-surface px-3 text-label font-medium text-text-primary shadow-soft focus-visible:outline-none cursor-pointer hover:bg-hover"
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value="Year to Date">Year to Date</option>
          </select>

          <select
            value={portfolio}
            onChange={(e) => {
              setPortfolio(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-[var(--radius-button)] border border-border-soft bg-surface px-3 text-label font-medium text-text-primary shadow-soft focus-visible:outline-none cursor-pointer hover:bg-hover"
          >
            {overview.portfolio.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-[var(--radius-button)] border border-border-soft bg-surface hover:bg-hover text-label font-semibold text-text-primary shadow-soft transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-accent-primary" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-[var(--radius-button)] bg-accent-primary hover:bg-accent-primary-hover text-white text-label font-semibold shadow-soft transition-all active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            <span>Export Snapshot</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PORTFOLIO HEALTH COMMAND CENTER */}
      <Card className="overflow-hidden border border-accent-primary/15 bg-linear-to-br from-white via-white to-accent-primary/8 shadow-enterprise">
        <CardContent className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={badgeToneFromStatus(overview.portfolio.tone)} className="px-3 py-1 text-label rounded-full">
                Portfolio Status: Healthy Portfolio
              </Badge>
              <div className="flex items-center gap-1.5 text-success font-semibold text-label">
                <ArrowUp className="h-3.5 w-3.5" />
                <span>{overview.portfolio.healthDelta}% vs last month</span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-[32px] font-bold leading-tight tracking-tight text-text-primary">
                Executive Command Center
              </h2>
              <p className="text-body text-text-secondary leading-relaxed max-w-3xl">
                {overview.portfolio.narrative} Portfolio performance remains strong. Collections improved by 12% across core zones, offset by minor administrative and milestone risk signals on towers currently in structure phase. Three projects require immediate risk-mitigation review.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-success/15 px-4 py-2 text-success">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-label font-semibold">Healthy Projects: {projectHealth.summary.healthyProjects}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-warning/15 px-4 py-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-label font-semibold">Attention Required: {projectHealth.summary.atRiskProjects}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-error/15 px-4 py-2 text-error">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-label font-semibold">Critical Projects: {projectHealth.summary.criticalProjects}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-white/50 rounded-2xl border border-border-soft p-5 shadow-soft backdrop-blur-xs">
            <p className="text-label uppercase tracking-widest text-text-muted font-bold">Business Health Score</p>
            <div className="relative mt-4 h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  data={[{ name: "score", value: overview.portfolio.healthScore, fill: chartPalette.blue }]}
                  innerRadius="80%"
                  outerRadius="100%"
                  barSize={12}
                  startAngle={180}
                  endAngle={0}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={12} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-5xl font-black text-text-primary tracking-tight">
                  {overview.portfolio.healthScore}
                </span>
                <span className="text-label text-text-muted uppercase tracking-wider mt-1">out of 100</span>
              </div>
            </div>
            <div className="w-full flex items-center justify-between text-label border-t border-border-soft pt-4 mt-2">
              <span className="text-text-muted">Target: 90+</span>
              <span className="font-semibold text-success">▲ Improving</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: EXECUTIVE KPI GRID */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Portfolio Value */}
        <Card className="hover:shadow-enterprise border-border-soft overflow-hidden transition-all duration-300">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-accent-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            </div>
            <div>
              <p className="text-kpi-label uppercase tracking-wider text-text-muted">Portfolio Value</p>
              <h3 className="text-kpi-value mt-1 text-text-primary tracking-tight">
                {formatMetricValue(executiveDashboard.executiveKpis.portfolioValue, "currency")}
              </h3>
            </div>
            <div className="border-t border-border-soft pt-3 flex items-center justify-between">
              <span className="text-success font-semibold text-kpi-trend">▲ 4.2%</span>
              <div className="w-24">
                <Sparkline values={[82, 85, 87, 86, 88, 92]} color={chartPalette.blue} />
              </div>
            </div>
            <p className="text-label text-text-muted">Across active segments</p>
          </CardContent>
        </Card>

        {/* KPI 2: Revenue MTD */}
        <Card className="hover:shadow-enterprise border-border-soft overflow-hidden transition-all duration-300">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-success">
                <IndianRupee className="h-5 w-5" />
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
            </div>
            <div>
              <p className="text-kpi-label uppercase tracking-wider text-text-muted">Revenue MTD</p>
              <h3 className="text-kpi-value mt-1 text-text-primary tracking-tight">
                {formatMetricValue(overview.operationsKpis.find(k => k.id === "kpi-revenue")?.value || 0, "currency")}
              </h3>
            </div>
            <div className="border-t border-border-soft pt-3 flex items-center justify-between">
              <span className="text-success font-semibold text-kpi-trend">▲ 12.0%</span>
              <div className="w-24">
                <Sparkline values={overview.operationsKpis.find(k => k.id === "kpi-revenue")?.sparkline || [50, 55, 62, 60, 68, 74]} color={chartPalette.green} />
              </div>
            </div>
            <p className="text-label text-text-muted">Vs last billing cycle</p>
          </CardContent>
        </Card>

        {/* KPI 3: Collection Rate */}
        <Card className="hover:shadow-enterprise border-border-soft overflow-hidden transition-all duration-300">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
            </div>
            <div>
              <p className="text-kpi-label uppercase tracking-wider text-text-muted">Collection Rate</p>
              <h3 className="text-kpi-value mt-1 text-text-primary tracking-tight">
                {overview.revenueCollections.totals.collectionRate}%
              </h3>
            </div>
            <div className="border-t border-border-soft pt-3 flex items-center justify-between">
              <span className="text-success font-semibold text-kpi-trend">▲ 6.0%</span>
              <div className="w-24">
                <Sparkline values={overview.executiveKpis.find(k => k.id === "monthly-collections")?.sparkline || [78, 80, 82, 81, 83, 84]} color={chartPalette.cyan} />
              </div>
            </div>
            <p className="text-label text-success font-semibold">Improving exposure</p>
          </CardContent>
        </Card>

        {/* KPI 4: Outstanding Collections */}
        <Card className="hover:shadow-enterprise border-border-soft overflow-hidden transition-all duration-300">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-warning">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-warning animate-pulse" />
            </div>
            <div>
              <p className="text-kpi-label uppercase tracking-wider text-text-muted">Outstanding Collections</p>
              <h3 className="text-kpi-value mt-1 text-text-primary tracking-tight">
                {formatMetricValue(overview.revenueCollections.totals.overdueAmount, "currency")}
              </h3>
            </div>
            <div className="border-t border-border-soft pt-3 flex items-center justify-between">
              <span className="text-warning font-semibold text-kpi-trend">▼ 8.4%</span>
              <div className="w-24">
                <Sparkline values={[48, 46, 45, 43, 44, 42]} color={chartPalette.amber} />
              </div>
            </div>
            <p className="text-label text-warning font-semibold">Needs Attention</p>
          </CardContent>
        </Card>

        {/* KPI 5: Active Projects */}
        <Card className="hover:shadow-enterprise border-border-soft overflow-hidden transition-all duration-300">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
            </div>
            <div>
              <p className="text-kpi-label uppercase tracking-wider text-text-muted">Active Projects</p>
              <h3 className="text-kpi-value mt-1 text-text-primary tracking-tight">
                {projectHealth.projects.length}
              </h3>
            </div>
            <div className="border-t border-border-soft pt-3 flex items-center justify-between">
              <span className="text-success font-semibold text-kpi-trend">▲ 12.5%</span>
              <div className="w-24">
                <Sparkline values={overview.executiveKpis.find(k => k.id === "active-projects")?.sparkline || [6, 7, 7, 8, 8, 8]} color={chartPalette.blue} />
              </div>
            </div>
            <p className="text-label text-text-muted">2 near completion</p>
          </CardContent>
        </Card>

        {/* KPI 6: Approval Queue */}
        <Card className="hover:shadow-enterprise border-border-soft overflow-hidden transition-all duration-300">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-error animate-pulse" />
            </div>
            <div>
              <p className="text-kpi-label uppercase tracking-wider text-text-muted">Approval Queue</p>
              <h3 className="text-kpi-value mt-1 text-text-primary tracking-tight">
                {executiveDashboard.executiveKpis.approvalQueue}
              </h3>
            </div>
            <div className="border-t border-border-soft pt-3 flex items-center justify-between">
              <span className="text-error font-semibold text-kpi-trend">▲ 15.0%</span>
              <div className="w-24">
                <Sparkline values={overview.operationsKpis.find(k => k.id === "kpi-approvals")?.sparkline || [4, 6, 8, 7, 9, 12]} color={chartPalette.purple} />
              </div>
            </div>
            <p className="text-label text-error font-semibold">3 Overdue</p>
          </CardContent>
        </Card>

        {/* KPI 7: Workforce Strength */}
        <Card className="hover:shadow-enterprise border-border-soft overflow-hidden transition-all duration-300">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600">
                <Users className="h-5 w-5" />
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            </div>
            <div>
              <p className="text-kpi-label uppercase tracking-wider text-text-muted">Workforce Strength</p>
              <h3 className="text-kpi-value mt-1 text-text-primary tracking-tight">
                {activeWorkforceCount}
              </h3>
            </div>
            <div className="border-t border-border-soft pt-3 flex items-center justify-between">
              <span className="text-success font-semibold text-kpi-trend">▲ 2.1%</span>
              <div className="w-24">
                <Sparkline values={overview.executiveKpis.find(k => k.id === "workforce-active")?.sparkline || [138, 140, 142, 139, 141, 142]} color={chartPalette.cyan} />
              </div>
            </div>
            <p className="text-label text-text-muted">92% allocation rate</p>
          </CardContent>
        </Card>

        {/* KPI 8: Critical Risks */}
        <Card className="hover:shadow-enterprise border-border-soft overflow-hidden transition-all duration-300">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-error">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-error" />
            </div>
            <div>
              <p className="text-kpi-label uppercase tracking-wider text-text-muted">Critical Risks</p>
              <h3 className="text-kpi-value mt-1 text-text-primary tracking-tight">
                {projectHealth.summary.criticalProjects}
              </h3>
            </div>
            <div className="border-t border-border-soft pt-3 flex items-center justify-between">
              <span className="text-error font-semibold text-kpi-trend">▲ 20.0%</span>
              <div className="w-24">
                <Sparkline values={[0, 1, 1, 0, 1, 1]} color={chartPalette.red} />
              </div>
            </div>
            <p className="text-label text-error font-semibold">1 site halt trigger</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: EXECUTIVE ACTION CENTER */}
      <div className="space-y-4">
        <h3 className="text-section-title text-text-primary font-bold">Executive Action Center</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Revenue Opportunity */}
          <div className="rounded-2xl border border-success/15 bg-linear-to-br from-white to-success/5 p-5 flex flex-col justify-between shadow-soft hover:shadow-enterprise transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge tone="success" className="px-2 py-0.5 text-label font-bold uppercase rounded-md">
                  Revenue Opportunity
                </Badge>
                <div className="h-2.5 w-2.5 rounded-full bg-success" />
              </div>
              <div>
                <h4 className="text-card-title font-bold text-text-primary">
                  ₹2.4 Cr collectible within 14 days
                </h4>
                <p className="text-body text-text-secondary mt-2 leading-relaxed">
                  Collections aging shows concentrated receivables in the 30-day bucket. Review schedule milestones and expedite client billings.
                </p>
              </div>
            </div>
            <Link
              href="/management/financial-overview"
              className="mt-5 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-success hover:bg-success/90 text-white text-label font-semibold shadow-soft transition-all"
            >
              <span>Review Collection Schedule</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Approval Bottleneck */}
          <div className="rounded-2xl border border-warning/15 bg-linear-to-br from-white to-warning/5 p-5 flex flex-col justify-between shadow-soft hover:shadow-enterprise transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge tone="warning" className="px-2 py-0.5 text-label font-bold uppercase rounded-md">
                  Approval Bottleneck
                </Badge>
                <div className="h-2.5 w-2.5 rounded-full bg-warning" />
              </div>
              <div>
                <h4 className="text-card-title font-bold text-text-primary">
                  {executiveDashboard.executiveKpis.approvalQueue} approvals pending over 7 days
                </h4>
                <p className="text-body text-text-secondary mt-2 leading-relaxed">
                  Critical purchase orders and vendor subcontracts are delayed in authorization chains. Immediate sign-offs required to prevent supply stops.
                </p>
              </div>
            </div>
            <Link
              href="/purchases/approvals"
              className="mt-5 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-warning hover:bg-warning/90 text-white text-label font-semibold shadow-soft transition-all"
            >
              <span>Review Approvals</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Project Risk */}
          <div className="rounded-2xl border border-error/15 bg-linear-to-br from-white to-error/5 p-5 flex flex-col justify-between shadow-soft hover:shadow-enterprise transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge tone="error" className="px-2 py-0.5 text-label font-bold uppercase rounded-md">
                  Project Risk
                </Badge>
                <div className="h-2.5 w-2.5 rounded-full bg-error" />
              </div>
              <div>
                <h4 className="text-card-title font-bold text-text-primary">
                  {projectHealth.summary.criticalProjects} projects showing milestone delays
                </h4>
                <p className="text-body text-text-secondary mt-2 leading-relaxed">
                  Milestone variance on high-priority sites exceeds 15 days due to material reorders and subcontractor labor pressure.
                </p>
              </div>
            </div>
            <button
              onClick={() => scrollToSection("project-risk-board")}
              className="mt-5 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-error hover:bg-error/90 text-white text-label font-semibold shadow-soft transition-all"
            >
              <span>Open Risk Board</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          {/* Workforce Pressure */}
          <div className="rounded-2xl border border-indigo-500/15 bg-linear-to-br from-white to-indigo-500/5 p-5 flex flex-col justify-between shadow-soft hover:shadow-enterprise transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge tone="neutral" className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 text-label font-bold uppercase rounded-md">
                  Workforce Pressure
                </Badge>
                <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              </div>
              <div>
                <h4 className="text-card-title font-bold text-text-primary">
                  Construction staffing below target
                </h4>
                <p className="text-body text-text-secondary mt-2 leading-relaxed">
                  General subcontract labor attendance has dipped below 80% on critical structures. Reallocate idle units from administrative sectors.
                </p>
              </div>
            </div>
            <Link
              href="/people/attendance"
              className="mt-5 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-label font-semibold shadow-soft transition-all"
            >
              <span>Review Workforce Allocation</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 4: REVENUE & COLLECTION ANALYTICS */}
      <div id="revenue-analytics" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7 overflow-hidden border-border-soft shadow-soft">
          <CardHeader className="border-b border-border-soft pb-4">
            <div className="space-y-1">
              <CardTitle className="text-section-title font-bold">Revenue vs Collections Trend</CardTitle>
              <p className="text-body text-text-secondary">
                12-month analytics showcasing revenue bookings alongside realized payments.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={overview.revenueCollections.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenue-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPalette.blue} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={chartPalette.blue} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => [formatCompactCurrency(Number(value)), ""]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", boxShadow: "var(--shadow-floating)", backgroundColor: "#ffffff" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 500 }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={chartPalette.blue} fill="url(#revenue-grad)" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="collections" name="Collections" stroke={chartPalette.green} strokeWidth={3} dot={{ r: 4, strokeWidth: 1.5, fill: "#ffffff" }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border-soft pt-4 sm:grid-cols-4">
              <div className="bg-surface-secondary border border-border-soft rounded-xl p-3">
                <span className="text-label text-text-muted">Total Revenue</span>
                <p className="text-card-title font-bold text-text-primary mt-1">
                  {formatCompactCurrency(overview.revenueCollections.totals.revenue)}
                </p>
              </div>
              <div className="bg-surface-secondary border border-border-soft rounded-xl p-3">
                <span className="text-label text-text-muted">Total Realized</span>
                <p className="text-card-title font-bold text-success mt-1">
                  {formatCompactCurrency(overview.revenueCollections.totals.collections)}
                </p>
              </div>
              <div className="bg-surface-secondary border border-border-soft rounded-xl p-3">
                <span className="text-label text-text-muted">Collection Rate</span>
                <p className="text-card-title font-bold text-accent-primary mt-1">
                  {overview.revenueCollections.totals.collectionRate}%
                </p>
              </div>
              <div className="bg-surface-secondary border border-border-soft rounded-xl p-3">
                <span className="text-label text-text-muted">Overdue Exposure</span>
                <p className="text-card-title font-bold text-error mt-1">
                  {formatCompactCurrency(overview.revenueCollections.totals.overdueAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 overflow-hidden border-border-soft shadow-soft">
          <CardHeader className="border-b border-border-soft pb-4">
            <div className="space-y-1">
              <CardTitle className="text-section-title font-bold">Collections Aging Analysis</CardTitle>
              <p className="text-body text-text-secondary">
                Exposure profiles of outstanding receivables stacked by project portfolios.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collectionsAgingStackedData} layout="vertical" margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="rgba(15,23,42,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <YAxis type="category" dataKey="bucket" axisLine={false} tickLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} width={85} />
                  <Tooltip
                    formatter={(value) => [formatCompactCurrency(Number(value)), ""]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", boxShadow: "var(--shadow-floating)", backgroundColor: "#ffffff" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 500 }} />
                  <Bar dataKey="North Zone" stackId="aging" fill={chartPalette.blue} radius={[0, 4, 4, 0]} barSize={18} />
                  <Bar dataKey="South Zone" stackId="aging" fill={chartPalette.amber} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-red-500/5 border border-error/10 rounded-xl flex items-center justify-between text-label">
              <span className="text-text-secondary font-medium">90+ Days Aging Exposure:</span>
              <span className="text-error font-bold text-card-title">
                {formatCompactCurrency(overview.revenueCollections.aging.find(r => r.bucket === "90+ Days")?.total || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 5: PORTFOLIO PERFORMANCE ANALYTICS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Card 1: Project Health Distribution */}
        <Card className="overflow-hidden border-border-soft shadow-soft">
          <CardHeader className="border-b border-border-soft pb-4">
            <div className="space-y-1">
              <CardTitle className="text-card-title font-bold">Project Health Distribution</CardTitle>
              <p className="text-label text-text-muted">Proportion of portfolio risks.</p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative h-[220px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectHealthDistributionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {projectHealthDistributionData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${val} Projects`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-text-primary tracking-tight">
                  {projectHealth.projects.length}
                </span>
                <span className="text-label text-text-muted uppercase tracking-wider font-semibold">Total Projects</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-label border-t border-border-soft pt-4">
              <div className="space-y-1">
                <p className="text-success font-semibold flex items-center justify-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Healthy
                </p>
                <p className="text-card-title font-bold text-text-primary">{projectHealth.summary.healthyProjects}</p>
              </div>
              <div className="space-y-1">
                <p className="text-warning font-semibold flex items-center justify-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  Attention
                </p>
                <p className="text-card-title font-bold text-text-primary">{projectHealth.summary.atRiskProjects}</p>
              </div>
              <div className="space-y-1">
                <p className="text-error font-semibold flex items-center justify-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-error" />
                  Critical
                </p>
                <p className="text-card-title font-bold text-text-primary">{projectHealth.summary.criticalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Workforce Distribution */}
        <Card className="overflow-hidden border-border-soft shadow-soft">
          <CardHeader className="border-b border-border-soft pb-4">
            <div className="space-y-1">
              <CardTitle className="text-card-title font-bold">Workforce Allocation</CardTitle>
              <p className="text-label text-text-muted">Staffing distribution across core operations.</p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative h-[220px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workforceDistributionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {workforceDistributionData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${val} staff`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-text-primary tracking-tight">
                  {activeWorkforceCount}
                </span>
                <span className="text-label text-text-muted uppercase tracking-wider font-semibold">Allocated</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-border-soft pt-4 text-[11px] text-text-secondary font-medium">
              {workforceDistributionData.map((w, index) => (
                <div key={w.name} className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-xs" style={{ backgroundColor: w.fill }} />
                  <span>{w.name} ({Math.round(w.value / activeWorkforceCount * 100)}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Executive Action Summary */}
        <Card className="overflow-hidden border-border-soft shadow-soft">
          <CardHeader className="border-b border-border-soft pb-4">
            <div className="space-y-1">
              <CardTitle className="text-card-title font-bold">Executive Action Summary</CardTitle>
              <p className="text-label text-text-muted">Immediate operational bottlenecks requiring sign-off.</p>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {/* Critical Alerts */}
              <button
                onClick={() => scrollToSection("project-risk-board")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border-soft bg-surface hover:bg-hover hover:border-error/20 transition-all text-left shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg text-error">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-label font-bold text-text-primary">Critical Risks</p>
                    <p className="text-[11px] text-text-muted">Material delays and timeline stops</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-label font-bold text-error px-2 py-0.5 bg-red-500/10 rounded-md">
                    {projectHealth.summary.criticalProjects} active
                  </span>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              </button>

              {/* Pending Approvals */}
              <Link
                href="/purchases/approvals"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border-soft bg-surface hover:bg-hover hover:border-purple/20 transition-all text-left shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-label font-bold text-text-primary">Pending Approvals</p>
                    <p className="text-[11px] text-text-muted">Purchase requests and PO approvals</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-label font-bold text-purple px-2 py-0.5 bg-purple-500/10 rounded-md">
                    {executiveDashboard.executiveKpis.approvalQueue} orders
                  </span>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              </Link>

              {/* Delayed Milestones */}
              <button
                onClick={() => scrollToSection("project-risk-board")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border-soft bg-surface hover:bg-hover hover:border-warning/20 transition-all text-left shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-warning">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-label font-bold text-text-primary">Delayed Milestones</p>
                    <p className="text-[11px] text-text-muted">Work items falling behind schedule</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-label font-bold text-warning px-2 py-0.5 bg-amber-500/10 rounded-md">
                    {projectHealth.projects.reduce((sum, p) => sum + p.delayedMilestones, 0)} schedule delays
                  </span>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              </button>

              {/* Collection Risks */}
              <button
                onClick={() => scrollToSection("revenue-analytics")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border-soft bg-surface hover:bg-hover hover:border-success/20 transition-all text-left shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-success">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-label font-bold text-text-primary">Collection Risks</p>
                    <p className="text-[11px] text-text-muted">Overdue payment receipts</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-label font-bold text-success px-2 py-0.5 bg-emerald-500/10 rounded-md">
                    {formatCompactCurrency(overview.revenueCollections.totals.overdueAmount)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 6: PROJECT RISK BOARD */}
      <Card id="project-risk-board" className="overflow-hidden border-border-soft shadow-soft">
        <CardHeader className="border-b border-border-soft pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-section-title font-bold">Project Risk Board</CardTitle>
              <p className="text-body text-text-secondary">
                Enterprise dashboard mapping real-time completion status, booking inventory, and operational risk metrics.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="neutral" className="px-2 py-1 text-label font-bold uppercase rounded-md">
                Active Projects: {totalProjectsCount}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        {/* Table Filters Toolbar */}
        <div className="p-4 bg-surface-secondary border-b border-border-soft flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search projects, stages..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 pl-10 pr-4 w-60 rounded-[var(--radius-button)] border border-border-soft bg-white text-label focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            {/* Risk Filter Tabs */}
            <div className="flex items-center rounded-lg border border-border-soft bg-white p-1 shadow-xs">
              {["All", "Healthy", "Watch", "Critical"].map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setRiskFilter(level);
                    setCurrentPage(1);
                  }}
                  className={`h-8 px-3 rounded-md text-label font-medium transition-all ${
                    riskFilter === level
                      ? level === "Healthy" ? "bg-success text-white" :
                        level === "Watch" ? "bg-warning text-white" :
                        level === "Critical" ? "bg-error text-white" :
                        "bg-text-primary text-white"
                      : "text-text-secondary hover:bg-hover"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Project Selector */}
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-[var(--radius-button)] border border-border-soft bg-white px-3 text-label font-semibold text-text-primary focus:outline-none cursor-pointer hover:bg-hover"
            >
              <option value="All">All Projects</option>
              {allProjectNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {/* Stage Selector */}
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-[var(--radius-button)] border border-border-soft bg-white px-3 text-label font-semibold text-text-primary focus:outline-none cursor-pointer hover:bg-hover"
            >
              <option value="All">All Stages</option>
              {allStages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Workspace */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 bg-surface border-b border-border-soft text-label uppercase tracking-wider text-text-muted font-bold select-none z-10">
              <tr>
                <th onClick={() => handleSort("projectName")} className="p-4 cursor-pointer hover:text-text-primary transition-all">
                  <div className="flex items-center gap-1.5">
                    <span>Project</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th onClick={() => handleSort("stage")} className="p-4 cursor-pointer hover:text-text-primary transition-all">
                  <div className="flex items-center gap-1.5">
                    <span>Stage</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th onClick={() => handleSort("bookedUnits")} className="p-4 text-center cursor-pointer hover:text-text-primary transition-all">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Booked</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th onClick={() => handleSort("availableUnits")} className="p-4 text-center cursor-pointer hover:text-text-primary transition-all">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Available</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th onClick={() => handleSort("riskScore")} className="p-4 cursor-pointer hover:text-text-primary transition-all">
                  <div className="flex items-center gap-1.5">
                    <span>Risk Score</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="p-4 text-center">Signals</th>
                <th className="p-4 text-center">Delays</th>
                <th className="p-4 text-center">Shortages</th>
                <th className="p-4 text-center">Labor Pressure</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft text-table text-text-primary font-medium">
              {paginatedProjects.length > 0 ? (
                paginatedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-hover/40 transition-colors group cursor-pointer">
                    <td className="p-4 font-bold text-text-primary">
                      {project.projectName}
                    </td>
                    <td className="p-4 text-text-secondary text-label">
                      {project.stage}
                    </td>
                    <td className="p-4 text-center font-semibold text-accent-primary">
                      {project.bookedUnits} Units
                    </td>
                    <td className="p-4 text-center font-semibold text-text-muted">
                      {project.availableUnits} Units
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-label font-bold text-right">{project.riskScore}</span>
                        <div className="w-16 h-2 rounded-full bg-hover overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              project.riskScore >= 75 ? "bg-error" : project.riskScore >= 45 ? "bg-warning" : "bg-success"
                            }`}
                            style={{ width: `${project.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        project.signalCount > 3 ? "bg-error/10 text-error" : "bg-surface-secondary text-text-muted"
                      }`}>
                        {project.signalCount} signals
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {project.delayedMilestones > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-warning/10 text-warning text-[11px] font-bold">
                          {project.delayedMilestones} delayed
                        </span>
                      ) : (
                        <span className="text-text-muted text-[11px]">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {project.materialShortages > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-error/10 text-error text-[11px] font-bold">
                          {project.materialShortages} stock
                        </span>
                      ) : (
                        <span className="text-text-muted text-[11px]">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {project.workforcePressure ? (
                        <span className="px-2 py-0.5 rounded-md bg-warning/10 text-warning text-[11px] font-bold">
                          Understaffed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-success/10 text-success text-[11px] font-bold">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Badge tone={badgeToneFromStatus(project.tone)} className="font-semibold text-xs px-2.5 py-0.5 rounded-full">
                        {project.riskLevel}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/projects/all-projects`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft bg-white hover:bg-hover text-text-muted hover:text-accent-primary shadow-xs transition-colors"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-body text-text-muted">
                    No projects found matching the active search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Controls */}
        <div className="p-4 border-t border-border-soft bg-surface-secondary flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-label text-text-secondary">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-border-soft bg-white px-2 focus:outline-none cursor-pointer"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span>Projects</span>
            </div>
            <span>
              Showing {totalProjectsCount > 0 ? pageStartIndex + 1 : 0} to {pageEndIndex} of {totalProjectsCount} Projects
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center h-8 px-3 rounded-lg border border-border-soft bg-white hover:bg-hover text-label font-medium shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Previous</span>
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPagesCount }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`h-8 w-8 rounded-lg text-label font-bold transition-all ${
                    currentPage === p
                      ? "bg-accent-primary text-white shadow-soft"
                      : "border border-border-soft bg-white text-text-secondary hover:bg-hover"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPagesCount, p + 1))}
              disabled={currentPage === totalPagesCount || totalPagesCount === 0}
              className="flex items-center justify-center h-8 px-3 rounded-lg border border-border-soft bg-white hover:bg-hover text-label font-medium shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </Card>

      {/* SECTION 7: EXECUTIVE WATCHLIST */}
      <div id="executive-watchlist" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8 overflow-hidden border-border-soft shadow-soft">
          <CardHeader className="border-b border-border-soft pb-4">
            <div className="space-y-1">
              <CardTitle className="text-section-title font-bold">Executive Watchlist</CardTitle>
              <p className="text-body text-text-secondary">
                Immediate alerts and operations flagged by compliance, audit, and risk engines.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="space-y-4">
              {watchlistSorted.map((alert) => {
                const priorityTone = alert.severity.toLowerCase();
                const alertStyle =
                  priorityTone === "critical"
                    ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/8"
                    : priorityTone === "high"
                      ? "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/8"
                      : "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/8";

                return (
                  <div
                    key={alert.id}
                    className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${alertStyle}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge tone={badgeToneFromStatus(priorityTone)} className="px-2 py-0.5 text-[10px] rounded-md font-bold uppercase tracking-wider">
                          {alert.severity}
                        </Badge>
                        <span className="text-[11px] text-text-muted uppercase font-bold">Category: {alert.category}</span>
                      </div>
                      <h4 className="text-card-title font-bold text-text-primary mt-1">{alert.title}</h4>
                      <p className="text-body text-text-secondary leading-relaxed">{alert.message}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-text-muted uppercase font-bold">Owner</p>
                        <p className="text-label font-semibold text-text-primary mt-0.5">{alert.ownerName}</p>
                      </div>
                      <Link
                        href={`/purchases/approvals`}
                        className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-white border border-border-soft hover:bg-hover text-label font-bold text-text-primary shadow-xs transition-all"
                      >
                        <span>Take Action</span>
                        <ArrowUpRight className="h-4 w-4 text-text-muted" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 8: EXECUTIVE NOTES */}
        <Card className="lg:col-span-4 overflow-hidden border-border-soft shadow-soft">
          <CardHeader className="border-b border-border-soft pb-4">
            <div className="space-y-1">
              <CardTitle className="text-section-title font-bold">Executive Notes</CardTitle>
              <p className="text-body text-text-secondary">
                Observations and strategic highlights compiled by the portfolio risk engine.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative border-l border-border-soft pl-6 space-y-8 py-2">
              {executiveDashboard.executiveNotes.map((note, index) => (
                <div key={index} className="relative space-y-1.5">
                  {/* Timeline dot */}
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-accent-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
                  </span>
                  <div className="flex items-center justify-between text-label text-text-muted font-semibold">
                    <span>Observation #{index + 1}</span>
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>Today</span>
                    </span>
                  </div>
                  <p className="text-body text-text-primary leading-relaxed font-semibold">
                    {note}
                  </p>
                  <p className="text-[11px] text-accent-primary font-bold uppercase tracking-wider">
                    System Generated Risk Advisory
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 9: QUICK ACTIONS PANEL */}
      <div className="space-y-4">
        <h3 className="text-section-title text-text-primary font-bold">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Link
            href="/management/financial-overview"
            className="rounded-xl border border-border-soft bg-surface p-4 text-center hover:bg-hover hover:border-accent-primary/20 hover:-translate-y-0.5 transition-all shadow-soft flex flex-col items-center justify-center space-y-3"
          >
            <div className="p-3 bg-blue-500/10 text-accent-primary rounded-xl">
              <IndianRupee className="h-5 w-5" />
            </div>
            <span className="text-label font-bold text-text-primary">Financial Reports</span>
          </Link>

          <Link
            href="/people/employees"
            className="rounded-xl border border-border-soft bg-surface p-4 text-center hover:bg-hover hover:border-accent-primary/20 hover:-translate-y-0.5 transition-all shadow-soft flex flex-col items-center justify-center space-y-3"
          >
            <div className="p-3 bg-emerald-500/10 text-success rounded-xl">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-label font-bold text-text-primary">Workforce Insights</span>
          </Link>

          <Link
            href="/materials/materials-list"
            className="rounded-xl border border-border-soft bg-surface p-4 text-center hover:bg-hover hover:border-accent-primary/20 hover:-translate-y-0.5 transition-all shadow-soft flex flex-col items-center justify-center space-y-3"
          >
            <div className="p-3 bg-red-500/10 text-error rounded-xl">
              <PackageCheck className="h-5 w-5" />
            </div>
            <span className="text-label font-bold text-text-primary">Material Alerts</span>
          </Link>

          <Link
            href="/management/project-health"
            className="rounded-xl border border-border-soft bg-surface p-4 text-center hover:bg-hover hover:border-accent-primary/20 hover:-translate-y-0.5 transition-all shadow-soft flex flex-col items-center justify-center space-y-3"
          >
            <div className="p-3 bg-amber-500/10 text-warning rounded-xl">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="text-label font-bold text-text-primary">Project Risks</span>
          </Link>

          <Link
            href="/purchases/approvals"
            className="rounded-xl border border-border-soft bg-surface p-4 text-center hover:bg-hover hover:border-accent-primary/20 hover:-translate-y-0.5 transition-all shadow-soft flex flex-col items-center justify-center space-y-3"
          >
            <div className="p-3 bg-purple-500/10 text-purple rounded-xl">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <span className="text-label font-bold text-text-primary">Approvals</span>
          </Link>

          <Link
            href="/sales/insights"
            className="rounded-xl border border-border-soft bg-surface p-4 text-center hover:bg-hover hover:border-accent-primary/20 hover:-translate-y-0.5 transition-all shadow-soft flex flex-col items-center justify-center space-y-3"
          >
            <div className="p-3 bg-cyan-500/10 text-cyan-600 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-label font-bold text-text-primary">Sales Analytics</span>
          </Link>
        </div>
      </div>

      {/* Export Toast Alert */}
      {showExportToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-text-primary text-white px-5 py-4 rounded-xl shadow-floating flex items-center gap-3 border border-white/10 animate-in slide-in-from-bottom-5">
          <div className="p-1 bg-white/10 rounded-lg text-success">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-label font-bold">Snapshot Exported</p>
            <p className="text-[11px] text-text-muted mt-0.5">PDF report download initiated successfully.</p>
          </div>
        </div>
      )}
    </section>
  );
}

export function ApprovalQueueWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["erp-approvals", role],
    queryFn: async () => (await apiRequest<ApprovalsResponse>("/api/admin/approvals", { role })).data,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ approvalId, action }: { approvalId: string; action: "approve" | "reject" }) =>
      apiRequest(`/api/admin/approvals/${approvalId}`, {
        role,
        method: "PATCH",
        body: { action },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-approvals"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-approval-alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-admin-settings"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-purchase-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  if (query.isLoading) {
    return <LoadingStateCard title="Loading approval queue" />;
  }

  if (query.error || !query.data) {
    return <ErrorStateCard message="Approval queue data is unavailable." />;
  }

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Approval Queue"
        description="Review booking, finance, and policy approvals from a central queue with clear priorities and due dates."
      />

      <KpiGrid
        items={[
          { label: "Pending", value: `${query.data.summary.pending}`, trend: "Awaiting action", tone: "warning" },
          { label: "High Priority", value: `${query.data.summary.highPriority}`, trend: "Need same-day review", tone: "warning" },
          { label: "Overdue", value: `${query.data.summary.overdue}`, trend: "Past due timeline", tone: "warning" },
          { label: "Approved", value: `${query.data.summary.approvedThisWeek}`, trend: "Recently cleared", tone: "success" },
        ]}
      />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Actionable Approval Register</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[1060px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">Request</th>
                  <th className="px-4 text-left">Module</th>
                  <th className="px-4 text-left">Priority</th>
                  <th className="px-4 text-left">Owner</th>
                  <th className="px-4 text-left">Due</th>
                  <th className="px-4 text-left">Status</th>
                  <th className="px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data.approvals.map((item) => (
                  <tr key={item.id} className="border-t border-border-soft">
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-medium text-text-primary">{item.title}</p>
                        <p className="text-label text-text-muted">{item.summary}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">{item.module}</td>
                    <td className="px-4 py-4">
                      <Badge tone={toneForSeverity(item.priority)}>{item.priority}</Badge>
                    </td>
                    <td className="px-4 py-4">{item.ownerName}</td>
                    <td className="px-4 py-4">{formatDateTime(item.dueAt)}</td>
                    <td className="px-4 py-4">
                      <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      {item.status === "Pending" ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" loading={actionMutation.isPending} onClick={() => actionMutation.mutate({ approvalId: item.id, action: "approve" })}>
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" loading={actionMutation.isPending} onClick={() => actionMutation.mutate({ approvalId: item.id, action: "reject" })}>
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-label text-text-muted">{item.actedByName || "Handled"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function DocumentsComplianceWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    category: "Agreement",
    module: "Bookings",
    projectId: "",
    version: "v1",
    status: "Pending Review",
    expiryDate: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const docsQuery = useQuery({
    queryKey: ["erp-documents", role],
    queryFn: async () => (await apiRequest<DocumentRegisterResponse>("/api/admin/documents", { role })).data,
  });
  const complianceQuery = useQuery({
    queryKey: ["erp-compliance", role],
    queryFn: async () => (await apiRequest<ComplianceResponse>("/api/admin/compliance", { role })).data,
  });
  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });
  const usersQuery = useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (selectedFile) {
        return uploadDocument(role, selectedFile, {
          title: form.title,
          category: form.category,
          module: form.module,
          projectId: form.projectId || "",
          version: form.version,
          status: form.status,
          expiryDate: form.expiryDate || "",
          ownerId: usersQuery.data?.users[0]?.id || "",
        });
      }
      return apiRequest("/api/admin/documents", {
        role,
        method: "POST",
        body: {
          ...form,
          projectId: form.projectId || undefined,
          expiryDate: form.expiryDate || undefined,
          ownerId: usersQuery.data?.users[0]?.id,
        },
      });
    },
    onSuccess: async () => {
      setForm({
        title: "",
        category: "Agreement",
        module: "Bookings",
        projectId: "",
        version: "v1",
        status: "Pending Review",
        expiryDate: "",
      });
      setSelectedFile(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-documents"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-compliance"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-admin-settings"] }),
      ]);
    },
  });

  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projectsQuery.data?.projects[0]?.id || "" }));
    }
  }, [form.projectId, projectsQuery.data?.projects]);

  if (docsQuery.isLoading || complianceQuery.isLoading || projectsQuery.isLoading || usersQuery.isLoading) {
    return <LoadingStateCard title="Loading documents and compliance workspace" />;
  }

  if (docsQuery.error || complianceQuery.error || projectsQuery.error || usersQuery.error || !docsQuery.data || !complianceQuery.data || !projectsQuery.data) {
    return <ErrorStateCard message="Document or compliance data is unavailable." />;
  }

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Documents and Compliance"
        description="Centralize agreements, demand letters, and compliance documentation with expiry visibility and operational ownership."
      />

      <KpiGrid
        items={[
          { label: "Documents", value: `${docsQuery.data.documents.length}`, trend: "Records in DMS", tone: "info" },
          { label: "Compliance Items", value: `${complianceQuery.data.items.length}`, trend: "Tracked obligations", tone: "warning" },
          { label: "Expiring Soon", value: `${complianceQuery.data.summary.expiringSoon}`, trend: "Immediate action needed", tone: "warning" },
          { label: "In Review", value: `${complianceQuery.data.summary.inReview}`, trend: "Pending resolution", tone: "warning" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Document Register</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <div className="overflow-auto">
                <table className="w-full min-w-[960px] text-table">
                  <thead className="bg-surface-secondary text-text-secondary">
                    <tr className="h-12 border-b border-border-soft">
                      <th className="px-4 text-left">Document</th>
                      <th className="px-4 text-left">Category</th>
                      <th className="px-4 text-left">Project</th>
                      <th className="px-4 text-left">Version</th>
                      <th className="px-4 text-left">Status</th>
                      <th className="px-4 text-left">Uploaded</th>
                      <th className="px-4 text-left">File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docsQuery.data.documents.map((item) => (
                      <tr key={item.id} className="border-t border-border-soft">
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-text-primary">{item.title}</p>
                            <p className="text-label text-text-muted">Owner: {item.ownerName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">{item.category}</td>
                        <td className="px-4 py-4">{item.projectName}</td>
                        <td className="px-4 py-4">{item.version}</td>
                        <td className="px-4 py-4">
                          <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                        </td>
                        <td className="px-4 py-4">{formatDateTime(item.uploadedAt)}</td>
                        <td className="px-4 py-4">
                          {item.fileUrl ? (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-body font-medium text-accent-primary hover:underline"
                            >
                              <Download className="h-4 w-4" />
                              {item.originalName || "Download"}
                            </a>
                          ) : (
                            <span className="text-label text-text-muted">Record only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Compliance Register</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <div className="overflow-auto">
                <table className="w-full min-w-[920px] text-table">
                  <thead className="bg-surface-secondary text-text-secondary">
                    <tr className="h-12 border-b border-border-soft">
                      <th className="px-4 text-left">Approval</th>
                      <th className="px-4 text-left">Project</th>
                      <th className="px-4 text-left">Authority</th>
                      <th className="px-4 text-left">Expiry</th>
                      <th className="px-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceQuery.data.items.map((item) => (
                      <tr key={item.id} className="border-t border-border-soft">
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-text-primary">{item.approvalType}</p>
                            <p className="text-label text-text-muted">{item.notes}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">{item.projectName}</td>
                        <td className="px-4 py-4">{item.authority}</td>
                        <td className="px-4 py-4">{formatDate(item.expiryDate)}</td>
                        <td className="px-4 py-4">
                          <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Document Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Title</label>
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Category</label>
                <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className={selectClassName}>
                  <option value="Agreement">Agreement</option>
                  <option value="Demand Letter">Demand Letter</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Receipt">Receipt</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Module</label>
                <select value={form.module} onChange={(event) => setForm((current) => ({ ...current, module: event.target.value }))} className={selectClassName}>
                  <option value="Bookings">Bookings</option>
                  <option value="Collections">Collections</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Settings">Settings</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Project</label>
              <select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} className={selectClassName}>
                {projectsQuery.data.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Version</label>
                <Input value={form.version} onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Status</label>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={selectClassName}>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Generated">Generated</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Expiry date</label>
              <Input type="date" value={form.expiryDate} onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))} />
            </div>
            <FileUpload onFileSelect={setSelectedFile} />
            <div className="flex justify-end">
              <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
                <FilePlus2 className="h-4 w-4" />
                {selectedFile ? "Upload & Add Document" : "Add Document"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function WorkflowSettingsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const settingsQuery = useAdminSettings();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async ({ settingId, defaultValue }: { settingId: string; defaultValue: string }) =>
      apiRequest(`/api/admin/workflow-settings/${settingId}`, {
        role,
        method: "PATCH",
        body: { defaultValue, status: "Active" },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-admin-settings"] });
    },
  });
  const biometricSyncMutation = useMutation({
    mutationFn: async () => apiRequest("/api/admin/integrations/biometric/sync", { role, method: "POST" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-admin-settings"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-attendance"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-employees"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-project-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  if (settingsQuery.isLoading) {
    return <LoadingStateCard title="Loading workflow settings" />;
  }

  if (settingsQuery.error || !settingsQuery.data) {
    return <ErrorStateCard message="Workflow settings are unavailable." />;
  }

  const biometricCadence = findSettingValue(settingsQuery.data.workflowSettings, "BIO_SYNC_CADENCE");
  const biometricStatus = findSettingValue(settingsQuery.data.workflowSettings, "BIO_GATEWAY_STATUS");
  const biometricLastSync = findSettingValue(settingsQuery.data.workflowSettings, "BIO_LAST_SYNC");
  const biometricDevices = [
    { name: "Main Gate Scanner", location: "Aurora Residency", status: biometricStatus },
    { name: "Tower C Turnstile", location: "Skyline Enclave", status: biometricStatus },
    { name: "Site Cabin Tablet", location: "Riverfront Villas", status: biometricStatus },
  ];

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Workflow Settings"
        description="Configure approval routes, SLAs, and collection cadence without leaving the ERP control layer."
      />

      <KpiGrid
        items={[
          { label: "Policies", value: `${settingsQuery.data.workflowSettings.length}`, trend: "Editable workflow controls", tone: "info" },
          { label: "Audit Events", value: `${settingsQuery.data.auditLogs.length}`, trend: "Latest tracked changes", tone: "warning" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Editable Workflow Policies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsQuery.data.workflowSettings.map((setting) => (
              <div key={setting.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-text-primary">{setting.name}</p>
                    <p className="text-label text-text-muted">{setting.code}</p>
                  </div>
                  <Badge tone={toneForStatus(setting.status)}>{setting.status}</Badge>
                </div>
                <div className="mt-4 flex gap-3">
                  <Input
                    value={drafts[setting.id] ?? setting.defaultValue}
                    onChange={(event) => setDrafts((current) => ({ ...current, [setting.id]: event.target.value }))}
                  />
                  <Button
                    loading={mutation.isPending}
                    onClick={() => mutation.mutate({ settingId: setting.id, defaultValue: drafts[setting.id] ?? setting.defaultValue })}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Control Changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-accent-primary" />
                    <p className="font-medium text-text-primary">Biometric Device Bridge</p>
                  </div>
                  <p className="text-body text-text-secondary">Demo sync for gate scanners and site kiosks without any live hardware dependency.</p>
                </div>
                <Badge tone={toneForStatus(biometricStatus)}>{biometricStatus}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface p-3">
                  <p className="text-label text-text-muted">Sync cadence</p>
                  <p className="mt-1 font-medium text-text-primary">{biometricCadence}</p>
                </div>
                <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface p-3">
                  <p className="text-label text-text-muted">Last sync</p>
                  <p className="mt-1 font-medium text-text-primary">{biometricLastSync.includes("T") ? formatDateTime(biometricLastSync) : biometricLastSync}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-label text-text-muted">Device list</p>
                {biometricDevices.map((device) => (
                  <div key={device.name} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-input)] border border-border-soft bg-surface p-3">
                    <div>
                      <p className="font-medium text-text-primary">{device.name}</p>
                      <p className="text-label text-text-muted">{device.location}</p>
                    </div>
                    <Badge tone={toneForStatus(device.status)}>{device.status}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button loading={biometricSyncMutation.isPending} onClick={() => biometricSyncMutation.mutate()}>
                  <RefreshCcw className="h-4 w-4" />
                  Run Demo Sync
                </Button>
              </div>
            </div>
            {settingsQuery.data.auditLogs.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-text-primary">{item.title}</p>
                  <Badge tone="info">{item.category}</Badge>
                </div>
                <p className="mt-2 text-body text-text-secondary">{item.detail}</p>
                <p className="mt-2 text-label text-text-muted">
                  {item.actorName} · {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function NotificationSettingsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const settingsQuery = useAdminSettings();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async ({ settingId, defaultValue }: { settingId: string; defaultValue: string }) =>
      apiRequest(`/api/admin/notification-settings/${settingId}`, {
        role,
        method: "PATCH",
        body: { defaultValue, status: "Active" },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-admin-settings"] });
    },
  });
  const whatsappTestMutation = useMutation({
    mutationFn: async () => apiRequest("/api/admin/integrations/whatsapp/test", { role, method: "POST" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-admin-settings"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });
  const whatsappSendMutation = useMutation({
    mutationFn: async () => apiRequest("/api/admin/integrations/whatsapp/send-demo", { role, method: "POST" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-admin-settings"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  if (settingsQuery.isLoading) {
    return <LoadingStateCard title="Loading notification settings" />;
  }

  if (settingsQuery.error || !settingsQuery.data) {
    return <ErrorStateCard message="Notification settings are unavailable." />;
  }

  const whatsappStatus = findSettingValue(settingsQuery.data.notificationSettings, "WHATSAPP_CHANNEL_STATUS");
  const whatsappRecipient = findSettingValue(settingsQuery.data.notificationSettings, "WHATSAPP_DEFAULT_RECIPIENT");
  const whatsappTemplatePack = findSettingValue(settingsQuery.data.notificationSettings, "WHATSAPP_TEMPLATE_PACK");
  const whatsappLastActivity = findSettingValue(settingsQuery.data.notificationSettings, "WHATSAPP_LAST_ACTIVITY");

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Notification Settings"
        description="Control reminders, escalation notifications, and high-value commercial alerts from the admin layer."
      />

      <KpiGrid
        items={[
          { label: "Notification Rules", value: `${settingsQuery.data.notificationSettings.length}`, trend: "Configurable comms", tone: "info" },
          { label: "Audit Trail", value: `${settingsQuery.data.auditLogs.length}`, trend: "Recent admin activity", tone: "warning" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Notification Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsQuery.data.notificationSettings.map((setting) => (
              <div key={setting.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-text-primary">{setting.name}</p>
                    <p className="text-label text-text-muted">{setting.code}</p>
                  </div>
                  <Badge tone={toneForStatus(setting.status)}>{setting.status}</Badge>
                </div>
                <div className="mt-4 flex gap-3">
                  <Input
                    value={drafts[setting.id] ?? setting.defaultValue}
                    onChange={(event) => setDrafts((current) => ({ ...current, [setting.id]: event.target.value }))}
                  />
                  <Button
                    loading={mutation.isPending}
                    onClick={() => mutation.mutate({ settingId: setting.id, defaultValue: drafts[setting.id] ?? setting.defaultValue })}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Guidance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-accent-primary" />
                    <p className="font-medium text-text-primary">WhatsApp Demo Integration</p>
                  </div>
                  <p className="mt-2 text-body text-text-secondary">Functional demo channel for approvals, reminders, and customer notifications without any live WhatsApp dependency.</p>
                </div>
                <Badge tone={toneForStatus(whatsappStatus)}>{whatsappStatus}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface p-3">
                  <p className="text-label text-text-muted">Default recipient</p>
                  <p className="mt-1 font-medium text-text-primary">{whatsappRecipient}</p>
                </div>
                <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface p-3">
                  <p className="text-label text-text-muted">Template pack</p>
                  <p className="mt-1 font-medium text-text-primary">{whatsappTemplatePack}</p>
                </div>
                <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface p-3 md:col-span-2">
                  <p className="text-label text-text-muted">Last activity</p>
                  <p className="mt-1 font-medium text-text-primary">{whatsappLastActivity.includes("T") ? formatDateTime(whatsappLastActivity) : whatsappLastActivity}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <Button variant="secondary" loading={whatsappTestMutation.isPending} onClick={() => whatsappTestMutation.mutate()}>
                  <Smartphone className="h-4 w-4" />
                  Test Channel
                </Button>
                <Button loading={whatsappSendMutation.isPending} onClick={() => whatsappSendMutation.mutate()}>
                  <Send className="h-4 w-4" />
                  Send Demo Alert
                </Button>
              </div>
            </div>
            <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-primary" />
                <p className="font-medium text-text-primary">Reminder coverage</p>
              </div>
              <p className="mt-2 text-body text-text-secondary">Keep booking dues, SLA escalations, and approval nudges aligned to the same operational cadence.</p>
            </div>
            <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
              <div className="flex items-center gap-2">
                <Siren className="h-4 w-4 text-accent-primary" />
                <p className="font-medium text-text-primary">Executive visibility</p>
              </div>
              <p className="mt-2 text-body text-text-secondary">High-value booking and compliance alerts should remain enabled to preserve management awareness.</p>
            </div>
            <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
              <div className="flex items-center gap-2">
                <SquareCheckBig className="h-4 w-4 text-accent-primary" />
                <p className="font-medium text-text-primary">Audit safety</p>
              </div>
              <p className="mt-2 text-body text-text-secondary">Every saved notification change is written into the audit timeline so admin updates remain reviewable.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function ExportCenterWorkspace() {
  const role = useUiStore((state) => state.role);

  const dashboardQuery = useQuery({
    queryKey: ["erp-dashboard", role],
    queryFn: async () => (await apiRequest<DashboardResponse>("/api/reports/dashboard", { role })).data,
  });
  const financialQuery = useQuery({
    queryKey: ["erp-financial-overview", role],
    queryFn: async () => (await apiRequest<FinancialOverview>("/api/reports/financial-overview", { role })).data,
  });
  const reportsQuery = useQuery({
    queryKey: ["erp-dashboard-reports", role],
    queryFn: async () => (await apiRequest<DashboardReportsResponse>("/api/reports/dashboard-reports", { role })).data,
  });
  const executiveQuery = useQuery({
    queryKey: ["erp-executive-dashboard", role],
    queryFn: async () => (await apiRequest<ExecutiveDashboardResponse>("/api/reports/executive-dashboard", { role })).data,
  });

  const loading = dashboardQuery.isLoading || financialQuery.isLoading || reportsQuery.isLoading || executiveQuery.isLoading;
  const error = dashboardQuery.error || financialQuery.error || reportsQuery.error || executiveQuery.error;

  if (loading) {
    return <LoadingStateCard title="Loading export center" />;
  }

  if (error) {
    return <ErrorStateCard message="Export data is unavailable." />;
  }

  const reports = [
    {
      title: "Operations Dashboard",
      description: "Active leads, scheduled visits, active bookings, outstanding dues.",
      metrics: dashboardQuery.data ? [
        `${dashboardQuery.data.kpis.activeLeads} leads`,
        `${dashboardQuery.data.kpis.scheduledVisits} visits`,
        `${dashboardQuery.data.kpis.activeBookings} bookings`,
        formatCurrency(dashboardQuery.data.kpis.totalOutstanding),
      ] : [],
    },
    {
      title: "Financial Overview",
      description: "Collections, outstanding dues, due-soon amounts, overdue installments.",
      metrics: financialQuery.data ? [
        formatCurrency(financialQuery.data.totalReceipts),
        formatCurrency(financialQuery.data.outstanding),
        formatCurrency(financialQuery.data.dueSoonAmount),
        `${financialQuery.data.overdueCount} overdue`,
      ] : [],
    },
    {
      title: "Executive Dashboard",
      description: "Portfolio value, collections outstanding, approval queue, compliance exposure.",
      metrics: executiveQuery.data ? [
        formatCurrency(executiveQuery.data.executiveKpis.portfolioValue),
        `${executiveQuery.data.executiveKpis.approvalQueue} approvals`,
        `${executiveQuery.data.executiveKpis.complianceExposure} compliance`,
      ] : [],
    },
    {
      title: "Dashboard Reports",
      description: "Cross-functional summaries across lead conversion, inventory, and approvals.",
      metrics: reportsQuery.data ? [
        ...reportsQuery.data.summaryCards
          .filter((c): c is typeof c & { value: number } => typeof c.value === "number")
          .slice(0, 4)
          .map((c) => `${c.label}: ${formatCurrency(c.value)}`),
      ] : [],
    },
  ];

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Export Center"
        description="Central export queue for generated reports across operations, finance, and executive summaries."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body text-text-secondary">{report.description}</p>
              {report.metrics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {report.metrics.map((metric, i) => (
                    <Badge key={i} tone="info">{metric}</Badge>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info(`Export ${report.title} — CSV generation not yet implemented.`)}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
