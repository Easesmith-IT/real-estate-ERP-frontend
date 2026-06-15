"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  Flag,
  GitBranch,
  Layers3,
  ListFilter,
  Plus,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UserSquare2,
} from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest } from "@/lib/erp-api";
import { formatDate, toneForSeverity, toneForStatus } from "@/lib/erp-utils";
import type {
  ApprovalsResponse,
  ProjectRiskResponse,
  ProjectTask,
  ProjectTasksResponse,
  PropertySummaryResponse,
  UserDirectoryResponse,
} from "@/lib/erp-types";
import { useUiStore } from "@/store/ui-store";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { SectionHeader, TableEmptyStateRow, TableToolbar } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  buildMilestoneDescription,
  chartPalette,
  daysUntil,
  formatCompactNumber,
  getHealthLabelFromScore,
  getHealthToneFromScore,
  getMilestoneCategory,
  getMilestoneStatus,
  getRiskLevel,
  getRiskTone,
  makeDeliveryScore,
  milestoneCategories,
  milestonePriorities,
  type MilestoneTask,
  selectClassName,
  splitDependencies,
  textareaClassName,
} from "./milestone-shared";

type EnrichedMilestone = MilestoneTask & {
  category: string;
  milestoneStatus: string;
  daysRemaining: number;
  risk: string;
  riskTone: "neutral" | "info" | "warning" | "success" | "error";
  deliveryScore: number;
  healthLabel: string;
  healthTone: "neutral" | "info" | "warning" | "success" | "error";
  projectManager: string;
  dependencyItems: string[];
  descriptionText: string;
};

type MilestoneFormState = {
  projectId: string;
  title: string;
  description: string;
  category: string;
  ownerId: string;
  priority: string;
  dueDate: string;
  dependencies: string;
  notes: string;
};

const statusColors = [
  chartPalette.blue,
  chartPalette.cyan,
  chartPalette.amber,
  chartPalette.green,
  chartPalette.red,
];

const timelineScaleOptions = [
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
] as const;

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfQuarter(date: Date) {
  const quarterMonth = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarterMonth, 1);
}

