"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  UserX,
  PlusCircle,
  Eye,
  CheckCircle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { LoadingStateCard, ErrorStateCard } from "@/components/erp/live-state";
import { SectionHeader } from "@/components/erp/page-primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";
import { toast } from "@/components/ui/toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

type Team = {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  supervisorId: string;
  supervisorName: string;
  headcount: number;
  attendance: string;
  attendanceRate: number;
  coverageRate: number;
  productivityScore: number;
  healthScore: number;
  riskLevel: "Healthy" | "Watch" | "Critical";
  attendanceLabel: "Excellent" | "Good" | "Poor";
  openPositions: number;
  activeTasksCount: number;
  status: "Active" | "Inactive";
  attendanceTrend30Days: number[];
};

type TeamsResponse = {
  teams: Team[];
  meta: {
    total: number;
    active: number;
    atRisk: number;
    understaffed: number;
  };
};

type ProjectsResponse = {
  properties: Array<{
    id: string;
    name: string;
    code: string;
  }>;
};

type EmployeesResponse = {
  employees: Array<{
    id: string;
    name: string;
    designation: string;
    department: string;
    status: string;
  }>;
};

// Colors for Pie/Cell charts
const PIE_COLORS = ["#2563eb", "#06b6d4", "#f59e0b", "#22c55e", "#a855f7"];

