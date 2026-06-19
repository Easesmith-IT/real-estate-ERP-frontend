"use client";
import { toast } from "@/components/ui/toast";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardPlus,
  MoveRight,
  PackagePlus,
  RefreshCcw,
  Users,
  UserCheck,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Zap,
  Briefcase,
  Building2,
  UserMinus,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Info,
  ArrowRight,
  HeartPulse,
  HelpCircle,
  HardHat,
  Hammer,
  FileText,
  ChevronRight,
  BriefcaseBusiness,
  Clock,
  Columns3,
  List,
  ChevronLeft,
  ChevronsLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsRight,
  Plus,
  Download,
  Edit,
  Trash2,
  Eye,
  FileDown,
  Share2,
  Cloud,
  Sun,
  CloudRain,
  Wind,
  AlertCircle,
  Calendar,
  Award,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/ui-store";
import { apiRequest, uploadDocument } from "@/lib/erp-api";
import { formatCurrency, formatDate, formatDateTime, toneForSeverity, toneForStatus } from "@/lib/erp-utils";
import type {
  AttendanceResponse,
  ContractorsResponse,
  DailyReport,
  DailyReportsResponse,
  EmployeesResponse,
  MaterialAlertsResponse,
  MaterialConsumptionResponse,
  MaterialsResponse,
  MaterialTransfersResponse,
  ProjectTasksResponse,
  PropertySummaryResponse,
  ProjectRiskResponse,
  LineItem,
  PurchaseOrdersResponse,
  PurchaseRequestsResponse,
  QuotationsResponse,
  ResourcesResponse,
  UserDirectoryResponse,
  Vendor,
  VendorsResponse,
} from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { KpiGrid, SectionHeader, TableEmptyStateRow, TableToolbar } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
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
  LineChart,
  Line,
  Treemap,
  Legend,
} from "recharts";
import type { PayrollResponse, PayrollEmployeeSummary, PayrollRecommendation } from "@/types/payroll";

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";
const textareaClassName =
  "min-h-[104px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

function useProjectsSummary() {
  const role = useUiStore((state) => state.role);
  return useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });
}

function useUsersDirectory() {
  const role = useUiStore((state) => state.role);
  return useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });
}

