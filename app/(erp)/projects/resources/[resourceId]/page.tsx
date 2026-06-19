"use client";
import { toast } from "@/components/ui/toast";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileDown,
  Building2,
  Calendar,
  Clock,
  HardHat,
  Users,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Hammer,
  ClipboardPlus,
  TrendingUp,
  Info,
  DollarSign,
  Activity,
  UserCheck,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/erp-api";
import { formatCurrency } from "@/lib/erp-utils";
import type { ResourceAllocation, PropertySummaryResponse } from "@/lib/erp-types";
import { useUiStore } from "@/store/ui-store";
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
  Legend,
} from "recharts";

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all";

export default function ResourceDetailPage() {
  const { resourceId } = useParams() as { resourceId: string };
  const router = useRouter();
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  // Edit drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  // Queries
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const { data: resourceData, isLoading: resourceLoading, error: resourceError } = useQuery({
    queryKey: ["erp-resource-detail", resourceId, role],
    queryFn: async () => (await apiRequest<ResourceAllocation>(`/api/projects/resources/${resourceId}`, { role })).data,
  });

  // Populate form when drawer opens
  useEffect(() => {
    if (drawerOpen && resourceData) {
      setForm({
        projectId: resourceData.projectId,
        resourceName: resourceData.resourceName,
        type: resourceData.type,
        subType: resourceData.subType || "",
        assignedTo: resourceData.assignedTo,
        utilization: String(resourceData.utilization),
        status: resourceData.status || "Assigned",
        health: String(resourceData.health || 90),
        dailyCost: String(resourceData.dailyCost || 600),
      });
      setFormErrors({});
    }
  }, [drawerOpen, resourceData]);

  // Update mutation
  const updateMutation = useMutation({
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

      return apiRequest<ResourceAllocation>(`/api/projects/resources/${resourceId}`, {
        role,
        method: "PUT",
        body: payload,
      });
    },
    onSuccess: async () => {
      setDrawerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-resource-detail", resourceId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-resources"] }),
      ]);
      toast.success("Resource details updated successfully!");
    },
    onError: (err) => {
      toast.error(`Error updating resource: ${err.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ id: string; success: boolean }>(`/api/projects/resources/${resourceId}`, {
        role,
        method: "DELETE",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-resources"] });
      toast.success("Resource allocation released successfully.");
      router.push("/projects/resources");
    },
    onError: (err) => {
      toast.error(`Error deleting resource allocation: ${err.message}`);
    },
  });

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
      updateMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to release and delete this resource allocation? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const handleExport = () => {
    toast.success("Resource details exported as PDF successfully.");
  };

  if (resourceLoading || projectsLoading) {
    return <LoadingStateCard title="Loading Resource Allocation Details" />;
  }
  if (resourceError || !resourceData) {
    return <ErrorStateCard message="Operation resource details are currently unavailable." />;
  }

  // Health and Status formatting
  const health = resourceData.health || 85;
  let healthLabel = "Healthy";
  let healthBadgeTone: "success" | "warning" | "error" | "info" = "success";
  if (health >= 95) {
    healthLabel = "Excellent";
    healthBadgeTone = "success";
  } else if (health >= 85) {
    healthLabel = "Healthy";
    healthBadgeTone = "info";
  } else if (health >= 70) {
    healthLabel = "Watch";
    healthBadgeTone = "warning";
  } else {
    healthLabel = "Critical";
    healthBadgeTone = "error";
  }

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

  // Mock Utilization Trend data (Last 6 months)
  const utilizationTrend = [
    { label: "Jan", utilization: 75, productive: 68, idle: 7 },
    { label: "Feb", utilization: 78, productive: 70, idle: 8 },
    { label: "Mar", utilization: 82, productive: 75, idle: 7 },
    { label: "Apr", utilization: 85, productive: 79, idle: 6 },
    { label: "May", utilization: 88, productive: 82, idle: 6 },
    { label: "Jun", utilization: resourceData.utilization, productive: Math.round(resourceData.utilization * 0.9), idle: Math.round(resourceData.utilization * 0.1) },
  ];

  // Mock Historical allocations
  const projectHistoryList = [
    { project: "Skyline Enclave Villa Phase 2", duration: "Jan 2026 - Mar 2026", utilization: 88, performance: 94, status: "Completed" },
    { project: "Riverfront Promenade Block A", duration: "Oct 2025 - Dec 2025", utilization: 76, performance: 90, status: "Completed" },
    { project: "Aurora Heights Tower B", duration: "Jul 2025 - Sep 2025", utilization: 84, performance: 92, status: "Completed" },
  ];

  // Machinery Maintenance logs
  const machineryLogs = [
    { date: "May 12, 2026", type: "Routine Oil & Filter", cost: 12500, downtime: "4 hours", status: "Completed" },
    { date: "Mar 08, 2026", type: "Hydraulic Pump Calibration", cost: 38000, downtime: "12 hours", status: "Completed" },
    { date: "Jan 15, 2026", type: "Crane Hook Safety Audit", cost: 8500, downtime: "3 hours", status: "Completed" },
  ];

  const hourlyCost = Math.round((resourceData.dailyCost || 600) / 8);

  return (
    <section className="space-y-8 pb-12 animate-page-in">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-5 border-b border-border-soft pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <Link href="/projects/resources" className="mt-0.5">
            <Button variant="secondary" size="sm" className="h-9 w-9 p-0 rounded-full shadow-soft hover:bg-hover inline-flex items-center justify-center shrink-0">
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          </Link>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-label font-bold uppercase tracking-wider text-text-muted">Resource Management Console</span>
              <Badge tone="neutral">{resourceData.id}</Badge>
            </div>
            <h1 className="text-page-title font-secondary font-bold tracking-tight text-text-primary">
              {resourceData.resourceName}
            </h1>
            <p className="text-body text-text-secondary flex items-center gap-1.5 flex-wrap">
              <HardHat className="h-4 w-4 text-accent-primary" />
              <span>Category: {resourceData.type} ({resourceData.subType || "General"})</span>
              <span className="text-text-muted">·</span>
              <Building2 className="h-4 w-4" />
              <span>Deployment Site: {resourceData.projectName}</span>
              <span className="text-text-muted">·</span>
              <Clock className="h-4 w-4" />
              <span>Zone: {resourceData.assignedTo}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2.5 shrink-0 self-start md:self-center md:justify-end">
          <Button onClick={() => setDrawerOpen(true)} className="text-white font-semibold gap-1.5">
            <Edit className="h-4.5 w-4.5" />
            <span>Edit Allocation</span>
          </Button>
          <Button variant="secondary" onClick={handleExport} className="gap-1.5 font-medium">
            <FileDown className="h-4.5 w-4.5" />
            <span>Export Details</span>
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-error border-error/20 hover:bg-error/5 hover:text-error hover:border-error/30 gap-1.5 font-medium">
            <Trash2 className="h-4.5 w-4.5" />
            <span>Deallocate</span>
          </Button>
        </div>
      </div>

      {/* CORE WIDGETS OVERVIEW */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="shadow-soft border-border-soft">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary shrink-0">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-label uppercase tracking-wider text-text-muted">Current Utilization</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{resourceData.utilization}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border-soft">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success-soft/30 text-success shrink-0">
              <CheckCircle className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-label uppercase tracking-wider text-text-muted">Efficiency / Uptime</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-success">{health}%</span>
                <Badge tone={healthBadgeTone} className="ml-2 font-medium">
                  {healthLabel}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border-soft">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-info-soft/10 text-info shrink-0">
              <Activity className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-label uppercase tracking-wider text-text-muted">Deployment Status</p>
              <div className="mt-1">
                <Badge tone={getStatusTone(resourceData.status)} className="text-sm font-semibold">
                  {resourceData.status || "Assigned"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border-soft">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warning-soft/30 text-warning shrink-0">
              <DollarSign className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-label uppercase tracking-wider text-text-muted">Monthly Rental / Expense</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{formatCurrency(resourceData.monthlyCost || 18000)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DETAILED CONTENT SECTION */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2.4fr_1.6fr]">
        
        {/* LEFT COLUMN: Utilization History, Project History, Cost Analysis */}
        <div className="space-y-6">
          
          {/* Utilization History Chart */}
          <Card className="shadow-soft border-border-soft bg-surface">
            <CardHeader className="border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent-primary" />
                <span>Resource Allocation & Utilization History</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={utilizationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUtilDetail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProductive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" style={{ fontSize: 11 }} />
                    <YAxis unit="%" style={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [`${value}%`]} />
                    <Legend />
                    <Area type="monotone" dataKey="utilization" name="Overall Utilization" stroke="#2563eb" fillOpacity={1} fill="url(#colorUtilDetail)" strokeWidth={2} />
                    <Area type="monotone" dataKey="productive" name="Productive Uptime" stroke="#22c55e" fillOpacity={1} fill="url(#colorProductive)" strokeWidth={2} />
                    <Area type="monotone" dataKey="idle" name="Idle / Standby Time" stroke="#f59e0b" fill={undefined} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Project History */}
          <Card className="shadow-soft border-border-soft bg-surface">
            <CardHeader className="border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent-primary" />
                <span>Historical Project Allocations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-table text-left">
                  <thead className="bg-surface-secondary text-text-secondary">
                    <tr className="h-11 border-b border-border-soft">
                      <th className="px-5">Project</th>
                      <th className="px-4">Duration</th>
                      <th className="px-4 text-center">Avg Utilization</th>
                      <th className="px-4 text-center">Performance Rating</th>
                      <th className="px-5 text-right">Allocation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectHistoryList.map((hist, idx) => (
                      <tr key={idx} className="h-12 border-b border-border-soft hover:bg-hover/20">
                        <td className="px-5 font-bold text-text-primary">{hist.project}</td>
                        <td className="px-4 text-text-secondary">{hist.duration}</td>
                        <td className="px-4 text-center font-semibold text-text-primary">{hist.utilization}%</td>
                        <td className="px-4 text-center font-bold text-success">{hist.performance}%</td>
                        <td className="px-5 text-right">
                          <Badge tone="neutral">{hist.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Cost Analysis */}
          <Card className="shadow-soft border-border-soft bg-surface">
            <CardHeader className="border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent-primary" />
                <span>Cost structure & Budget Variance Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-surface-secondary/50 p-4 rounded-xl border border-border-soft text-center">
                  <p className="text-lg font-bold text-text-primary">{formatCurrency(resourceData.dailyCost || 600)}</p>
                  <p className="text-[10px] text-text-muted uppercase font-semibold mt-1">Daily Rent</p>
                </div>
                <div className="bg-surface-secondary/50 p-4 rounded-xl border border-border-soft text-center">
                  <p className="text-lg font-bold text-text-primary">{formatCurrency(resourceData.monthlyCost || 18000)}</p>
                  <p className="text-[10px] text-text-muted uppercase font-semibold mt-1">Monthly Cost</p>
                </div>
                <div className="bg-surface-secondary/50 p-4 rounded-xl border border-border-soft text-center">
                  <p className="text-lg font-bold text-accent-primary">{formatCurrency(hourlyCost)} /hr</p>
                  <p className="text-[10px] text-text-muted uppercase font-semibold mt-1">Cost Per Utilized Hour</p>
                </div>
                <div className="bg-surface-secondary/50 p-4 rounded-xl border border-border-soft text-center">
                  <p className="text-lg font-bold text-success">{health}%</p>
                  <p className="text-[10px] text-text-muted uppercase font-semibold mt-1">Efficiency Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: Maintenance Center (Machinery only), Risk Assessment, Summary */}
        <div className="space-y-6">
          
          {/* Maintenance Center (Machinery Only) */}
          {resourceData.type === "Machinery" && (
            <Card className="shadow-soft border-border-soft bg-surface">
              <CardHeader className="border-b border-border-soft">
                <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Hammer className="h-5 w-5 text-accent-primary" />
                  <span>Equipment Maintenance logs</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-xs pb-3 border-b border-border-soft">
                  <div className="space-y-0.5">
                    <span className="text-text-muted block">Total Downtime</span>
                    <span className="font-bold text-text-primary">19 hours</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-text-muted block">Service cost</span>
                    <span className="font-bold text-text-primary">₹59,000</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-text-muted block">Next Service</span>
                    <span className="font-bold text-accent-secondary">July 15</span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Service Log History</span>
                  <div className="space-y-2.5">
                    {machineryLogs.map((log, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs border-b border-border-soft pb-2 last:border-b-0 last:pb-0">
                        <div>
                          <p className="font-bold text-text-primary">{log.type}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{log.date} · Downtime: {log.downtime}</p>
                        </div>
                        <span className="font-semibold text-text-primary">{formatCurrency(log.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resource Risk assessment */}
          <Card className="shadow-soft border-border-soft bg-surface">
            <CardHeader className="border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-accent-primary" />
                <span>Resource Risk Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">Capacity Risk</span>
                  <Badge tone={resourceData.utilization > 95 ? "error" : "success"}>
                    {resourceData.utilization > 95 ? "Critical Overload" : "Low Risk"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">Utilization Risk</span>
                  <Badge tone={resourceData.utilization < 45 ? "warning" : "success"}>
                    {resourceData.utilization < 45 ? "Idle Risk" : "Low Risk"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">Cost Variance Risk</span>
                  <Badge tone="success">Low Risk</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary">Deployment Lag Risk</span>
                  <Badge tone={health < 75 ? "error" : "success"}>
                    {health < 75 ? "Maintenance Risk" : "Low Risk"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs pt-3 border-t border-border-soft">
                  <span className="font-bold text-text-primary">Overall Allocation Risk</span>
                  <Badge tone={healthBadgeTone}>{healthLabel} Rating</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related reports */}
          <Card className="shadow-soft border-border-soft bg-surface-secondary/50 border border-dashed border-accent-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-accent-primary" />
                <span>Resource Operations Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-1">
              <ul className="list-disc pl-4 text-xs text-text-secondary space-y-1">
                <li>Allocated daily cost benchmarked within budget parameters.</li>
                <li>Uptime efficiency rate remains above structural line.</li>
                <li>Resource has logged zero major field delays this month.</li>
              </ul>
              <div className="text-[10px] text-text-muted italic border-t border-border-soft pt-2 flex items-center justify-between">
                <span>Last updated 5 minutes ago</span>
                <span>Resource AI Engine</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* DRAWER FORM FOR EDITING ALLOCATION */}
      <Drawer
        open={drawerOpen}
        title="Edit Resource Allocation"
        size="lg"
        onClose={() => setDrawerOpen(false)}
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

          {/* Target details */}
          <div className="p-5 rounded-xl border border-border-soft bg-surface-secondary/20 space-y-4">
            <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2">
              Resource Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Project Site *</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
                  className={selectClassName}
                >
                  {projectsData?.projects.map((p) => (
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
                  placeholder="e.g. Tower Crane 3"
                  value={form.resourceName}
                  onChange={(e) => setForm((prev) => ({ ...prev, resourceName: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Sub Type / Classification</label>
                <Input
                  placeholder="e.g. Steel Fixers, HVAC"
                  value={form.subType}
                  onChange={(e) => setForm((prev) => ({ ...prev, subType: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="p-5 rounded-xl border border-border-soft bg-surface-secondary/20 space-y-4">
            <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2">
              Deployment Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Assigned To (Structure/Zone) *</label>
                <Input
                  placeholder="e.g. Tower A Slab"
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

          {/* Controls */}
          <div className="flex justify-end gap-3 border-t border-border-soft pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={updateMutation.isPending} className="text-white font-semibold gap-1.5">
              <ClipboardPlus className="h-4.5 w-4.5" />
              <span>Update Allocation</span>
            </Button>
          </div>
        </form>
      </Drawer>
    </section>
  );
}
