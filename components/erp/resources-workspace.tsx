"use client";
import { toast } from "@/components/ui/toast";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardPlus,
  Users,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Zap,
  Building2,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Download,
  Edit,
  Trash2,
  Eye,
  HardHat,
  Search,
  RefreshCcw,
  Hammer,
} from "lucide-react";
import Link from "next/link";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatCurrency } from "@/lib/erp-utils";
import type {
  ResourceAllocation,
  ResourcesResponse,
  PropertySummaryResponse,
} from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { SectionHeader } from "@/components/erp/page-primitives";
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// Select input styling
const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all";

// Sparkline component inside cards
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

// KPI card with sparkline and insights
function PremiumKpiCard({
  label,
  value,
  trend,
  trendType = "up",
  status,
  statusTone = "info",
  sparkline = [20, 30, 40, 50],
  insight,
  icon,
}: {
  label: string;
  value: string | number;
  trend: string;
  trendType?: "up" | "down" | "neutral" | "warning";
  status: string;
  statusTone?: "success" | "warning" | "error" | "info" | "neutral";
  sparkline?: number[];
  insight: string;
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
        <div className="flex items-center justify-between gap-3 pt-1 border-b border-border-soft pb-3">
          <p className={`text-label font-semibold flex items-center gap-1 ${trendPositive ? "text-success" : trendType === "neutral" ? "text-text-secondary" : "text-warning"}`}>
            {trendPositive ? "↑" : trendType === "neutral" ? "" : "↓"} {trend}
          </p>
          {sparkline && sparkline.length > 0 && (
            <div className="w-24 h-10">
              <Sparkline values={sparkline} color={getSparkColor(statusTone)} />
            </div>
          )}
        </div>
        <p className="text-[11px] text-text-muted italic leading-normal">{insight}</p>
      </CardContent>
    </Card>
  );
}

