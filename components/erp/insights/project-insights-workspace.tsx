"use client";
import { toast } from "@/components/ui/toast";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  RotateCcw,
  Download,
  Calendar,
  Layers,
  Gauge,
  Lightbulb,
  Users,
  Award,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Filter,
  DollarSign,
  Briefcase,
  Activity,
  Percent,
  Building2,
  HardHat,
  ShieldAlert,
  Sparkles,
  Plus,
  Hammer,
  HelpCircle,
  AlertCircle,
  FileText,
  UserCheck,
  Package
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Link from "next/link";
import { formatCurrency, formatDate, toneForSeverity, toneForStatus } from "@/lib/erp-utils";
import type {
  ProjectTasksResponse,
  DailyReportsResponse,
  ResourcesResponse,
  MaterialsResponse,
  PropertySummaryResponse,
  ProjectRiskResponse,
  ProjectRiskProject,
  ProjectRiskSignal
} from "@/lib/erp-types";

// Standard select class name
const selectClassName =
  "h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

// Helper function to calculate average
const average = (values: number[]) => {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

// Premium Circular Progress Ring
function CircularProgress({ value, size = 140, strokeWidth = 12 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        <circle
          className="text-hover"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <defs>
          <linearGradient id="healthProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" /> {/* Green */}
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <circle
          stroke="url(#healthProgressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="text-center z-10">
        <span className="text-4xl font-extrabold font-secondary text-text-primary tracking-tight">{value}</span>
        <span className="text-label text-text-muted block mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// Sparkline component using SVG Polyline
function Sparkline({ data, tone = "info" }: { data: number[]; tone?: "success" | "warning" | "error" | "info" }) {
  const colorMap = {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  };
  const strokeColor = colorMap[tone];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;
  const width = 100;
  const height = 30;

  const points = data
    .map((val, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className="overflow-visible" width="72" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Sparklines mock dataset for Section 2
const sparklinesMock = {
  portfolioProjects: [6, 6, 7, 7, 8, 8, 8, 8],
  avgCompletion: [45, 48, 52, 56, 59, 61, 65, 68],
  onTrack: [4, 4, 5, 5, 6, 6, 6, 6],
  atRisk: [2, 2, 2, 2, 2, 2, 2, 2],
  resourceUtil: [76, 78, 80, 84, 82, 80, 83, 82],
  materialPressure: [3, 4, 5, 6, 5, 7, 6, 6],
  openTasks: [60, 58, 54, 50, 48, 46, 45, 45],
  riskSignals: [18, 16, 15, 14, 13, 14, 12, 12]
};

export function ProjectInsightsWorkspace() {
  const role = useUiStore((state) => state.role);

  // Filter States
  const [period, setPeriod] = useState("This Month");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedProject, setSelectedProject] = useState("All");
  const [selectedHealth, setSelectedHealth] = useState("All");
  const [selectedStage, setSelectedStage] = useState("All");
  const [selectedRisk, setSelectedRisk] = useState("All");

  // Chart Selection Filters
  const [donutFilter, setDonutFilter] = useState<string | null>(null);
  const [pieFilter, setPieFilter] = useState<string | null>(null);

  // Recommendations state for mock interactions
  const [dismissedRecs, setDismissedRecs] = useState<string[]>([]);
  const [executedRecs, setExecutedRecs] = useState<string[]>([]);

  // Fetch queries from TanStack React Query
  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const tasksQuery = useQuery({
    queryKey: ["erp-project-tasks", role],
    queryFn: async () => (await apiRequest<ProjectTasksResponse>("/api/projects/tasks", { role })).data,
  });

  const reportsQuery = useQuery({
    queryKey: ["erp-daily-reports", role],
    queryFn: async () => (await apiRequest<DailyReportsResponse>("/api/projects/daily-reports", { role })).data,
  });

  const resourcesQuery = useQuery({
    queryKey: ["erp-resources", role],
    queryFn: async () => (await apiRequest<ResourcesResponse>("/api/projects/resources", { role })).data,
  });

  const materialsQuery = useQuery({
    queryKey: ["erp-materials", role],
    queryFn: async () => (await apiRequest<MaterialsResponse>("/api/materials", { role })).data,
  });

  const riskQuery = useQuery({
    queryKey: ["erp-project-risk", role],
    queryFn: async () => (await apiRequest<ProjectRiskResponse>("/api/projects/risk", { role })).data,
  });

  // Generate full aggregated data list per project
  const aggregatedProjects = useMemo(() => {
    if (!projectsQuery.data) return [];
    
    const apiProjects = projectsQuery.data.projects || [];
    const apiRisk = riskQuery.data?.projects || [];
    const apiTasks = tasksQuery.data?.tasks || [];
    const apiReports = reportsQuery.data?.reports || [];
    const apiResources = resourcesQuery.data?.resources || [];
    const apiMaterials = materialsQuery.data?.materials || [];

    return apiProjects.map((project) => {
      // 1. Task completions & counts
      const projectTasks = apiTasks.filter((t) => t.projectId === project.id || t.projectName === project.name);
      const completion = projectTasks.length
        ? average(projectTasks.map((t) => t.completion))
        : (project.id.includes("1") ? 78 : project.id.includes("2") ? 92 : project.id.includes("3") ? 15 : project.id.includes("4") ? 32 : 55);
      const openTasksCount = projectTasks.filter((t) => t.status !== "Done").length;

      // 2. Risk Data link
      const projectRisk = apiRisk.find((r) => r.id === project.id || r.projectName === project.name);
      const riskScore = projectRisk?.riskScore ?? (project.id.includes("1") ? 15 : project.id.includes("2") ? 8 : project.id.includes("3") ? 82 : project.id.includes("4") ? 48 : 28);
      const riskLevel = projectRisk?.riskLevel ?? (riskScore > 70 ? "Critical" : riskScore > 35 ? "Watch" : "Healthy");

      // 3. Resource deployment
      const projectResources = apiResources.filter((r) => r.projectId === project.id || r.projectName === project.name);
      const resourceCount = projectResources.length || (project.id.includes("1") ? 28 : project.id.includes("2") ? 14 : project.id.includes("3") ? 8 : project.id.includes("4") ? 42 : 19);
      const resourceUtil = projectRisk?.averageResourceUtilization ?? (project.id.includes("1") ? 84 : project.id.includes("2") ? 68 : project.id.includes("3") ? 95 : project.id.includes("4") ? 72 : 80);

      // 4. Material Stock health
      const projectMaterials = apiMaterials.filter((m) => m.projectId === project.id || m.projectName === project.name);
      const lowStockCount = projectMaterials.filter((m) => m.status === "Low Stock" || m.status === "Out of Stock").length;
      const materialStatus = projectRisk?.materialShortages && projectRisk.materialShortages > 2
        ? "Critical"
        : projectRisk?.materialShortages && projectRisk.materialShortages > 0 || lowStockCount > 0
        ? "Attention"
        : "Healthy";

      // 5. Daily report updates
      const projectReports = apiReports.filter((r) => r.projectId === project.id || r.projectName === project.name);
      const sortedReports = projectReports.slice().sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
      const latestReport = sortedReports[0];
      const latestUpdateText = latestReport?.progressSummary || projectRisk?.latestReportSummary || "Active standard structural checks in progress.";
      const latestUpdateDate = latestReport?.reportDate || projectRisk?.latestReportDate || new Date().toISOString();

      return {
        id: project.id,
        name: project.name,
        code: project.code,
        location: project.location,
        stage: project.stage || "Superstructure",
        managerName: project.managerName || "Suresh Menon",
        completion,
        openTasks: openTasksCount || (project.id.includes("1") ? 6 : project.id.includes("2") ? 2 : project.id.includes("3") ? 14 : project.id.includes("4") ? 9 : 4),
        resources: resourceCount,
        resourceUtil,
        materialStatus,
        riskScore,
        riskLevel,
        latestUpdateText,
        latestUpdateDate,
        projectType: project.id.includes("2") ? "Commercial office" : project.id.includes("4") ? "Retail Center" : "Residential Apartments"
      };
    });
  }, [projectsQuery.data, tasksQuery.data, reportsQuery.data, resourcesQuery.data, materialsQuery.data, riskQuery.data]);

  // Filters calculation
  const filteredProjects = useMemo(() => {
    return aggregatedProjects.filter((p) => {
      // Search
      if (deferredSearch.trim() !== "") {
        const s = deferredSearch.toLowerCase();
        const matchName = p.name.toLowerCase().includes(s);
        const matchCode = p.code.toLowerCase().includes(s);
        const matchLoc = p.location.toLowerCase().includes(s);
        const matchMgr = p.managerName.toLowerCase().includes(s);
        if (!matchName && !matchCode && !matchLoc && !matchMgr) return false;
      }
      // Project filter
      if (selectedProject !== "All" && p.id !== selectedProject) return false;
      // Health filter
      if (selectedHealth !== "All") {
        if (selectedHealth === "Healthy" && p.riskLevel !== "Healthy") return false;
        if (selectedHealth === "Watch" && p.riskLevel !== "Watch") return false;
        if (selectedHealth === "Critical" && p.riskLevel !== "Critical") return false;
      }
      // Stage filter
      if (selectedStage !== "All" && p.stage !== selectedStage) return false;
      // Risk filter
      if (selectedRisk !== "All") {
        if (selectedRisk === "High" && p.riskScore < 70) return false;
        if (selectedRisk === "Medium" && (p.riskScore < 35 || p.riskScore >= 70)) return false;
        if (selectedRisk === "Low" && p.riskScore >= 35) return false;
      }

      // Donut Filter
      if (donutFilter) {
        if (donutFilter === "Healthy" && p.riskLevel !== "Healthy") return false;
        if (donutFilter === "At Risk" && p.riskLevel !== "Watch") return false;
        if (donutFilter === "Critical" && p.riskLevel !== "Critical") return false;
      }

      // Pie Filter
      if (pieFilter) {
        const riskMapping: Record<string, string> = {
          Schedule: "proj-3",
          Material: "proj-4",
          Workforce: "proj-1",
          Quality: "proj-5",
          Financial: "proj-4",
        };
        if (pieFilter in riskMapping) {
          if (p.id !== riskMapping[pieFilter]) return false;
        }
      }

      return true;
    });
  }, [aggregatedProjects, deferredSearch, selectedProject, selectedHealth, selectedStage, selectedRisk, donutFilter, pieFilter]);

  // Leaderboard data
  const fastestProgressing = useMemo(() => {
    return aggregatedProjects
      .slice()
      .sort((a, b) => b.completion - a.completion)
      .slice(0, 4);
  }, [aggregatedProjects]);

  const highestResourceEfficiency = useMemo(() => {
    return aggregatedProjects
      .slice()
      .sort((a, b) => b.resourceUtil - a.resourceUtil)
      .slice(0, 4);
  }, [aggregatedProjects]);

  const lowestRiskProjects = useMemo(() => {
    return aggregatedProjects
      .slice()
      .sort((a, b) => a.riskScore - b.riskScore)
      .slice(0, 4);
  }, [aggregatedProjects]);

  const topPerformingSites = useMemo(() => {
    return aggregatedProjects
      .slice()
      .filter((p) => p.riskLevel === "Healthy")
      .slice(0, 4);
  }, [aggregatedProjects]);

  // Handle loading state
  if (
    projectsQuery.isLoading ||
    tasksQuery.isLoading ||
    reportsQuery.isLoading ||
    resourcesQuery.isLoading ||
    materialsQuery.isLoading ||
    riskQuery.isLoading
  ) {
    return <LoadingStateCard title="Loading Project Operations Intelligence Center..." />;
  }

  // Handle error state
  if (
    projectsQuery.error ||
    tasksQuery.error ||
    reportsQuery.error ||
    resourcesQuery.error ||
    materialsQuery.error ||
    riskQuery.error ||
    !projectsQuery.data ||
    !tasksQuery.data ||
    !reportsQuery.data ||
    !resourcesQuery.data ||
    !materialsQuery.data ||
    !riskQuery.data
  ) {
    return <ErrorStateCard message="Operational intelligence data is currently unavailable." />;
  }

  // Section 1: Portfolio Health Metrics
  const totalProjCount = aggregatedProjects.length;
  const onTrackCount = aggregatedProjects.filter(p => p.riskLevel === "Healthy").length;
  const atRiskCount = aggregatedProjects.filter(p => p.riskLevel === "Watch").length;
  const criticalCount = aggregatedProjects.filter(p => p.riskLevel === "Critical").length;

  const avgHealthScore = 86; // Locked as per specification: 86 / 100, healthy portfolio, +4.2%

  // Section 3: Donut & Pie Chart data
  const healthDistributionData = [
    { name: "Healthy", value: onTrackCount || 3, color: "#10b981" },
    { name: "At Risk", value: atRiskCount || 1, color: "#f59e0b" },
    { name: "Critical", value: criticalCount || 1, color: "#ef4444" },
  ];

  const riskCategoryData = [
    { name: "Schedule", value: 4, color: "#3b82f6" },
    { name: "Material", value: 3, color: "#f59e0b" },
    { name: "Workforce", value: 3, color: "#ec4899" },
    { name: "Quality", value: 2, color: "#8b5cf6" },
    { name: "Financial", value: 1, color: "#10b981" },
    { name: "Other", value: 1, color: "#6b7280" },
  ];

  // Section 4: Trend Analytics data
  const completionTrendData = [
    { week: "Week 1", completion: 48, target: 75 },
    { week: "Week 2", completion: 52, target: 75 },
    { week: "Week 3", completion: 55, target: 75 },
    { week: "Week 4", completion: 57, target: 75 },
    { week: "Week 5", completion: 59, target: 80 },
    { week: "Week 6", completion: 63, target: 80 },
    { week: "Week 7", completion: 66, target: 80 },
    { week: "Week 8", completion: 68, target: 80 },
  ];

  const resourceVsMaterialData = [
    { week: "Week 1", utilization: 75, materialRisk: 12 },
    { week: "Week 2", utilization: 78, materialRisk: 10 },
    { week: "Week 3", utilization: 80, materialRisk: 9 },
    { week: "Week 4", utilization: 82, materialRisk: 7 },
    { week: "Week 5", utilization: 85, materialRisk: 5 },
    { week: "Week 6", utilization: 83, materialRisk: 6 },
    { week: "Week 7", utilization: 81, materialRisk: 8 },
    { week: "Week 8", utilization: 82, materialRisk: 6 },
  ];


  // Section 7: Signals Feed
  const signalsFeed = [
    {
      id: "sig-1",
      projectName: "Plaza Retail Mall",
      title: "Critical Material Delay",
      detail: "Steel shortage impacting Plaza Project structure schedule.",
      severity: "High",
      ownerName: "Vikram Reddy",
      metricLabel: "Lead Time",
      metricValue: "+14 Days",
      dueAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "sig-2",
      projectName: "Grand Horizon Apartments",
      title: "High Workforce Risk",
      detail: "Labor availability below target, delaying partition framing.",
      severity: "High",
      ownerName: "Rakesh Sharma",
      metricLabel: "Headcount Shortfall",
      metricValue: "-22%",
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "sig-3",
      projectName: "Emerald Heights Villa",
      title: "Schedule Risk",
      detail: "Concrete pour delayed by weather; pushing slab completion dates.",
      severity: "Medium",
      ownerName: "Siddharth Sen",
      metricLabel: "Schedule Slippage",
      metricValue: "+8 Days",
      dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Section 8: Recommendations
  const initialRecommendations = [
    {
      id: "rec-1",
      priority: "High",
      title: "Approve urgent material purchase request",
      reason: "Resolve structural steel shortage at Plaza Retail Mall to prevent a 14-day delivery delay.",
      action: "Approve Purchase Order #PO-Steel-98",
      impact: "Saves +10 schedule days"
    },
    {
      id: "rec-2",
      priority: "Medium",
      title: "Increase labor allocation for Villa Phase 2",
      reason: "Supplement bricklaying crew to restore scheduled milestone completion by Friday.",
      action: "Reallocate 6 Masonry resources from Vikhroli site",
      impact: "Mitigates timeline risk"
    },
    {
      id: "rec-3",
      priority: "Medium",
      title: "Schedule inspection for Clubhouse project",
      reason: "Pre-empt plumbing compliance approvals ahead of finishing phase kick-off.",
      action: "Book priority inspection slot with municipal authorities",
      impact: "Ensures compliance continuity"
    },
    {
      id: "rec-4",
      priority: "Low",
      title: "Review delayed subcontractor payments",
      reason: "Settle outstanding invoices for Plaza structural partner to maintain goodwill and labor supply.",
      action: "Instruct Accountant to release milestone payment",
      impact: "Removes subcontractor friction"
    }
  ];

  const filteredRecommendations = initialRecommendations.filter(
    (rec) => !dismissedRecs.includes(rec.id)
  );

  const resetAllFilters = () => {
    setSearch("");
    setSelectedProject("All");
    setSelectedHealth("All");
    setSelectedStage("All");
    setSelectedRisk("All");
    setDonutFilter(null);
    setPieFilter(null);
  };

  return (
    <section className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold font-secondary text-text-primary tracking-tight">Project Insights</h1>
          <p className="text-body text-text-secondary max-w-3xl">
            Real-time portfolio intelligence across project health, progress, risks, resources, and delivery performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-text-muted" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={selectClassName}
            >
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Last Quarter">Last Quarter</option>
              <option value="Year To Date">Year To Date</option>
              <option value="Custom Range">Custom Range</option>
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={() => toast.info("Exporting operational report. Download will start in a moment.")}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            className="bg-accent-primary hover:bg-accent-primary-hover text-white font-medium shadow-premium"
            onClick={() => toast.info("Requesting new AI Executive Summary report. Generating...")}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* SECTION 1: PORTFOLIO COMMAND CENTER (HERO CARD) */}
      <Card className="border border-border-soft overflow-hidden shadow-premium bg-gradient-to-br from-surface to-surface-secondary/50">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto]">
            {/* Hero Left Info */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-label font-bold text-emerald-600 uppercase tracking-widest text-xs">Healthy Portfolio</span>
                </div>
                <h2 className="text-2xl font-bold font-secondary text-text-primary">Operational Performance Status</h2>
                <p className="text-body text-text-secondary max-w-xl">
                  Overall construction progress has accelerated across active developments this month. Material shortage pressure has stabilized with a slight increase in average labor present headcount.
                </p>
              </div>

              {/* Sub-KPI Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-4 border-t border-border-soft">
                <div className="space-y-1">
                  <span className="text-xs text-text-muted">Total Projects</span>
                  <p className="text-2xl font-bold font-secondary text-text-primary">{totalProjCount}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-emerald-600 font-medium">On Track</span>
                  <p className="text-2xl font-bold font-secondary text-text-primary">{onTrackCount}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-amber-600 font-medium">At Risk (Watch)</span>
                  <p className="text-2xl font-bold font-secondary text-text-primary">{atRiskCount}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-red-600 font-medium">Critical Attention</span>
                  <p className="text-2xl font-bold font-secondary text-text-primary">{criticalCount}</p>
                </div>
              </div>
            </div>

            {/* Hero Right Score Ring */}
            <div className="flex flex-col items-center justify-center bg-surface border border-border-soft/60 rounded-[var(--radius-card)] p-6 shadow-soft min-w-[200px] gap-3">
              <CircularProgress value={avgHealthScore} />
              <div className="text-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +4.2% improvement
                </span>
                <p className="text-xs text-text-muted mt-1">v. last quarter average</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: EXECUTIVE KPI STRIP */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Card className="shadow-soft border border-border-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-label text-text-muted font-medium">Portfolio Projects</span>
              <Building2 className="h-4.5 w-4.5 text-text-muted" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="space-y-0.5">
                <p className="text-3xl font-extrabold font-secondary text-text-primary">{totalProjCount}</p>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +12.5%
                </span>
              </div>
              <Sparkline data={sparklinesMock.portfolioProjects} tone="info" />
            </div>
            <p className="text-xs text-text-muted mt-2 truncate">Active development sites</p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="shadow-soft border border-border-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-label text-text-muted font-medium">Average Completion</span>
              <Activity className="h-4.5 w-4.5 text-text-muted" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="space-y-0.5">
                <p className="text-3xl font-extrabold font-secondary text-text-primary">68%</p>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +4%
                </span>
              </div>
              <Sparkline data={sparklinesMock.avgCompletion} tone="success" />
            </div>
            <p className="text-xs text-text-muted mt-2 truncate">Portfolio accelerating</p>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="shadow-soft border border-border-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-label text-text-muted font-medium">On Track Projects</span>
              <CheckCircle2 className="h-4.5 w-4.5 text-text-muted" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="space-y-0.5">
                <p className="text-3xl font-extrabold font-secondary text-text-primary">{onTrackCount}</p>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +16.7%
                </span>
              </div>
              <Sparkline data={sparklinesMock.onTrack} tone="success" />
            </div>
            <p className="text-xs text-text-muted mt-2 truncate">Delivering on schedule</p>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="shadow-soft border border-border-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-label text-text-muted font-medium">At Risk Projects</span>
              <AlertTriangle className="h-4.5 w-4.5 text-text-muted" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="space-y-0.5">
                <p className="text-3xl font-extrabold font-secondary text-text-primary">{atRiskCount}</p>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3" /> -33.3%
                </span>
              </div>
              <Sparkline data={sparklinesMock.atRisk} tone="warning" />
            </div>
            <p className="text-xs text-text-muted mt-2 truncate">Requires active review</p>
          </CardContent>
        </Card>

        {/* KPI 5 */}
        <Card className="shadow-soft border border-border-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-label text-text-muted font-medium">Resource Utilization</span>
              <Users className="h-4.5 w-4.5 text-text-muted" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="space-y-0.5">
                <p className="text-3xl font-extrabold font-secondary text-text-primary">82%</p>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +2.1%
                </span>
              </div>
              <Sparkline data={sparklinesMock.resourceUtil} tone="info" />
            </div>
            <p className="text-xs text-text-muted mt-2 truncate">Optimal deployment load</p>
          </CardContent>
        </Card>

        {/* KPI 6 */}
        <Card className="shadow-soft border border-border-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-label text-text-muted font-medium">Material Pressure</span>
              <Package className="h-4.5 w-4.5 text-text-muted" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="space-y-0.5">
                <p className="text-3xl font-extrabold font-secondary text-text-primary">6</p>
                <span className="text-xs text-red-600 font-medium flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> Critical
                </span>
              </div>
              <Sparkline data={sparklinesMock.materialPressure} tone="error" />
            </div>
            <p className="text-xs text-text-muted mt-2 truncate">Requires procurement review</p>
          </CardContent>
        </Card>

        {/* KPI 7 */}
        <Card className="shadow-soft border border-border-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-label text-text-muted font-medium">Open Tasks</span>
              <HardHat className="h-4.5 w-4.5 text-text-muted" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="space-y-0.5">
                <p className="text-3xl font-extrabold font-secondary text-text-primary">45</p>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3" /> -8.2%
                </span>
              </div>
              <Sparkline data={sparklinesMock.openTasks} tone="success" />
            </div>
            <p className="text-xs text-text-muted mt-2 truncate">Backlog clearing</p>
          </CardContent>
        </Card>

        {/* KPI 8 */}
        <Card className="shadow-soft border border-border-soft hover:shadow-medium transition-shadow">
          <CardContent className="p-4 flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-label text-text-muted font-medium">Active Risk Signals</span>
              <ShieldAlert className="h-4.5 w-4.5 text-text-muted" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="space-y-0.5">
                <p className="text-3xl font-extrabold font-secondary text-text-primary">12</p>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3" /> -14.3%
                </span>
              </div>
              <Sparkline data={sparklinesMock.riskSignals} tone="success" />
            </div>
            <p className="text-xs text-text-muted mt-2 truncate">Risk profile decreasing</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: PROJECT HEALTH OVERVIEW */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Donut Chart: Portfolio Health Distribution */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-card-title text-text-primary">Portfolio Health Distribution</CardTitle>
              {donutFilter && (
                <Button variant="ghost" size="sm" onClick={() => setDonutFilter(null)} className="h-7 text-xs text-accent-primary">
                  Clear filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[260px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={healthDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(data) => {
                    if (data && typeof data.name === "string") {
                      setDonutFilter(data.name === donutFilter ? null : data.name);
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  {healthDistributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={donutFilter === entry.name ? "#000" : "transparent"}
                      strokeWidth={2}
                      opacity={donutFilter && donutFilter !== entry.name ? 0.35 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Projects`, "Count"]} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend & Center label helper */}
            <div className="flex justify-center gap-4 text-xs font-semibold mt-2">
              {healthDistributionData.map((d) => (
                <button
                  key={d.name}
                  onClick={() => setDonutFilter(d.name === donutFilter ? null : d.name)}
                  className={`flex items-center gap-1.5 transition-opacity ${donutFilter && donutFilter !== d.name ? "opacity-40" : "opacity-100"}`}
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-text-secondary">{d.name} ({d.value})</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Horizontal Bar Chart: Project Completion Ranking */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-card-title text-text-primary">Project Completion Ranking</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={aggregatedProjects.slice().sort((a, b) => b.completion - a.completion)}
                margin={{ left: 10, right: 30, top: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={11} />
                <YAxis dataKey="code" type="category" stroke="#6b7280" fontSize={11} width={35} />
                <Tooltip
                  formatter={(value, name, props) => [`${value}% Complete`, `${props.payload.name}`]}
                  labelStyle={{ display: "none" }}
                />
                <Bar dataKey="completion" radius={[0, 4, 4, 0]} barSize={14}>
                  {aggregatedProjects.slice().sort((a, b) => b.completion - a.completion).map((entry, index) => {
                    const healthColor = entry.riskLevel === "Critical" ? "#ef4444" : entry.riskLevel === "Watch" ? "#f59e0b" : "#10b981";
                    return <Cell key={`cell-${index}`} fill={healthColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart: Risk Category Breakdown */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-card-title text-text-primary">Risk Category Breakdown</CardTitle>
              {pieFilter && (
                <Button variant="ghost" size="sm" onClick={() => setPieFilter(null)} className="h-7 text-xs text-accent-primary">
                  Clear filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[260px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskCategoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  labelLine={false}
                  onClick={(data) => {
                    if (data && typeof data.name === "string") {
                      setPieFilter(data.name === pieFilter ? null : data.name);
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                  fontSize={10}
                >
                  {riskCategoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={pieFilter === entry.name ? "#000" : "transparent"}
                      strokeWidth={2}
                      opacity={pieFilter && pieFilter !== entry.name ? 0.35 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Issues`, "Count"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center text-xs text-text-muted mt-2 font-medium">
              Click segments to filter corresponding project cards
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4: TREND ANALYTICS */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Chart 1: Portfolio Completion Trend */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-card-title text-text-primary">Portfolio Completion Trend</CardTitle>
                <p className="text-xs text-text-secondary mt-0.5">Historical progress curves versus quarterly target</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                Growth: +20%
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completionTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="week" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} domain={[30, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Completion"]} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    name="Actual Completion %"
                    dataKey="completion"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCompletion)"
                  />
                  <Line
                    type="monotone"
                    name="Target Line"
                    dataKey="target"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-border-soft pt-3 bg-surface-secondary/40 px-3 py-2 rounded-lg">
              <span className="text-text-muted">
                Best Improving: <strong className="text-emerald-600 font-semibold">Apex Business Towers (+15%)</strong>
              </span>
              <span className="text-text-muted">
                Slowest Progressing: <strong className="text-red-600 font-semibold">Emerald Heights Villa (+2%)</strong>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Resource Utilization vs Material Health */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader className="pb-1">
            <div>
              <CardTitle className="text-card-title text-text-primary">Resource Utilization vs Material Health</CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">Correlation analytics between workforce utilization rate and inventory risk count</p>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={resourceVsMaterialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="week" stroke="#6b7280" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#3b82f6" fontSize={11} domain={[70, 90]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} domain={[0, 15]} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    name="Resource Utilization %"
                    dataKey="utilization"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    name="Material Risk Count"
                    dataKey="materialRisk"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs border-t border-border-soft pt-3 bg-surface-secondary/40 px-3 py-2 rounded-lg text-text-secondary flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Correlation Insight:</strong> As resource utilization peaks above 80%, material stock pressure decreases, indicating high deployment coordination across sites.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 5: PROJECT INTELLIGENCE PANEL */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Card 1: Critical Risks */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle className="text-card-title text-text-primary flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Critical Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aggregatedProjects
              .slice()
              .sort((a, b) => b.riskScore - a.riskScore)
              .slice(0, 3)
              .map((project) => (
                <div key={project.id} className="border border-border-soft p-3 rounded-lg space-y-2 bg-surface">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary text-sm truncate max-w-[170px]">{project.name}</span>
                    <Badge tone={project.riskLevel === "Critical" ? "error" : "warning"}>
                      Risk Score: {project.riskScore}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-text-secondary">
                    <span>Stage: {project.stage}</span>
                    <span className="text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {project.riskLevel} Health
                    </span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Card 2: Delivery Forecast */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle className="text-card-title text-text-primary flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              Delivery Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border-b border-border-soft pb-4">
              <div>
                <span className="text-2xl font-bold font-secondary text-text-primary">94%</span>
                <span className="text-xs text-text-muted block mt-0.5">Confidence Level</span>
              </div>
              <Badge tone="success" className="h-7">High Confidence</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Likely to finish on-time:</span>
                <span className="font-bold text-emerald-600">3 Projects</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Likely to miss targets:</span>
                <span className="font-bold text-red-500">1 Project</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Borderline (Watch):</span>
                <span className="font-bold text-amber-500">1 Project</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Resource Bottlenecks */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle className="text-card-title text-text-primary flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              Resource Bottlenecks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs border border-border-soft p-2.5 rounded-lg bg-surface">
                <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <strong className="text-text-primary block">Villa Phase 2 Team Over Capacity (95%)</strong>
                  <span className="text-text-secondary">Severe fatigue risk. Masonry crew staffing shortfall.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs border border-border-soft p-2.5 rounded-lg bg-surface">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <strong className="text-text-primary block">Plaza Retail Mall Understaffed (-20%)</strong>
                  <span className="text-text-secondary">Excavator operator shortage impacting foundation phase.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs border border-border-soft p-2.5 rounded-lg bg-surface">
                <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <strong className="text-text-primary block">Cement Stock Shortage Alert</strong>
                  <span className="text-text-secondary">Less than 2 days on-hand inventory at Noida warehouse node.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 6: PROJECT PERFORMANCE TABLE */}
      <Card className="border border-border-soft shadow-soft overflow-hidden">
        <div className="bg-surface border-b border-border-soft px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold font-secondary text-text-primary">Project Register & Operational Board</CardTitle>
            <p className="text-xs text-text-secondary mt-1">
              Select rows to inspect detail summaries or filter by site parameters.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.info("Printing board configuration summary.")}>
              Print View
            </Button>
            <Button variant="secondary" size="sm" onClick={() => toast.info("Downloading excel manifest...")}>
              <Download className="mr-2 h-4 w-4" />
              Download Excel
            </Button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="border-b border-border-soft bg-surface-secondary/40 px-6 py-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search projects by name, code, manager, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 bg-surface pl-10 border-border-soft shadow-soft rounded-lg"
              />
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Project Select Filter */}
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className={selectClassName}
              >
                <option value="All">All Projects</option>
                {aggregatedProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              {/* Health Select Filter */}
              <select
                value={selectedHealth}
                onChange={(e) => setSelectedHealth(e.target.value)}
                className={selectClassName}
              >
                <option value="All">All Health Statuses</option>
                <option value="Healthy">Healthy Only</option>
                <option value="Watch">Watch Only</option>
                <option value="Critical">Critical Only</option>
              </select>

              {/* Stage Select Filter */}
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className={selectClassName}
              >
                <option value="All">All Stages</option>
                <option value="Superstructure">Superstructure</option>
                <option value="Foundation">Foundation</option>
                <option value="Finishing">Finishing</option>
                <option value="Excavation">Excavation</option>
              </select>

              {/* Risk Select Filter */}
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className={selectClassName}
              >
                <option value="All">All Risks</option>
                <option value="High">High Risk (&gt;70)</option>
                <option value="Medium">Medium Risk (35-70)</option>
                <option value="Low">Low Risk (&lt;35)</option>
              </select>

              {(search.trim() || selectedProject !== "All" || selectedHealth !== "All" || selectedStage !== "All" || selectedRisk !== "All" || donutFilter || pieFilter) ? (
                <Button variant="ghost" onClick={resetAllFilters} className="text-red-500 hover:text-red-600">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              ) : null}
            </div>
          </div>
          {/* Active Filtering Badges */}
          {(donutFilter || pieFilter) && (
            <div className="flex items-center gap-2 text-xs font-semibold pt-1">
              <span className="text-text-muted">Active Chart Filters:</span>
              {donutFilter && (
                <Badge tone="info" className="flex items-center gap-1">
                  Health: {donutFilter}
                  <button onClick={() => setDonutFilter(null)} className="ml-1 text-hover hover:text-white font-extrabold">&times;</button>
                </Badge>
              )}
              {pieFilter && (
                <Badge tone="warning" className="flex items-center gap-1">
                  Risk Source: {pieFilter}
                  <button onClick={() => setPieFilter(null)} className="ml-1 text-hover hover:text-white font-extrabold">&times;</button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* PERFORMANCE TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-table">
            <thead className="bg-surface-secondary text-text-secondary uppercase tracking-wider text-xxs font-bold">
              <tr className="h-12 border-b border-border-soft">
                <th className="px-6 text-left">Project</th>
                <th className="px-6 text-left">Stage</th>
                <th className="px-6 text-left">Completion</th>
                <th className="px-6 text-left">Open Tasks</th>
                <th className="px-6 text-left">Resources</th>
                <th className="px-6 text-left">Material Status</th>
                <th className="px-6 text-left">Risk Score</th>
                <th className="px-6 text-left">Health</th>
                <th className="px-6 text-left">Latest Update</th>
                <th className="px-6 text-left">Owner</th>
                <th className="px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft bg-surface">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-text-muted">
                    No active projects found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const healthDot = p.riskLevel === "Critical" ? "bg-red-500" : p.riskLevel === "Watch" ? "bg-amber-500" : "bg-emerald-500";
                  const borderHoverColor = p.riskLevel === "Critical" ? "hover:border-l-red-500" : p.riskLevel === "Watch" ? "hover:border-l-amber-500" : "hover:border-l-emerald-500";

                  return (
                    <tr
                      key={p.id}
                      className={`group border-l-4 border-l-transparent transition-all hover:bg-surface-secondary/45 ${borderHoverColor} cursor-pointer`}
                      onClick={() => window.location.href = `/projects/${p.id}`}
                    >
                      {/* Project Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-surface-secondary text-accent-primary">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="font-bold text-text-primary block text-sm group-hover:text-accent-primary transition-colors">
                              {p.name}
                            </span>
                            <span className="text-xxs text-text-muted mt-0.5 block">{p.projectType} • {p.code}</span>
                          </div>
                        </div>
                      </td>

                      {/* Stage */}
                      <td className="px-6 py-4">
                        <Badge tone="neutral">{p.stage}</Badge>
                      </td>

                      {/* Completion Progress Bar */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5 w-32">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-text-primary">{p.completion}%</span>
                            <span className="text-emerald-500 text-xxs flex items-center font-medium">
                              <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> +4%
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-hover overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${p.riskLevel === "Critical" ? "bg-red-500" : p.riskLevel === "Watch" ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${p.completion}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Open Tasks */}
                      <td className="px-6 py-4 text-sm font-medium text-text-primary text-center">
                        {p.openTasks}
                      </td>

                      {/* Resources Count & Util */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="font-semibold text-text-primary block">{p.resources} Active</span>
                          <span className="text-xxs text-text-muted mt-0.5 block">{p.resourceUtil}% Util Rate</span>
                        </div>
                      </td>

                      {/* Material Status */}
                      <td className="px-6 py-4">
                        <Badge
                          tone={
                            p.materialStatus === "Critical"
                              ? "error"
                              : p.materialStatus === "Attention"
                              ? "warning"
                              : "success"
                          }
                        >
                          {p.materialStatus === "Critical"
                            ? "Critical Shortages"
                            : p.materialStatus === "Attention"
                            ? "Requires Review"
                            : "Healthy Stock"}
                        </Badge>
                      </td>

                      {/* Risk Score Mini Gauge */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="relative h-9 w-9 flex items-center justify-center">
                            {/* SVG Mini Dial */}
                            <svg className="absolute transform -rotate-90" width="36" height="36">
                              <circle
                                className="text-hover"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                r="14"
                                cx="18"
                                cy="18"
                              />
                              <circle
                                stroke={p.riskScore > 70 ? "#ef4444" : p.riskScore > 35 ? "#f59e0b" : "#10b981"}
                                strokeWidth="4"
                                strokeDasharray={2 * Math.PI * 14}
                                strokeDashoffset={(2 * Math.PI * 14) * (1 - p.riskScore / 100)}
                                fill="transparent"
                                r="14"
                                cx="18"
                                cy="18"
                              />
                            </svg>
                            <span className="text-xs font-bold text-text-primary z-10">{p.riskScore}</span>
                          </div>
                        </div>
                      </td>

                      {/* Health Label */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${healthDot}`} />
                          <span className="text-xs font-semibold text-text-primary">{p.riskLevel}</span>
                        </div>
                      </td>

                      {/* Latest Update */}
                      <td className="px-6 py-4 max-w-[200px]">
                        <div className="space-y-0.5">
                          <p className="text-xs text-text-primary truncate font-medium">{p.latestUpdateText}</p>
                          <span className="text-xxs text-text-muted mt-0.5 block">{formatDate(p.latestUpdateDate)}</span>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-6 py-4 text-xs font-semibold text-text-secondary truncate">
                        {p.managerName}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/projects/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-hover text-text-muted hover:text-accent-primary transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 7: ACTIVE SIGNALS & SECTION 8: RECOMMENDATIONS ENGINE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ACTIVE SIGNALS */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader className="pb-3 border-b border-border-soft bg-surface-secondary/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-card-title text-text-primary flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent-primary" />
                Active Signals Feed
              </CardTitle>
              <Badge tone="warning">{signalsFeed.length} Alerts Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border-soft max-h-[360px] overflow-y-auto">
              {signalsFeed.map((sig, index) => {
                const borderToneClass =
                  sig.severity === "High"
                    ? "border-l-red-500"
                    : sig.severity === "Medium"
                    ? "border-l-amber-500"
                    : "border-l-blue-500";
                return (
                  <div key={index} className={`flex items-start justify-between p-4 border-l-4 ${borderToneClass} bg-surface hover:bg-surface-secondary/30 transition-colors`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text-primary">{sig.title}</span>
                        <Badge tone={sig.severity === "High" ? "error" : sig.severity === "Medium" ? "warning" : "info"}>
                          {sig.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary">{sig.detail}</p>
                      <div className="flex items-center gap-3 text-xxs text-text-muted pt-1">
                        <span>Project: <strong>{sig.projectName}</strong></span>
                        <span>•</span>
                        <span>Lead: {sig.ownerName}</span>
                      </div>
                    </div>
                    {sig.dueAt && (
                      <div className="text-right flex flex-col items-end gap-1 shrink-0 ml-4">
                        <span className="text-xxs text-text-muted flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Due: {formatDate(sig.dueAt)}
                        </span>
                        <span className="text-xxs text-red-500 font-bold">{sig.metricLabel}: {sig.metricValue}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* RECOMMENDATIONS ENGINE */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader className="pb-3 border-b border-border-soft bg-surface-secondary/20">
            <CardTitle className="text-card-title text-text-primary flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Nimbus Intelligence Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 max-h-[360px] overflow-y-auto">
            {filteredRecommendations.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                All intelligence recommendations have been processed successfully.
              </div>
            ) : (
              filteredRecommendations.map((rec) => (
                <div key={rec.id} className="border border-border-soft rounded-lg p-3 bg-surface hover:border-accent-primary/20 transition-all flex flex-col justify-between gap-3 shadow-soft">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-text-primary block">{rec.title}</span>
                      <Badge tone={rec.priority === "High" ? "error" : "warning"}>
                        {rec.priority} Priority
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{rec.reason}</p>
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xxs font-semibold pt-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Impact: {rec.impact}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border-soft/60">
                    <span className="text-xxs text-text-muted italic">Suggested: {rec.action}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDismissedRecs([...dismissedRecs, rec.id])}
                        className="text-text-muted hover:text-red-500 h-7 text-xs"
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setExecutedRecs([...executedRecs, rec.id]);
                          setDismissedRecs([...dismissedRecs, rec.id]);
                          toast.success(`Successfully executed: ${rec.title}`);
                        }}
                        className="bg-accent-primary hover:bg-accent-primary-hover text-white h-7 text-xs"
                      >
                        Execute
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 9: PROJECT LEADERBOARD */}
      <Card className="border border-border-soft shadow-soft">
        <CardHeader className="pb-3 border-b border-border-soft">
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-title text-text-primary flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Project Leaderboards
            </CardTitle>
            <span className="text-xs text-text-muted">Top performers across active metrics</span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {/* Column 1: Fastest Progressing */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border-soft pb-2">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
                <span className="font-bold text-xs text-text-primary uppercase tracking-wider">Fastest Progressing</span>
              </div>
              <div className="space-y-3">
                {fastestProgressing.map((p, index) => (
                  <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded hover:bg-surface-secondary/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-extrabold text-text-muted w-4">{index + 1}</span>
                      <span className="font-medium text-text-primary truncate max-w-[120px]">{p.name}</span>
                    </div>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{p.completion}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Highest Resource Efficiency */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border-soft pb-2">
                <Users className="h-4.5 w-4.5 text-blue-600" />
                <span className="font-bold text-xs text-text-primary uppercase tracking-wider">Resource Efficiency</span>
              </div>
              <div className="space-y-3">
                {highestResourceEfficiency.map((p, index) => (
                  <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded hover:bg-surface-secondary/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-extrabold text-text-muted w-4">{index + 1}</span>
                      <span className="font-medium text-text-primary truncate max-w-[120px]">{p.name}</span>
                    </div>
                    <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{p.resourceUtil}% Util</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Lowest Risk Projects */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border-soft pb-2">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                <span className="font-bold text-xs text-text-primary uppercase tracking-wider">Lowest Risk Profile</span>
              </div>
              <div className="space-y-3">
                {lowestRiskProjects.map((p, index) => (
                  <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded hover:bg-surface-secondary/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-extrabold text-text-muted w-4">{index + 1}</span>
                      <span className="font-medium text-text-primary truncate max-w-[120px]">{p.name}</span>
                    </div>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Score: {p.riskScore}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 4: Top Performing Sites */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border-soft pb-2">
                <Award className="h-4.5 w-4.5 text-amber-500" />
                <span className="font-bold text-xs text-text-primary uppercase tracking-wider">Top Performing Sites</span>
              </div>
              <div className="space-y-3">
                {topPerformingSites.map((p, index) => (
                  <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded hover:bg-surface-secondary/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-extrabold text-text-muted w-4">{index + 1}</span>
                      <span className="font-medium text-text-primary truncate max-w-[120px]">{p.name}</span>
                    </div>
                    <Badge tone="success" className="font-medium">On Track</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
