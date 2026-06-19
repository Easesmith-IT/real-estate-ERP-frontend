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
  FileText,
  ChevronRight,
  ChevronLeft,
  Plus,
  User,
  CheckCircle2,
  Tag,
  Send,
  MoreVertical,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/erp-api";
import { formatDate } from "@/lib/erp-utils";
import type { DailyReport, DailyReportsResponse, PropertySummaryResponse } from "@/lib/erp-types";
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

export default function SiteUpdateDetailPage() {
  const { updateId } = useParams() as { updateId: string };
  const router = useRouter();
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  // Lightbox view state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Comments state (simulating adding a comment in thread)
  const [newCommentText, setNewCommentText] = useState("");
  const [localComments, setLocalComments] = useState<any[]>([
    {
      id: "c1",
      author: "Arjun Mehta",
      role: "Project Director",
      time: "2 hours ago",
      text: "The blockwork is looking clean. Let's make sure the waterproofing inspector signs off before closing the plumbing conduits."
    },
    {
      id: "c2",
      author: "Neha Sharma",
      role: "Lead QA/QC",
      time: "1 hour ago",
      text: "Façade mock-up details have been verified against building regulations. Ready to proceed with cladding brackets installation."
    }
  ]);

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
    siteHealth: "92",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Query Project details
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  // Query Daily report details
  const { data: reportData, isLoading: reportLoading, error: reportError } = useQuery({
    queryKey: ["erp-daily-report-detail", updateId, role],
    queryFn: async () => (await apiRequest<DailyReport>(`/api/projects/daily-reports/${updateId}`, { role })).data,
  });

  // Query all reports for timeline/navigation
  const { data: allReportsData, isLoading: allReportsLoading } = useQuery({
    queryKey: ["erp-daily-reports", role],
    queryFn: async () => (await apiRequest<DailyReportsResponse>("/api/projects/daily-reports", { role })).data,
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
        siteHealth: String(reportData.siteHealth || "92"),
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
        }
      };
      return apiRequest<DailyReport>(`/api/projects/daily-reports/${updateId}`, {
        role,
        method: "PUT",
        body: payload,
      });
    },
    onSuccess: async () => {
      setDrawerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-daily-report-detail", updateId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-daily-reports"] }),
      ]);
      toast.success("Site update updated successfully!");
    },
    onError: (err: any) => {
      toast.error(`Error updating report: ${err.message}`);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ id: string; success: boolean }>(`/api/projects/daily-reports/${updateId}`, {
        role,
        method: "DELETE"
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-daily-reports"] });
      toast.success("Site update deleted successfully!");
      router.push("/projects/site-updates");
    },
    onError: (err: any) => {
      toast.error(`Error deleting update: ${err.message}`);
    }
  });

  // Timeline & Navigation Helpers
  const { projectReports, prevReportId, nextReportId } = useMemo(() => {
    if (!reportData || !allReportsData?.reports) {
      return { projectReports: [], prevReportId: null, nextReportId: null };
    }
    const filtered = allReportsData.reports
      .filter(r => r.projectId === reportData.projectId)
      .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());
    
    const currentIndex = filtered.findIndex(r => r.id === updateId);
    const prevReportId = currentIndex > 0 ? filtered[currentIndex - 1].id : null;
    const nextReportId = currentIndex < filtered.length - 1 ? filtered[currentIndex + 1].id : null;

    return { projectReports: filtered, prevReportId, nextReportId };
  }, [reportData, allReportsData, updateId]);

  if (reportLoading || projectsLoading || allReportsLoading) return <LoadingStateCard title="Loading site update details" />;
  if (reportError || !reportData) return <ErrorStateCard message="Site update details are unavailable." />;

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.reportDate) errors.reportDate = "Report date is required.";
    if (!form.progressSummary.trim()) errors.progressSummary = "Daily narrative is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      updateMutation.mutate();
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const comment = {
      id: `local-${Date.now()}`,
      author: "You (Admin)",
      role: "Operations Manager",
      time: "Just now",
      text: newCommentText
    };
    setLocalComments((prev) => [...prev, comment]);
    setNewCommentText("");
  };

  // Weather styling properties
  const getWeatherDetails = (w?: string) => {
    switch (w?.toLowerCase()) {
      case "rainy":
      case "rain":
        return {
          icon: <CloudRain className="h-10 w-10 text-info animate-bounce" />,
          title: "Rainy & Wet",
          risk: "High Disruption Risk",
          riskTone: "error" as const,
          desc: "Exterior finishes and earthworks halted. Concrete pours rescheduled."
        };
      case "cloudy":
      case "clouds":
        return {
          icon: <Cloud className="h-10 w-10 text-text-muted" />,
          title: "Overcast",
          risk: "Low Risk",
          riskTone: "neutral" as const,
          desc: "Favorable conditions for indoor structural and concrete curing."
        };
      case "windy":
      case "wind":
        return {
          icon: <Wind className="h-10 w-10 text-accent-secondary" />,
          title: "Windy Conditions",
          risk: "Medium Risk",
          riskTone: "warning" as const,
          desc: "High crane lifts restricted. Scaffold reinforcement safety check required."
        };
      case "sunny":
      case "clear":
      default:
        return {
          icon: <Sun className="h-10 w-10 text-warning" fill="currentColor" />,
          title: "Sunny & Dry",
          risk: "Optimal Operations",
          riskTone: "success" as const,
          desc: "Ideal conditions for facade and structural brickwork activities."
        };
    }
  };

  const weatherCard = getWeatherDetails(reportData.weather);

  // Blocker priority badge tone
  const getBlockerTone = (level?: string) => {
    switch (level) {
      case "Critical":
      case "High":
        return "error";
      case "Medium":
        return "warning";
      case "Low":
        return "info";
      case "None":
      default:
        return "success";
    }
  };

  // Dummy tags
  const tags = ["Façade", "Façade Sign-off", "Safety Inspection", "Structure", "Concrete Pour"];

  return (
    <section className="space-y-6 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-5">
        <div className="flex items-center gap-3">
          <Link href="/projects/site-updates">
            <Button variant="secondary" size="sm" className="h-9 w-9 p-0 rounded-full shadow-soft">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge tone="info" className="font-bold uppercase tracking-wide">
                {reportData.projectName}
              </Badge>
              <span className="text-text-muted text-xs font-semibold">/ Update Details</span>
            </div>
            <h1 className="text-section-title font-secondary text-text-primary tracking-tight">
              {reportData.projectName} — {formatDate(reportData.reportDate)}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {prevReportId && (
            <Link href={`/projects/site-updates/${prevReportId}`}>
              <Button variant="secondary" size="md" className="shadow-soft">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
            </Link>
          )}
          {nextReportId && (
            <Link href={`/projects/site-updates/${nextReportId}`}>
              <Button variant="secondary" size="md" className="shadow-soft">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}

          <span className="h-6 w-px bg-border-soft mx-1"></span>

          <Button variant="secondary" size="md" onClick={() => toast.info("Downloading PDF summary...")}>
            <FileDown className="h-4 w-4" /> Export PDF
          </Button>

          <Button variant="secondary" size="md" onClick={() => setDrawerOpen(true)} className="hover:text-accent-primary">
            <Edit className="h-4 w-4" /> Edit
          </Button>

          <Button variant="ghost" size="md" onClick={() => { if (confirm("Delete this site update permanently?")) deleteMutation.mutate(); }} className="text-error hover:bg-error/5">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2.1fr_1fr]">
        
        {/* LEFT COLUMN: Narrative, Photo Gallery, Comments */}
        <div className="space-y-6">
          {/* OVERVIEW & NARRATIVE CARD */}
          <Card className="surface-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border-soft pb-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Field Narrative Log</p>
                <h2 className="text-section-title font-secondary text-text-primary">Daily Progress Narrative</h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-muted block">Logged Engineer</span>
                <span className="font-bold text-text-primary text-sm">{reportData.siteEngineer || "Vikram Rathore"}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-surface-secondary/40 border border-border-soft rounded-xl leading-relaxed text-text-primary text-base">
                {reportData.progressSummary}
              </div>

              {reportData.remarks && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-text-muted">Engineer Remarks / Extra Notes</p>
                  <p className="text-body text-text-secondary italic">"{reportData.remarks}"</p>
                </div>
              )}
            </div>

            {/* Logistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-soft pt-5">
              <div className="p-4 surface-secondary rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <HardHat className="h-4 w-4 text-accent-primary" /> Manpower & Labor deployed
                </h3>
                <div className="space-y-2 text-body">
                  <p className="font-semibold text-text-primary flex justify-between">
                    <span>Total Deployed:</span>
                    <span>{reportData.laborCount} laborers</span>
                  </p>
                  {reportData.laborDetails && (
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border-soft/60 text-xs text-text-secondary">
                      <div className="text-center p-1.5 bg-surface rounded">
                        <span className="block font-bold text-text-primary">{reportData.laborDetails.skilled}</span>
                        <span>Skilled</span>
                      </div>
                      <div className="text-center p-1.5 bg-surface rounded">
                        <span className="block font-bold text-text-primary">{reportData.laborDetails.unskilled}</span>
                        <span>Unskilled</span>
                      </div>
                      <div className="text-center p-1.5 bg-surface rounded">
                        <span className="block font-bold text-text-primary">{reportData.laborDetails.supervisors}</span>
                        <span>Supervisors</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 surface-secondary rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Hammer className="h-4 w-4 text-accent-secondary" /> Material Consumed
                </h3>
                <div className="space-y-2 text-body">
                  <p className="font-semibold text-text-primary flex justify-between truncate" title={reportData.materialUsage}>
                    <span>Usage Note:</span>
                    <span className="font-medium text-text-secondary text-right">{reportData.materialUsage || "Not detailed."}</span>
                  </p>
                  {reportData.materials && (
                    <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-border-soft/60 text-xs text-text-secondary">
                      <div className="text-center p-1.5 bg-surface rounded">
                        <span className="block font-bold text-text-primary">{reportData.materials.cement || 0}</span>
                        <span>Cement</span>
                      </div>
                      <div className="text-center p-1.5 bg-surface rounded">
                        <span className="block font-bold text-text-primary">{reportData.materials.steel || 0}t</span>
                        <span>Steel</span>
                      </div>
                      <div className="text-center p-1.5 bg-surface rounded">
                        <span className="block font-bold text-text-primary">{reportData.materials.sand || 0}t</span>
                        <span>Sand</span>
                      </div>
                      <div className="text-center p-1.5 bg-surface rounded">
                        <span className="block font-bold text-text-primary">{reportData.materials.aggregates || 0}t</span>
                        <span>Aggr.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* PHOTO GALLERY */}
          <Card className="surface-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <h3 className="text-section-title font-secondary text-text-primary flex items-center gap-2">
                <Camera className="h-4.5 w-4.5 text-accent-primary" /> Visual Media Gallery
              </h3>
              <Badge tone="info" className="text-[10px] font-bold">Photo Logs</Badge>
            </div>
            
            {/* Masonry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* If API returns real photos use them, otherwise render styled masonry items */}
              {reportData.photos && reportData.photos.length > 0 ? (
                reportData.photos.map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPhoto(photo)}
                    className="relative overflow-hidden rounded-xl border border-border-soft shadow-soft group cursor-pointer aspect-video bg-hover"
                  >
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${photo})` }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-[11px] text-white font-semibold">Photo Proof #{index + 1}</p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div onClick={() => setSelectedPhoto("/api/placeholder/800/600")} className="relative overflow-hidden rounded-xl border border-border-soft shadow-soft group cursor-pointer h-40 bg-hover">
                    <div className="absolute inset-0 bg-[url('/api/placeholder/800/600')] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3"><p className="text-[11px] text-white font-bold">Façade cladding brackets progress</p></div>
                  </div>
                  <div onClick={() => setSelectedPhoto("/api/placeholder/800/600")} className="relative overflow-hidden rounded-xl border border-border-soft shadow-soft group cursor-pointer h-40 bg-hover">
                    <div className="absolute inset-0 bg-[url('/api/placeholder/800/600')] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3"><p className="text-[11px] text-white font-bold">Tower concrete slab preparation</p></div>
                  </div>
                  <div onClick={() => setSelectedPhoto("/api/placeholder/800/600")} className="relative overflow-hidden rounded-xl border border-border-soft shadow-soft group cursor-pointer h-40 bg-hover">
                    <div className="absolute inset-0 bg-[url('/api/placeholder/800/600')] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3"><p className="text-[11px] text-white font-bold">Waterproofing layers inspection sign-off</p></div>
                  </div>
                </>
              )}
            </div>

            {/* Video Logs (Mocked) */}
            <div className="pt-4 border-t border-border-soft space-y-2">
              <p className="text-xs font-bold text-text-muted">Video logs recorded (1)</p>
              <div className="flex items-center gap-3 p-3 surface-secondary rounded-xl">
                <div className="h-10 w-10 bg-accent-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Eye className="h-5 w-5 text-accent-primary animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">dpr_walkthrough_tower_a.mp4</p>
                  <p className="text-[10px] text-text-muted">45 seconds • Recorded by {reportData.siteEngineer || "Vikram Rathore"}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => toast.info("Playing video walkthrough...")}>
                  Play Walkthrough
                </Button>
              </div>
            </div>
          </Card>

          {/* COMMENTS / Modern Threaded Discussion */}
          <Card className="surface-card p-6 space-y-5">
            <h3 className="text-section-title font-secondary text-text-primary flex items-center gap-2 border-b border-border-soft pb-3">
              <MessageSquare className="h-4.5 w-4.5 text-accent-primary" /> On-site Communications
            </h3>
            
            <div className="space-y-4">
              {localComments.map((comment) => (
                <div key={comment.id} className="flex gap-3 items-start border-b border-border-soft/60 pb-3 last:border-0 last:pb-0">
                  <div className="h-9 w-9 rounded-full bg-accent-primary/10 flex items-center justify-center font-bold text-accent-primary text-xs shrink-0 uppercase">
                    {comment.author.substring(0,2)}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">{comment.author}</span>
                        <span className="text-[10px] bg-hover px-1.5 py-0.5 rounded text-text-muted font-medium">{comment.role}</span>
                      </div>
                      <span className="text-[10px] text-text-muted">{comment.time}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed bg-surface-secondary/50 p-2.5 rounded-lg border border-border-soft/40">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* New Comment Input */}
            <form onSubmit={handleAddComment} className="flex items-start gap-2.5 pt-4 border-t border-border-soft">
              <Input
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a follow-up instructions or query..."
                className="h-11 flex-1"
              />
              <Button type="submit" className="bg-accent-primary hover:bg-accent-primary-hover h-11 text-white">
                <Send className="h-4 w-4" /> Send
              </Button>
            </form>
          </Card>
        </div>

        {/* RIGHT COLUMN: Sidebar (Weather, Timeline, Blockers, Quick Actions) */}
        <div className="space-y-6">
          {/* QUICK SUMMARY CARD */}
          <Card className="surface-card p-5 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Site Health Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-text-primary">{reportData.siteHealth || "92"}</span>
                <span className="text-xs text-success font-semibold flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> Healthy</span>
              </div>
            </div>
            
            <div className="space-y-3 pt-2 border-t border-border-soft">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Blocker Status:</span>
                <Badge tone={getBlockerTone(reportData.blockersLevel)}>
                  {reportData.blockersLevel || "None"} Risk
                </Badge>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Total Labor Hours:</span>
                <span className="font-semibold text-text-primary">{Number(reportData.laborCount) * 8} hrs logged</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Progress Inc.:</span>
                <span className="font-bold text-accent-primary">+{reportData.progressPercent || "5"}% completion</span>
              </div>
            </div>
          </Card>

          {/* WEATHER SNAPSHOT CARD */}
          <Card className="surface-card p-5 space-y-4">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Weather Conditions</p>
            <div className="flex items-center gap-4">
              {weatherCard.icon}
              <div>
                <h4 className="text-sm font-bold text-text-primary leading-tight">{weatherCard.title}</h4>
                <Badge tone={weatherCard.riskTone} className="text-[9px] px-1 py-0 mt-1 uppercase font-extrabold tracking-wide">
                  {weatherCard.risk}
                </Badge>
              </div>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed border-t border-border-soft pt-3">
              {weatherCard.desc}
            </p>
          </Card>

          {/* ISSUE RESOLUTION HISTORY */}
          <Card className="surface-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-warning" /> Blockers & Holds
            </h3>
            
            <div className="p-3 bg-surface-secondary/40 border border-border-soft rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">Operational Obstacles</span>
                <Badge tone={getBlockerTone(reportData.blockersLevel)} className="text-[9px]">
                  {reportData.blockersLevel || "None"}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {reportData.blockers && reportData.blockers.toLowerCase() !== "no critical blockers." 
                  ? reportData.blockers 
                  : "No critical engineering blockages or logistics constraints reported for this session."}
              </p>
              
              <div className="pt-2.5 border-t border-border-soft/60 flex items-center justify-between text-[10px] text-text-muted">
                <span>Resolution Time:</span>
                <span className="font-semibold text-text-primary">Under review</span>
              </div>
            </div>
          </Card>

          {/* PROJECT TIMELINE (VERTICAL CHRONOLOGY) */}
          <Card className="surface-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Site Project Timeline</h3>
              <Badge tone="neutral" className="text-[9px]">Updates History</Badge>
            </div>

            <div className="relative border-l border-border-soft pl-4 space-y-6 py-2 ml-1">
              {projectReports.map((report) => {
                const isCurrent = report.id === updateId;
                return (
                  <div key={report.id} className="relative space-y-1">
                    {/* Circle timeline dot */}
                    <span className={`absolute -left-[21.5px] top-1.5 h-3 w-3 rounded-full border-2 bg-surface ${isCurrent ? "border-accent-primary ring-4 ring-accent-primary/10" : "border-border-soft"}`}></span>
                    
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold ${isCurrent ? "text-accent-primary" : "text-text-muted"}`}>
                        {formatDate(report.reportDate)}
                      </span>
                      {report.blockersLevel && report.blockersLevel !== "None" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-error animate-pulse"></span>
                      )}
                    </div>

                    <Link href={`/projects/site-updates/${report.id}`}>
                      <p className={`text-xs font-semibold cursor-pointer hover:underline truncate ${isCurrent ? "text-text-primary font-bold" : "text-text-secondary"}`}>
                        {report.progressSummary || "Daily Progress Log"}
                      </p>
                    </Link>
                    <p className="text-[10px] text-text-muted">Submitted by {report.submittedByName}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* TAGS & LABELS */}
          <Card className="surface-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-accent-primary" /> Classifications
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full border border-border-soft bg-surface-secondary text-[10px] font-semibold text-text-secondary">
                  #{tag}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* LIGHTBOX FOR PHOTO VIEWING */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center">
            <img src={selectedPhoto} className="max-w-full max-h-full object-contain rounded-lg shadow-floating" alt="Lightbox Preview" />
            <p className="text-white text-xs mt-3 bg-black/60 px-4 py-1.5 rounded-full border border-white/10">
              Click anywhere outside to close
            </p>
          </div>
        </div>
      )}

      {/* EDIT DRAWER (XL) */}
      <Drawer
        open={drawerOpen}
        title="Update Site Operations Logs"
        size="xl"
        onClose={() => setDrawerOpen(false)}
      >
        <form onSubmit={handleEditSubmit} className="space-y-6 pb-12">
          <div className="p-4 rounded-xl border border-warning/20 bg-warning/5 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-text-primary">Modification Warning</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                You are modifying an existing site report. These changes will instantly synchronize with executive dashboards and timeline roadmaps.
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
                  {projectsData?.projects.map((p) => (
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
                <label className="text-label text-text-secondary">Site Engineer</label>
                <Input
                  value={form.siteEngineer}
                  onChange={(e) => setForm((prev) => ({ ...prev, siteEngineer: e.target.value }))}
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
                  <label className="text-[10px] text-text-secondary font-bold">Steel Used (tons)</label>
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
              loading={updateMutation.isPending}
              className="bg-accent-primary hover:bg-accent-primary-hover shadow-active-nav text-white"
            >
              <ClipboardPlus className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </Drawer>
    </section>
  );
}