export function ResourcesWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  // Queries
  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const resourcesQuery = useQuery({
    queryKey: ["erp-resources", role],
    queryFn: async () => (await apiRequest<ResourcesResponse>("/api/projects/resources", { role })).data,
  });

  // Table register states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [utilizationFilter, setUtilizationFilter] = useState("All"); // All, Low (<60), Medium (60-85), High (>85)
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Drawer Form state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceAllocation | null>(null);
  const [form, setForm] = useState({
    projectId: "",
    resourceName: "",
    type: "Crew",
    subType: "",
    assignedTo: "",
    utilization: "80",
    status: "Assigned",
    health: "90",
    dailyCost: "600",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, projectFilter, statusFilter, utilizationFilter]);

  // Sync projects option
  useEffect(() => {
    if (!form.projectId && projectsQuery.data?.projects?.length) {
      setForm((prev) => ({ ...prev, projectId: projectsQuery.data.projects[0].id }));
    }
  }, [projectsQuery.data, form.projectId]);

  // Mutation for POST/PUT
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        projectId: form.projectId,
        resourceName: form.resourceName,
        type: form.type,
        subType: form.subType || (form.type === "Crew" ? "Civil Crew" : form.type === "Machinery" ? "Heavy Equipment" : "Contracting"),
        assignedTo: form.assignedTo,
        utilization: Number(form.utilization) || 0,
        status: form.status,
        health: Number(form.health) || 85,
        dailyCost: Number(form.dailyCost) || 500,
        monthlyCost: (Number(form.dailyCost) || 500) * 30,
      };

      if (editingResource) {
        return apiRequest(`/api/projects/resources/${editingResource.id}`, {
          role,
          method: "PUT",
          body: payload,
        });
      } else {
        return apiRequest("/api/projects/resources", {
          role,
          method: "POST",
          body: payload,
        });
      }
    },
    onSuccess: async () => {
      setDrawerOpen(false);
      setEditingResource(null);
      setForm({
        projectId: projectsQuery.data?.projects?.[0]?.id || "",
        resourceName: "",
        type: "Crew",
        subType: "",
        assignedTo: "",
        utilization: "80",
        status: "Assigned",
        health: "90",
        dailyCost: "600",
      });
      await queryClient.invalidateQueries({ queryKey: ["erp-resources"] });
      toast.success(editingResource ? "Resource updated successfully!" : "Resource assigned successfully!");
    },
    onError: (err) => {
      toast.error(`Operation failed: ${err.message}`);
    },
  });

  // Mutation for DELETE
  const deleteMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      return apiRequest(`/api/projects/resources/${resourceId}`, {
        role,
        method: "DELETE",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-resources"] });
      toast.success("Resource deallocated successfully.");
    },
    onError: (err) => {
      toast.error(`Deallocation failed: ${err.message}`);
    },
  });

  // Open edit form
  const handleEdit = (resource: ResourceAllocation) => {
    setEditingResource(resource);
    setForm({
      projectId: resource.projectId,
      resourceName: resource.resourceName,
      type: resource.type,
      subType: resource.subType || "",
      assignedTo: resource.assignedTo,
      utilization: String(resource.utilization),
      status: resource.status || "Assigned",
      health: String(resource.health || 90),
      dailyCost: String(resource.dailyCost || 600),
    });
    setDrawerOpen(true);
  };

  // Delete resource
  const handleDelete = (resourceId: string) => {
    if (confirm("Are you sure you want to release and delete this resource allocation?")) {
      deleteMutation.mutate(resourceId);
    }
  };

  // Form submit handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.resourceName.trim()) errors.resourceName = "Resource name is required";
    if (!form.assignedTo.trim()) errors.assignedTo = "Deployment location is required";
    if (isNaN(Number(form.utilization)) || Number(form.utilization) < 0 || Number(form.utilization) > 120) {
      errors.utilization = "Utilization must be between 0 and 120%";
    }
    if (isNaN(Number(form.health)) || Number(form.health) < 0 || Number(form.health) > 100) {
      errors.health = "Health score must be between 0 and 100";
    }
    if (isNaN(Number(form.dailyCost)) || Number(form.dailyCost) <= 0) {
      errors.dailyCost = "Daily cost must be a positive number";
    }
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      saveMutation.mutate();
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setTypeFilter("All");
    setProjectFilter("All");
    setStatusFilter("All");
    setUtilizationFilter("All");
  };

  // Simulate exporting
  const handleExport = () => {
    toast.success("Resource Command Center Register exported as CSV successfully.");
  };

  // Render check
  if (resourcesQuery.isLoading || projectsQuery.isLoading) {
    return <LoadingStateCard title="Loading Resource Command Center" />;
  }
  if (resourcesQuery.error || projectsQuery.error || !resourcesQuery.data || !projectsQuery.data) {
    return <ErrorStateCard message="Resource allocations and analytics data are currently unavailable." />;
  }

  const allResources = resourcesQuery.data.resources;
  const projectList = projectsQuery.data.projects;

  // 1. CALCULATE HERO & KPI METRICS
  const totalAllocated = allResources.length;
  const activeCount = allResources.filter((r) => r.status === "Assigned" || r.status === "Overloaded").length;
  const idleCount = allResources.filter((r) => r.status === "Idle" || r.status === "Available").length;
  const overallocationCount = allResources.filter((r) => r.utilization > 95).length;
  const totalCostVal = allResources.reduce((sum, r) => sum + (r.monthlyCost || 0), 0);

  // Resource Efficiency Score
  const avgEfficiency = Math.round(allResources.reduce((sum, r) => sum + (r.health || 85), 0) / (totalAllocated || 1));
  const workforceUtil = Math.round(
    allResources.filter((r) => r.type === "Crew" || r.type === "Supervisor").reduce((sum, r) => sum + r.utilization, 0) /
      (allResources.filter((r) => r.type === "Crew" || r.type === "Supervisor").length || 1)
  );
  const equipUtil = Math.round(
    allResources.filter((r) => r.type === "Machinery" || r.type === "Equipment").reduce((sum, r) => sum + r.utilization, 0) /
      (allResources.filter((r) => r.type === "Machinery" || r.type === "Equipment").length || 1)
  );

  // 2. FILTER RESOURCES FOR REGISTER TABLE
  const filteredResources = allResources.filter((resource) => {
    const matchesSearch =
      resource.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "All" || resource.type === typeFilter;
    const matchesProject = projectFilter === "All" || resource.projectId === projectFilter;
    const matchesStatus = statusFilter === "All" || resource.status === statusFilter;

    let matchesUtil = true;
    if (utilizationFilter === "Low") matchesUtil = resource.utilization < 60;
    else if (utilizationFilter === "Medium") matchesUtil = resource.utilization >= 60 && resource.utilization <= 85;
    else if (utilizationFilter === "High") matchesUtil = resource.utilization > 85;

    return matchesSearch && matchesType && matchesProject && matchesStatus && matchesUtil;
  });

  // Pagination calculations
  const totalFiltered = filteredResources.length;
  const totalPages = Math.ceil(totalFiltered / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedResources = filteredResources.slice(startIndex, startIndex + rowsPerPage);

  // 3. CHART DATA PREPARATION
  // Chart 1: Donut Type Distribution
  const typeCounts: Record<string, number> = {};
  allResources.forEach((r) => {
    typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
  });
  const donutData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#0ea5e9"];

  // Chart 2: Stacked Bar per Project
  const projectMap: Record<string, { name: string; crew: number; machinery: number; contractor: number }> = {};
  allResources.forEach((r) => {
    const projName = r.projectName || "Other";
    if (!projectMap[projName]) {
      projectMap[projName] = { name: projName.substring(0, 15), crew: 0, machinery: 0, contractor: 0 };
    }
    const typeNormalized = r.type ? r.type.toLowerCase() : "";
    if (typeNormalized === "crew" || typeNormalized === "supervisor") {
      projectMap[projName].crew++;
    } else if (typeNormalized === "machinery" || typeNormalized === "equipment") {
      projectMap[projName].machinery++;
    } else if (typeNormalized === "contractor") {
      projectMap[projName].contractor++;
    } else {
      projectMap[projName].contractor++;
    }
  });
  const barData = Object.values(projectMap).slice(0, 5);

  // Chart 3: Utilization Trend (last 90 Days)
  const utilTrendData = [
    { name: "Day 10", crew: 82, machinery: 68, contractor: 72 },
    { name: "Day 20", crew: 84, machinery: 66, contractor: 74 },
    { name: "Day 30", crew: 85, machinery: 71, contractor: 70 },
    { name: "Day 40", crew: 88, machinery: 74, contractor: 75 },
    { name: "Day 50", crew: 83, machinery: 70, contractor: 78 },
    { name: "Day 60", crew: 86, machinery: 75, contractor: 81 },
    { name: "Day 70", crew: 87, machinery: 72, contractor: 82 },
    { name: "Day 80", crew: 89, machinery: 73, contractor: 84 },
    { name: "Day 90", crew: workforceUtil, machinery: equipUtil, contractor: 80 },
  ];

  // Chart 4: Monthly Cost Trend
  const costTrendData = [
    { month: "Jan", Labor: 18.2, Equipment: 10.4, Contractor: 12.1 },
    { month: "Feb", Labor: 19.5, Equipment: 11.2, Contractor: 12.8 },
    { month: "Mar", Labor: 21.0, Equipment: 11.8, Contractor: 13.5 },
    { month: "Apr", Labor: 20.8, Equipment: 12.2, Contractor: 14.2 },
    { month: "May", Labor: 22.4, Equipment: 12.5, Contractor: 14.8 },
    { month: "Jun", Labor: totalCostVal * 0.45 / 100000, Equipment: totalCostVal * 0.30 / 100000, Contractor: totalCostVal * 0.25 / 100000 },
  ];

  // 4. DEPLOYMENT MAP (visual project listings)
  const deploymentMapList = projectList.map((p, idx) => {
    const allocations = allResources.filter((r) => r.projectId === p.id);
    const totalAlloc = allocations.length;
    const avgUtil = Math.round(allocations.reduce((sum, r) => sum + r.utilization, 0) / (totalAlloc || 1));
    const isUnderResourced = totalAlloc < 3;
    let riskBadgeTone: "success" | "warning" | "error" = "success";
    let riskLabel = "Low Risk";
    if (isUnderResourced) {
      riskBadgeTone = "error";
      riskLabel = "Understaffed";
    } else if (avgUtil > 90) {
      riskBadgeTone = "warning";
      riskLabel = "High Burnout";
    }

    return {
      id: p.id,
      name: p.name,
      allocated: totalAlloc,
      utilization: avgUtil || 0,
      capacity: 10 + (idx % 3) * 5,
      riskLabel,
      riskTone: riskBadgeTone,
    };
  });

  // 5. RESOURCE LEADERBOARD (Top utilized resources)
  const topResources = [...allResources]
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 5);

  // Status and Health Color helpers
  const getHealthTone = (health?: number) => {
    if (!health) return "info";
    if (health >= 95) return "success";
    if (health >= 85) return "info";
    if (health >= 70) return "warning";
    return "error";
  };

  const getHealthText = (health?: number) => {
    if (!health) return "N/A";
    if (health >= 95) return "Excellent";
    if (health >= 85) return "Healthy";
    if (health >= 70) return "Watch";
    return "Critical";
  };

  const getStatusTone = (status?: string) => {
    switch (status) {
      case "Available":
        return "success";
      case "Assigned":
        return "info";
      case "Maintenance":
        return "warning";
      case "Idle":
        return "neutral";
      case "Overloaded":
        return "error";
      default:
        return "info";
    }
  };

  return (
    <section className="space-y-8 pb-12 animate-page-in">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 border-b border-border-soft pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-page-title font-secondary font-bold tracking-tight text-text-primary">
            Resource Command Center
          </h1>
          <p className="text-body text-text-secondary">
            Monitor workforce, equipment, contractors, and resource utilization across all active projects.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setEditingResource(null);
              setForm({
                projectId: projectList[0]?.id || "",
                resourceName: "",
                type: "Crew",
                subType: "",
                assignedTo: "",
                utilization: "80",
                status: "Assigned",
                health: "90",
                dailyCost: "600",
              });
              setFormErrors({});
              setDrawerOpen(true);
            }}
            className="text-white font-semibold gap-1.5"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Assign Resource</span>
          </Button>
          <a href="#analytics-center">
            <Button variant="secondary" className="gap-1.5 font-medium">
              <TrendingUp className="h-4.5 w-4.5" />
              <span>Resource Analytics</span>
            </Button>
          </a>
          <a href="#deployment-map">
            <Button variant="secondary" className="gap-1.5 font-medium">
              <Building2 className="h-4.5 w-4.5" />
              <span>Deployment Planner</span>
            </Button>
          </a>
          <Button variant="secondary" onClick={handleExport} className="gap-1.5 font-medium">
            <Download className="h-4.5 w-4.5" />
            <span>Export Resources</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1 - RESOURCE HEALTH HERO */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_2fr]">
        <Card className="overflow-hidden border border-success/20 bg-linear-to-b from-success-soft/10 to-transparent">
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Resource Efficiency Score
              </span>
              <Badge tone="success" className="font-semibold text-xs px-2.5 py-0.5">
                Healthy
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-text-primary tracking-tight">{avgEfficiency}</span>
              <span className="text-lg text-text-secondary font-medium">/ 100</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-success flex items-center gap-1">
                <span>↑ +6% vs Last Month</span>
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Aggregated workforce compliance, machinery uptime, and contractor performance index.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border-soft">
          <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 h-full items-center">
            <div className="space-y-1.5 border-r border-border-soft pr-4">
              <span className="text-xs font-semibold text-text-muted uppercase">Total Resources</span>
              <p className="text-3xl font-black text-text-primary">{totalAllocated}</p>
              <p className="text-[11px] text-text-muted">Registered allocations</p>
            </div>
            <div className="space-y-1.5 border-r border-border-soft px-4">
              <span className="text-xs font-semibold text-text-muted uppercase">Active Deployments</span>
              <p className="text-3xl font-black text-accent-primary">{activeCount}</p>
              <p className="text-[11px] text-success font-semibold">Uptime Optimal</p>
            </div>
            <div className="space-y-1.5 border-r border-border-soft px-4">
              <span className="text-xs font-semibold text-text-muted uppercase">Available Pool</span>
              <p className="text-3xl font-black text-success">{idleCount}</p>
              <p className="text-[11px] text-text-muted">Idle / Available</p>
            </div>
            <div className="space-y-1.5 pl-4">
              <span className="text-xs font-semibold text-text-muted uppercase">Allocation Alerts</span>
              <p className="text-3xl font-black text-error">{overallocationCount}</p>
              <p className="text-[11px] text-error font-semibold">{overallocationCount} overloaded cases</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2 - EXECUTIVE KPI GRID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PremiumKpiCard
          label="Total Resources"
          value={totalAllocated}
          trend="+2 vs last week"
          trendType="up"
          status="Active Pool"
          statusTone="info"
          sparkline={[42, 44, 45, 45, 46, 46, totalAllocated]}
          insight="2 new heavy machinery equipment sets activated this week."
          icon={<Users className="h-5 w-5" />}
        />
        <PremiumKpiCard
          label="Active Deployments"
          value={activeCount}
          trend="+4% vs last week"
          trendType="up"
          status="High Uptime"
          statusTone="success"
          sparkline={[28, 29, 31, 30, 31, 32, activeCount]}
          insight="Civil structural teams mobilized at Skyline Tower C."
          icon={<Zap className="h-5 w-5" />}
        />
        <PremiumKpiCard
          label="Available Resources"
          value={idleCount}
          trend="-12% vs last month"
          trendType="down"
          status="Optimal Buffer"
          statusTone="neutral"
          sparkline={[14, 13, 11, 12, 10, 10, idleCount]}
          insight="Standby technicians available for immediate site routing."
          icon={<HardHat className="h-5 w-5" />}
        />
        <PremiumKpiCard
          label="Workforce Utilization"
          value={`${workforceUtil}%`}
          trend="+3.2% vs target"
          trendType="up"
          status="Excellent"
          statusTone="success"
          sparkline={[80, 81, 83, 82, 84, 84, workforceUtil]}
          insight="Core excavation crews running at peak production."
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <PremiumKpiCard
          label="Equipment Utilization"
          value={`${equipUtil}%`}
          trend="-4% drop (seasonal)"
          trendType="down"
          status="Watch"
          statusTone="warning"
          sparkline={[78, 76, 75, 74, 75, 73, equipUtil]}
          insight="4 heavy excavation tractors idle at Riverfront site."
          icon={<Hammer className="h-5 w-5" />}
        />
        <PremiumKpiCard
          label="Avg Resource Efficiency"
          value={`${avgEfficiency}%`}
          trend="+6% vs last quarter"
          trendType="up"
          status="Healthy"
          statusTone="success"
          sparkline={[81, 83, 84, 85, 87, 87, avgEfficiency]}
          insight="Tower A construction scheduling efficiency reached 96%."
          icon={<Sparkles className="h-5 w-5" />}
        />
        <PremiumKpiCard
          label="Over Allocation Alerts"
          value={overallocationCount}
          trend="-25% reduction"
          trendType="up"
          status="Critical"
          statusTone="error"
          sparkline={[9, 8, 8, 7, 7, 6, overallocationCount]}
          insight="6 supervisors deployed beyond standard double-shifts."
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <PremiumKpiCard
          label="Monthly Resource Cost"
          value={formatCurrency(totalCostVal)}
          trend="+11.8% expansion"
          trendType="warning"
          status="On Budget"
          statusTone="info"
          sparkline={[3.6, 3.8, 3.9, 4.0, 4.1, 4.2, totalCostVal / 1000000]}
          insight="Equipment rental expansions added ₹3.8L to structural costs."
          icon={<IndianRupee className="h-5 w-5" />}
        />
      </div>

      {/* SECTION 3 - RESOURCE INTELLIGENCE CENTER */}
      <Card className="border-border-soft overflow-hidden shadow-soft">
        <CardHeader className="bg-linear-to-r from-accent-primary/5 to-accent-secondary/5 border-b border-border-soft pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-primary animate-pulse" />
            <CardTitle className="text-base font-bold text-text-primary">
              Resource Intelligence Recommendations
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="p-4 rounded-xl border border-error-soft bg-error-soft/5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-error uppercase flex items-center gap-1">
                <ShieldAlert className="h-4 w-4" />
                Resource Risk
              </span>
              <Badge tone="error">Critical</Badge>
            </div>
            <p className="text-body font-semibold text-text-primary leading-snug">
              3 projects are operating below required workforce levels.
            </p>
            <div className="flex justify-end pt-1">
              <a href="#deployment-map">
                <Button variant="outline" size="sm" className="text-error border-error-soft hover:bg-error-soft/10 text-xs">
                  Review Deployment
                </Button>
              </a>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl border border-warning-soft bg-warning-soft/5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-warning uppercase flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Equipment Alert
              </span>
              <Badge tone="warning">Warning</Badge>
            </div>
            <p className="text-body font-semibold text-text-primary leading-snug">
              4 machinery sets have been idle for more than 10 days.
            </p>
            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTypeFilter("Machinery");
                  setStatusFilter("Idle");
                  toast.info("Table filters focused on Idle Machinery.");
                }}
                className="text-warning border-warning-soft hover:bg-warning-soft/10 text-xs"
              >
                Review Equipment
              </Button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl border border-info-soft bg-info-soft/5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-info uppercase flex items-center gap-1">
                <Info className="h-4 w-4" />
                Cost Optimization
              </span>
              <Badge tone="info">Information</Badge>
            </div>
            <p className="text-body font-semibold text-text-primary leading-snug">
              Equipment utilization dropped by 11% this month.
            </p>
            <div className="flex justify-end pt-1">
              <a href="#analytics-center">
                <Button variant="outline" size="sm" className="text-info border-info-soft hover:bg-info-soft/10 text-xs">
                  Review Efficiency
                </Button>
              </a>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-4 rounded-xl border border-error-soft bg-error-soft/5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-error uppercase flex items-center gap-1">
                <ShieldAlert className="h-4 w-4" />
                Over Allocation
              </span>
              <Badge tone="error">Critical</Badge>
            </div>
            <p className="text-body font-semibold text-text-primary leading-snug">
              6 resources are assigned beyond their daily shift capacity.
            </p>
            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("Overloaded");
                  toast.info("Table filters focused on Overloaded resources.");
                }}
                className="text-error border-error-soft hover:bg-error-soft/10 text-xs"
              >
                Balance Workload
              </Button>
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-4 rounded-xl border border-success-soft bg-success-soft/5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-success uppercase flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                High Performance
              </span>
              <Badge tone="success">Success</Badge>
            </div>
            <p className="text-body font-semibold text-text-primary leading-snug">
              Tower A achieved 96% workforce utilization.
            </p>
            <div className="flex justify-end pt-1">
              <Link href={`/projects/${projectList[0]?.id || "project-aurora"}`}>
                <Button variant="outline" size="sm" className="text-success border-success-soft hover:bg-success-soft/10 text-xs">
                  View Project
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4 - RESOURCE ANALYTICS */}
      <div id="analytics-center" className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Chart 1: Donut Type Distribution */}
        <Card className="shadow-soft border-border-soft bg-surface">
          <CardHeader className="border-b border-border-soft pb-4">
            <CardTitle className="text-base font-bold text-text-primary">Resource Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col items-center justify-center h-80 relative">
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Allocations`, "Count"]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-3xl font-black text-text-primary leading-none">{totalAllocated}</span>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">Resources</span>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Stacked Bar per Project */}
        <Card className="shadow-soft border-border-soft bg-surface">
          <CardHeader className="border-b border-border-soft pb-4">
            <CardTitle className="text-base font-bold text-text-primary">Resource Deployment by Project</CardTitle>
          </CardHeader>
          <CardContent className="p-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} style={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="crew" name="Workforce" stackId="a" fill="#2563eb" />
                <Bar dataKey="machinery" name="Machinery" stackId="a" fill="#06b6d4" />
                <Bar dataKey="contractor" name="Contractors" stackId="a" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 3: Utilization Trend */}
        <Card className="shadow-soft border-border-soft bg-surface">
          <CardHeader className="border-b border-border-soft pb-4">
            <CardTitle className="text-base font-bold text-text-primary">Resource Utilization Trend (90 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCrew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" style={{ fontSize: 11 }} />
                <YAxis unit="%" domain={[40, 100]} style={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}%`, "Utilization"]} />
                <Legend />
                <Area type="monotone" dataKey="crew" name="Workforce Utilization" stroke="#2563eb" fillOpacity={1} fill="url(#colorCrew)" strokeWidth={2} />
                <Area type="monotone" dataKey="machinery" name="Equipment Utilization" stroke="#06b6d4" fillOpacity={1} fill="url(#colorMach)" strokeWidth={2} />
                <Area type="monotone" dataKey="contractor" name="Contractor Utilization" stroke="#22c55e" fill={undefined} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 4: Monthly Cost Trend */}
        <Card className="shadow-soft border-border-soft bg-surface">
          <CardHeader className="border-b border-border-soft pb-4">
            <CardTitle className="text-base font-bold text-text-primary">Monthly Resource Cost Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLabor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" style={{ fontSize: 11 }} />
                <YAxis unit="L" style={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`₹${Number(value).toFixed(1)} Lakhs`, "Expenditure"]} />
                <Legend />
                <Area type="monotone" dataKey="Labor" name="Labor Cost" stroke="#2563eb" fillOpacity={1} fill="url(#colorLabor)" strokeWidth={2} />
                <Area type="monotone" dataKey="Equipment" name="Equipment Cost" stroke="#06b6d4" fill={undefined} strokeWidth={2} />
                <Area type="monotone" dataKey="Contractor" name="Contractor Cost" stroke="#22c55e" fill={undefined} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 5 - DEPLOYMENT MAP */}
      <div id="deployment-map" className="scroll-mt-6">
        <Card className="shadow-soft border-border-soft bg-surface">
          <CardHeader className="border-b border-border-soft pb-4">
            <CardTitle className="text-base font-bold text-text-primary">Project Deployment Visibility Map</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deploymentMapList.map((proj) => (
                <div key={proj.id} className="surface-secondary p-4.5 space-y-4 rounded-xl border border-border-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-card-title text-text-primary font-bold">{proj.name}</h4>
                      <p className="text-[11px] text-text-muted uppercase mt-0.5">Project ID: {proj.id}</p>
                    </div>
                    <Badge tone={proj.riskTone}>{proj.riskLabel}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-b border-border-soft text-text-secondary">
                    <div>
                      <span className="font-semibold text-text-muted">Allocated:</span> {proj.allocated} units
                    </div>
                    <div>
                      <span className="font-semibold text-text-muted">Available Capacity:</span> {Math.max(0, proj.capacity - proj.allocated)} units
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-text-muted">Resource Utilization</span>
                      <span className="text-accent-primary">{proj.utilization}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-hover overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${proj.utilization > 90 ? "bg-error" : proj.utilization < 50 ? "bg-warning" : "bg-success"}`}
                        style={{ width: `${proj.utilization}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 6 - RESOURCE LEADERBOARD */}
      <Card className="shadow-soft border-border-soft bg-surface">
        <CardHeader className="border-b border-border-soft pb-4">
          <CardTitle className="text-base font-bold text-text-primary">Top Utilized Resources Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-table text-left">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-11 border-b border-border-soft">
                  <th className="px-5">Rank</th>
                  <th className="px-4">Resource</th>
                  <th className="px-4">Type</th>
                  <th className="px-4">Project</th>
                  <th className="px-4 text-center">Utilization</th>
                  <th className="px-4 text-center">Efficiency Score</th>
                  <th className="px-4 text-right">Daily Cost</th>
                  <th className="px-5 text-right">Operational Health</th>
                </tr>
              </thead>
              <tbody>
                {topResources.map((res, index) => (
                  <tr key={res.id} className="h-14 border-b border-border-soft hover:bg-hover/20">
                    <td className="px-5 font-black text-text-muted text-xs"># {index + 1}</td>
                    <td className="px-4 font-bold text-text-primary">
                      <Link href={`/projects/resources/${res.id}`} className="hover:underline flex items-center gap-2">
                        {res.type === "Machinery" ? <Hammer className="h-4 w-4 text-accent-secondary" /> : <Users className="h-4 w-4 text-accent-primary" />}
                        {res.resourceName}
                      </Link>
                    </td>
                    <td className="px-4 text-xs font-semibold text-text-secondary">{res.type}</td>
                    <td className="px-4 text-text-secondary">{res.projectName}</td>
                    <td className="px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-text-primary">{res.utilization}%</span>
                        <div className="w-12 h-1.5 bg-hover rounded-full overflow-hidden">
                          <div className="h-full bg-error" style={{ width: `${res.utilization}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 text-center font-bold text-success">{res.health}%</td>
                    <td className="px-4 text-right font-medium text-text-primary">{formatCurrency(res.dailyCost || 500)}</td>
                    <td className="px-5 text-right">
                      <Badge tone={getHealthTone(res.health)}>{getHealthText(res.health)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 7 - RESOURCE REGISTER */}
      <Card className="shadow-soft border-border-soft bg-surface">
        <CardHeader className="border-b border-border-soft pb-4">
          <CardTitle className="text-base font-bold text-text-primary">Resource Registry Console</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filters Toolbar */}
          <div className="p-5 border-b border-border-soft flex flex-wrap gap-3 items-center justify-between bg-surface-secondary/40">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="Search resources, sites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 w-full"
                />
              </div>
              
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 px-3 text-xs font-semibold border border-border-soft rounded-lg bg-surface text-text-secondary focus-visible:outline-none"
              >
                <option value="All">All Types</option>
                <option value="Crew">Crew</option>
                <option value="Machinery">Machinery</option>
                <option value="Contractor">Contractor</option>
                <option value="Supervisor">Supervisor</option>
              </select>

              {/* Project Filter */}
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="h-10 px-3 text-xs font-semibold border border-border-soft rounded-lg bg-surface text-text-secondary focus-visible:outline-none"
              >
                <option value="All">All Projects</option>
                {projectList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-xs font-semibold border border-border-soft rounded-lg bg-surface text-text-secondary focus-visible:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Idle">Idle</option>
                <option value="Overloaded">Overloaded</option>
              </select>

              {/* Utilization Range Filter */}
              <select
                value={utilizationFilter}
                onChange={(e) => setUtilizationFilter(e.target.value)}
                className="h-10 px-3 text-xs font-semibold border border-border-soft rounded-lg bg-surface text-text-secondary focus-visible:outline-none"
              >
                <option value="All">All Utilization</option>
                <option value="Low">Low (&lt;60%)</option>
                <option value="Medium">Medium (60%-85%)</option>
                <option value="High">High (&gt;85%)</option>
              </select>
            </div>

            <Button variant="ghost" onClick={handleResetFilters} className="text-accent-primary gap-1 font-semibold text-xs h-10 px-3 border border-border-soft">
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </Button>
          </div>

          {/* Table contents */}
          <div className="overflow-auto">
            <table className="w-full text-table text-left min-w-[960px]">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-11 border-b border-border-soft">
                  <th className="px-5">Resource</th>
                  <th className="px-4">Type</th>
                  <th className="px-4">Sub Type</th>
                  <th className="px-4">Project Site</th>
                  <th className="px-4">Deployed To</th>
                  <th className="px-4 text-center">Utilization</th>
                  <th className="px-4 text-right">Daily Cost</th>
                  <th className="px-4 text-right">Monthly Cost</th>
                  <th className="px-4 text-center">Status</th>
                  <th className="px-4 text-center">Health</th>
                  <th className="px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResources.length === 0 ? (
                  <tr className="h-32 text-center text-text-muted">
                    <td colSpan={11}>No resources matching selected query criteria.</td>
                  </tr>
                ) : (
                  paginatedResources.map((res) => (
                    <tr key={res.id} className="h-15 border-b border-border-soft hover:bg-hover/10">
                      <td className="px-5">
                        <div className="font-bold text-text-primary">
                          <Link href={`/projects/resources/${res.id}`} className="hover:underline flex items-center gap-1.5">
                            {res.type === "Machinery" ? <Hammer className="h-4 w-4 text-accent-secondary" /> : <Users className="h-4 w-4 text-accent-primary" />}
                            <span>{res.resourceName}</span>
                          </Link>
                        </div>
                        <div className="text-[10px] text-text-muted font-medium mt-0.5">ID: {res.id}</div>
                      </td>
                      <td className="px-4 text-xs font-bold text-text-secondary">{res.type}</td>
                      <td className="px-4 text-text-secondary">{res.subType || "General"}</td>
                      <td className="px-4 text-text-secondary">{res.projectName}</td>
                      <td className="px-4 text-text-secondary">{res.assignedTo}</td>
                      <td className="px-4">
                        <div className="space-y-1 w-28 mx-auto">
                          <p className="text-xs font-bold text-text-primary text-center">{res.utilization}%</p>
                          <div className="h-1.5 rounded-full bg-hover overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${res.utilization > 95 ? "bg-error" : res.utilization < 50 ? "bg-warning" : "bg-success"}`}
                              style={{ width: `${res.utilization}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 text-right font-medium text-text-primary">{formatCurrency(res.dailyCost || 600)}</td>
                      <td className="px-4 text-right font-medium text-text-primary">{formatCurrency(res.monthlyCost || 18000)}</td>
                      <td className="px-4 text-center">
                        <Badge tone={getStatusTone(res.status)}>{res.status || "Assigned"}</Badge>
                      </td>
                      <td className="px-4 text-center">
                        <Badge tone={getHealthTone(res.health)}>{res.health || 85}%</Badge>
                      </td>
                      <td className="px-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Link href={`/projects/resources/${res.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-text-muted hover:text-accent-primary">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(res)} className="h-8 w-8 p-0 text-text-muted hover:text-accent-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(res.id)} className="h-8 w-8 p-0 text-text-muted hover:text-error">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border-soft flex items-center justify-between bg-surface-secondary/25">
              <span className="text-xs text-text-muted font-medium">
                Showing {startIndex + 1} - {Math.min(startIndex + rowsPerPage, totalFiltered)} of {totalFiltered} Resources
              </span>
              
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: totalPages }).map((_, idx) => (
                  <Button
                    key={idx}
                    variant={currentPage === idx + 1 ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(idx + 1)}
                    className="h-8 w-8 p-0 text-xs font-semibold"
                  >
                    {idx + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 9 - RESOURCE RISK CENTER */}
      <Card className="shadow-soft border-border-soft bg-surface">
        <CardHeader className="border-b border-border-soft pb-4">
          <CardTitle className="text-base font-bold text-text-primary">Operations Resource Risk Assessment Center</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl border border-border-soft bg-surface-secondary/40 text-center space-y-1">
              <span className="text-[26px] font-black text-warning">18%</span>
              <p className="text-xs font-bold text-text-secondary uppercase">Capacity Risk</p>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">Labor supply constraints at Riverfront</p>
            </div>
            <div className="p-4 rounded-xl border border-border-soft bg-surface-secondary/40 text-center space-y-1">
              <span className="text-[26px] font-black text-success">12%</span>
              <p className="text-xs font-bold text-text-secondary uppercase">Utilization Risk</p>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">Optimal resource deployment distribution</p>
            </div>
            <div className="p-4 rounded-xl border border-border-soft bg-surface-secondary/40 text-center space-y-1">
              <span className="text-[26px] font-black text-warning">24%</span>
              <p className="text-xs font-bold text-text-secondary uppercase">Cost Leakage Risk</p>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">Machinery idle hours penalty at Skyline</p>
            </div>
            <div className="p-4 rounded-xl border border-border-soft bg-surface-secondary/40 text-center space-y-1">
              <span className="text-[26px] font-black text-error">32%</span>
              <p className="text-xs font-bold text-text-secondary uppercase">Deployment Risk</p>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">Under-staffing structure on tower structural milestones</p>
            </div>
            <div className="p-4 rounded-xl border border-accent-primary/20 bg-accent-primary/5 text-center space-y-1">
              <span className="text-[26px] font-black text-accent-primary">15%</span>
              <p className="text-xs font-bold text-text-primary uppercase">Overall Operations Risk</p>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">Healthy risk threshold rating index</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 10 - EXECUTIVE SUMMARY */}
      <Card className="shadow-soft border-border-soft bg-surface-secondary/50 border border-dashed border-accent-primary/25">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-accent-primary" />
            <span>Resource Operations Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <ul className="list-disc pl-4 text-xs text-text-secondary space-y-1.5">
            <li>Resource utilization improved by 8% across structural workfronts</li>
            <li>4 resources require immediate attention (Over allocation or idle warnings)</li>
            <li>Equipment scheduling efficiency increased by 6% with structural staging</li>
            <li>3 projects need additional workforce mobilization in internal plastering phase</li>
            <li>Tower A leads structural deployment efficiency at 96% utilization index</li>
          </ul>
          <div className="text-[10px] text-text-muted italic border-t border-border-soft pt-2.5 flex items-center justify-between">
            <span>Last updated 5 minutes ago</span>
            <span>Resource Intelligence Engine v2.1</span>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 8 - ASSIGN RESOURCE EXPERIENCE DRAWER */}
      <Drawer
        open={drawerOpen}
        title={editingResource ? "Edit Resource Allocation" : "Assign Resource to Project Workfront"}
        size="lg"
        onClose={() => {
          setDrawerOpen(false);
          setEditingResource(null);
        }}
      >
        <form onSubmit={handleFormSubmit} className="space-y-6 pb-12">
          {Object.keys(formErrors).length > 0 && (
            <div className="p-4 rounded-xl border border-error-soft bg-error-soft/10 text-error text-xs space-y-1">
              <p className="font-bold">Please correct form errors:</p>
              <ul className="list-disc pl-4">
                {Object.values(formErrors).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 1: Project & Identity */}
          <div className="p-5 rounded-xl border border-border-soft bg-surface-secondary/20 space-y-4">
            <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2">
              Resource Allocation Targets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Project Site *</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
                  className={selectClassName}
                >
                  {projectList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Resource Category Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  className={selectClassName}
                >
                  <option value="Crew">Crew / Workforce</option>
                  <option value="Machinery">Machinery / Equipment</option>
                  <option value="Contractor">Contracting Partner</option>
                  <option value="Supervisor">Supervisor / Inspection</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Resource / Name *</label>
                <Input
                  placeholder="e.g. Tower Crane 3, MEP Subcontractor Alpha"
                  value={form.resourceName}
                  onChange={(e) => setForm((prev) => ({ ...prev, resourceName: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Sub Type / Classification</label>
                <Input
                  placeholder="e.g. Steel Fixers, HVAC, Backhoe"
                  value={form.subType}
                  onChange={(e) => setForm((prev) => ({ ...prev, subType: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Deployment Specifications */}
          <div className="p-5 rounded-xl border border-border-soft bg-surface-secondary/20 space-y-4">
            <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2">
              Deployment Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Assigned To (Structure/Zone) *</label>
                <Input
                  placeholder="e.g. Tower A Slab, External Site Utilities"
                  value={form.assignedTo}
                  onChange={(e) => setForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  className={selectClassName}
                >
                  <option value="Assigned">Assigned / Mobilized</option>
                  <option value="Available">Available / Idle Standby</option>
                  <option value="Maintenance">Maintenance Service</option>
                  <option value="Idle">Idle (No active booking)</option>
                  <option value="Overloaded">Overloaded (Overcapacity)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Utilization Percentage (0-120%) *</label>
                <Input
                  type="number"
                  placeholder="e.g. 85"
                  value={form.utilization}
                  onChange={(e) => setForm((prev) => ({ ...prev, utilization: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Daily Rent/Cost (₹) *</label>
                <Input
                  type="number"
                  placeholder="e.g. 1200"
                  value={form.dailyCost}
                  onChange={(e) => setForm((prev) => ({ ...prev, dailyCost: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Operational Health Uptime (0-100) *</label>
                <Input
                  type="number"
                  placeholder="e.g. 95"
                  value={form.health}
                  onChange={(e) => setForm((prev) => ({ ...prev, health: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Drawer Controls */}
          <div className="flex justify-end gap-3 border-t border-border-soft pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDrawerOpen(false);
                setEditingResource(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending} className="text-white font-semibold gap-1.5">
              <ClipboardPlus className="h-4.5 w-4.5" />
              <span>{editingResource ? "Update Allocation" : "Assign Resource"}</span>
            </Button>
          </div>
        </form>
      </Drawer>
    </section>
  );
}
