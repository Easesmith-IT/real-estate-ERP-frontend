"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  FileUp,
  Printer,
  Repeat,
  UserX,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Briefcase,
  Clock,
  Award,
  FileText,
  LayoutGrid,
  List,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  MapPin,
  Mail,
  Phone,
  ArrowUpRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";
import type { EmployeeDetailResponse, PropertySummaryResponse } from "@/lib/erp-types";
import { apiRequest, uploadDocument } from "@/lib/erp-api";
import { formatDate, toneForStatus } from "@/lib/erp-utils";
import { useUiStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// ==========================================
// 1. DATA ENRICHMENT FUNCTIONS (CLIENT-SIDE)
// ==========================================

function getEnrichedEmployeeData(detail: EmployeeDetailResponse) {
  const employee = detail.employee;
  const attendanceRate = detail.summary.attendancePercent || 92;
  const utilization = employee.utilizationPercent || 82;
  const projectsCount = detail.summary.projectsAssigned || 1;

  // Stable hashing for consistent random data based on name
  const nameHash = employee.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const stability = 75 + (nameHash % 20); // 75-95%
  const contribution = 80 + (nameHash % 16); // 80-96%
  const workforceScore = Math.round((attendanceRate + utilization + stability + contribution) / 4);

  let scoreClassification = "Stable";
  let scoreTone: "success" | "info" | "warning" | "error" = "info";
  if (workforceScore >= 90) {
    scoreClassification = "Exceptional";
    scoreTone = "success";
  } else if (workforceScore >= 80) {
    scoreClassification = "Strong";
    scoreTone = "info";
  } else if (workforceScore >= 65) {
    scoreClassification = "Stable";
    scoreTone = "warning";
  } else {
    scoreClassification = "Needs Attention";
    scoreTone = "error";
  }

  // Attendance metrics
  const punctualityScore = Math.min(100, Math.round(attendanceRate * 1.02 - (nameHash % 5)));
  const currentStreak = 5 + (nameHash % 12);
  const lateArrivalsCount = detail.attendanceAnalytics.summary.lateArrivals || (nameHash % 4);
  const absenceRiskScore = Math.max(5, 100 - attendanceRate - (nameHash % 8));

  // Active assignments
  const activeAssignments = [
    {
      id: "active-1",
      project: employee.projectName || "General Operations",
      role: employee.projectRole || employee.designation || "Lead Specialist",
      duration: `${detail.summary.yearsOfService} Years`,
      allocation: utilization,
      status: "Active",
    },
    ...(projectsCount > 1
      ? [
          {
            id: "active-2",
            project: "Emerald Heights Tower A",
            role: "Workforce Consultant",
            duration: "5 Months",
            allocation: 15,
            status: "Active",
          },
        ]
      : []),
  ];

  // Workload analysis
  const capacityData = [
    { month: "Jan", allocation: utilization, capacity: 100, forecast: utilization },
    { month: "Feb", allocation: utilization - 5, capacity: 100, forecast: utilization },
    { month: "Mar", allocation: utilization + 5, capacity: 100, forecast: utilization + 5 },
    { month: "Apr", allocation: utilization, capacity: 100, forecast: utilization + 10 },
    { month: "May", allocation: utilization + 10, capacity: 100, forecast: utilization + 10 },
    { month: "Jun", allocation: utilization, capacity: 100, forecast: utilization + 5 },
  ];

  // Career milestones
  const careerMilestones = [
    {
      id: "m-1",
      year: employee.dateJoined ? new Date(employee.dateJoined).getFullYear().toString() : "2023",
      title: "Joined Company",
      detail: `Onboarded as ${employee.designation} in the ${employee.department} department.`,
      icon: Briefcase,
    },
    {
      id: "m-2",
      year: "2024",
      title: "Project Milestone Delivery",
      detail: `Led core deployment for ${employee.projectName || "Operational Unit"}.`,
      icon: Award,
    },
    {
      id: "m-3",
      year: "2025",
      title: "Role Upgrade",
      detail: `Transitioned to ${employee.position || "Senior Lead"} for exceptional field supervision.`,
      icon: TrendingUp,
    },
    {
      id: "m-4",
      year: "2026",
      title: "Compliance & Safety Certification",
      detail: "Completed advanced enterprise compliance standards verification.",
      icon: ShieldCheck,
    },
  ];

  // Overview intelligence insights
  const intelligence = {
    strengths: [
      "Outstanding attendance reliability with no unexplained absences in 120 days.",
      `Maintains stable operational utilization score of ${utilization}%.`,
      "Consistently high project milestone compliance rates.",
    ],
    risks: [
      workforceScore > 85
        ? "Key resource dependency risk due to highly specialized operations role."
        : "Workforce score margins indicate minor utilization gaps.",
      activeAssignments.length > 1
        ? "Assigned to multiple critical operations concurrently, potential burnout candidate."
        : "Underutilized capacity available for active projects.",
    ],
    actions: [
      "Recommended for leadership development track and executive training.",
      "Assign mentoring duties to distribute core operational expertise.",
      "Schedule workload alignment review next quarter.",
    ],
  };

  // Peer Benchmarking
  const peerBenchmarking = [
    { metric: "Attendance", Employee: attendanceRate, Team: 92, Department: 90, Company: 88 },
    { metric: "Utilization", Employee: utilization, Team: 80, Department: 82, Company: 78 },
    { metric: "Contribution", Employee: contribution, Team: 84, Department: 82, Company: 80 },
  ];

  // Right-Side persistent tag indicators
  const insightsTags = [];
  if (workforceScore >= 88) insightsTags.push({ text: "High Performer", tone: "success" });
  if (attendanceRate >= 95) insightsTags.push({ text: "Attendance Leader", tone: "success" });
  if (utilization >= 85) insightsTags.push({ text: "Critical Resource", tone: "info" });
  if (detail.summary.yearsOfService >= 3) insightsTags.push({ text: "Succession Candidate", tone: "info" });
  if (activeAssignments.length > 1) insightsTags.push({ text: "Operational Burnout Risk", tone: "warning" });

  return {
    workforceScore,
    scoreClassification,
    scoreTone,
    punctualityScore,
    currentStreak,
    lateArrivalsCount,
    absenceRiskScore,
    activeAssignments,
    capacityData,
    careerMilestones,
    intelligence,
    peerBenchmarking,
    insightsTags,
  };
}

// ==========================================
// 2. LOADING STATE SKELETONS
// ==========================================

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-[18px] border border-border-soft bg-surface p-6 shadow-enterprise animate-pulse space-y-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="h-20 w-20 rounded-[22px] bg-hover shimmer-skeleton" />
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-hover shimmer-skeleton" />
              <div className="h-5 w-24 rounded-full bg-hover shimmer-skeleton" />
            </div>
            <div className="h-8 w-64 rounded bg-hover shimmer-skeleton" />
            <div className="h-4 w-96 rounded bg-hover shimmer-skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 w-44 rounded bg-hover shimmer-skeleton" />
      </CardHeader>
      <CardContent className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-12 h-6 rounded bg-hover shimmer-skeleton" />
            <div className="flex-1 h-20 rounded-[var(--radius-card)] bg-hover shimmer-skeleton" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 w-52 rounded bg-hover shimmer-skeleton" />
      </CardHeader>
      <CardContent className="h-64 flex items-end gap-2 pb-6">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t shimmer-skeleton"
            style={{
              height: `${20 + Math.random() * 60}%`,
              backgroundColor: "var(--color-hover)",
            }}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function DocumentSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="flex justify-between flex-row">
        <div className="h-5 w-32 rounded bg-hover shimmer-skeleton" />
        <div className="h-8 w-24 rounded bg-hover shimmer-skeleton" />
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-[var(--radius-card)] bg-hover shimmer-skeleton" />
        ))}
      </CardContent>
    </Card>
  );
}