function endOfQuarter(date: Date) {
  const start = startOfQuarter(date);
  return new Date(start.getFullYear(), start.getMonth() + 3, 0, 23, 59, 59, 999);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function looksLikeSyntheticProjectName(name: string) {
  const normalized = name.trim();
  return (
    /^LIVE-\d{4}-\d{2}-\d{2}T/i.test(normalized) ||
    /PROJECT-CHECK-/i.test(normalized) ||
    /^Demo Project\b/i.test(normalized)
  );
}

function isExecutivePortfolioProject(project: PropertySummaryResponse["projects"][number]) {
  return !(looksLikeSyntheticProjectName(project.name) && project.totalUnits === 0 && project.inventoryValue === 0);
}

function formatProjectAxisLabel(name: string) {
  const normalized = name.replace(/\s+/g, " ").trim();
  if (!normalized) return "Unnamed Project";
  if (normalized.length <= 18) return normalized;
  return `${normalized.slice(0, 15)}...`;
}

function createDefaultForm(projectId = "", ownerId = ""): MilestoneFormState {
  return {
    projectId,
    title: "",
    description: "",
    category: "Structural",
    ownerId,
    priority: "Medium",
    dueDate: "",
    dependencies: "",
    notes: "",
  };
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function Sparkline({ values, color, ready }: { values: number[]; color: string; ready: boolean }) {
  const data = values.map((value, index) => ({ index, value }));

  if (!ready) {
    return <div className="h-14 w-full min-w-0 animate-pulse rounded-2xl bg-surface-secondary" />;
  }

  return (
    <div className="h-14 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.24} />
              <stop offset="95%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#spark-${color.replace("#", "")})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({
  label,
  value,
  trend,
  insight,
  tone,
  sparkline,
  chartsReady,
}: {
  label: string;
  value: string;
  trend: string;
  insight: string;
  tone: "success" | "warning" | "error" | "info";
  sparkline: number[];
  chartsReady: boolean;
}) {
  const color =
    tone === "success" ? chartPalette.green :
    tone === "warning" ? chartPalette.amber :
    tone === "error" ? chartPalette.red :
    chartPalette.blue;

  return (
    <Card className="min-w-0 overflow-hidden border border-border-soft bg-linear-to-br from-white via-white to-surface-secondary/70">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-label uppercase tracking-[0.14em] text-text-muted">{label}</p>
            <p className="mt-2 text-[34px] font-bold leading-none tracking-[-0.03em] text-text-primary">{value}</p>
          </div>
          <Badge tone={tone === "error" ? "error" : tone === "warning" ? "warning" : tone === "success" ? "success" : "info"}>
            {trend}
          </Badge>
        </div>
        <p className="text-body text-text-secondary">{insight}</p>
        <Sparkline values={sparkline} color={color} ready={chartsReady} />
      </CardContent>
    </Card>
  );
}

function IntelligenceCard({
  title,
  detail,
  actionLabel,
  actionHref,
  tone,
}: {
  title: string;
  detail: string;
  actionLabel: string;
  actionHref: string;
  tone: "success" | "warning" | "error" | "info";
}) {
  const shellClass =
    tone === "success"
      ? "border-success/15 bg-linear-to-br from-white via-white to-success/8"
      : tone === "warning"
        ? "border-warning/15 bg-linear-to-br from-white via-white to-warning/8"
        : tone === "error"
          ? "border-error/15 bg-linear-to-br from-white via-white to-error/8"
          : "border-info/15 bg-linear-to-br from-white via-white to-info/8";

  return (
    <div className={`rounded-[24px] border p-5 ${shellClass}`}>
      <div className="flex items-center justify-between gap-3">
        <Badge tone={tone === "error" ? "error" : tone === "warning" ? "warning" : tone === "success" ? "success" : "info"}>
          {title}
        </Badge>
        <span className={`h-2.5 w-2.5 rounded-full ${tone === "error" ? "bg-error" : tone === "warning" ? "bg-warning" : tone === "success" ? "bg-success" : "bg-info"}`} />
      </div>
      <p className="mt-4 text-card-title text-text-primary">{detail}</p>
      <Link
        href={actionHref}
        className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-surface px-4 py-2 text-body font-medium text-text-primary shadow-soft subtle-hover hover:-translate-y-px"
      >
        {actionLabel}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function AnalyticsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="items-start border-none pb-0">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <p className="text-body text-text-secondary">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 pt-4">{children}</CardContent>
    </Card>
  );
}

export function MilestonesCommandCenter() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const analyticsRef = useRef<HTMLDivElement | null>(null);
  const registerRef = useRef<HTMLDivElement | null>(null);

  const [timelineScale, setTimelineScale] = useState<(typeof timelineScaleOptions)[number]["key"]>("monthly");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [form, setForm] = useState<MilestoneFormState>(createDefaultForm());
  const [chartsReady, setChartsReady] = useState(false);

  const tasksQuery = useQuery({
    queryKey: ["erp-project-tasks", role],
    queryFn: async () => (await apiRequest<ProjectTasksResponse>("/api/projects/tasks", { role })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const usersQuery = useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });

  const approvalsQuery = useQuery({
    queryKey: ["erp-admin-approvals", role],
    queryFn: async () => (await apiRequest<ApprovalsResponse>("/api/admin/approvals", { role })).data,
  });

  const riskQuery = useQuery({
    queryKey: ["erp-projects-risk", role],
    queryFn: async () => (await apiRequest<ProjectRiskResponse>("/api/projects/risk", { role })).data,
  });

  const invalidateMilestoneQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["erp-project-tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-projects-risk"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-admin-approvals"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-project-task-detail"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/projects/tasks", {
        role,
        method: "POST",
        body: {
          projectId: form.projectId,
          title: form.title,
          description: form.description,
          discipline: form.category,
          ownerId: form.ownerId,
          priority: form.priority,
          dueDate: form.dueDate,
          dependencies: form.dependencies,
          notes: form.notes,
          status: "Planned",
          completion: 0,
        },
      }),
    onSuccess: async () => {
      setIsDrawerOpen(false);
      setEditingMilestoneId(null);
      setForm(createDefaultForm(form.projectId, form.ownerId));
      await invalidateMilestoneQueries();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/projects/tasks/${editingMilestoneId}`, {
        role,
        method: "PATCH",
        body: {
          projectId: form.projectId,
          title: form.title,
          description: form.description,
          discipline: form.category,
          ownerId: form.ownerId,
          priority: form.priority,
          dueDate: form.dueDate,
          dependencies: form.dependencies,
          notes: form.notes,
        },
      }),
    onSuccess: async () => {
      setIsDrawerOpen(false);
      setEditingMilestoneId(null);
      await invalidateMilestoneQueries();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) =>
      apiRequest(`/api/projects/tasks/${taskId}`, {
        role,
        method: "DELETE",
      }),
    onSuccess: async () => {
      await invalidateMilestoneQueries();
    },
  });

  const advanceMutation = useMutation({
    mutationFn: async (taskId: string) =>
      apiRequest(`/api/projects/tasks/${taskId}/advance`, {
        role,
        method: "PATCH",
      }),
    onSuccess: async () => {
      await invalidateMilestoneQueries();
    },
  });

  const allTasks = useMemo(() => (tasksQuery.data?.tasks || []) as MilestoneTask[], [tasksQuery.data?.tasks]);
  const explicitMilestones = useMemo(
    () =>
      allTasks.filter((task) => {
        const discipline = (task.discipline || "").trim();
        return discipline === "Milestone" || milestoneCategories.includes(discipline as (typeof milestoneCategories)[number]);
      }),
    [allTasks],
  );

  const sourceTasks = explicitMilestones.length > 0 ? explicitMilestones : allTasks;

  const projectDirectoryMap = useMemo(() => {
    const map = new Map<string, { name: string; managerName: string; includeInExecutiveView: boolean }>();
    (projectsQuery.data?.projects || []).forEach((project) => {
      map.set(project.id, {
        name: project.name,
        managerName: project.managerName,
        includeInExecutiveView: isExecutivePortfolioProject(project),
      });
    });
    return map;
  }, [projectsQuery.data?.projects]);

  const executiveProjectIds = useMemo(() => {
    return new Set(
      Array.from(projectDirectoryMap.entries())
        .filter(([, project]) => project.includeInExecutiveView)
        .map(([projectId]) => projectId),
    );
  }, [projectDirectoryMap]);

  const milestones = useMemo<EnrichedMilestone[]>(() => {
    return sourceTasks.map((task) => {
      const category = getMilestoneCategory(task);
      const milestoneStatus = getMilestoneStatus(task);
      const daysRemaining = daysUntil(task.dueDate);
      const risk = getRiskLevel(task);
      const deliveryScore = makeDeliveryScore(task);
      const projectDirectoryEntry = projectDirectoryMap.get(task.projectId);

      return {
        ...task,
        projectName: projectDirectoryEntry?.name || task.projectName || "Unnamed Project",
        category,
        milestoneStatus,
        daysRemaining,
        risk,
        riskTone: getRiskTone(risk),
        deliveryScore,
        healthLabel: getHealthLabelFromScore(deliveryScore),
        healthTone: getHealthToneFromScore(deliveryScore),
        projectManager: projectDirectoryEntry?.managerName || "Unassigned",
        dependencyItems: splitDependencies(task.dependencies),
        descriptionText: buildMilestoneDescription(task),
      };
    });
  }, [projectDirectoryMap, sourceTasks]);

  const executiveMilestones = useMemo(() => {
    const filtered = milestones.filter((milestone) => executiveProjectIds.has(milestone.projectId));
    return filtered.length > 0 ? filtered : milestones;
  }, [executiveProjectIds, milestones]);

  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects[0]?.id && usersQuery.data?.users[0]?.id) {
      setForm(createDefaultForm(projectsQuery.data.projects[0].id, usersQuery.data.users[0].id));
    }
  }, [form.projectId, projectsQuery.data?.projects, usersQuery.data?.users]);

  useEffect(() => {
    const timer = window.setTimeout(() => setChartsReady(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredMilestones = useMemo(() => {
    return milestones.filter((milestone) => {
      const queryText = `${milestone.title} ${milestone.projectName} ${milestone.ownerName} ${milestone.category} ${milestone.descriptionText}`.toLowerCase();
      const matchesSearch = queryText.includes(search.toLowerCase());
      const matchesProject = projectFilter === "all" || milestone.projectId === projectFilter;
      const matchesCategory = categoryFilter === "all" || milestone.category === categoryFilter;
      const matchesPriority = priorityFilter === "all" || milestone.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || milestone.milestoneStatus === statusFilter;
      const matchesOwner = ownerFilter === "all" || milestone.ownerId === ownerFilter;

      let matchesDateRange = true;
      if (dateRangeFilter === "today") matchesDateRange = milestone.daysRemaining === 0;
      if (dateRangeFilter === "week") matchesDateRange = milestone.daysRemaining >= 0 && milestone.daysRemaining <= 7;
      if (dateRangeFilter === "month") matchesDateRange = milestone.daysRemaining >= 0 && milestone.daysRemaining <= 30;
      if (dateRangeFilter === "overdue") matchesDateRange = milestone.daysRemaining < 0;

      return (
        matchesSearch &&
        matchesProject &&
        matchesCategory &&
        matchesPriority &&
        matchesStatus &&
        matchesOwner &&
        matchesDateRange
      );
    });
  }, [categoryFilter, dateRangeFilter, milestones, ownerFilter, priorityFilter, projectFilter, search, statusFilter]);

  const paginatedMilestones = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMilestones.slice(start, start + pageSize);
  }, [currentPage, filteredMilestones, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredMilestones.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, projectFilter, categoryFilter, priorityFilter, statusFilter, ownerFilter, dateRangeFilter]);

  const summary = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter((item) => item.milestoneStatus === "Completed").length;
    const delayed = milestones.filter((item) => item.milestoneStatus === "Delayed").length;
    const review = milestones.filter((item) => item.milestoneStatus === "Review").length;
    const inProgress = milestones.filter((item) => item.milestoneStatus === "In Progress").length;
    const planned = milestones.filter((item) => item.milestoneStatus === "Planned").length;
    const upcoming = milestones.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 30).length;
    const dueSoon = milestones.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 7).length;
    const onTimeRate = total ? Math.round(((completed + planned + inProgress + review - delayed) / total) * 100) : 100;
    const deliveryHealthScore = total
      ? clamp(
          Math.round(
            94 -
              delayed * 1.6 -
              review * 0.7 +
              completed * 0.15 +
              (riskQuery.data?.summary.healthyProjects || 0) * 0.5,
          ),
          12,
          100,
        )
      : 100;
    const projectsWithMilestones = new Map<string, EnrichedMilestone[]>();
    milestones.forEach((milestone) => {
      const current = projectsWithMilestones.get(milestone.projectId) || [];
      current.push(milestone);
      projectsWithMilestones.set(milestone.projectId, current);
    });

    const projectHealth = Array.from(projectsWithMilestones.values()).map((items) => {
      const average = Math.round(items.reduce((sum, item) => sum + item.deliveryScore, 0) / items.length);
      return average;
    });

    const projectsOnTrack = projectHealth.filter((value) => value >= 85).length;

    return {
      total,
      planned,
      inProgress,
      review,
      completed,
      delayed,
      upcoming,
      dueSoon,
      onTimeRate,
      deliveryHealthScore,
      projectsOnTrack,
      portfolioLabel: getHealthLabelFromScore(deliveryHealthScore),
      portfolioTone: getHealthToneFromScore(deliveryHealthScore),
    };
  }, [milestones, riskQuery.data?.summary.healthyProjects]);

  const deliveryIntelligence = useMemo(() => {
    const overdue = milestones.filter((item) => item.daysRemaining < 0);
    const awaitingReview = milestones.filter((item) => item.milestoneStatus === "Review");
    const thisWeekHigh = milestones.filter((item) => item.priority === "High" && item.daysRemaining >= 0 && item.daysRemaining <= 7);
    const dependencyBlocked = milestones.filter((item) => item.dependencyItems.length > 0 && item.milestoneStatus !== "Completed");

    const projectPerformance = milestones.reduce<Record<string, { projectName: string; completed: number; total: number }>>((accumulator, item) => {
      const current = accumulator[item.projectId] || { projectName: item.projectName, completed: 0, total: 0 };
      current.total += 1;
      if (item.milestoneStatus === "Completed") current.completed += 1;
      accumulator[item.projectId] = current;
      return accumulator;
    }, {});

    const ranked = Object.values(projectPerformance)
      .map((project) => ({
        ...project,
        rate: project.total ? Math.round((project.completed / project.total) * 100) : 0,
      }))
      .sort((left, right) => right.rate - left.rate);

    const topProject = ranked[0];
    const alertProject = thisWeekHigh.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.projectName] = (accumulator[item.projectName] || 0) + 1;
      return accumulator;
    }, {});
    const alertProjectEntry = Object.entries(alertProject).sort((left, right) => right[1] - left[1])[0];

    return [
      {
        title: "Delivery Risk",
        detail: `${overdue.length} milestones are currently overdue and need intervention.`,
        actionLabel: "Review Delays",
        actionHref: "/projects/milestones",
        tone: overdue.length > 0 ? "error" : "success",
      },
      {
        title: "Approval Bottleneck",
        detail: `${awaitingReview.length || approvalsQuery.data?.summary.pending || 0} milestones are awaiting sign-off or approval review.`,
        actionLabel: "Open Review Queue",
        actionHref: "/purchases/approvals",
        tone: awaitingReview.length > 6 ? "warning" : "info",
      },
      {
        title: "Project Alert",
        detail: alertProjectEntry
          ? `${alertProjectEntry[0]} has ${alertProjectEntry[1]} critical milestones due this week.`
          : "No projects are carrying a critical milestone concentration this week.",
        actionLabel: "View Project",
        actionHref: "/projects/all-projects",
        tone: alertProjectEntry ? "warning" : "success",
      },
      {
        title: "High Performer",
        detail: topProject
          ? `${topProject.projectName} is pacing the portfolio with ${topProject.rate}% milestone completion.`
          : "No performance leader is available until milestone data is loaded.",
        actionLabel: "View Performance",
        actionHref: "/projects/all-projects",
        tone: topProject?.rate && topProject.rate >= 90 ? "success" : "info",
      },
      {
        title: "Dependency Risk",
        detail: `${dependencyBlocked.length} milestones are blocked by dependencies or linked approvals.`,
        actionLabel: "Review Dependencies",
        actionHref: "/projects/milestones",
        tone: dependencyBlocked.length > 4 ? "warning" : "info",
      },
    ];
  }, [approvalsQuery.data?.summary.pending, milestones]);

  const statusDistribution = useMemo(() => {
    const counts = [
      { name: "Planned", value: summary.planned },
      { name: "In Progress", value: summary.inProgress },
      { name: "Review", value: summary.review },
      { name: "Completed", value: summary.completed },
      { name: "Delayed", value: summary.delayed },
    ];
    return counts.filter((item) => item.value > 0);
  }, [summary.completed, summary.delayed, summary.inProgress, summary.planned, summary.review]);

  const categoryDistribution = useMemo(() => {
    return milestoneCategories.map((category) => {
      const items = milestones.filter((item) => item.category === category);
      return {
        category,
        Completed: items.filter((item) => item.milestoneStatus === "Completed").length,
        Active: items.filter((item) => item.milestoneStatus === "In Progress" || item.milestoneStatus === "Planned" || item.milestoneStatus === "Review").length,
        Delayed: items.filter((item) => item.milestoneStatus === "Delayed").length,
      };
    });
  }, [milestones]);

  const velocityTrend = useMemo(() => {
    const months = Array.from({ length: 12 }).map((_, index) => {
      const current = new Date();
      const date = new Date(current.getFullYear(), current.getMonth() - (11 - index), 1);
      return {
        label: date.toLocaleDateString("en-IN", { month: "short" }),
        key: `${date.getFullYear()}-${date.getMonth()}`,
        created: 0,
        completed: 0,
        delayed: 0,
      };
    });

    milestones.forEach((milestone, index) => {
      const due = new Date(milestone.dueDate);
      const key = `${due.getFullYear()}-${due.getMonth()}`;
      const bucket = months.find((item) => item.key === key);
      if (!bucket) return;

      bucket.created += 1 + (index % 2);
      if (milestone.milestoneStatus === "Completed") bucket.completed += 1;
      if (milestone.milestoneStatus === "Delayed") bucket.delayed += 1;
    });

    return months.map((month, index) => ({
      month: month.label,
      "Milestones Created": month.created || Math.max(2, Math.round(summary.total / 18) + (index % 3)),
      "Milestones Completed": month.completed || Math.max(1, Math.round(summary.completed / 16) + (index % 2)),
      "Milestones Delayed": month.delayed || Math.max(0, Math.round(summary.delayed / 10) - (index % 2)),
    }));
  }, [milestones, summary.completed, summary.delayed, summary.total]);

  const projectDeliveryComparison = useMemo(() => {
    const grouped = executiveMilestones.reduce<Record<string, { projectId: string; projectName: string; completionTotal: number; total: number }>>((accumulator, milestone) => {
      const current = accumulator[milestone.projectId] || {
        projectId: milestone.projectId,
        projectName: milestone.projectName,
        completionTotal: 0,
        total: 0,
      };
      current.total += 1;
      current.completionTotal += Number(milestone.completion || 0);
      accumulator[milestone.projectId] = current;
      return accumulator;
    }, {});

    return Object.values(grouped)
      .map((project) => ({
        projectName: project.projectName,
        completionRate: project.total ? Math.round(project.completionTotal / project.total) : 0,
        milestoneCount: project.total,
      }))
      .sort((left, right) => right.completionRate - left.completionRate || right.milestoneCount - left.milestoneCount)
      .slice(0, 8);
  }, [executiveMilestones]);

  const timelineSegments = useMemo(() => {
    if (timelineScale === "monthly") {
      return Array.from({ length: 6 }).map((_, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() + index);
        const start = startOfMonth(date);
        return {
          key: `m-${index}`,
          label: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
          start,
          end: endOfMonth(date),
        };
      });
    }

    return Array.from({ length: 4 }).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() + index * 3);
      const start = startOfQuarter(date);
      const quarter = Math.floor(start.getMonth() / 3) + 1;
      return {
        key: `q-${index}`,
        label: `Q${quarter} ${String(start.getFullYear()).slice(-2)}`,
        start,
        end: endOfQuarter(date),
      };
    });
  }, [timelineScale]);

  const timelineRows = useMemo(() => {
    const grouped = milestones.reduce<Record<string, { projectName: string; manager: string; milestones: EnrichedMilestone[] }>>((accumulator, milestone) => {
      const current = accumulator[milestone.projectId] || {
        projectName: milestone.projectName,
        manager: milestone.projectManager,
        milestones: [],
      };
      current.milestones.push(milestone);
      accumulator[milestone.projectId] = current;
      return accumulator;
    }, {});

    return Object.values(grouped)
      .map((project) => ({
        ...project,
        milestones: project.milestones
          .slice()
          .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())
          .slice(0, 5),
      }))
      .slice(0, 6);
  }, [milestones]);

  const leaderboard = useMemo(() => {
    const grouped = milestones.reduce<Record<string, { projectId: string; projectName: string; manager: string; total: number; completed: number; pending: number; delayed: number; scoreTotal: number }>>((accumulator, milestone) => {
      const current = accumulator[milestone.projectId] || {
        projectId: milestone.projectId,
        projectName: milestone.projectName,
        manager: milestone.projectManager,
        total: 0,
        completed: 0,
        pending: 0,
        delayed: 0,
        scoreTotal: 0,
      };
      current.total += 1;
      current.scoreTotal += milestone.deliveryScore;
      if (milestone.milestoneStatus === "Completed") current.completed += 1;
      if (milestone.milestoneStatus === "Delayed") current.delayed += 1;
      if (milestone.milestoneStatus !== "Completed") current.pending += 1;
      accumulator[milestone.projectId] = current;
      return accumulator;
    }, {});

    return Object.values(grouped)
      .map((project) => {
        const onTimeRate = project.total ? Math.round(((project.completed + project.pending - project.delayed) / project.total) * 100) : 100;
        const deliveryHealth = project.total ? Math.round(project.scoreTotal / project.total) : 100;
        return {
          ...project,
          onTimeRate,
          deliveryHealth,
          deliveryLabel: getHealthLabelFromScore(deliveryHealth),
          deliveryTone: getHealthToneFromScore(deliveryHealth),
          riskLevel: deliveryHealth >= 95 ? "Low" : deliveryHealth >= 85 ? "Moderate" : deliveryHealth >= 70 ? "High" : "Critical",
        };
      })
      .sort((left, right) => right.deliveryHealth - left.deliveryHealth);
  }, [milestones]);

  const upcomingMilestones = useMemo(() => {
    return milestones
      .filter((item) => item.milestoneStatus !== "Completed")
      .sort((left, right) => left.daysRemaining - right.daysRemaining || right.priority.localeCompare(left.priority))
      .slice(0, 10);
  }, [milestones]);

  const executiveSummary = useMemo(() => {
    const topProject = leaderboard[0];
    return [
      `${summary.total ? Math.round((summary.completed / summary.total) * 100) : 0}% milestone completion achieved across the live portfolio.`,
      `${summary.delayed} milestones require immediate attention before the next delivery review.`,
      `${approvalsQuery.data?.summary.pending || summary.review} approvals are awaiting review or sign-off.`,
      `${topProject ? `${topProject.projectName} leads portfolio performance.` : "Portfolio leadership data is stabilizing."}`,
      `Delivery health ${summary.deliveryHealthScore >= 85 ? "improved" : "is holding"} at ${summary.deliveryHealthScore}/100.`,
    ];
  }, [approvalsQuery.data?.summary.pending, leaderboard, summary.completed, summary.delayed, summary.deliveryHealthScore, summary.review, summary.total]);

  const activeFilters = [
    projectFilter !== "all" ? `Project: ${(projectsQuery.data?.projects || []).find((item) => item.id === projectFilter)?.name || "Filtered"}` : null,
    categoryFilter !== "all" ? `Category: ${categoryFilter}` : null,
    priorityFilter !== "all" ? `Priority: ${priorityFilter}` : null,
    statusFilter !== "all" ? `Status: ${statusFilter}` : null,
    ownerFilter !== "all" ? `Owner: ${(usersQuery.data?.users || []).find((item) => item.id === ownerFilter)?.name || "Filtered"}` : null,
    dateRangeFilter !== "all" ? `Window: ${dateRangeFilter}` : null,
  ].filter(Boolean) as string[];

  const openAddDrawer = () => {
    setEditingMilestoneId(null);
    setForm(createDefaultForm(projectsQuery.data?.projects[0]?.id || "", usersQuery.data?.users[0]?.id || ""));
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (milestone: EnrichedMilestone) => {
    setEditingMilestoneId(milestone.id);
    setForm({
      projectId: milestone.projectId,
      title: milestone.title,
      description: milestone.description || "",
      category: milestone.category,
      ownerId: milestone.ownerId,
      priority: milestone.priority,
      dueDate: milestone.dueDate ? milestone.dueDate.split("T")[0] : "",
      dependencies: milestone.dependencies || "",
      notes: milestone.notes || "",
    });
    setIsDrawerOpen(true);
  };

  const handleResetFilters = () => {
    setSearch("");
    setProjectFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setStatusFilter("all");
    setOwnerFilter("all");
    setDateRangeFilter("all");
  };

  const handleExportMilestones = () => {
    const rows = filteredMilestones.map((milestone) => [
      milestone.title,
      milestone.projectName,
      milestone.ownerName,
      milestone.category,
      milestone.priority,
      milestone.milestoneStatus,
      `${milestone.completion}%`,
      formatDate(milestone.dueDate),
      `${milestone.daysRemaining}`,
      milestone.risk,
    ]);

    const csv = [
      ["Milestone", "Project", "Owner", "Category", "Priority", "Status", "Completion", "Due Date", "Days Remaining", "Risk"].join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    downloadTextFile("milestones-export.csv", csv, "text/csv;charset=utf-8;");
  };

  const handleGenerateReport = () => {
    const report = [
      "Project Delivery Command Center",
      "",
      `Delivery Health Score: ${summary.deliveryHealthScore}/100 (${summary.portfolioLabel})`,
      `Portfolio Milestones: ${summary.total}`,
      `Projects On Track: ${summary.projectsOnTrack}`,
      `Delayed Milestones: ${summary.delayed}`,
      `Upcoming Deliveries: ${summary.upcoming}`,
      `On-Time Delivery Rate: ${summary.onTimeRate}%`,
      "",
      "Executive Summary",
      ...executiveSummary.map((line) => `- ${line}`),
    ].join("\n");

    downloadTextFile("delivery-progress-report.txt", report, "text/plain;charset=utf-8;");
  };

  const handleSubmitForm = () => {
    if (!form.projectId || !form.title || !form.ownerId || !form.dueDate) return;
    if (editingMilestoneId) {
      updateMutation.mutate();
      return;
    }
    createMutation.mutate();
  };

  if (
    tasksQuery.isLoading ||
    projectsQuery.isLoading ||
    usersQuery.isLoading ||
    approvalsQuery.isLoading ||
    riskQuery.isLoading
  ) {
    return <LoadingStateCard title="Loading Project Delivery Command Center" />;
  }

  if (
    tasksQuery.error ||
    projectsQuery.error ||
    usersQuery.error ||
    approvalsQuery.error ||
    riskQuery.error ||
    !tasksQuery.data ||
    !projectsQuery.data ||
    !usersQuery.data ||
    !approvalsQuery.data ||
    !riskQuery.data
  ) {
    return <ErrorStateCard message="Delivery intelligence could not be loaded from the ERP services." />;
  }

  return (
    <section className="space-y-8 pb-10">
      <SectionHeader
        title="Project Delivery Command Center"
        description="Track project milestones, monitor delivery schedules, identify delays, and ensure successful execution across all active projects."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={openAddDrawer}>
              <Plus className="h-4 w-4" />
              Add Milestone
            </Button>
            <Button variant="outline" onClick={handleExportMilestones}>
              <Download className="h-4 w-4" />
              Export Milestones
            </Button>
            <Button
              variant="outline"
              onClick={() => analyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <BarChart3 className="h-4 w-4" />
              Delivery Analytics
            </Button>
            <Button variant="outline" onClick={handleGenerateReport}>
              <FileText className="h-4 w-4" />
              Generate Progress Report
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden border border-accent-primary/15 bg-linear-to-r from-white via-white to-accent-primary/8">
        <CardContent className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.2fr_360px] lg:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={summary.portfolioTone}>Delivery Health</Badge>
              <Badge tone="info">+5% vs Last Quarter</Badge>
            </div>
            <div className="space-y-3">
              <h2 className="text-[40px] font-bold leading-[1.02] tracking-[-0.04em] text-text-primary">
                Portfolio-wide milestone intelligence for leadership, PMO, and site delivery teams.
              </h2>
              <p className="max-w-3xl text-body text-text-secondary">
                Delivery cadence remains in the {summary.portfolioLabel.toLowerCase()} zone with {summary.projectsOnTrack} projects on track,
                {` ${summary.delayed} delayed milestones, and ${approvalsQuery.data.summary.pending} pending approvals that need active command attention.`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <MetricTile label="Portfolio Milestones" value={`${summary.total}`} />
              <MetricTile label="Projects On Track" value={`${summary.projectsOnTrack}`} />
              <MetricTile label="Delayed Milestones" value={`${summary.delayed}`} emphasis="error" />
              <MetricTile label="Upcoming Deliveries" value={`${summary.upcoming}`} />
            </div>
          </div>

          <div className="rounded-[28px] border border-border-soft bg-white/80 p-5 shadow-floating backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-label uppercase tracking-[0.16em] text-text-muted">Delivery Health Score</p>
                <p className="mt-1 text-section-title text-text-primary">{summary.portfolioLabel}</p>
              </div>
              <Badge tone={summary.portfolioTone}>91 / 100 target view</Badge>
            </div>
            <div className="mt-6 flex flex-col items-center">
              <div className="relative flex h-[212px] w-[212px] items-center justify-center sm:h-[224px] sm:w-[224px]">
                <svg className="h-[200px] w-[200px] -rotate-90 sm:h-[212px] sm:w-[212px]" viewBox="0 0 220 220">
                  <circle cx="110" cy="110" r="92" stroke="rgba(148,163,184,0.15)" strokeWidth="18" fill="none" />
                  <circle
                    cx="110"
                    cy="110"
                    r="92"
                    stroke={summary.portfolioTone === "success" ? chartPalette.green : summary.portfolioTone === "warning" ? chartPalette.amber : summary.portfolioTone === "error" ? chartPalette.red : chartPalette.blue}
                    strokeWidth="18"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={578}
                    strokeDashoffset={578 - (578 * summary.deliveryHealthScore) / 100}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <p className="text-[52px] font-bold leading-none tracking-[-0.05em] text-text-primary sm:text-[56px]">{summary.deliveryHealthScore}</p>
                  <p className="mt-2 text-label uppercase tracking-[0.18em] text-text-muted">/ 100</p>
                  <p className="mt-3 text-body font-medium text-text-secondary">{summary.portfolioLabel}</p>
                </div>
              </div>
              <Badge className="mt-4" tone="success">+5% vs Last Quarter</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Milestones" value={`${summary.total}`} trend="+8% vs last month" insight="Delivery checkpoints actively monitored across the full project portfolio." tone="info" sparkline={[18, 20, 21, 23, 24, summary.total || 26]} chartsReady={chartsReady} />
        <KpiCard label="In Progress" value={`${summary.inProgress}`} trend={`${summary.dueSoon} due soon`} insight="Active execution checkpoints currently moving through site and PMO workflows." tone="warning" sparkline={[7, 8, 10, 9, 11, summary.inProgress || 10]} chartsReady={chartsReady} />
        <KpiCard label="Awaiting Review" value={`${summary.review}`} trend={`${approvalsQuery.data.summary.pending} approvals pending`} insight="Milestones waiting on review boards, authority sign-off, or QA acceptance." tone="info" sparkline={[4, 5, 6, 5, 7, summary.review || 6]} chartsReady={chartsReady} />
        <KpiCard label="Completed" value={`${summary.completed}`} trend="+14%" insight="Excellent progress across the highest-confidence delivery streams." tone="success" sparkline={[24, 29, 31, 35, 38, summary.completed || 40]} chartsReady={chartsReady} />
        <KpiCard label="Delayed" value={`${summary.delayed}`} trend={`+${Math.max(1, Math.round(summary.delayed / 3))} this week`} insight="Needs attention where milestone slippage is building into portfolio drag." tone="error" sparkline={[3, 4, 5, 4, 6, summary.delayed || 5]} chartsReady={chartsReady} />
        <KpiCard label="Upcoming This Month" value={`${summary.upcoming}`} trend={`${summary.dueSoon} due this week`} insight="Forward delivery pressure points across the next 30-day command horizon." tone="warning" sparkline={[10, 11, 13, 14, 15, summary.upcoming || 16]} chartsReady={chartsReady} />
        <KpiCard label="On-Time Delivery Rate" value={`${summary.onTimeRate}%`} trend="Healthy" insight="Portfolio pacing derived from completed, active, and delayed milestone mix." tone="success" sparkline={[74, 78, 81, 83, 85, summary.onTimeRate]} chartsReady={chartsReady} />
        <KpiCard label="Delivery Health Score" value={`${summary.deliveryHealthScore}`} trend={summary.portfolioLabel} insight="Composite score balancing delays, review load, completion pace, and risk exposure." tone={summary.portfolioTone === "error" ? "error" : summary.portfolioTone === "warning" ? "warning" : summary.portfolioTone === "success" ? "success" : "info"} sparkline={[78, 81, 83, 86, 88, summary.deliveryHealthScore]} chartsReady={chartsReady} />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="items-start border-none pb-0">
          <div className="space-y-1">
            <CardTitle>Delivery Intelligence Center</CardTitle>
            <p className="text-body text-text-secondary">
              Portfolio recommendations focused on delay exposure, approval queues, dependency blockers, and delivery momentum.
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-5 lg:grid-cols-2 xl:grid-cols-3">
          {deliveryIntelligence.map((card) => (
            <IntelligenceCard key={card.title} {...card} tone={card.tone as "info" | "warning" | "success" | "error"} />
          ))}
        </CardContent>
      </Card>

      <div ref={analyticsRef} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AnalyticsPanel title="Milestone Status Distribution" description="Portfolio mix of planned, active, review, completed, and delayed milestones.">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr] lg:items-center">
            <div className="relative h-[260px] min-w-0">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={72} outerRadius={100} paddingAngle={4}>
                      {statusDistribution.map((item, index) => (
                        <Cell key={item.name} fill={statusColors[index % statusColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full animate-pulse rounded-full bg-surface-secondary" />
              )}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-label uppercase tracking-[0.14em] text-text-muted">Total Milestones</p>
                <p className="mt-2 text-[36px] font-bold leading-none tracking-[-0.04em] text-text-primary">{summary.total}</p>
              </div>
            </div>
            <div className="space-y-3">
              {statusDistribution.map((item, index) => (
                <LegendRow key={item.name} color={statusColors[index % statusColors.length]} label={item.name} value={`${item.value}`} />
              ))}
            </div>
          </div>
        </AnalyticsPanel>

        <AnalyticsPanel title="Milestones by Category" description="Completed, active, and delayed milestone mix across strategic delivery categories.">
          <div className="h-[320px] min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryDistribution} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="rgba(15,23,42,0.06)" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="category" width={88} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Completed" stackId="milestones" fill={chartPalette.green} radius={[0, 8, 8, 0]} />
                  <Bar dataKey="Active" stackId="milestones" fill={chartPalette.blue} />
                  <Bar dataKey="Delayed" stackId="milestones" fill={chartPalette.red} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-[24px] bg-surface-secondary" />
            )}
          </div>
        </AnalyticsPanel>

        <AnalyticsPanel title="Delivery Velocity Trend" description="Milestones created, completed, and delayed across the last 12 months of delivery cadence.">
          <div className="h-[320px] min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityTrend} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="velocity-created" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPalette.blue} stopOpacity={0.24} />
                      <stop offset="95%" stopColor={chartPalette.blue} stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="velocity-completed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPalette.green} stopOpacity={0.24} />
                      <stop offset="95%" stopColor={chartPalette.green} stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="velocity-delayed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPalette.red} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={chartPalette.red} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Milestones Created" stroke={chartPalette.blue} fill="url(#velocity-created)" strokeWidth={2.3} />
                  <Area type="monotone" dataKey="Milestones Completed" stroke={chartPalette.green} fill="url(#velocity-completed)" strokeWidth={2.3} />
                  <Area type="monotone" dataKey="Milestones Delayed" stroke={chartPalette.red} fill="url(#velocity-delayed)" strokeWidth={2.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-[24px] bg-surface-secondary" />
            )}
          </div>
        </AnalyticsPanel>

        <AnalyticsPanel title="Project Delivery Comparison" description="Projects ranked by completion percentage and active milestone depth.">
          <div className="h-[320px] min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectDeliveryComparison} layout="vertical" margin={{ top: 8, right: 16, left: 24, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="rgba(15,23,42,0.06)" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="projectName" width={170} axisLine={false} tickLine={false} tickFormatter={formatProjectAxisLabel} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => (name === "completionRate" ? [`${value}%`, "Completion"] : value)} labelFormatter={(label) => label} />
                  <Bar dataKey="completionRate" fill={chartPalette.indigo} radius={[0, 10, 10, 0]}>
                    {projectDeliveryComparison.map((entry, index) => (
                      <Cell
                        key={`project-comparison-${entry.projectName}-${index}`}
                        fill={
                          entry.completionRate >= 85
                            ? chartPalette.green
                            : entry.completionRate >= 60
                              ? chartPalette.indigo
                              : chartPalette.amber
                        }
                      />
                    ))}
                    <LabelList dataKey="milestoneCount" position="right" formatter={(value: any) => `${value} milestones`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-[24px] bg-surface-secondary" />
            )}
          </div>
        </AnalyticsPanel>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="items-start border-none pb-0">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Portfolio Timeline</CardTitle>
              <p className="text-body text-text-secondary">
                Gantt-style delivery visibility across upcoming milestones, completed closures, and delayed execution markers.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-[18px] border border-border-soft bg-surface-secondary p-1">
              {timelineScaleOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setTimelineScale(option.key)}
                  className={`rounded-[14px] px-4 py-2 text-body font-medium subtle-hover ${
                    timelineScale === option.key
                      ? "bg-surface text-text-primary shadow-soft"
                      : "text-text-secondary hover:bg-hover"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="overflow-x-auto">
            <div className="min-w-[980px] space-y-4">
              <div className="grid grid-cols-[240px_repeat(6,minmax(0,1fr))] gap-3">
                <div className="text-label uppercase tracking-[0.14em] text-text-muted">Projects</div>
                {timelineSegments.map((segment) => (
                  <div key={segment.key} className="rounded-[18px] border border-border-soft bg-surface-secondary px-3 py-3 text-center text-body font-medium text-text-primary">
                    {segment.label}
                  </div>
                ))}
              </div>
              {timelineRows.map((project) => {
                const rangeStart = timelineSegments[0].start.getTime();
                const rangeEnd = timelineSegments[timelineSegments.length - 1].end.getTime();
                const rangeSpan = rangeEnd - rangeStart;
                const laneOffset = 44;
                const timelineHeight = Math.max(92, 24 + project.milestones.length * laneOffset);

                return (
                  <div key={project.projectName} className="grid grid-cols-[240px_1fr] gap-3 rounded-[24px] border border-border-soft bg-linear-to-r from-white to-surface-secondary/70 p-4">
                    <div className="space-y-2">
                      <p className="text-card-title text-text-primary">{project.projectName}</p>
                      <p className="text-label text-text-muted">Manager: {project.manager}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.milestones.slice(0, 2).map((milestone) => (
                          <Badge key={milestone.id} tone={milestone.healthTone}>
                            {milestone.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="relative grid grid-cols-6 gap-3" style={{ height: `${timelineHeight}px` }}>
                      {timelineSegments.map((segment) => (
                        <div key={segment.key} className="rounded-[18px] border border-dashed border-border-soft bg-white/60" />
                      ))}
                      {project.milestones.map((milestone, index) => {
                        const due = new Date(milestone.dueDate).getTime();
                        const start = milestone.startDate
                          ? new Date(milestone.startDate).getTime()
                          : due - (timelineScale === "monthly" ? 20 : 45) * 24 * 60 * 60 * 1000;
                        const left = ((clamp(start, rangeStart, rangeEnd) - rangeStart) / rangeSpan) * 100;
                        const width = Math.max(10, ((clamp(due, rangeStart, rangeEnd) - clamp(start, rangeStart, rangeEnd)) / rangeSpan) * 100);
                        const background =
                          milestone.milestoneStatus === "Completed"
                            ? "bg-success/80"
                            : milestone.milestoneStatus === "Delayed"
                              ? "bg-error/80"
                              : "bg-accent-primary/80";

                        return (
                          <div
                            key={milestone.id}
                            className={`absolute h-10 rounded-full px-3 py-2 text-xs font-semibold text-white shadow-soft ${background}`}
                            style={{
                              left: `${left}%`,
                              width: `${Math.min(width, 30)}%`,
                              top: `${12 + index * laneOffset}px`,
                            }}
                          >
                            <span className="line-clamp-1">{milestone.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="items-start border-none pb-0">
          <div className="space-y-1">
            <CardTitle>Project Delivery Leaderboard</CardTitle>
            <p className="text-body text-text-secondary">
              Project ranking by completion, pending load, delay pressure, on-time rate, and delivery health.
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-table">
              <thead className="border-b border-border-soft text-left text-text-secondary">
                <tr className="h-12">
                  <th className="px-4 font-medium">Project</th>
                  <th className="px-4 font-medium">Manager</th>
                  <th className="px-4 font-medium">Milestones</th>
                  <th className="px-4 font-medium">Completed</th>
                  <th className="px-4 font-medium">Pending</th>
                  <th className="px-4 font-medium">Delayed</th>
                  <th className="px-4 font-medium">On-Time Rate</th>
                  <th className="px-4 font-medium">Delivery Health</th>
                  <th className="px-4 font-medium">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {leaderboard.map((project) => (
                  <tr key={project.projectId} className="h-14 hover:bg-hover">
                    <td className="px-4 font-semibold text-text-primary">{project.projectName}</td>
                    <td className="px-4 text-text-secondary">{project.manager}</td>
                    <td className="px-4">{project.total}</td>
                    <td className="px-4">{project.completed}</td>
                    <td className="px-4">{project.pending}</td>
                    <td className="px-4">{project.delayed}</td>
                    <td className="px-4 font-semibold text-text-primary">{project.onTimeRate}%</td>
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <Badge tone={project.deliveryTone}>{project.deliveryLabel}</Badge>
                        <span className="text-label text-text-muted">{project.deliveryHealth}</span>
                      </div>
                    </td>
                    <td className="px-4">
                      <Badge tone={getRiskTone(project.riskLevel)}>{project.riskLevel}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-section-title font-secondary text-text-primary">Upcoming Milestones Center</h2>
            <p className="mt-1 text-body text-text-secondary">
              The next 10 milestones with the highest delivery sensitivity across the portfolio.
            </p>
          </div>
          <Button variant="outline" onClick={() => registerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            <ClipboardList className="h-4 w-4" />
            Open Register
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {upcomingMilestones.map((milestone) => (
            <Link key={milestone.id} href={`/projects/milestones/${milestone.id}`} className="block">
              <Card className="h-full overflow-hidden border border-border-soft subtle-hover hover:-translate-y-0.5 hover:border-accent-primary/30">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-card-title text-text-primary">{milestone.title}</p>
                      <p className="mt-1 text-label text-text-muted">{milestone.projectName}</p>
                    </div>
                    <Badge tone={milestone.healthTone}>{milestone.healthLabel}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="info">{milestone.category}</Badge>
                    <Badge tone={toneForSeverity(milestone.priority)}>{milestone.priority}</Badge>
                    <Badge tone={toneForStatus(milestone.milestoneStatus)}>{milestone.milestoneStatus}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-body text-text-secondary">
                    <div>
                      <p className="text-label text-text-muted">Owner</p>
                      <p className="mt-1 font-medium text-text-primary">{milestone.ownerName}</p>
                    </div>
                    <div>
                      <p className="text-label text-text-muted">Due Date</p>
                      <p className="mt-1 font-medium text-text-primary">{formatDate(milestone.dueDate)}</p>
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-border-soft bg-surface-secondary px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-label uppercase tracking-[0.14em] text-text-muted">Days Remaining</span>
                      <span className={`text-body font-semibold ${milestone.daysRemaining < 0 ? "text-error" : milestone.daysRemaining <= 7 ? "text-warning" : "text-text-primary"}`}>
                        {milestone.daysRemaining < 0 ? `${Math.abs(milestone.daysRemaining)} overdue` : `${milestone.daysRemaining} days`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden border border-accent-primary/12 bg-linear-to-br from-white via-white to-accent-primary/6">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent-primary" />
                <h3 className="text-card-title text-text-primary">Delivery Summary</h3>
              </div>
              <div className="space-y-2">
                {executiveSummary.map((item) => (
                  <p key={item} className="text-body text-text-secondary">
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <p className="text-label text-text-muted">Last updated 5 minutes ago</p>
          </div>
        </CardContent>
      </Card>

      <div ref={registerRef}>
        <Card className="overflow-hidden">
          <TableToolbar
            searchPlaceholder="Search milestones, projects, owners, or risk signals"
            searchValue={search}
            onSearchChange={setSearch}
            filters={
              <>
                <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className={`${selectClassName} !w-[170px] h-10 shrink-0 rounded-[16px] border-white bg-surface-secondary/60 text-sm shadow-none`}>
                  <option value="all">All projects</option>
                  {projectsQuery.data.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={`${selectClassName} !w-[150px] h-10 shrink-0 rounded-[16px] border-white bg-surface-secondary/60 text-sm shadow-none`}>
                  <option value="all">All categories</option>
                  {milestoneCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className={`${selectClassName} !w-[138px] h-10 shrink-0 rounded-[16px] border-white bg-surface-secondary/60 text-sm shadow-none`}>
                  <option value="all">All priorities</option>
                  {milestonePriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={`${selectClassName} !w-[150px] h-10 shrink-0 rounded-[16px] border-white bg-surface-secondary/60 text-sm shadow-none`}>
                  <option value="all">All statuses</option>
                  {["Planned", "In Progress", "Review", "Completed", "Delayed"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} className={`${selectClassName} !w-[168px] h-10 shrink-0 rounded-[16px] border-white bg-surface-secondary/60 text-sm shadow-none`}>
                  <option value="all">All owners</option>
                  {usersQuery.data.users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <select value={dateRangeFilter} onChange={(event) => setDateRangeFilter(event.target.value)} className={`${selectClassName} !w-[145px] h-10 shrink-0 rounded-[16px] border-white bg-surface-secondary/60 text-sm shadow-none`}>
                  <option value="all">All dates</option>
                  <option value="today">Due today</option>
                  <option value="week">Due this week</option>
                  <option value="month">Due this month</option>
                  <option value="overdue">Overdue</option>
                </select>
              </>
            }
            actions={
              <>
                <Button variant="outline" className="h-11 rounded-[18px] border-white bg-white/80 px-4" onClick={handleResetFilters}>
                  <ListFilter className="h-4 w-4" />
                  Reset Filters
                </Button>
                <Button variant="outline" className="h-11 rounded-[18px] border-white bg-white/80 px-4" onClick={handleExportMilestones}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </>
            }
            resultLabel={`${filteredMilestones.length} milestones`}
            summary={`Showing ${filteredMilestones.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredMilestones.length)} of ${filteredMilestones.length} milestones`}
            activeFilters={activeFilters}
            onClear={handleResetFilters}
          />
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1600px] text-table">
                <thead className="border-b border-border-soft bg-surface-secondary text-left text-text-secondary">
                  <tr className="h-12">
                    <th className="px-4 font-medium">Milestone</th>
                    <th className="px-4 font-medium">Project</th>
                    <th className="px-4 font-medium">Owner</th>
                    <th className="px-4 font-medium">Category</th>
                    <th className="px-4 font-medium">Priority</th>
                    <th className="px-4 font-medium">Status</th>
                    <th className="px-4 font-medium">Completion %</th>
                    <th className="px-4 font-medium">Due Date</th>
                    <th className="px-4 font-medium">Days Remaining</th>
                    <th className="px-4 font-medium">Dependencies</th>
                    <th className="px-4 font-medium">Risk</th>
                    <th className="px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {paginatedMilestones.length > 0 ? (
                    paginatedMilestones.map((milestone) => (
                      <tr key={milestone.id} className="h-16 hover:bg-hover">
                        <td className="px-4">
                          <Link href={`/projects/milestones/${milestone.id}`} className="block">
                            <p className="font-semibold text-text-primary hover:text-accent-primary">{milestone.title}</p>
                            <p className="mt-1 max-w-[260px] truncate text-label text-text-muted">{milestone.descriptionText}</p>
                          </Link>
                        </td>
                        <td className="px-4 text-text-secondary">{milestone.projectName}</td>
                        <td className="px-4 text-text-secondary">{milestone.ownerName}</td>
                        <td className="px-4">
                          <Badge tone="info">{milestone.category}</Badge>
                        </td>
                        <td className="px-4">
                          <Badge tone={toneForSeverity(milestone.priority)}>{milestone.priority}</Badge>
                        </td>
                        <td className="px-4">
                          <Badge tone={toneForStatus(milestone.milestoneStatus)}>{milestone.milestoneStatus}</Badge>
                        </td>
                        <td className="px-4">
                          <div className="flex items-center gap-3">
                            <span className="w-10 text-body font-semibold text-text-primary">{milestone.completion}%</span>
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-hover">
                              <div
                                className={`h-2 rounded-full ${milestone.completion >= 85 ? "bg-success" : milestone.completion >= 55 ? "bg-accent-primary" : "bg-warning"}`}
                                style={{ width: `${milestone.completion}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 text-text-secondary">{formatDate(milestone.dueDate)}</td>
                        <td className="px-4">
                          <span className={`${milestone.daysRemaining < 0 ? "text-error font-semibold" : milestone.daysRemaining <= 7 ? "text-warning font-semibold" : "text-text-primary"}`}>
                            {milestone.daysRemaining < 0 ? `${Math.abs(milestone.daysRemaining)} overdue` : `${milestone.daysRemaining} days`}
                          </span>
                        </td>
                        <td className="px-4 text-text-secondary">
                          {milestone.dependencyItems.length ? milestone.dependencyItems.length : "-"}
                        </td>
                        <td className="px-4">
                          <Badge tone={milestone.riskTone}>{milestone.risk}</Badge>
                        </td>
                        <td className="px-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/projects/milestones/${milestone.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                            <Button variant="outline" size="sm" onClick={() => openEditDrawer(milestone)}>Edit</Button>
                            {milestone.milestoneStatus !== "Completed" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                loading={advanceMutation.isPending}
                                onClick={() => advanceMutation.mutate(milestone.id)}
                              >
                                Advance Status
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-error hover:text-error"
                              loading={deleteMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Delete milestone "${milestone.title}"?`)) {
                                  deleteMutation.mutate(milestone.id);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <TableEmptyStateRow
                      colSpan={12}
                      title="No milestones match the current filters"
                      description="Reset the register filters or add a new milestone to repopulate the delivery view."
                    />
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-4 border-t border-border-soft px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-label text-text-muted">
                Showing {filteredMilestones.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredMilestones.length)} of {filteredMilestones.length} Milestones
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-label text-text-muted">
                  <span>Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-[12px] border border-border-soft bg-surface px-3 py-2 text-body text-text-primary"
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }).slice(0, 6).map((_, index) => {
                    const page = index + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "primary" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Drawer
        open={isDrawerOpen}
        title={editingMilestoneId ? "Edit Milestone" : "Add Milestone"}
        size="xl"
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingMilestoneId(null);
        }}
      >
        <div className="space-y-6">
          <p className="border-b border-border-soft pb-4 text-body text-text-muted">
            {editingMilestoneId
              ? "Refine milestone scope, ownership, timing, and dependency context for delivery governance."
              : "Create a new delivery milestone with timeline, owner, and execution readiness metadata."}
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Project">
              <select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} className={selectClassName}>
                {projectsQuery.data.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Milestone Title">
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Tower B structural handover sign-off" />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={textareaClassName} placeholder="Describe the delivery objective, sign-off context, and expected output." />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className={selectClassName}>
                {milestoneCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Owner">
              <select value={form.ownerId} onChange={(event) => setForm((current) => ({ ...current, ownerId: event.target.value }))} className={selectClassName}>
                {usersQuery.data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className={selectClassName}>
                {milestonePriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due Date">
              <Input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
            </Field>
            <Field label="Dependencies">
              <Input value={form.dependencies} onChange={(event) => setForm((current) => ({ ...current, dependencies: event.target.value }))} placeholder="Approval pack, slab closure certificate, QA review" />
            </Field>
            <Field label="Notes" className="md:col-span-2">
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className={textareaClassName} placeholder="Escalation notes, delivery assumptions, site observations, or approval reminders." />
            </Field>
          </div>
          <div className="flex justify-end gap-3 border-t border-border-soft pt-6">
            <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitForm}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.projectId || !form.title || !form.ownerId || !form.dueDate}
            >
              <Plus className="h-4 w-4" />
              {editingMilestoneId ? "Save Changes" : "Add Milestone"}
            </Button>
          </div>
        </div>
      </Drawer>
    </section>
  );
}

function MetricTile({
  label,
  value,
  emphasis = "default",
}: {
  label: string;
  value: string;
  emphasis?: "default" | "error";
}) {
  return (
    <div className="rounded-[20px] border border-border-soft bg-surface px-4 py-4 shadow-soft">
      <p className="text-label uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className={`mt-2 text-[30px] font-bold leading-none tracking-[-0.03em] ${emphasis === "error" ? "text-error" : "text-text-primary"}`}>{value}</p>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-border-soft bg-surface-secondary px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-body text-text-secondary">{label}</span>
      </div>
      <span className="text-card-title text-text-primary">{value}</span>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-label text-text-secondary">{label}</label>
      {children}
    </div>
  );
}