export function TeamsWorkspace() {
  const router = useRouter();
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  // Drawers & UI controls
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof Team>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Add team form drawer
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    supervisorId: "",
    status: "Active" as "Active" | "Inactive",
    openPositions: 0,
    activeTasksCount: 3,
    productivityScore: 85,
    healthScore: 90,
  });

  // Queries
  const teamsQuery = useQuery({
    queryKey: ["erp-teams", role],
    queryFn: async () => (await apiRequest<TeamsResponse>("/api/workforce/teams", { role })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-projects-catalog", role],
    queryFn: async () => (await apiRequest<ProjectsResponse>("/api/properties/summary", { role })).data,
  });

  const employeesQuery = useQuery({
    queryKey: ["erp-employees-catalog", role],
    queryFn: async () => (await apiRequest<EmployeesResponse>("/api/workforce/employees", { role })).data,
  });

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: async (body: typeof formData) => {
      return await apiRequest<Team>("/api/workforce/teams", {
        role,
        method: "POST",
        body,
      });
    },
    onSuccess: () => {
      toast.success("Team created successfully");
      queryClient.invalidateQueries({ queryKey: ["erp-teams"] });
      setIsAddDrawerOpen(false);
      setFormData({
        name: "",
        projectId: "",
        supervisorId: "",
        status: "Active",
        openPositions: 0,
        activeTasksCount: 3,
        productivityScore: 85,
        healthScore: 90,
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create team");
    },
  });

  // Filter and Sort teams
  const filteredTeams = useMemo(() => {
    if (!teamsQuery.data?.teams) return [];
    return teamsQuery.data.teams
      .filter((team) => {
        const matchesSearch =
          team.name.toLowerCase().includes(search.toLowerCase()) ||
          team.projectName.toLowerCase().includes(search.toLowerCase()) ||
          team.supervisorName.toLowerCase().includes(search.toLowerCase());
        
        const matchesProject = projectFilter === "all" || team.projectId === projectFilter;
        const matchesRisk = riskFilter === "all" || team.riskLevel === riskFilter;
        const matchesStatus = statusFilter === "all" || team.status === statusFilter;

        return matchesSearch && matchesProject && matchesRisk && matchesStatus;
      })
      .sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
  }, [teamsQuery.data, search, projectFilter, riskFilter, statusFilter, sortField, sortOrder]);

  if (teamsQuery.isLoading || projectsQuery.isLoading || employeesQuery.isLoading) {
    return <LoadingStateCard title="Loading Workforce Command Center..." />;
  }

  if (teamsQuery.error || !teamsQuery.data) {
    return <ErrorStateCard message="Failed to load workforce teams data." />;
  }

  const { teams, meta } = teamsQuery.data;
  const projects = projectsQuery.data?.properties || [];
  const employees = employeesQuery.data?.employees || [];

  // Pagination
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const paginatedTeams = filteredTeams.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSort = (field: keyof Team) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Operational highlights calculation (Data Driven)
  const highlights = {
    topPerforming: teams.reduce((max, t) => (t.productivityScore > max.productivityScore ? t : max), teams[0] || {}),
    mostImproved: teams.reduce((max, t) => (t.healthScore > max.healthScore ? t : max), teams[0] || {}),
    highestRisk: teams.find((t) => t.riskLevel === "Critical") || teams.find((t) => t.riskLevel === "Watch") || teams[0] || {},
    largestWorkforce: teams.reduce((max, t) => (t.headcount > max.headcount ? t : max), teams[0] || {}),
  };

  // Overall Workforce Health Score averages
  const avgHealthScore = Math.round(teams.reduce((sum, t) => sum + t.healthScore, 0) / Math.max(1, teams.length));
  const avgAttendanceHealth = Math.round(teams.reduce((sum, t) => sum + t.attendanceRate, 0) / Math.max(1, teams.length));
  const avgCoverageHealth = Math.round(teams.reduce((sum, t) => sum + t.coverageRate, 0) / Math.max(1, teams.length));
  const avgProductivityHealth = Math.round(teams.reduce((sum, t) => sum + t.productivityScore, 0) / Math.max(1, teams.length));
  const avgStability = 94; // mockup standard stability index

  // Chart Data: 1. Team Productivity Ranking
  const productivityChartData = teams
    .slice(0, 8)
    .map((t) => ({ name: t.name, score: t.productivityScore }))
    .sort((a, b) => b.score - a.score);

  // Chart Data: 2. Attendance Trend (aggregating sparklines of all teams)
  const attendanceTrendData = Array.from({ length: 30 }, (_, index) => {
    let sum = 0;
    teams.forEach((t) => {
      sum += t.attendanceTrend30Days[index] || 90;
    });
    return {
      day: `Day ${index + 1}`,
      rate: Math.round(sum / Math.max(1, teams.length)),
    };
  });

  // Chart Data: 3. Workforce Distribution by Role Category
  const roleDistributionData = [
    { name: "Site Engineers", value: Math.round(teams.reduce((sum, t) => sum + t.headcount * 0.15, 0)) },
    { name: "Safety Officers", value: Math.round(teams.reduce((sum, t) => sum + t.headcount * 0.08, 0)) },
    { name: "Skilled Artisans", value: Math.round(teams.reduce((sum, t) => sum + t.headcount * 0.35, 0)) },
    { name: "General Labor", value: Math.round(teams.reduce((sum, t) => sum + t.headcount * 0.32, 0)) },
    { name: "Operators", value: Math.round(teams.reduce((sum, t) => sum + t.headcount * 0.1, 0)) },
  ];

  // Chart Data: 4. Project Workforce Allocation
  const projectAllocationData = Array.from(new Set(teams.map((t) => t.projectName))).map((projName) => {
    const projTeams = teams.filter((t) => t.projectName === projName);
    return {
      projectName: projName.split(" ").slice(0, 2).join(" "), // Compact name
      workforce: projTeams.reduce((sum, t) => sum + t.headcount, 0),
      open: projTeams.reduce((sum, t) => sum + t.openPositions, 0),
    };
  });

  // Risk Attention Cards Calculation
  const attendanceRisks = teams.filter((t) => t.attendanceRate < 80).slice(0, 3);
  const coverageRisks = teams.filter((t) => t.coverageRate < 85).slice(0, 3);
  const projectStaffingRisks = projectAllocationData.filter((p) => p.open > 2).slice(0, 3);

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.projectId || !formData.supervisorId) {
      toast.error("Please fill all required fields");
      return;
    }
    createTeamMutation.mutate(formData);
  };

  const exportCsv = () => {
    toast.info("Exporting teams list spreadsheet...");
    const headers = "ID,Name,Project,Supervisor,Headcount,Attendance,Coverage,Productivity,Risk,Status\n";
    const rows = teams
      .map(
        (t) =>
          `"${t.id}","${t.name}","${t.projectName}","${t.supervisorName}",${t.headcount},"${t.attendanceRate}%","${t.coverageRate}%",${t.productivityScore},"${t.riskLevel}","${t.status}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `Workforce_Teams_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    a.click();
  };

  return (
    <section className="space-y-6 animate-fadeIn pb-12">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-soft pb-5">
        <div className="space-y-2">
          <h1 className="text-page-title font-secondary text-text-primary">Workforce Teams Command Center</h1>
          <p className="max-w-3xl text-body text-text-secondary">
            Operational visibility into workforce allocation, attendance performance, role coverage, and project staffing health.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsAddDrawerOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Team
          </Button>
          <Button variant="outline" onClick={() => router.push("/people/workforce-insights")} className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Workforce Report
          </Button>
          <Button variant="outline" onClick={exportCsv} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* EXECUTIVE KPI STRIP (8 PREMIUM KPI CARDS WITH SPARKLINES) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Card className="surface-card flex flex-col justify-between p-5 hover:shadow-soft transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Active Teams</span>
            <Badge tone="success" className="flex items-center gap-1 font-bold text-xs">
              <Plus className="h-3 w-3" /> 2 New
            </Badge>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-kpi-value text-text-primary">{meta.active}</h3>
            <div className="w-24 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:10},{v:12},{v:13},{v:12},{v:14},{v:14}]}>
                  <Area type="monotone" dataKey="v" stroke="#2563eb" fill="rgba(37,99,235,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-label text-text-muted mt-2">Active named deployments across sites</p>
        </Card>

        {/* KPI 2 */}
        <Card className="surface-card flex flex-col justify-between p-5 hover:shadow-soft transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Assigned Headcount</span>
            <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-4 w-4" /> +18
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-kpi-value text-text-primary">
              {teams.reduce((sum, t) => sum + t.headcount, 0)}
            </h3>
            <div className="w-24 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:480},{v:495},{v:505},{v:510},{v:522}]}>
                  <Area type="monotone" dataKey="v" stroke="#22c55e" fill="rgba(34,197,94,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-label text-text-muted mt-2">Active internal laborers & specialists</p>
        </Card>

        {/* KPI 3 */}
        <Card className="surface-card flex flex-col justify-between p-5 hover:shadow-soft transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Attendance Today</span>
            <span className="text-amber-500 text-xs font-bold flex items-center gap-0.5">
              <ArrowDownRight className="h-4 w-4" /> -1.2%
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-kpi-value text-text-primary">{avgAttendanceHealth}%</h3>
            <div className="w-24 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:95},{v:96},{v:94},{v:95},{v:93},{v:94.2}]}>
                  <Area type="monotone" dataKey="v" stroke="#f59e0b" fill="rgba(245,158,11,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-label text-text-muted mt-2">492 present today vs 522 rostered</p>
        </Card>

        {/* KPI 4 */}
        <Card className="surface-card flex flex-col justify-between p-5 hover:shadow-soft transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Role Coverage Rate</span>
            <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-4 w-4" /> +0.5%
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-kpi-value text-text-primary">{avgCoverageHealth}%</h3>
            <div className="w-24 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:88},{v:89},{v:90},{v:91},{v:91.8}]}>
                  <Area type="monotone" dataKey="v" stroke="#06b6d4" fill="rgba(6,182,212,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-label text-text-muted mt-2">Critical structural roles covered</p>
        </Card>

        <Card className="surface-card flex flex-col justify-between p-5 hover:shadow-soft transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Teams At Risk</span>
            <Badge tone="error" className="font-bold flex items-center gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" /> {meta.atRisk} Watch
            </Badge>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-kpi-value text-text-error">{meta.atRisk}</h3>
            <div className="w-24 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:4},{v:3},{v:4},{v:3},{v:3}]}>
                  <Area type="monotone" dataKey="v" stroke="#ef4444" fill="rgba(239,68,68,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-label text-text-muted mt-2">Below productivity/health score thresholds</p>
        </Card>

        {/* KPI 6 */}
        <Card className="surface-card flex flex-col justify-between p-5 hover:shadow-soft transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Open Positions</span>
            <span className="text-amber-500 text-xs font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-4 w-4" /> +4 Gaps
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-kpi-value text-text-primary">{meta.understaffed}</h3>
            <div className="w-24 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:8},{v:9},{v:10},{v:12}]}>
                  <Area type="monotone" dataKey="v" stroke="#e9730e" fill="rgba(233,115,14,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-label text-text-muted mt-2">Vacant target roster positions</p>
        </Card>

        {/* KPI 7 */}
        <Card className="surface-card flex flex-col justify-between p-5 hover:shadow-soft transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Avg Team Productivity</span>
            <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-4 w-4" /> +2.1%
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-kpi-value text-text-primary">{avgProductivityHealth}%</h3>
            <div className="w-24 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:84},{v:85},{v:86},{v:87},{v:88.4}]}>
                  <Area type="monotone" dataKey="v" stroke="#10b981" fill="rgba(16,185,129,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-label text-text-muted mt-2">Aggregate schedule milestones hit</p>
        </Card>

        {/* KPI 8 */}
        <Card className="surface-card flex flex-col justify-between p-5 hover:shadow-soft transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-kpi-label text-text-kpi-label uppercase tracking-wider font-semibold">Supervisor Compliance</span>
            <Badge tone="info" className="font-bold flex items-center gap-1 text-xs">
              96% Goal
            </Badge>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <h3 className="text-kpi-value text-text-primary">96.5%</h3>
            <div className="w-24 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:95},{v:96},{v:95},{v:97},{v:96.5}]}>
                  <Area type="monotone" dataKey="v" stroke="#0ea5e9" fill="rgba(14,165,233,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-label text-text-muted mt-2">Daily report submission compliance</p>
        </Card>
      </div>

      {/* WORKFORCE HEALTH OVERVIEW HERO SECTION */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: HEALTH SCORE CIRCULAR PROGRESS */}
        <Card className="surface-card lg:col-span-1 p-6 flex flex-col justify-between">
          <div>
            <CardTitle className="text-section-title text-text-primary mb-1">Workforce Health Score</CardTitle>
            <p className="text-label text-text-muted mb-4">Core composite of operational safety, attendance, and output efficiency.</p>
          </div>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center justify-center w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="var(--color-hover)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="var(--color-success)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - avgHealthScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-4xl font-extrabold text-text-primary">{avgHealthScore}</span>
                <p className="text-label text-text-success font-semibold mt-1">Excellent</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t border-border-soft">
            <div className="flex justify-between items-center text-body">
              <span className="text-text-secondary">Attendance Health</span>
              <span className="font-semibold text-text-primary">{avgAttendanceHealth}%</span>
            </div>
            <div className="h-1.5 w-full bg-hover rounded-full">
              <div className="h-full bg-accent-primary rounded-full" style={{ width: `${avgAttendanceHealth}%` }} />
            </div>

            <div className="flex justify-between items-center text-body">
              <span className="text-text-secondary">Coverage Health</span>
              <span className="font-semibold text-text-primary">{avgCoverageHealth}%</span>
            </div>
            <div className="h-1.5 w-full bg-hover rounded-full">
              <div className="h-full bg-accent-secondary rounded-full" style={{ width: `${avgCoverageHealth}%` }} />
            </div>

            <div className="flex justify-between items-center text-body">
              <span className="text-text-secondary">Productivity Health</span>
              <span className="font-semibold text-text-primary">{avgProductivityHealth}%</span>
            </div>
            <div className="h-1.5 w-full bg-hover rounded-full">
              <div className="h-full bg-success rounded-full" style={{ width: `${avgProductivityHealth}%` }} />
            </div>

            <div className="flex justify-between items-center text-body">
              <span className="text-text-secondary">Team Stability</span>
              <span className="font-semibold text-text-primary">{avgStability}%</span>
            </div>
            <div className="h-1.5 w-full bg-hover rounded-full">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${avgStability}%` }} />
            </div>
          </div>
        </Card>

        {/* RIGHT: OPERATIONAL HIGHLIGHTS */}
        <Card className="surface-card lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <CardTitle className="text-section-title text-text-primary mb-1">Operational Highlights</CardTitle>
            <p className="text-label text-text-muted mb-6">Automated highlights scanning live operational logs and metrics.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary flex items-start gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-[var(--radius-button)]">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-label text-text-muted uppercase tracking-wider font-semibold">Top Performing Team</p>
                <h4 className="font-secondary text-card-title text-text-primary">{highlights.topPerforming.name}</h4>
                <p className="text-body text-emerald-600 font-semibold">{highlights.topPerforming.productivityScore}% Productivity Score</p>
              </div>
            </div>

            <div className="p-4 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary flex items-start gap-4">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-[var(--radius-button)]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-label text-text-muted uppercase tracking-wider font-semibold">Most Stable Team</p>
                <h4 className="font-secondary text-card-title text-text-primary">{highlights.mostImproved.name}</h4>
                <p className="text-body text-blue-600 font-semibold">{highlights.mostImproved.healthScore}% Stability Composite</p>
              </div>
            </div>

            <div className="p-4 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-[var(--radius-button)]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-label text-text-muted uppercase tracking-wider font-semibold">Highest Staffing Risk</p>
                <h4 className="font-secondary text-card-title text-text-primary">{highlights.highestRisk.name}</h4>
                <p className="text-body text-rose-600 font-semibold">{highlights.highestRisk.attendanceRate}% Attendance Rate</p>
              </div>
            </div>

            <div className="p-4 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary flex items-start gap-4">
              <div className="p-3 bg-cyan-100 text-cyan-700 rounded-[var(--radius-button)]">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-label text-text-muted uppercase tracking-wider font-semibold">Largest Workforce Pod</p>
                <h4 className="font-secondary text-card-title text-text-primary">{highlights.largestWorkforce.name}</h4>
                <p className="text-body text-cyan-700 font-semibold">{highlights.largestWorkforce.headcount} Workers Onboard</p>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 rounded-[var(--radius-input)] bg-emerald-50 border border-emerald-100 flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <p className="text-body text-emerald-800 font-medium">
              Overall workforce compliance checks are currently passing at <strong>98.2%</strong>. No major labor union escalations logged today.
            </p>
          </div>
        </Card>
      </div>

      {/* WORKFORCE RISK & ATTENTION CENTER */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CARD 1: ATTENDANCE RISK */}
        <Card className="surface-card p-6 border-l-4 border-l-rose-500 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <UserX className="h-5 w-5" />
                <h3 className="font-semibold text-section-title">Attendance Risk</h3>
              </div>
              <Badge tone="error" className="text-xs">Critical Alert</Badge>
            </div>
            <p className="text-body text-text-secondary mb-4">Teams currently operating below the 80% daily attendance threshold.</p>
            <div className="space-y-3">
              {attendanceRisks.length > 0 ? (
                attendanceRisks.map((t) => (
                  <div key={t.id} className="border-b border-border-soft pb-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-text-primary text-body">{t.name}</span>
                      <span className="text-rose-600 font-bold text-body">{t.attendanceRate}%</span>
                    </div>
                    <p className="text-label text-text-muted">Project: {t.projectName}</p>
                    <p className="text-label text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block font-semibold">
                      Action: Contact Supervisor {t.supervisorName} immediately
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-body text-text-muted italic">No immediate attendance risks found today.</p>
              )}
            </div>
          </div>
        </Card>

        {/* CARD 2: COVERAGE RISK */}
        <Card className="surface-card p-6 border-l-4 border-l-amber-500 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-amber-700">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="font-semibold text-section-title">Coverage Risk</h3>
              </div>
              <Badge tone="warning" className="text-xs">Warning Alert</Badge>
            </div>
            <p className="text-body text-text-secondary mb-4">Teams missing critical designated safety, engineering, or crane roles.</p>
            <div className="space-y-3">
              {coverageRisks.length > 0 ? (
                coverageRisks.map((t) => (
                  <div key={t.id} className="border-b border-border-soft pb-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-text-primary text-body">{t.name}</span>
                      <span className="text-amber-600 font-bold text-body">{t.coverageRate}% Role Cover</span>
                    </div>
                    <p className="text-label text-text-muted">Supervisor: {t.supervisorName}</p>
                    <p className="text-label text-accent-primary bg-blue-50 px-2 py-0.5 rounded inline-block font-semibold">
                      Action: Transfer 1 Operator from core roster
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-body text-text-muted italic">All active pods meet critical role requirements.</p>
              )}
            </div>
          </div>
        </Card>

        {/* CARD 3: STAFFING RISK */}
        <Card className="surface-card p-6 border-l-4 border-l-blue-500 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-accent-primary">
                <Briefcase className="h-5 w-5" />
                <h3 className="font-semibold text-section-title">Project Staffing Risk</h3>
              </div>
              <Badge tone="info" className="text-xs">Roster Gap</Badge>
            </div>
            <p className="text-body text-text-secondary mb-4">Sites with large open headcount targets relative to active progress.</p>
            <div className="space-y-3">
              {projectStaffingRisks.length > 0 ? (
                projectStaffingRisks.map((p, index) => (
                  <div key={index} className="border-b border-border-soft pb-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-text-primary text-body">{p.projectName}</span>
                      <span className="text-accent-primary font-bold text-body">{p.open} Open Roles</span>
                    </div>
                    <p className="text-label text-text-muted">Active Onsite Workforce: {p.workforce} workers</p>
                    <p className="text-label text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block font-semibold">
                      Action: Mobilize local subcontract labor
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-body text-text-muted italic">All projects fully staffed to targets.</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* TEAM PERFORMANCE ANALYTICS */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* CHART 1: TEAM PRODUCTIVITY LEADERBOARD */}
        <Card className="surface-card p-6">
          <CardHeader className="px-0 pt-0 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-section-title text-text-primary">Team Productivity Ranking</CardTitle>
              <p className="text-label text-text-muted">Leaderboard of active pods by percentage target output achieved.</p>
            </div>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hover)" />
                <XAxis type="number" domain={[0, 100]} stroke="var(--color-text-muted)" />
                <YAxis dataKey="name" type="category" width={110} stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" fill="var(--color-accent-primary)" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* CHART 2: 30-DAY ATTENDANCE TREND */}
        <Card className="surface-card p-6">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-section-title text-text-primary">Attendance Trend</CardTitle>
            <p className="text-label text-text-muted">30-day aggregate worker attendance rate across all sites.</p>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrendData}>
                <defs>
                  <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hover)" />
                <XAxis dataKey="day" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--color-text-muted)" domain={[60, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="rate" stroke="var(--color-success)" fillOpacity={1} fill="url(#attendanceColor)" strokeWidth={2.5} name="Attendance %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* CHART 3: WORKFORCE ROLE DISTRIBUTION */}
        <Card className="surface-card p-6">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-section-title text-text-primary">Workforce Distribution</CardTitle>
            <p className="text-label text-text-muted">Breakdown of operational staff by functional trade designations.</p>
          </CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-around h-72">
            <div className="w-56 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleDistributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {roleDistributionData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-body text-text-secondary">{item.name}</span>
                  <span className="font-semibold text-text-primary">({item.value} workers)</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* CHART 4: PROJECT WORKFORCE ALLOCATION */}
        <Card className="surface-card p-6">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-section-title text-text-primary">Project Workforce Allocation</CardTitle>
            <p className="text-label text-text-muted">Total active workers compared with open targets across projects.</p>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectAllocationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hover)" />
                <XAxis dataKey="projectName" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip />
                <Legend />
                <Bar dataKey="workforce" fill="var(--color-accent-primary)" name="Active Headcount" radius={[4, 4, 0, 0]} />
                <Bar dataKey="open" fill="var(--color-warning)" name="Open Roster Gaps" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* TEAM DIRECTORY (ENTERPRISE OPERATIONAL TABLE) */}
      <Card className="surface-card overflow-hidden">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-section-title text-text-primary">Team Directory</CardTitle>
            <p className="text-label text-text-muted">Operational list of active workforce pods, reporting, and output health.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type="text"
                placeholder="Search teams, projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-surface border-border-soft text-body shadow-soft"
              />
            </div>
            
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-1.5 rounded-[var(--radius-button)] border border-border-soft bg-surface text-body shadow-soft focus:outline-none"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-1.5 rounded-[var(--radius-button)] border border-border-soft bg-surface text-body shadow-soft focus:outline-none"
            >
              <option value="all">All Risks</option>
              <option value="Healthy">Healthy</option>
              <option value="Watch">Watch</option>
              <option value="Critical">Critical</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-[var(--radius-button)] border border-border-soft bg-surface text-body shadow-soft focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-table text-left border-collapse">
              <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft">
                <tr className="h-12">
                  <th onClick={() => handleSort("name")} className="px-6 cursor-pointer hover:bg-hover hover:text-text-primary select-none">
                    Team {sortField === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("projectName")} className="px-6 cursor-pointer hover:bg-hover hover:text-text-primary select-none">
                    Project {sortField === "projectName" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("supervisorName")} className="px-6 cursor-pointer hover:bg-hover hover:text-text-primary select-none">
                    Supervisor {sortField === "supervisorName" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("headcount")} className="px-6 text-center cursor-pointer hover:bg-hover hover:text-text-primary select-none">
                    Headcount {sortField === "headcount" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("attendanceRate")} className="px-6 text-center cursor-pointer hover:bg-hover hover:text-text-primary select-none">
                    Attendance {sortField === "attendanceRate" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("coverageRate")} className="px-6 text-center cursor-pointer hover:bg-hover hover:text-text-primary select-none">
                    Role Coverage {sortField === "coverageRate" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("productivityScore")} className="px-6 text-center cursor-pointer hover:bg-hover hover:text-text-primary select-none">
                    Productivity {sortField === "productivityScore" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("riskLevel")} className="px-6 text-center cursor-pointer hover:bg-hover hover:text-text-primary select-none">
                    Risk Level {sortField === "riskLevel" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("status")} className="px-6 text-center cursor-pointer hover:bg-hover hover:text-text-primary select-none">
                    Status {sortField === "status" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTeams.length > 0 ? (
                  paginatedTeams.map((team) => (
                    <tr
                      key={team.id}
                      onClick={() => router.push(`/people/teams/${team.id}`)}
                      className="h-16 border-b border-border-soft hover:bg-hover/40 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="px-6 font-semibold text-text-primary">{team.name}</td>
                      <td className="px-6 text-text-secondary">{team.projectName}</td>
                      <td className="px-6 text-text-secondary">{team.supervisorName}</td>
                      <td className="px-6 text-center font-medium text-text-primary">{team.headcount}</td>
                      <td className="px-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold text-text-primary">{team.attendance}</span>
                          <Badge
                            tone={
                              team.attendanceLabel === "Excellent"
                                ? "success"
                                : team.attendanceLabel === "Good"
                                ? "warning"
                                : "error"
                            }
                            className="text-[10px] scale-95"
                          >
                            {team.attendanceLabel}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 text-center font-medium text-text-primary">{team.coverageRate}%</td>
                      <td className="px-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold text-text-primary">{team.productivityScore}%</span>
                          <div className="h-1 w-16 bg-hover rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-primary"
                              style={{ width: `${team.productivityScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 text-center">
                        <Badge
                          tone={
                            team.riskLevel === "Healthy"
                              ? "success"
                              : team.riskLevel === "Watch"
                              ? "warning"
                              : "error"
                          }
                          className="font-bold rounded-full px-3 text-xs"
                        >
                          {team.riskLevel}
                        </Badge>
                      </td>
                      <td className="px-6 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          team.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700"
                        }`}>
                          {team.status}
                        </span>
                      </td>
                      <td className="px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          onClick={() => router.push(`/people/teams/${team.id}`)}
                          className="text-accent-primary hover:text-accent-primary-hover p-2 h-auto"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="h-32 text-center text-text-muted italic">
                      No teams matched the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border-soft px-6 py-4 bg-surface-secondary">
              <p className="text-body text-text-secondary">
                Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({filteredTeams.length} teams)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD TEAM DRAWER */}
      <Drawer open={isAddDrawerOpen} onClose={() => setIsAddDrawerOpen(false)} title="Create Named Workforce Team">
        <form onSubmit={handleCreateTeam} className="space-y-4 p-1">
          <div className="space-y-1.5">
            <label className="text-label text-text-secondary font-medium">Team Name *</label>
            <Input
              type="text"
              required
              placeholder="e.g. Concrete Execution Team A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-surface border-border-soft"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Assign Project *</label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus:outline-none"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Team Supervisor *</label>
              <select
                required
                value={formData.supervisorId}
                onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                className="h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus:outline-none"
              >
                <option value="">Select Supervisor</option>
                {employees.slice(0, 30).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Open Roster Gaps</label>
              <Input
                type="number"
                min={0}
                max={15}
                value={formData.openPositions}
                onChange={(e) => setFormData({ ...formData, openPositions: Number(e.target.value) })}
                className="bg-surface border-border-soft"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
                className="h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border-soft">
            <Button type="button" variant="outline" onClick={() => setIsAddDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTeamMutation.isPending} className="btn-primary">
              {createTeamMutation.isPending ? "Creating..." : "Create Team"}
            </Button>
          </div>
        </form>
      </Drawer>
    </section>
  );
}