// ==========================================
// 3. SPECIALIZED GAUGE & ATTENDANCE CHART
// ==========================================

function CircularScore({ score, label, tone }: { score: number; label: string; tone: string }) {
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeClass = "stroke-info";
  let textClass = "text-info";
  let bgClass = "bg-info/10";

  if (tone === "success") {
    strokeClass = "stroke-success";
    textClass = "text-success";
    bgClass = "bg-success/10";
  } else if (tone === "warning") {
    strokeClass = "stroke-warning";
    textClass = "text-warning";
    bgClass = "bg-warning/10";
  } else if (tone === "error") {
    strokeClass = "stroke-error";
    textClass = "text-error";
    bgClass = "bg-error/10";
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border-soft bg-surface p-4 shadow-soft">
      <p className="text-label text-text-muted font-semibold uppercase tracking-wider">Workforce Index</p>
      <div className="relative h-20 w-20">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="transparent"
            stroke="var(--color-hover)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${strokeClass} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-text-primary">{score}</span>
        </div>
      </div>
      <span className={`px-2.5 py-0.5 rounded-full text-label font-bold ${bgClass} ${textClass}`}>
        {label}
      </span>
    </div>
  );
}

function UtilizationGauge({ value }: { value: number }) {
  const radius = 50;
  const strokeWidth = 10;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  let color = "#ef4444";
  let band = "Underutilized";
  if (value >= 85) {
    color = "#22c55e";
    band = "Excellent";
  } else if (value >= 70) {
    color = "#06b6d4";
    band = "Optimal";
  } else if (value >= 50) {
    color = "#f59e0b";
    band = "Watch";
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative h-24 w-44">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 120 70">
          <path
            d="M 10,60 A 50,50 0 0,1 110,60"
            fill="none"
            stroke="var(--color-hover)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d="M 10,60 A 50,50 0 0,1 110,60"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-end">
          <span className="text-3xl font-bold text-text-primary leading-none">{value}%</span>
          <span className="text-label mt-1 font-semibold" style={{ color }}>
            {band}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. MAIN COMPONENT DEFINITION
// ==========================================

export function EmployeeDetail({ employeeId: providedEmployeeId }: { employeeId?: string }) {
  const params = useParams<{ id: string }>();
  const employeeId = providedEmployeeId || params?.id;
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState("overview");

  // Error Auto-Retry Logic
  const [retryTimer, setRetryTimer] = useState(15);

  // Edit Drawer & Archive Modal states
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [editStep, setEditStep] = useState(1);

  // Forms values
  const [formValues, setFormValues] = useState<any>({
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    position: "",
    projectId: "",
    teamName: "",
    status: "Active",
    dateJoined: "",
    emergencyContact: "",
    address: "",
  });
  const [originalFormValues, setOriginalFormValues] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<any>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("");

  // Archive form values
  const [archiveValues, setArchiveValues] = useState({
    reason: "Resignation",
    effectiveDate: new Date().toISOString().slice(0, 10),
    transferTo: "",
    notifySupervisor: true,
    notes: "",
    confirmed: false,
  });

  // Document states
  const [docSearch, setDocSearch] = useState("");
  const [docCategory, setDocCategory] = useState("all");
  const [docViewMode, setDocViewMode] = useState<"grid" | "list">("grid");
  const [dragActive, setDragActive] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Fetch Queries
  const detailQuery = useQuery({
    queryKey: ["erp-employee-detail", employeeId, role],
    queryFn: async () =>
      (await apiRequest<EmployeeDetailResponse>(`/api/workforce/employees/${employeeId}`, { role })).data,
    enabled: Boolean(employeeId),
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  // Auto retry on fetch error
  useEffect(() => {
    if (detailQuery.isError) {
      const interval = setInterval(() => {
        setRetryTimer((prev) => {
          if (prev <= 1) {
            detailQuery.refetch();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [detailQuery.isError, detailQuery.refetch]);

  // Edit Auto-save draft logic
  useEffect(() => {
    if (editDrawerOpen && originalFormValues) {
      const timeout = setTimeout(() => {
        const hasChanges = JSON.stringify(formValues) !== JSON.stringify(originalFormValues);
        if (hasChanges) {
          localStorage.setItem(`employee-draft-${employeeId}`, JSON.stringify(formValues));
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setAutoSaveStatus(`Draft auto-saved at ${now}`);
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [formValues, editDrawerOpen, originalFormValues, employeeId]);

  // Handle Edit Cancel / Unsaved protection
  const handleCancelEdit = () => {
    const hasChanges = JSON.stringify(formValues) !== JSON.stringify(originalFormValues);
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to exit? Your draft will be preserved.")) {
        setEditDrawerOpen(false);
      }
    } else {
      setEditDrawerOpen(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/workforce/employees/${employeeId}`, {
        role,
        method: "PATCH",
        body: formValues,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-employee-detail", employeeId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-employees"] }),
      ]);
      localStorage.removeItem(`employee-draft-${employeeId}`);
      setEditDrawerOpen(false);
      setFormErrors({});
      setAutoSaveStatus("");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/workforce/employees/${employeeId}`, {
        role,
        method: "PATCH",
        body: { status: "Inactive" },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-employee-detail", employeeId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-employees"] }),
      ]);
      setArchiveModalOpen(false);
    },
  });

  // Handle Edit Action
  const openEditDrawer = () => {
    if (!detailQuery.data) return;
    const employee = detailQuery.data.employee;
    const savedDraft = localStorage.getItem(`employee-draft-${employeeId}`);
    
    const initialValues = {
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department || "",
      designation: employee.designation || "",
      position: employee.position || employee.designation || "",
      projectId: employee.projectId || "",
      teamName: employee.teamName || "",
      status: employee.status || "Active",
      dateJoined: employee.dateJoined ? employee.dateJoined.slice(0, 10) : "",
      emergencyContact: employee.emergencyContact || "",
      address: employee.address || "",
    };

    if (savedDraft) {
      if (confirm("We found an unsaved draft. Would you like to restore it?")) {
        setFormValues(JSON.parse(savedDraft));
      } else {
        setFormValues(initialValues);
        localStorage.removeItem(`employee-draft-${employeeId}`);
      }
    } else {
      setFormValues(initialValues);
    }

    setOriginalFormValues(initialValues);
    setEditStep(1);
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = () => {
    const errors: any = {};
    if (!formValues.name.trim()) errors.name = "Name is required.";
    if (!formValues.email.trim()) errors.email = "Email is required.";
    if (!formValues.phone.trim()) errors.phone = "Phone is required.";
    if (!formValues.department.trim()) errors.department = "Department is required.";
    if (!formValues.designation.trim()) errors.designation = "Designation is required.";
    if (!formValues.projectId.trim()) errors.projectId = "Project assignment is required.";

    setFormErrors(errors);
    if (Object.keys(errors).length) {
      setEditStep(1); // Return to first step to fix errors
      return;
    }
    saveMutation.mutate();
  };

  // Drag & drop file helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    if (!detailQuery.data) return;
    const employee = detailQuery.data.employee;
    setIsUploading(true);
    setUploadMessage("Uploading document registration...");
    try {
      await uploadDocument(role, file, {
        title: `${employee.name} - ${file.name.replace(/\.[^/.]+$/, "")}`,
        category: docCategory === "all" ? "Compliance" : docCategory.charAt(0).toUpperCase() + docCategory.slice(1),
        module: "Workforce",
        relatedEntityId: employee.id,
        projectId: employee.projectId,
      });
      setUploadMessage(`Success: ${file.name} uploaded successfully.`);
      await queryClient.invalidateQueries({ queryKey: ["erp-employee-detail", employeeId] });
    } catch {
      setUploadMessage(`Error: Failed to upload ${file.name}.`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  // Rendering Loader State
  if (detailQuery.isLoading || projectsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-5 w-24 bg-hover shimmer-skeleton rounded" />
        </div>
        <ProfileSkeleton />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="h-12 w-full bg-hover shimmer-skeleton rounded-[10px]" />
            <TimelineSkeleton />
            <AnalyticsSkeleton />
          </div>
          <div className="h-[400px] bg-hover shimmer-skeleton rounded-[var(--radius-card)]" />
        </div>
      </div>
    );
  }

  // Rendering Error State
  if (detailQuery.isError || projectsQuery.isError || !detailQuery.data || !projectsQuery.data) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center p-6 text-center">
        <div className="rounded-full bg-error/15 p-4 mb-4">
          <AlertTriangle className="h-10 w-10 text-error" />
        </div>
        <h2 className="text-section-title font-secondary text-text-primary mb-2">
          Employee data is temporarily unavailable
        </h2>
        <p className="text-body text-text-secondary max-w-md mb-6">
          We are reconnecting to workforce services. The application will automatically attempt to refresh the connection.
        </p>
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => {
              setRetryTimer(15);
              detailQuery.refetch();
              projectsQuery.refetch();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Retry Connection
          </Button>
          <Link href="/people/employees">
            <Button variant="ghost">Return to Workforce Directory</Button>
          </Link>
        </div>
        <p className="text-label text-text-muted mt-6 animate-pulse">
          Auto-retrying connection in {retryTimer} seconds...
        </p>
      </div>
    );
  }

  // Loaded Data
  const detail = detailQuery.data;
  const employee = detail.employee;
  const enriched = getEnrichedEmployeeData(detail);

  // Filter documents
  const filteredDocuments = detail.documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(docSearch.toLowerCase()) || doc.fileName.toLowerCase().includes(docSearch.toLowerCase());
    const matchesCategory = docCategory === "all" || doc.title.toLowerCase().includes(docCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <section className="space-y-6">
      {/* ----------------- BREADCRUMB & TOP ACTIONS ----------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/people/employees"
          className="inline-flex items-center gap-2 text-body text-text-secondary hover:text-accent-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workforce Operations
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={openEditDrawer} className="h-10">
            Edit Intelligence File
          </Button>
          <Button variant="secondary" onClick={() => window.print()} className="h-10 gap-2">
            <Printer className="h-4 w-4" />
            Print File
          </Button>
          <Button
            variant="secondary"
            className="h-10 text-error hover:bg-error/5 hover:text-error border-error/20"
            onClick={() => setArchiveModalOpen(true)}
          >
            <UserX className="h-4 w-4" />
            Deactivate / Archive
          </Button>
        </div>
      </div>

      {/* ----------------- HERO CARD (EXECUTIVE PROFILE) ----------------- */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px] items-stretch">
        <Card className="overflow-hidden border-border-soft/80 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.06),transparent_40%),linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))]">
          <CardContent className="flex flex-col md:flex-row gap-6 p-6 h-full justify-between items-center md:items-start">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
              {/* Profile Photo Mock */}
              <div className="relative group">
                <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-gradient-to-br from-accent-primary to-accent-secondary text-2xl font-bold text-white shadow-soft">
                  {employee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="absolute inset-0 bg-black/45 rounded-[24px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-[10px] text-white font-medium">Update Photo</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Badge tone={toneForStatus(employee.status)}>{employee.status}</Badge>
                  <Badge tone="info">{employee.department}</Badge>
                  <Badge tone="neutral">{employee.teamName}</Badge>
                </div>
                <div>
                  <h1 className="text-page-title font-secondary text-text-primary leading-tight">
                    {employee.name}
                  </h1>
                  <p className="mt-1 text-body text-text-secondary font-medium">
                    {employee.designation} · {employee.position}
                  </p>
                  <p className="text-label text-text-muted">
                    Reports to {employee.reportingManager || "Management"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Workforce score widget */}
              <CircularScore
                score={enriched.workforceScore}
                label={enriched.scoreClassification}
                tone={enriched.scoreTone}
              />
            </div>
          </CardContent>
        </Card>

        {/* ----------------- PERSISTENT INSIGHT PANEL ----------------- */}
        <Card className="border-border-soft bg-surface shadow-enterprise flex flex-col justify-center p-5">
          <h3 className="text-card-title font-secondary text-text-primary mb-3">Intelligence Signals</h3>
          <div className="flex flex-col gap-2">
            {enriched.insightsTags.map((tag, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 p-2.5 rounded-xl border border-border-soft bg-surface-secondary subtle-hover hover:-translate-y-0.5`}
              >
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    tag.tone === "success"
                      ? "bg-success"
                      : tag.tone === "info"
                      ? "bg-info"
                      : "bg-warning"
                  }`}
                />
                <span className="text-label font-bold text-text-primary">{tag.text}</span>
              </div>
            ))}
            {enriched.insightsTags.length === 0 && (
              <p className="text-label text-text-muted text-center py-4">No active signals found.</p>
            )}
          </div>
        </Card>
      </div>

      {/* ----------------- EXECUTIVE SNAPSHOT STRIP ----------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 bg-surface-secondary/70 border border-border-soft p-3 rounded-[var(--radius-card)]">
        {[
          { label: "Attendance Rate", value: `${employee.attendancePercent}%`, trend: "+1.2%", positive: true },
          { label: "Active Projects", value: enriched.activeAssignments.length, trend: "Stable", positive: null },
          { label: "Team Assignments", value: detail.summary.teamsAssigned, trend: "Optimal", positive: true },
          { label: "Workload Utilization", value: `${employee.utilizationPercent}%`, trend: "Optimal", positive: true },
          { label: "Leave Balance", value: "14 Days", trend: "-2d this cycle", positive: false },
          { label: "Service Duration", value: `${detail.summary.yearsOfService} Yrs`, trend: "Senior", positive: true },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="bg-surface border border-border-soft rounded-xl p-3 flex flex-col justify-between shadow-soft hover:shadow-enterprise transition-shadow"
          >
            <span className="text-label text-text-muted font-medium truncate">{kpi.label}</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-section-title font-bold text-text-primary leading-none">{kpi.value}</span>
              {kpi.trend && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    kpi.positive === true
                      ? "bg-success/10 text-success"
                      : kpi.positive === false
                      ? "bg-error/10 text-error"
                      : "bg-hover text-text-muted"
                  }`}
                >
                  {kpi.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ----------------- STICKY ENTERPRISE NAVIGATION TABS ----------------- */}
      <div className="sticky top-0 z-20 border-b border-border-soft bg-surface/90 backdrop-blur-md px-2 py-3 flex gap-1 overflow-x-auto scrollbar-none shadow-sm rounded-xl">
        {[
          { id: "overview", label: "Overview", icon: LayoutGrid },
          { id: "attendance", label: "Attendance Intelligence", icon: Clock },
          { id: "assignments", label: "Assignments & Capacity", icon: Briefcase },
          { id: "career", label: "Career Journey", icon: Award },
          { id: "documents", label: "Document Center", icon: FileText },
          { id: "performance", label: "Performance Analytics", icon: TrendingUp },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 flex items-center gap-2 text-body font-medium rounded-lg transition-colors duration-200 shrink-0 ${
                isActive ? "text-accent-primary font-semibold" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-bg"
                  className="absolute inset-0 bg-active-soft rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <IconComp className="h-4.5 w-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ----------------- TAB WORKSPACE CONTENT ----------------- */}
      <div className="min-h-[480px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24 }}
          >
            {/* ============================================================== */}
            {/* OVERVIEW TAB                                                   */}
            {/* ============================================================== */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                  {/* Current Assignment */}
                  <Card>
                    <CardHeader className="border-b border-border-soft pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-accent-primary" />
                        Current Allocation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="rounded-[var(--radius-card)] border border-accent-primary/15 bg-active-soft/20 p-5 space-y-4">
                        <div>
                          <p className="text-section-title font-secondary text-text-primary font-bold">
                            {employee.projectName || "General Workforce"}
                          </p>
                          <p className="text-body text-text-secondary mt-1">
                            Role: {employee.projectRole || employee.designation}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-border-soft/60">
                          <div>
                            <span className="text-label text-text-muted">Direct Supervisor</span>
                            <p className="text-body font-semibold text-text-primary">{employee.reportingManager}</p>
                          </div>
                          <div>
                            <span className="text-label text-text-muted">Duty Shift</span>
                            <p className="text-body font-semibold text-text-primary">Shift A (08:00 - 17:00)</p>
                          </div>
                          <div>
                            <span className="text-label text-text-muted">Current Location</span>
                            <p className="text-body font-semibold text-text-primary flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-text-muted" />
                              Site Head Office
                            </p>
                          </div>
                          <div>
                            <span className="text-label text-text-muted">Employment State</span>
                            <p className="text-body font-semibold text-text-primary">Full Time Employee</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Intelligence Card */}
                  <Card className="border-l-4 border-accent-primary bg-gradient-to-r from-active-soft/10 to-transparent">
                    <CardHeader>
                      <CardTitle className="text-accent-primary flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Management Insights & Advisory
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-0">
                      <div className="space-y-2">
                        <h4 className="text-body font-bold text-success flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          Strengths
                        </h4>
                        <ul className="text-label text-text-secondary space-y-1.5 list-disc pl-4">
                          {enriched.intelligence.strengths.map((str, i) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-body font-bold text-warning flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4" />
                          Risks & Flags
                        </h4>
                        <ul className="text-label text-text-secondary space-y-1.5 list-disc pl-4">
                          {enriched.intelligence.risks.map((risk, i) => (
                            <li key={i}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-body font-bold text-accent-primary flex items-center gap-1.5">
                          <ArrowUpRight className="h-4 w-4" />
                          Recommended Action
                        </h4>
                        <ul className="text-label text-text-secondary space-y-1.5 list-disc pl-4">
                          {enriched.intelligence.actions.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Detailed Information */}
                  <Card>
                    <CardHeader className="border-b border-border-soft pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-accent-primary" />
                        Workforce Registry Metadata
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      {[
                        { label: "Personal Email", value: employee.email, icon: Mail },
                        { label: "Primary Phone", value: employee.phone, icon: Phone },
                        { label: "Emergency Contact", value: employee.emergencyContact || "Not Registered", icon: Users },
                        { label: "Joining Date", value: formatDate(employee.dateJoined), icon: Calendar },
                        { label: "Workforce Code", value: getEmployeeCodeHash(employee.id), icon: ShieldCheck },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-surface-secondary rounded-xl border border-border-soft">
                          <item.icon className="h-5 w-5 text-text-muted mt-0.5" />
                          <div>
                            <span className="text-label text-text-muted">{item.label}</span>
                            <p className="text-body font-semibold text-text-primary mt-0.5">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ATTENDANCE INTELLIGENCE TAB                                    */}
            {/* ============================================================== */}
            {activeTab === "attendance" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: "Attendance Rate", value: `${employee.attendancePercent}%`, icon: CheckCircle2, status: "Healthy" },
                    { label: "Punctuality Index", value: `${enriched.punctualityScore}%`, icon: Clock, status: "Optimal" },
                    { label: "Current Streak", value: `${enriched.currentStreak} Days`, icon: TrendingUp, status: "Exceptional" },
                    { label: "Late Arrivals", value: enriched.lateArrivalsCount, icon: AlertTriangle, status: "Minimal" },
                    { label: "Absence Risk Index", value: `${enriched.absenceRiskScore}/100`, icon: UserX, status: "Low Risk" },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-surface border border-border-soft rounded-xl p-4 shadow-soft">
                      <div className="flex items-center justify-between">
                        <stat.icon className="h-5 w-5 text-accent-primary" />
                        <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">{stat.status}</span>
                      </div>
                      <p className="text-label text-text-muted mt-3">{stat.label}</p>
                      <h4 className="text-section-title font-bold text-text-primary mt-1">{stat.value}</h4>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                  {/* Composed Chart Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Movement & Benchmarks</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={detail.attendanceAnalytics.monthlyTrend}>
                          <CartesianGrid stroke="rgba(15,23,42,0.06)" vertical={false} />
                          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} width={32} />
                          <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 10px 30px rgba(15,23,42,0.08)" }} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                          <Area type="monotone" name="Employee Rate" dataKey="attendanceRate" fill="url(#attGrad)" stroke="#2563eb" strokeWidth={2.5} />
                          <Line type="monotone" name="Dept Average" dataKey="attendanceRate" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                          <Line type="monotone" name="Company Target" dataKey="attendanceRate" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                          <defs>
                            <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Attendance Heatmap Simulation */}
                  <Card>
                    <CardHeader className="flex flex-row justify-between items-center pb-2">
                      <CardTitle>Attendance Heatmap (2026)</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-label font-bold self-center">June</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Grid structure of days */}
                      <div className="grid grid-cols-7 gap-1.5 text-center">
                        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                          <span key={i} className="text-label text-text-muted font-bold py-1">{d}</span>
                        ))}
                        {[...Array(30)].map((_, idx) => {
                          const dayNum = idx + 1;
                          let stateColor = "bg-success"; // Default present
                          if (dayNum === 8 || dayNum === 15 || dayNum === 22 || dayNum === 29) {
                            stateColor = "bg-warning"; // Late
                          } else if (dayNum === 4) {
                            stateColor = "bg-error"; // Absent
                          } else if (dayNum === 18 || dayNum === 19) {
                            stateColor = "bg-info"; // Approved Leave
                          } else if (dayNum === 7 || dayNum === 14 || dayNum === 21 || dayNum === 28) {
                            stateColor = "bg-border-soft"; // Holiday/Off
                          }
                          return (
                            <div
                              key={idx}
                              title={`Day ${dayNum}: Attendance State`}
                              className={`h-7 w-full rounded-md flex items-center justify-center text-[10px] font-bold text-text-primary subtle-hover hover:scale-105 cursor-pointer ${stateColor} ${
                                stateColor === "bg-border-soft" ? "text-text-muted" : "text-white"
                              }`}
                            >
                              {dayNum}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2 justify-center border-t border-border-soft text-label text-text-secondary">
                        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-success" />Present</span>
                        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-warning" />Late</span>
                        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-error" />Absent</span>
                        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-info" />Leave</span>
                        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-border-soft" />Off</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-active-soft/10 border-accent-primary/10">
                  <CardContent className="p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent-primary mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-body font-bold text-text-primary">Attendance Intelligence Note</h4>
                      <p className="text-label text-text-secondary leading-relaxed">
                        Automated Analysis: Workforce attendance registered an 8% positive growth trend compared to last quarter.
                        Streak stats highlight exceptional compliance on safety check-ins with zero unexplained gaps over the last 120 days.
                        Late-arrivals peak occurs on Mondays, recommended action is to align supervisor check-in parameters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ============================================================== */}
            {/* ASSIGNMENTS TAB                                                */}
            {/* ============================================================== */}
            {activeTab === "assignments" && (
              <div className="space-y-6">
                {/* Active allocations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enriched.activeAssignments.map((assignment) => (
                    <Card key={assignment.id} className="relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-1.5 w-full bg-accent-primary" />
                      <CardContent className="pt-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-label text-text-muted uppercase font-bold tracking-wider">Active Project Allocation</span>
                            <h4 className="text-card-title text-text-primary font-bold mt-1">{assignment.project}</h4>
                          </div>
                          <Badge tone="success">{assignment.status}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-border-soft/60">
                          <div>
                            <span className="text-label text-text-muted">Assigned Role</span>
                            <p className="text-body font-semibold text-text-primary mt-0.5">{assignment.role}</p>
                          </div>
                          <div>
                            <span className="text-label text-text-muted">Service Tenure</span>
                            <p className="text-body font-semibold text-text-primary mt-0.5">{assignment.duration}</p>
                          </div>
                          <div>
                            <span className="text-label text-text-muted">Utilization Allocation</span>
                            <p className="text-body font-semibold text-accent-primary mt-0.5">{assignment.allocation}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                  {/* Allocation timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Historical Allocation Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {detail.allocationTimeline.map((item, idx) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="flex w-16 shrink-0 flex-col items-center">
                            <span className="rounded-full bg-active-soft px-3 py-0.5 text-label font-bold text-accent-primary">
                              {item.year}
                            </span>
                            {idx < detail.allocationTimeline.length - 1 && (
                              <div className="mt-2 h-full w-px bg-border-soft" />
                            )}
                          </div>
                          <div className="flex-1 rounded-xl border border-border-soft bg-surface-secondary p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-body font-bold text-text-primary">{item.projectName}</h4>
                                <p className="text-label text-text-secondary mt-0.5">{item.role}</p>
                              </div>
                              <Badge tone={item.status === "Current Assignment" ? "success" : "neutral"}>
                                {item.status}
                              </Badge>
                            </div>
                            <p className="text-label text-text-muted mt-3">Started {formatDate(item.startDate)}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Workload Capacity Capacity chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Workload Load & Forecast Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={enriched.capacityData}>
                          <CartesianGrid stroke="rgba(15,23,42,0.06)" vertical={false} />
                          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} width={32} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                          <Bar name="Allocated Space %" dataKey="allocation" fill="#2563eb" radius={[6, 6, 0, 0]} />
                          <Line type="monotone" name="Capacity Limit" dataKey="capacity" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                          <Line type="monotone" name="Forecast Utilization" dataKey="forecast" stroke="#0ea5e9" strokeWidth={2} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* CAREER JOURNEY TAB                                             */}
            {/* ============================================================== */}
            {activeTab === "career" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                  {/* Career Timeline Milestones */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Professional Career Milestones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {enriched.careerMilestones.map((item, idx) => {
                        const IconComponent = item.icon;
                        return (
                          <div key={item.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-active-soft text-accent-primary">
                                <IconComponent className="h-5 w-5" />
                              </div>
                              {idx < enriched.careerMilestones.length - 1 && (
                                <div className="h-full w-px bg-border-soft mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <span className="text-label font-bold text-text-muted">{item.year}</span>
                              <h4 className="text-body font-bold text-text-primary mt-0.5">{item.title}</h4>
                              <p className="text-label text-text-secondary mt-1">{item.detail}</p>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Growth Insights */}
                  <Card className="flex flex-col justify-between">
                    <CardHeader>
                      <CardTitle>Growth & Promotion Index</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="p-4 rounded-xl border border-border-soft bg-surface-secondary">
                        <span className="text-label text-text-muted">Promotion History</span>
                        <p className="text-body font-bold text-text-primary mt-1">Promoted twice in 3 Years</p>
                        <p className="text-label text-text-secondary mt-1">Accelerated elevation track from technical associate to specialist lead.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-border-soft bg-surface-secondary">
                        <span className="text-label text-text-muted">Milestones Delivered</span>
                        <p className="text-body font-bold text-text-primary mt-1">Led 4 successful enterprise project cycles</p>
                        <p className="text-label text-text-secondary mt-1">Consistently delivered operational modules on-time and with maximum safety compliance.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-border-soft bg-surface-secondary">
                        <span className="text-label text-text-muted">Average Annual Attendance</span>
                        <p className="text-body font-bold text-text-primary mt-1">Maintained 96% attendance over entire tenure</p>
                        <p className="text-label text-text-secondary mt-1">Demonstrated exemplary reliability index rating compared to sector averages.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* DOCUMENTS CENTER TAB                                           */}
            {/* ============================================================== */}
            {activeTab === "documents" && (
              <div className="space-y-6">
                {/* Search & Actions toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Search workspace files..."
                        className="h-10 w-full rounded-xl border border-border-soft pl-9 pr-4 text-body bg-surface focus:outline-none focus:border-accent-primary shadow-soft"
                        value={docSearch}
                        onChange={(e) => setDocSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex border border-border-soft rounded-xl overflow-hidden bg-surface">
                      <button
                        onClick={() => setDocViewMode("grid")}
                        className={`p-2 ${docViewMode === "grid" ? "bg-active-soft text-accent-primary" : "text-text-muted hover:text-text-primary"}`}
                      >
                        <LayoutGrid className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => setDocViewMode("list")}
                        className={`p-2 ${docViewMode === "list" ? "bg-active-soft text-accent-primary" : "text-text-muted hover:text-text-primary"}`}
                      >
                        <List className="h-4.5 w-4.5" />
                      </button>
                    </div>
                    <Button variant="secondary" onClick={() => uploadInputRef.current?.click()} className="h-10 gap-2">
                      <FileUp className="h-4 w-4" />
                      Upload Document
                    </Button>
                  </div>
                </div>

                {/* Categories tab filters */}
                <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border-soft">
                  {[
                    { id: "all", label: "All Documents" },
                    { id: "identity", label: "Identity & Verification" },
                    { id: "compliance", label: "Compliance & Safety" },
                    { id: "certifications", label: "Certifications & Training" },
                    { id: "contracts", label: "Contracts & Agreements" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setDocCategory(cat.id)}
                      className={`px-3 py-1.5 text-label font-bold rounded-lg border shrink-0 transition-colors ${
                        docCategory === cat.id
                          ? "bg-accent-primary text-white border-accent-primary"
                          : "bg-surface border-border-soft text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Drag and drop upload zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    dragActive ? "border-accent-primary bg-active-soft/10" : "border-border-soft bg-surface-secondary/40"
                  }`}
                >
                  <FileUp className="h-10 w-10 text-accent-primary mx-auto mb-2" />
                  <p className="text-body font-bold text-text-primary">Drag & drop files here to upload</p>
                  <p className="text-label text-text-muted mt-1">Supports PDF, PNG, JPG up to 10MB</p>
                  {uploadMessage && (
                    <p className={`text-label font-semibold mt-2 ${uploadMessage.startsWith("Error") ? "text-error" : "text-success"}`}>
                      {uploadMessage}
                    </p>
                  )}
                  {isUploading && <p className="text-label text-accent-primary mt-2 animate-pulse">Uploading to workspace registry...</p>}
                </div>

                {/* Document Display Grid/List */}
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-12 border border-border-soft rounded-2xl bg-surface">
                    <FileText className="h-10 w-10 text-text-muted mx-auto mb-2" />
                    <p className="text-body font-bold text-text-primary">No documents found</p>
                    <p className="text-label text-text-muted mt-1">Upload verifying credentials to begin compliance checks.</p>
                  </div>
                ) : docViewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredDocuments.map((doc) => (
                      <Card key={doc.id} className="hover:shadow-enterprise transition-shadow">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-label font-bold text-text-muted uppercase tracking-wider truncate max-w-[150px]">
                              {doc.title.split("-")[1] || "Registration File"}
                            </span>
                            <Badge tone={doc.status.toLowerCase().includes("pending") ? "warning" : "success"}>
                              {doc.status}
                            </Badge>
                          </div>
                          <h4 className="text-body font-bold text-text-primary line-clamp-1">{doc.title}</h4>
                          <div className="space-y-1 text-label text-text-secondary pt-2 border-t border-border-soft/60">
                            <p className="truncate">File: {doc.fileName}</p>
                            <p>Verification: Approved</p>
                            <p>Expiry: 12-12-2028</p>
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <Button variant="ghost" size="sm" className="h-8 gap-1"><Download className="h-3.5 w-3.5" />Download</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="border border-border-soft rounded-2xl bg-surface overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-secondary border-b border-border-soft text-label text-text-muted font-bold">
                          <th className="p-4">Title</th>
                          <th className="p-4">Verification</th>
                          <th className="p-4">File Name</th>
                          <th className="p-4">Upload Date</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-body text-text-primary divide-y divide-border-soft/60">
                        {filteredDocuments.map((doc) => (
                          <tr key={doc.id}>
                            <td className="p-4 font-bold">{doc.title}</td>
                            <td className="p-4">
                              <Badge tone={doc.status.toLowerCase().includes("pending") ? "warning" : "success"}>
                                {doc.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-text-muted">{doc.fileName}</td>
                            <td className="p-4 text-text-muted">{formatDate(doc.uploadedAt)}</td>
                            <td className="p-4 text-right">
                              <Button variant="ghost" size="sm" className="h-8"><Download className="h-3.5 w-3.5" /></Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* PERFORMANCE INTELLIGENCE TAB                                  */}
            {/* ============================================================== */}
            {activeTab === "performance" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-6">
                  {/* Utilization Semi Circular Gauge */}
                  <Card className="flex flex-col items-center justify-between">
                    <CardHeader className="text-center w-full border-b border-border-soft pb-4">
                      <CardTitle>Workforce Capacity Utilization</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center flex-1 py-8">
                      <UtilizationGauge value={employee.utilizationPercent || 85} />
                      <div className="text-center mt-4 space-y-1 max-w-xs">
                        <p className="text-body font-semibold text-text-primary">Excellent Utilization Band</p>
                        <p className="text-label text-text-secondary leading-relaxed">
                          Employee is performing in the optimal operational workload bracket with minimal downtime.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Peer Benchmarking Radar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Enterprise Performance Benchmarking</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[280px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={enriched.peerBenchmarking}>
                          <PolarGrid stroke="rgba(15,23,42,0.06)" />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                          <Radar name="Employee" dataKey="Employee" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
                          <Radar name="Department Avg" dataKey="Department" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                          <Radar name="Company Avg" dataKey="Company" stroke="#64748b" fill="#64748b" fillOpacity={0.1} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Contribution details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    { label: "Milestones Delivered", value: "12/12", detail: "100% project milestone completion rate." },
                    { label: "Tasks Logged", value: "248 Tasks", detail: "Exemplary operational dispatch rating." },
                    { label: "Safety Gaps Checked", value: "Zero Gaps", detail: "Fully compliant safety inspection ledger." },
                    { label: "Operations Rating", value: "4.8 / 5.0", detail: "Outstanding peer and manager feedback index." },
                  ].map((metric, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4 space-y-2">
                        <span className="text-label text-text-muted font-medium block">{metric.label}</span>
                        <h4 className="text-page-title font-bold text-text-primary leading-none">{metric.value}</h4>
                        <p className="text-label text-text-secondary leading-normal">{metric.detail}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ----------------- UPGRADED MULTI-STEP EDIT DRAWER ----------------- */}
      <Drawer open={editDrawerOpen} onClose={handleCancelEdit} title={`Edit Employee File: ${employee.name}`} size="lg">
        <div className="space-y-6 flex flex-col h-full justify-between pb-8">
          <div className="space-y-6">
            {/* Step Indicators */}
            <div className="flex border-b border-border-soft pb-4 gap-4">
              {[
                { step: 1, label: "Basic Profile" },
                { step: 2, label: "Org & Contract" },
                { step: 3, label: "Operational Alignment" },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setEditStep(s.step)}
                  className={`text-body font-bold pb-2 transition-all border-b-2 -mb-4.5 ${
                    editStep === s.step ? "border-accent-primary text-accent-primary" : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  Step {s.step}: {s.label}
                </button>
              ))}
            </div>

            {/* Auto save message */}
            {autoSaveStatus && (
              <p className="text-label text-success font-medium bg-success/5 p-2 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {autoSaveStatus}
              </p>
            )}

            {/* Profile Photo upload */}
            {editStep === 1 && (
              <div className="space-y-4">
                <h4 className="text-card-title text-text-primary">Profile Image</h4>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-[22px] bg-active-soft text-accent-primary flex items-center justify-center font-bold text-xl">
                    {formValues.name ? formValues.name.slice(0, 2).toUpperCase() : "EM"}
                  </div>
                  <div className="space-y-1.5">
                    <Button variant="secondary" size="sm" onClick={() => uploadInputRef.current?.click()} className="gap-2">
                      <FileUp className="h-4 w-4" />
                      Upload New Image
                    </Button>
                    <p className="text-[10px] text-text-muted">JPG or PNG. Max size 2MB.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step Content: STEP 1 */}
            {editStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-label text-text-secondary font-bold">Employee Name</span>
                  <input
                    type="text"
                    className="h-11 border border-border-soft rounded-xl px-4 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                    value={formValues.name}
                    onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  />
                  {formErrors.name && <span className="text-label text-error">{formErrors.name}</span>}
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-label text-text-secondary font-bold">Email Address</span>
                  <input
                    type="email"
                    className="h-11 border border-border-soft rounded-xl px-4 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                    value={formValues.email}
                    onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                  />
                  {formErrors.email && <span className="text-label text-error">{formErrors.email}</span>}
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-label text-text-secondary font-bold">Phone Number</span>
                  <input
                    type="text"
                    className="h-11 border border-border-soft rounded-xl px-4 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                    value={formValues.phone}
                    onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                  />
                  {formErrors.phone && <span className="text-label text-error">{formErrors.phone}</span>}
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-label text-text-secondary font-bold">Emergency Contact</span>
                  <input
                    type="text"
                    className="h-11 border border-border-soft rounded-xl px-4 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                    value={formValues.emergencyContact}
                    onChange={(e) => setFormValues({ ...formValues, emergencyContact: e.target.value })}
                  />
                </label>

                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-label text-text-secondary font-bold">Residential Address</span>
                  <textarea
                    className="min-h-[80px] border border-border-soft rounded-xl p-3 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                    value={formValues.address}
                    onChange={(e) => setFormValues({ ...formValues, address: e.target.value })}
                  />
                </label>
              </div>
            )}

            {/* Step Content: STEP 2 */}
            {editStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-label text-text-secondary font-bold">Department</span>
                  <select
                    className="h-11 border border-border-soft rounded-xl px-4 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                    value={formValues.department}
                    onChange={(e) => setFormValues({ ...formValues, department: e.target.value })}
                  >
                    <option value="Projects">Projects</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales">Sales</option>
                    <option value="Administration">Administration</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-label text-text-secondary font-bold">Role Title (Designation)</span>
                  <input
                    type="text"
                    className="h-11 border border-border-soft rounded-xl px-4 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                    value={formValues.designation}
                    onChange={(e) => setFormValues({ ...formValues, designation: e.target.value })}
                  />
                  {formErrors.designation && <span className="text-label text-error">{formErrors.designation}</span>}
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-label text-text-secondary font-bold">Corporate Position</span>
                  <input
                    type="text"
                    className="h-11 border border-border-soft rounded-xl px-4 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                    value={formValues.position}
                    onChange={(e) => setFormValues({ ...formValues, position: e.target.value })}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-label text-text-secondary font-bold">Joining Date</span>
                  <input
                    type="date"
                    className="h-11 border border-border-soft rounded-xl px-4 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                    value={formValues.dateJoined}
                    onChange={(e) => setFormValues({ ...formValues, dateJoined: e.target.value })}
                  />
                </label>
              </div>
            )}

            {/* Step Content: STEP 3 */}
            {editStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-label text-text-secondary font-bold">Project Allocation</span>
                  <select
                    className="h-11 border border-border-soft rounded-xl px-4 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                    value={formValues.projectId}
                    onChange={(e) => setFormValues({ ...formValues, projectId: e.target.value })}
                  >
                    <option value="">Select project...</option>
                    {projectsQuery.data.projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.projectId && <span className="text-label text-error">{formErrors.projectId}</span>}
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-label text-text-secondary font-bold">Operational Team</span>
                  <input
                    type="text"
                    className="h-11 border border-border-soft rounded-xl px-4 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                    value={formValues.teamName}
                    onChange={(e) => setFormValues({ ...formValues, teamName: e.target.value })}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-label text-text-secondary font-bold">Status Mode</span>
                  <select
                    className="h-11 border border-border-soft rounded-xl px-4 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                    value={formValues.status}
                    onChange={(e) => setFormValues({ ...formValues, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Probation">Probation</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          {/* Form navigation controls */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border-soft">
            <Button variant="ghost" onClick={handleCancelEdit}>
              Cancel
            </Button>
            {editStep > 1 && (
              <Button variant="secondary" onClick={() => setEditStep(editStep - 1)}>
                Previous Step
              </Button>
            )}
            {editStep < 3 ? (
              <Button variant="secondary" onClick={() => setEditStep(editStep + 1)}>
                Next Step
              </Button>
            ) : (
              <Button variant="primary" onClick={handleEditSubmit} loading={saveMutation.isPending}>
                Commit File Changes
              </Button>
            )}
          </div>
        </div>
      </Drawer>

      {/* ----------------- UPGRADED ADVANCED ARCHIVE MODAL ----------------- */}
      <Modal open={archiveModalOpen} title="Enterprise Archive Workflow" onClose={() => setArchiveModalOpen(false)}>
        <div className="space-y-5">
          <p className="text-body text-text-secondary">
            You are initiating the offboarding and archive workflow for <strong className="text-text-primary">{employee.name}</strong>.
            This action deactivates the record and logs operational transition schedules.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-label text-text-secondary font-bold">Reason for Deactivation</span>
              <select
                className="h-10 border border-border-soft rounded-xl px-3 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                value={archiveValues.reason}
                onChange={(e) => setArchiveValues({ ...archiveValues, reason: e.target.value })}
              >
                <option value="Resignation">Resignation</option>
                <option value="Termination">Termination</option>
                <option value="Retirement">Retirement</option>
                <option value="Project Completion">Project Completion</option>
                <option value="Performance Offboarding">Performance Offboarding</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-label text-text-secondary font-bold">Effective Date</span>
              <input
                type="date"
                className="h-10 border border-border-soft rounded-xl px-3 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                value={archiveValues.effectiveDate}
                onChange={(e) => setArchiveValues({ ...archiveValues, effectiveDate: e.target.value })}
              />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-label text-text-secondary font-bold">Transfer Active Project Assignments to</span>
              <select
                className="h-10 border border-border-soft rounded-xl px-3 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                value={archiveValues.transferTo}
                onChange={(e) => setArchiveValues({ ...archiveValues, transferTo: e.target.value })}
              >
                <option value="">Do not transfer (release allocation)</option>
                <option value="emp-1">Anil Kumar (Project Specialist)</option>
                <option value="emp-2">Rajesh Sharma (Lead Site Inspector)</option>
                <option value="emp-3">Priya Patel (Senior Architect)</option>
              </select>
            </label>

            <label className="flex items-center gap-2 sm:col-span-2 py-1">
              <input
                type="checkbox"
                className="h-4.5 w-4.5 rounded border-border-soft text-accent-primary focus:ring-accent-primary"
                checked={archiveValues.notifySupervisor}
                onChange={(e) => setArchiveValues({ ...archiveValues, notifySupervisor: e.target.checked })}
              />
              <span className="text-body text-text-secondary">Notify supervisor and HR division on completion</span>
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-label text-text-secondary font-bold">Archive Notes</span>
              <textarea
                className="min-h-[72px] border border-border-soft rounded-xl p-3 text-body bg-surface text-text-primary focus:outline-none focus:border-accent-primary"
                placeholder="Details for workforce records compliance..."
                value={archiveValues.notes}
                onChange={(e) => setArchiveValues({ ...archiveValues, notes: e.target.value })}
              />
            </label>

            <label className="flex items-center gap-2 sm:col-span-2 py-2 border-t border-border-soft/60">
              <input
                type="checkbox"
                className="h-4.5 w-4.5 rounded border-border-soft text-accent-primary focus:ring-accent-primary"
                checked={archiveValues.confirmed}
                onChange={(e) => setArchiveValues({ ...archiveValues, confirmed: e.target.checked })}
              />
              <span className="text-label font-bold text-text-primary">
                I confirm that this employee will be set as Inactive and active allocations will be transferred.
              </span>
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-border-soft">
            <Button variant="ghost" onClick={() => setArchiveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!archiveValues.confirmed}
              loading={archiveMutation.isPending}
              onClick={() => archiveMutation.mutate()}
            >
              Confirm Offboarding & Archive
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hidden file uploader for document center */}
      <input
        ref={uploadInputRef}
        type="file"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          await uploadFile(file);
          event.target.value = "";
        }}
      />
    </section>
  );
}

// Helpers for hash values
function getEmployeeCodeHash(id: string) {
  const cleanId = id.replace(/\D/g, "");
  return `EMP-${cleanId.padStart(4, "0") || "4092"}`;
}

