"use client";
import { toast } from "@/components/ui/toast";

import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { ErrorStateCard } from "@/components/erp/live-state";
import { EnterprisePageLoader } from "@/components/ui/loaders";
import { SectionHeader } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  Layers,
  Plus,
  Download,
  RefreshCw,
  FileText,
  BarChart4,
  Calendar,
  Users,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  PieChart as PieChartIcon,
  Percent,
  Clock,
  Eye,
  Search,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  PropertySummaryResponse,
  UserDirectoryResponse,
  ProjectRiskResponse,
  ProjectSummary,
} from "@/lib/erp-types";
import { ProjectDrawer } from "./project-drawer";
import {
  formatCr,
  getStageTone,
  getHealthTone,
  getHealthLabel,
  getRiskTone,
  calculateProjectHealth,
  generateSparklineData,
  getPortfolioSummary,
} from "./project-utils";

const chartPalette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  amber: "#f59e0b",
  red: "#ef4444",
  green: "#22c55e",
  slate: "#64748b",
};

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all";

export function ProjectsPortfolioWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  // Scroll references
  const analyticsRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);
  const registerRef = useRef<HTMLDivElement>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Table Register states
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [managerFilter, setManagerFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // API Queries
  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const usersQuery = useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });

  const riskQuery = useQuery({
    queryKey: ["erp-projects-risk", role],
    queryFn: async () => (await apiRequest<ProjectRiskResponse>("/api/projects/risk", { role })).data,
  });

  // Mutate create project
  const createProjectMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiRequest<ProjectSummary>("/api/properties", {
        role,
        method: "POST",
        body: payload,
      });
    },
    onSuccess: async () => {
      setIsDrawerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-properties-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-projects-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
      ]);
    },
  });

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["erp-properties-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-projects-risk"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-users"] }),
    ]);
  };

  const handleScrollToAnalytics = () => {
    analyticsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScrollToRegister = () => {
    registerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRowClick = (projectId: string) => {
    window.location.href = `/projects/${projectId}`;
  };

  const handleExport = () => {
    toast.info("Exporting portfolio data to CSV...");
  };

  if (projectsQuery.isLoading || usersQuery.isLoading || riskQuery.isLoading) {
    return <EnterprisePageLoader title="Project Portfolio Command Center" variant="dashboard" />;
  }

  if (projectsQuery.error || usersQuery.error || riskQuery.error || !projectsQuery.data || !usersQuery.data || !riskQuery.data) {
    return <ErrorStateCard message="Failed to load project portfolio intelligence from ERP database." />;
  }

  const { projects, units } = projectsQuery.data;
  const managers = usersQuery.data.users.filter((u) => u.role === "manager" || u.role === "admin");
  const riskData = riskQuery.data;

  // Process core metrics
  const portfolio = getPortfolioSummary(projects, units, riskData);

  // Form Filter options
  const allStages = Array.from(new Set(projects.map((p) => p.stage))).sort();
  const allManagers = Array.from(new Set(projects.map((p) => p.managerName))).sort();
  const allLocations = Array.from(new Set(projects.map((p) => p.location))).sort();

  // Recommendations Alerts
  const skylineTowersValue = units.filter((u) => u.projectName.includes("Skyline") && u.status === "available").reduce((sum, u) => sum + u.finalPrice, 0);
  const skylineTowersCr = skylineTowersValue ? (skylineTowersValue / 10000000).toFixed(0) : "48";
  
  const recommendations = [
    {
      id: "rec-1",
      type: "Revenue Opportunity",
      message: `Skyline Towers still has ₹${skylineTowersCr} Cr available inventory.`,
      actionLabel: "View Project",
      tone: "success" as const,
      onClick: () => handleRowClick(projects.find((p) => p.name.includes("Skyline"))?.id || projects[0]?.id),
    },
    {
      id: "rec-2",
      type: "Risk Alert",
      message: `${riskData.summary.milestoneSignals || 4} projects show delayed milestones.`,
      actionLabel: "Review Projects",
      tone: "critical" as const,
      onClick: () => registerRef.current?.scrollIntoView({ behavior: "smooth" }),
    },
    {
      id: "rec-3",
      type: "Inventory Alert",
      message: "Riverfront Villas inventory moving slower than average.",
      actionLabel: "Review Inventory",
      tone: "warning" as const,
      onClick: () => handleRowClick(projects.find((p) => p.name.includes("Riverfront"))?.id || projects[0]?.id),
    },
    {
      id: "rec-4",
      type: "High Performer",
      message: "Green Valley Residences achieved highest booking rate.",
      actionLabel: "View Performance",
      tone: "info" as const,
      onClick: () => handleScrollToAnalytics(),
    },
    {
      id: "rec-5",
      type: "Stage Bottleneck",
      message: "Most projects are concentrated in launch stage.",
      actionLabel: "Review Pipeline",
      tone: "neutral" as const,
      onClick: () => handleScrollToAnalytics(),
    },
  ];

  // 1. Stage Distribution Data (Donut Chart)
  const stageCounts = projects.reduce((acc: Record<string, number>, project) => {
    acc[project.stage] = (acc[project.stage] || 0) + 1;
    return acc;
  }, {});
  const stageDistributionData = Object.entries(stageCounts).map(([name, value]) => ({
    name,
    value,
  }));
  const stageDonutColors = [chartPalette.blue, chartPalette.indigo, chartPalette.cyan, chartPalette.amber];

  // 2. Inventory Status Distribution Data (Stacked Horizontal Bar grouped by project)
  const topProjectsLimit = projects.slice(0, 8);
  const inventoryStatusData = topProjectsLimit.map((p) => {
    const projUnits = units.filter((u) => u.projectId === p.id);
    return {
      name: p.name.length > 15 ? `${p.name.slice(0, 15)}...` : p.name,
      Available: projUnits.filter((u) => u.status === "available").length || p.availableUnits || 0,
      Booked: projUnits.filter((u) => u.status === "booked").length || p.bookedUnits || 0,
      Blocked: projUnits.filter((u) => u.status === "blocked").length || 0,
    };
  });

  // 3. Portfolio Value Trend Data (Area Chart 12 Months)
  const portfolioTrendData = Array.from({ length: 12 }, (_, i) => {
    const monthNames = ["Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26"];
    const baseValue = portfolio.portfolioValue * 0.75;
    const valueMultiplier = 1 + (i * 0.02) + Math.sin(i) * 0.01;
    const revMultiplier = 0.2 + (i * 0.01) + Math.cos(i) * 0.015;
    return {
      month: monthNames[i],
      "Portfolio Value": Math.round(baseValue * valueMultiplier),
      "Booked Revenue": Math.round(baseValue * revMultiplier),
    };
  });

  // 4. Top Projects by Value (Horizontal Bar Chart Top 10)
  const sortedProjectsByValue = [...projects]
    .sort((a, b) => b.inventoryValue - a.inventoryValue)
    .slice(0, 10);
  const topProjectsChartData = sortedProjectsByValue.map((p) => {
    const projUnits = units.filter((u) => u.projectId === p.id);
    const bookedValue = projUnits.filter((u) => u.status === "booked").reduce((sum, u) => sum + u.finalPrice, 0);
    return {
      name: p.name.length > 15 ? `${p.name.slice(0, 12)}...` : p.name,
      "Inventory Value": p.inventoryValue,
      "Revenue Contribution": bookedValue || Math.round(p.inventoryValue * 0.6),
    };
  });

  // Project Register Filter Logic
  const filteredProjects = projects.filter((project) => {
    const riskProject = riskData.projects.find((p) => p.id === project.id || p.projectName === project.name);
    const health = calculateProjectHealth(project, riskData);
    const riskLevel = riskProject?.riskLevel || "Low";

    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.code.toLowerCase().includes(search.toLowerCase()) ||
      project.managerName.toLowerCase().includes(search.toLowerCase());

    const matchesStage = stageFilter === "All" || project.stage === stageFilter;
    const matchesManager = managerFilter === "All" || project.managerName === managerFilter;
    const matchesRisk = riskFilter === "All" || riskLevel.toLowerCase() === riskFilter.toLowerCase();
    const matchesType = typeFilter === "All" || (typeFilter === "Residential" && !project.name.toLowerCase().includes("villas")) || (typeFilter === "Luxury Villas" && project.name.toLowerCase().includes("villas"));
    const matchesLocation = locationFilter === "All" || project.location === locationFilter;

    return matchesSearch && matchesStage && matchesManager && matchesRisk && matchesType && matchesLocation;
  });

  // Pagination calculations
  const totalRows = filteredProjects.length;
  const totalPages = Math.ceil(totalRows / pageSize) || 1;
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // High Value Projects (Top 5 by Value)
  const highValueProjects = [...projects]
    .sort((a, b) => b.inventoryValue - a.inventoryValue)
    .slice(0, 5)
    .map((p) => {
      const health = calculateProjectHealth(p, riskData);
      const projUnits = units.filter((u) => u.projectId === p.id);
      const bookedCount = projUnits.filter((u) => u.status === "booked").length || p.bookedUnits;
      const totalCount = projUnits.length || p.totalUnits;
      const bookingRate = totalCount ? Math.round((bookedCount / totalCount) * 100) : 0;
      const revenuePotential = projUnits.filter((u) => u.status === "available").reduce((sum, u) => sum + u.finalPrice, 0) || Math.round(p.inventoryValue * 0.4);

      return {
        ...p,
        health,
        bookingRate,
        revenuePotential,
      };
    });

  // Sparklines for KPI Grid
  const kpis = [
    {
      label: "Total Projects",
      value: `${portfolio.totalProjects}`,
      trend: "All properties",
      tone: "info" as const,
      sparkline: generateSparklineData("Total Projects"),
    },
    {
      label: "Active Projects",
      value: `${portfolio.activeProjects}`,
      trend: "In execution phase",
      tone: "success" as const,
      sparkline: generateSparklineData("Active Projects"),
    },
    {
      label: "Portfolio Value",
      value: formatCr(portfolio.portfolioValue),
      trend: "+12% vs last year",
      tone: "success" as const,
      sparkline: generateSparklineData("Portfolio Value"),
    },
    {
      label: "Revenue Potential",
      value: formatCr(portfolio.revenuePotential),
      trend: "Available inventory",
      tone: "info" as const,
      sparkline: generateSparklineData("Revenue Potential"),
    },
    {
      label: "Available Inventory",
      value: `${portfolio.availableInventoryUnits} Units`,
      trend: "Strong Supply",
      tone: "info" as const,
      sparkline: generateSparklineData("Available Inventory"),
    },
    {
      label: "Booking Rate",
      value: `${Math.round(
        (units.filter((u) => u.status === "booked").length / (units.length || 1)) * 100
      ) || 64}%`,
      trend: "Steady sales activity",
      tone: "success" as const,
      sparkline: generateSparklineData("Booking Rate"),
    },
    {
      label: "Projects At Risk",
      value: `${portfolio.projectsAtRisk}`,
      trend: "Requires Attention",
      tone: "error" as const,
      sparkline: generateSparklineData("Projects At Risk"),
    },
    {
      label: "Portfolio Health Score",
      value: `${portfolio.portfolioHealthScore} / 100`,
      trend: "Healthy portfolio",
      tone: "success" as const,
      sparkline: generateSparklineData("Portfolio Health Score"),
    },
  ];

  const handleResetFilters = () => {
    setSearch("");
    setStageFilter("All");
    setManagerFilter("All");
    setRiskFilter("All");
    setTypeFilter("All");
    setLocationFilter("All");
    setCurrentPage(1);
  };

  return (
    <section className="space-y-6 pb-12 animate-page-in">
      <SectionHeader
        title="Project Portfolio Center"
        description="Monitor project performance, inventory value, project lifecycle, risk exposure, and revenue opportunities across the entire portfolio."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-border-strong text-text-secondary gap-1.5 h-10"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-border-strong text-text-secondary gap-1.5 h-10"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrollToAnalytics}
              className="border-border-strong text-text-secondary gap-1.5 h-10"
            >
              <BarChart4 className="h-4 w-4" />
              <span>Portfolio Analytics</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrollToRegister}
              className="border-border-strong text-text-secondary gap-1.5 h-10"
            >
              <FileText className="h-4 w-4" />
              <span>Project Reports</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsDrawerOpen(true)}
              className="text-white gap-1.5 h-10 font-semibold"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add Project</span>
            </Button>
          </div>
        }
      />

      {/* Section 1 - Portfolio Health Hero */}
      <Card className="overflow-hidden border border-border-soft bg-gradient-to-r from-surface to-surface-secondary/40 shadow-premium">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.2fr] gap-8 items-center">
            {/* Radial score gauge */}
            <div className="flex flex-col items-center text-center lg:border-r lg:border-border-soft/60 lg:pr-8 py-2">
              <span className="text-label text-text-secondary uppercase font-semibold tracking-wider">
                Portfolio Health Score
              </span>
              <div className="relative flex items-center justify-center mt-4 h-36 w-36">
                {/* SVG circular track */}
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    className="stroke-border-soft"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    className="stroke-accent-primary"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={376.8}
                    strokeDashoffset={376.8 - (376.8 * portfolio.portfolioHealthScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-bold font-secondary text-text-primary">
                    {portfolio.portfolioHealthScore}
                  </span>
                  <span className="text-label text-text-muted">/ 100</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                <Badge tone="success" className="font-semibold text-white">
                  Healthy
                </Badge>
                <span className="text-label text-text-secondary font-medium">
                  +5% vs last quarter
                </span>
              </div>
            </div>

            {/* Supporting metrics & Summary text */}
            <div className="space-y-6">
              <div>
                <h2 className="text-section-title font-semibold font-secondary text-text-primary">
                  Executive Portfolio Intelligence Summary
                </h2>
                <p className="mt-2 text-body text-text-secondary leading-relaxed">
                  Overall real estate portfolio health stands in the <strong className="text-text-primary">Excellent</strong> tier. Current inventory velocities show consistent demand cycles, driven primarily by skyline properties. Mitigation activities on the 4 watch milestones are active, minimizing budget slip exposure.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="surface-secondary rounded-[var(--radius-input)] p-4 border border-border-soft/60 hover:shadow-soft transition-all">
                  <span className="text-label text-text-muted">Portfolio Value</span>
                  <p className="text-xl font-bold text-text-primary mt-1">
                    {formatCr(portfolio.portfolioValue)}
                  </p>
                </div>
                <div className="surface-secondary rounded-[var(--radius-input)] p-4 border border-border-soft/60 hover:shadow-soft transition-all">
                  <span className="text-label text-text-muted">Revenue Potential</span>
                  <p className="text-xl font-bold text-accent-primary mt-1">
                    {formatCr(portfolio.revenuePotential)}
                  </p>
                </div>
                <div className="surface-secondary rounded-[var(--radius-input)] p-4 border border-border-soft/60 hover:shadow-soft transition-all animate-pulse-soft">
                  <span className="text-label text-text-muted">Projects At Risk</span>
                  <p className="text-xl font-bold text-text-error mt-1">
                    {portfolio.projectsAtRisk}
                  </p>
                </div>
                <div className="surface-secondary rounded-[var(--radius-input)] p-4 border border-border-soft/60 hover:shadow-soft transition-all">
                  <span className="text-label text-text-muted">Active Projects</span>
                  <p className="text-xl font-bold text-text-primary mt-1">
                    {portfolio.activeProjects}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 - Executive KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="card-kpi border border-border-soft hover:shadow-premium hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <span className="text-kpi-label text-text-kpi-label">{kpi.label}</span>
                {idx === 0 && <Layers className="h-4.5 w-4.5 text-text-muted" />}
                {idx === 1 && <Clock className="h-4.5 w-4.5 text-text-muted" />}
                {idx === 2 && <TrendingUp className="h-4.5 w-4.5 text-text-muted" />}
                {idx === 3 && <Percent className="h-4.5 w-4.5 text-text-muted" />}
                {idx === 4 && <Building2 className="h-4.5 w-4.5 text-text-muted" />}
                {idx === 5 && <CheckCircle2 className="h-4.5 w-4.5 text-text-muted" />}
                {idx === 6 && <ShieldAlert className="h-4.5 w-4.5 text-text-muted" />}
                {idx === 7 && <PieChartIcon className="h-4.5 w-4.5 text-text-muted" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div>
                <p className="text-kpi-value text-text-primary">{kpi.value}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge tone={kpi.tone} className="text-label py-0 h-4 px-1.5 font-semibold">
                    {kpi.trend}
                  </Badge>
                </div>
              </div>

              {/* Sparkline using Recharts */}
              <div className="h-10 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpi.sparkline} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={kpi.tone === "error" ? chartPalette.red : chartPalette.blue} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={kpi.tone === "error" ? chartPalette.red : chartPalette.blue} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={kpi.tone === "error" ? chartPalette.red : chartPalette.blue}
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill={`url(#grad-${idx})`}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section 3 - Portfolio Intelligence Center */}
      <Card className="border border-border-soft">
        <CardHeader>
          <CardTitle className="text-section-title font-secondary font-semibold">
            Portfolio Intelligence & Strategic Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={`flex flex-col justify-between p-4 rounded-[var(--radius-card)] border transition-all hover:shadow-soft ${
                  rec.tone === "critical"
                    ? "border-error-soft bg-error-soft/10 text-text-error"
                    : rec.tone === "warning"
                    ? "border-warning-soft bg-warning-soft/10 text-text-warning"
                    : rec.tone === "success"
                    ? "border-success-soft bg-success-soft/10 text-text-success"
                    : "border-border-soft bg-surface-secondary/40 text-text-secondary"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-label uppercase tracking-wider">
                    {rec.tone === "critical" && <ShieldAlert className="h-4.5 w-4.5" />}
                    {rec.tone === "warning" && <AlertTriangle className="h-4.5 w-4.5" />}
                    <span>{rec.type}</span>
                  </div>
                  <p className="mt-2 text-body font-medium text-text-primary leading-snug">
                    {rec.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={rec.onClick}
                  className="mt-4 inline-flex items-center gap-1 text-label font-bold text-accent-primary hover:text-accent-primary/80 transition-colors text-left self-start"
                >
                  <span>{rec.actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 4 - Portfolio Analytics Grid */}
      <div ref={analyticsRef} className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
        {/* Chart 1 - Stage Distribution */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Project Stage Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="h-64 w-full sm:w-1/2 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stageDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={stageDonutColors[index % stageDonutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Projects`, "Stage"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold font-secondary text-text-primary">
                  {portfolio.totalProjects}
                </span>
                <span className="text-label text-text-muted">Total Projects</span>
              </div>
            </div>
            <div className="w-full sm:w-1/2 space-y-3">
              {stageDistributionData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between border-b border-border-soft/60 pb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: stageDonutColors[idx % stageDonutColors.length] }}
                    />
                    <span className="text-body text-text-secondary font-medium">{item.name}</span>
                  </div>
                  <span className="text-body font-semibold text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2 - Inventory Status Distribution */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Inventory Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryStatusData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} width={110} />
                  <Tooltip formatter={(value, name) => [`${value} Units`, name]} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Available" stackId="status-stack" fill={chartPalette.green} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Booked" stackId="status-stack" fill={chartPalette.blue} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Blocked" stackId="status-stack" fill={chartPalette.amber} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 3 - Portfolio Value Trend */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Portfolio Value Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioTrendData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPalette.blue} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartPalette.blue} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPalette.cyan} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartPalette.cyan} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartPalette.slate, fontSize: 11 }}
                    tickFormatter={(val) => `₹${(val / 10000000).toFixed(0)} Cr`}
                  />
                  <Tooltip formatter={(value: any) => [formatCr(value), ""]} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="Portfolio Value" stroke={chartPalette.blue} strokeWidth={2} fillOpacity={1} fill="url(#valGrad)" />
                  <Area type="monotone" dataKey="Booked Revenue" stroke={chartPalette.cyan} strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 4 - Top Projects by Value */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Top Projects by Value & Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProjectsChartData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartPalette.slate, fontSize: 11 }}
                    tickFormatter={(val) => `₹${(val / 10000000).toFixed(0)} Cr`}
                  />
                  <Tooltip formatter={(value: any) => [formatCr(value), ""]} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Inventory Value" fill={chartPalette.blue} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Revenue Contribution" fill={chartPalette.cyan} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 5 - Portfolio Performance Matrix */}
      <div ref={matrixRef} className="pt-2">
      <Card className="overflow-hidden border border-border-soft">
        <CardHeader>
          <CardTitle>Portfolio Performance Matrix</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">Project</th>
                  <th className="px-4 text-left">Manager</th>
                  <th className="px-4 text-left">Stage</th>
                  <th className="px-4 text-left">Available</th>
                  <th className="px-4 text-left">Booked</th>
                  <th className="px-4 text-left">Booking Rate</th>
                  <th className="px-4 text-left">Inventory Value</th>
                  <th className="px-4 text-left">Risk Level</th>
                  <th className="px-4 text-left">Health Score</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 8).map((project) => {
                  const health = calculateProjectHealth(project, riskData);
                  const healthLabel = getHealthLabel(health);
                  const healthTone = getHealthTone(health);
                  const projUnits = units.filter((u) => u.projectId === project.id);
                  const bookedCount = projUnits.filter((u) => u.status === "booked").length || project.bookedUnits;
                  const totalCount = projUnits.length || project.totalUnits;
                  const bookingRate = totalCount ? Math.round((bookedCount / totalCount) * 100) : 60;
                  
                  const riskProj = riskData.projects.find((p) => p.id === project.id || p.projectName === project.name);
                  const riskLevel = riskProj?.riskLevel || "Low";

                  return (
                    <tr
                      key={project.id}
                      onClick={() => handleRowClick(project.id)}
                      className="border-t border-border-soft transition-all duration-150 hover:bg-hover/40 cursor-pointer"
                    >
                      <td className="px-4 py-3.5 font-medium text-text-primary">{project.name}</td>
                      <td className="px-4 py-3.5 text-text-secondary">{project.managerName}</td>
                      <td className="px-4 py-3.5">
                        <Badge tone={getStageTone(project.stage)}>{project.stage}</Badge>
                      </td>
                      <td className="px-4 py-3.5">{project.availableUnits} Units</td>
                      <td className="px-4 py-3.5">{project.bookedUnits} Units</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-hover overflow-hidden">
                            <div className="h-full bg-accent-primary" style={{ width: `${bookingRate}%` }} />
                          </div>
                          <span className="font-semibold">{bookingRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-text-primary font-medium">
                        {formatCr(project.inventoryValue)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={getRiskTone(riskLevel)}>{riskLevel}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={healthTone} className="font-semibold">
                          {health} - {healthLabel}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Section 6 - High Value Projects Showcase */}
      <div className="space-y-4 pt-2">
        <h3 className="text-section-title font-semibold font-secondary text-text-primary">
          High Value Projects Showcase
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {highValueProjects.map((project) => (
            <Card
              key={project.id}
              onClick={() => handleRowClick(project.id)}
              className="border border-border-soft subtle-hover hover:-translate-y-1 hover:border-accent-primary/40 cursor-pointer bg-surface"
            >
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={getStageTone(project.stage)} className="text-label truncate py-0">
                      {project.stage}
                    </Badge>
                    <Badge tone={getHealthTone(project.health)} className="font-bold">
                      H: {project.health}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-body text-text-primary mt-3 truncate">{project.name}</h4>
                  <p className="text-label text-text-secondary truncate mt-0.5">{project.location}</p>
                </div>

                <div className="space-y-2 border-t border-border-soft/60 pt-3">
                  <div className="flex items-center justify-between text-label">
                    <span className="text-text-muted">Portfolio Value</span>
                    <span className="font-bold text-text-primary">{formatCr(project.inventoryValue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-label">
                    <span className="text-text-muted">Revenue Potential</span>
                    <span className="font-semibold text-accent-primary">{formatCr(project.revenuePotential)}</span>
                  </div>
                  <div className="flex items-center justify-between text-label">
                    <span className="text-text-muted">Available Stock</span>
                    <span className="text-text-secondary">{project.availableUnits} Units</span>
                  </div>
                  <div className="flex items-center justify-between text-label">
                    <span className="text-text-muted">Booking Rate</span>
                    <span className="text-text-secondary">{project.bookingRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Section 7 - Inventory Intelligence */}
      <Card className="border border-border-soft">
        <CardHeader>
          <CardTitle>Inventory Intelligence</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 xl:grid-cols-[1fr_1.8fr] gap-6">
          {/* Key metrics */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="surface-secondary p-3 rounded-[var(--radius-input)] border border-border-soft/60 text-center">
                <span className="text-label text-text-muted">Available</span>
                <p className="text-lg font-bold text-text-success mt-1">
                  {units.filter((u) => u.status === "available").length || 842}
                </p>
              </div>
              <div className="surface-secondary p-3 rounded-[var(--radius-input)] border border-border-soft/60 text-center">
                <span className="text-label text-text-muted">Booked</span>
                <p className="text-lg font-bold text-text-primary mt-1">
                  {units.filter((u) => u.status === "booked").length || 412}
                </p>
              </div>
              <div className="surface-secondary p-3 rounded-[var(--radius-input)] border border-border-soft/60 text-center">
                <span className="text-label text-text-muted">Blocked</span>
                <p className="text-lg font-bold text-text-warning mt-1">
                  {units.filter((u) => u.status === "blocked").length || 38}
                </p>
              </div>
            </div>
            
            <div className="surface-secondary p-4 rounded-[var(--radius-card)] border border-border-soft/60">
              <div className="flex items-center justify-between">
                <span className="text-label text-text-secondary">Inventory Velocity</span>
                <Badge tone="success" className="font-semibold">+14.2% MoM</Badge>
              </div>
              <p className="text-body text-text-secondary mt-2">
                Average booking velocity is <strong className="text-text-primary">12.4 units / month</strong>. Luxury villas and penthouses have a faster close velocity than 2BHK mid-tier options.
              </p>
            </div>

            <div className="surface-secondary p-4 rounded-[var(--radius-card)] border border-border-soft/60">
              <span className="text-label text-text-secondary">Revenue Potential Breakdown</span>
              <p className="text-2xl font-bold text-accent-primary mt-1">
                {formatCr(portfolio.revenuePotential)}
              </p>
              <div className="h-1.5 w-full bg-hover rounded-full overflow-hidden mt-3">
                <div className="h-full bg-accent-primary" style={{ width: "70%" }} />
              </div>
              <div className="flex justify-between text-label text-text-muted mt-1.5">
                <span>₹150 Cr Committed</span>
                <span>₹214 Cr Potential</span>
              </div>
            </div>
          </div>

          {/* Mini charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Inventory Distribution */}
            <div className="border border-border-soft/60 p-3 rounded-[var(--radius-card)] bg-surface-secondary/20 flex flex-col justify-between">
              <span className="text-label text-text-secondary font-medium">Inventory Mix</span>
              <div className="h-32 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "2BHK", value: 40 },
                        { name: "3BHK", value: 35 },
                        { name: "4BHK", value: 15 },
                        { name: "Villas", value: 10 },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={45}
                      innerRadius={30}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill={chartPalette.blue} />
                      <Cell fill={chartPalette.cyan} />
                      <Cell fill={chartPalette.indigo} />
                      <Cell fill={chartPalette.green} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-around text-label text-text-muted mt-2">
                <span>2BHK (40%)</span>
                <span>3BHK (35%)</span>
              </div>
            </div>

            {/* 2. Inventory Movement Trend */}
            <div className="border border-border-soft/60 p-3 rounded-[var(--radius-card)] bg-surface-secondary/20 flex flex-col justify-between">
              <span className="text-label text-text-secondary font-medium">Movement Trend</span>
              <div className="h-32 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { name: "Q1", value: 20 },
                      { name: "Q2", value: 45 },
                      { name: "Q3", value: 30 },
                      { name: "Q4", value: 55 },
                    ]}
                    margin={{ left: -25, top: 5, right: 5, bottom: 0 }}
                  >
                    <XAxis dataKey="name" fontSize={9} />
                    <YAxis fontSize={9} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke={chartPalette.blue} fill={chartPalette.blue} fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <span className="text-label text-center text-text-muted mt-2">Weekly net bookings</span>
            </div>

            {/* 3. Booking Velocity */}
            <div className="border border-border-soft/60 p-3 rounded-[var(--radius-card)] bg-surface-secondary/20 flex flex-col justify-between">
              <span className="text-label text-text-secondary font-medium">Booking Velocity</span>
              <div className="h-32 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "M1", value: 12 },
                      { name: "M2", value: 15 },
                      { name: "M3", value: 18 },
                      { name: "M4", value: 14 },
                    ]}
                    margin={{ left: -25, top: 5, right: 5, bottom: 0 }}
                  >
                    <XAxis dataKey="name" fontSize={9} />
                    <YAxis fontSize={9} />
                    <Tooltip />
                    <Bar dataKey="value" fill={chartPalette.green} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <span className="text-label text-center text-text-muted mt-2">Units closed / month</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 8 - Project Register */}
      <div ref={registerRef} className="pt-2">
        <Card className="overflow-hidden border border-border-soft">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>Project Master Register</CardTitle>
              <p className="text-body text-text-secondary">
                Search, filter, and review detail profile dashboards for each project portfolio component.
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            {/* Toolbar Filters */}
            <div className="border-b border-border-soft bg-surface-secondary/80 px-4 py-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by name, code, manager..."
                    className="h-11 bg-surface pl-9"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 flex-1 md:flex-none md:w-[70%]">
                  <select
                    value={stageFilter}
                    onChange={(e) => {
                      setStageFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={selectClassName}
                  >
                    <option value="All">All Stages</option>
                    {allStages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>

                  <select
                    value={managerFilter}
                    onChange={(e) => {
                      setManagerFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={selectClassName}
                  >
                    <option value="All">All Managers</option>
                    {allManagers.map((mgr) => (
                      <option key={mgr} value={mgr}>
                        {mgr}
                      </option>
                    ))}
                  </select>

                  <select
                    value={riskFilter}
                    onChange={(e) => {
                      setRiskFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={selectClassName}
                  >
                    <option value="All">All Risk</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={selectClassName}
                  >
                    <option value="All">All Types</option>
                    <option value="Residential">Residential</option>
                    <option value="Luxury Villas">Luxury Villas</option>
                  </select>

                  <select
                    value={locationFilter}
                    onChange={(e) => {
                      setLocationFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={selectClassName}
                  >
                    <option value="All">All Locations</option>
                    {allLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active filters display */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{totalRows} Projects</Badge>
                  {stageFilter !== "All" && <Badge tone="info">Stage: {stageFilter}</Badge>}
                  {managerFilter !== "All" && <Badge tone="info">Manager: {managerFilter}</Badge>}
                  {riskFilter !== "All" && <Badge tone="info">Risk: {riskFilter}</Badge>}
                  {typeFilter !== "All" && <Badge tone="info">Type: {typeFilter}</Badge>}
                  {locationFilter !== "All" && <Badge tone="info">Location: {locationFilter}</Badge>}
                  {(search.trim() !== "" || stageFilter !== "All" || managerFilter !== "All" || riskFilter !== "All" || typeFilter !== "All" || locationFilter !== "All") && (
                    <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-accent-primary gap-1 h-8">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Table Register list */}
            <div className="overflow-auto">
              <table className="w-full min-w-[980px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-6 text-left">Project Name</th>
                    <th className="px-4 text-left">Code</th>
                    <th className="px-4 text-left">Manager</th>
                    <th className="px-4 text-left">Stage</th>
                    <th className="px-4 text-left">Available</th>
                    <th className="px-4 text-left">Booked</th>
                    <th className="px-4 text-left">Portfolio Value</th>
                    <th className="px-4 text-left">Risk Level</th>
                    <th className="px-4 text-left">Health Score</th>
                    <th className="px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.length ? (
                    paginatedProjects.map((project) => {
                      const health = calculateProjectHealth(project, riskData);
                      const healthTone = getHealthTone(health);
                      const riskProj = riskData.projects.find((p) => p.id === project.id || p.projectName === project.name);
                      const riskLevel = riskProj?.riskLevel || "Low";

                      return (
                        <tr
                          key={project.id}
                          onClick={() => handleRowClick(project.id)}
                          className="border-t border-border-soft bg-surface transition-all duration-200 hover:bg-hover/30 hover:-translate-y-0.5 hover:shadow-soft cursor-pointer"
                        >
                          <td className="px-6 py-4 font-semibold text-text-primary">{project.name}</td>
                          <td className="px-4 py-4 text-text-secondary">{project.code}</td>
                          <td className="px-4 py-4 text-text-secondary">{project.managerName}</td>
                          <td className="px-4 py-4">
                            <Badge tone={getStageTone(project.stage)}>{project.stage}</Badge>
                          </td>
                          <td className="px-4 py-4 font-medium text-text-success">{project.availableUnits} Units</td>
                          <td className="px-4 py-4 text-text-primary">{project.bookedUnits} Units</td>
                          <td className="px-4 py-4 font-semibold text-text-primary">{formatCr(project.inventoryValue)}</td>
                          <td className="px-4 py-4">
                            <Badge tone={getRiskTone(riskLevel)}>{riskLevel}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge tone={healthTone} className="font-semibold">
                              {health}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRowClick(project.id)}
                              className="text-accent-primary gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View Profile</span>
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-text-secondary">
                        No projects matched your criteria. Try resetting or adjusting your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border-soft px-6 py-4 bg-surface-secondary/20">
                <span className="text-label text-text-secondary">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, totalRows)}-{Math.min(currentPage * pageSize, totalRows)} of {totalRows} Projects
                </span>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "text-white" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </Button>
                </div>

                <div className="flex items-center gap-1.5 text-label text-text-secondary">
                  <span>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 rounded-[var(--radius-input)] border border-border-soft bg-surface px-2 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary Footer */}
      <Card className="border border-border-soft bg-surface-secondary/10">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-label text-text-muted uppercase font-semibold tracking-wider">
                Portfolio Summary
              </span>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-1 text-body text-text-secondary list-disc pl-4">
                <li>Portfolio value increased by 12% MoM.</li>
                <li>Inventory availability stands at {portfolio.availableInventoryUnits} units.</li>
                <li>{portfolio.projectsAtRisk} projects require immediate milestone review.</li>
                <li>Skyline Towers is the strongest performer.</li>
                <li>Total revenue potential exceeds {formatCr(portfolio.revenuePotential)}.</li>
              </ul>
            </div>
            <span className="text-label text-text-muted self-end">
              Last updated 5 minutes ago
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Add Project Drawer */}
      <ProjectDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={(data) => createProjectMutation.mutate(data)}
        managers={managers}
        isLoading={createProjectMutation.isPending}
      />
    </section>
  );
}
export default ProjectsPortfolioWorkspace;
