"use client";
import { toast } from "@/components/ui/toast";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardPlus,
  TrendingUp,
  TrendingDown,
  Zap,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Info,
  ArrowRight,
  HardHat,
  Hammer,
  FileText,
  ChevronRight,
  Clock,
  Plus,
  Download,
  Share2,
  Cloud,
  Sun,
  CloudRain,
  Wind,
  AlertCircle,
  Calendar,
  Award,
  Search,
  Filter,
  MessageSquare,
  Sparkles,
  Eye,
  FileDown,
  Volume2,
  Activity,
  Layers,
  ShieldCheck,
  User,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatDate, toneForStatus } from "@/lib/erp-utils";
import type { DailyReport, DailyReportsResponse, PropertySummaryResponse } from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all";
const textareaClassName =
  "min-h-[104px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all";

function useProjectsSummary() {
  const role = useUiStore((state) => state.role);
  return useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });
}

const average = (values: number[]) => {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const uniqueCount = (values: string[]) => new Set(values.filter(Boolean)).size;

// Custom Sparkline component using basic SVG
function Sparkline({ data, tone = "info" }: { data: number[]; tone?: "success" | "warning" | "error" | "info" }) {
  if (!data || data.length === 0) return null;
  const width = 100;
  const height = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const points = data
    .map((val, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const colorMap = {
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#0ea5e9"
  };
  const color = colorMap[tone];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

export function SiteUpdatesWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const projectsQuery = useProjectsSummary();
  
  const query = useQuery({
    queryKey: ["erp-daily-reports", role],
    queryFn: async () => (await apiRequest<DailyReportsResponse>("/api/projects/daily-reports", { role })).data,
  });

  // Drawer Create State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    reportDate: new Date().toISOString().split("T")[0],
    shift: "Day",
    siteEngineer: "Vikram Rathore",
    laborCount: "12",
    laborSkilled: "4",
    laborUnskilled: "6",
    laborSupervisors: "2",
    progressPercent: "5",
    progressSummary: "",
    materialCement: "45",
    materialSteel: "2",
    materialSand: "15",
    materialAggregates: "10",
    materialUsageText: "",
    blockersLevel: "None",
    blockers: "",
    weather: "Sunny",
    remarks: "",
    siteHealth: "92",
  });

  // Filters State
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAuthor, setFilterAuthor] = useState("all");
  const [filterHasMedia, setFilterHasMedia] = useState(false);
  const [filterHasIssues, setFilterHasIssues] = useState(false);
  const [filterEscalationsOnly, setFilterEscalationsOnly] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState({ start: "", end: "" });

  const createMutation = useMutation({
    mutationFn: async (payload: any) =>
      apiRequest("/api/projects/daily-reports", {
        role,
        method: "POST",
        body: payload,
      }),
    onSuccess: async () => {
      setDrawerOpen(false);
      // Reset Form fields
      setForm({
        projectId: projectsQuery.data?.projects[0]?.id || "",
        reportDate: new Date().toISOString().split("T")[0],
        shift: "Day",
        siteEngineer: "Vikram Rathore",
        laborCount: "12",
        laborSkilled: "4",
        laborUnskilled: "6",
        laborSupervisors: "2",
        progressPercent: "5",
        progressSummary: "",
        materialCement: "45",
        materialSteel: "2",
        materialSand: "15",
        materialAggregates: "10",
        materialUsageText: "",
        blockersLevel: "None",
        blockers: "",
        weather: "Sunny",
        remarks: "",
        siteHealth: "92",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-daily-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-project-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
    onError: (err: any) => {
      toast.error(`Error publishing update: ${err.message}`);
    }
  });

  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projectsQuery.data?.projects[0]?.id || "" }));
    }
  }, [form.projectId, projectsQuery.data?.projects]);

  if (query.isLoading || projectsQuery.isLoading) return <LoadingStateCard title="Loading site updates feed" />;
  if (query.error || projectsQuery.error || !query.data || !projectsQuery.data) return <ErrorStateCard message="Site intelligence data is unavailable." />;

  const rawReports = query.data.reports || [];
  const reports = rawReports.slice().sort((left, right) => new Date(right.reportDate).getTime() - new Date(left.reportDate).getTime());

  // Handle Form Submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      projectId: form.projectId,
      reportDate: form.reportDate,
      shift: form.shift,
      siteEngineer: form.siteEngineer,
      laborCount: Number(form.laborCount) || 0,
      progressPercent: Number(form.progressPercent) || 0,
      progressSummary: form.progressSummary || "Standard progress logged.",
      materialUsage: form.materialUsageText || `Cement: ${form.materialCement} bags, Steel: ${form.materialSteel} tons, Sand: ${form.materialSand} tons`,
      blockersLevel: form.blockersLevel,
      blockers: form.blockers || "No critical blockers.",
      weather: form.weather,
      remarks: form.remarks,
      siteHealth: Number(form.siteHealth) || 92,
      laborDetails: {
        skilled: Number(form.laborSkilled) || 0,
        unskilled: Number(form.laborUnskilled) || 0,
        supervisors: Number(form.laborSupervisors) || 0,
      },
      materials: {
        cement: Number(form.materialCement) || 0,
        steel: Number(form.materialSteel) || 0,
        sand: Number(form.materialSand) || 0,
        aggregates: Number(form.materialAggregates) || 0,
      },
      photos: [
        "/api/placeholder/800/600",
        "/api/placeholder/800/600"
      ]
    };
    createMutation.mutate(payload);
  };

  // Unique Authors
  const authors = Array.from(new Set(reports.map(r => r.submittedByName).filter(Boolean)));

  // Filter Logic
  const filteredReports = reports.filter((report) => {
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSearch =
        report.projectName?.toLowerCase().includes(q) ||
        report.progressSummary?.toLowerCase().includes(q) ||
        report.submittedByName?.toLowerCase().includes(q) ||
        report.blockers?.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    // Project filter
    if (filterProject !== "all" && report.projectId !== filterProject) {
      return false;
    }

    // Priority/Blocker Level filter
    if (filterPriority !== "all") {
      if (filterPriority === "High" && report.blockersLevel !== "High" && report.blockersLevel !== "Critical") return false;
      if (filterPriority === "Medium" && report.blockersLevel !== "Medium") return false;
      if (filterPriority === "Low" && report.blockersLevel !== "Low" && report.blockersLevel !== "None") return false;
    }

    // Author filter
    if (filterAuthor !== "all" && report.submittedByName !== filterAuthor) {
      return false;
    }

    // Has Media filter
    if (filterHasMedia && (!report.photos || report.photos.length === 0)) {
      return false;
    }

    // Has Issues filter
    if (filterHasIssues) {
      const isBlocked = report.blockers && report.blockers.toLowerCase() !== "no critical blockers." && report.blockersLevel !== "None";
      if (!isBlocked) return false;
    }

    // Escalations Only
    if (filterEscalationsOnly && report.blockersLevel !== "Critical" && report.blockersLevel !== "High") {
      return false;
    }

    // Date Range filter
    if (filterDateRange.start) {
      if (new Date(report.reportDate) < new Date(filterDateRange.start)) return false;
    }
    if (filterDateRange.end) {
      if (new Date(report.reportDate) > new Date(filterDateRange.end)) return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSearch("");
    setFilterProject("all");
    setFilterPriority("all");
    setFilterAuthor("all");
    setFilterHasMedia(false);
    setFilterHasIssues(false);
    setFilterEscalationsOnly(false);
    setFilterDateRange({ start: "", end: "" });
  };

  // Weather Icon Helper
  const getWeatherIcon = (w?: string) => {
    switch (w?.toLowerCase()) {
      case "rainy":
      case "rain":
        return <CloudRain className="h-4 w-4 text-info" />;
      case "cloudy":
      case "clouds":
        return <Cloud className="h-4 w-4 text-text-muted" />;
      case "windy":
      case "wind":
        return <Wind className="h-4 w-4 text-accent-secondary" />;
      case "sunny":
      case "clear":
      default:
        return <Sun className="h-4 w-4 text-warning" fill="currentColor" />;
    }
  };

  // Section 1: Metrics
  const totalUpdatesCount = reports.length;
  const updatesThisWeekCount = reports.filter(r => {
    const diffTime = Math.abs(new Date().getTime() - new Date(r.reportDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;
  const activeProjectsCount = uniqueCount(reports.map(r => r.projectId));
  const totalPhotosCount = reports.reduce((sum, r) => sum + (r.photos?.length || 0), 0) + 120; // adding baseline mock data
  const totalVideosCount = 22; // baseline mock
  const openConcernsCount = reports.filter(r => r.blockersLevel === "Medium" || r.blockersLevel === "High").length;
  const escalationsCount = reports.filter(r => r.blockersLevel === "Critical" || r.blockersLevel === "High").length;
  const avgHealthScore = average(reports.map(r => r.siteHealth || 90));

  // Section 4: Chart Data Generations
  // Chart 1: Site Activity Trend (Last 30 Days)
  const activityTrendData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const matchReports = reports.filter(r => r.reportDate.split("T")[0] === dateStr);
      
      data.push({
        date: formatDate(dateStr).split(",")[0],
        Updates: matchReports.length,
        Photos: matchReports.length * 2 + (i % 3 === 0 ? 3 : 1),
        Videos: i % 5 === 0 ? 1 : 0
      });
    }
    return data;
  }, [reports]);

  // Chart 2: Project Activity Distribution
  const projectDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      counts[r.projectName] = (counts[r.projectName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [reports]);

  // Chart 3: Update Classification
  const classificationData = useMemo(() => {
    let normal = 0;
    let concern = 0;
    let escalation = 0;

    reports.forEach(r => {
      if (r.blockersLevel === "Critical" || r.blockersLevel === "High") {
        escalation++;
      } else if (r.blockersLevel === "Medium") {
        concern++;
      } else {
        normal++;
      }
    });

    return [
      { name: "Normal", value: normal, color: "#22c55e" },
      { name: "Concern", value: concern, color: "#f59e0b" },
      { name: "Escalation", value: escalation, color: "#ef4444" }
    ];
  }, [reports]);

  // Chart 4: Issue Category Breakdown
  const issueCategoryData = useMemo(() => {
    // Generate stacked counts for safety, quality, material, schedule, design
    return projectsQuery.data?.projects.map((proj, idx) => {
      const projectReports = reports.filter(r => r.projectId === proj.id);
      let safety = 0;
      let quality = 0;
      let material = 0;
      let schedule = 0;
      let design = 0;

      projectReports.forEach(r => {
        const text = (r.blockers + " " + r.progressSummary).toLowerCase();
        if (text.includes("safety") || text.includes("guard") || text.includes("hazard")) safety++;
        if (text.includes("quality") || text.includes("crack") || text.includes("leak") || text.includes("rework")) quality++;
        if (text.includes("material") || text.includes("cement") || text.includes("steel") || text.includes("supply")) material++;
        if (text.includes("schedule") || text.includes("delay") || text.includes("timeline") || text.includes("late")) schedule++;
        if (text.includes("design") || text.includes("architect") || text.includes("drawing") || text.includes("revision")) design++;
      });

      // Fallback baseline for visual styling
      if (safety + quality + material + schedule + design === 0) {
        safety = (idx % 2) + 1;
        material = (idx % 3);
        schedule = (idx % 2);
      }

      return {
        name: proj.name,
        Safety: safety,
        Quality: quality,
        Material: material,
        Schedule: schedule,
        Design: design
      };
    }) || [];
  }, [reports, projectsQuery.data]);

  // Section 5: Timeline Contribution Heatmap
  const timelineHeatmap = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayReports = reports.filter(r => r.reportDate.split("T")[0] === dateStr);
      const issues = dayReports.filter(r => r.blockersLevel && r.blockersLevel !== "None" && r.blockersLevel !== "Low").length;
      
      days.push({
        date: d,
        dateString: dateStr,
        formatted: formatDate(dateStr),
        volume: dayReports.length,
        projects: Array.from(new Set(dayReports.map(r => r.projectName))),
        issues
      });
    }
    return days;
  }, [reports]);

  // Section 6: Project Activity Leaderboard
  const projectLeaderboard = useMemo(() => {
    return projectsQuery.data?.projects.map((proj) => {
      const projectReports = reports.filter(r => r.projectId === proj.id);
      const updates = projectReports.length;
      const photos = projectReports.reduce((sum, r) => sum + (r.photos?.length || 0), 0) + (updates > 0 ? 4 : 0);
      const issues = projectReports.filter(r => r.blockersLevel !== "None" && r.blockersLevel !== "Low").length;
      const progress = projectReports.length > 0 ? Math.max(...projectReports.map(r => r.progressPercent || 0)) : 45; // default mock
      
      // Activity score: weighted calculation
      const activityScore = Math.min(100, (updates * 10) + (photos * 5) - (issues * 15) + 60);

      return {
        id: proj.id,
        name: proj.name,
        updates,
        photos,
        issues,
        progress,
        activityScore: updates > 0 ? activityScore : 0
      };
    }).sort((a, b) => b.activityScore - a.activityScore) || [];
  }, [reports, projectsQuery.data]);

  // Export mock trigger
  const handleExport = () => {
    toast.success("Exporting Operations Summary Report as PDF... Completed.");
  };

  return (
    <section className="space-y-6 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-5">
        <div className="space-y-1">
          <h1 className="text-page-title font-secondary text-text-primary tracking-tight">Site Intelligence Center</h1>
          <p className="max-w-2xl text-body text-text-secondary">
            Track field activity, site observations, progress updates, issues, media, and project communications across all active sites.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="md" onClick={handleExport} className="shadow-soft">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <a href="#timeline-heatmap">
            <Button variant="secondary" size="md" className="shadow-soft">
              <Calendar className="h-4 w-4" />
              Project Timeline
            </Button>
          </a>
          <a href="#visual-analytics">
            <Button variant="secondary" size="md" className="shadow-soft">
              <Activity className="h-4 w-4" />
              Site Analytics
            </Button>
          </a>
          <Button variant="primary" size="md" onClick={() => setDrawerOpen(true)} className="shadow-active-nav bg-accent-primary hover:bg-accent-primary-hover">
            <Plus className="h-4 w-4" />
            Create Site Update
          </Button>
        </div>
      </div>

      {/* SECTION 1: FIELD OPERATIONS HERO */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="col-span-1 xl:col-span-2 surface-card overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full filter blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-success animate-pulse"></span>
                  <span className="text-label font-semibold tracking-wider text-success uppercase">Active Operations</span>
                </div>
                <h2 className="text-section-title font-secondary text-text-primary">Operational Summary</h2>
                <p className="text-body text-text-secondary leading-relaxed">
                  Field operations are running within optimal parameters. Reporting coverage has increased this week. Delay vectors are localized around Commercial Plaza's material deliveries.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="p-3 surface-secondary rounded-[var(--radius-input)]">
                    <p className="text-label text-text-muted">Updates Today</p>
                    <p className="text-section-title font-bold text-text-primary mt-1">
                      {reports.filter(r => r.reportDate.split("T")[0] === new Date().toISOString().split("T")[0]).length || 3}
                    </p>
                  </div>
                  <div className="p-3 surface-secondary rounded-[var(--radius-input)]">
                    <p className="text-label text-text-muted">Reporting Coverage</p>
                    <p className="text-section-title font-bold text-text-primary mt-1">
                      {projectsQuery.data?.projects ? Math.round((activeProjectsCount / (projectsQuery.data.projects.length || 1)) * 100) : 0}%
                    </p>
                  </div>
                  <div className="p-3 surface-secondary rounded-[var(--radius-input)]">
                    <p className="text-label text-text-muted">Photos Uploaded</p>
                    <p className="text-section-title font-bold text-text-primary mt-1">{totalPhotosCount}</p>
                  </div>
                  <div className="p-3 surface-secondary rounded-[var(--radius-input)]">
                    <p className="text-label text-text-muted">Open Concerns</p>
                    <p className="text-section-title font-bold text-warning mt-1">{openConcernsCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center p-4 bg-surface-secondary/40 border border-border-soft rounded-2xl w-48 shrink-0">
                <div className="relative flex items-center justify-center w-28 h-28">
                  {/* Score Ring */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="var(--color-border-soft)" strokeWidth="8" fill="transparent" />
                    <circle cx="56" cy="56" r="48" stroke="var(--color-success)" strokeWidth="8" fill="transparent" 
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 * (1 - 92/100)}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-kpi-value text-3xl font-extrabold text-text-primary">92</span>
                    <span className="text-[10px] uppercase font-bold text-text-muted">Score</span>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <p className="text-label font-bold text-success flex items-center justify-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5" /> +8% vs last week
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">Field Activity Rating</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: SITE INTELLIGENCE CENTER (RECOMMENDATIONS) */}
        <Card className="surface-card col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-card-title flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-primary" /> Intelligence Center
              </CardTitle>
              <Badge tone="info" className="text-[10px] font-bold">4 Insights</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-1 overflow-y-auto max-h-[260px]">
            {/* Operational Alert */}
            <div className="p-3 border-l-4 border-warning bg-warning/5 rounded-[var(--radius-input)] flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-label font-bold text-text-primary">Operational Alert</p>
                <p className="text-[11px] text-text-secondary leading-tight">3 projects reported materials or delivery concerns today.</p>
                <a href="#updates-feed" className="text-[11px] font-semibold text-warning hover:underline flex items-center gap-0.5">
                  Review Projects <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* High Activity */}
            <div className="p-3 border-l-4 border-info bg-info/5 rounded-[var(--radius-input)] flex items-start gap-3">
              <Zap className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-label font-bold text-text-primary">High Activity Alert</p>
                <p className="text-[11px] text-text-secondary leading-tight">Tower A generated 12 critical updates this week.</p>
                <a href="#updates-feed" className="text-[11px] font-semibold text-info hover:underline flex items-center gap-0.5">
                  View Timeline <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Critical Escalation */}
            <div className="p-3 border-l-4 border-error bg-error/5 rounded-[var(--radius-input)] flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-label font-bold text-text-primary">Escalation Detected</p>
                <p className="text-[11px] text-text-secondary leading-tight">2 updates marked critical (design blocker & sub-contractor delay).</p>
                <a href="#updates-feed" className="text-[11px] font-semibold text-error hover:underline flex items-center gap-0.5">
                  Investigate <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Positive Momentum */}
            <div className="p-3 border-l-4 border-success bg-success/5 rounded-[var(--radius-input)] flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-label font-bold text-text-primary">Positive Momentum</p>
                <p className="text-[11px] text-text-secondary leading-tight">Commercial Plaza achieved 100% milestone blockwork completion.</p>
                <a href="#leaderboard" className="text-[11px] font-semibold text-success hover:underline flex items-center gap-0.5">
                  View Progress <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: EXECUTIVE KPI STRIP (8 CARDS WITH SPARKLINES) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {/* KPI 1 */}
        <Card className="surface-card p-3.5 space-y-2">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Total Updates</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text-primary">{totalUpdatesCount}</span>
            <Badge tone="success" className="text-[9px] px-1 py-0">+12%</Badge>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Sparkline data={[12, 14, 15, 17, 16, 19, 21, totalUpdatesCount]} tone="success" />
          </div>
          <p className="text-[10px] text-text-muted mt-1">Continuous field reporting</p>
        </Card>

        {/* KPI 2 */}
        <Card className="surface-card p-3.5 space-y-2">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Weekly Updates</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text-primary">{updatesThisWeekCount}</span>
            <Badge tone="info" className="text-[9px] px-1 py-0">Steady</Badge>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Sparkline data={[4, 5, 4, 6, 7, 5, 8, updatesThisWeekCount]} tone="info" />
          </div>
          <p className="text-[10px] text-text-muted mt-1">DPR velocity is stable</p>
        </Card>

        {/* KPI 3 */}
        <Card className="surface-card p-3.5 space-y-2">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Active Projects</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text-primary">{activeProjectsCount}</span>
            <Badge tone="success" className="text-[9px] px-1 py-0">100%</Badge>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Sparkline data={[3, 3, 4, 4, 4, 4, 4, activeProjectsCount]} tone="success" />
          </div>
          <p className="text-[10px] text-text-muted mt-1">All live complexes reporting</p>
        </Card>

        {/* KPI 4 */}
        <Card className="surface-card p-3.5 space-y-2">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Photos Uploaded</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text-primary">{totalPhotosCount}</span>
            <Badge tone="success" className="text-[9px] px-1 py-0">+18%</Badge>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Sparkline data={[85, 92, 102, 108, 115, 122, 130, totalPhotosCount]} tone="success" />
          </div>
          <p className="text-[10px] text-text-muted mt-1">Visual proofs increasing</p>
        </Card>

        {/* KPI 5 */}
        <Card className="surface-card p-3.5 space-y-2">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Videos Uploaded</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text-primary">{totalVideosCount}</span>
            <Badge tone="info" className="text-[9px] px-1 py-0">+5%</Badge>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Sparkline data={[14, 15, 17, 18, 17, 20, 21, totalVideosCount]} tone="info" />
          </div>
          <p className="text-[10px] text-text-muted mt-1">Walkthrough walkthroughs</p>
        </Card>

        {/* KPI 6 */}
        <Card className="surface-card p-3.5 space-y-2">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Open Concerns</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-warning">{openConcernsCount}</span>
            <Badge tone="warning" className="text-[9px] px-1 py-0">-15%</Badge>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Sparkline data={[8, 7, 9, 6, 5, 4, 4, openConcernsCount]} tone="warning" />
          </div>
          <p className="text-[10px] text-text-muted mt-1">Active blockers resolved</p>
        </Card>

        {/* KPI 7 */}
        <Card className="surface-card p-3.5 space-y-2">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Escalations</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-error">{escalationsCount}</span>
            <Badge tone="error" className="text-[9px] px-1 py-0">Critical</Badge>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Sparkline data={[1, 3, 2, 2, 1, 1, 2, escalationsCount]} tone="error" />
          </div>
          <p className="text-[10px] text-text-muted mt-1">Attention requested</p>
        </Card>

        {/* KPI 8 */}
        <Card className="surface-card p-3.5 space-y-2">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Engagement Score</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text-primary">94%</span>
            <Badge tone="success" className="text-[9px] px-1 py-0">+2%</Badge>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Sparkline data={[90, 91, 92, 92, 93, 93, 94, 94]} tone="success" />
          </div>
          <p className="text-[10px] text-text-muted mt-1">Reporting compliance</p>
        </Card>
      </div>

      {/* SECTION 4: VISUAL ANALYTICS (2x2 GRID) */}
      <div id="visual-analytics" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Site Activity Trend */}
        <Card className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <CardTitle className="text-card-title">Site Activity Trend</CardTitle>
              <p className="text-[11px] text-text-muted">Updates, photo uploads, and video logs over the last 30 days</p>
            </div>
            <Badge tone="info" className="text-[10px]">Last 30 Days</Badge>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUpdates" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPhotos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid var(--color-border-soft)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="Updates" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorUpdates)" />
                <Area type="monotone" dataKey="Photos" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorPhotos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Project Activity Distribution */}
        <Card className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <CardTitle className="text-card-title">Project Activity Distribution</CardTitle>
              <p className="text-[11px] text-text-muted">Total update submission volume ranked by project</p>
            </div>
            <Badge tone="info" className="text-[10px]">All Projects</Badge>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectDistributionData} layout="vertical" margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid var(--color-border-soft)", fontSize: "12px" }} />
                <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 3: Update Classification */}
        <Card className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <CardTitle className="text-card-title">Update Classification</CardTitle>
              <p className="text-[11px] text-text-muted">Proportion of normal updates vs concerns and escalations</p>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-secondary px-2.5 py-1 rounded-full border border-border-soft">
              <span className="text-[10px] font-bold text-text-primary">Total: {totalUpdatesCount}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-[200px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classificationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {classificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-text-primary">{totalUpdatesCount}</span>
                <span className="text-[10px] uppercase font-bold text-text-muted">Updates</span>
              </div>
            </div>
            <div className="space-y-3 px-4">
              {classificationData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2 surface-secondary rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-label text-text-primary font-semibold">{item.name}</span>
                  </div>
                  <span className="text-label text-text-secondary font-bold">
                    {item.value} ({Math.round((item.value / (totalUpdatesCount || 1)) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Chart 4: Issue Category Breakdown */}
        <Card className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <CardTitle className="text-card-title">Issue Category Breakdown</CardTitle>
              <p className="text-[11px] text-text-muted">Risk categorization across active structures</p>
            </div>
            <Badge tone="warning" className="text-[10px]">Attention Required</Badge>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issueCategoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid var(--color-border-soft)", fontSize: "12px" }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="Safety" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Quality" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Material" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Schedule" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Design" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* SECTION 5: SITE TIMELINE VISUALIZATION (14 DAYS HEATMAP) */}
      <Card id="timeline-heatmap" className="surface-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-0.5">
            <CardTitle className="text-card-title flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-accent-primary" /> 14-Day Activity Roadmap
            </CardTitle>
            <p className="text-[11px] text-text-muted">Visual density of field reporting volume and localized safety or schedule alerts</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-text-muted">
            <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-surface border border-border-soft"></span> No Activity</div>
            <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-success/20"></span> Low (1)</div>
            <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-success/60"></span> Med (2-3)</div>
            <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-success"></span> High (4+)</div>
            <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-error animate-pulse"></span> Issue Reported</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-7 xl:grid-cols-14 gap-3">
          {timelineHeatmap.map((day, idx) => {
            let bgColor = "bg-surface";
            if (day.volume === 1) bgColor = "bg-success/20 hover:bg-success/30";
            if (day.volume >= 2 && day.volume <= 3) bgColor = "bg-success/60 hover:bg-success/70";
            if (day.volume >= 4) bgColor = "bg-success hover:bg-success-hover";
            if (day.issues > 0) bgColor = "bg-error/15 border-error/30 hover:bg-error/20";

            return (
              <div
                key={day.dateString}
                className={`group relative p-3 border border-border-soft rounded-xl transition-all cursor-pointer shadow-soft flex flex-col items-center justify-center text-center ${bgColor}`}
              >
                <p className="text-[10px] font-bold text-text-muted">
                  {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p className="text-base font-extrabold text-text-primary mt-0.5">
                  {day.date.getDate()}
                </p>
                
                {day.issues > 0 ? (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-error animate-pulse"></span>
                ) : null}

                {/* Hover Details overlay card */}
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 z-30 bg-text-primary text-white text-[11px] p-3 rounded-lg w-52 shadow-floating text-left leading-relaxed">
                  <p className="font-bold text-accent-secondary border-b border-white/10 pb-1 mb-1">{day.formatted}</p>
                  <p><span className="font-semibold text-success">Updates submitted:</span> {day.volume}</p>
                  <p><span className="font-semibold text-warning">Alerts flagged:</span> {day.issues}</p>
                  {day.projects.length > 0 && (
                    <p className="mt-1 text-[10px] text-white/80 overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="font-semibold">Sites:</span> {day.projects.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* SECTION 6: PROJECT ACTIVITY LEADERBOARD */}
      <Card id="leaderboard" className="surface-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-card-title">Most Active Projects Leaderboard</CardTitle>
              <p className="text-[11px] text-text-muted">Ranking based on reporting compliance, photo updates, and issue resolution</p>
            </div>
            <Badge tone="success" className="text-[10px] font-bold flex items-center gap-1">
              <Award className="h-3.5 w-3.5" /> Operations Ranking
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-table">
              <thead className="bg-surface-secondary text-text-secondary uppercase text-[10px] tracking-wider">
                <tr className="h-11 border-b border-border-soft">
                  <th className="px-6 text-left w-16">Rank</th>
                  <th className="px-6 text-left">Project Structure</th>
                  <th className="px-6 text-center">Updates Logged</th>
                  <th className="px-6 text-center">Photos Uploaded</th>
                  <th className="px-6 text-center">Open Concerns</th>
                  <th className="px-6 text-center">Target Completion</th>
                  <th className="px-6 text-right pr-8">Activity Index</th>
                </tr>
              </thead>
              <tbody>
                {projectLeaderboard.map((proj, idx) => {
                  const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`;
                  return (
                    <tr key={proj.id} className="border-b border-border-soft hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-center text-text-primary text-sm">
                        {idx < 3 ? <span className="text-lg">{medal}</span> : <span className="text-text-muted">{medal}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-accent-primary/5 rounded-lg flex items-center justify-center shrink-0">
                            <Building2 className="h-4.5 w-4.5 text-accent-primary" />
                          </div>
                          <div>
                            <span className="font-semibold text-text-primary hover:underline cursor-pointer block">{proj.name}</span>
                            <span className="text-[10px] text-text-muted">General Construction</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-text-primary">{proj.updates}</td>
                      <td className="px-6 py-4 text-center text-text-muted">{proj.photos}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={proj.issues > 0 ? "text-error font-bold" : "text-success font-medium"}>
                          {proj.issues}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 bg-hover h-2 rounded-full overflow-hidden">
                            <div className="bg-success h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                          </div>
                          <span className="text-[11px] font-bold text-text-secondary">{proj.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                        <div className="inline-flex items-center gap-1.5 bg-accent-primary/5 px-2.5 py-1 rounded-full border border-accent-primary/10">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent-primary"></span>
                          <span className="font-bold text-accent-primary text-[11px]">{proj.activityScore} / 100</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ADVANCED FILTER BAR */}
      <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border border-border-soft rounded-2xl shadow-soft p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
            <Filter className="h-4.5 w-4.5 text-accent-primary" />
            <span>Search & Operational Filters</span>
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-text-muted text-xs hover:text-text-primary">
            Reset Filters
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feed narrative..."
              className="h-11 bg-surface pl-9 border border-border-soft focus:border-accent-primary"
            />
          </div>

          {/* Project dropdown */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-body text-text-primary focus-visible:outline-none"
          >
            <option value="all">All Projects</option>
            {projectsQuery.data?.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Priority Blocker Level */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-body text-text-primary focus-visible:outline-none"
          >
            <option value="all">All Risk Levels</option>
            <option value="High">High / Critical Blocker</option>
            <option value="Medium">Medium Concern</option>
            <option value="Low">Normal / Low Blocker</option>
          </select>

          {/* Author filter */}
          <select
            value={filterAuthor}
            onChange={(e) => setFilterAuthor(e.target.value)}
            className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-body text-text-primary focus-visible:outline-none"
          >
            <option value="all">All Authors</option>
            {authors.map((auth) => (
              <option key={auth} value={auth}>{auth}</option>
            ))}
          </select>

          {/* Date range start */}
          <div className="space-y-1">
            <Input
              type="date"
              value={filterDateRange.start}
              onChange={(e) => setFilterDateRange((prev) => ({ ...prev, start: e.target.value }))}
              placeholder="Start Date"
              className="h-11 border-border-soft"
            />
          </div>

          {/* Date range end */}
          <div className="space-y-1">
            <Input
              type="date"
              value={filterDateRange.end}
              onChange={(e) => setFilterDateRange((prev) => ({ ...prev, end: e.target.value }))}
              placeholder="End Date"
              className="h-11 border-border-soft"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1 text-label text-text-secondary">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filterHasMedia}
              onChange={(e) => setFilterHasMedia(e.target.checked)}
              className="h-4 w-4 rounded border-border-soft text-accent-primary focus:ring-accent-primary"
            />
            <span className="font-semibold text-xs">Contains Photo/Video Media</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filterHasIssues}
              onChange={(e) => setFilterHasIssues(e.target.checked)}
              className="h-4 w-4 rounded border-border-soft text-accent-primary focus:ring-accent-primary"
            />
            <span className="font-semibold text-xs">Has Active Blockers</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filterEscalationsOnly}
              onChange={(e) => setFilterEscalationsOnly(e.target.checked)}
              className="h-4 w-4 rounded border-border-soft text-accent-primary focus:ring-accent-primary"
            />
            <span className="font-semibold text-xs text-error">Escalations & Criticals Only</span>
          </label>
        </div>
      </div>

      {/* SECTION 7: FIELD UPDATE FEED */}
      <div id="updates-feed" className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <p className="text-sm font-semibold text-text-muted">
            Displaying <span className="text-text-primary font-bold">{filteredReports.length}</span> Operations Updates
          </p>
        </div>

        {filteredReports.length === 0 ? (
          <Card className="surface-card p-12 text-center flex flex-col items-center justify-center space-y-4">
            <AlertCircle className="h-12 w-12 text-text-muted animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-section-title font-semibold text-text-primary">No updates matched your filters</h3>
              <p className="text-body text-text-secondary">Try adjusting search parameters or click "Reset Filters" above.</p>
            </div>
            <Button onClick={resetFilters}>Clear All Filters</Button>
          </Card>
        ) : (
          <div className="space-y-5">
            {filteredReports.map((report) => {
              // Status Flag tone and indicator
              let flagColor = "bg-success text-white border-success";
              let flagText = "Optimal";
              if (report.blockersLevel === "High" || report.blockersLevel === "Critical") {
                flagColor = "bg-error text-white border-error";
                flagText = report.blockersLevel;
              } else if (report.blockersLevel === "Medium") {
                flagColor = "bg-warning text-text-primary border-warning";
                flagText = "Concern";
              }

              const hasBlockers = report.blockers && report.blockers.toLowerCase() !== "no critical blockers." && report.blockersLevel !== "None";

              return (
                <Card
                  key={report.id}
                  className="surface-card hover:shadow-enterprise transition-all duration-300 border border-border-soft overflow-hidden group"
                >
                  <div className="p-5 space-y-4">
                    {/* Top Row: Badges, Weather, Date */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info" className="px-2.5 py-0.5 font-bold tracking-wide">
                          {report.projectName}
                        </Badge>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${flagColor}`}>
                          {flagText}
                        </div>
                        {report.shift && (
                          <Badge tone="neutral" className="text-[10px] font-semibold bg-surface-secondary">
                            {report.shift} Shift
                          </Badge>
                        )}
                        {report.siteHealth && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${report.siteHealth >= 90 ? "text-success bg-success/5 border border-success/20" : "text-warning bg-warning/5 border border-warning/20"}`}>
                            Health: {report.siteHealth}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-label text-text-muted">
                        <div className="flex items-center gap-1 font-semibold">
                          {getWeatherIcon(report.weather)}
                          <span className="capitalize">{report.weather || "Sunny"}</span>
                        </div>
                        <span className="h-1.5 w-1.5 rounded-full bg-border-soft"></span>
                        <div className="flex items-center gap-1 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-text-muted" />
                          {formatDate(report.reportDate)}
                        </div>
                      </div>
                    </div>

                    {/* Headline and narrative preview */}
                    <div className="space-y-2">
                      <Link href={`/projects/site-updates/${report.id}`}>
                        <h3 className="text-section-title font-semibold text-text-primary group-hover:text-accent-primary transition-colors cursor-pointer leading-tight">
                          {report.projectName} — {report.progressPercent ? `${report.progressPercent}% progress increment` : "Field Progress Update"}
                        </h3>
                      </Link>
                      <p className="text-body text-text-secondary leading-relaxed">
                        {report.progressSummary}
                      </p>
                    </div>

                    {/* Meta Section: Labor, materials, blockers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-surface-secondary/40 border border-border-soft rounded-xl text-label">
                      <div className="space-y-1">
                        <p className="font-bold text-text-muted flex items-center gap-1">
                          <HardHat className="h-3.5 w-3.5 text-accent-primary" /> Deployed Workforce
                        </p>
                        <p className="text-text-primary font-semibold">
                          {report.laborCount} laborers on-site
                          {report.laborDetails && (
                            <span className="text-[10px] text-text-muted block mt-0.5 font-normal">
                              ({report.laborDetails.skilled} Skilled, {report.laborDetails.unskilled} Unskilled, {report.laborDetails.supervisors} Sup.)
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-text-muted flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-accent-secondary" /> Material Allocations
                        </p>
                        <p className="text-text-primary font-semibold truncate" title={report.materialUsage}>
                          {report.materialUsage || "Standard structural materials used."}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-text-muted flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Blockers & Hold-Ups
                        </p>
                        <p className={`font-semibold ${hasBlockers ? "text-error" : "text-success"}`}>
                          {hasBlockers ? report.blockers : "No operational blockers logged."}
                        </p>
                      </div>
                    </div>

                    {/* Bottom row: Authors, Tag, comments & actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border-soft pt-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-accent-primary" />
                        </div>
                        <div className="leading-none">
                          <p className="text-xs font-bold text-text-primary">{report.submittedByName}</p>
                          <p className="text-[9px] text-text-muted font-medium mt-0.5">Site Engineer</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/projects/site-updates/${report.id}`}>
                          <Button variant="ghost" size="sm" className="text-text-secondary hover:text-accent-primary gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>12 Comments</span>
                          </Button>
                        </Link>
                        <span className="h-4 w-px bg-border-soft"></span>
                        
                        <div className="flex items-center gap-1">
                          <Link href={`/projects/site-updates/${report.id}`}>
                            <Button size="sm" variant="ghost" className="text-text-secondary hover:text-accent-primary">
                              <Eye className="h-4 w-4" /> View
                            </Button>
                          </Link>
                          
                          <Button size="sm" variant="ghost" onClick={() => toast.info("Comment triggered.")} className="text-text-secondary hover:text-accent-primary">
                            Comment
                          </Button>

                          <Button size="sm" variant="ghost" onClick={() => toast.success("Share Link copied to clipboard.")} className="text-text-secondary hover:text-accent-primary">
                            <Share2 className="h-4 w-4" /> Share
                          </Button>

                          {hasBlockers && (
                            <Button size="sm" variant="ghost" onClick={() => toast.info("Escalated to management dashboard.")} className="text-error hover:bg-error/5">
                              Escalate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE SITE UPDATE DRAWER (XL) */}
      <Drawer
        open={drawerOpen}
        title="Publish Real-time Site Intelligence Update"
        size="xl"
        onClose={() => setDrawerOpen(false)}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-6 pb-12">
          <div className="p-4 rounded-xl border border-info/20 bg-info/5 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-info shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-text-primary">Executive Visibility Notice</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Site updates published here are broadcast directly to the executive dashboard, triggering notifications for critical blockers or status changes. Keep descriptions concise and objective.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: Core Fields */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-soft pb-1.5">1. Core Information</h3>
              
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Project Site *</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
                  className={selectClassName}
                  required
                >
                  <option value="" disabled>Select project</option>
                  {projectsQuery.data?.projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Report Date *</label>
                <Input
                  type="date"
                  value={form.reportDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, reportDate: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Shift *</label>
                  <select
                    value={form.shift}
                    onChange={(e) => setForm((prev) => ({ ...prev, shift: e.target.value }))}
                    className={selectClassName}
                  >
                    <option value="Day">Day</option>
                    <option value="Night">Night</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Weather Conditions</label>
                  <select
                    value={form.weather}
                    onChange={(e) => setForm((prev) => ({ ...prev, weather: e.target.value }))}
                    className={selectClassName}
                  >
                    <option value="Sunny">Sunny / Clear</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Rainy">Rainy / Disruption</option>
                    <option value="Windy">Windy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Progress Increment (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.progressPercent}
                    onChange={(e) => setForm((prev) => ({ ...prev, progressPercent: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Site Health (0-100)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.siteHealth}
                    onChange={(e) => setForm((prev) => ({ ...prev, siteHealth: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Log Deployed Site Engineer</label>
                <Input
                  value={form.siteEngineer}
                  onChange={(e) => setForm((prev) => ({ ...prev, siteEngineer: e.target.value }))}
                  placeholder="Vikram Rathore"
                />
              </div>
            </div>

            {/* Column 2: Narrative & Blockers */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-soft pb-1.5">2. Narrative & Obstacles</h3>
              
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Daily Narrative Summary *</label>
                <textarea
                  className={textareaClassName}
                  value={form.progressSummary}
                  onChange={(e) => setForm((prev) => ({ ...prev, progressSummary: e.target.value }))}
                  placeholder="Describe progress, milestones reached, pours completed..."
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="col-span-1 space-y-1">
                  <label className="text-label text-text-secondary">Blockers Level</label>
                  <select
                    value={form.blockersLevel}
                    onChange={(e) => setForm((prev) => ({ ...prev, blockersLevel: e.target.value }))}
                    className={selectClassName}
                  >
                    <option value="None">None</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="col-span-2 text-[10px] text-text-muted pb-2">
                  Critical level issues alert portfolio managers.
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Blockers Description</label>
                <textarea
                  className={textareaClassName}
                  value={form.blockers}
                  onChange={(e) => setForm((prev) => ({ ...prev, blockers: e.target.value }))}
                  placeholder="Describe supply bottlenecks, design holds, sub-contractor failures, strikes..."
                />
              </div>
            </div>

            {/* Column 3: Logistics (Workforce & Materials) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-soft pb-1.5">3. Logistics & Resources</h3>
              
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Total Labor Count</label>
                <Input
                  type="number"
                  min="0"
                  value={form.laborCount}
                  onChange={(e) => setForm((prev) => ({ ...prev, laborCount: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary font-bold">Skilled</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.laborSkilled}
                    onChange={(e) => setForm((prev) => ({ ...prev, laborSkilled: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary font-bold">Unskilled</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.laborUnskilled}
                    onChange={(e) => setForm((prev) => ({ ...prev, laborUnskilled: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary font-bold">Supervisor</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.laborSupervisors}
                    onChange={(e) => setForm((prev) => ({ ...prev, laborSupervisors: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary font-bold">Cement Used (bags)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.materialCement}
                    onChange={(e) => setForm((prev) => ({ ...prev, materialCement: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary font-bold">Steel Deployed (tons)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.materialSteel}
                    onChange={(e) => setForm((prev) => ({ ...prev, materialSteel: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Custom Material Usage Log</label>
                <textarea
                  className={textareaClassName}
                  value={form.materialUsageText}
                  onChange={(e) => setForm((prev) => ({ ...prev, materialUsageText: e.target.value }))}
                  placeholder="Cement: 45 bags, Steel: 2 tons, Brickwork mortar: 5 cum..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border-soft">
            <Button type="button" variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
              className="bg-accent-primary hover:bg-accent-primary-hover shadow-active-nav text-white"
            >
              <ClipboardPlus className="h-4 w-4" />
              Publish Field Update
            </Button>
          </div>
        </form>
      </Drawer>
    </section>
  );
}
