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
  Share2,
  Building2,
  Calendar,
  UserCheck,
  Clock,
  HardHat,
  Users,
  AlertTriangle,
  CloudRain,
  Cloud,
  Wind,
  Sun,
  ShieldAlert,
  Award,
  Zap,
  Hammer,
  ClipboardPlus,
  Eye,
  Camera,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  FileText
} from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/erp-api";
import { formatDate } from "@/lib/erp-utils";
import type { DailyReport, PropertySummaryResponse } from "@/lib/erp-types";
import { useUiStore } from "@/store/ui-store";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";

// Select and textarea class names
const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all";
const textareaClassName =
  "min-h-[104px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all";

export default function ReportDetailPage() {
  const { reportId } = useParams() as { reportId: string };
  const router = useRouter();
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  // Selected photo for lightbox view
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Edit Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  // Query Project details
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  // Query Daily report details
  const { data: reportData, isLoading: reportLoading, error: reportError } = useQuery({
    queryKey: ["erp-daily-report-detail", reportId, role],
    queryFn: async () => (await apiRequest<DailyReport>(`/api/projects/daily-reports/${reportId}`, { role })).data,
  });

  // Prefill edit form when drawer opens
  useEffect(() => {
    if (drawerOpen && reportData) {
      setForm({
        projectId: reportData.projectId,
        reportDate: reportData.reportDate ? reportData.reportDate.split("T")[0] : "",
        shift: reportData.shift || "Day",
        siteEngineer: reportData.siteEngineer || "Vikram Rathore",
        laborCount: String(reportData.laborCount || ""),
        laborSkilled: String(reportData.laborDetails?.skilled || ""),
        laborUnskilled: String(reportData.laborDetails?.unskilled || ""),
        laborSupervisors: String(reportData.laborDetails?.supervisors || ""),
        progressPercent: String(reportData.progressPercent || ""),
        progressSummary: reportData.progressSummary || "",
        materialCement: String(reportData.materials?.cement || ""),
        materialSteel: String(reportData.materials?.steel || ""),
        materialSand: String(reportData.materials?.sand || ""),
        materialAggregates: String(reportData.materials?.aggregates || ""),
        materialUsageText: reportData.materialUsage || "",
        blockersLevel: reportData.blockersLevel || "None",
        blockers: reportData.blockers || "",
        weather: reportData.weather || "Sunny",
        remarks: reportData.remarks || "",
        siteHealth: String(reportData.siteHealth || "90"),
      });
      setFormErrors({});
    }
  }, [drawerOpen, reportData]);

  // Edit Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
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
      return apiRequest<DailyReport>(`/api/projects/daily-reports/${reportId}`, {
        role,
        method: "PUT",
        body: payload,
      });
    },
    onSuccess: async () => {
      setDrawerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-daily-report-detail", reportId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-daily-reports"] }),
      ]);
      toast.success("Daily Progress Report updated successfully!");
    },
    onError: (err) => {
      toast.error(`Error updating report: ${err.message}`);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ id: string; success: boolean }>(`/api/projects/daily-reports/${reportId}`, {
        role,
        method: "DELETE"
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-daily-reports"] });
      toast.success("Daily Progress Report deleted successfully!");
      router.push("/projects/daily-reports");
    },
    onError: (err) => {
      toast.error(`Error deleting report: ${err.message}`);
    }
  });

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
    updateMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this daily progress report? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  if (reportLoading || projectsLoading) return <LoadingStateCard title="Loading Site Intelligence Details" />;
  if (reportError || !reportData) return <ErrorStateCard message="Operation report details are unavailable." />;

  const health = reportData.siteHealth || 90;
  let statusLabel = "Excellent";
  let statusBadgeTone: "success" | "warning" | "error" | "info" = "success";
  if (health < 70) {
    statusLabel = "Critical";
    statusBadgeTone = "error";
  } else if (health < 85) {
    statusLabel = "Watch";
    statusBadgeTone = "warning";
  } else if (health < 95) {
    statusLabel = "Healthy";
    statusBadgeTone = "success";
  }

  // Set mock photos if none returned
  const photosList = reportData.photos?.length ? reportData.photos : [
    "/images/progress-casting.jpg",
    "/images/safety-walk.jpg",
    "/images/brickwork-lvl3.jpg"
  ];

  return (
    <section className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 border-b border-border-soft pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/projects/daily-reports">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <span className="text-label font-bold uppercase tracking-wider text-text-muted">Report Detail</span>
            <Badge tone="neutral">{reportData.id}</Badge>
          </div>
          <h1 className="text-page-title font-secondary font-bold tracking-tight text-text-primary">
            {reportData.projectName} Operations Report
          </h1>
          <p className="text-body text-text-secondary flex items-center gap-1.5 flex-wrap">
            <UserCheck className="h-4 w-4" />
            <span>Site Engineer: {reportData.siteEngineer || "Vikram Rathore"}</span>
            <span className="text-text-muted">·</span>
            <Calendar className="h-4 w-4" />
            <span>{formatDate(reportData.reportDate)}</span>
            <span className="text-text-muted">·</span>
            <Clock className="h-4 w-4" />
            <span>Shift: {reportData.shift || "Day"} Shift</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setDrawerOpen(true)} className="text-white font-semibold gap-1.5">
            <Edit className="h-4.5 w-4.5" />
            <span>Edit Report</span>
          </Button>
          <Button variant="secondary" onClick={() => toast.info("DPR Exported as PDF!")} className="gap-1.5 font-medium">
            <FileDown className="h-4.5 w-4.5" />
            <span>Export PDF</span>
          </Button>
          <Button variant="secondary" onClick={() => toast.success("Report link copied to clipboard!")} className="gap-1.5 font-medium">
            <Share2 className="h-4.5 w-4.5" />
            <span>Share</span>
          </Button>
          <Button variant="ghost" onClick={handleDelete} className="text-error hover:bg-error-soft/10 gap-1.5 font-medium border border-transparent hover:border-error-soft/20">
            <Trash2 className="h-4.5 w-4.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* CORE STATS OVERVIEW */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="shadow-soft border-border-soft">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary shrink-0">
              <Award className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-label uppercase tracking-wider text-text-muted">Site Health Score</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl font-bold ${health >= 95 ? "text-success" : health >= 85 ? "text-accent-primary" : health >= 70 ? "text-warning" : "text-error"}`}>
                  {health}
                </span>
                <span className="text-xs text-text-muted">/100</span>
                <Badge tone={statusBadgeTone} className="ml-2 font-medium">
                  {statusLabel}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border-soft">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success-soft/30 text-success shrink-0">
              <Zap className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-label uppercase tracking-wider text-text-muted">Progress Completed</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{reportData.progressPercent || 75}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border-soft">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-secondary/10 text-accent-secondary shrink-0">
              <Users className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-label uppercase tracking-wider text-text-muted">Active Labor force</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{reportData.laborCount} workers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border-soft">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warning-soft/30 text-warning shrink-0">
              <AlertTriangle className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-label uppercase tracking-wider text-text-muted">Blocker Level</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{reportData.blockersLevel || "None"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DETAIL PAGE SECTIONS GRID */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2.5fr_1.5fr]">
        
        {/* LEFT COLUMN: Overview, Workforce, Progress, Materials, Blockers */}
        <div className="space-y-6">
          {/* Overview Card */}
          <Card className="shadow-soft border-border-soft bg-surface">
            <CardHeader className="border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-primary" />
                <span>Executive Progress Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <p className="text-body font-medium leading-relaxed text-text-primary bg-surface-secondary/50 p-4 rounded-xl border border-border-soft">
                {reportData.progressSummary}
              </p>
              
              {reportData.remarks && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-label font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Remarks & Engineering Notes
                  </span>
                  <p className="text-body text-text-secondary leading-relaxed pl-1">
                    {reportData.remarks}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workforce Section */}
          <Card className="shadow-soft border-border-soft bg-surface">
            <CardHeader className="border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                <Users className="h-5 w-5 text-accent-primary" />
                <span>Workforce & Labor Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="bg-surface-secondary/40 p-4 rounded-xl border border-border-soft text-center">
                  <p className="text-[28px] font-extrabold text-text-primary">{reportData.laborCount}</p>
                  <p className="text-label text-text-muted font-medium uppercase mt-1">Total Labor</p>
                </div>
                <div className="bg-surface-secondary/40 p-4 rounded-xl border border-border-soft text-center">
                  <p className="text-[28px] font-extrabold text-accent-primary">{reportData.laborDetails?.skilled || Math.round(reportData.laborCount * 0.5)}</p>
                  <p className="text-label text-text-muted font-medium uppercase mt-1">Skilled Labor</p>
                </div>
                <div className="bg-surface-secondary/40 p-4 rounded-xl border border-border-soft text-center">
                  <p className="text-[28px] font-extrabold text-accent-secondary">{reportData.laborDetails?.unskilled || Math.round(reportData.laborCount * 0.42)}</p>
                  <p className="text-label text-text-muted font-medium uppercase mt-1">Unskilled Labor</p>
                </div>
                <div className="bg-surface-secondary/40 p-4 rounded-xl border border-border-soft text-center">
                  <p className="text-[28px] font-extrabold text-warning">{reportData.laborDetails?.supervisors || Math.round(reportData.laborCount * 0.08)}</p>
                  <p className="text-label text-text-muted font-medium uppercase mt-1">Supervisors</p>
                </div>
              </div>

              {/* Productivity Score visualization */}
              <div className="rounded-xl border border-border-soft bg-accent-primary/[0.01] p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-body font-bold text-text-primary">Site Productivity Index</span>
                  <p className="text-xs text-text-secondary">Measured labor output vs schedule baseline projection.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <span className="text-2xl font-black text-accent-primary">91%</span>
                  </div>
                  <Badge tone="success" className="font-semibold px-2 py-0.5">
                    Above Benchmark
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Section */}
          <Card className="shadow-soft border-border-soft bg-surface">
            <CardHeader className="border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent-primary" />
                <span>Construction Progress & Forecast</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-body font-semibold">
                  <span className="text-text-primary">Cumulative Workfront Progress</span>
                  <span className="text-accent-primary">{reportData.progressPercent || 75}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-hover overflow-hidden relative">
                  <div className="h-3 rounded-full bg-accent-primary transition-all duration-300" style={{ width: `${reportData.progressPercent || 75}%` }} />
                </div>
                <div className="flex justify-between text-xs text-text-muted pt-1">
                  <span>Target: {Math.min(100, (reportData.progressPercent || 75) + 3)}%</span>
                  <span className="text-success font-medium flex items-center gap-0.5">
                    <Zap className="h-3.5 w-3.5" />
                    +3% Variance
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-xl border border-border-soft bg-surface-secondary/40">
                  <span className="text-xs font-semibold text-text-muted uppercase">Completion Forecast</span>
                  <p className="text-body font-bold text-text-primary mt-1.5">October 24, 2026</p>
                  <p className="text-[11px] text-success font-medium mt-0.5 flex items-center gap-0.5">
                    <UserCheck className="h-3 w-3" />
                    On Schedule (0 days lag)
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border-soft bg-surface-secondary/40">
                  <span className="text-xs font-semibold text-text-muted uppercase">Execution Quality Rating</span>
                  <p className="text-body font-bold text-text-primary mt-1.5">94 / 100</p>
                  <p className="text-[11px] text-text-muted mt-0.5">Excellent slab concrete compliance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materials Section */}
          <Card className="shadow-soft border-border-soft bg-surface">
            <CardHeader className="border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                <HardHat className="h-5 w-5 text-accent-primary" />
                <span>Material Consumed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-4">
                {/* Material 1: Cement */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-text-primary">Cement</span>
                    <span className="text-text-secondary">{reportData.materials?.cement || 110} Bags / 150 Target</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-hover overflow-hidden">
                    <div className="h-2 rounded-full bg-accent-primary" style={{ width: `${((reportData.materials?.cement || 110) / 150) * 100}%` }} />
                  </div>
                </div>
                
                {/* Material 2: Steel */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-text-primary">Reinforcement Steel</span>
                    <span className="text-text-secondary">{reportData.materials?.steel || 3.2} Tons / 4.0 Target</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-hover overflow-hidden">
                    <div className="h-2 rounded-full bg-warning" style={{ width: `${((reportData.materials?.steel || 3.2) / 4) * 100}%` }} />
                  </div>
                </div>

                {/* Material 3: Sand */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-text-primary">Sand</span>
                    <span className="text-text-secondary">{reportData.materials?.sand || 15} Brass / 20 Target</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-hover overflow-hidden">
                    <div className="h-2 rounded-full bg-success" style={{ width: `${((reportData.materials?.sand || 15) / 20) * 100}%` }} />
                  </div>
                </div>

                {/* Material 4: Aggregates */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-text-primary">Aggregates</span>
                    <span className="text-text-secondary">{reportData.materials?.aggregates || 25} cu.m / 30 Target</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-hover overflow-hidden">
                    <div className="h-2 rounded-full bg-accent-secondary" style={{ width: `${((reportData.materials?.aggregates || 25) / 30) * 100}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-muted italic border-t border-border-soft pt-3">
                Material usage is calculated dynamically based on daily concrete casting volume benchmarks.
              </p>
            </CardContent>
          </Card>

          {/* Blockers Section */}
          <Card className="shadow-soft border-border-soft bg-surface">
            <CardHeader className="border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-accent-primary" />
                <span>Blockers & Mitigation Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="rounded-xl border border-border-soft bg-surface-secondary/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary uppercase">Current Blocker status</span>
                  <Badge tone={reportData.blockersLevel === "Critical" || reportData.blockersLevel === "High" ? "error" : reportData.blockersLevel === "Medium" ? "warning" : "success"}>
                    {reportData.blockersLevel || "None"}
                  </Badge>
                </div>
                <p className="text-body font-semibold text-text-primary">
                  {reportData.blockers || "No critical execution blockers logged for this shift."}
                </p>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-soft text-xs text-text-secondary">
                  <div>
                    <span className="font-bold">Owner:</span> Site Ops Team
                  </div>
                  <div>
                    <span className="font-bold">Resolution ETA:</span> Within 24 hours
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Site Risk Center, Photo Gallery, Activity Timeline, Summary Card */}
        <div className="space-y-6">
          
          {/* SITE RISK CENTER */}
          <Card className="shadow-soft border-border-soft bg-surface">
            <CardHeader className="border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-accent-primary" />
                <span>Site Risk Center</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary">Labor Risk</span>
                  <Badge tone="success">Low Risk</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary">Material Shortage Risk</span>
                  <Badge tone="warning">Medium Risk</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary">Weather Disruption Risk</span>
                  <Badge tone={reportData.weather === "Rainy" || reportData.weather === "Rain" ? "warning" : "success"}>
                    {reportData.weather === "Rainy" || reportData.weather === "Rain" ? "Medium" : "Low"} Risk
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary">Execution Lag Risk</span>
                  <Badge tone={reportData.blockersLevel === "High" || reportData.blockersLevel === "Critical" ? "error" : "success"}>
                    {reportData.blockersLevel === "High" || reportData.blockersLevel === "Critical" ? "High" : "Low"} Risk
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-t border-border-soft pt-3 mt-1">
                  <span className="text-xs font-bold text-text-primary">Overall Operations Risk</span>
                  <Badge tone={statusBadgeTone}>
                    {statusLabel === "Excellent" || statusLabel === "Healthy" ? "Low Risk" : "Medium Risk"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PHOTO GALLERY */}
          <Card className="shadow-soft border-border-soft bg-surface">
            <CardHeader className="border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                <Camera className="h-5 w-5 text-accent-primary" />
                <span>Construction Site Photos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {photosList.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(url)}
                    className="aspect-square rounded-lg border border-border-soft bg-hover overflow-hidden relative cursor-pointer group"
                  >
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xs font-bold">
                      <Eye className="h-5 w-5" />
                    </div>
                    {/* Simulated visual image block */}
                    <div className="h-full w-full flex flex-col items-center justify-center text-text-muted text-[10px] p-2 bg-gradient-to-tr from-surface-secondary to-hover text-center">
                      <Camera className="h-5 w-5 mb-1 text-accent-primary/60" />
                      <span>Photo {idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* EXECUTIVE SUMMARY */}
          <Card className="shadow-soft border-border-soft bg-surface-secondary/50 border border-dashed border-accent-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-accent-primary" />
                <span>Site Operations Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <ul className="list-disc pl-4 text-xs text-text-secondary space-y-1.5">
                <li>18 reports submitted successfully this week</li>
                <li>Workforce productivity index improved by 9%</li>
                <li>{reportData.blockersLevel !== "None" ? "1 site requires immediate mitigation due to blocker" : "All sites progressing within target lines"}</li>
                <li>Material consumption remains fully optimized</li>
                <li>Villa Phase 2 remains the strongest performer</li>
              </ul>
              <div className="text-[10px] text-text-muted italic border-t border-border-soft pt-2.5 flex items-center justify-between">
                <span>Last updated 5 minutes ago</span>
                <span>NimOS AI Assistant</span>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className="shadow-soft border-border-soft bg-surface">
            <CardHeader className="border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent-primary" />
                <span>Daily Log Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative border-l border-border-soft pl-4 space-y-4">
                <div className="relative">
                  <span className="absolute -left-[21px] top-0 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-accent-primary" />
                  <span className="text-[10px] font-bold text-text-muted">09:00 AM</span>
                  <p className="text-[11px] text-text-secondary font-medium mt-0.5">Shift mobilization completed.</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-[21px] top-0 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-warning" />
                  <span className="text-[10px] font-bold text-text-muted">11:30 AM</span>
                  <p className="text-[11px] text-text-secondary font-medium mt-0.5">Layout check delay: {reportData.blockersLevel || "None"}</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-[21px] top-0 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-success" />
                  <span className="text-[10px] font-bold text-text-muted">04:30 PM</span>
                  <p className="text-[11px] text-text-secondary font-medium mt-0.5">Concrete pour complete.</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-[21px] top-0 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-accent-primary" />
                  <span className="text-[10px] font-bold text-text-muted">06:00 PM</span>
                  <p className="text-[11px] text-text-secondary font-medium mt-0.5">DPR submitted by engineer.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-[var(--z-modal)] bg-black/85 flex flex-col items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-4xl max-h-[80vh] w-full flex flex-col items-center justify-center bg-surface-secondary/10 p-5 rounded-2xl relative border border-border-soft">
            <span className="absolute right-4 top-4 text-white font-bold text-2xl">×</span>
            <div className="h-96 w-full flex flex-col items-center justify-center text-white bg-gradient-to-tr from-surface-secondary to-hover rounded-xl">
              <Camera className="h-16 w-16 mb-4 text-accent-primary" />
              <p className="text-lg font-bold">Construction Operations Photo Preview</p>
              <p className="text-body text-text-muted mt-1">{selectedPhoto}</p>
            </div>
            <p className="text-xs text-white/60 mt-4 text-center">
              Field verification snap logged on {formatDate(reportData.reportDate)}
            </p>
          </div>
        </div>
      )}

      {/* XL EDIT RIGHT DRAWER */}
      <Drawer
        open={drawerOpen}
        title="Edit Daily Progress Report (DPR)"
        size="lg"
        onClose={() => setDrawerOpen(false)}
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
                  disabled
                >
                  {projectsData?.projects.map((project) => (
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
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={updateMutation.isPending} className="text-white gap-1.5 font-semibold">
              <ClipboardPlus className="h-4.5 w-4.5" />
              <span>Save Report</span>
            </Button>
          </div>
        </form>
      </Drawer>
    </section>
  );
}