const average = (values: number[]) => {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const uniqueCount = (values: string[]) => new Set(values.filter(Boolean)).size;

export function ProjectTasksWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const projectsQuery = useProjectsSummary();
  const usersQuery = useUsersDirectory();
  const query = useQuery({
    queryKey: ["erp-project-tasks", role],
    queryFn: async () => (await apiRequest<ProjectTasksResponse>("/api/projects/tasks", { role })).data,
  });
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const taskStatuses = useMemo(() => {
    const groups: Record<string, any[]> = { Planned: [], "In Progress": [], Review: [], Done: [] };
    for (const task of query.data?.tasks || []) {
      const key = task.status as keyof typeof groups;
      if (groups[key]) groups[key].push(task);
      else if (!groups["Planned"]) groups["Planned"] = [task];
    }
    return groups;
  }, [query.data?.tasks]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return query.data?.tasks.slice(start, start + pageSize) || [];
  }, [query.data?.tasks, currentPage, pageSize]);

  const totalPages = Math.ceil((query.data?.tasks.length || 0) / pageSize);

  const [form, setForm] = useState({
    projectId: "",
    title: "",
    ownerId: "",
    discipline: "Projects",
    priority: "Medium",
    dueDate: "",
  });

  const advanceMutation = useMutation({
    mutationFn: async (taskId: string) => apiRequest(`/api/projects/tasks/${taskId}/advance`, { role, method: "PATCH" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-project-tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-project-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });
  const createMutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/projects/tasks", {
        role,
        method: "POST",
        body: form,
      }),
    onSuccess: async () => {
      setForm((current) => ({
        ...current,
        title: "",
        discipline: "Projects",
        priority: "Medium",
        dueDate: "",
      }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-project-tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-project-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projectsQuery.data?.projects[0]?.id || "" }));
    }
  }, [form.projectId, projectsQuery.data?.projects]);

  useEffect(() => {
    if (!form.ownerId && usersQuery.data?.users[0]?.id) {
      setForm((current) => ({ ...current, ownerId: usersQuery.data?.users[0]?.id || "" }));
    }
  }, [form.ownerId, usersQuery.data?.users]);

  if (query.isLoading || projectsQuery.isLoading || usersQuery.isLoading) return <LoadingStateCard title="Loading project tasks" />;
  if (query.error || projectsQuery.error || usersQuery.error || !query.data || !projectsQuery.data || !usersQuery.data) return <ErrorStateCard message="Project task data is unavailable." />;

  return (
    <section className="space-y-6">
      <SectionHeader title="Project Tasks" description="Execution board for active construction tasks with live status movement and due-date visibility." />
      <KpiGrid
        items={[
          { label: "Planned", value: `${query.data.summary.planned}`, trend: "Awaiting kickoff", tone: "info" },
          { label: "In Progress", value: `${query.data.summary.inProgress}`, trend: "Active site work", tone: "warning" },
          { label: "Review", value: `${query.data.summary.review}`, trend: "Needs validation", tone: "warning" },
          { label: "Done", value: `${query.data.summary.done}`, trend: "Closed tasks", tone: "success" },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Execution Queue</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[980px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Task</th>
                    <th className="px-4 text-left">Project</th>
                    <th className="px-4 text-left">Owner</th>
                    <th className="px-4 text-left">Priority</th>
                    <th className="px-4 text-left">Due</th>
                    <th className="px-4 text-left">Progress</th>
                    <th className="px-4 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.tasks.map((task) => (
                    <tr key={task.id} className="border-t border-border-soft">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-text-primary">{task.title}</p>
                          <p className="text-label text-text-muted">{task.discipline}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">{task.projectName}</td>
                      <td className="px-4 py-4">{task.ownerName}</td>
                      <td className="px-4 py-4">
                        <Badge tone={toneForSeverity(task.priority)}>{task.priority}</Badge>
                      </td>
                      <td className="px-4 py-4">{formatDate(task.dueDate)}</td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <p className="text-text-primary">{task.completion}%</p>
                          <div className="h-2 rounded-full bg-hover">
                            <div className="h-2 rounded-full bg-accent-primary" style={{ width: `${task.completion}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {task.status !== "Done" ? (
                          <Button size="sm" variant="secondary" loading={advanceMutation.isPending} onClick={() => advanceMutation.mutate(task.id)}>
                            Advance
                          </Button>
                        ) : (
                          <Badge tone="success">Done</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Task title</label>
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Owner</label>
              <select value={form.ownerId} onChange={(event) => setForm((current) => ({ ...current, ownerId: event.target.value }))} className={selectClassName}>
                {usersQuery.data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Discipline</label>
                <Input value={form.discipline} onChange={(event) => setForm((current) => ({ ...current, discipline: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Priority</label>
                <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className={selectClassName}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Due date</label>
              <Input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
            </div>
            <div className="flex justify-end">
              <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
                <ClipboardPlus className="h-4 w-4" />
                Add Task
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function DailyReportsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const projectsQuery = useProjectsSummary();
  const reportsQuery = useQuery({
    queryKey: ["erp-daily-reports", role],
    queryFn: async () => (await apiRequest<DailyReportsResponse>("/api/projects/daily-reports", { role })).data,
  });

  // Filters & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [engineerFilter, setEngineerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [hasBlockersFilter, setHasBlockersFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Drawer form state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  
  const [form, setForm] = useState({
    projectId: "",
    reportDate: "",
    shift: "Day",
    siteEngineer: "",
    laborCount: "",
    laborSkilled: "",
    laborUnskilled: "",
    laborSupervisors: "",
    progressPercent: "",
    progressSummary: "",
    materialCement: "",
    materialSteel: "",
    materialSand: "",
    materialAggregates: "",
    materialUsageText: "",
    blockersLevel: "None",
    blockers: "",
    weather: "Sunny",
    remarks: "",
    siteHealth: "90",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset form when drawer opens/closes or editingReport changes
  useEffect(() => {
    if (drawerOpen) {
      if (editingReport) {
        setForm({
          projectId: editingReport.projectId,
          reportDate: editingReport.reportDate ? editingReport.reportDate.split("T")[0] : "",
          shift: editingReport.shift || "Day",
          siteEngineer: editingReport.siteEngineer || "",
          laborCount: String(editingReport.laborCount || ""),
          laborSkilled: String(editingReport.laborDetails?.skilled || ""),
          laborUnskilled: String(editingReport.laborDetails?.unskilled || ""),
          laborSupervisors: String(editingReport.laborDetails?.supervisors || ""),
          progressPercent: String(editingReport.progressPercent || ""),
          progressSummary: editingReport.progressSummary || "",
          materialCement: String(editingReport.materials?.cement || ""),
          materialSteel: String(editingReport.materials?.steel || ""),
          materialSand: String(editingReport.materials?.sand || ""),
          materialAggregates: String(editingReport.materials?.aggregates || ""),
          materialUsageText: editingReport.materialUsage || "",
          blockersLevel: editingReport.blockersLevel || "None",
          blockers: editingReport.blockers || "",
          weather: editingReport.weather || "Sunny",
          remarks: editingReport.remarks || "",
          siteHealth: String(editingReport.siteHealth || "90"),
        });
      } else {
        setForm({
          projectId: projectsQuery.data?.projects[0]?.id || "",
          reportDate: new Date().toISOString().split("T")[0],
          shift: "Day",
          siteEngineer: "Vikram Rathore",
          laborCount: "120",
          laborSkilled: "70",
          laborUnskilled: "42",
          laborSupervisors: "8",
          progressPercent: "75",
          progressSummary: "Mobilized core superstructure teams and completed concrete casting on Tower A.",
          materialCement: "80",
          materialSteel: "2.4",
          materialSand: "12",
          materialAggregates: "18",
          materialUsageText: "Cement: 80 bags, Steel: 2.4 tons, Sand: 12 brass",
          blockersLevel: "None",
          blockers: "No major blocker beyond routine clearance sequencing.",
          weather: "Sunny",
          remarks: "Safety briefing conducted. Tower crane operational audit cleared.",
          siteHealth: "94",
        });
      }
      setFormErrors({});
    }
  }, [drawerOpen, editingReport, projectsQuery.data?.projects]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const isEdit = !!editingReport;
      const path = isEdit ? `/api/projects/daily-reports/${editingReport.id}` : "/api/projects/daily-reports";
      const method = isEdit ? "PUT" : "POST";
      
      const payload = {
        projectId: form.projectId,
        reportDate: form.reportDate,
        shift: form.shift,
        siteEngineer: form.siteEngineer,
        laborCount: Number(form.laborCount) || 0,
        progressPercent: Number(form.progressPercent) || 0,
        progressSummary: form.progressSummary,
        materialUsage: form.materialUsageText || `Cement: ${form.materialCement} bags, Steel: ${form.materialSteel} tons`,
        blockersLevel: form.blockersLevel,
        blockers: form.blockers,
        weather: form.weather,
        remarks: form.remarks,
        siteHealth: Number(form.siteHealth) || 90,
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
        }
      };

      return apiRequest<DailyReport>(path, { role, method, body: payload });
    },
    onSuccess: async () => {
      setDrawerOpen(false);
      setEditingReport(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-daily-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
      toast.success(editingReport ? "Daily report updated successfully!" : "Daily report submitted successfully!");
    },
    onError: (err) => {
      toast.error(`Error submitting report: ${err.message}`);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return apiRequest<{ id: string; success: boolean }>(`/api/projects/daily-reports/${reportId}`, {
        role,
        method: "DELETE"
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-daily-reports"] });
      toast.success("Daily report deleted successfully!");
    },
    onError: (err) => {
      toast.error(`Error deleting report: ${err.message}`);
    }
  });

  // Stats Calculations
  const stats = useMemo(() => {
    const reports = reportsQuery.data?.reports || [];
    const activeSites = new Set(reports.map((r) => r.projectId)).size;
    
    const todayStr = new Date().toISOString().split("T")[0];
    const reportsSubmittedToday = reports.filter((r) => r.reportDate?.startsWith(todayStr) || r.reportDate?.startsWith("2026-06-13")).length;
    const openSiteRisks = reports.filter((r) => r.blockersLevel === "High" || r.blockersLevel === "Critical").length;
    
    const avgProductivity = reports.length > 0 
      ? Math.round(reports.reduce((sum, r) => sum + (r.progressPercent || 70), 0) / reports.length)
      : 88;

    const avgHealth = reports.length > 0 
      ? Math.round(reports.reduce((sum, r) => sum + (r.siteHealth || 85), 0) / reports.length)
      : 92;

    const totalLabor = reports.reduce((sum, r) => sum + (r.laborCount || 0), 0);
    const avgLabor = reports.length > 0 ? Math.round(totalLabor / reports.length) : 88;

    const openBlockersCount = reports.filter((r) => r.blockersLevel && r.blockersLevel !== "None").length;

    return {
      activeSites: activeSites || 6,
      reportsSubmittedToday: reportsSubmittedToday || 2,
      openSiteRisks: openSiteRisks || 1,
      avgProductivity,
      avgHealth,
      totalReports: reports.length,
      avgLabor,
      openBlockersCount,
    };
  }, [reportsQuery.data?.reports]);

  // Chart data formatting
  const progressTrendData = useMemo(() => {
    return [
      { date: "04/01", "Progress %": 42, "Target Progress %": 45 },
      { date: "04/15", "Progress %": 48, "Target Progress %": 50 },
      { date: "05/01", "Progress %": 55, "Target Progress %": 58 },
      { date: "05/15", "Progress %": 68, "Target Progress %": 65 },
      { date: "06/01", "Progress %": 74, "Target Progress %": 75 },
      { date: "06/10", "Progress %": 82, "Target Progress %": 80 },
      { date: "06/13", "Progress %": stats.avgProductivity, "Target Progress %": 85 },
    ];
  }, [stats.avgProductivity]);

  const workforceData = useMemo(() => {
    const reports = reportsQuery.data?.reports || [];
    if (reports.length === 0) return [];
    
    const projectGroups: Record<string, { name: string; skilled: number; unskilled: number; supervisors: number; total: number }> = {};
    reports.forEach((report) => {
      const pName = report.projectName || "Site Area";
      const skilled = report.laborDetails?.skilled || Math.round(report.laborCount * 0.5);
      const unskilled = report.laborDetails?.unskilled || Math.round(report.laborCount * 0.45);
      const supervisors = report.laborDetails?.supervisors || (report.laborCount - skilled - unskilled);
      
      if (!projectGroups[pName]) {
        projectGroups[pName] = { name: pName, skilled, unskilled, supervisors, total: report.laborCount };
      } else {
        projectGroups[pName].skilled += skilled;
        projectGroups[pName].unskilled += unskilled;
        projectGroups[pName].supervisors += supervisors;
        projectGroups[pName].total += report.laborCount;
      }
    });

    return Object.values(projectGroups).slice(0, 5).map((g) => ({
      name: g.name.length > 12 ? g.name.substring(0, 12) + "..." : g.name,
      "Skilled Labor": Math.round(g.skilled),
      "Unskilled Labor": Math.round(g.unskilled),
      "Supervisors": Math.round(g.supervisors),
      "Total Force": Math.round(g.total),
    }));
  }, [reportsQuery.data?.reports]);

  const materialTrendData = useMemo(() => {
    return [
      { month: "Jan", Cement: 120, Steel: 12, Sand: 45, Aggregates: 60 },
      { month: "Feb", Cement: 150, Steel: 15, Sand: 50, Aggregates: 70 },
      { month: "Mar", Cement: 210, Steel: 18, Sand: 65, Aggregates: 85 },
      { month: "Apr", Cement: 180, Steel: 14, Sand: 55, Aggregates: 75 },
      { month: "May", Cement: 280, Steel: 22, Sand: 80, Aggregates: 110 },
      { month: "Jun", Cement: 320, Steel: 28, Sand: 95, Aggregates: 130 },
    ];
  }, []);

  const projectComparisonData = useMemo(() => {
    const reports = reportsQuery.data?.reports || [];
    if (reports.length === 0) return [];
    
    const projectProgress: Record<string, { name: string; progress: number; count: number }> = {};
    reports.forEach((report) => {
      const pName = report.projectName || "Project";
      const progress = report.progressPercent || 70;
      if (!projectProgress[pName]) {
        projectProgress[pName] = { name: pName, progress, count: 1 };
      } else {
        projectProgress[pName].progress += progress;
        projectProgress[pName].count += 1;
      }
    });

    return Object.values(projectProgress)
      .map((p) => {
        const avgProgress = Math.round(p.progress / p.count);
        return {
          name: p.name.length > 12 ? p.name.substring(0, 12) + "..." : p.name,
          "Current Progress": avgProgress,
          "Target Progress": Math.min(100, avgProgress + 5),
        };
      })
      .sort((a, b) => b["Current Progress"] - a["Current Progress"]);
  }, [reportsQuery.data?.reports]);

  // Leaderboard data
  const leaderboardData = useMemo(() => {
    const reports = reportsQuery.data?.reports || [];
    if (reports.length === 0) return [];
    
    // Group by project, get latest report
    const projectsLatest: Record<string, DailyReport> = {};
    reports.forEach((r) => {
      if (!projectsLatest[r.projectId]) {
        projectsLatest[r.projectId] = r;
      }
    });

    return Object.values(projectsLatest)
      .map((r) => {
        const health = r.siteHealth || 90;
        let riskLevel = "Low";
        if (health < 70) riskLevel = "Critical";
        else if (health < 85) riskLevel = "Medium";
        else if (r.blockersLevel === "High" || r.blockersLevel === "Critical") riskLevel = "High";
        
        return {
          id: r.id,
          project: r.projectName,
          engineer: r.siteEngineer || "Vikram Rathore",
          progress: r.progressPercent || 75,
          labor: r.laborCount,
          blocker: r.blockersLevel || "None",
          health,
          riskLevel,
          status: health >= 85 ? "Healthy" : health >= 70 ? "Watch" : "Critical",
        };
      })
      .sort((a, b) => b.health - a.health);
  }, [reportsQuery.data?.reports]);

  // Filter & Search Logic
  const filteredReports = useMemo(() => {
    let list = reportsQuery.data?.reports || [];
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.projectName.toLowerCase().includes(q) ||
          (r.progressSummary || "").toLowerCase().includes(q) ||
          (r.siteEngineer || "").toLowerCase().includes(q)
      );
    }
    
    if (projectFilter) {
      list = list.filter((r) => r.projectId === projectFilter);
    }
    
    if (engineerFilter) {
      list = list.filter((r) => r.siteEngineer === engineerFilter);
    }
    
    if (statusFilter) {
      list = list.filter((r) => {
        const h = r.siteHealth || 90;
        if (statusFilter === "Excellent") return h >= 95;
        if (statusFilter === "Healthy") return h >= 85 && h < 95;
        if (statusFilter === "Watch") return h >= 70 && h < 85;
        if (statusFilter === "Critical") return h < 70;
        return true;
      });
    }

    if (hasBlockersFilter) {
      list = list.filter((r) => r.blockersLevel && r.blockersLevel !== "None");
    }

    if (dateFilter) {
      list = list.filter((r) => r.reportDate?.startsWith(dateFilter));
    }

    return list;
  }, [reportsQuery.data?.reports, searchQuery, projectFilter, engineerFilter, statusFilter, hasBlockersFilter, dateFilter]);

  // Unique lists of Engineers for filter
  const engineersList = useMemo(() => {
    const list = reportsQuery.data?.reports || [];
    const engineers = new Set<string>();
    list.forEach((r) => {
      if (r.siteEngineer) engineers.add(r.siteEngineer);
    });
    return Array.from(engineers);
  }, [reportsQuery.data?.reports]);

  // Pagination Logic
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredReports.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredReports, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredReports.length / rowsPerPage);

  const resetFilters = () => {
    setSearchQuery("");
    setProjectFilter("");
    setEngineerFilter("");
    setStatusFilter("");
    setHasBlockersFilter(false);
    setDateFilter("");
    setCurrentPage(1);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.projectId) errors.projectId = "Project selection is required";
    if (!form.reportDate) errors.reportDate = "Report date is required";
    if (!form.progressSummary.trim()) errors.progressSummary = "Progress summary is required";
    if (!form.siteEngineer.trim()) errors.siteEngineer = "Site Engineer name is required";
    if (!form.laborCount || isNaN(Number(form.laborCount)) || Number(form.laborCount) < 0) {
      errors.laborCount = "Labor count must be a non-negative number";
    }
    if (!form.progressPercent || isNaN(Number(form.progressPercent)) || Number(form.progressPercent) < 0 || Number(form.progressPercent) > 100) {
      errors.progressPercent = "Progress percentage must be between 0 and 100";
    }
    if (!form.siteHealth || isNaN(Number(form.siteHealth)) || Number(form.siteHealth) < 0 || Number(form.siteHealth) > 100) {
      errors.siteHealth = "Site Health must be between 0 and 100";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    submitMutation.mutate();
  };

  const handleEditClick = (report: DailyReport) => {
    setEditingReport(report);
    setDrawerOpen(true);
  };

  const handleDeleteClick = (reportId: string) => {
    if (confirm("Are you sure you want to delete this daily progress report?")) {
      deleteMutation.mutate(reportId);
    }
  };

  if (projectsQuery.isLoading || reportsQuery.isLoading) return <LoadingStateCard title="Loading Site Operations Performance" />;
  if (projectsQuery.error || reportsQuery.error || !projectsQuery.data || !reportsQuery.data) return <ErrorStateCard message="Site operations performance metrics are unavailable." />;

  return (
    <section className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-soft pb-5">
        <div className="space-y-1.5">
          <h1 className="text-page-title font-secondary font-bold tracking-tight text-text-primary">
            Construction Site Operations Panel
          </h1>
          <p className="max-w-4xl text-body text-text-secondary">
            Monitor daily site activity, workforce productivity, material consumption, project progress, and operational risks across all active projects.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => { setEditingReport(null); setDrawerOpen(true); }} className="text-white font-semibold gap-1.5">
            <Plus className="h-4.5 w-4.5" />
            <span>Add Daily Report</span>
          </Button>
          <Button variant="secondary" onClick={() => toast.success("CSV Export complete! Download started.")} className="gap-1.5 font-medium">
            <Download className="h-4.5 w-4.5" />
            <span>Export Reports</span>
          </Button>
          <Button variant="secondary" onClick={() => toast.info("AI DPR Summary: 'Overall site operations health stands excellent at 92/100, driven by rapid finishing stages at Villa Phase 2 and Tower A concrete casting. Heavy rains at Sector 79 caused a minor 2.4-hour progress lag. Steel supply needs inventory optimization within 48 hours.'")} className="gap-1.5 font-medium text-accent-primary border-accent-primary/20 bg-accent-primary/5 hover:bg-accent-primary/10">
            <Sparkles className="h-4.5 w-4.5" />
            <span>Generate DPR Summary</span>
          </Button>
          <Button variant="secondary" onClick={() => {
            const el = document.getElementById("site-analytics-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }} className="gap-1.5 font-medium">
            <TrendingUp className="h-4.5 w-4.5" />
            <span>Site Analytics</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1 - SITE HEALTH HERO */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_2.5fr]">
        <Card className="relative overflow-hidden border border-accent-primary/20 bg-gradient-to-br from-surface to-accent-primary/[0.02] shadow-soft">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-6 translate-y-[-6px] rounded-full bg-accent-primary/5 blur-2xl" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-label font-bold uppercase tracking-wider text-text-muted">Operations Score</span>
              <Badge tone="success" className="font-semibold text-white px-2 py-0.5 bg-success">
                Excellent
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-[64px] font-extrabold tracking-tighter text-text-primary">{stats.avgHealth}</span>
              <span className="text-body font-semibold text-text-muted">/ 100</span>
              <span className="text-label font-semibold text-success flex items-center gap-0.5 ml-2 bg-success-soft/30 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +4% vs Last Week
              </span>
            </div>
            <p className="text-body text-text-secondary">
              Overall operations are running at peak efficiency. Blocker resolution rates have improved by 14% since the last audit.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface p-5 shadow-soft hover:border-accent-primary/30 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <p className="mt-4 text-label uppercase tracking-wider text-text-muted">Active Sites</p>
            <p className="mt-1.5 text-2xl font-bold text-text-primary">{stats.activeSites}</p>
            <p className="mt-1 text-label text-text-muted">Across all zones</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface p-5 shadow-soft hover:border-accent-primary/30 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft/35 text-success">
              <FileText className="h-5 w-5" />
            </div>
            <p className="mt-4 text-label uppercase tracking-wider text-text-muted">DPRs Submitted</p>
            <p className="mt-1.5 text-2xl font-bold text-text-primary">{stats.reportsSubmittedToday}</p>
            <p className="mt-1 text-label text-success font-medium">100% submission rate</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface p-5 shadow-soft hover:border-accent-primary/30 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-soft/35 text-warning">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <p className="mt-4 text-label uppercase tracking-wider text-text-muted">Open Site Risks</p>
            <p className="mt-1.5 text-2xl font-bold text-text-primary">{stats.openSiteRisks}</p>
            <p className="mt-1 text-label text-text-muted">Requires mitigation</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface p-5 shadow-soft hover:border-accent-primary/30 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-secondary/10 text-accent-secondary">
              <Zap className="h-5 w-5" />
            </div>
            <p className="mt-4 text-label uppercase tracking-wider text-text-muted">Site Productivity</p>
            <p className="mt-1.5 text-2xl font-bold text-text-primary">{stats.avgProductivity}%</p>
            <p className="mt-1 text-label text-success font-medium">↑ 3.2% vs baseline</p>
          </div>
        </div>
      </div>

      {/* SECTION 2 - EXECUTIVE KPI GRID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Daily Reports"
          value={stats.totalReports}
          trend="+12% vs last month"
          trendType="up"
          status="Operational"
          statusTone="success"
          sparkline={[8, 12, 14, 18, 22, 25, stats.totalReports]}
          icon={<FileText className="h-5.5 w-5.5" />}
        />
        <MetricCard
          label="Reports This Week"
          value={Math.min(stats.totalReports, 18)}
          trend="+9% vs last week"
          trendType="up"
          status="Active Sync"
          statusTone="info"
          sparkline={[3, 5, 2, 4, 3, 2, 6]}
          icon={<Calendar className="h-5.5 w-5.5" />}
        />
        <MetricCard
          label="Active Construction Sites"
          value={stats.activeSites}
          trend="No change vs last week"
          trendType="neutral"
          status="Running"
          statusTone="success"
          sparkline={[4, 5, 5, 5, 6, 6, stats.activeSites]}
          icon={<Building2 className="h-5.5 w-5.5" />}
        />
        <MetricCard
          label="Average Labor Force"
          value={stats.avgLabor}
          trend="+6% vs last week"
          trendType="up"
          status="Optimal"
          statusTone="success"
          sparkline={[78, 85, 90, 88, 92, 95, stats.avgLabor]}
          icon={<Users className="h-5.5 w-5.5" />}
        />
        <MetricCard
          label="Workforce Productivity"
          value={`${stats.avgProductivity}%`}
          trend="+4% vs last week"
          trendType="up"
          status="High Efficiency"
          statusTone="success"
          sparkline={[82, 84, 85, 87, 86, 88, stats.avgProductivity]}
          icon={<Zap className="h-5.5 w-5.5" />}
        />
        <MetricCard
          label="Material Utilization"
          value="94%"
          trend="-2% variance"
          trendType="neutral"
          status="Within Budget"
          statusTone="info"
          sparkline={[96, 95, 95, 94, 94, 93, 94]}
          icon={<HardHat className="h-5.5 w-5.5" />}
        />
        <MetricCard
          label="Open Blockers"
          value={stats.openBlockersCount}
          trend="-15% vs last week"
          trendType="up"
          status="Resolving"
          statusTone="warning"
          sparkline={[5, 4, 3, 3, 2, 1, stats.openBlockersCount]}
          icon={<AlertTriangle className="h-5.5 w-5.5" />}
        />
        <MetricCard
          label="Site Health Score"
          value={`${stats.avgHealth}/100`}
          trend="+3% vs last week"
          trendType="up"
          status="Stable Health"
          statusTone="success"
          sparkline={[88, 89, 90, 91, 91, 92, stats.avgHealth]}
          icon={<Award className="h-5.5 w-5.5" />}
        />
      </div>

      {/* SECTION 3 - SITE PERFORMANCE CENTER (Recommendation cards) */}
      <div className="space-y-4">
        <h2 className="text-section-title font-secondary font-bold tracking-tight text-text-primary">
          Site Performance Center Recommendations
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-l-4 border-l-warning border-border-soft bg-surface shadow-soft hover:shadow-medium transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-warning uppercase">Material Risk</span>
                <Badge tone="warning">Warning</Badge>
              </div>
              <p className="text-body font-semibold text-text-primary">Steel inventory shortage reported across 2 sites.</p>
              <Button onClick={() => toast.info("Navigating to Inventory Control...")} size="sm" variant="outline" className="w-full text-xs font-semibold">
                Review Inventory
              </Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-error border-border-soft bg-surface shadow-soft hover:shadow-medium transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-error uppercase">Workforce Alert</span>
                <Badge tone="error">Critical</Badge>
              </div>
              <p className="text-body font-semibold text-text-primary">Labor availability dropped by 12% in Sector 79.</p>
              <Button onClick={() => toast.info("Navigating to Workforce Allocations...")} size="sm" variant="outline" className="w-full text-xs font-semibold">
                Review Workforce
              </Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-error border-border-soft bg-surface shadow-soft hover:shadow-medium transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-error uppercase">Execution Delay</span>
                <Badge tone="error">Critical</Badge>
              </div>
              <p className="text-body font-semibold text-text-primary">Tower B reported 3 consecutive delayed updates.</p>
              <Button onClick={() => toast.info("Opening project workspace...")} size="sm" variant="outline" className="w-full text-xs font-semibold">
                Open Site
              </Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success border-border-soft bg-surface shadow-soft hover:shadow-medium transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-success uppercase">High Performance</span>
                <Badge tone="success">Success</Badge>
              </div>
              <p className="text-body font-semibold text-text-primary">Villa Phase 2 achieved highest productivity this week.</p>
              <Button onClick={() => toast.info("Opening Villa Phase 2 project detail...")} size="sm" variant="outline" className="w-full text-xs font-semibold">
                View Site
              </Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-info border-border-soft bg-surface shadow-soft hover:shadow-medium transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-accent-primary uppercase">Weather Impact</span>
                <Badge tone="info">Information</Badge>
              </div>
              <p className="text-body font-semibold text-text-primary">Rain conditions affected progress across 3 projects.</p>
              <Button onClick={() => toast.info("Opening rain impact reports...")} size="sm" variant="outline" className="w-full text-xs font-semibold">
                Review Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 4 - SITE ANALYTICS (2x2 Grid) */}
      <div id="site-analytics-section" className="space-y-4 pt-4">
        <h2 className="text-section-title font-secondary font-bold tracking-tight text-text-primary">
          Operations Analytics
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Chart 1: Site Progress Trend */}
          <Card className="shadow-soft border-border-soft">
            <CardHeader className="pb-2 border-b border-border-soft">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-text-primary">Site Progress Trend</CardTitle>
                <Badge tone="neutral">Last 90 Days</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area type="monotone" dataKey="Progress %" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorProgress)" />
                  <Area type="monotone" dataKey="Target Progress %" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorTarget)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Workforce Utilization */}
          <Card className="shadow-soft border-border-soft">
            <CardHeader className="pb-2 border-b border-border-soft">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-text-primary">Workforce Utilization</CardTitle>
                <Badge tone="neutral">Grouped by Project</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workforceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Skilled Labor" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Unskilled Labor" stackId="a" fill="#38bdf8" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Supervisors" stackId="a" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 3: Material Consumption Trend */}
          <Card className="shadow-soft border-border-soft">
            <CardHeader className="pb-2 border-b border-border-soft">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-text-primary">Material Consumption Trend</CardTitle>
                <Badge tone="neutral">Monthly Volumes</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={materialTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area type="monotone" dataKey="Cement" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="Steel" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="Sand" stackId="3" stroke="#22c55e" fill="#22c55e" fillOpacity={0.05} />
                  <Area type="monotone" dataKey="Aggregates" stackId="4" stroke="#a855f7" fill="#a855f7" fillOpacity={0.05} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 4: Project Progress Comparison */}
          <Card className="shadow-soft border-border-soft">
            <CardHeader className="pb-2 border-b border-border-soft">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-text-primary">Project Progress Comparison</CardTitle>
                <Badge tone="neutral">Ranked by Completion</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={projectComparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} width={80} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Current Progress" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="Target Progress" fill="#e5e7eb" radius={[0, 4, 4, 0]} barSize={6} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 5 - SITE PERFORMANCE LEADERBOARD */}
      <div className="space-y-4">
        <h2 className="text-section-title font-secondary font-bold tracking-tight text-text-primary">
          Site Performance Leaderboard
        </h2>
        <Card className="overflow-hidden border border-border-soft shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-table">
              <thead className="bg-surface-secondary">
                <tr className="h-11 border-b border-border-soft text-left text-text-secondary font-medium">
                  <th className="px-5 font-semibold text-text-secondary">Project</th>
                  <th className="px-5 font-semibold text-text-secondary">Site Engineer</th>
                  <th className="px-5 font-semibold text-text-secondary">Progress %</th>
                  <th className="px-5 font-semibold text-text-secondary">Labor Count</th>
                  <th className="px-5 font-semibold text-text-secondary font-medium">Blockers Level</th>
                  <th className="px-5 font-semibold text-text-secondary">Site Health Score</th>
                  <th className="px-5 font-semibold text-text-secondary">Risk Level</th>
                  <th className="px-5 font-semibold text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((row, idx) => (
                  <tr key={row.id} className="h-12 border-t border-border-soft bg-surface text-text-secondary hover:bg-hover">
                    <td className="px-5 font-semibold text-text-primary flex items-center gap-2 py-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary/10 text-xs text-accent-primary font-bold">
                        {idx + 1}
                      </span>
                      <span>{row.project}</span>
                    </td>
                    <td className="px-5">{row.engineer}</td>
                    <td className="px-5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-hover overflow-hidden">
                          <div className="h-2 rounded-full bg-accent-primary" style={{ width: `${row.progress}%` }} />
                        </div>
                        <span className="font-medium">{row.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5">{row.labor}</td>
                    <td className="px-5">
                      <Badge tone={row.blocker === "Critical" || row.blocker === "High" ? "error" : row.blocker === "Medium" ? "warning" : "success"}>
                        {row.blocker}
                      </Badge>
                    </td>
                    <td className="px-5">
                      <span className={`font-bold ${row.health >= 95 ? "text-success" : row.health >= 85 ? "text-accent-primary" : row.health >= 70 ? "text-warning" : "text-error"}`}>
                        {row.health} / 100
                      </span>
                    </td>
                    <td className="px-5">
                      <Badge tone={row.riskLevel === "Critical" || row.riskLevel === "High" ? "error" : row.riskLevel === "Medium" ? "warning" : "success"}>
                        {row.riskLevel}
                      </Badge>
                    </td>
                    <td className="px-5">
                      <Badge tone={row.status === "Healthy" ? "success" : row.status === "Watch" ? "warning" : "error"}>
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* SECTION 6 & 7 LAYOUT: REGISTER + TIMELINE */}
      <div className="flex flex-col gap-6">
        {/* SECTION 6: DAILY ACTIVITY TIMELINE */}
        <div className="space-y-4 order-2">
          <h2 className="text-section-title font-secondary font-bold tracking-tight text-text-primary">
            Daily Activity Timeline
          </h2>
          <Card className="p-5 border-border-soft shadow-soft bg-surface">
            <div className="relative border-l border-border-soft pl-5 space-y-6">
              {/* Timeline Item 1 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full border border-border-soft bg-surface">
                  <span className="h-2 w-2 rounded-full bg-accent-primary" />
                </span>
                <span className="text-xs font-semibold text-text-muted">09:00 AM · Shift Mobilization</span>
                <p className="mt-1 text-xs text-text-secondary">
                  138 workers checked in across 3 active workfronts at Tower A. Safety briefing completed.
                </p>
              </div>
              
              {/* Timeline Item 2 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full border border-border-soft bg-surface">
                  <span className="h-2 w-2 rounded-full bg-error" />
                </span>
                <span className="text-xs font-semibold text-text-muted">11:30 AM · Blocker Logged</span>
                <p className="mt-1 text-xs text-text-secondary">
                  Sector 79 layout check delayed due to consultant sign-off pending. Blocker level: Medium.
                </p>
              </div>

              {/* Timeline Item 3 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full border border-border-soft bg-surface">
                  <span className="h-2 w-2 rounded-full bg-success" />
                </span>
                <span className="text-xs font-semibold text-text-muted">02:00 PM · Material Delivery</span>
                <p className="mt-1 text-xs text-text-secondary">
                  12 tons of reinforcement steel delivered at Skyline Towers and logged in register.
                </p>
              </div>

              {/* Timeline Item 4 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full border border-border-soft bg-surface">
                  <span className="h-2 w-2 rounded-full bg-success" />
                </span>
                <span className="text-xs font-semibold text-text-muted">04:30 PM · Milestone Reached</span>
                <p className="mt-1 text-xs text-text-secondary">
                  Core concrete pour completed for Villa Phase 2 level 2 superstructure.
                </p>
              </div>

              {/* Timeline Item 5 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full border border-border-soft bg-surface">
                  <span className="h-2 w-2 rounded-full bg-accent-primary" />
                </span>
                <span className="text-xs font-semibold text-text-muted">06:00 PM · DPR Submitted</span>
                <p className="mt-1 text-xs text-text-secondary">
                  Vikram Rathore submitted daily progress report for Project Aurora. Operations score: 94.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* SECTION 7: DAILY REPORT REGISTER */}
        <div className="space-y-4 order-1">
          <h2 className="text-section-title font-secondary font-bold tracking-tight text-text-primary">
            Daily Report Register
          </h2>
          <Card className="overflow-hidden border border-border-soft shadow-soft">
            {/* TOOLBAR */}
            <TableToolbar
              searchPlaceholder="Search projects, summaries, or engineers..."
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              filters={
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-label text-text-primary focus:outline-none focus:border-accent-primary"
                  >
                    <option value="">All Projects</option>
                    {projectsQuery.data.projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <select
                    value={engineerFilter}
                    onChange={(e) => setEngineerFilter(e.target.value)}
                    className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-label text-text-primary focus:outline-none focus:border-accent-primary"
                  >
                    <option value="">All Engineers</option>
                    {engineersList.map((eng) => (
                      <option key={eng} value={eng}>{eng}</option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-label text-text-primary focus:outline-none focus:border-accent-primary"
                  >
                    <option value="">All Health Statuses</option>
                    <option value="Excellent">Excellent (&gt;=95)</option>
                    <option value="Healthy">Healthy (85-94)</option>
                    <option value="Watch">Watch (70-84)</option>
                    <option value="Critical">Critical (&lt;70)</option>
                  </select>

                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-label text-text-primary focus:outline-none focus:border-accent-primary"
                  />

                  <label className="flex items-center gap-1.5 cursor-pointer select-none border border-border-soft rounded-[var(--radius-input)] h-11 px-3 bg-surface text-label text-text-secondary hover:bg-hover">
                    <input
                      type="checkbox"
                      checked={hasBlockersFilter}
                      onChange={(e) => setHasBlockersFilter(e.target.checked)}
                      className="rounded border-border-soft text-accent-primary focus:ring-accent-primary h-4 w-4"
                    />
                    <span>Has Blockers</span>
                  </label>
                </div>
              }
              actions={null}
              resultLabel={`${filteredReports.length} Reports`}
              activeFilters={[
                projectFilter && `Project: ${projectsQuery.data.projects.find(p => p.id === projectFilter)?.name || projectFilter}`,
                engineerFilter && `Engineer: ${engineerFilter}`,
                statusFilter && `Health: ${statusFilter}`,
                hasBlockersFilter && "Blockers: Active",
                dateFilter && `Date: ${dateFilter}`,
              ].filter(Boolean) as string[]}
              onClear={resetFilters}
            />

            {/* TABLE */}
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full border-separate border-spacing-0 text-table">
                <thead className="bg-surface-secondary sticky top-0 z-[var(--z-sticky-table-head)]">
                  <tr className="h-11 border-b border-border-soft text-left text-text-secondary font-medium">
                    <th className="px-4 font-semibold text-text-secondary">Date</th>
                    <th className="px-4 font-semibold text-text-secondary">Project</th>
                    <th className="px-4 font-semibold text-text-secondary">Engineer</th>
                    <th className="px-4 font-semibold text-text-secondary">Labor Count</th>
                    <th className="px-4 font-semibold text-text-secondary">Progress %</th>
                    <th className="px-4 font-semibold text-text-secondary">Material Usage</th>
                    <th className="px-4 font-semibold text-text-secondary">Blockers</th>
                    <th className="px-4 font-semibold text-text-secondary">Weather</th>
                    <th className="px-4 font-semibold text-text-secondary">Site Health</th>
                    <th className="px-4 font-semibold text-text-secondary">Status</th>
                    <th className="px-4 font-semibold text-text-secondary text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReports.length === 0 ? (
                    <TableEmptyStateRow colSpan={11} title="No DPRs found" description="Adjust your filters or submit a new daily progress report." />
                  ) : (
                    paginatedReports.map((report) => {
                      const health = report.siteHealth || 90;
                      let healthTone: "success" | "warning" | "error" | "info" = "success";
                      if (health < 70) healthTone = "error";
                      else if (health < 85) healthTone = "warning";
                      
                      const blockersTone = report.blockersLevel === "Critical" || report.blockersLevel === "High" ? "error" 
                        : report.blockersLevel === "Medium" ? "warning" : "success";

                      const statusBadgeTone = health >= 85 ? "success" : health >= 70 ? "warning" : "error";
                      const statusBadgeText = health >= 95 ? "Excellent" : health >= 85 ? "Healthy" : health >= 70 ? "Watch" : "Critical";

                      return (
                        <tr key={report.id} className="h-12 border-t border-border-soft bg-surface text-text-secondary hover:bg-hover">
                          <td className="px-4 py-3 font-semibold text-text-primary whitespace-nowrap">
                            {formatDate(report.reportDate)}
                          </td>
                          <td className="px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-text-primary">{report.projectName}</span>
                              <div className="flex gap-1 mt-0.5">
                                <Badge tone="neutral" className="text-[10px] py-0 px-1.5">
                                  {report.projectId.includes("skyline") ? "Commercial" : "Residential"}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 font-medium whitespace-nowrap">{report.siteEngineer || "Vikram Rathore"}</td>
                          <td className="px-4 font-medium">{report.laborCount}</td>
                          <td className="px-4">
                            <div className="flex items-center gap-1.5 min-w-[90px]">
                              <div className="h-1.5 w-12 rounded-full bg-hover overflow-hidden">
                                <div className="h-1.5 rounded-full bg-accent-primary" style={{ width: `${report.progressPercent || 75}%` }} />
                              </div>
                              <span className="font-semibold text-text-primary">{report.progressPercent || 75}%</span>
                              <span className="text-[10px] text-success font-medium flex items-center">
                                <ArrowUpRight className="h-2.5 w-2.5 inline" />+3%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 max-w-[150px] truncate text-body" title={report.materialUsage}>
                            {report.materialUsage}
                          </td>
                          <td className="px-4">
                            <Badge tone={blockersTone} className="font-medium">
                              {report.blockersLevel || "None"}
                            </Badge>
                          </td>
                          <td className="px-4">
                            <span className="flex items-center gap-1">
                              {report.weather === "Rainy" || report.weather === "Rain" ? (
                                <CloudRain className="h-4 w-4 text-accent-primary" />
                              ) : report.weather === "Cloudy" ? (
                                <Cloud className="h-4 w-4 text-text-muted" />
                              ) : report.weather === "Windy" ? (
                                <Wind className="h-4 w-4 text-text-muted" />
                              ) : (
                                <Sun className="h-4 w-4 text-warning" />
                              )}
                              <span className="text-body font-medium">{report.weather || "Sunny"}</span>
                            </span>
                          </td>
                          <td className="px-4">
                            <span className={`font-bold text-body ${health >= 95 ? "text-success" : health >= 85 ? "text-accent-primary" : health >= 70 ? "text-warning" : "text-error"}`}>
                              {health} / 100
                            </span>
                          </td>
                          <td className="px-4">
                            <Badge tone={statusBadgeTone}>
                              {statusBadgeText}
                            </Badge>
                          </td>
                          <td className="px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/projects/daily-reports/${report.id}`}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Detail">
                                  <Eye className="h-4.5 w-4.5 text-text-secondary" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditClick(report)} title="Edit Report">
                                <Edit className="h-4.5 w-4.5 text-accent-primary" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteClick(report.id)} title="Delete Report">
                                <Trash2 className="h-4.5 w-4.5 text-error" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toast.info("Generating PDF Report summary...")} title="Generate PDF">
                                <FileDown className="h-4.5 w-4.5 text-text-muted" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROL */}
            {filteredReports.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-5 py-4 bg-surface-secondary/40">
                <div className="flex items-center gap-2 text-label text-text-secondary">
                  <span>Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="h-8 rounded-[var(--radius-input)] border border-border-soft bg-surface px-2 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="ml-4">
                    Showing {Math.min(filteredReports.length, (currentPage - 1) * rowsPerPage + 1)}–{Math.min(filteredReports.length, currentPage * rowsPerPage)} of {filteredReports.length} Reports
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    // show only limited page buttons
                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "primary" : "outline"}
                          size="sm"
                          className="h-8 w-8 text-xs p-0 font-bold"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="text-text-muted px-1 text-xs">...</span>;
                    }
                    return null;
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* XL ADD/EDIT RIGHT DRAWER */}
      <Drawer
        open={drawerOpen}
        title={editingReport ? "Edit Site Daily Report" : "Submit Daily Progress Report (DPR)"}
        size="lg"
        onClose={() => { setDrawerOpen(false); setEditingReport(null); }}
      >
        <form onSubmit={handleFormSubmit} className="space-y-6 pb-12">
          {Object.keys(formErrors).length > 0 && (
            <div className="flex items-start gap-2.5 rounded-[var(--radius-input)] border border-error-soft bg-error-soft/10 p-4 text-text-error">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-body font-bold">Please resolve form validation errors</p>
                <ul className="list-disc pl-4 text-label space-y-0.5">
                  {Object.values(formErrors).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Section 1: Project & Date Info */}
          <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20">
            <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <Building2 className="h-4.5 w-4.5 text-accent-primary" />
              <span>General Site Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Project Name *</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
                  className={selectClassName}
                  disabled={!!editingReport}
                >
                  {projectsQuery.data.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Report Date *</label>
                <Input
                  type="date"
                  value={form.reportDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, reportDate: e.target.value }))}
                  className={formErrors.reportDate ? "border-error focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Shift *</label>
                <select
                  value={form.shift}
                  onChange={(e) => setForm((prev) => ({ ...prev, shift: e.target.value }))}
                  className={selectClassName}
                >
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Site Engineer In Charge *</label>
                <Input
                  placeholder="e.g. Vikram Rathore"
                  value={form.siteEngineer}
                  onChange={(e) => setForm((prev) => ({ ...prev, siteEngineer: e.target.value }))}
                  className={formErrors.siteEngineer ? "border-error focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Weather Conditions *</label>
                <select
                  value={form.weather}
                  onChange={(e) => setForm((prev) => ({ ...prev, weather: e.target.value }))}
                  className={selectClassName}
                >
                  <option value="Sunny">☀️ Sunny / Clear</option>
                  <option value="Rainy">🌧️ Rainy / Wet</option>
                  <option value="Cloudy">☁️ Cloudy / Overcast</option>
                  <option value="Windy">💨 Windy / Dust Storm</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Workforce Analytics Details */}
          <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20">
            <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-accent-primary" />
              <span>Workforce & Labor Allocations</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Total Labor Count *</label>
                <Input
                  type="number"
                  placeholder="Total Workers"
                  value={form.laborCount}
                  onChange={(e) => setForm((prev) => ({ ...prev, laborCount: e.target.value }))}
                  className={formErrors.laborCount ? "border-error focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Skilled Labor</label>
                <Input
                  type="number"
                  placeholder="Masons, Carpenters, Welders"
                  value={form.laborSkilled}
                  onChange={(e) => setForm((prev) => ({ ...prev, laborSkilled: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Unskilled Labor</label>
                <Input
                  type="number"
                  placeholder="Helpers, Loaders"
                  value={form.laborUnskilled}
                  onChange={(e) => setForm((prev) => ({ ...prev, laborUnskilled: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Supervisors / Foremen</label>
                <Input
                  type="number"
                  placeholder="Engineers, Leads"
                  value={form.laborSupervisors}
                  onChange={(e) => setForm((prev) => ({ ...prev, laborSupervisors: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Progress Tracker */}
          <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20">
            <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <Zap className="h-4.5 w-4.5 text-accent-primary" />
              <span>Progress Tracking & Milestones</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Work Progress % *</label>
                <Input
                  type="number"
                  placeholder="e.g. 75"
                  value={form.progressPercent}
                  onChange={(e) => setForm((prev) => ({ ...prev, progressPercent: e.target.value }))}
                  className={formErrors.progressPercent ? "border-error" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Site Operations Health Score (0-100) *</label>
                <Input
                  type="number"
                  placeholder="e.g. 92"
                  value={form.siteHealth}
                  onChange={(e) => setForm((prev) => ({ ...prev, siteHealth: e.target.value }))}
                  className={formErrors.siteHealth ? "border-error" : ""}
                />
              </div>
            </div>
            <div className="space-y-1.5 mt-2">
              <label className="text-label text-text-secondary font-medium">Progress Summary *</label>
              <textarea
                placeholder="Describe key execution milestones met, areas casted, snaps, or site benchmarks closed today..."
                value={form.progressSummary}
                onChange={(e) => setForm((prev) => ({ ...prev, progressSummary: e.target.value }))}
                rows={3}
                className={textareaClassName + (formErrors.progressSummary ? " border-error" : "")}
              />
            </div>
          </div>

          {/* Section 4: Material Consumption */}
          <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20">
            <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <HardHat className="h-4.5 w-4.5 text-accent-primary" />
              <span>Material Utilization Logs</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Cement Consumed (Bags)</label>
                <Input
                  type="number"
                  placeholder="e.g. 120"
                  value={form.materialCement}
                  onChange={(e) => setForm((prev) => ({ ...prev, materialCement: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Steel Consumed (Tons)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 4.5"
                  value={form.materialSteel}
                  onChange={(e) => setForm((prev) => ({ ...prev, materialSteel: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Sand Consumed (Brass)</label>
                <Input
                  type="number"
                  placeholder="e.g. 15"
                  value={form.materialSand}
                  onChange={(e) => setForm((prev) => ({ ...prev, materialSand: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Aggregates Consumed (cu.m)</label>
                <Input
                  type="number"
                  placeholder="e.g. 20"
                  value={form.materialAggregates}
                  onChange={(e) => setForm((prev) => ({ ...prev, materialAggregates: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5 mt-2">
              <label className="text-label text-text-secondary font-medium">Material Usage Text Summary</label>
              <Input
                placeholder="e.g. Cement: 120 bags, Steel: 4.5 tons consumed for foundation slab."
                value={form.materialUsageText}
                onChange={(e) => setForm((prev) => ({ ...prev, materialUsageText: e.target.value }))}
              />
            </div>
          </div>

          {/* Section 5: Blockers & Risks */}
          <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20">
            <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-4.5 w-4.5 text-accent-primary" />
              <span>Operational Blockers & Risk Mitigation</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Blocker Severity Level</label>
                <select
                  value={form.blockersLevel}
                  onChange={(e) => setForm((prev) => ({ ...prev, blockersLevel: e.target.value }))}
                  className={selectClassName}
                >
                  <option value="None">✅ None - Free Flowing</option>
                  <option value="Low">🟢 Low - Minor Interruption</option>
                  <option value="Medium">🟡 Medium - Moderate Impact</option>
                  <option value="High">🟠 High - Heavy Delay Risk</option>
                  <option value="Critical">🔴 Critical - Work Suspended</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Blockers Description</label>
                <Input
                  placeholder="Describe material delays, labor strikes, consultant holds, weather halts..."
                  value={form.blockers}
                  onChange={(e) => setForm((prev) => ({ ...prev, blockers: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Section 6: Photos & Remarks */}
          <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20">
            <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5 text-accent-primary" />
              <span>Site Media & Engineering Remarks</span>
            </h3>
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Photo Uploads</label>
              <Input
                type="text"
                placeholder="Comma separated image paths, e.g. /images/site1.jpg, /images/site2.jpg"
                value={form.remarks ? "" : "/images/progress-casting.jpg, /images/safety-walk.jpg"}
                disabled
              />
              <span className="text-[11px] text-text-muted">Standard uploads are handled via DMS document integrations.</span>
            </div>
            <div className="space-y-1.5 mt-2">
              <label className="text-label text-text-secondary font-medium">Remarks / Engineering Notes</label>
              <textarea
                placeholder="Include shift handovers, structural observations, crane tests, or safety notes..."
                value={form.remarks}
                onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                rows={3}
                className={textareaClassName}
              />
            </div>
          </div>

          {/* Drawer Action Controls */}
          <div className="flex justify-end gap-3 border-t border-border-soft pt-5 sticky bottom-0 bg-surface z-10 py-3">
            <Button type="button" variant="outline" onClick={() => { setDrawerOpen(false); setEditingReport(null); }}>
              Cancel
            </Button>
            <Button type="submit" loading={submitMutation.isPending} className="text-white gap-1.5 font-semibold">
              <ClipboardPlus className="h-4.5 w-4.5" />
              <span>{editingReport ? "Update Report" : "Submit Daily Report"}</span>
            </Button>
          </div>
        </form>
      </Drawer>
    </section>
  );
}

export function ResourcesWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const projectsQuery = useProjectsSummary();
  const query = useQuery({
    queryKey: ["erp-resources", role],
    queryFn: async () => (await apiRequest<ResourcesResponse>("/api/projects/resources", { role })).data,
  });
  const [form, setForm] = useState({
    projectId: "",
    resourceName: "",
    type: "Crew",
    assignedTo: "",
    utilization: "",
  });

  const mutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/projects/resources", {
        role,
        method: "POST",
        body: {
          ...form,
          utilization: Number(form.utilization),
        },
      }),
    onSuccess: async () => {
      setForm((current) => ({
        ...current,
        resourceName: "",
        type: "Crew",
        assignedTo: "",
        utilization: "",
      }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-resources"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projectsQuery.data?.projects[0]?.id || "" }));
    }
  }, [form.projectId, projectsQuery.data?.projects]);

  if (query.isLoading || projectsQuery.isLoading) return <LoadingStateCard title="Loading resource allocations" />;
  if (query.error || projectsQuery.error || !query.data || !projectsQuery.data) return <ErrorStateCard message="Resource allocation data is unavailable." />;

  return (
    <section className="space-y-6">
      <SectionHeader title="Resource Allocations" description="Machinery, crews, and contractor deployment across active projects." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Allocation Register</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[840px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Resource</th>
                    <th className="px-4 text-left">Type</th>
                    <th className="px-4 text-left">Project</th>
                    <th className="px-4 text-left">Assigned To</th>
                    <th className="px-4 text-left">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.resources.map((resource) => (
                    <tr key={resource.id} className="border-t border-border-soft">
                      <td className="px-4 py-4 text-text-primary">{resource.resourceName}</td>
                      <td className="px-4 py-4">{resource.type}</td>
                      <td className="px-4 py-4">{resource.projectName}</td>
                      <td className="px-4 py-4">{resource.assignedTo}</td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <p className="text-text-primary">{resource.utilization}%</p>
                          <div className="h-2 rounded-full bg-hover">
                            <div className="h-2 rounded-full bg-accent-primary" style={{ width: `${resource.utilization}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign Resource</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Resource name</label>
              <Input value={form.resourceName} onChange={(event) => setForm((current) => ({ ...current, resourceName: event.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Type</label>
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className={selectClassName}>
                  <option value="Crew">Crew</option>
                  <option value="Machinery">Machinery</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Utilization %</label>
                <Input value={form.utilization} onChange={(event) => setForm((current) => ({ ...current, utilization: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Assigned to</label>
              <Input value={form.assignedTo} onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))} />
            </div>
            <div className="flex justify-end">
              <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
                <ClipboardPlus className="h-4 w-4" />
                Assign Resource
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// Helper for dynamic detailed data on the frontend
function getExtendedVendorDetails(vendor: any) {
  const hash = vendor.id ? vendor.id.split("-").pop() || "1001" : "1001";
  const num = parseInt(hash, 10) || 1001;

  const contacts = [
    { name: "Rajesh Kumar", email: "rajesh@sktcement.in", phone: "+91 98765 43210", address: "G-42, Sector 63, Noida, UP, 201301", terms: "30 Days Credit" },
    { name: "Amit Sharma", email: "amit.sharma@metrosteel.com", phone: "+91 87654 32109", address: "Plot 12, Industrial Area Phase II, Faridabad, Haryana, 121001", terms: "15 Days Credit" },
    { name: "Vikram Malhotra", email: "v.malhotra@brightvolt.com", phone: "+91 76543 21098", address: "Building 5B, Cyber City Phase 3, Gurugram, Haryana, 122002", terms: "30% Advance, 70% on Delivery" },
    { name: "Sanjay Patel", email: "sanjay@plumbwell.co.in", phone: "+91 95554 32109", address: "201, Sunrise Chambers, Gokhale Road, Pune, Maharashtra, 411005", terms: "45 Days Credit" },
    { name: "Priya Nair", email: "priya.nair@finishingdecor.com", phone: "+91 91112 33445", address: "Industrial Zone, Guindy, Chennai, Tamil Nadu, 600032", terms: "Letter of Credit" },
  ];

  const contact = contacts[num % contacts.length];

  return {
    contactPerson: contact.name,
    email: contact.email,
    phone: contact.phone,
    address: contact.address,
    paymentTerms: contact.terms,
    onTimeDeliveryRate: 88 + (num % 10),
    qualityRating: 90 + (num % 9),
    ordersThisYear: 14 + (num % 18),
    totalSpend: 1850000 + (num % 30) * 165000,
  };
}

// Local lightweight Sparkline component for KPI cards
function VendorSparkline({ values, color }: { values: number[]; color: string }) {
  const data = values.map((value, index) => ({ index, value }));
  const gradientId = `spark-vendors-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.28} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VendorsWorkspace() {
  const role = useUiStore((state) => state.role);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Toolbar state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [reliabilityFilter, setReliabilityFilter] = useState("All");
  const [leadTimeFilter, setLeadTimeFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    category: "Cement",
    contactPerson: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    gstin: "",
    averageLeadTimeDays: "",
    reliabilityScore: "",
    paymentTerms: "30 Days Credit",
    status: "Active",
  });

  // Queries
  const query = useQuery({
    queryKey: ["erp-vendors", role],
    queryFn: async () => (await apiRequest<VendorsResponse>("/api/procurement/vendors", { role })).data,
  });

  const ordersQuery = useQuery({
    queryKey: ["erp-purchase-orders", role],
    queryFn: async () => (await apiRequest<PurchaseOrdersResponse>("/api/procurement/purchase-orders", { role })).data,
  });

  const paymentsQuery = useQuery({
    queryKey: ["erp-payments", role],
    queryFn: async () => (await apiRequest<any>("/api/procurement/payments", { role })).data,
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(editingVendorId ? `/api/procurement/vendors/${editingVendorId}` : "/api/procurement/vendors", {
        role,
        method: editingVendorId ? "PATCH" : "POST",
        body: {
          name: form.name,
          category: form.category,
          city: form.city,
          gstin: form.gstin,
          averageLeadTimeDays: Number(form.averageLeadTimeDays),
          reliabilityScore: Number(form.reliabilityScore),
          status: form.status,
        },
      }),
    onSuccess: async () => {
      setIsDrawerOpen(false);
      setEditingVendorId(null);
      setForm({
        name: "",
        category: "Cement",
        contactPerson: "",
        email: "",
        phone: "",
        city: "",
        address: "",
        gstin: "",
        averageLeadTimeDays: "",
        reliabilityScore: "",
        paymentTerms: "30 Days Credit",
        status: "Active",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-vendors"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
      ]);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (vendorId: string) =>
      apiRequest(`/api/procurement/vendors/${vendorId}/archive`, {
        role,
        method: "PATCH",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-vendors"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
      ]);
    },
  });

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["erp-vendors"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-purchase-orders"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-payments"] }),
    ]);
  };

  const handleExport = () => {
    if (!query.data) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Vendor Name,Category,City,GSTIN,Lead Time (Days),Reliability (%)", ...query.data.vendors.map(v => 
        `"${v.name}","${v.category}","${v.city}","${v.gstin}",${v.averageLeadTimeDays},${v.reliabilityScore}`
      )].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vendor_intelligence_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Detailed calculations
  const {
    vendors,
    totalCount,
    activeCount,
    categoriesCount,
    avgReliability,
    avgLeadTime,
    activeOrdersCount,
    highRiskCount,
    dependencyScore,
    visibleVendors,
    citiesList,
  } = useMemo(() => {
    const defaultData = {
      vendors: [] as Vendor[],
      totalCount: 0,
      activeCount: 0,
      categoriesCount: 0,
      avgReliability: 0,
      avgLeadTime: "0.0",
      activeOrdersCount: 0,
      highRiskCount: 0,
      dependencyScore: 0,
      visibleVendors: [] as Vendor[],
      citiesList: [] as string[],
    };

    if (!query.data) return defaultData;

    const rawVendors = query.data.vendors;
    const rawOrders = ordersQuery.data?.purchaseOrders || [];

    const total = rawVendors.length;
    const active = rawVendors.filter(v => v.status === "Active" || v.status === "On watch" || v.status === "On Watch").length;
    const categories = new Set(rawVendors.map(v => v.category)).size;
    const reliabilitySum = rawVendors.reduce((sum, v) => sum + v.reliabilityScore, 0);
    const avgRel = total ? Math.round(reliabilitySum / total) : 0;
    const leadTimeSum = rawVendors.reduce((sum, v) => sum + v.averageLeadTimeDays, 0);
    const avgLT = total ? (leadTimeSum / total).toFixed(1) : "0.0";
    const activePOs = rawOrders.filter(po => po.status !== "Delivered" && po.status !== "Completed" && po.status !== "Cancelled").length;
    const highRisk = rawVendors.filter(v => v.reliabilityScore < 85).length;

    // Calculate spend per vendor for dependency metric
    const spends: Record<string, number> = {};
    rawVendors.forEach(v => { spends[v.id] = 0; });
    rawOrders.forEach(po => { if (spends[po.vendorId] !== undefined) spends[po.vendorId] += po.amount; });
    
    // Add default mock spend for seed data if zero
    rawVendors.forEach(v => {
      if (spends[v.id] === 0) spends[v.id] = getExtendedVendorDetails(v).totalSpend;
    });

    const totalSpendVal = Object.values(spends).reduce((sum, s) => sum + s, 0);
    const maxSpendVal = totalSpendVal ? Math.max(...Object.values(spends)) : 0;
    const depScore = totalSpendVal ? Math.round((maxSpendVal / totalSpendVal) * 100) : 0;

    // Filter logic
    const filtered = rawVendors.filter((vendor) => {
      const details = getExtendedVendorDetails(vendor);
      const needle = search.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        vendor.name.toLowerCase().includes(needle) ||
        vendor.city.toLowerCase().includes(needle) ||
        vendor.gstin.toLowerCase().includes(needle) ||
        details.contactPerson.toLowerCase().includes(needle);

      const matchesCategory = categoryFilter === "All" || vendor.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || vendor.status === statusFilter;
      const matchesCity = cityFilter === "All" || vendor.city === cityFilter;
      
      let matchesReliability = true;
      if (reliabilityFilter !== "All") {
        if (reliabilityFilter === "High (>=90%)") matchesReliability = vendor.reliabilityScore >= 90;
        else if (reliabilityFilter === "Mid (80-89%)") matchesReliability = vendor.reliabilityScore >= 80 && vendor.reliabilityScore < 90;
        else if (reliabilityFilter === "Critical (<80%)") matchesReliability = vendor.reliabilityScore < 80;
      }

      let matchesLeadTime = true;
      if (leadTimeFilter !== "All") {
        if (leadTimeFilter === "Fast (<=2 days)") matchesLeadTime = vendor.averageLeadTimeDays <= 2;
        else if (leadTimeFilter === "Moderate (3-5 days)") matchesLeadTime = vendor.averageLeadTimeDays > 2 && vendor.averageLeadTimeDays <= 5;
        else if (leadTimeFilter === "Slow (>5 days)") matchesLeadTime = vendor.averageLeadTimeDays > 5;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesCity && matchesReliability && matchesLeadTime;
    });

    const cities = Array.from(new Set(rawVendors.map(v => v.city)));

    return {
      vendors: rawVendors,
      totalCount: total,
      activeCount: active,
      categoriesCount: categories,
      avgReliability: avgRel,
      avgLeadTime: avgLT,
      activeOrdersCount: activePOs,
      highRiskCount: highRisk,
      dependencyScore: depScore,
      visibleVendors: filtered,
      citiesList: cities,
    };
  }, [query.data, ordersQuery.data, search, categoryFilter, statusFilter, reliabilityFilter, leadTimeFilter, cityFilter]);

  // Paginated records
  const totalPages = Math.ceil(visibleVendors.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedVendors = useMemo(() => {
    return visibleVendors.slice(startIndex, startIndex + rowsPerPage);
  }, [visibleVendors, startIndex, rowsPerPage]);

  // Analytics Chart Data
  const leaderboardData = useMemo(() => {
    return vendors
      .map(v => ({ name: v.name.split(" ")[0], score: v.reliabilityScore, fullName: v.name }))
      .sort((a,b) => b.score - a.score)
      .slice(0, 5);
  }, [vendors]);

  const categoryDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    vendors.forEach(v => { counts[v.category] = (counts[v.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vendors]);

  const leadTimeComparisonData = useMemo(() => {
    const avgs: Record<string, { sum: number; count: number }> = {};
    vendors.forEach(v => {
      if (!avgs[v.category]) avgs[v.category] = { sum: 0, count: 0 };
      avgs[v.category].sum += v.averageLeadTimeDays;
      avgs[v.category].count += 1;
    });
    const categoryAvgs: Record<string, number> = {};
    Object.entries(avgs).forEach(([cat, d]) => { categoryAvgs[cat] = Number((d.sum / d.count).toFixed(1)); });

    return vendors.slice(0, 6).map(v => ({
      name: v.name.split(" ")[0],
      Vendor: v.averageLeadTimeDays,
      "Category Average": categoryAvgs[v.category] || 0,
    }));
  }, [vendors]);

  const spendDistributionData = useMemo(() => {
    const spends: Record<string, number> = {};
    const rawOrders = ordersQuery.data?.purchaseOrders || [];
    vendors.forEach(v => { spends[v.name] = 0; });
    rawOrders.forEach(po => { if (spends[po.vendorName] !== undefined) spends[po.vendorName] += po.amount; });
    
    vendors.forEach(v => {
      if (spends[v.name] === 0) spends[v.name] = getExtendedVendorDetails(v).totalSpend;
    });

    return Object.entries(spends)
      .map(([name, value]) => ({ name: name.split(" ")[0], value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 5);
  }, [vendors, ordersQuery.data]);

  if (query.isLoading) return <LoadingStateCard title="Loading Vendor Performance Center" />;
  if (query.error) return <ErrorStateCard message="Vendor performance records are currently offline." />;

  return (
    <section className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-page-title font-secondary text-text-primary">Vendor Performance Center</h1>
            <Badge tone="info" className="px-2.5 py-0.5 text-xs font-semibold">{totalCount} Total</Badge>
          </div>
          <p className="max-w-3xl text-body text-text-secondary">
            Monitor supplier performance, reliability metrics, procurement efficiency, and sourcing risks across all active vendors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleRefresh} className="flex items-center gap-1.5">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="secondary" onClick={handleExport} className="flex items-center gap-1.5">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={() => {
            setEditingVendorId(null);
            setForm({
              name: "",
              category: "Cement",
              contactPerson: "",
              email: "",
              phone: "",
              city: "",
              address: "",
              gstin: "",
              averageLeadTimeDays: "",
              reliabilityScore: "",
              paymentTerms: "30 Days Credit",
              status: "Active",
            });
            setIsDrawerOpen(true);
          }} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Register Vendor
          </Button>
        </div>
      </div>

      {/* 2. VENDOR PERFORMANCE KPIs (8 KPI cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Vendors</p>
            <p className="text-2xl font-bold text-text-primary">{totalCount}</p>
            <div className="h-6 mt-2">
              <VendorSparkline values={[15, 17, 18, 20, 22, totalCount]} color={chartPalette.blue} />
            </div>
            <p className="text-[10px] text-text-muted mt-1">Growth: +2 this month</p>
          </div>
        </Card>

        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Active Suppliers</p>
            <p className="text-2xl font-bold text-text-primary">{activeCount}</p>
            <div className="h-6 mt-2">
              <VendorSparkline values={[12, 14, 15, 16, 17, activeCount]} color={chartPalette.green} />
            </div>
            <p className="text-[10px] text-success font-semibold mt-1">82% Participation</p>
          </div>
        </Card>

        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Categories</p>
            <p className="text-2xl font-bold text-text-primary">{categoriesCount}</p>
            <div className="h-6 mt-2">
              <VendorSparkline values={[4, 4, 5, 5, 5, categoriesCount]} color={chartPalette.cyan} />
            </div>
            <p className="text-[10px] text-text-muted mt-1">Full construction coverage</p>
          </div>
        </Card>

        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Avg Reliability</p>
            <p className="text-2xl font-bold text-text-primary">{avgReliability}%</p>
            <div className="h-6 mt-2">
              <VendorSparkline values={[85, 87, 86, 89, 91, avgReliability]} color={chartPalette.blue} />
            </div>
            <p className="text-[10px] text-success font-semibold mt-1">+4% improvement</p>
          </div>
        </Card>

        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Avg Lead Time</p>
            <p className="text-2xl font-bold text-text-primary">{avgLeadTime}d</p>
            <div className="h-6 mt-2">
              <VendorSparkline values={[7.8, 7.5, 7.2, 6.9, 6.6, Number(avgLeadTime)]} color={chartPalette.green} />
            </div>
            <p className="text-[10px] text-success font-semibold mt-1">-1.2d cycle speed</p>
          </div>
        </Card>

        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Active POs</p>
            <p className="text-2xl font-bold text-text-primary">{activeOrdersCount}</p>
            <div className="h-6 mt-2">
              <VendorSparkline values={[10, 14, 18, 15, 12, activeOrdersCount]} color={chartPalette.amber} />
            </div>
            <p className="text-[10px] text-text-muted mt-1">Pending delivery flow</p>
          </div>
        </Card>

        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">High Risk</p>
            <p className="text-2xl font-bold text-text-primary text-error">{highRiskCount}</p>
            <div className="h-6 mt-2">
              <VendorSparkline values={[4, 5, 4, 3, 2, highRiskCount]} color={chartPalette.red} />
            </div>
            <p className="text-[10px] text-error font-semibold mt-1">Score below 85%</p>
          </div>
        </Card>

        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Dependency Score</p>
            <p className="text-2xl font-bold text-text-primary">{dependencyScore}%</p>
            <div className="h-6 mt-2">
              <VendorSparkline values={[45, 43, 44, 41, 40, dependencyScore]} color={chartPalette.amber} />
            </div>
            <p className="text-[10px] text-warning font-semibold mt-1">Max spend concentration</p>
          </div>
        </Card>
      </div>

      {/* 3. VENDOR ANALYTICS DASHBOARD + SIDE PANEL */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Vendor Performance Leaderboard */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Vendor Performance Leaderboard</CardTitle>
            <p className="text-xs text-text-muted font-medium">Top performers first by reliability score</p>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaderboardData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(15,23,42,0.06)" />
                <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                <Bar dataKey="score" fill={chartPalette.blue} radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Vendor Category Distribution */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Vendor Category Distribution</CardTitle>
            <p className="text-xs text-text-muted font-medium">Breakdown of supplier base across material sectors</p>
          </CardHeader>
          <CardContent className="h-64 pt-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-[42%] left-[50%] -translate-x-[50%] -translate-y-[50%] text-center">
              <p className="text-2xl font-bold text-text-primary">{totalCount}</p>
              <p className="text-[10px] font-medium text-text-muted uppercase">Vendors</p>
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Lead Time Analysis */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Lead Time Analysis</CardTitle>
            <p className="text-xs text-text-muted font-medium">Vendor lead time vs Category Average (Days)</p>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadTimeComparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Vendor" fill={chartPalette.blue} radius={[4, 4, 0, 0]} barSize={10} />
                <Bar dataKey="Category Average" fill={chartPalette.cyan} radius={[4, 4, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 4: Spend Distribution */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Procurement Spend Distribution</CardTitle>
            <p className="text-xs text-text-muted font-medium">Distribution of sourcing expenditure (INR)</p>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {spendDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Total Spend"]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT SIDE PANEL — Supplier Performance Alerts */}
      <div className="space-y-5">
        <Card className="border border-border-soft shadow-soft overflow-hidden">
          <CardHeader className="border-b border-border-soft/50 px-5 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary">Supplier Performance</CardTitle>
              <ShieldAlert className="h-4 w-4 text-text-muted" />
            </div>
          </CardHeader>
          <CardContent className="px-4 py-4 space-y-4">
            <div className="flex gap-3 p-3 rounded-xl border border-error-soft bg-error-soft/10">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-error text-surface">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-error uppercase tracking-wider">Risk Alert</p>
                <p className="text-xs font-medium text-text-primary mt-0.5 leading-snug">3 critical vendors below reliability threshold.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-xl border border-warning-soft bg-warning-soft/10">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning text-surface">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-warning uppercase tracking-wider">Dependency Warning</p>
                <p className="text-xs font-medium text-text-primary mt-0.5 leading-snug">42% steel procurement depends on Shakti Cement.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-xl border border-success-soft bg-success-soft/10">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success text-surface">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-success uppercase tracking-wider">Delivery Opportunity</p>
                <p className="text-xs font-medium text-text-primary mt-0.5 leading-snug">Metro Steel delivers 28% faster than category avg.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-xl border border-accent-primary/20 bg-accent-primary/5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary text-surface">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-accent-primary uppercase tracking-wider">Contract Renewal</p>
                <p className="text-xs font-medium text-text-primary mt-0.5 leading-snug">2 supplier agreements expiring this month.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border-soft shadow-soft overflow-hidden">
          <CardHeader className="border-b border-border-soft/50 px-5 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-4 space-y-2">
            <Button variant="secondary" className="w-full justify-start gap-2 text-xs h-9" onClick={handleRefresh}>
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh Performance Data
            </Button>
            <Button variant="secondary" className="w-full justify-start gap-2 text-xs h-9" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export Vendor Report
            </Button>
            <Button className="w-full justify-start gap-2 text-xs h-9" onClick={() => {
              setEditingVendorId(null);
              setForm({
                name: "", category: "Cement", contactPerson: "", email: "", phone: "",
                city: "", address: "", gstin: "", averageLeadTimeDays: "", reliabilityScore: "",
                paymentTerms: "30 Days Credit", status: "Active",
              });
              setIsDrawerOpen(true);
            }}>
              <Plus className="h-3.5 w-3.5" /> Add New Vendor
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border-soft shadow-soft overflow-hidden bg-gradient-to-br from-accent-primary/5 to-transparent">
          <CardContent className="px-4 py-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-primary" />
              <p className="text-xs font-bold text-text-primary">AI Insight</p>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              {highRiskCount > 0
                ? `${highRiskCount} vendors need attention — consider initiating performance reviews or sourcing alternatives for critical categories.`
                : `Your vendor base is healthy with ${activeCount} active suppliers across ${categoriesCount} categories.`}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>

    {/* 5. VENDOR REGISTER (Full Width Table) */}
      <Card className="border border-border-soft shadow-soft overflow-hidden">
        {/* TOOLBAR */}
        <div className="p-5 border-b border-border-soft space-y-4 bg-surface-secondary/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-text-primary">Suppliers Directory</h2>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Multi-field search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, GSTIN, contact, city..."
                  className="pl-9 w-64 h-9"
                />
              </div>

              {/* Filters */}
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary h-9 outline-none">
                <option value="All">All Categories</option>
                <option value="Cement">Cement</option>
                <option value="Steel">Steel</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Finishing">Finishing</option>
              </select>

              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary h-9 outline-none">
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select value={reliabilityFilter} onChange={(event) => setReliabilityFilter(event.target.value)} className="rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary h-9 outline-none">
                <option value="All">All Reliability</option>
                <option value="High (>=90%)">High (&gt;=90%)</option>
                <option value="Mid (80-89%)">Mid (80-89%)</option>
                <option value="Critical (<80%)">Critical (&lt;80%)</option>
              </select>

              <select value={leadTimeFilter} onChange={(event) => setLeadTimeFilter(event.target.value)} className="rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary h-9 outline-none">
                <option value="All">All Lead Times</option>
                <option value="Fast (<=2 days)">Fast (&lt;=2 days)</option>
                <option value="Moderate (3-5 days)">Moderate (3-5 days)</option>
                <option value="Slow (>5 days)">Slow (&gt;5 days)</option>
              </select>

              <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary h-9 outline-none">
                <option value="All">All Cities</option>
                {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Active Filters Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {categoryFilter !== "All" && (
              <Badge tone="info" className="flex items-center gap-1 cursor-pointer" onClick={() => setCategoryFilter("All")}>
                Category: {categoryFilter} ✕
              </Badge>
            )}
            {statusFilter !== "All" && (
              <Badge tone="info" className="flex items-center gap-1 cursor-pointer" onClick={() => setStatusFilter("All")}>
                Status: {statusFilter} ✕
              </Badge>
            )}
            {cityFilter !== "All" && (
              <Badge tone="info" className="flex items-center gap-1 cursor-pointer" onClick={() => setCityFilter("All")}>
                City: {cityFilter} ✕
              </Badge>
            )}
            {reliabilityFilter !== "All" && (
              <Badge tone="info" className="flex items-center gap-1 cursor-pointer" onClick={() => setReliabilityFilter("All")}>
                Reliability: {reliabilityFilter} ✕
              </Badge>
            )}
            {leadTimeFilter !== "All" && (
              <Badge tone="info" className="flex items-center gap-1 cursor-pointer" onClick={() => setLeadTimeFilter("All")}>
                Lead Time: {leadTimeFilter} ✕
              </Badge>
            )}
            {(categoryFilter !== "All" || statusFilter !== "All" || cityFilter !== "All" || reliabilityFilter !== "All" || leadTimeFilter !== "All") && (
              <Button variant="ghost" size="sm" onClick={() => {
                setCategoryFilter("All");
                setStatusFilter("All");
                setCityFilter("All");
                setReliabilityFilter("All");
                setLeadTimeFilter("All");
              }} className="text-xs text-text-muted hover:text-text-primary h-7 px-2">
                Clear all filters
              </Button>
            )}
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-table min-w-[1200px]">
            <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft">
              <tr className="h-12 text-left">
                <th className="px-5 font-semibold">Vendor</th>
                <th className="px-5 font-semibold">Category</th>
                <th className="px-5 font-semibold">City</th>
                <th className="px-5 font-semibold">Contact Person</th>
                <th className="px-5 font-semibold">Lead Time</th>
                <th className="px-5 font-semibold">Reliability</th>
                <th className="px-5 font-semibold">Total Orders</th>
                <th className="px-5 font-semibold">Total Spend</th>
                <th className="px-5 font-semibold">Last Order</th>
                <th className="px-5 font-semibold">Status</th>
                <th className="px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVendors.length > 0 ? (
                paginatedVendors.map((vendor) => {
                  const details = getExtendedVendorDetails(vendor);
                  const vendorOrders = ordersQuery.data?.purchaseOrders.filter((po) => po.vendorId === vendor.id) || [];
                  const ordersCount = vendorOrders.length || details.ordersThisYear;
                  const spendVal = vendorOrders.reduce((sum, po) => sum + po.amount, 0) || details.totalSpend;

                  return (
                    <tr
                      key={vendor.id}
                      onClick={() => router.push(`/purchases/vendors/${vendor.id}`)}
                      className="border-b border-border-soft cursor-pointer hover:bg-surface-secondary/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-text-primary">{vendor.name}</p>
                          <p className="text-label text-text-muted font-mono">{vendor.gstin}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="info">{vendor.category}</Badge>
                      </td>
                      <td className="px-5 py-4 text-text-secondary">{vendor.city}</td>
                      <td className="px-5 py-4 text-text-secondary">{details.contactPerson}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className={`h-4 w-4 ${vendor.averageLeadTimeDays <= 3 ? "text-success" : vendor.averageLeadTimeDays <= 5 ? "text-warning" : "text-error"}`} />
                          <span>{vendor.averageLeadTimeDays} days</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 w-40">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold">{vendor.reliabilityScore}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-hover">
                            <div
                              className={`h-1.5 rounded-full ${vendor.reliabilityScore >= 90 ? "bg-success" : vendor.reliabilityScore >= 80 ? "bg-warning" : "bg-error"}`}
                              style={{ width: `${vendor.reliabilityScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-text-primary font-medium">{ordersCount}</td>
                      <td className="px-5 py-4 text-text-primary font-semibold">{formatCurrency(spendVal)}</td>
                      <td className="px-5 py-4 text-text-secondary">{vendor.lastOrderDate ? formatDate(vendor.lastOrderDate) : "N/A"}</td>
                      <td className="px-5 py-4">
                        <Badge tone={toneForStatus(vendor.status)}>{vendor.status}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingVendorId(vendor.id);
                              setForm({
                                name: vendor.name,
                                category: vendor.category,
                                contactPerson: details.contactPerson,
                                email: details.email,
                                phone: details.phone,
                                city: vendor.city,
                                address: details.address,
                                gstin: vendor.gstin,
                                averageLeadTimeDays: `${vendor.averageLeadTimeDays}`,
                                reliabilityScore: `${vendor.reliabilityScore}`,
                                paymentTerms: details.paymentTerms,
                                status: vendor.status,
                              });
                              setIsDrawerOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          {vendor.status !== "Inactive" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              loading={archiveMutation.isPending}
                              onClick={(event) => {
                                event.stopPropagation();
                                archiveMutation.mutate(vendor.id);
                              }}
                              className="text-text-error hover:bg-error-soft/10"
                            >
                              Archive
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="h-32 text-center text-text-muted">
                  <td colSpan={11} className="px-5 py-4">
                    <div className="space-y-2">
                      <Info className="h-6 w-6 mx-auto text-text-muted" />
                      <p className="text-body font-medium">No vendors found matching filters</p>
                      <p className="text-xs">Adjust search parameters or category filter and try again.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="p-4 border-t border-border-soft flex flex-wrap items-center justify-between gap-4 bg-surface-secondary/10">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-[var(--radius-input)] border border-border-soft bg-surface px-2 py-1 text-xs font-semibold text-text-primary"
            >
              {[10, 25, 50, 100].map((rows) => (
                <option key={rows} value={rows}>{rows}</option>
              ))}
            </select>
            <span className="text-xs text-text-muted">
              Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, visibleVendors.length)} of {visibleVendors.length} Vendors
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              First
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Prev
            </Button>
            <span className="text-xs font-semibold px-2">Page {currentPage} of {totalPages}</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              Last
            </Button>
          </div>
        </div>
      </Card>

      {/* ADD / EDIT DRAWER */}
      <Drawer
        open={isDrawerOpen}
        title={editingVendorId ? "Edit Vendor Sourcing Details" : "Register New Vendor"}
        size="md"
        onClose={() => setIsDrawerOpen(false)}
      >
        <div className="space-y-4 pb-12">
          <div className="space-y-1">
            <label className="text-label text-text-secondary">Vendor Name</label>
            <Input value={form.name} onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Category</label>
              <select value={form.category} onChange={(event) => setForm((c) => ({ ...c, category: event.target.value }))} className={selectClassName}>
                <option value="Cement">Cement</option>
                <option value="Steel">Steel</option>
                <option value="Electrical">Electrical</option>
                <option value="Finishing">Finishing</option>
                <option value="Plumbing">Plumbing</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Status</label>
              <select value={form.status} onChange={(event) => setForm((c) => ({ ...c, status: event.target.value }))} className={selectClassName}>
                <option value="Active">Active</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Contact Person</label>
              <Input value={form.contactPerson} onChange={(event) => setForm((c) => ({ ...c, contactPerson: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Phone Number</label>
              <Input value={form.phone} onChange={(event) => setForm((c) => ({ ...c, phone: event.target.value }))} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-label text-text-secondary">Email Address</label>
            <Input value={form.email} onChange={(event) => setForm((c) => ({ ...c, email: event.target.value }))} />
          </div>

          <div className="space-y-1">
            <label className="text-label text-text-secondary">City</label>
            <Input value={form.city} onChange={(event) => setForm((c) => ({ ...c, city: event.target.value }))} />
          </div>

          <div className="space-y-1">
            <label className="text-label text-text-secondary">Full Address</label>
            <Input value={form.address} onChange={(event) => setForm((c) => ({ ...c, address: event.target.value }))} />
          </div>

          <div className="space-y-1">
            <label className="text-label text-text-secondary">GSTIN</label>
            <Input value={form.gstin} onChange={(event) => setForm((c) => ({ ...c, gstin: event.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Lead Time (days)</label>
              <Input value={form.averageLeadTimeDays} onChange={(event) => setForm((c) => ({ ...c, averageLeadTimeDays: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Reliability Score (%)</label>
              <Input value={form.reliabilityScore} onChange={(event) => setForm((c) => ({ ...c, reliabilityScore: event.target.value }))} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-label text-text-secondary">Payment Terms</label>
            <Input value={form.paymentTerms} onChange={(event) => setForm((c) => ({ ...c, paymentTerms: event.target.value }))} />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border-soft bg-surface sticky bottom-0">
            <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              <PackagePlus className="h-4 w-4" /> Save Vendor
            </Button>
          </div>
        </div>
      </Drawer>
    </section>
  );
}

export function PurchaseRequestsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const projectsQuery = useProjectsSummary();
  const query = useQuery({
    queryKey: ["erp-purchase-requests", role],
    queryFn: async () => (await apiRequest<PurchaseRequestsResponse>("/api/procurement/requests", { role })).data,
  });
  const [form, setForm] = useState({
    title: "",
    projectId: "",
    materialCategory: "Cement",
    quantity: "",
    unit: "bags",
    priority: "Medium",
    requiredBy: "",
  });
  const mutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/procurement/requests", {
        role,
        method: "POST",
        body: { ...form, quantity: Number(form.quantity) },
      }),
    onSuccess: async () => {
      setForm({ title: "", projectId: "", materialCategory: "Cement", quantity: "", unit: "bags", priority: "Medium", requiredBy: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-purchase-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projectsQuery.data?.projects[0]?.id || "" }));
    }
  }, [form.projectId, projectsQuery.data?.projects]);

  if (projectsQuery.isLoading || query.isLoading) return <LoadingStateCard title="Loading purchase requests" />;
  if (projectsQuery.error || query.error || !projectsQuery.data || !query.data) return <ErrorStateCard message="Purchase request data is unavailable." />;

  return (
    <section className="space-y-6">
      <SectionHeader title="Purchase Requests" description="Procurement demand intake for project material needs, with priorities and required-by timelines." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Request Queue</CardTitle></CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[920px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Request</th>
                    <th className="px-4 text-left">Project</th>
                    <th className="px-4 text-left">Category</th>
                    <th className="px-4 text-left">Qty</th>
                    <th className="px-4 text-left">Required By</th>
                    <th className="px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.requests.map((request) => (
                    <tr key={request.id} className="border-t border-border-soft">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-text-primary">{request.title}</p>
                          <p className="text-label text-text-muted">Requested by {request.requestedByName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">{request.projectName}</td>
                      <td className="px-4 py-4">{request.materialCategory}</td>
                      <td className="px-4 py-4">{request.quantity} {request.unit}</td>
                      <td className="px-4 py-4">{formatDate(request.requiredBy)}</td>
                      <td className="px-4 py-4"><Badge tone={toneForStatus(request.status)}>{request.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Create Request</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><label className="text-label text-text-secondary">Title</label><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Project</label><select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} className={selectClassName}>{projectsQuery.data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1"><label className="text-label text-text-secondary">Category</label><select value={form.materialCategory} onChange={(event) => setForm((current) => ({ ...current, materialCategory: event.target.value }))} className={selectClassName}><option>Cement</option><option>Steel</option><option>Electrical</option><option>Finishing</option></select></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Priority</label><select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className={selectClassName}><option>High</option><option>Medium</option><option>Low</option></select></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1"><label className="text-label text-text-secondary">Quantity</label><Input value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} /></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Unit</label><Input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} /></div>
            </div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Required by</label><Input type="date" value={form.requiredBy} onChange={(event) => setForm((current) => ({ ...current, requiredBy: event.target.value }))} /></div>
            <div className="flex justify-end"><Button loading={mutation.isPending} onClick={() => mutation.mutate()}><PackagePlus className="h-4 w-4" />Raise Request</Button></div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function QuotationsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const requestsQuery = useQuery({
    queryKey: ["erp-purchase-requests", role],
    queryFn: async () => (await apiRequest<PurchaseRequestsResponse>("/api/procurement/requests", { role })).data,
  });
  const vendorsQuery = useQuery({
    queryKey: ["erp-vendors", role],
    queryFn: async () => (await apiRequest<VendorsResponse>("/api/procurement/vendors", { role })).data,
  });
  const query = useQuery({
    queryKey: ["erp-quotations", role],
    queryFn: async () => (await apiRequest<QuotationsResponse>("/api/procurement/quotations", { role })).data,
  });
  const [form, setForm] = useState({
    requestId: "",
    vendorId: "",
    totalAmount: "",
    deliveryDays: "",
    paymentTerms: "30% advance, balance on delivery",
    qualityScore: "",
    status: "Received",
  });

  const mutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/procurement/quotations", {
        role,
        method: "POST",
        body: {
          ...form,
          totalAmount: Number(form.totalAmount),
          deliveryDays: Number(form.deliveryDays),
          qualityScore: Number(form.qualityScore),
        },
      }),
    onSuccess: async () => {
      setForm((current) => ({
        ...current,
        totalAmount: "",
        deliveryDays: "",
        qualityScore: "",
      }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-quotations"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  useEffect(() => {
    if (!form.requestId && requestsQuery.data?.requests[0]?.id) {
      setForm((current) => ({ ...current, requestId: requestsQuery.data?.requests[0]?.id || "" }));
    }
  }, [form.requestId, requestsQuery.data?.requests]);

  useEffect(() => {
    if (!form.vendorId && vendorsQuery.data?.vendors[0]?.id) {
      setForm((current) => ({ ...current, vendorId: vendorsQuery.data?.vendors[0]?.id || "" }));
    }
  }, [form.vendorId, vendorsQuery.data?.vendors]);

  if (query.isLoading || requestsQuery.isLoading || vendorsQuery.isLoading) return <LoadingStateCard title="Loading quotations" />;
  if (query.error || requestsQuery.error || vendorsQuery.error || !query.data || !requestsQuery.data || !vendorsQuery.data) return <ErrorStateCard message="Quotation data is unavailable." />;

  return (
    <section className="space-y-6">
      <SectionHeader title="Quotation Comparison" description="Vendor quote comparison across request, price, lead time, quality score, and commercial status." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Quotation Register</CardTitle></CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[980px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Request</th>
                    <th className="px-4 text-left">Vendor</th>
                    <th className="px-4 text-left">Amount</th>
                    <th className="px-4 text-left">Delivery</th>
                    <th className="px-4 text-left">Quality</th>
                    <th className="px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.quotations.map((quotation) => (
                    <tr key={quotation.id} className="border-t border-border-soft">
                      <td className="px-4 py-4 text-text-primary">{quotation.requestTitle}</td>
                      <td className="px-4 py-4">{quotation.vendorName}</td>
                      <td className="px-4 py-4 text-text-primary">{formatCurrency(quotation.totalAmount)}</td>
                      <td className="px-4 py-4">{quotation.deliveryDays} days</td>
                      <td className="px-4 py-4">{quotation.qualityScore}%</td>
                      <td className="px-4 py-4"><Badge tone={toneForStatus(quotation.status)}>{quotation.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Create Quotation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><label className="text-label text-text-secondary">Request</label><select value={form.requestId} onChange={(event) => setForm((current) => ({ ...current, requestId: event.target.value }))} className={selectClassName}>{requestsQuery.data.requests.map((request) => <option key={request.id} value={request.id}>{request.title}</option>)}</select></div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Vendor</label><select value={form.vendorId} onChange={(event) => setForm((current) => ({ ...current, vendorId: event.target.value }))} className={selectClassName}>{vendorsQuery.data.vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1"><label className="text-label text-text-secondary">Amount</label><Input value={form.totalAmount} onChange={(event) => setForm((current) => ({ ...current, totalAmount: event.target.value }))} /></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Delivery days</label><Input value={form.deliveryDays} onChange={(event) => setForm((current) => ({ ...current, deliveryDays: event.target.value }))} /></div>
            </div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Payment terms</label><Input value={form.paymentTerms} onChange={(event) => setForm((current) => ({ ...current, paymentTerms: event.target.value }))} /></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1"><label className="text-label text-text-secondary">Quality score</label><Input value={form.qualityScore} onChange={(event) => setForm((current) => ({ ...current, qualityScore: event.target.value }))} /></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Status</label><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={selectClassName}><option value="Received">Received</option><option value="Shortlisted">Shortlisted</option><option value="Rejected">Rejected</option></select></div>
            </div>
            <div className="flex justify-end"><Button loading={mutation.isPending} onClick={() => mutation.mutate()}><PackagePlus className="h-4 w-4" />Add Quotation</Button></div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function PurchaseOrdersWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  // Table Pagination & Sorting
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Drawers State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // Queries
  const requestsQuery = useQuery({
    queryKey: ["erp-purchase-requests", role],
    queryFn: async () => (await apiRequest<PurchaseRequestsResponse>("/api/procurement/requests", { role })).data,
  });
  const vendorsQuery = useQuery({
    queryKey: ["erp-vendors", role],
    queryFn: async () => (await apiRequest<VendorsResponse>("/api/procurement/vendors", { role })).data,
  });
  const projectsQuery = useProjectsSummary();
  const query = useQuery({
    queryKey: ["erp-purchase-orders", role],
    queryFn: async () => (await apiRequest<PurchaseOrdersResponse>("/api/procurement/purchase-orders", { role })).data,
  });

  // Create PO Form State
  const [form, setForm] = useState<{
    requestId: string;
    vendorId: string;
    projectId: string;
    expectedDelivery: string;
    paymentTerms: string;
    deliveryTerms: string;
    notes: string;
    documentUrl: string;
    lineItems: LineItem[];
  }>({
    requestId: "",
    vendorId: "",
    projectId: "",
    expectedDelivery: "",
    paymentTerms: "Net 30 days upon delivery and invoice submission",
    deliveryTerms: "FOB Destination (delivered to project site)",
    notes: "",
    documentUrl: "",
    lineItems: [
      { item: "", category: "Cement", quantity: 100, unit: "bags", rate: 450, tax: 8100, amount: 45000 },
    ],
  });

  // Form helpers
  const addFormLineItem = () => {
    setForm((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { item: "", category: "Steel", quantity: 1, unit: "units", rate: 0, tax: 0, amount: 0 },
      ],
    }));
  };

  const removeFormLineItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  };

  const updateFormLineItem = (index: number, field: keyof LineItem, value: any) => {
    setForm((prev) => {
      const items = [...prev.lineItems];
      const updated = { ...items[index], [field]: value };
      
      if (field === "rate" || field === "quantity") {
        const qty = Number(field === "quantity" ? value : updated.quantity) || 0;
        const rate = Number(field === "rate" ? value : updated.rate) || 0;
        updated.amount = qty * rate;
        updated.tax = Math.round(updated.amount * 0.18);
      }
      
      items[index] = updated;
      return { ...prev, lineItems: items };
    });
  };

  // Create Mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const calculatedAmount = form.lineItems.reduce((sum, item) => sum + item.amount + (item.tax || 0), 0);
      return apiRequest("/api/procurement/purchase-orders", {
        role,
        method: "POST",
        body: {
          ...form,
          amount: calculatedAmount,
        },
      });
    },
    onSuccess: async () => {
      setForm({
        requestId: requestsQuery.data?.requests[0]?.id || "",
        vendorId: vendorsQuery.data?.vendors[0]?.id || "",
        projectId: projectsQuery.data?.projects[0]?.id || "",
        expectedDelivery: "",
        paymentTerms: "Net 30 days upon delivery and invoice submission",
        deliveryTerms: "FOB Destination (delivered to project site)",
        notes: "",
        documentUrl: "",
        lineItems: [
          { item: "", category: "Cement", quantity: 100, unit: "bags", rate: 450, tax: 8100, amount: 45000 },
        ],
      });
      setDrawerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-purchase-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  // Seed default selections
  useEffect(() => {
    if (!form.requestId && requestsQuery.data?.requests[0]?.id) {
      setForm((current) => ({ ...current, requestId: requestsQuery.data?.requests[0]?.id || "" }));
    }
  }, [form.requestId, requestsQuery.data?.requests]);

  useEffect(() => {
    if (!form.vendorId && vendorsQuery.data?.vendors[0]?.id) {
      setForm((current) => ({ ...current, vendorId: vendorsQuery.data?.vendors[0]?.id || "" }));
    }
  }, [form.vendorId, vendorsQuery.data?.vendors]);

  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projectsQuery.data?.projects[0]?.id || "" }));
    }
  }, [form.projectId, projectsQuery.data?.projects]);

  if (query.isLoading || requestsQuery.isLoading || vendorsQuery.isLoading || projectsQuery.isLoading) {
    return <LoadingStateCard title="Loading Procurement Operations Dashboard..." variant="dashboard" />;
  }

  if (query.error || requestsQuery.error || vendorsQuery.error || projectsQuery.error || !query.data || !requestsQuery.data || !vendorsQuery.data || !projectsQuery.data) {
    return <ErrorStateCard message="Procurement data could not be loaded." />;
  }

  const allPOs = query.data.purchaseOrders;

  // 1. Filter Purchase Orders
  const filteredPurchaseOrders = allPOs.filter((order) => {
    const needle = search.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      order.id.toLowerCase().includes(needle) ||
      order.projectName.toLowerCase().includes(needle) ||
      order.vendorName.toLowerCase().includes(needle) ||
      (order.requestTitle && order.requestTitle.toLowerCase().includes(needle));

    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    const matchesProject = projectFilter === "All" || order.projectId === projectFilter;
    const matchesVendor = vendorFilter === "All" || order.vendorId === vendorFilter;
    
    // Check line items for category matches
    const mainCategory = order.lineItems?.[0]?.category || "Steel";
    const matchesCategory = categoryFilter === "All" || mainCategory === categoryFilter;

    // Date range matches
    const poTime = new Date(order.createdAt).getTime();
    const matchesDate =
      (!dateRange.start || poTime >= new Date(dateRange.start).getTime()) &&
      (!dateRange.end || poTime <= new Date(dateRange.end).getTime() + 24 * 60 * 60 * 1000);

    return matchesSearch && matchesStatus && matchesProject && matchesVendor && matchesCategory && matchesDate;
  });

  // 2. Sort Purchase Orders
  const sortedPurchaseOrders = [...filteredPurchaseOrders].sort((a, b) => {
    let aVal: any = (a as any)[sortField];
    let bVal: any = (b as any)[sortField];

    // Handle special computed sorting
    if (sortField === "daysRemaining") {
      const aDays = Math.ceil((new Date(a.expectedDelivery).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      const bDays = Math.ceil((new Date(b.expectedDelivery).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      aVal = aDays;
      bVal = bDays;
    }

    if (aVal === undefined) return 1;
    if (bVal === undefined) return -1;

    if (typeof aVal === "string") {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  // 3. Paginate
  const totalRows = sortedPurchaseOrders.length;
  const totalPages = Math.ceil(totalRows / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const paginatedPOs = sortedPurchaseOrders.slice(startIndex, endIndex);

  // 4. Calculate KPIs (8 points)
  const totalCount = allPOs.length;
  const openCount = allPOs.filter((o) => !["Delivered", "Closed", "Cancelled"].includes(o.status)).length;
  const completedCount = allPOs.filter((o) => ["Delivered", "Closed"].includes(o.status)).length;
  const totalValue = allPOs.reduce((sum, o) => sum + o.amount, 0);
  const pendingDeliveries = allPOs.filter((o) => ["Released", "In Transit"].includes(o.status)).length;
  
  const overdueDeliveries = allPOs.filter((o) => {
    const isPastExpected = new Date(o.expectedDelivery).getTime() < Date.now();
    return isPastExpected && !["Delivered", "Closed", "Cancelled"].includes(o.status);
  }).length;

  const avgLeadTime = 12.4; // Days
  const efficiencyScore = totalCount ? Math.round(((totalCount - overdueDeliveries) / totalCount) * 100) : 100;

  // Mini Sparklines Dummy Data
  const sparklineData1 = [12, 19, 3, 5, 2, 3].map((v) => ({ v }));
  const sparklineData2 = [80, 81, 85, 82, 86, 90].map((v) => ({ v }));
  const sparklineData3 = [45, 52, 60, 68, 70, 78].map((v) => ({ v }));
  const sparklineData4 = [12.8, 13.2, 12.4, 13.5, 14.2, 12.8].map((v) => ({ v }));

  // Status distributions for Donut Chart
  const statusCounts = allPOs.reduce(
    (acc, order) => {
      const isPastExpected = new Date(order.expectedDelivery).getTime() < Date.now();
      if (!["Delivered", "Closed", "Cancelled"].includes(order.status) && isPastExpected) {
        acc.Delayed++;
      } else if (order.status === "Delivered" || order.status === "Closed") {
        acc.Delivered++;
      } else if (order.status === "Pending Approval") {
        acc.PendingApproval++;
      } else {
        acc.Open++;
      }
      return acc;
    },
    { Open: 0, Delivered: 0, Delayed: 0, PendingApproval: 0 }
  );

  const healthData = [
    { name: "Open Orders", value: statusCounts.Open, color: "#2563eb" },
    { name: "Delivered", value: statusCounts.Delivered, color: "#22c55e" },
    { name: "Delayed", value: statusCounts.Delayed, color: "#ef4444" },
    { name: "Pending Approval", value: statusCounts.PendingApproval, color: "#f59e0b" },
  ];

  // Category values grouping (Horizontal Bar Chart)
  const categoryValues = allPOs.reduce((acc: Record<string, number>, order) => {
    const category = order.lineItems?.[0]?.category || "Steel";
    acc[category] = (acc[category] || 0) + order.amount;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryValues).map(([name, value]) => ({
    name,
    Value: Math.round(value / 100000), // in Lakhs
  })).sort((a, b) => b.Value - a.Value);

  // Vendor Performance donut chart
  const vendorPerformanceData = [
    { name: "On Time", value: Math.round(completedCount * 0.85) || 12, color: "#22c55e" },
    { name: "Delayed", value: Math.round(openCount * 0.4) || 4, color: "#f59e0b" },
    { name: "Critical", value: overdueDeliveries || 2, color: "#ef4444" },
  ];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <section className="space-y-6">
      {/* SECTION 1: Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-5">
        <div>
          <h1 className="text-page-title font-bold text-text-primary">Purchase Orders Dashboard</h1>
          <p className="text-body text-text-secondary mt-1">
            Monitor committed spend, vendor performance, delivery schedules, and procurement analytics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["erp-purchase-orders"] })} className="gap-2">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export Register
          </Button>
          <Button variant="primary" size="sm" onClick={() => setDrawerOpen(true)} className="gap-1.5 shadow-active-nav">
            <Plus className="h-4 w-4" /> Create Purchase Order
          </Button>
        </div>
      </div>

      {/* SECTION 2: PROCUREMENT KPI STRIP (8 KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4 overflow-x-auto pb-2">
        {[
          { label: "Total POs", value: totalCount, trend: "+8.4%", tone: "info", desc: "vs last month", spark: sparklineData1 },
          { label: "Open Orders", value: openCount, trend: "-12%", tone: "warning", desc: "Fulfillment active", spark: sparklineData1 },
          { label: "Completed Orders", value: completedCount, trend: "+14.2%", tone: "success", desc: "Received at site", spark: sparklineData2 },
          { label: "Procuring Value", value: `₹${(totalValue / 10000000).toFixed(1)} Cr`, trend: "↑ 14.2%", tone: "success", desc: "vs last month", spark: sparklineData4 },
          { label: "Pending Deliveries", value: pendingDeliveries, trend: "Stable", tone: "info", desc: "In transit/released", spark: sparklineData3 },
          { label: "Overdue Deliveries", value: overdueDeliveries, trend: "↓ 22%", tone: "error", desc: "Improving trend", spark: sparklineData1 },
          { label: "Avg Vendor Lead", value: `${avgLeadTime}d`, trend: "-1.2d", tone: "success", desc: "Response window", spark: sparklineData2 },
          { label: "Procurement Score", value: `${efficiencyScore}%`, trend: "↑ 3.1%", tone: "success", desc: "High efficiency", spark: sparklineData2 },
        ].map((kpi, idx) => (
          <Card key={idx} className="surface-card p-4 flex flex-col justify-between min-w-[140px]">
            <div className="space-y-1">
              <span className="text-label text-text-muted block truncate font-medium">{kpi.label}</span>
              <span className="text-2xl font-bold text-text-primary block tracking-tight">{kpi.value}</span>
            </div>
            
            {/* Sparkline & Trend */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="h-6 w-12 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpi.spark}>
                    <Area type="monotone" dataKey="v" stroke={kpi.tone === "success" ? "#22c55e" : kpi.tone === "error" ? "#ef4444" : "#2563eb"} fill="none" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <span className={`text-label font-bold shrink-0 ${
                kpi.tone === "success" ? "text-success" : kpi.tone === "error" ? "text-error" : "text-text-muted"
              }`}>{kpi.trend}</span>
            </div>
            <span className="text-[10px] text-text-muted mt-1 block truncate">{kpi.desc}</span>
          </Card>
        ))}
      </div>

      {/* SECTION 3: PROCUREMENT PERFORMANCE OVERVIEW */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Health Donut */}
        <Card className="surface-card">
          <CardHeader className="border-b border-border-soft pb-3">
            <CardTitle className="text-section-title">Procurement Health Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col sm:flex-row items-center justify-around gap-6 h-[260px]">
            <div className="w-[180px] h-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-kpi-value text-2xl text-text-primary">{allPOs.length}</span>
                <span className="text-[11px] text-text-muted font-medium">Active Orders</span>
              </div>
            </div>
            
            {/* Donut Legend */}
            <div className="space-y-3 w-full max-w-[200px]">
              {healthData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-body">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-text-secondary font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Procurement Insights Panel */}
        <Card className="surface-card">
          <CardHeader className="border-b border-border-soft pb-3 flex items-center justify-between">
            <CardTitle className="text-section-title">Procurement Insights Panel</CardTitle>
            <Badge tone="neutral" className="gap-1 text-[11px]"><Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Sourcing Advisory</Badge>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 max-h-[260px] overflow-y-auto">
            <div className="p-3 border-l-4 border-error bg-error/5 rounded-r-xl flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-error mt-0.5 shrink-0" />
              <div>
                <p className="text-body font-bold text-text-primary">Critical Delay Alerts</p>
                <p className="text-label text-text-secondary mt-0.5">Steel purchase orders are showing an average delay of 11 days.</p>
              </div>
            </div>

            <div className="p-3 border-l-4 border-warning bg-warning/5 rounded-r-xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-body font-bold text-text-primary">Vendor Risk Analysis</p>
                <p className="text-label text-text-secondary mt-0.5">Vendor ABC contributes 42% of overdue deliveries this quarter.</p>
              </div>
            </div>

            <div className="p-3 border-l-4 border-info bg-info/5 rounded-r-xl flex items-start gap-3">
              <Info className="h-5 w-5 text-info mt-0.5 shrink-0" />
              <div>
                <p className="text-body font-bold text-text-primary">Fulfillment Opportunity</p>
                <p className="text-label text-text-secondary mt-0.5">Electrical materials show increased demand (+18% volume demand) this month.</p>
              </div>
            </div>

            <div className="p-3 border-l-4 border-neutral bg-hover rounded-r-xl flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="text-body font-bold text-text-primary">Action Required</p>
                <p className="text-label text-text-secondary mt-0.5">8 purchase orders require immediate follow-up on delayed dispatch terms.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4: ANALYTICS DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Purchase Order Trend */}
        <Card className="surface-card">
          <CardHeader className="border-b border-border-soft pb-2">
            <CardTitle className="text-section-title">Purchase Order Trend (Monthly Volume)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: "Jan", orders: 28 },
                { month: "Feb", orders: 35 },
                { month: "Mar", orders: 48 },
                { month: "Apr", orders: 42 },
                { month: "May", orders: 60 },
                { month: "Jun", orders: 74 },
              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Procurement Value by Category */}
        <Card className="surface-card">
          <CardHeader className="border-b border-border-soft pb-2">
            <CardTitle className="text-section-title">Procurement Value by Category (₹ Lakhs)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData.length ? categoryChartData : [
                { name: "Steel", Value: 42 },
                { name: "Cement", Value: 31 },
                { name: "Electrical", Value: 18 },
                { name: "Plumbing", Value: 12 },
                { name: "Finishing", Value: 9 },
              ]} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="Value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 3: Vendor Performance Distribution */}
        <Card className="surface-card">
          <CardHeader className="border-b border-border-soft pb-2">
            <CardTitle className="text-section-title">Vendor Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-[260px] flex items-center justify-around gap-4">
            <div className="w-[160px] h-[160px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vendorPerformanceData}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {vendorPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {vendorPerformanceData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-6 justify-between text-body">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-text-secondary">{item.name}</span>
                  </div>
                  <span className="font-bold text-text-primary">{item.value} vendors</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Delivery Commitments */}
        <Card className="surface-card">
          <CardHeader className="border-b border-border-soft pb-2">
            <CardTitle className="text-section-title">Expected vs Actual Deliveries (Weekly)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { week: "Wk 1", Expected: 12, Actual: 10 },
                { week: "Wk 2", Expected: 15, Actual: 14 },
                { week: "Wk 3", Expected: 18, Actual: 15 },
                { week: "Wk 4", Expected: 14, Actual: 16 },
                { week: "Wk 5", Expected: 20, Actual: 19 },
                { week: "Wk 6", Expected: 22, Actual: 21 },
              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="Expected" stroke="#a855f7" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Actual" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 5: PURCHASE ORDER REGISTER TABLE */}
      <Card className="surface-card">
        <CardHeader className="border-b border-border-soft pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-section-title">Purchase Order Register</CardTitle>
              <p className="text-label text-text-muted mt-0.5">Filter and sort your procurement pipeline contracts.</p>
            </div>
            <span className="text-label text-text-muted font-bold shrink-0">
              Showing {startIndex + 1}-{Math.min(endIndex, totalRows)} of {totalRows} records
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          {/* Table Toolbar */}
          <div className="p-4 bg-surface-secondary/60 border-b border-border-soft flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
              <Input
                type="text"
                placeholder="Search PO, vendor, project"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9 h-10 w-full"
              />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="h-10 rounded-lg border border-border-soft bg-surface px-3 text-body">
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setCurrentPage(1); }} className="h-10 rounded-lg border border-border-soft bg-surface px-3 text-body max-w-[160px]">
              <option value="All">All Projects</option>
              {projectsQuery.data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={vendorFilter} onChange={(e) => { setVendorFilter(e.target.value); setCurrentPage(1); }} className="h-10 rounded-lg border border-border-soft bg-surface px-3 text-body max-w-[160px]">
              <option value="All">All Vendors</option>
              {vendorsQuery.data.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="h-10 rounded-lg border border-border-soft bg-surface px-3 text-body">
              <option value="All">All Categories</option>
              <option value="Steel">Steel</option>
              <option value="Cement">Cement</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Finishing">Finishing</option>
            </select>
            <div className="flex items-center gap-2 text-label">
              <span className="text-text-secondary">Date:</span>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setCurrentPage(1); }}
                className="h-10 w-[130px] p-2"
              />
              <span className="text-text-muted">to</span>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setCurrentPage(1); }}
                className="h-10 w-[130px] p-2"
              />
            </div>
            {(search || statusFilter !== "All" || projectFilter !== "All" || vendorFilter !== "All" || categoryFilter !== "All" || dateRange.start || dateRange.end) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setProjectFilter("All");
                  setVendorFilter("All");
                  setCategoryFilter("All");
                  setDateRange({ start: "", end: "" });
                  setCurrentPage(1);
                }}
                className="text-error"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-table border-collapse">
              <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft sticky top-0 z-10">
                <tr className="h-12 text-left">
                  <th className="px-6 cursor-pointer hover:bg-hover" onClick={() => handleSort("id")}>PO Number</th>
                  <th className="px-6 cursor-pointer hover:bg-hover" onClick={() => handleSort("vendorName")}>Vendor</th>
                  <th className="px-6 cursor-pointer hover:bg-hover" onClick={() => handleSort("projectName")}>Project</th>
                  <th className="px-6">Category</th>
                  <th className="px-6 cursor-pointer hover:bg-hover text-right" onClick={() => handleSort("amount")}>Order Value</th>
                  <th className="px-6 cursor-pointer hover:bg-hover" onClick={() => handleSort("createdAt")}>Created Date</th>
                  <th className="px-6 cursor-pointer hover:bg-hover" onClick={() => handleSort("expectedDelivery")}>Expected Delivery</th>
                  <th className="px-6 cursor-pointer hover:bg-hover" onClick={() => handleSort("daysRemaining")}>Days Remaining</th>
                  <th className="px-6 cursor-pointer hover:bg-hover" onClick={() => handleSort("status")}>Status</th>
                  <th className="px-6 text-center">Docs</th>
                  <th className="px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPOs.length ? paginatedPOs.map((order) => {
                  const daysLeft = Math.ceil((new Date(order.expectedDelivery).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                  const mainCategory = order.lineItems?.[0]?.category || "Steel";
                  const isDelivered = ["Delivered", "Closed"].includes(order.status);
                  
                  return (
                    <tr key={order.id} className="border-t border-border-soft h-14 hover:bg-hover/30 transition-colors">
                      <td className="px-6 font-bold text-accent-primary uppercase">
                        <Link href={`/purchases/purchase-orders/${order.id}`} className="hover:underline">
                          {order.id}
                        </Link>
                      </td>
                      <td className="px-6 text-text-primary font-medium">{order.vendorName}</td>
                      <td className="px-6 text-text-secondary">{order.projectName}</td>
                      <td className="px-6 text-text-secondary">{mainCategory}</td>
                      <td className="px-6 text-right font-bold text-text-primary">{formatCurrency(order.amount)}</td>
                      <td className="px-6 text-text-muted">{formatDate(order.createdAt)}</td>
                      <td className="px-6 text-text-muted">{formatDate(order.expectedDelivery)}</td>
                      <td className="px-6">
                        {isDelivered ? (
                          <span className="text-success font-medium">Completed</span>
                        ) : daysLeft < 0 ? (
                          <span className="text-error font-medium">Overdue by {Math.abs(daysLeft)} days</span>
                        ) : (
                          <span className="text-info font-medium">{daysLeft} Days Left</span>
                        )}
                      </td>
                      <td className="px-6">
                        <Badge tone={toneForStatus(order.status)}>{order.status}</Badge>
                      </td>
                      <td className="px-6 text-center">
                        {order.documentUrl ? (
                          <button
                            onClick={() => setPreviewDocUrl(order.documentUrl || null)}
                            className="p-1.5 text-accent-primary hover:bg-active-soft rounded-lg transition-all"
                            title="Preview PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-text-muted text-xs font-semibold">-</span>
                        )}
                      </td>
                      <td className="px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push(`/purchases/purchase-orders/${order.id}`)}
                            title="View Details"
                          >
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <TableEmptyStateRow
                    colSpan={11}
                    title="No purchase orders found matching the filter set"
                    description="Clear or adjust the dashboard filters to view active procurement orders."
                  />
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination Controls */}
          <div className="border-t border-border-soft p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-secondary/40">
            <div className="flex items-center gap-2 text-body">
              <span className="text-text-secondary">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="h-8 rounded border border-border-soft bg-surface px-2 text-body"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => c - 1)}
              >
                Previous
              </Button>
              <span className="text-body font-semibold text-text-primary px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => c + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CREATE PURCHASE ORDER DRAWER (XL) */}
      <Drawer
        open={drawerOpen}
        title="Create Purchase Order"
        size="xl"
        onClose={() => setDrawerOpen(false)}
      >
        <div className="space-y-6 pb-12">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-body font-bold text-text-primary border-b pb-2">1. Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Linked Purchase Request</label>
                <select
                  value={form.requestId}
                  onChange={(e) => setForm((prev) => ({ ...prev, requestId: e.target.value }))}
                  className={selectClassName}
                >
                  {requestsQuery.data.requests.map((r) => <option key={r.id} value={r.id}>{r.title} ({r.id.toUpperCase()})</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Vendor</label>
                <select
                  value={form.vendorId}
                  onChange={(e) => setForm((prev) => ({ ...prev, vendorId: e.target.value }))}
                  className={selectClassName}
                >
                  {vendorsQuery.data.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Project Site</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
                  className={selectClassName}
                >
                  {projectsQuery.data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Expected Delivery Date</label>
                <Input
                  type="date"
                  value={form.expectedDelivery}
                  onChange={(e) => setForm((prev) => ({ ...prev, expectedDelivery: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-body font-bold text-text-primary">2. Line Items</h3>
              <Button size="sm" onClick={addFormLineItem} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add Row
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-table border-collapse">
                <thead className="text-text-secondary bg-surface-secondary">
                  <tr>
                    <th className="p-2 text-left min-w-[200px]">Item Description</th>
                    <th className="p-2 text-left min-w-[120px]">Category</th>
                    <th className="p-2 text-right w-[90px]">Qty</th>
                    <th className="p-2 text-left w-[90px]">Unit</th>
                    <th className="p-2 text-right min-w-[120px]">Rate (INR)</th>
                    <th className="p-2 text-right min-w-[120px]">Tax (18%)</th>
                    <th className="p-2 text-right min-w-[120px]">Amount</th>
                    <th className="p-2 text-center w-[50px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.lineItems.map((item, index) => (
                    <tr key={index} className="border-t border-border-soft">
                      <td className="p-1">
                        <Input
                          value={item.item}
                          placeholder="e.g. Portland Cement Grade 53"
                          onChange={(e) => updateFormLineItem(index, "item", e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <select
                          value={item.category}
                          onChange={(e) => updateFormLineItem(index, "category", e.target.value)}
                          className="h-10 w-full rounded-lg border border-border-soft bg-surface px-2 text-body"
                        >
                          <option value="Steel">Steel</option>
                          <option value="Cement">Cement</option>
                          <option value="Electrical">Electrical</option>
                          <option value="Plumbing">Plumbing</option>
                          <option value="Finishing">Finishing</option>
                          <option value="Materials">Other Materials</option>
                        </select>
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={item.quantity}
                          className="text-right"
                          onChange={(e) => updateFormLineItem(index, "quantity", Number(e.target.value))}
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          value={item.unit}
                          placeholder="bags/tons"
                          onChange={(e) => updateFormLineItem(index, "unit", e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={item.rate}
                          className="text-right"
                          onChange={(e) => updateFormLineItem(index, "rate", Number(e.target.value))}
                        />
                      </td>
                      <td className="p-2 text-right text-text-secondary">
                        {formatCurrency(item.tax || Math.round(item.amount * 0.18))}
                      </td>
                      <td className="p-2 text-right font-semibold">
                        {formatCurrency(item.amount + (item.tax || 0))}
                      </td>
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeFormLineItem(index)}
                          className="p-1 hover:text-error rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Commercial Terms */}
          <div className="space-y-4">
            <h3 className="text-body font-bold text-text-primary border-b pb-2">3. Commercial Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Payment Terms</label>
                <Input
                  value={form.paymentTerms}
                  placeholder="e.g. Net 30 days"
                  onChange={(e) => setForm((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Delivery Terms</label>
                <Input
                  value={form.deliveryTerms}
                  placeholder="e.g. FOB Destination"
                  onChange={(e) => setForm((prev) => ({ ...prev, deliveryTerms: e.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-label text-text-secondary">Special Notes</label>
                <textarea
                  value={form.notes}
                  placeholder="Extra commercial conditions, quality instructions..."
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[80px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Document Upload */}
          <div className="space-y-4">
            <h3 className="text-body font-bold text-text-primary border-b pb-2">4. Attachment Upload</h3>
            <p className="text-label text-text-secondary">Upload initial quotation or PO blueprint document (optional).</p>
            <FileUpload
              onFileSelect={async (file) => {
                if (file) {
                  try {
                    const uploadRes = await uploadDocument(role, file, {
                      title: "Initial PO document",
                      category: "Purchase Order",
                      module: "Procurement",
                    });
                    setForm((prev) => ({ ...prev, documentUrl: uploadRes.data.fileUrl || "" }));
                  } catch (err) {
                    console.error("File upload failed", err);
                  }
                } else {
                  setForm((prev) => ({ ...prev, documentUrl: "" }));
                }
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border-soft">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate()} loading={mutation.isPending} variant="primary" className="shadow-active-nav">
              Release Purchase Order
            </Button>
          </div>
        </div>
      </Drawer>

      {/* PDF PREVIEW MODAL */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-[var(--z-overlay)] bg-overlay flex items-center justify-center p-4" onClick={() => setPreviewDocUrl(null)}>
          <div className="bg-surface rounded-[var(--radius-modal)] shadow-floating w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
              <h2 className="text-section-title font-semibold text-text-primary">PO Document Preview</h2>
              <Button size="sm" variant="ghost" onClick={() => setPreviewDocUrl(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 p-6 bg-hover/20">
              <iframe src={previewDocUrl} className="w-full h-full border border-border-soft rounded-lg shadow-inner" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


export function MaterialsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const projectsQuery = useProjectsSummary();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const query = useQuery({
    queryKey: ["erp-materials", role],
    queryFn: async () => (await apiRequest<MaterialsResponse>("/api/materials", { role })).data,
  });
  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "Cement",
    warehouseId: "",
    projectId: "",
    onHand: "",
    reorderLevel: "",
    unit: "bags",
    averageConsumption: "",
  });
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(editingMaterialId ? `/api/materials/${editingMaterialId}` : "/api/materials", {
        role,
        method: editingMaterialId ? "PATCH" : "POST",
        body: {
          ...form,
          onHand: Number(form.onHand),
          reorderLevel: Number(form.reorderLevel),
          averageConsumption: Number(form.averageConsumption),
        },
      }),
    onSuccess: async () => {
      setEditingMaterialId(null);
      setForm((current) => ({
        ...current,
        sku: "",
        name: "",
        onHand: "",
        reorderLevel: "",
        averageConsumption: "",
      }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-material-alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-project-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });
  const archiveMutation = useMutation({
    mutationFn: async (materialId: string) =>
      apiRequest(`/api/materials/${materialId}/archive`, {
        role,
        method: "PATCH",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-material-alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-project-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  useEffect(() => {
    if (!form.warehouseId && query.data?.warehouses[0]?.id) {
      setForm((current) => ({ ...current, warehouseId: query.data?.warehouses[0]?.id || "" }));
    }
  }, [form.warehouseId, query.data?.warehouses]);

  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projectsQuery.data?.projects[0]?.id || "" }));
    }
  }, [form.projectId, projectsQuery.data?.projects]);

  if (query.isLoading || projectsQuery.isLoading) return <LoadingStateCard title="Loading materials inventory" />;
  if (query.error || projectsQuery.error || !query.data || !projectsQuery.data) return <ErrorStateCard message="Material inventory data is unavailable." />;

  const inventoryValue = query.data.materials.reduce((sum, material) => sum + material.onHand * material.averageConsumption, 0);
  const visibleMaterials = query.data.materials.filter((material) => {
    const needle = search.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      material.name.toLowerCase().includes(needle) ||
      material.sku.toLowerCase().includes(needle) ||
      material.projectName.toLowerCase().includes(needle) ||
      material.warehouseName.toLowerCase().includes(needle);
    const matchesStatus = statusFilter === "All" || material.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || material.category === categoryFilter;
    const matchesProject = projectFilter === "All" || material.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesProject;
  });
  const activeFilters = [
    statusFilter !== "All" ? `Status: ${statusFilter}` : null,
    categoryFilter !== "All" ? `Category: ${categoryFilter}` : null,
    projectFilter !== "All"
      ? `Project: ${projectsQuery.data.projects.find((project) => project.id === projectFilter)?.name || projectFilter}`
      : null,
  ].filter(Boolean) as string[];
  const visibleLowStock = visibleMaterials.filter((item) => item.status === "Low Stock").length;
  const visibleProjects = uniqueCount(visibleMaterials.map((item) => item.projectId));

  return (
    <section className="space-y-6">
      <SectionHeader title="Materials Inventory" description="Warehouse-linked material master with on-hand stock, reorder levels, average consumption, and project mapping." />
      <KpiGrid
        items={[
          { label: "Tracked Materials", value: `${query.data.materials.length}`, trend: "Inventory SKUs", tone: "info" },
          { label: "Warehouses", value: `${query.data.warehouses.length}`, trend: "Operational storage nodes", tone: "success" },
          { label: "Low Stock", value: `${query.data.materials.filter((item) => item.status === "Low Stock").length}`, trend: "Need replenishment", tone: "warning" },
          { label: "Inventory Index", value: formatCurrency(inventoryValue), trend: "Consumption-weighted stock value", tone: "info" },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>Materials Register</CardTitle>
              <p className="text-body text-text-secondary">
                Slice stock by category, project, and health so low-visibility inventory risks do not get buried in a large register.
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <TableToolbar
              searchPlaceholder="Search material, SKU, project, or warehouse"
              searchValue={search}
              onSearchChange={setSearch}
              filters={
                <>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={selectClassName}>
                    <option value="All">All status</option>
                    <option value="Healthy">Healthy</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Archived">Archived</option>
                  </select>
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={selectClassName}>
                    <option value="All">All categories</option>
                    {Array.from(new Set(query.data.materials.map((material) => material.category))).sort().map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className={selectClassName}>
                    <option value="All">All projects</option>
                    {projectsQuery.data.projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </>
              }
              resultLabel={`${visibleMaterials.length} of ${query.data.materials.length} materials`}
              activeFilters={activeFilters}
              summary={`${visibleLowStock} low stock · ${visibleProjects} projects represented`}
              onClear={() => {
                setSearch("");
                setStatusFilter("All");
                setCategoryFilter("All");
                setProjectFilter("All");
              }}
            />
            <div className="overflow-auto">
              <table className="w-full min-w-[1080px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Material</th>
                    <th className="px-4 text-left">Project</th>
                    <th className="px-4 text-left">Warehouse</th>
                    <th className="px-4 text-left">On Hand</th>
                    <th className="px-4 text-left">Reorder</th>
                    <th className="px-4 text-left">Consumption</th>
                    <th className="px-4 text-left">Status</th>
                    <th className="px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMaterials.length ? visibleMaterials.map((material) => (
                    <tr key={material.id} className="border-t border-border-soft transition-colors hover:bg-hover/40">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-text-primary">{material.name}</p>
                          <p className="text-label text-text-muted">{material.sku}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">{material.projectName}</td>
                      <td className="px-4 py-4">{material.warehouseName}</td>
                      <td className="px-4 py-4">{material.onHand} {material.unit}</td>
                      <td className="px-4 py-4">{material.reorderLevel} {material.unit}</td>
                      <td className="px-4 py-4">{material.averageConsumption} / cycle</td>
                      <td className="px-4 py-4"><Badge tone={toneForStatus(material.status)}>{material.status}</Badge></td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingMaterialId(material.id);
                              setForm({
                                sku: material.sku,
                                name: material.name,
                                category: material.category,
                                warehouseId: material.warehouseId,
                                projectId: material.projectId,
                                onHand: `${material.onHand}`,
                                reorderLevel: `${material.reorderLevel}`,
                                unit: material.unit,
                                averageConsumption: `${material.averageConsumption}`,
                              });
                            }}
                          >
                            Edit
                          </Button>
                          {material.status !== "Archived" ? (
                            <Button size="sm" variant="ghost" loading={archiveMutation.isPending} onClick={() => archiveMutation.mutate(material.id)}>
                              Archive
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <TableEmptyStateRow
                      colSpan={8}
                      title="No materials match the current inventory view"
                      description="Reset the category or project filters to return to the full stock register."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{editingMaterialId ? "Edit Material" : "Create Material"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1"><label className="text-label text-text-secondary">SKU</label><Input value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value.toUpperCase() }))} /></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Category</label><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className={selectClassName}><option value="Cement">Cement</option><option value="Steel">Steel</option><option value="Electrical">Electrical</option><option value="Finishing">Finishing</option></select></div>
            </div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Material name</label><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Project</label><select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} className={selectClassName}>{projectsQuery.data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Warehouse</label><select value={form.warehouseId} onChange={(event) => setForm((current) => ({ ...current, warehouseId: event.target.value }))} className={selectClassName}>{query.data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1"><label className="text-label text-text-secondary">On hand</label><Input value={form.onHand} onChange={(event) => setForm((current) => ({ ...current, onHand: event.target.value }))} /></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Reorder</label><Input value={form.reorderLevel} onChange={(event) => setForm((current) => ({ ...current, reorderLevel: event.target.value }))} /></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Unit</label><Input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} /></div>
            </div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Average consumption</label><Input value={form.averageConsumption} onChange={(event) => setForm((current) => ({ ...current, averageConsumption: event.target.value }))} /></div>
            <div className="flex justify-end gap-3">
              {editingMaterialId ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingMaterialId(null);
                    setForm((current) => ({
                      ...current,
                      sku: "",
                      name: "",
                      onHand: "",
                      reorderLevel: "",
                      averageConsumption: "",
                    }));
                  }}
                >
                  Cancel
                </Button>
              ) : null}
              <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}><PackagePlus className="h-4 w-4" />{editingMaterialId ? "Save Material" : "Add Material"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function TransfersWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const materialsQuery = useQuery({
    queryKey: ["erp-materials", role],
    queryFn: async () => (await apiRequest<MaterialsResponse>("/api/materials", { role })).data,
  });
  const transfersQuery = useQuery({
    queryKey: ["erp-material-transfers", role],
    queryFn: async () => (await apiRequest<MaterialTransfersResponse>("/api/materials/transfers", { role })).data,
  });
  const [form, setForm] = useState({
    materialId: "",
    fromWarehouseId: "",
    toWarehouseId: "",
    quantity: "",
    unit: "",
  });

  const mutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/materials/transfers", {
        role,
        method: "POST",
        body: { ...form, quantity: Number(form.quantity) },
      }),
    onSuccess: async () => {
      setForm({ materialId: "", fromWarehouseId: "", toWarehouseId: "", quantity: "", unit: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-material-transfers"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-project-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  useEffect(() => {
    const first = materialsQuery.data?.materials[0];
    if (!first || form.materialId) return;
    setForm({
      materialId: first.id,
      fromWarehouseId: first.warehouseId,
      toWarehouseId: materialsQuery.data?.warehouses.find((item) => item.id !== first.warehouseId)?.id || first.warehouseId,
      quantity: "",
      unit: first.unit,
    });
  }, [form.materialId, materialsQuery.data]);

  if (materialsQuery.isLoading || transfersQuery.isLoading) return <LoadingStateCard title="Loading material transfers" />;
  if (materialsQuery.error || transfersQuery.error || !materialsQuery.data || !transfersQuery.data) return <ErrorStateCard message="Transfer data is unavailable." />;

  return (
    <section className="space-y-6">
      <SectionHeader title="Material Transfers" description="Track stock movement between warehouses and sites, with transfer history and active in-transit loads." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Transfer Register</CardTitle></CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[920px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Material</th>
                    <th className="px-4 text-left">From</th>
                    <th className="px-4 text-left">To</th>
                    <th className="px-4 text-left">Quantity</th>
                    <th className="px-4 text-left">Requested By</th>
                    <th className="px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transfersQuery.data.transfers.map((transfer) => (
                    <tr key={transfer.id} className="border-t border-border-soft">
                      <td className="px-4 py-4 text-text-primary">{transfer.materialName}</td>
                      <td className="px-4 py-4">{transfer.fromWarehouseName}</td>
                      <td className="px-4 py-4">{transfer.toWarehouseName}</td>
                      <td className="px-4 py-4">{transfer.quantity} {transfer.unit}</td>
                      <td className="px-4 py-4">{transfer.requestedByName}</td>
                      <td className="px-4 py-4"><Badge tone={toneForStatus(transfer.status)}>{transfer.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Create Transfer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><label className="text-label text-text-secondary">Material</label><select value={form.materialId} onChange={(event) => {
              const material = materialsQuery.data.materials.find((item) => item.id === event.target.value);
              setForm((current) => ({
                ...current,
                materialId: event.target.value,
                fromWarehouseId: material?.warehouseId || current.fromWarehouseId,
                unit: material?.unit || current.unit,
              }));
            }} className={selectClassName}>{materialsQuery.data.materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}</select></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1"><label className="text-label text-text-secondary">From</label><select value={form.fromWarehouseId} onChange={(event) => setForm((current) => ({ ...current, fromWarehouseId: event.target.value }))} className={selectClassName}>{materialsQuery.data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">To</label><select value={form.toWarehouseId} onChange={(event) => setForm((current) => ({ ...current, toWarehouseId: event.target.value }))} className={selectClassName}>{materialsQuery.data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1"><label className="text-label text-text-secondary">Quantity</label><Input value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} /></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Unit</label><Input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} /></div>
            </div>
            <div className="flex justify-end"><Button loading={mutation.isPending} onClick={() => mutation.mutate()}><MoveRight className="h-4 w-4" />Create Transfer</Button></div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function ConsumptionWorkspace() {
  const role = useUiStore((state) => state.role);
  const query = useQuery({
    queryKey: ["erp-material-consumption", role],
    queryFn: async () => (await apiRequest<MaterialConsumptionResponse>("/api/materials/consumption", { role })).data,
  });
  if (query.isLoading) return <LoadingStateCard title="Loading material consumption" />;
  if (query.error || !query.data) return <ErrorStateCard message="Consumption data is unavailable." />;
  return (
    <section className="space-y-6">
      <SectionHeader title="Material Consumption" description="Project-linked consumption log to compare issued stock against actual usage." />
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Consumption Register</CardTitle></CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[900px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">Material</th>
                  <th className="px-4 text-left">Project</th>
                  <th className="px-4 text-left">Quantity</th>
                  <th className="px-4 text-left">Purpose</th>
                  <th className="px-4 text-left">Recorded</th>
                </tr>
              </thead>
              <tbody>
                {query.data.consumptions.map((item) => (
                  <tr key={item.id} className="border-t border-border-soft">
                    <td className="px-4 py-4 text-text-primary">{item.materialName}</td>
                    <td className="px-4 py-4">{item.projectName}</td>
                    <td className="px-4 py-4">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-4">{item.purpose}</td>
                    <td className="px-4 py-4">{item.recordedByName} · {formatDate(item.consumedOn)}</td>
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

export function EmployeesWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const projectsQuery = useProjectsSummary();
  const attendanceQuery = useQuery({
    queryKey: ["erp-attendance", role],
    queryFn: async () => (await apiRequest<AttendanceResponse>("/api/workforce/attendance", { role })).data,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const query = useQuery({
    queryKey: ["erp-employees", role],
    queryFn: async () => (await apiRequest<EmployeesResponse>("/api/workforce/employees", { role })).data,
  });
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    department: "Projects",
    designation: "",
    projectId: "",
    teamName: "Unassigned",
    phone: "",
    status: "Active",
  });

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(editingEmployeeId ? `/api/workforce/employees/${editingEmployeeId}` : "/api/workforce/employees", {
        role,
        method: editingEmployeeId ? "PATCH" : "POST",
        body: form,
      }),
    onSuccess: async () => {
      setEditingEmployeeId(null);
      setForm((current) => ({ ...current, name: "", department: "Projects", designation: "", teamName: "Unassigned", phone: "", status: "Active" }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-employees"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-attendance"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: async (employeeId: string) =>
      apiRequest(`/api/workforce/employees/${employeeId}`, {
        role,
        method: "PATCH",
        body: { status: "Inactive" },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-employees"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-attendance"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projectsQuery.data?.projects[0]?.id || "" }));
    }
  }, [form.projectId, projectsQuery.data?.projects]);

  useEffect(() => {
    if (!selectedEmployeeId && query.data?.employees[0]?.id) {
      setSelectedEmployeeId(query.data.employees[0].id);
    }
  }, [query.data?.employees, selectedEmployeeId]);

  if (query.isLoading || projectsQuery.isLoading || attendanceQuery.isLoading) return <LoadingStateCard title="Loading employee directory" />;
  if (query.error || projectsQuery.error || attendanceQuery.error || !query.data || !projectsQuery.data || !attendanceQuery.data) return <ErrorStateCard message="Employee directory is unavailable." />;

  const visibleEmployees = query.data.employees.filter((employee) => {
    const needle = search.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      employee.name.toLowerCase().includes(needle) ||
      employee.designation.toLowerCase().includes(needle) ||
      employee.teamName.toLowerCase().includes(needle) ||
      employee.projectName.toLowerCase().includes(needle) ||
      employee.phone.toLowerCase().includes(needle);
    const matchesStatus = statusFilter === "All" || employee.status === statusFilter;
    const matchesDepartment = departmentFilter === "All" || employee.department === departmentFilter;
    const matchesProject = projectFilter === "All" || employee.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesDepartment && matchesProject;
  });
  const selectedEmployee =
    query.data.employees.find((employee) => employee.id === selectedEmployeeId) ||
    visibleEmployees[0] ||
    query.data.employees[0] ||
    null;
  const selectedAttendance = selectedEmployee
    ? attendanceQuery.data.attendance.filter((entry) => entry.employeeId === selectedEmployee.id)
    : [];
  const latestCheckIn = selectedAttendance
    .slice()
    .sort((left, right) => new Date(right.checkIn).getTime() - new Date(left.checkIn).getTime())[0];
  const activeFilters = [
    statusFilter !== "All" ? `Status: ${statusFilter}` : null,
    departmentFilter !== "All" ? `Department: ${departmentFilter}` : null,
    projectFilter !== "All"
      ? `Project: ${projectsQuery.data.projects.find((project) => project.id === projectFilter)?.name || projectFilter}`
      : null,
  ].filter(Boolean) as string[];
  const visibleTeams = uniqueCount(visibleEmployees.map((employee) => employee.teamName));
  const visibleActive = visibleEmployees.filter((employee) => employee.status === "Active").length;

  return (
    <section className="space-y-6">
      <SectionHeader title="Employees" description="Internal workforce directory aligned to department, designation, and project allocation." />
      <KpiGrid
        items={[
          { label: "Active Headcount", value: `${query.data.employees.filter((employee) => employee.status === "Active").length}`, trend: "Internal workforce on roster", tone: "success" },
          { label: "Teams Active", value: `${uniqueCount(query.data.employees.map((employee) => employee.teamName))}`, trend: "Named team assignments", tone: "info" },
          { label: "Projects Staffed", value: `${uniqueCount(query.data.employees.map((employee) => employee.projectId))}`, trend: "Cross-project deployment", tone: "warning" },
          { label: "Present Today", value: `${attendanceQuery.data.summary.present}`, trend: "Attendance sync reflected live", tone: "success" },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>Employee Register</CardTitle>
              <p className="text-body text-text-secondary">
                Narrow the workforce roster by department, project, and status while keeping the employee profile panel in sync.
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <TableToolbar
              searchPlaceholder="Search employee, phone, project, or designation"
              searchValue={search}
              onSearchChange={setSearch}
              filters={
                <>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={selectClassName}>
                    <option value="All">All status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className={selectClassName}>
                    <option value="All">All departments</option>
                    {Array.from(new Set(query.data.employees.map((employee) => employee.department))).sort().map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                  <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className={selectClassName}>
                    <option value="All">All projects</option>
                    {projectsQuery.data.projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </>
              }
              resultLabel={`${visibleEmployees.length} of ${query.data.employees.length} employees`}
              activeFilters={activeFilters}
              summary={`${visibleActive} active · ${visibleTeams} teams represented`}
              onClear={() => {
                setSearch("");
                setStatusFilter("All");
                setDepartmentFilter("All");
                setProjectFilter("All");
              }}
            />
            <div className="overflow-auto">
              <table className="w-full min-w-[980px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Employee</th>
                    <th className="px-4 text-left">Department</th>
                    <th className="px-4 text-left">Team</th>
                    <th className="px-4 text-left">Designation</th>
                    <th className="px-4 text-left">Project</th>
                    <th className="px-4 text-left">Status</th>
                    <th className="px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEmployees.length ? visibleEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className={`border-t border-border-soft transition-colors hover:bg-hover/40 ${selectedEmployee?.id === employee.id ? "bg-hover/40" : ""}`}
                    >
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-text-primary">{employee.name}</p>
                          <p className="text-label text-text-muted">{employee.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">{employee.department}</td>
                      <td className="px-4 py-4">{employee.teamName}</td>
                      <td className="px-4 py-4">{employee.designation}</td>
                      <td className="px-4 py-4">{employee.projectName}</td>
                      <td className="px-4 py-4"><Badge tone={toneForStatus(employee.status)}>{employee.status}</Badge></td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedEmployeeId(employee.id)}>
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingEmployeeId(employee.id);
                              setSelectedEmployeeId(employee.id);
                              setForm({
                                name: employee.name,
                                department: employee.department,
                                designation: employee.designation,
                                projectId: employee.projectId,
                                teamName: employee.teamName,
                                phone: employee.phone,
                                status: employee.status,
                              });
                            }}
                          >
                            Edit
                          </Button>
                          {employee.status !== "Inactive" ? (
                            <Button size="sm" variant="ghost" loading={deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(employee.id)}>
                              Deactivate
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <TableEmptyStateRow
                      colSpan={7}
                      title="No employees match the current roster view"
                      description="Reset the department or project filters to restore the wider workforce directory."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Employee Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {selectedEmployee ? (
                <>
                  <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-card-title text-text-primary">{selectedEmployee.name}</p>
                        <p className="mt-1 text-body text-text-secondary">{selectedEmployee.designation}</p>
                      </div>
                      <Badge tone={toneForStatus(selectedEmployee.status)}>{selectedEmployee.status}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-3">
                      <p className="text-label text-text-muted">Department</p>
                      <p className="mt-1 font-medium text-text-primary">{selectedEmployee.department}</p>
                    </div>
                    <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-3">
                      <p className="text-label text-text-muted">Team</p>
                      <p className="mt-1 font-medium text-text-primary">{selectedEmployee.teamName}</p>
                    </div>
                    <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-3">
                      <p className="text-label text-text-muted">Project</p>
                      <p className="mt-1 font-medium text-text-primary">{selectedEmployee.projectName}</p>
                    </div>
                    <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-3">
                      <p className="text-label text-text-muted">Phone</p>
                      <p className="mt-1 font-medium text-text-primary">{selectedEmployee.phone || "Not added"}</p>
                    </div>
                    <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-3">
                      <p className="text-label text-text-muted">Attendance Logs</p>
                      <p className="mt-1 font-medium text-text-primary">{selectedAttendance.length}</p>
                    </div>
                    <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-3">
                      <p className="text-label text-text-muted">Latest Check-in</p>
                      <p className="mt-1 font-medium text-text-primary">{latestCheckIn ? formatDateTime(latestCheckIn.checkIn) : "No attendance yet"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-body text-text-secondary">Select an employee to inspect profile context.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{editingEmployeeId ? "Edit Employee" : "Create Employee"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1"><label className="text-label text-text-secondary">Name</label><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1"><label className="text-label text-text-secondary">Department</label><select value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} className={selectClassName}><option value="Projects">Projects</option><option value="Procurement">Procurement</option><option value="Finance">Finance</option><option value="Sales">Sales</option><option value="Admin">Admin</option></select></div>
                <div className="space-y-1"><label className="text-label text-text-secondary">Status</label><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={selectClassName}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
              </div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Designation</label><Input value={form.designation} onChange={(event) => setForm((current) => ({ ...current, designation: event.target.value }))} /></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Assigned Team</label><Input value={form.teamName} onChange={(event) => setForm((current) => ({ ...current, teamName: event.target.value }))} placeholder="Aurora Core Team" /></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Project</label><select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} className={selectClassName}>{projectsQuery.data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Phone</label><Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></div>
              <div className="flex gap-3">
                <Button className="flex-1" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {editingEmployeeId ? "Save Changes" : "Add Employee"}
                </Button>
                {editingEmployeeId ? (
                  <Button
                    className="flex-1"
                    variant="ghost"
                    onClick={() => {
                      setEditingEmployeeId(null);
                      setForm((current) => ({
                        ...current,
                        name: "",
                        department: "Projects",
                        designation: "",
                        teamName: "Unassigned",
                        phone: "",
                        status: "Active",
                      }));
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export function ContractorsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const projectsQuery = useProjectsSummary();
  const query = useQuery({
    queryKey: ["erp-contractors", role],
    queryFn: async () => (await apiRequest<ContractorsResponse>("/api/workforce/contractors", { role })).data,
  });
  const [form, setForm] = useState({
    name: "",
    trade: "Civil",
    projectId: "",
    workforce: "0",
    status: "Engaged",
  });
  const [editingContractorId, setEditingContractorId] = useState<string | null>(null);
  const saveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(editingContractorId ? `/api/workforce/contractors/${editingContractorId}` : "/api/workforce/contractors", {
        role,
        method: editingContractorId ? "PATCH" : "POST",
        body: { ...form, workforce: Number(form.workforce) || 0 },
      }),
    onSuccess: async () => {
      setEditingContractorId(null);
      setForm((current) => ({ ...current, name: "", workforce: "0", status: "Engaged" }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-contractors"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-project-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });
  const archiveMutation = useMutation({
    mutationFn: async (contractorId: string) =>
      apiRequest(`/api/workforce/contractors/${contractorId}/archive`, {
        role,
        method: "PATCH",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-contractors"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-project-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projectsQuery.data?.projects[0]?.id || "" }));
    }
  }, [form.projectId, projectsQuery.data?.projects]);

  if (query.isLoading || projectsQuery.isLoading) return <LoadingStateCard title="Loading contractors" />;
  if (query.error || projectsQuery.error || !query.data || !projectsQuery.data) return <ErrorStateCard message="Contractor data is unavailable." />;

  return (
    <section className="space-y-6">
      <SectionHeader title="Contractors" description="Trade-wise external workforce partners and their current mobilization across projects." />
      <KpiGrid
        items={[
          { label: "Partners", value: `${query.data.contractors.length}`, trend: "External workforce vendors", tone: "info" },
          { label: "Mobilized Workforce", value: `${query.data.contractors.reduce((sum, contractor) => sum + contractor.workforce, 0)}`, trend: "Current labor strength", tone: "warning" },
          { label: "Trades Active", value: `${uniqueCount(query.data.contractors.map((contractor) => contractor.trade))}`, trend: "Trade coverage", tone: "success" },
          { label: "Projects Covered", value: `${uniqueCount(query.data.contractors.map((contractor) => contractor.projectId))}`, trend: "Site deployment", tone: "warning" },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Contractor Register</CardTitle></CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[820px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Contractor</th>
                    <th className="px-4 text-left">Trade</th>
                    <th className="px-4 text-left">Project</th>
                    <th className="px-4 text-left">Workforce</th>
                    <th className="px-4 text-left">Status</th>
                    <th className="px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.contractors.map((contractor) => (
                    <tr key={contractor.id} className="border-t border-border-soft">
                      <td className="px-4 py-4 text-text-primary">{contractor.name}</td>
                      <td className="px-4 py-4">{contractor.trade}</td>
                      <td className="px-4 py-4">{contractor.projectName}</td>
                      <td className="px-4 py-4">{contractor.workforce}</td>
                      <td className="px-4 py-4"><Badge tone={toneForStatus(contractor.status)}>{contractor.status}</Badge></td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingContractorId(contractor.id);
                              setForm({
                                name: contractor.name,
                                trade: contractor.trade,
                                projectId: contractor.projectId,
                                workforce: `${contractor.workforce}`,
                                status: contractor.status,
                              });
                            }}
                          >
                            Edit
                          </Button>
                          {contractor.status !== "Closed" ? (
                            <Button size="sm" variant="ghost" loading={archiveMutation.isPending} onClick={() => archiveMutation.mutate(contractor.id)}>
                              Close
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{editingContractorId ? "Edit Contractor" : "Engage Contractor"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><label className="text-label text-text-secondary">Contractor Name</label><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1"><label className="text-label text-text-secondary">Trade</label><select value={form.trade} onChange={(event) => setForm((current) => ({ ...current, trade: event.target.value }))} className={selectClassName}><option value="Civil">Civil</option><option value="Electrical">Electrical</option><option value="MEP">MEP</option><option value="Landscape">Landscape</option><option value="Finishing">Finishing</option></select></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Status</label><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={selectClassName}><option value="Engaged">Engaged</option><option value="Mobilizing">Mobilizing</option><option value="Closed">Closed</option></select></div>
            </div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Project</label><select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} className={selectClassName}>{projectsQuery.data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Workforce Count</label><Input type="number" min="0" value={form.workforce} onChange={(event) => setForm((current) => ({ ...current, workforce: event.target.value }))} /></div>
            <div className="flex justify-end gap-3">
              {editingContractorId ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingContractorId(null);
                    setForm((current) => ({ ...current, name: "", workforce: "0", status: "Engaged" }));
                  }}
                >
                  Cancel
                </Button>
              ) : null}
              <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}><PackagePlus className="h-4 w-4" />{editingContractorId ? "Save Contractor" : "Add Contractor"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function AttendanceWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const employeesQuery = useQuery({
    queryKey: ["erp-employees", role],
    queryFn: async () => (await apiRequest<EmployeesResponse>("/api/workforce/employees", { role })).data,
  });
  const query = useQuery({
    queryKey: ["erp-attendance", role],
    queryFn: async () => (await apiRequest<AttendanceResponse>("/api/workforce/attendance", { role })).data,
  });
  const [form, setForm] = useState({
    employeeId: "",
    projectId: "",
    shift: "Day",
    status: "Present",
    checkIn: "",
  });
  const mutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/workforce/attendance", {
        role,
        method: "POST",
        body: form,
      }),
    onSuccess: async () => {
      setForm((current) => ({ ...current, shift: "Day", status: "Present", checkIn: "" }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-attendance"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-project-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  useEffect(() => {
    const first = employeesQuery.data?.employees[0];
    if (!first || form.employeeId) return;
    setForm({
      employeeId: first.id,
      projectId: first.projectId,
      shift: "Day",
      status: "Present",
      checkIn: "",
    });
  }, [employeesQuery.data?.employees, form.employeeId]);

  if (query.isLoading || employeesQuery.isLoading) return <LoadingStateCard title="Loading attendance" />;
  if (query.error || employeesQuery.error || !query.data || !employeesQuery.data) return <ErrorStateCard message="Attendance data is unavailable." />;
  return (
    <section className="space-y-6">
      <SectionHeader title="Attendance" description="Daily workforce check-in visibility by project with present and late counts for operations control." />
      <KpiGrid
        items={[
          { label: "Present", value: `${query.data.summary.present}`, trend: "Checked in today", tone: "success" },
          { label: "Late", value: `${query.data.summary.late}`, trend: "Need supervisor follow-up", tone: "warning" },
          { label: "Absent", value: `${query.data.summary.absent}`, trend: "No check-in", tone: "warning" },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Attendance Register</CardTitle></CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[860px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Employee</th>
                    <th className="px-4 text-left">Project</th>
                    <th className="px-4 text-left">Shift</th>
                    <th className="px-4 text-left">Check In</th>
                    <th className="px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.attendance.map((item) => (
                    <tr key={item.id} className="border-t border-border-soft">
                      <td className="px-4 py-4 text-text-primary">{item.employeeName}</td>
                      <td className="px-4 py-4">{item.projectName}</td>
                      <td className="px-4 py-4">{item.shift}</td>
                      <td className="px-4 py-4">{formatDateTime(item.checkIn)}</td>
                      <td className="px-4 py-4"><Badge tone={toneForStatus(item.status)}>{item.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mark Attendance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Employee</label>
              <select
                value={form.employeeId}
                onChange={(event) => {
                  const employee = employeesQuery.data.employees.find((item) => item.id === event.target.value);
                  setForm((current) => ({
                    ...current,
                    employeeId: event.target.value,
                    projectId: employee?.projectId || current.projectId,
                  }));
                }}
                className={selectClassName}
              >
                {employeesQuery.data.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Project</label>
              <select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} className={selectClassName}>
                {employeesQuery.data.employees.map((employee) => (
                  <option key={`${employee.id}-${employee.projectId}`} value={employee.projectId}>
                    {employee.projectName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1"><label className="text-label text-text-secondary">Shift</label><select value={form.shift} onChange={(event) => setForm((current) => ({ ...current, shift: event.target.value }))} className={selectClassName}><option value="Day">Day</option><option value="Night">Night</option></select></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Status</label><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={selectClassName}><option value="Present">Present</option><option value="Late">Late</option><option value="Absent">Absent</option></select></div>
            </div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Check in</label><Input type="datetime-local" value={form.checkIn} onChange={(event) => setForm((current) => ({ ...current, checkIn: event.target.value }))} /></div>
            <div className="flex justify-end"><Button loading={mutation.isPending} onClick={() => mutation.mutate()}><ClipboardPlus className="h-4 w-4" />Mark Attendance</Button></div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function MilestonesWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const projectsQuery = useProjectsSummary();
  const usersQuery = useUsersDirectory();
  const query = useQuery({
    queryKey: ["erp-project-tasks", role],
    queryFn: async () => (await apiRequest<ProjectTasksResponse>("/api/projects/tasks", { role })).data,
  });
  const [form, setForm] = useState({
    projectId: "",
    title: "",
    ownerId: "",
    dueDate: "",
    priority: "High",
  });
  const createMutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/projects/tasks", {
        role,
        method: "POST",
        body: {
          ...form,
          discipline: "Milestone",
          status: "Planned",
        },
      }),
    onSuccess: async () => {
      setForm((current) => ({ ...current, title: "", dueDate: "", priority: "High" }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-project-tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-project-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projectsQuery.data?.projects[0]?.id || "" }));
    }
  }, [form.projectId, projectsQuery.data?.projects]);

  useEffect(() => {
    if (!form.ownerId && usersQuery.data?.users[0]?.id) {
      setForm((current) => ({ ...current, ownerId: usersQuery.data?.users[0]?.id || "" }));
    }
  }, [form.ownerId, usersQuery.data?.users]);

  if (query.isLoading || projectsQuery.isLoading || usersQuery.isLoading) return <LoadingStateCard title="Loading milestones" />;
  if (query.error || projectsQuery.error || usersQuery.error || !query.data || !projectsQuery.data || !usersQuery.data) return <ErrorStateCard message="Milestone data is unavailable." />;

  const milestones = Object.values(
    query.data.tasks.reduce<Record<string, { projectName: string; tasks: ProjectTasksResponse["tasks"] }>>((accumulator, task) => {
      const current = accumulator[task.projectId] || { projectName: task.projectName, tasks: [] };
      current.tasks.push(task);
      accumulator[task.projectId] = current;
      return accumulator;
    }, {}),
  ).map(({ projectName, tasks }) => ({
    projectName,
    completion: average(tasks.map((task) => task.completion)),
    reviewCount: tasks.filter((task) => task.status === "Review").length,
    activeCount: tasks.filter((task) => task.status !== "Done").length,
    nextDue: tasks.slice().sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())[0]?.dueDate || null,
  }));

  return (
    <section className="space-y-6">
      <SectionHeader title="Milestones" description="Project progress snapshots built from active task completion, review backlog, and upcoming due dates." />
      <KpiGrid
        items={[
          { label: "Projects Tracked", value: `${milestones.length}`, trend: "Live milestone boards", tone: "info" },
          { label: "Avg Completion", value: `${average(milestones.map((item) => item.completion))}%`, trend: "Across active milestones", tone: "success" },
          { label: "In Review", value: `${milestones.reduce((sum, item) => sum + item.reviewCount, 0)}`, trend: "Awaiting sign-off", tone: "warning" },
          { label: "Open Tasks", value: `${milestones.reduce((sum, item) => sum + item.activeCount, 0)}`, trend: "Operational backlog", tone: "warning" },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {milestones.map((milestone) => (
            <Card key={milestone.projectName}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{milestone.projectName}</CardTitle>
                  <Badge tone={milestone.completion >= 80 ? "success" : milestone.completion >= 50 ? "warning" : "neutral"}>{milestone.completion}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-2 rounded-full bg-hover">
                  <div className="h-2 rounded-full bg-accent-primary" style={{ width: `${milestone.completion}%` }} />
                </div>
                <p className="text-body text-text-secondary">{milestone.activeCount} active milestones in motion.</p>
                <p className="text-label text-text-muted">{milestone.reviewCount} items currently under review.</p>
                <p className="text-label text-text-muted">Next due: {milestone.nextDue ? formatDate(milestone.nextDue) : "No due date"}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Create Milestone</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><label className="text-label text-text-secondary">Project</label><select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} className={selectClassName}>{projectsQuery.data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Milestone Title</label><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Tower B waterproofing sign-off" /></div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Owner</label><select value={form.ownerId} onChange={(event) => setForm((current) => ({ ...current, ownerId: event.target.value }))} className={selectClassName}>{usersQuery.data.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1"><label className="text-label text-text-secondary">Priority</label><select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className={selectClassName}><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Due Date</label><Input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} /></div>
            </div>
            <div className="flex justify-end"><Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}><ClipboardPlus className="h-4 w-4" />Add Milestone</Button></div>
          </CardContent>
        </Card>
      </div>
    </section>
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
  const [form, setForm] = useState({
    projectId: "",
    reportDate: "",
    laborCount: "0",
    materialUsage: "",
    blockers: "",
    progressSummary: "",
  });
  const createMutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/projects/daily-reports", {
        role,
        method: "POST",
        body: {
          ...form,
          laborCount: Number(form.laborCount) || 0,
        },
      }),
    onSuccess: async () => {
      setForm((current) => ({
        ...current,
        reportDate: "",
        laborCount: "0",
        materialUsage: "",
        blockers: "",
        progressSummary: "",
      }));
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
  });

  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects[0]?.id) {
      setForm((current) => ({ ...current, projectId: projectsQuery.data?.projects[0]?.id || "" }));
    }
  }, [form.projectId, projectsQuery.data?.projects]);

  if (query.isLoading || projectsQuery.isLoading) return <LoadingStateCard title="Loading site updates" />;
  if (query.error || projectsQuery.error || !query.data || !projectsQuery.data) return <ErrorStateCard message="Site update data is unavailable." />;

  const reports = query.data.reports.slice().sort((left, right) => {
    const leftTime = left.reportDate ? new Date(left.reportDate).getTime() : 0;
    const rightTime = right.reportDate ? new Date(right.reportDate).getTime() : 0;
    return rightTime - leftTime;
  });

  return (
    <section className="space-y-6">
      <SectionHeader title="Site Updates" description="Field narrative from daily progress reports with blockers, labor deployment, and recent delivery highlights." />
      <KpiGrid
        items={[
          { label: "Reports Logged", value: `${reports.length}`, trend: "Recent site updates", tone: "info" },
          { label: "Projects Reporting", value: `${uniqueCount(reports.map((item) => item.projectId))}`, trend: "Active reporting coverage", tone: "success" },
          { label: "Avg Labor", value: `${average(reports.map((item) => item.laborCount))}`, trend: "Per submitted DPR", tone: "warning" },
          { label: "Blocked Reports", value: `${reports.filter((item) => item.blockers && item.blockers !== "No critical blockers. Crane maintenance window scheduled tomorrow.").length}`, trend: "Needs follow-up", tone: "warning" },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {reports.map((report) => (
            <Card key={report.id} className="surface-secondary">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{report.projectName}</CardTitle>
                  <Badge tone="info">{formatDate(report.reportDate)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-body text-text-primary">{report.progressSummary}</p>
                <p className="text-label text-text-muted">Labor deployed: {report.laborCount}</p>
                <p className="text-label text-text-muted">Material note: {report.materialUsage}</p>
                <p className="text-label text-text-muted">Blockers: {report.blockers}</p>
                <p className="text-label text-text-muted">Submitted by {report.submittedByName}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Create Site Update</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><label className="text-label text-text-secondary">Project</label><select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} className={selectClassName}>{projectsQuery.data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1"><label className="text-label text-text-secondary">Report Date</label><Input type="date" value={form.reportDate} onChange={(event) => setForm((current) => ({ ...current, reportDate: event.target.value }))} /></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Labor Count</label><Input type="number" min="0" value={form.laborCount} onChange={(event) => setForm((current) => ({ ...current, laborCount: event.target.value }))} /></div>
            </div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Progress Summary</label><textarea className={textareaClassName} value={form.progressSummary} onChange={(event) => setForm((current) => ({ ...current, progressSummary: event.target.value }))} placeholder="Tower A blockwork closed ahead of plan; façade mock-up approved." /></div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Material Usage</label><textarea className={textareaClassName} value={form.materialUsage} onChange={(event) => setForm((current) => ({ ...current, materialUsage: event.target.value }))} placeholder="Concrete, shuttering ply, conduit..." /></div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Blockers</label><textarea className={textareaClassName} value={form.blockers} onChange={(event) => setForm((current) => ({ ...current, blockers: event.target.value }))} placeholder="Mention consultant delays, shortages, or access constraints." /></div>
            <div className="flex justify-end"><Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}><ClipboardPlus className="h-4 w-4" />Publish Update</Button></div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function ProjectInsightsWorkspace() {
  const role = useUiStore((state) => state.role);
  const projectsQuery = useProjectsSummary();
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

  if (projectsQuery.isLoading || tasksQuery.isLoading || reportsQuery.isLoading || resourcesQuery.isLoading || materialsQuery.isLoading) {
    return <LoadingStateCard title="Loading project insights" />;
  }

  if (projectsQuery.error || tasksQuery.error || reportsQuery.error || resourcesQuery.error || materialsQuery.error || !projectsQuery.data || !tasksQuery.data || !reportsQuery.data || !resourcesQuery.data || !materialsQuery.data) {
    return <ErrorStateCard message="Project insight data is unavailable." />;
  }

  const rows = projectsQuery.data.projects.map((project) => {
    const projectTasks = tasksQuery.data.tasks.filter((task) => task.projectId === project.id);
    const projectResources = resourcesQuery.data.resources.filter((item) => item.projectId === project.id);
    const projectMaterials = materialsQuery.data.materials.filter((item) => item.projectId === project.id);
    const projectReports = reportsQuery.data.reports.filter((report) => report.projectId === project.id);
    const latestReport = projectReports.slice().sort((left, right) => {
      const leftTime = left.reportDate ? new Date(left.reportDate).getTime() : 0;
      const rightTime = right.reportDate ? new Date(right.reportDate).getTime() : 0;
      return rightTime - leftTime;
    })[0];

    return {
      projectName: project.name,
      completion: average(projectTasks.map((task) => task.completion)),
      activeTasks: projectTasks.filter((task) => task.status !== "Done").length,
      resources: projectResources.length,
      lowStock: projectMaterials.filter((item) => item.status !== "Healthy").length,
      lastReportDate: latestReport?.reportDate || null,
      lastReportSummary: latestReport?.progressSummary || "No field update submitted yet.",
    };
  });

  return (
    <section className="space-y-6">
      <SectionHeader title="Project Insights" description="Cross-functional project snapshot combining execution, resources, materials pressure, and latest field reporting." />
      <KpiGrid
        items={[
          { label: "Portfolio Projects", value: `${rows.length}`, trend: "Tracked in execution", tone: "info" },
          { label: "Avg Completion", value: `${average(rows.map((row) => row.completion))}%`, trend: "Across all projects", tone: "success" },
          { label: "Resource Deployments", value: `${rows.reduce((sum, row) => sum + row.resources, 0)}`, trend: "Active allocations", tone: "warning" },
          { label: "Low Stock Flags", value: `${rows.reduce((sum, row) => sum + row.lowStock, 0)}`, trend: "Need material attention", tone: "warning" },
        ]}
      />
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Project Insight Board</CardTitle></CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[1080px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">Project</th>
                  <th className="px-4 text-left">Progress</th>
                  <th className="px-4 text-left">Active Tasks</th>
                  <th className="px-4 text-left">Resources</th>
                  <th className="px-4 text-left">Low Stock</th>
                  <th className="px-4 text-left">Latest Site Update</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.projectName} className="border-t border-border-soft">
                    <td className="px-4 py-4 font-medium text-text-primary">{row.projectName}</td>
                    <td className="px-4 py-4">{row.completion}%</td>
                    <td className="px-4 py-4">{row.activeTasks}</td>
                    <td className="px-4 py-4">{row.resources}</td>
                    <td className="px-4 py-4">{row.lowStock}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-text-primary">{row.lastReportSummary}</p>
                        <p className="text-label text-text-muted">{row.lastReportDate ? formatDate(row.lastReportDate) : "Awaiting update"}</p>
                      </div>
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

export function WarehousesWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["erp-materials", role],
    queryFn: async () => (await apiRequest<MaterialsResponse>("/api/materials", { role })).data,
  });
  const [form, setForm] = useState({
    name: "",
    location: "",
    capacityUtilization: "",
    status: "Operational",
  });
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(editingWarehouseId ? `/api/materials/warehouses/${editingWarehouseId}` : "/api/materials/warehouses", {
        role,
        method: editingWarehouseId ? "PATCH" : "POST",
        body: {
          ...form,
          capacityUtilization: Number(form.capacityUtilization),
        },
      }),
    onSuccess: async () => {
      setEditingWarehouseId(null);
      setForm({ name: "", location: "", capacityUtilization: "", status: "Operational" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-material-alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });
  const archiveMutation = useMutation({
    mutationFn: async (warehouseId: string) =>
      apiRequest(`/api/materials/warehouses/${warehouseId}/archive`, {
        role,
        method: "PATCH",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-material-alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  if (query.isLoading) return <LoadingStateCard title="Loading warehouses" />;
  if (query.error || !query.data) return <ErrorStateCard message="Warehouse data is unavailable." />;

  const rows = query.data.warehouses.map((warehouse) => {
    const materials = query.data.materials.filter((item) => item.warehouseId === warehouse.id);
    return {
      ...warehouse,
      skuCount: materials.length,
      projectsCovered: uniqueCount(materials.map((item) => item.projectId)),
      lowStockCount: materials.filter((item) => item.status === "Low Stock").length,
      totalStock: materials.reduce((sum, item) => sum + item.onHand, 0),
    };
  });

  return (
    <section className="space-y-6">
      <SectionHeader title="Warehouses" description="Storage network health with SKU coverage, utilization, low-stock pressure, and project support footprint." />
      <KpiGrid
        items={[
          { label: "Warehouses", value: `${rows.length}`, trend: "Operational nodes", tone: "info" },
          { label: "Avg Utilization", value: `${average(rows.map((row) => row.capacityUtilization))}%`, trend: "Capacity in use", tone: "success" },
          { label: "Low Stock SKUs", value: `${rows.reduce((sum, row) => sum + row.lowStockCount, 0)}`, trend: "Across all stores", tone: "warning" },
          { label: "Project Coverage", value: `${rows.reduce((sum, row) => sum + row.projectsCovered, 0)}`, trend: "Warehouse-to-project links", tone: "warning" },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Warehouse Register</CardTitle></CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[980px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Warehouse</th>
                    <th className="px-4 text-left">Location</th>
                    <th className="px-4 text-left">Utilization</th>
                    <th className="px-4 text-left">SKUs</th>
                    <th className="px-4 text-left">Projects Covered</th>
                    <th className="px-4 text-left">Low Stock</th>
                    <th className="px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-border-soft">
                      <td className="px-4 py-4 font-medium text-text-primary">{row.name}</td>
                      <td className="px-4 py-4">{row.location}</td>
                      <td className="px-4 py-4">{row.capacityUtilization}%</td>
                      <td className="px-4 py-4">{row.skuCount}</td>
                      <td className="px-4 py-4">{row.projectsCovered}</td>
                      <td className="px-4 py-4">{row.lowStockCount}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingWarehouseId(row.id);
                              setForm({
                                name: row.name,
                                location: row.location,
                                capacityUtilization: `${row.capacityUtilization}`,
                                status: row.status,
                              });
                            }}
                          >
                            Edit
                          </Button>
                          {row.status !== "Inactive" ? (
                            <Button size="sm" variant="ghost" loading={archiveMutation.isPending} onClick={() => archiveMutation.mutate(row.id)}>
                              Archive
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{editingWarehouseId ? "Edit Warehouse" : "Create Warehouse"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><label className="text-label text-text-secondary">Warehouse name</label><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div>
            <div className="space-y-1"><label className="text-label text-text-secondary">Location</label><Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} /></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1"><label className="text-label text-text-secondary">Utilization %</label><Input value={form.capacityUtilization} onChange={(event) => setForm((current) => ({ ...current, capacityUtilization: event.target.value }))} /></div>
              <div className="space-y-1"><label className="text-label text-text-secondary">Status</label><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={selectClassName}><option value="Operational">Operational</option><option value="Under Setup">Under Setup</option><option value="Maintenance">Maintenance</option><option value="Inactive">Inactive</option></select></div>
            </div>
            <div className="flex justify-end gap-3">
              {editingWarehouseId ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingWarehouseId(null);
                    setForm({ name: "", location: "", capacityUtilization: "", status: "Operational" });
                  }}
                >
                  Cancel
                </Button>
              ) : null}
              <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}><PackagePlus className="h-4 w-4" />{editingWarehouseId ? "Save Warehouse" : "Add Warehouse"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function StockInWorkspace() {
  const role = useUiStore((state) => state.role);
  const query = useQuery({
    queryKey: ["erp-purchase-orders", role],
    queryFn: async () => (await apiRequest<PurchaseOrdersResponse>("/api/procurement/purchase-orders", { role })).data,
  });

  if (query.isLoading) return <LoadingStateCard title="Loading stock-in pipeline" />;
  if (query.error || !query.data) return <ErrorStateCard message="Stock-in data is unavailable." />;

  const inboundValue = query.data.purchaseOrders.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="space-y-6">
      <SectionHeader title="Stock In" description="Inbound materials pipeline driven by released purchase orders and expected delivery timelines." />
      <KpiGrid
        items={[
          { label: "Inbound Orders", value: `${query.data.purchaseOrders.length}`, trend: "Expected receipts", tone: "info" },
          { label: "Committed Value", value: formatCurrency(inboundValue), trend: "Open inbound spend", tone: "success" },
          { label: "Due This Week", value: `${query.data.purchaseOrders.filter((item) => new Date(item.expectedDelivery).getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000).length}`, trend: "Arriving soon", tone: "warning" },
          { label: "Vendors In Play", value: `${uniqueCount(query.data.purchaseOrders.map((item) => item.vendorId))}`, trend: "Active supply base", tone: "warning" },
        ]}
      />
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Inbound Register</CardTitle></CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[920px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">PO</th>
                  <th className="px-4 text-left">Project</th>
                  <th className="px-4 text-left">Vendor</th>
                  <th className="px-4 text-left">Expected Delivery</th>
                  <th className="px-4 text-left">Amount</th>
                  <th className="px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {query.data.purchaseOrders.map((item) => (
                  <tr key={item.id} className="border-t border-border-soft">
                    <td className="px-4 py-4 font-medium text-text-primary">{item.id.toUpperCase()}</td>
                    <td className="px-4 py-4">{item.projectName}</td>
                    <td className="px-4 py-4">{item.vendorName}</td>
                    <td className="px-4 py-4">{formatDate(item.expectedDelivery)}</td>
                    <td className="px-4 py-4">{formatCurrency(item.amount)}</td>
                    <td className="px-4 py-4"><Badge tone={toneForStatus(item.status)}>{item.status}</Badge></td>
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

export function StockOutWorkspace() {
  const role = useUiStore((state) => state.role);
  const transfersQuery = useQuery({
    queryKey: ["erp-material-transfers", role],
    queryFn: async () => (await apiRequest<MaterialTransfersResponse>("/api/materials/transfers", { role })).data,
  });
  const consumptionQuery = useQuery({
    queryKey: ["erp-material-consumption", role],
    queryFn: async () => (await apiRequest<MaterialConsumptionResponse>("/api/materials/consumption", { role })).data,
  });

  if (transfersQuery.isLoading || consumptionQuery.isLoading) return <LoadingStateCard title="Loading stock-out activity" />;
  if (transfersQuery.error || consumptionQuery.error || !transfersQuery.data || !consumptionQuery.data) return <ErrorStateCard message="Stock-out data is unavailable." />;

  const activities = [
    ...transfersQuery.data.transfers.map((item) => ({
      id: item.id,
      type: "Transfer",
      materialName: item.materialName,
      destination: item.toWarehouseName,
      quantity: `${item.quantity} ${item.unit}`,
      status: item.status,
      recordedAt: item.createdAt,
      owner: item.requestedByName,
    })),
    ...consumptionQuery.data.consumptions.map((item) => ({
      id: item.id,
      type: "Consumption",
      materialName: item.materialName,
      destination: item.projectName,
      quantity: `${item.quantity} ${item.unit}`,
      status: item.purpose,
      recordedAt: item.consumedOn,
      owner: item.recordedByName,
    })),
  ].sort((left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime());

  return (
    <section className="space-y-6">
      <SectionHeader title="Stock Out" description="Outbound stock movement across inter-warehouse transfers and project-side material consumption." />
      <KpiGrid
        items={[
          { label: "Transfers", value: `${transfersQuery.data.transfers.length}`, trend: "Inter-store movements", tone: "info" },
          { label: "Consumptions", value: `${consumptionQuery.data.consumptions.length}`, trend: "Issued to projects", tone: "warning" },
          { label: "Recent Activities", value: `${activities.length}`, trend: "Tracked outbound events", tone: "success" },
          { label: "Projects Served", value: `${uniqueCount(consumptionQuery.data.consumptions.map((item) => item.projectId))}`, trend: "Consumption coverage", tone: "warning" },
        ]}
      />
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Outbound Activity</CardTitle></CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">Type</th>
                  <th className="px-4 text-left">Material</th>
                  <th className="px-4 text-left">Destination</th>
                  <th className="px-4 text-left">Quantity</th>
                  <th className="px-4 text-left">Owner</th>
                  <th className="px-4 text-left">Recorded</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((item) => (
                  <tr key={item.id} className="border-t border-border-soft">
                    <td className="px-4 py-4"><Badge tone={item.type === "Transfer" ? "info" : "warning"}>{item.type}</Badge></td>
                    <td className="px-4 py-4 text-text-primary">{item.materialName}</td>
                    <td className="px-4 py-4">{item.destination}</td>
                    <td className="px-4 py-4">{item.quantity}</td>
                    <td className="px-4 py-4">{item.owner}</td>
                    <td className="px-4 py-4">{formatDate(item.recordedAt)}</td>
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

export function MaterialReportsWorkspace() {
  const role = useUiStore((state) => state.role);
  const materialsQuery = useQuery({
    queryKey: ["erp-materials", role],
    queryFn: async () => (await apiRequest<MaterialsResponse>("/api/materials", { role })).data,
  });
  const alertsQuery = useQuery({
    queryKey: ["erp-material-alerts", role],
    queryFn: async () => (await apiRequest<MaterialAlertsResponse>("/api/materials/alerts", { role })).data,
  });
  const consumptionQuery = useQuery({
    queryKey: ["erp-material-consumption", role],
    queryFn: async () => (await apiRequest<MaterialConsumptionResponse>("/api/materials/consumption", { role })).data,
  });

  if (materialsQuery.isLoading || alertsQuery.isLoading || consumptionQuery.isLoading) return <LoadingStateCard title="Loading material reports" />;
  if (materialsQuery.error || alertsQuery.error || consumptionQuery.error || !materialsQuery.data || !alertsQuery.data || !consumptionQuery.data) return <ErrorStateCard message="Material report data is unavailable." />;

  const projectRows = Object.values(
    materialsQuery.data.materials.reduce<Record<string, { projectName: string; onHand: number; lowStock: number }>>((accumulator, material) => {
      const current = accumulator[material.projectId] || { projectName: material.projectName, onHand: 0, lowStock: 0 };
      current.onHand += material.onHand;
      current.lowStock += material.status === "Healthy" ? 0 : 1;
      accumulator[material.projectId] = current;
      return accumulator;
    }, {}),
  ).map((item) => ({
    ...item,
    consumptions: consumptionQuery.data.consumptions.filter((entry) => entry.projectName === item.projectName).length,
  }));

  return (
    <section className="space-y-6">
      <SectionHeader title="Material Reports" description="Project-wise material visibility across on-hand balance, low-stock exposure, and issue activity." />
      <KpiGrid
        items={[
          { label: "Tracked Projects", value: `${projectRows.length}`, trend: "Material reporting coverage", tone: "info" },
          { label: "Low Stock Alerts", value: `${alertsQuery.data.summary.lowStock}`, trend: "Need replenishment", tone: "warning" },
          { label: "Critical Items", value: `${alertsQuery.data.summary.critical}`, trend: "Escalated shortages", tone: "warning" },
          { label: "Consumption Entries", value: `${consumptionQuery.data.consumptions.length}`, trend: "Issued material logs", tone: "success" },
        ]}
      />
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Project Material Summary</CardTitle></CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[920px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">Project</th>
                  <th className="px-4 text-left">On Hand Units</th>
                  <th className="px-4 text-left">Low Stock Items</th>
                  <th className="px-4 text-left">Consumption Logs</th>
                </tr>
              </thead>
              <tbody>
                {projectRows.map((row) => (
                  <tr key={row.projectName} className="border-t border-border-soft">
                    <td className="px-4 py-4 font-medium text-text-primary">{row.projectName}</td>
                    <td className="px-4 py-4">{row.onHand}</td>
                    <td className="px-4 py-4">{row.lowStock}</td>
                    <td className="px-4 py-4">{row.consumptions}</td>
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

import { PurchaseReportsWorkspace as NewPurchaseReportsWorkspace } from "@/components/erp/purchases/purchase-reports-workspace";

export function PurchaseReportsWorkspace() {
  return <NewPurchaseReportsWorkspace />;
}


export function TeamsWorkspace() {
  const role = useUiStore((state) => state.role);
  const employeesQuery = useQuery({
    queryKey: ["erp-employees", role],
    queryFn: async () => (await apiRequest<EmployeesResponse>("/api/workforce/employees", { role })).data,
  });
  const contractorsQuery = useQuery({
    queryKey: ["erp-contractors", role],
    queryFn: async () => (await apiRequest<ContractorsResponse>("/api/workforce/contractors", { role })).data,
  });
  const attendanceQuery = useQuery({
    queryKey: ["erp-attendance", role],
    queryFn: async () => (await apiRequest<AttendanceResponse>("/api/workforce/attendance", { role })).data,
  });

  if (employeesQuery.isLoading || contractorsQuery.isLoading || attendanceQuery.isLoading) return <LoadingStateCard title="Loading teams" />;
  if (employeesQuery.error || contractorsQuery.error || attendanceQuery.error || !employeesQuery.data || !contractorsQuery.data || !attendanceQuery.data) return <ErrorStateCard message="Team data is unavailable." />;

  const rows = Object.values(
    employeesQuery.data.employees.reduce<Record<string, {
      teamName: string;
      projectName: string;
      employees: number;
      presentToday: number;
      designations: string[];
    }>>((accumulator, employee) => {
      const key = `${employee.projectId}:${employee.teamName}`;
      const current = accumulator[key] || {
        teamName: employee.teamName,
        projectName: employee.projectName,
        employees: 0,
        presentToday: 0,
        designations: [],
      };
      current.employees += 1;
      if (attendanceQuery.data.attendance.some((entry) => entry.employeeId === employee.id && entry.status === "Present")) {
        current.presentToday += 1;
      }
      if (!current.designations.includes(employee.designation)) {
        current.designations.push(employee.designation);
      }
      accumulator[key] = current;
      return accumulator;
    }, {}),
  ).map((row) => ({
    ...row,
    coverage: `${row.presentToday}/${row.employees}`,
  }));

  return (
    <section className="space-y-6">
      <SectionHeader title="Teams" description="Named workforce team view spanning employee assignment, project alignment, and daily attendance coverage." />
      <KpiGrid
        items={[
          { label: "Team Pods", value: `${rows.length}`, trend: "Current named team deployment", tone: "info" },
          { label: "Employees", value: `${employeesQuery.data.employees.length}`, trend: "Internal headcount", tone: "success" },
          { label: "Named Teams", value: `${uniqueCount(rows.map((row) => row.teamName))}`, trend: "Assigned team pods", tone: "warning" },
          { label: "Contractor Workforce", value: `${contractorsQuery.data.contractors.reduce((sum, item) => sum + item.workforce, 0)}`, trend: "Support labor available", tone: "warning" },
        ]}
      />
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Team Allocation Matrix</CardTitle></CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[920px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">Team</th>
                  <th className="px-4 text-left">Project</th>
                  <th className="px-4 text-left">Employees</th>
                  <th className="px-4 text-left">Attendance</th>
                  <th className="px-4 text-left">Key Roles</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.projectName}-${row.teamName}`} className="border-t border-border-soft">
                    <td className="px-4 py-4 font-medium text-text-primary">{row.teamName}</td>
                    <td className="px-4 py-4 font-medium text-text-primary">{row.projectName}</td>
                    <td className="px-4 py-4">{row.employees}</td>
                    <td className="px-4 py-4">{row.coverage}</td>
                    <td className="px-4 py-4">{row.designations.join(", ")}</td>
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

export function PayrollWorkspace() {
  const role = useUiStore((state) => state.role);
  const employeesQuery = useQuery({
    queryKey: ["erp-employees", role],
    queryFn: async () => (await apiRequest<EmployeesResponse>("/api/workforce/employees", { role })).data,
  });
  const contractorsQuery = useQuery({
    queryKey: ["erp-contractors", role],
    queryFn: async () => (await apiRequest<ContractorsResponse>("/api/workforce/contractors", { role })).data,
  });
  const attendanceQuery = useQuery({
    queryKey: ["erp-attendance", role],
    queryFn: async () => (await apiRequest<AttendanceResponse>("/api/workforce/attendance", { role })).data,
  });

  if (employeesQuery.isLoading || contractorsQuery.isLoading || attendanceQuery.isLoading) return <LoadingStateCard title="Loading payroll support data" />;
  if (employeesQuery.error || contractorsQuery.error || attendanceQuery.error || !employeesQuery.data || !contractorsQuery.data || !attendanceQuery.data) return <ErrorStateCard message="Payroll support data is unavailable." />;

  const rows = Array.from(new Set(employeesQuery.data.employees.map((item) => item.projectName))).map((projectName) => ({
    projectName,
    assignedEmployees: employeesQuery.data.employees.filter((item) => item.projectName === projectName).length,
    present: attendanceQuery.data.attendance.filter((item) => item.projectName === projectName && item.status === "Present").length,
    late: attendanceQuery.data.attendance.filter((item) => item.projectName === projectName && item.status === "Late").length,
    contractorWorkforce: contractorsQuery.data.contractors.filter((item) => item.projectName === projectName).reduce((sum, item) => sum + item.workforce, 0),
  }));

  return (
    <section className="space-y-6">
      <SectionHeader title="Payroll Support" description="Attendance-linked operational inputs for payroll preparation across internal staff and contractor workforce deployment." />
      <KpiGrid
        items={[
          { label: "Employees Assigned", value: `${employeesQuery.data.employees.length}`, trend: "Payroll roster", tone: "info" },
          { label: "Present Today", value: `${attendanceQuery.data.summary.present}`, trend: "Ready for payroll input", tone: "success" },
          { label: "Late Flags", value: `${attendanceQuery.data.summary.late}`, trend: "Need attendance review", tone: "warning" },
          { label: "Contract Workforce", value: `${contractorsQuery.data.contractors.reduce((sum, item) => sum + item.workforce, 0)}`, trend: "External labor support", tone: "warning" },
        ]}
      />
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Payroll Input Board</CardTitle></CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[920px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">Project</th>
                  <th className="px-4 text-left">Assigned</th>
                  <th className="px-4 text-left">Present</th>
                  <th className="px-4 text-left">Late</th>
                  <th className="px-4 text-left">Contract Workforce</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.projectName} className="border-t border-border-soft">
                    <td className="px-4 py-4 font-medium text-text-primary">{row.projectName}</td>
                    <td className="px-4 py-4">{row.assignedEmployees}</td>
                    <td className="px-4 py-4">{row.present}</td>
                    <td className="px-4 py-4">{row.late}</td>
                    <td className="px-4 py-4">{row.contractorWorkforce}</td>
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

const chartPalette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  slate: "#64748b",
};

const donutColors = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444"];

const formatLakhs = (val: number) => {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${(val / 1000).toFixed(0)}k`;
};

function CircularProgress({ value, size = 110, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          className="text-border-soft"
          strokeWidth={strokeWidth}
          stroke="rgba(15, 23, 42, 0.08)"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="#2563eb"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold tracking-tight text-text-primary">{value}</span>
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Health</span>
      </div>
    </div>
  );
}

function Sparkline({ values, color = "#2563eb" }: { values: number[]; color?: string }) {
  const data = values.map((value, index) => ({ index, value }));
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0.01} />
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

function MetricCard({
  label,
  value,
  trend,
  trendType = "up",
  status,
  statusTone = "info",
  sparkline = [20, 30, 40, 50],
  icon,
}: {
  label: string;
  value: string | number;
  trend: string;
  trendType?: "up" | "down" | "neutral" | "warning";
  status: string;
  statusTone?: "success" | "warning" | "error" | "info" | "neutral";
  sparkline?: number[];
  icon: React.ReactNode;
}) {
  const trendPositive = trendType === "up";
  
  const getShellClass = (tone: string) => {
    if (tone === "success") return "border-success/20 bg-surface";
    if (tone === "error") return "border-error/20 bg-surface";
    if (tone === "warning") return "border-warning/20 bg-surface";
    return "border-border-soft bg-surface";
  };

  const getSparkColor = (tone: string) => {
    if (tone === "error") return "#ef4444";
    if (tone === "warning") return "#f59e0b";
    if (tone === "success") return "#22c55e";
    return "#2563eb";
  };

  return (
    <Card className={`overflow-hidden border transition-all duration-200 hover:shadow-soft ${getShellClass(statusTone)}`}>
      <CardContent className="space-y-3.5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface shadow-soft text-accent-primary">
            {icon}
          </div>
          <Badge tone={statusTone}>{status}</Badge>
        </div>
        <div>
          <p className="text-label uppercase tracking-[0.14em] text-text-muted">{label}</p>
          <p className="mt-2 text-[26px] font-bold leading-none tracking-[-0.03em] text-text-primary">
            {value}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className={`text-label font-semibold flex items-center gap-1 ${trendPositive ? "text-success" : trendType === "neutral" ? "text-text-secondary" : "text-warning"}`}>
            {trendPositive ? "↑" : trendType === "neutral" ? "" : "↓"} {trend}
          </p>
          {sparkline && sparkline.length > 0 && (
            <div className="w-24 h-10">
              <Sparkline values={sparkline} color={getSparkColor(statusTone)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkforceInsightsWorkspace() {
  const role = useUiStore((state) => state.role);

  // Queries
  const employeesQuery = useQuery({
    queryKey: ["erp-employees", role],
    queryFn: async () => (await apiRequest<EmployeesResponse>("/api/workforce/employees", { role })).data,
  });

  const contractorsQuery = useQuery({
    queryKey: ["erp-contractors", role],
    queryFn: async () => (await apiRequest<ContractorsResponse>("/api/workforce/contractors", { role })).data,
  });

  const attendanceOverviewQuery = useQuery({
    queryKey: ["erp-attendance-overview", role],
    queryFn: async () => (await apiRequest<any>("/api/workforce/attendance/overview", { role })).data,
  });

  const attendanceAnalyticsQuery = useQuery({
    queryKey: ["erp-attendance-analytics", role],
    queryFn: async () => (await apiRequest<any>("/api/workforce/attendance/analytics", { role })).data,
  });

  const payrollQuery = useQuery({
    queryKey: ["erp-payroll-dashboard", role],
    queryFn: async () => (await apiRequest<PayrollResponse>("/api/workforce/payroll?limit=1000", { role })).data,
  });

  if (
    employeesQuery.isLoading ||
    contractorsQuery.isLoading ||
    attendanceOverviewQuery.isLoading ||
    attendanceAnalyticsQuery.isLoading ||
    payrollQuery.isLoading
  ) {
    return <LoadingStateCard title="Loading Workforce Console" />;
  }

  if (
    employeesQuery.error ||
    contractorsQuery.error ||
    attendanceOverviewQuery.error ||
    attendanceAnalyticsQuery.error ||
    payrollQuery.error ||
    !employeesQuery.data ||
    !contractorsQuery.data ||
    !attendanceOverviewQuery.data ||
    !attendanceAnalyticsQuery.data ||
    !payrollQuery.data
  ) {
    return <ErrorStateCard message="Workforce Console data is unavailable." />;
  }

  // Calculate Health Score
  const attendanceVal = parseFloat(attendanceOverviewQuery.data.attendanceRate.value) || 94.2;
  const productivityVal = payrollQuery.data.summaries.productivityIndex || 88;
  const utilizationVal = payrollQuery.data.summaries.payrollUtilization || 91;
  const healthScore = Math.round((attendanceVal + productivityVal + utilizationVal) / 3);

  // Combine Total Workforce
  const employeesCount = employeesQuery.data.employees.length;
  const contractorsWorkforce = contractorsQuery.data.contractors.reduce((sum, c: any) => sum + c.workforce, 0) || 84;
  const totalWorkforce = employeesCount + contractorsWorkforce;

  // Chart 1 Data: Workforce Presence Trend
  const presenceTrendData = attendanceAnalyticsQuery.data.attendanceTrend.map((pt: any, idx: number) => {
    const contractorBase = contractorsWorkforce;
    const contractWorkforce = Math.round(contractorBase + ((idx % 5) - 2) * 3);
    return {
      date: pt.date,
      attendanceRate: pt.percentage,
      presentEmployees: pt.present,
      contractWorkforce: contractWorkforce,
    };
  });

  // Chart 2 Data: Department Staffing Distribution
  const deptCountMap: Record<string, number> = {};
  employeesQuery.data.employees.forEach((emp: any) => {
    const dept = emp.department || "Other";
    deptCountMap[dept] = (deptCountMap[dept] || 0) + 1;
  });
  const standardDepts = ["Projects", "Procurement", "Finance", "Sales", "Admin"];
  const departmentStaffingData = standardDepts.map((dept) => ({
    department: dept,
    headcount: deptCountMap[dept] || 0,
  })).sort((a, b) => b.headcount - a.headcount);

  // Chart 3 Data: Workforce Composition
  let managersCount = 0;
  let supervisorsCount = 0;
  let regularEmployeesCount = 0;
  employeesQuery.data.employees.forEach((emp: any) => {
    const des = (emp.designation || emp.position || "").toLowerCase();
    if (des.includes("manager") || des.includes("director") || des.includes("lead")) {
      managersCount++;
    } else if (des.includes("supervisor") || des.includes("foreman")) {
      supervisorsCount++;
    } else {
      regularEmployeesCount++;
    }
  });
  const compositionData = [
    { name: "Employees", value: regularEmployeesCount },
    { name: "Contractors", value: contractorsWorkforce },
    { name: "Supervisors", value: supervisorsCount },
    { name: "Managers", value: managersCount },
  ];

  // Chart 4 Data: Workforce Site Deployment (Treemap)
  const projectWorkforceMap: Record<string, number> = {};
  employeesQuery.data.employees.forEach((emp: any) => {
    const projName = emp.projectName || "Unassigned Project";
    projectWorkforceMap[projName] = (projectWorkforceMap[projName] || 0) + 1;
  });
  contractorsQuery.data.contractors.forEach((con: any) => {
    const projName = con.projectName || "Unassigned Project";
    projectWorkforceMap[projName] = (projectWorkforceMap[projName] || 0) + (con.workforce || 0);
  });
  const treemapData = Object.entries(projectWorkforceMap)
    .filter(([name]) => name !== "Unassigned" && name !== "Unassigned Project")
    .map(([name, size]) => ({ name, size }))
    .sort((a, b) => b.size - a.size);

  // Section 5 - Chart 3: Site Attendance Comparison Grouped Bar Chart
  const siteComparisonData = treemapData.slice(0, 5).map((proj) => {
    const internalCount = employeesQuery.data.employees.filter((emp: any) => emp.projectName === proj.name).length;
    const contractorCount = contractorsQuery.data.contractors
      .filter((con: any) => con.projectName === proj.name)
      .reduce((sum, c: any) => sum + c.workforce, 0);
    return {
      projectName: proj.name,
      Internal: internalCount,
      Contractors: contractorCount,
    };
  });

  // Section 7 Data: Workforce Productivity Matrix
  const matrixData = payrollQuery.data.productivityMatrix.map((item) => {
    const hc = employeesQuery.data.employees.filter((emp: any) => emp.department === item.department).length || 12;
    let status = "Optimal";
    let statusTone: "success" | "warning" | "error" = "success";
    if (item.costEfficiency >= 90) {
      status = "Excellent";
      statusTone = "success";
    } else if (item.costEfficiency >= 80) {
      status = "Optimal";
      statusTone = "success";
    } else {
      status = "Underperforming";
      statusTone = "warning";
    }
    return {
      ...item,
      headcount: hc,
      status,
      statusTone,
    };
  });

  // Section 8 Data: Workforce Deployment Center project cards
  const deploymentCards = payrollQuery.data.projectLaborCosts.slice(0, 6).map((proj) => {
    const siteAtt = attendanceAnalyticsQuery.data.siteAttendance.find((sa: any) => sa.site === proj.projectName);
    const attendanceRate = siteAtt ? Math.round(90 + (siteAtt.percentage % 9)) : 93;
    let riskLevel: "Low" | "Medium" | "High" = "Low";
    let riskTone: "success" | "warning" | "error" = "success";
    if (proj.efficiencyScore < 75) {
      riskLevel = "High";
      riskTone = "error";
    } else if (proj.efficiencyScore < 85) {
      riskLevel = "Medium";
      riskTone = "warning";
    } else {
      riskLevel = "Low";
      riskTone = "success";
    }
    return {
      name: proj.projectName,
      workforceAssigned: proj.workforceCount,
      attendanceRate: `${attendanceRate}%`,
      productivityScore: proj.efficiencyScore,
      laborCost: proj.laborCost,
      riskLevel,
      riskTone,
    };
  });

  // Section 9 Data: Trade Coverage Intelligence
  const tradeCoverageList = [
    { trade: "Civil", available: 120, allocated: 108, color: "#2563eb" },
    { trade: "Electrical", available: 45, allocated: 41, color: "#06b6d4" },
    { trade: "Plumbing", available: 30, allocated: 24, color: "#22c55e" },
    { trade: "Finishing", available: 60, allocated: 48, color: "#f59e0b" },
    { trade: "Structural", available: 80, allocated: 76, color: "#ef4444" },
  ].map((item) => {
    const utilization = Math.round((item.allocated / item.available) * 100);
    return {
      ...item,
      utilization,
    };
  });

  // Section 10 Data: Recommendations & Alerts
  const alertsData = [
    {
      severity: "Critical",
      severityTone: "error" as const,
      category: "Attendance Risk",
      description: "Projects Department attendance has dropped below 82% over the last 7 days, delaying milestone sign-offs.",
      action: "Review Attendance",
      link: "/people/attendance",
    },
    {
      severity: "Warning",
      severityTone: "warning" as const,
      category: "Workforce Shortage",
      description: "Riverfront Towers requires 12 additional structural workers within 4 days to remain on schedule.",
      action: "Review Allocation",
      link: "/people/contractors",
    },
    {
      severity: "Warning",
      severityTone: "warning" as const,
      category: "Contractor Compliance",
      description: "Prime Builders (Civil contractor at Skyline Towers) has outstanding safety orientation renewals for 8 workers.",
      action: "View Compliance",
      link: "/people/contractors",
    },
    {
      severity: "Critical",
      severityTone: "error" as const,
      category: "Payroll Spike",
      description: "Finance Department payroll cost increased 14% while productivity metrics remained flat (+1.8%).",
      action: "Review Payroll",
      link: "/people/payroll",
    },
    {
      severity: "Info",
      severityTone: "info" as const,
      category: "Low Productivity Alert",
      description: "Procurement team productivity fell to 78% due to supply chain delays and material shortage logs.",
      action: "View Performance",
      link: "/people/teams",
    },
    {
      severity: "Success",
      severityTone: "success" as const,
      category: "Onboarding & Alignment",
      description: "14 new internal staff successfully completed orientation program this week. Alignment rate at 100%.",
      action: "View Staff Records",
      link: "/people/employees",
    },
  ];

  // Export Handlers
  const handleExportCSV = () => {
    // 1. Executive Summary Details
    const summaryHeaders = ["Metric", "Value", "Status / Trend"];
    const summaryRows = [
      ["Total Workforce", totalWorkforce.toString(), "Stable Growth (+12% vs last month)"],
      ["Attendance Rate", `${attendanceVal.toFixed(1)}%`, "Excellent (+2.1% vs yesterday)"],
      ["Monthly Payroll Cost", formatLakhs(payrollQuery.data.summaries.monthlyPayrollCost), "Normal Growth (+6% cost growth)"],
      ["Workforce Utilization", `${utilizationVal}%`, "Optimal"],
      ["Productivity Index", `${productivityVal}%`, "Optimal (+1.8% efficiency gain)"],
      ["Cost Per Project", formatLakhs(payrollQuery.data.summaries.costPerProject), "On Budget"],
      ["Active Deployed Projects", treemapData.length.toString(), "Active (+1 site deployed)"],
      ["Contractor Workforce", contractorsWorkforce.toString(), "Flexible Pool (+8% external labor)"]
    ];

    // 2. Department Productivity Matrix
    const matrixHeaders = ["Department", "Headcount", "Attendance Rate (%)", "Payroll Cost", "Productivity Score (100)", "Cost Efficiency (%)", "Status"];
    const matrixRows = matrixData.map((row) => [
      row.department,
      row.headcount.toString(),
      `${row.attendanceRate}%`,
      formatLakhs(row.payrollCost),
      row.productivityScore.toString(),
      `${row.costEfficiency}%`,
      row.status
    ]);

    // Build CSV Content
    let csvContent = "";
    
    // Header Section
    csvContent += "WORKFORCE OPERATIONS SUMMARY BRIEF\n";
    csvContent += `Generated At: ,${new Date().toLocaleString()}\n\n`;
    
    // Summary Table
    csvContent += "EXECUTIVE OPERATIONAL KPIS\n";
    csvContent += summaryHeaders.join(",") + "\n";
    summaryRows.forEach((row) => {
      csvContent += row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",") + "\n";
    });
    csvContent += "\n";

    // Matrix Table
    csvContent += "DEPARTMENT PRODUCTIVITY & COST MATRIX\n";
    csvContent += matrixHeaders.join(",") + "\n";
    matrixRows.forEach((row) => {
      csvContent += row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",") + "\n";
    });
    csvContent += "\n";

    // Project Deployment
    const projectHeaders = ["Project Name", "Workforce Assigned", "Attendance Rate", "Productivity Score", "Labor Cost", "Risk Level"];
    const projectRows = deploymentCards.map((p) => [
      p.name,
      p.workforceAssigned.toString(),
      p.attendanceRate,
      p.productivityScore.toString(),
      formatLakhs(p.laborCost),
      p.riskLevel
    ]);
    
    csvContent += "WORKFORCE SITE DEPLOYMENT\n";
    csvContent += projectHeaders.join(",") + "\n";
    projectRows.forEach((row) => {
      csvContent += row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",") + "\n";
    });

    // Download Blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `workforce_command_center_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <section className="space-y-8 pb-12">
      {/* Section 1 - Workforce Health Hero */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          title="Workforce Console"
          description="Monitor workforce health, staffing efficiency, attendance performance, payroll impact, and project deployment across all active operations."
          actions={
            <div className="flex items-center gap-2 no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2 border-border-strong hover:bg-hover text-text-primary"
              >
                <FileDown className="h-4 w-4" />
                <span>Export CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="gap-2 border-border-strong hover:bg-hover text-text-primary"
              >
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-7">
        {/* Workforce Health Score */}
        <Card className="flex flex-col md:flex-row items-center gap-6 p-6 border border-border-soft bg-surface shadow-soft hover:shadow-medium transition-all duration-200 xl:col-span-3">
          <div className="flex shrink-0 items-center justify-center bg-linear-to-tr from-accent-primary/5 to-accent-secondary/5 p-4 rounded-3xl">
            <CircularProgress value={healthScore} size={130} strokeWidth={12} />
          </div>
          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge tone="success" className="font-semibold">+6% vs last month</Badge>
              <Badge tone="neutral" className="font-medium">Excellent Health</Badge>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-text-primary">Workforce Health Score</h3>
            <p className="text-body text-text-secondary text-sm">
              Comprehensive health index aggregated from attendance consistency, payroll cost efficiency, utilization index, and project productivity metrics.
            </p>
          </div>
        </Card>

        {/* Executive Summary Mini Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:col-span-4">
          <Card className="border border-border-soft bg-surface p-5 hover:shadow-soft transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Total Workforce</p>
                <p className="text-2xl font-bold text-text-primary mt-0.5">{totalWorkforce}</p>
              </div>
            </div>
          </Card>
          <Card className="border border-border-soft bg-surface p-5 hover:shadow-soft transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><IndianRupee className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Payroll Cost</p>
                <p className="text-2xl font-bold text-text-primary mt-0.5">{formatLakhs(payrollQuery.data.summaries.monthlyPayrollCost)}</p>
              </div>
            </div>
          </Card>
          <Card className="border border-border-soft bg-surface p-5 hover:shadow-soft transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><UserCheck className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Attendance Rate</p>
                <p className="text-2xl font-bold text-text-primary mt-0.5">{attendanceVal.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
          <Card className="border border-border-soft bg-surface p-5 hover:shadow-soft transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Zap className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Productivity Index</p>
                <p className="text-2xl font-bold text-text-primary mt-0.5">{productivityVal}%</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Section 2 - Executive KPI Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary tracking-tight">Executive Operational KPIs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Workforce"
            value={totalWorkforce}
            trend="+12% vs last month"
            trendType="up"
            status="Stable Growth"
            statusTone="info"
            sparkline={[210, 215, 218, 220, 222, 225, 228]}
            icon={<Users className="h-5 w-5" />}
          />
          <MetricCard
            label="Attendance Rate"
            value={`${attendanceVal.toFixed(1)}%`}
            trend="+2.1% vs yesterday"
            trendType="up"
            status="Excellent"
            statusTone="success"
            sparkline={attendanceOverviewQuery.data.attendanceRate.sparkline || [91, 92, 92, 93, 93, 94, 94]}
            icon={<UserCheck className="h-5 w-5" />}
          />
          <MetricCard
            label="Monthly Payroll Cost"
            value={formatLakhs(payrollQuery.data.summaries.monthlyPayrollCost)}
            trend="+6% cost growth"
            trendType="up"
            status="Normal Growth"
            statusTone="neutral"
            sparkline={payrollQuery.data.summaries.sparklines.monthlyCost || [32, 34, 35, 36, 37, 38, 38.4]}
            icon={<IndianRupee className="h-5 w-5" />}
          />
          <MetricCard
            label="Workforce Utilization"
            value={`${utilizationVal}%`}
            trend="Optimal Allocation"
            trendType="up"
            status="Optimal"
            statusTone="success"
            sparkline={payrollQuery.data.summaries.sparklines.utilization || [88, 89, 90, 91, 91, 91, 91]}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <MetricCard
            label="Productivity Index"
            value={`${productivityVal}%`}
            trend="+1.8% efficiency gain"
            trendType="up"
            status="Optimal"
            statusTone="success"
            sparkline={payrollQuery.data.summaries.sparklines.productivity || [85, 86, 86, 87, 87, 88, 88]}
            icon={<Zap className="h-5 w-5" />}
          />
          <MetricCard
            label="Cost Per Project"
            value={formatLakhs(payrollQuery.data.summaries.costPerProject)}
            trend="+2.3% budget variance"
            trendType="up"
            status="On Budget"
            statusTone="info"
            sparkline={payrollQuery.data.summaries.sparklines.costPerProject || [2.1, 2.2, 2.3, 2.3, 2.4, 2.4, 2.45]}
            icon={<Briefcase className="h-5 w-5" />}
          />
          <MetricCard
            label="Active Projects Staffed"
            value={treemapData.length}
            trend="+1 site deployed"
            trendType="up"
            status="Active"
            statusTone="info"
            sparkline={[10, 11, 11, 12, 12, 13, 13]}
            icon={<Building2 className="h-5 w-5" />}
          />
          <MetricCard
            label="Contractor Workforce"
            value={contractorsWorkforce}
            trend="+8% external labor"
            trendType="up"
            status="Flexible Pool"
            statusTone="warning"
            sparkline={[70, 72, 75, 74, 78, 80, 84]}
            icon={<Hammer className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Section 3 - Workforce Insights Panel */}
      <Card className="border-border-soft overflow-hidden shadow-soft">
        <CardHeader className="bg-linear-to-r from-accent-primary/5 to-accent-secondary/5 border-b border-border-soft pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-primary animate-pulse" />
            <CardTitle className="text-base font-bold">Workforce Insights Panel</CardTitle>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Real-time operational alerts, workforce risks, and hiring forecast recommendations powered by advanced analytics.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Workforce Risk */}
            <div className="flex flex-col justify-between p-4 rounded-2xl border border-error/20 bg-error/5 hover:shadow-soft transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge tone="error" className="font-semibold uppercase tracking-wider text-[10px]">Workforce Risk</Badge>
                  <AlertTriangle className="h-4 w-4 text-error" />
                </div>
                <h4 className="font-bold text-text-primary text-sm">Riverfront Towers Shortage</h4>
                <p className="text-xs text-text-secondary">
                  Structural phase indicates workforce deficit. 12 additional specialized civil workers are required within 14 days.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-8 mt-4 border-error/20 hover:bg-error/10 text-error">
                Review Allocation
              </Button>
            </div>

            {/* Attendance Concern */}
            <div className="flex flex-col justify-between p-4 rounded-2xl border border-warning/20 bg-warning/5 hover:shadow-soft transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge tone="warning" className="font-semibold uppercase tracking-wider text-[10px]">Attendance Concern</Badge>
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <h4 className="font-bold text-text-primary text-sm">Projects Department Dip</h4>
                <p className="text-xs text-text-secondary">
                  Average attendance dropped below 82% this week on Skyline Towers site. High absentee rate flags recorded.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-8 mt-4 border-warning/20 hover:bg-warning/10 text-warning">
                View Attendance
              </Button>
            </div>

            {/* Payroll Alert */}
            <div className="flex flex-col justify-between p-4 rounded-2xl border border-error/20 bg-error/5 hover:shadow-soft transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge tone="error" className="font-semibold uppercase tracking-wider text-[10px]">Payroll Alert</Badge>
                  <ShieldAlert className="h-4 w-4 text-error" />
                </div>
                <h4 className="font-bold text-text-primary text-sm">Labor Cost Discrepancy</h4>
                <p className="text-xs text-text-secondary">
                  Payroll cost increased 14% this month while general productivity index improved by only 2%.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-8 mt-4 border-error/20 hover:bg-error/10 text-error">
                Review Payroll
              </Button>
            </div>

            {/* Hiring Need */}
            <div className="flex flex-col justify-between p-4 rounded-2xl border border-info/20 bg-info/5 hover:shadow-soft transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge tone="info" className="font-semibold uppercase tracking-wider text-[10px]">Hiring Need</Badge>
                  <Users className="h-4 w-4 text-info" />
                </div>
                <h4 className="font-bold text-text-primary text-sm">Site B Workforce Shortage</h4>
                <p className="text-xs text-text-secondary">
                  Workforce projections predict shortage of finishing trades at Aurora Heights. Mobilization required in 14 days.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-8 mt-4 border-info/20 hover:bg-info/10 text-info">
                Review Staffing
              </Button>
            </div>

            {/* Top Performer */}
            <div className="flex flex-col justify-between p-4 rounded-2xl border border-success/20 bg-success/5 hover:shadow-soft transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge tone="success" className="font-semibold uppercase tracking-wider text-[10px]">Top Performer</Badge>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <h4 className="font-bold text-text-primary text-sm">Procurement Team Peak</h4>
                <p className="text-xs text-text-secondary">
                  Procurement Department achieved the highest attendance rate (92%) and productivity index (91%) this period.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-8 mt-4 border-success/20 hover:bg-success/10 text-success">
                View Team
              </Button>
            </div>

            {/* Compliance Note */}
            <div className="flex flex-col justify-between p-4 rounded-2xl border border-neutral/20 bg-neutral/5 hover:shadow-soft transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge tone="neutral" className="font-semibold uppercase tracking-wider text-[10px]">Compliance Alert</Badge>
                  <Info className="h-4 w-4 text-text-secondary" />
                </div>
                <h4 className="font-bold text-text-primary text-sm">Contractor Document Expiries</h4>
                <p className="text-xs text-text-secondary">
                  8 workforce safety checklists at Skyline site will expire within 5 days. Orientation updates required.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-8 mt-4 border-border-strong hover:bg-hover text-text-primary">
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4 - Workforce Overview Analytics */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary tracking-tight">Workforce Overview Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workforce Presence Trend */}
          <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-text-primary">Workforce Presence Trend (Last 30 Days)</CardTitle>
              <p className="text-xs text-text-muted">Total check-in employees compared against contractor workforce.</p>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={presenceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="present-employees-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartPalette.blue} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={chartPalette.blue} stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="contractors-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartPalette.amber} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={chartPalette.amber} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" domain={[70, 100]} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Area yAxisId="left" type="monotone" name="Present Employees" dataKey="presentEmployees" stroke={chartPalette.blue} strokeWidth={2} fill="url(#present-employees-grad)" />
                    <Area yAxisId="left" type="monotone" name="Contractor Workforce" dataKey="contractWorkforce" stroke={chartPalette.amber} strokeWidth={2} fill="url(#contractors-grad)" />
                    <Line yAxisId="right" type="monotone" name="Attendance %" dataKey="attendanceRate" stroke={chartPalette.green} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Department Staffing Distribution */}
          <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-text-primary">Department Staffing Distribution</CardTitle>
              <p className="text-xs text-text-muted">Direct headcount distribution across internal corporate teams.</p>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentStaffingData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(15,23,42,0.06)" />
                    <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <YAxis type="category" dataKey="department" width={80} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                    <Bar dataKey="headcount" fill={chartPalette.cyan} radius={[0, 4, 4, 0]} barSize={16}>
                      {departmentStaffingData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Workforce Composition Donut */}
          <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-text-primary">Workforce Composition</CardTitle>
              <p className="text-xs text-text-muted">Ratio of internal staff, external labor, and management.</p>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 h-72">
              <div className="h-56 w-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={compositionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      isAnimationActive={false}
                    >
                      {compositionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs w-full md:w-1/2">
                {compositionData.map((item, index) => (
                  <div key={item.name} className="flex flex-col p-2 border border-border-soft rounded-xl bg-surface-secondary">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: donutColors[index % donutColors.length] }} />
                      <span className="truncate text-text-secondary font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-lg text-text-primary mt-1 px-4">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Workforce Site Deployment (Treemap) */}
          <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-text-primary">Workforce Site Deployment</CardTitle>
              <p className="text-xs text-text-muted">Total workforce allocation (Internal + Contractor) across active projects.</p>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemapData}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill="#2563eb"
                  >
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-surface p-2 border border-border-soft rounded-lg shadow-soft text-xs">
                              <p className="font-bold text-text-primary">{payload[0].name}</p>
                              <p className="text-text-muted mt-0.5">Staff Deployed: <span className="font-bold text-accent-primary">{payload[0].value}</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 5 - Attendance Analytics */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary tracking-tight">Attendance Analytics</h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Department Attendance Health */}
          <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-text-primary">Department Attendance Health</CardTitle>
              <p className="text-xs text-text-muted">Direct attendance percentage by corporate departments.</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceAnalyticsQuery.data.departmentAttendance} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(15,23,42,0.06)" />
                    <XAxis type="number" domain={[50, 100]} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <YAxis type="category" dataKey="department" width={80} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <Tooltip formatter={(value) => [`${value}%`, "Attendance Rate"]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                    <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={12}>
                      {attendanceAnalyticsQuery.data.departmentAttendance.map((entry: any, index: number) => {
                        const fill = entry.rate >= 90 ? "#22c55e" : entry.rate >= 80 ? "#f59e0b" : "#ef4444";
                        return <Cell key={`cell-${index}`} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Late Arrival Trend */}
          <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-text-primary">Late Arrival Trend (Last 30 Days)</CardTitle>
              <p className="text-xs text-text-muted">Daily volume of employees flagged with late-checkins.</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceAnalyticsQuery.data.lateArrivalTrend} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <Tooltip formatter={(value) => [value, "Late Arrivals"]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                    <Line type="monotone" dataKey="count" stroke={chartPalette.red} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Site Attendance Comparison */}
          <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-text-primary">Site Attendance Comparison</CardTitle>
              <p className="text-xs text-text-muted">Staff presence profile (Internal vs Contractor) on major project sites.</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={siteComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                    <XAxis dataKey="projectName" tickLine={false} axisLine={false} tickFormatter={(val) => val.split(" ")[0]} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Internal" fill={chartPalette.blue} radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="Contractors" fill={chartPalette.amber} radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 6 - Payroll & Cost Analytics */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary tracking-tight">Payroll & Cost Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Payroll Trend */}
          <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-text-primary">Monthly Payroll Trend (12 Months)</CardTitle>
              <p className="text-xs text-text-muted">Total workforce cost expenditure trend.</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={payrollQuery.data.analytics.monthlyTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="payroll-trend-grad-command" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartPalette.blue} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={chartPalette.blue} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <Tooltip formatter={(value) => [formatLakhs(Number(value)), "Payroll Cost"]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                    <Area type="monotone" dataKey="cost" stroke={chartPalette.blue} strokeWidth={2} fillOpacity={1} fill="url(#payroll-trend-grad-command)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Cost by Department */}
          <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-text-primary">Payroll Cost by Department</CardTitle>
              <p className="text-xs text-text-muted">Monthly payroll expenditure by operational departments.</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payrollQuery.data.analytics.costByDepartment} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(15,23,42,0.06)" />
                    <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <YAxis type="category" dataKey="department" width={80} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <Tooltip formatter={(value) => [formatLakhs(Number(value)), "Cost"]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                    <Bar dataKey="cost" fill={chartPalette.cyan} radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payroll Distribution Pie */}
          <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-text-primary">Payroll Distribution Share</CardTitle>
              <p className="text-xs text-text-muted">Breakdown percentage of total payroll by department.</p>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-72 pb-6">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={payrollQuery.data.analytics.payrollDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      isAnimationActive={false}
                    >
                      {payrollQuery.data.analytics.payrollDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Share"]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] mt-2 px-2">
                {payrollQuery.data.analytics.payrollDistribution.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: donutColors[index % donutColors.length] }} />
                    <span className="truncate text-text-secondary font-medium">{item.name}:</span>
                    <span className="font-semibold text-text-primary">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attendance vs Payroll Efficiency */}
          <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-text-primary">Attendance vs Payroll Efficiency</CardTitle>
              <p className="text-xs text-text-muted">Attendance percentage correlated with cost utilization.</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={payrollQuery.data.analytics.efficiencyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <YAxis domain={[70, 100]} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                    <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="attendance" name="Attendance %" stroke={chartPalette.green} strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="payrollEfficiency" name="Payroll Efficiency %" stroke={chartPalette.amber} strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Workforce Cost Projects */}
          <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-text-primary">Top Workforce Cost Projects</CardTitle>
              <p className="text-xs text-text-muted">Top projects by total monthly labor expenditure.</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payrollQuery.data.analytics.topProjects} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(15,23,42,0.06)" />
                    <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <YAxis type="category" dataKey="project" width={80} tickLine={false} axisLine={false} tickFormatter={(val) => val.split(" ")[0]} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                    <Tooltip formatter={(value) => [formatLakhs(Number(value)), "Labor cost"]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                    <Bar dataKey="cost" fill={chartPalette.blue} radius={[0, 4, 4, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 7 - Workforce Productivity Matrix */}
      <Card className="overflow-hidden border border-border-soft shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-text-primary">Workforce Productivity Matrix</CardTitle>
          <p className="text-xs text-text-muted">Department-level operational efficiency, cost comparison, and performance rating metrics.</p>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-left text-xs">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-10 border-b border-border-soft font-semibold">
                  <th className="px-5 font-bold">Department</th>
                  <th className="px-5 font-bold">Headcount</th>
                  <th className="px-5 font-bold">Attendance Rate</th>
                  <th className="px-5 font-bold">Payroll Cost</th>
                  <th className="px-5 font-bold">Productivity Score</th>
                  <th className="px-5 font-bold">Cost Efficiency</th>
                  <th className="px-5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {matrixData.map((row) => (
                  <tr key={row.department} className="h-12 bg-surface hover:bg-hover transition-all text-text-secondary">
                    <td className="px-5 font-semibold text-text-primary">{row.department}</td>
                    <td className="px-5 font-medium">{row.headcount}</td>
                    <td className="px-5 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{row.attendanceRate}%</span>
                        <div className="w-12 h-1.5 bg-hover rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${row.attendanceRate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 font-semibold text-text-primary">{formatLakhs(row.payrollCost)}</td>
                    <td className="px-5 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-text-primary">{row.productivityScore}</span>
                        <span className="text-[10px] text-text-muted">/100</span>
                      </div>
                    </td>
                    <td className="px-5 font-medium">
                      <span className={`font-semibold ${row.costEfficiency >= 85 ? "text-success" : "text-warning"}`}>
                        {row.costEfficiency}%
                      </span>
                    </td>
                    <td className="px-5">
                      <Badge tone={row.statusTone}>{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 8 - Workforce Deployment Center */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary tracking-tight">Workforce Deployment Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deploymentCards.map((proj) => (
            <Card key={proj.name} className="border border-border-soft bg-surface shadow-soft hover:shadow-medium transition-all duration-200">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-bold text-text-primary text-sm tracking-tight truncate flex-1">{proj.name}</h4>
                  <Badge tone={proj.riskTone}>{proj.riskLevel} Risk</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-soft">
                    <p className="text-[10px] uppercase font-bold text-text-muted">Workforce</p>
                    <p className="text-base font-bold text-text-primary mt-0.5">{proj.workforceAssigned} Deployed</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-soft">
                    <p className="text-[10px] uppercase font-bold text-text-muted">Attendance</p>
                    <p className="text-base font-bold text-text-primary mt-0.5">{proj.attendanceRate}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-soft">
                    <p className="text-[10px] uppercase font-bold text-text-muted">Productivity</p>
                    <p className="text-base font-bold text-text-primary mt-0.5">{proj.productivityScore} Score</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-soft">
                    <p className="text-[10px] uppercase font-bold text-text-muted">Labor Cost</p>
                    <p className="text-base font-bold text-text-primary mt-0.5">{formatLakhs(proj.laborCost)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Section 9 - Trade Coverage Performance */}
      <Card className="border border-border-soft shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-text-primary">Trade Coverage & Utilization Performance</CardTitle>
          <p className="text-xs text-text-muted">Allocation comparison and capacity utilization percentages for contractor trades.</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-5">
            {tradeCoverageList.map((trade) => (
              <div key={trade.trade} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary">{trade.trade}</span>
                    <span className="text-text-muted">({trade.allocated} / {trade.available} Workers)</span>
                  </div>
                  <span className={`font-bold ${trade.utilization >= 90 ? "text-error" : trade.utilization >= 80 ? "text-success" : "text-info"}`}>
                    {trade.utilization}% Deployed
                  </span>
                </div>
                <div className="h-3 w-full bg-hover rounded-full overflow-hidden flex">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${trade.utilization}%`,
                      backgroundColor: trade.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 10 - Recommendations & Alerts */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary tracking-tight">Recommendations & Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alertsData.map((alert, idx) => (
            <Card key={idx} className="border border-border-soft bg-surface shadow-soft hover:shadow-medium transition-all duration-200">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Badge tone={alert.severityTone}>{alert.severity}</Badge>
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{alert.category}</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">
                    {alert.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border-soft text-xs">
                  <span className="font-bold text-accent-primary">{alert.action}</span>
                  <Link href={alert.link} className="p-1 hover:bg-hover rounded-lg text-text-muted hover:text-text-primary transition-all">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Section 11 - Executive Brief */}
      <Card className="border border-border-strong bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-medium overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-4 relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-accent-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent-primary" />
              Executive Workforce Brief
            </h3>
            <p className="text-xs text-slate-300">
              Operational summary of current workforce dynamics, payroll fluctuations, and staffing adjustments for executive leadership review.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <ul className="space-y-2.5 text-xs text-slate-200 list-disc pl-5">
              <li>Workforce increased by <span className="font-semibold text-white">18 employees</span> this month across projects and finance.</li>
              <li>Operational check-in attendance improved by <span className="font-semibold text-success">2.3%</span>, hitting target goals.</li>
              <li>Direct payroll expenditure increased by <span className="font-semibold text-white">6%</span> due to overtime shifts and site mobilizations.</li>
            </ul>
            <ul className="space-y-2.5 text-xs text-slate-200 list-disc pl-5">
              <li><span className="font-semibold text-warning">Skyline Towers</span> requires additional structural workforce allocation for civil engineering.</li>
              <li>Procurement team achieved the highest productivity index (<span className="font-semibold text-success">91/100</span>) this month.</li>
              <li className="list-none text-[10px] text-slate-400 font-medium italic pt-2">Last updated 5 minutes ago</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function ProjectHealthWorkspace() {
  const role = useUiStore((state) => state.role);
  const riskQuery = useQuery({
    queryKey: ["erp-project-risk", role],
    queryFn: async () => (await apiRequest<ProjectRiskResponse>("/api/projects/risk", { role })).data,
  });

  if (riskQuery.isLoading) return <LoadingStateCard title="Loading project health" />;
  if (riskQuery.error || !riskQuery.data) return <ErrorStateCard message="Project health data is unavailable." />;

  const { summary, projects, alerts, rules, generatedAt } = riskQuery.data;
  const topAlerts = alerts.slice(0, 6);
  const routeForSignal = (signalType: string) => {
    if (signalType === "Workforce Allocation") return "/people/attendance";
    if (signalType === "Material Shortage") return "/materials/stock-alerts";
    return "/projects/tasks";
  };

  return (
    <section className="space-y-6">
      <SectionHeader title="Project Health & Delay Prediction" description="Rule-based execution risk board covering overdue tasks, overdue milestones, workforce allocation pressure, and material shortages across active projects." />
      <KpiGrid
        items={[
          { label: "Critical Projects", value: `${summary.criticalProjects}`, trend: "Immediate intervention", tone: "warning" },
          { label: "Watchlist Projects", value: `${summary.watchProjects}`, trend: "Monitor this cycle", tone: "warning" },
          { label: "Rule Triggers", value: `${summary.totalSignals}`, trend: `${summary.delayedTaskSignals + summary.milestoneSignals} schedule-related`, tone: "info" },
          { label: "Healthy Projects", value: `${summary.healthyProjects}`, trend: `Generated ${formatDateTime(generatedAt)}`, tone: "success" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Risk Watchboard</CardTitle>
              <Badge tone="info">{summary.totalProjects} projects scored by deterministic rules</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[1120px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Project</th>
                    <th className="px-4 text-left">Risk Score</th>
                    <th className="px-4 text-left">Risk Level</th>
                    <th className="px-4 text-left">Signals</th>
                    <th className="px-4 text-left">Delayed Tasks</th>
                    <th className="px-4 text-left">Milestones</th>
                    <th className="px-4 text-left">Workforce</th>
                    <th className="px-4 text-left">Material Risks</th>
                    <th className="px-4 text-left">Next Due</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-t border-border-soft">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-text-primary">{project.projectName}</p>
                          <p className="text-label text-text-muted">{project.primaryRisk}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-text-primary">{project.riskScore}</td>
                      <td className="px-4 py-4"><Badge tone={toneForSeverity(project.riskLevel)}>{project.riskLevel}</Badge></td>
                      <td className="px-4 py-4">{project.openSignals}</td>
                      <td className="px-4 py-4">{project.delayedTasks}</td>
                      <td className="px-4 py-4">{project.delayedMilestones}</td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p>{project.presentLabor} present</p>
                          <p className="text-label text-text-muted">{project.engagedContractorWorkforce} external · {project.averageResourceUtilization}% util.</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p>{project.materialShortages} low stock</p>
                          <p className="text-label text-text-muted">{project.criticalMaterialShortages} critical buffer</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">{project.nextDueAt ? formatDate(project.nextDueAt) : "No due date"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Delay Alerts</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {topAlerts.map((alert) => (
                <div key={alert.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-text-primary">{alert.title}</p>
                    <Badge tone={toneForSeverity(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <p className="mt-2 text-body text-text-secondary">{alert.detail}</p>
                  <p className="mt-2 text-label text-text-muted">
                    {alert.projectName} · {alert.metricLabel}: {alert.metricValue}
                    {alert.dueAt ? ` · Due ${formatDate(alert.dueAt)}` : ""}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" variant="secondary" onClick={() => window.location.assign(routeForSignal(alert.signalType))}>
                      Review Trigger
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Rule Engine</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-text-primary">{rule.title}</p>
                    <Badge tone="info">{rule.threshold}</Badge>
                  </div>
                  <p className="mt-2 text-body text-text-secondary">{rule.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={`${project.id}-summary`}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{project.projectName}</CardTitle>
                <Badge tone={toneForSeverity(project.riskLevel)}>{project.riskScore}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-body text-text-primary">{project.latestReportSummary}</p>
              <p className="text-label text-text-muted">Primary risk: {project.primaryRisk}</p>
              <p className="text-label text-text-muted">Latest report: {project.latestReportDate ? formatDate(project.latestReportDate) : "No report yet"}</p>
              <div className="flex flex-wrap gap-2">
                {project.signals.map((signal) => (
                  <Badge key={signal.id} tone={toneForSeverity(signal.severity)}>{signal.signalType}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function OperationalOverviewWorkspace() {
  const role = useUiStore((state) => state.role);
  const requestsQuery = useQuery({
    queryKey: ["erp-purchase-requests", role],
    queryFn: async () => (await apiRequest<PurchaseRequestsResponse>("/api/procurement/requests", { role })).data,
  });
  const ordersQuery = useQuery({
    queryKey: ["erp-purchase-orders", role],
    queryFn: async () => (await apiRequest<PurchaseOrdersResponse>("/api/procurement/purchase-orders", { role })).data,
  });
  const transfersQuery = useQuery({
    queryKey: ["erp-material-transfers", role],
    queryFn: async () => (await apiRequest<MaterialTransfersResponse>("/api/materials/transfers", { role })).data,
  });
  const attendanceQuery = useQuery({
    queryKey: ["erp-attendance", role],
    queryFn: async () => (await apiRequest<AttendanceResponse>("/api/workforce/attendance", { role })).data,
  });

  if (requestsQuery.isLoading || ordersQuery.isLoading || transfersQuery.isLoading || attendanceQuery.isLoading) return <LoadingStateCard title="Loading operational overview" />;
  if (requestsQuery.error || ordersQuery.error || transfersQuery.error || attendanceQuery.error || !requestsQuery.data || !ordersQuery.data || !transfersQuery.data || !attendanceQuery.data) return <ErrorStateCard message="Operational overview data is unavailable." />;

  const feed = [
    ...requestsQuery.data.requests.map((item) => ({
      id: item.id,
      module: "Procurement",
      title: item.title,
      owner: item.requestedByName,
      when: item.createdAt,
      status: item.status,
    })),
    ...ordersQuery.data.purchaseOrders.map((item) => ({
      id: item.id,
      module: "Stock In",
      title: `${item.vendorName} for ${item.projectName}`,
      owner: item.vendorName,
      when: item.expectedDelivery,
      status: item.status,
    })),
    ...transfersQuery.data.transfers.map((item) => ({
      id: item.id,
      module: "Materials",
      title: `${item.materialName} to ${item.toWarehouseName}`,
      owner: item.requestedByName,
      when: item.createdAt,
      status: item.status,
    })),
  ].sort((left, right) => new Date(right.when).getTime() - new Date(left.when).getTime());

  return (
    <section className="space-y-6">
      <SectionHeader title="Operational Overview" description="Daily command view across procurement intake, inbound orders, material movement, and workforce presence." />
      <KpiGrid
        items={[
          { label: "Open Requests", value: `${requestsQuery.data.requests.filter((item) => item.status !== "Closed").length}`, trend: "Procurement workload", tone: "info" },
          { label: "Committed Spend", value: formatCurrency(ordersQuery.data.purchaseOrders.reduce((sum, item) => sum + item.amount, 0)), trend: "Released PO value", tone: "success" },
          { label: "Transfers In Motion", value: `${transfersQuery.data.transfers.filter((item) => item.status === "In Transit").length}`, trend: "Warehouse movement", tone: "warning" },
          { label: "Present Workforce", value: `${attendanceQuery.data.summary.present}`, trend: "Operational readiness", tone: "warning" },
        ]}
      />
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Cross-Module Activity Feed</CardTitle></CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">Module</th>
                  <th className="px-4 text-left">Activity</th>
                  <th className="px-4 text-left">Owner</th>
                  <th className="px-4 text-left">When</th>
                  <th className="px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {feed.map((item) => (
                  <tr key={item.id} className="border-t border-border-soft">
                    <td className="px-4 py-4"><Badge tone="info">{item.module}</Badge></td>
                    <td className="px-4 py-4 text-text-primary">{item.title}</td>
                    <td className="px-4 py-4">{item.owner}</td>
                    <td className="px-4 py-4">{formatDate(item.when)}</td>
                    <td className="px-4 py-4"><Badge tone={toneForStatus(item.status)}>{item.status}</Badge></td>
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
