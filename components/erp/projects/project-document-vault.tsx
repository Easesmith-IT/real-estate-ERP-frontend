"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Activity,
  Archive,
  ArrowUpRight,
  BarChart3,
  Building2,
  Camera,
  ChevronRight,
  ClipboardList,
  Download,
  FileArchive,
  FileSpreadsheet,
  FolderOpen,
  Layers3,
  ReceiptText,
  RotateCcw,
  ScanSearch,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ScrollText,
  Upload,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeader, TableEmptyStateRow, TableToolbar } from "@/components/erp/page-primitives";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/erp-api";
import type {
  ComplianceItem,
  ComplianceResponse,
  DocumentRecord,
  DocumentRegisterResponse,
  PropertySummaryResponse,
  UserDirectoryResponse,
} from "@/lib/erp-types";
import { formatDateTime } from "@/lib/erp-utils";
import { useUiStore } from "@/store/ui-store";
import { ProjectDocumentUploadDrawer } from "./project-document-upload-drawer";

const chartColors = ["#2563eb", "#0f766e", "#f59e0b", "#7c3aed", "#dc2626", "#16a34a", "#475569", "#ea580c"];

const selectClassName =
  "h-11 min-w-[160px] rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all";

const categoryDefinitions = [
  { key: "All", label: "All", icon: Layers3 },
  { key: "Drawings", label: "Drawings", icon: ScrollText },
  { key: "Contracts", label: "Contracts", icon: FileArchive },
  { key: "Permits", label: "Permits", icon: ShieldCheck },
  { key: "Reports", label: "Reports", icon: ClipboardList },
  { key: "Material Tests", label: "Material Tests", icon: FileSpreadsheet },
  { key: "Invoices", label: "Invoices", icon: ReceiptText },
  { key: "Photos", label: "Photos", icon: Camera },
  { key: "Other", label: "Other", icon: FolderOpen },
] as const;

type CategoryKey = (typeof categoryDefinitions)[number]["key"];
type Tone = "success" | "warning" | "error" | "info" | "neutral";

type EnrichedDocument = DocumentRecord & {
  normalizedCategory: Exclude<CategoryKey, "All">;
  normalizedStatus: "Approved" | "Pending" | "Expired" | "Rejected";
  projectLabel: string;
  sizeLabel: string;
  icon: typeof ScrollText;
  summary: string;
};

function normalizeCategory(category: string | null | undefined): Exclude<CategoryKey, "All"> {
  const normalized = (category || "").toLowerCase();

  if (normalized.includes("drawing") || normalized.includes("plan") || normalized.includes("layout")) return "Drawings";
  if (normalized.includes("contract") || normalized.includes("agreement")) return "Contracts";
  if (normalized.includes("permit") || normalized.includes("approval") || normalized.includes("noc") || normalized.includes("compliance")) return "Permits";
  if (normalized.includes("report") || normalized.includes("inspection")) return "Reports";
  if (normalized.includes("test") || normalized.includes("material") || normalized.includes("qa")) return "Material Tests";
  if (normalized.includes("invoice") || normalized.includes("receipt") || normalized.includes("bill")) return "Invoices";
  if (normalized.includes("photo") || normalized.includes("image")) return "Photos";
  return "Other";
}

function getCategoryIcon(category: Exclude<CategoryKey, "All">) {
  return categoryDefinitions.find((item) => item.key === category)?.icon || FolderOpen;
}

function formatFileSize(bytes?: number | null) {
  if (!bytes || Number.isNaN(bytes)) return "Record only";
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getDocumentStatus(document: DocumentRecord, nowTs: number): "Approved" | "Pending" | "Expired" | "Rejected" {
  const status = document.status.toLowerCase();

  if (document.expiryDate && new Date(document.expiryDate).getTime() < nowTs) return "Expired";
  if (status.includes("reject") || status.includes("cancel")) return "Rejected";
  if (status.includes("approve") || status.includes("active") || status.includes("generate")) return "Approved";
  return "Pending";
}

function getStatusTone(status: string): "success" | "warning" | "error" | "info" | "neutral" {
  const normalized = status.toLowerCase();
  if (normalized.includes("ready") || normalized.includes("healthy") || normalized.includes("approved")) return "success";
  if (normalized.includes("critical") || normalized.includes("high") || normalized.includes("expired") || normalized.includes("rejected")) return "error";
  if (normalized.includes("pending") || normalized.includes("attention") || normalized.includes("expiring")) return "warning";
  if (normalized.includes("review") || normalized.includes("watch") || normalized.includes("info")) return "info";
  return "neutral";
}

function getRiskLabel(score: number) {
  if (score >= 7) return "Critical";
  if (score >= 5) return "High";
  if (score >= 3) return "Watch";
  return "Low";
}

function getComplianceBucket(item: ComplianceItem, nowTs: number): "Approved" | "Pending" | "Expiring" | "Expired" {
  const status = item.status.toLowerCase();
  const expiry = new Date(item.expiryDate).getTime();
  const inThirtyDays = nowTs + 1000 * 60 * 60 * 24 * 30;

  if (!Number.isNaN(expiry) && expiry < nowTs) return "Expired";
  if (status.includes("review")) return "Pending";
  if (status.includes("expiring") || (!Number.isNaN(expiry) && expiry <= inThirtyDays)) return "Expiring";
  return "Approved";
}

function formatPercentage(value: number) {
  return `${Math.round(value)}%`;
}

function formatStorage(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createSparklinePath(values: number[]) {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function KpiSparkline({ values, tone }: { values: number[]; tone: "success" | "warning" | "error" | "info" | "neutral" }) {
  const colorByTone: Record<typeof tone, string> = {
    success: "#16a34a",
    warning: "#f59e0b",
    error: "#dc2626",
    info: "#2563eb",
    neutral: "#64748b",
  };

  return (
    <svg viewBox="0 0 100 100" className="h-14 w-full">
      <path d={createSparklinePath(values)} fill="none" stroke={colorByTone[tone]} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function KpiCard({
  title,
  value,
  deltaValue,
  deltaLabel,
  status,
  insight,
  sparkline,
  tone,
}: {
  title: string;
  value: string;
  deltaValue: string;
  deltaLabel: string;
  status: string;
  insight: string;
  sparkline: number[];
  tone: "success" | "warning" | "error" | "info" | "neutral";
}) {
  const chipToneClass: Record<Tone, string> = {
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
    error: "bg-error/12 text-error",
    info: "bg-info/12 text-info",
    neutral: "bg-surface-secondary text-text-secondary",
  };

  return (
    <Card className="overflow-hidden border border-border-soft bg-surface shadow-soft">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-label uppercase tracking-[0.18em] text-text-muted">{title}</p>
            <p className="mt-2 text-[2rem] font-semibold leading-none text-text-primary">{value}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-text-muted">{deltaLabel}</p>
            <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${chipToneClass[tone]}`}>
              {deltaValue}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <KpiSparkline values={sparkline} tone={tone} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-body font-medium text-text-primary">{status}</p>
          <ArrowUpRight className="h-4 w-4 text-text-muted" />
        </div>
        <p className="mt-1 text-body text-text-secondary">{insight}</p>
      </CardContent>
    </Card>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;

  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <svg className="absolute h-full w-full -rotate-90">
        <circle cx="88" cy="88" r={radius} stroke="rgba(148,163,184,0.22)" strokeWidth="12" fill="transparent" />
        <circle
          cx="88"
          cy="88"
          r={radius}
          stroke="#2563eb"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center">
        <p className="text-5xl font-semibold text-text-primary">{score}</p>
        <p className="mt-1 text-label uppercase tracking-[0.18em] text-text-muted">of 100</p>
      </div>
    </div>
  );
}

export function ProjectDocumentVault() {
  const role = useUiStore((state) => state.role);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const complianceRef = useRef<HTMLDivElement>(null);
  const registerRef = useRef<HTMLDivElement>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey>("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploaderFilter, setUploaderFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [nowTs] = useState(() => Date.now());

  const docsQuery = useQuery({
    queryKey: ["erp-documents", role],
    queryFn: async () => (await apiRequest<DocumentRegisterResponse>("/api/admin/documents", { role })).data,
  });

  const complianceQuery = useQuery({
    queryKey: ["erp-compliance", role],
    queryFn: async () => (await apiRequest<ComplianceResponse>("/api/admin/compliance", { role })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const usersQuery = useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });

  if (docsQuery.isLoading || complianceQuery.isLoading || projectsQuery.isLoading || usersQuery.isLoading) {
    return <LoadingStateCard title="Loading Project Document Vault..." />;
  }

  if (
    docsQuery.error ||
    complianceQuery.error ||
    projectsQuery.error ||
    usersQuery.error ||
    !docsQuery.data ||
    !complianceQuery.data ||
    !projectsQuery.data ||
    !usersQuery.data
  ) {
    return <ErrorStateCard message="Project document intelligence is currently unavailable." />;
  }

  const documents = docsQuery.data.documents;
  const complianceItems = complianceQuery.data.items;
  const projects = projectsQuery.data.projects;
  const owners = usersQuery.data.users.map((user) => ({ id: user.id, name: user.name }));

  const enrichedDocuments: EnrichedDocument[] = documents.map((document) => {
    const normalizedCategory = normalizeCategory(document.category);
    const normalizedStatus = getDocumentStatus(document, nowTs);
    const icon = getCategoryIcon(normalizedCategory);
    return {
      ...document,
      normalizedCategory,
      normalizedStatus,
      icon,
      projectLabel: document.projectName || "General / Cross-project",
      sizeLabel: formatFileSize(document.fileSize),
      summary: document.originalName
        ? `${document.module} • ${document.originalName}`
        : `${document.module} • Record stored without a file attachment`,
    };
  });

  const requiredCategories: Array<Exclude<CategoryKey, "All" | "Invoices" | "Photos" | "Other">> = [
    "Drawings",
    "Contracts",
    "Permits",
    "Reports",
    "Material Tests",
  ];

  const coverageRows = projects.map((project) => {
    const projectDocuments = enrichedDocuments.filter((document) => document.projectId === project.id);
    const projectCompliance = complianceItems.filter((item) => item.projectId === project.id);
    const approved = projectDocuments.filter((document) => document.normalizedStatus === "Approved").length;
    const pending = projectDocuments.filter((document) => document.normalizedStatus === "Pending").length;
    const categorySet = new Set(projectDocuments.map((document) => document.normalizedCategory));
    const covered = requiredCategories.filter((category) => categorySet.has(category)).length;
    const coverage = Math.round((covered / requiredCategories.length) * 100);
    const expiring = projectCompliance.filter((item) => getComplianceBucket(item, nowTs) === "Expiring").length;
    const expired = projectCompliance.filter((item) => getComplianceBucket(item, nowTs) === "Expired").length;
    const missingCategories = requiredCategories.filter((category) => !categorySet.has(category));
    const riskScore = missingCategories.length + pending + expiring + expired * 2;
    const risk = getRiskLabel(riskScore);
    const status =
      coverage >= 90 && expired === 0 && pending <= 1
        ? "Documentation Ready"
        : coverage >= 70 && expired === 0
          ? "Watchlist"
          : "At Risk";

    return {
      id: project.id,
      name: project.name,
      documents: projectDocuments.length,
      approved,
      pending,
      coverage,
      risk,
      status,
      expiring,
      expired,
      missingCategories,
    };
  });

  const monthLabels: Array<{ label: string; start: Date; end: Date }> = [];
  const cursor = new Date(nowTs);
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  for (let index = 11; index >= 0; index -= 1) {
    const start = new Date(cursor.getFullYear(), cursor.getMonth() - index, 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() - index + 1, 1);
    monthLabels.push({
      label: start.toLocaleDateString("en-IN", { month: "short" }),
      start,
      end,
    });
  }

  const twelveMonthTrend = monthLabels.map(({ label, start, end }) => {
    const monthDocuments = enrichedDocuments.filter((document) => {
      const uploadedAt = new Date(document.uploadedAt).getTime();
      return uploadedAt >= start.getTime() && uploadedAt < end.getTime();
    });

    return {
      label,
      Uploads: monthDocuments.length,
      Approvals: monthDocuments.filter((document) => document.normalizedStatus === "Approved").length,
      Reviews: monthDocuments.filter((document) => document.normalizedStatus === "Pending").length,
    };
  });

  const categoryChartData = categoryDefinitions
    .filter((definition) => definition.key !== "All")
    .map((definition) => ({
      name: definition.label,
      value: enrichedDocuments.filter((document) => document.normalizedCategory === definition.key).length,
    }))
    .filter((item) => item.value > 0);

  const complianceChartData = coverageRows
    .map((row) => {
      const projectCompliance = complianceItems.filter((item) => item.projectId === row.id);
      return {
        project: row.name.length > 18 ? `${row.name.slice(0, 18)}...` : row.name,
        Approved: projectCompliance.filter((item) => getComplianceBucket(item, nowTs) === "Approved").length,
        Pending: projectCompliance.filter((item) => getComplianceBucket(item, nowTs) === "Pending").length,
        Expiring: projectCompliance.filter((item) => getComplianceBucket(item, nowTs) === "Expiring").length,
        Expired: projectCompliance.filter((item) => getComplianceBucket(item, nowTs) === "Expired").length,
      };
    })
    .filter((item) => item.Approved + item.Pending + item.Expiring + item.Expired > 0)
    .slice(0, 6);

  const coverageChartData = [...coverageRows]
    .sort((left, right) => right.coverage - left.coverage)
    .slice(0, 8)
    .map((row) => ({
      project: row.name.length > 18 ? `${row.name.slice(0, 18)}...` : row.name,
      coverage: row.coverage,
    }));

  const totalDocuments = enrichedDocuments.length;
  const pendingReviews = enrichedDocuments.filter((document) => document.normalizedStatus === "Pending").length;
  const expiringThisMonth = complianceItems.filter((item) => getComplianceBucket(item, nowTs) === "Expiring").length;
  const approvedDocuments = enrichedDocuments.filter((document) => document.normalizedStatus === "Approved").length;
  const coveredProjects = coverageRows.filter((row) => row.documents > 0).length;
  const documentationReady = coverageRows.filter((row) => row.status === "Documentation Ready").length;
  const complianceSafe = complianceItems.filter((item) => getComplianceBucket(item, nowTs) === "Approved").length;
  const complianceCoverage = complianceItems.length ? Math.round((complianceSafe / complianceItems.length) * 100) : 100;
  const storageBytes = enrichedDocuments.reduce((sum, document) => sum + (document.fileSize || 0), 0);
  const recentUploads = enrichedDocuments.filter((document) => nowTs - new Date(document.uploadedAt).getTime() <= 1000 * 60 * 60 * 24 * 7);
  const averageCoverage = coverageRows.length
    ? Math.round(coverageRows.reduce((sum, row) => sum + row.coverage, 0) / coverageRows.length)
    : 100;
  const approvalRatio = totalDocuments ? Math.round((approvedDocuments / totalDocuments) * 100) : 100;
  const pendingPenalty = totalDocuments ? Math.round((pendingReviews / totalDocuments) * 100) : 0;
  const healthScore = Math.round(
    Math.min(
      100,
      0.35 * approvalRatio + 0.3 * averageCoverage + 0.25 * complianceCoverage + 0.1 * Math.max(0, 100 - pendingPenalty),
    ),
  );
  const trendDelta = Math.max(-9, Math.min(9, documentationReady + recentUploads.length - expiringThisMonth - 1));
  const healthLabel = healthScore >= 90 ? "Healthy" : healthScore >= 75 ? "Watch" : "Critical";

  const uploadsByProject = coverageRows
    .map((row) => ({
      name: row.name,
      uploads: recentUploads.filter((document) => document.projectId === row.id).length,
    }))
    .sort((left, right) => right.uploads - left.uploads);
  const highActivityProject = uploadsByProject[0];

  const categoryCounts = categoryDefinitions.reduce<Record<CategoryKey, number>>(
    (accumulator, definition) => {
      if (definition.key === "All") {
        accumulator.All = enrichedDocuments.length;
        return accumulator;
      }
      accumulator[definition.key] = enrichedDocuments.filter((document) => document.normalizedCategory === definition.key).length;
      return accumulator;
    },
    {
      All: enrichedDocuments.length,
      Drawings: 0,
      Contracts: 0,
      Permits: 0,
      Reports: 0,
      "Material Tests": 0,
      Invoices: 0,
      Photos: 0,
      Other: 0,
    },
  );

  const archived = new Set(archivedIds);
  const filteredDocuments = enrichedDocuments.filter((document) => {
    if (archived.has(document.id)) return false;
    if (activeCategory !== "All" && document.normalizedCategory !== activeCategory) return false;
    if (categoryFilter !== "All" && document.normalizedCategory !== categoryFilter) return false;
    if (projectFilter !== "All" && document.projectId !== projectFilter) return false;
    if (statusFilter !== "All" && document.normalizedStatus !== statusFilter) return false;
    if (uploaderFilter !== "All" && document.uploadedByName !== uploaderFilter) return false;
    if (search.trim()) {
      const haystack = `${document.title} ${document.projectLabel} ${document.ownerName} ${document.uploadedByName} ${document.summary}`.toLowerCase();
      if (!haystack.includes(search.trim().toLowerCase())) return false;
    }
    if (dateFrom) {
      const documentDate = getDateInputValue(new Date(document.uploadedAt));
      if (documentDate < dateFrom) return false;
    }
    if (dateTo) {
      const documentDate = getDateInputValue(new Date(document.uploadedAt));
      if (documentDate > dateTo) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(0, currentPage - 3),
    Math.max(0, currentPage - 3) + 5,
  );

  const kpis: Array<{
    title: string;
    value: string;
    deltaValue: string;
    deltaLabel: string;
    status: string;
    insight: string;
    sparkline: number[];
    tone: Tone;
  }> = [
    {
      title: "Total Documents",
      value: String(totalDocuments),
      deltaValue: `+${recentUploads.length}`,
      deltaLabel: "This Week",
      status: "Strong repository depth",
      insight: `${coveredProjects} projects are currently represented in the vault.`,
      sparkline: twelveMonthTrend.map((entry) => entry.Uploads),
      tone: "info" as const,
    },
    {
      title: "Active Projects Covered",
      value: String(coveredProjects),
      deltaValue: String(documentationReady),
      deltaLabel: "Ready",
      status: "Coverage expanding",
      insight: `${projects.length - coveredProjects} projects still need more evidence in the vault.`,
      sparkline: coverageRows.map((row) => row.coverage),
      tone: coveredProjects === projects.length ? "success" : "info",
    },
    {
      title: "Pending Reviews",
      value: String(pendingReviews),
      deltaValue: `+${complianceQuery.data.summary.inReview}`,
      deltaLabel: "In Review",
      status: pendingReviews > 10 ? "Needs attention" : "Under control",
      insight: "Review queue blends pending document issues with compliance review load.",
      sparkline: twelveMonthTrend.map((entry) => entry.Reviews),
      tone: pendingReviews > 10 ? "warning" : "info",
    },
    {
      title: "Expiring This Month",
      value: String(expiringThisMonth),
      deltaValue: String(complianceItems.filter((item) => getComplianceBucket(item, nowTs) === "Expired").length),
      deltaLabel: "Expired",
      status: expiringThisMonth > 0 ? "Watch approvals" : "Stable",
      insight: "Near-term permits and statutory records are driving the risk queue.",
      sparkline: complianceChartData.map((entry) => entry.Expiring + entry.Expired),
      tone: expiringThisMonth > 0 ? "warning" : "success",
    },
    {
      title: "Approved Documents",
      value: String(approvedDocuments),
      deltaValue: `${approvalRatio}%`,
      deltaLabel: "Cleared",
      status: approvalRatio >= 80 ? "Strong governance" : "Review backlog",
      insight: "Approval health is a weighted input in the vault score.",
      sparkline: twelveMonthTrend.map((entry) => entry.Approvals),
      tone: approvalRatio >= 80 ? "success" : "warning",
    },
    {
      title: "Compliance Coverage",
      value: formatPercentage(complianceCoverage),
      deltaValue: String(documentationReady),
      deltaLabel: "Ready Projects",
      status: complianceCoverage >= 85 ? "Well-covered" : "Needs uplift",
      insight: "Measures how much of the compliance register is currently protected from immediate risk.",
      sparkline: coverageRows.map((row) => row.coverage),
      tone: complianceCoverage >= 85 ? "success" : "warning",
    },
    {
      title: "Storage Usage",
      value: formatStorage(storageBytes),
      deltaValue: `+${formatStorage(recentUploads.reduce((sum, item) => sum + (item.fileSize || 0), 0))}`,
      deltaLabel: "Weekly Growth",
      status: storageBytes < 5 * 1024 * 1024 * 1024 ? "Within limits" : "Review retention",
      insight: "Storage is tracked for live files only; record-only entries are excluded from volume.",
      sparkline: twelveMonthTrend.map((entry) => entry.Uploads * 12),
      tone: storageBytes < 5 * 1024 * 1024 * 1024 ? "info" : "warning",
    },
    {
      title: "New Uploads This Week",
      value: String(recentUploads.length),
      deltaValue: `${highActivityProject?.uploads || 0} files`,
      deltaLabel: "Top Project",
      status: recentUploads.length >= 10 ? "High activity" : "Normal pace",
      insight: `${highActivityProject?.name || "No project spike yet"} is driving the newest upload activity this week.`,
      sparkline: twelveMonthTrend.map((entry) => entry.Uploads),
      tone: recentUploads.length >= 10 ? "info" : "neutral",
    },
  ];

  const recommendations: Array<{
    title: string;
    body: string;
    actionLabel: string;
    tone: Tone;
    actionKey: "compliance" | "projects" | "reviews" | "activity";
  }> = [
    {
      title: "Approval Risk",
      body: `${expiringThisMonth} approvals expire within 30 days across active projects.`,
      actionLabel: "Review Compliance",
      tone: expiringThisMonth > 0 ? "warning" : "success",
      actionKey: "compliance",
    },
    {
      title: "Missing Documentation",
      body: `${coverageRows.filter((row) => row.missingCategories.length > 0).length} projects are missing at least one required documentation category.`,
      actionLabel: "View Projects",
      tone: coverageRows.some((row) => row.missingCategories.length > 0) ? "error" : "success",
      actionKey: "projects",
    },
    {
      title: "Review Queue",
      body: `${pendingReviews} documents are still awaiting review or final acceptance.`,
      actionLabel: "Open Reviews",
      tone: pendingReviews > 0 ? "warning" : "success",
      actionKey: "reviews",
    },
    {
      title: "High Activity",
      body: `${highActivityProject?.name || "No project"} uploaded ${highActivityProject?.uploads || 0} new files this week.`,
      actionLabel: "View Activity",
      tone: (highActivityProject?.uploads || 0) >= 5 ? "info" : "neutral",
      actionKey: "activity",
    },
  ];

  const activeFilterBadges = [
    activeCategory !== "All" ? `Category strip: ${activeCategory}` : null,
    categoryFilter !== "All" ? `Category: ${categoryFilter}` : null,
    projectFilter !== "All" ? `Project: ${projects.find((project) => project.id === projectFilter)?.name || "Filtered"}` : null,
    statusFilter !== "All" ? `Status: ${statusFilter}` : null,
    uploaderFilter !== "All" ? `Uploader: ${uploaderFilter}` : null,
    dateFrom ? `From: ${dateFrom}` : null,
    dateTo ? `To: ${dateTo}` : null,
  ].filter(Boolean) as string[];

  const heroMetrics: Array<{ label: string; value: string | number; tone: Tone }> = [
    { label: "Total Documents", value: totalDocuments, tone: "info" },
    { label: "Pending Reviews", value: pendingReviews, tone: "warning" },
    { label: "Expiring Approvals", value: expiringThisMonth, tone: expiringThisMonth > 0 ? "warning" : "success" },
    { label: "Storage Usage", value: formatStorage(storageBytes), tone: "neutral" },
  ];

  const handleRecommendationAction = (actionKey: "compliance" | "projects" | "reviews" | "activity") => {
    if (actionKey === "compliance") {
      complianceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (actionKey === "projects") {
      registerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (actionKey === "reviews") {
      setStatusFilter("Pending");
      registerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    analyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="space-y-8 pb-12 animate-page-in">
      <SectionHeader
        title="Project Document Vault"
        description="Centralized repository for drawings, contracts, permits, reports, compliance records, approvals, and project documentation."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setDrawerOpen(true)} className="text-white">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  `project-document-vault-${new Date().toISOString().slice(0, 10)}.csv`,
                  [
                    ["Document", "Category", "Project", "Version", "Owner", "Status", "Uploaded Date"],
                    ...filteredDocuments.map((document) => [
                      document.title,
                      document.normalizedCategory,
                      document.projectLabel,
                      document.version,
                      document.ownerName,
                      document.normalizedStatus,
                      formatDateTime(document.uploadedAt),
                    ]),
                  ]
                    .map((row) => row.map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`).join(","))
                    .join("\n"),
                )
              }
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={() => analyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              <BarChart3 className="h-4 w-4" />
              Document Analytics
            </Button>
            <Button variant="outline" onClick={() => complianceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              <ShieldAlert className="h-4 w-4" />
              Compliance Center
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden border border-border-soft bg-gradient-to-r from-surface via-surface to-surface-secondary/50 shadow-premium">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[320px_1fr]">
            <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-border-soft bg-white/70 p-6 text-center shadow-soft">
              <p className="text-label uppercase tracking-[0.22em] text-text-muted">Documentation Health Score</p>
              <div className="mt-5">
                <ScoreRing score={healthScore} />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge tone={getStatusTone(healthLabel)}>{healthLabel}</Badge>
                <Badge tone={trendDelta >= 0 ? "success" : "warning"}>{`${trendDelta >= 0 ? "+" : ""}${trendDelta}% vs Last Month`}</Badge>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">Executive summary</Badge>
                  <Badge tone={documentationReady > 0 ? "success" : "warning"}>{documentationReady} documentation-ready projects</Badge>
                </div>
                <p className="max-w-4xl text-body leading-7 text-text-secondary">
                  The vault currently tracks {totalDocuments} documents across {coveredProjects} active projects. {pendingReviews} records remain in review, {expiringThisMonth} approvals require near-term action, and the portfolio is averaging {averageCoverage}% documentation completeness against the required project evidence set.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {heroMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/35 p-4 shadow-soft">
                    <p className="text-label uppercase tracking-[0.18em] text-text-muted">{metric.label}</p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <p className="text-3xl font-semibold text-text-primary">{metric.value}</p>
                      <Badge tone={metric.tone}>{metric.label === "Storage Usage" ? "Active" : "Live"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4 2xl:grid-cols-8">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div ref={complianceRef} className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {recommendations.map((recommendation) => (
          <Card key={recommendation.title} className="border border-border-soft bg-surface shadow-soft">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      recommendation.tone === "error"
                        ? "bg-error"
                        : recommendation.tone === "warning"
                          ? "bg-warning"
                          : recommendation.tone === "success"
                            ? "bg-success"
                            : "bg-accent-primary"
                    }`}
                  />
                  <p className="text-card-title text-text-primary">{recommendation.title}</p>
                </div>
                <Badge tone={recommendation.tone}>{recommendation.tone === "error" ? "Critical" : recommendation.tone === "warning" ? "Warning" : recommendation.tone === "success" ? "Success" : "Information"}</Badge>
              </div>
              <p className="mt-3 text-body leading-6 text-text-secondary">{recommendation.body}</p>
              <button
                type="button"
                onClick={() => handleRecommendationAction(recommendation.actionKey)}
                className="mt-4 inline-flex items-center gap-2 text-body font-medium text-accent-primary hover:underline"
              >
                {recommendation.actionLabel}
                <ChevronRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div ref={analyticsRef} className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle>Document Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryChartData} dataKey="value" nameKey="name" innerRadius={86} outerRadius={122} paddingAngle={3}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/30 p-4 text-center">
                <p className="text-label uppercase tracking-[0.18em] text-text-muted">Total Documents</p>
                <p className="mt-2 text-4xl font-semibold text-text-primary">{totalDocuments}</p>
              </div>
              {categoryChartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                    <span className="text-body text-text-primary">{item.name}</span>
                  </div>
                  <span className="text-body font-medium text-text-secondary">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border-soft shadow-soft">
          <CardHeader className="border-b border-border-soft pb-4">
            <CardTitle className="text-section-title font-semibold text-text-primary">Project Documentation Coverage</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coverageChartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid horizontal={false} stroke="var(--color-border-soft)" strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  tickFormatter={(value) => `${value}%`} 
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  type="category" 
                  dataKey="project" 
                  width={150} 
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, "Coverage"]} 
                  cursor={{ fill: 'var(--color-hover)', opacity: 0.3 }}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border-soft)',
                    borderRadius: 'var(--radius-button)',
                    boxShadow: 'var(--shadow-soft)',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="coverage" 
                  fill="var(--color-accent-primary)" 
                  radius={4} 
                  background={{ fill: 'var(--color-surface-secondary)', radius: 4 }}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle>Upload Activity Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={twelveMonthTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="uploads-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="approvals-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="Uploads" stroke="#2563eb" fill="url(#uploads-fill)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="Approvals" stroke="#16a34a" fill="url(#approvals-fill)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="Reviews" stroke="#f59e0b" fill="none" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="project" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Approved" stackId="a" fill="#16a34a" radius={8} />
                <Bar dataKey="Pending" stackId="a" fill="#2563eb" />
                <Bar dataKey="Expiring" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Expired" stackId="a" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border border-border-soft shadow-soft">
        <CardHeader>
          <CardTitle>Document Category Navigation</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex min-w-max gap-3">
            {categoryDefinitions.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.key;
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.key);
                    setPage(1);
                  }}
                  className={`flex min-w-[140px] items-center gap-3 rounded-[24px] border px-4 py-3 text-left transition-all ${
                    isActive
                      ? "border-accent-primary bg-active-soft text-accent-primary shadow-soft"
                      : "border-border-soft bg-surface text-text-secondary hover:bg-hover"
                  }`}
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isActive ? "bg-accent-primary/12" : "bg-surface-secondary"}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-body font-medium">{category.label}</p>
                    <p className="text-label">{categoryCounts[category.key]}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-border-soft shadow-soft">
        <CardHeader>
          <CardTitle>Project Document Coverage</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-6 text-left">Project</th>
                  <th className="px-4 text-left">Documents</th>
                  <th className="px-4 text-left">Approved</th>
                  <th className="px-4 text-left">Pending</th>
                  <th className="px-4 text-left">Coverage %</th>
                  <th className="px-4 text-left">Risk</th>
                  <th className="px-6 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {coverageRows.map((row) => (
                  <tr key={row.id} className="border-t border-border-soft">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-secondary text-accent-primary">
                          <Building2 className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <p className="font-medium text-text-primary">{row.name}</p>
                          <p className="text-label text-text-muted">
                            {row.missingCategories.length > 0 ? `Missing: ${row.missingCategories.join(", ")}` : "Required categories covered"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-text-primary">{row.documents}</td>
                    <td className="px-4 py-4 text-success">{row.approved}</td>
                    <td className="px-4 py-4 text-warning">{row.pending}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`font-semibold ${row.coverage >= 90 ? "text-success" : row.coverage >= 75 ? "text-accent-primary" : "text-warning"}`}>{row.coverage}%</span>
                          <span className="text-label text-text-muted">{row.expiring + row.expired} risk items</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-secondary">
                          <div
                            className={`h-2 rounded-full ${row.coverage >= 90 ? "bg-success" : row.coverage >= 75 ? "bg-accent-primary" : "bg-warning"}`}
                            style={{ width: `${row.coverage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={getStatusTone(row.risk)}>{row.risk}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={getStatusTone(row.status)}>{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div ref={registerRef}>
        <Card className="overflow-hidden border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle>Document Register</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <TableToolbar
              searchPlaceholder="Search document title, project, owner, file name..."
              searchValue={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              resultLabel={`Showing ${filteredDocuments.length} documents`}
              summary={archivedIds.length > 0 ? `${archivedIds.length} archived in this session` : "Filters stay applied across pagination"}
              activeFilters={activeFilterBadges}
              onClear={() => {
                setSearch("");
                setProjectFilter("All");
                setCategoryFilter("All");
                setStatusFilter("All");
                setUploaderFilter("All");
                setDateFrom("");
                setDateTo("");
                setActiveCategory("All");
                setPage(1);
              }}
              filters={
                <>
                  <select
                    value={projectFilter}
                    onChange={(event) => {
                      setProjectFilter(event.target.value);
                      setPage(1);
                    }}
                    className={selectClassName}
                  >
                    <option value="All">Project Filter</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(event) => {
                      setCategoryFilter(event.target.value as CategoryKey);
                      setPage(1);
                    }}
                    className={selectClassName}
                  >
                    {categoryDefinitions.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(1);
                    }}
                    className={selectClassName}
                  >
                    <option value="All">Status Filter</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <select
                    value={uploaderFilter}
                    onChange={(event) => {
                      setUploaderFilter(event.target.value);
                      setPage(1);
                    }}
                    className={selectClassName}
                  >
                    <option value="All">Uploader Filter</option>
                    {Array.from(new Set(enrichedDocuments.map((document) => document.uploadedByName))).sort().map((uploader) => (
                      <option key={uploader} value={uploader}>
                        {uploader}
                      </option>
                    ))}
                  </select>
                  <Input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} className="h-11 min-w-[160px] bg-surface" />
                  <Input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} className="h-11 min-w-[160px] bg-surface" />
                </>
              }
              actions={
                <>
                  {archivedIds.length > 0 ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setArchivedIds([])}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore Archived
                    </Button>
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      downloadCsv(
                        `project-documents-register-${new Date().toISOString().slice(0, 10)}.csv`,
                        [
                          ["Document", "Category", "Project", "Version", "Owner", "File Size", "Status", "Uploaded Date"],
                          ...filteredDocuments.map((document) => [
                            document.title,
                            document.normalizedCategory,
                            document.projectLabel,
                            document.version,
                            document.ownerName,
                            document.sizeLabel,
                            document.normalizedStatus,
                            formatDateTime(document.uploadedAt),
                          ]),
                        ]
                          .map((row) => row.map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`).join(","))
                          .join("\n"),
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </>
              }
            />

            <div className="overflow-auto">
              <table className="w-full min-w-[1320px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-6 text-left">Document</th>
                    <th className="px-4 text-left">Category</th>
                    <th className="px-4 text-left">Project</th>
                    <th className="px-4 text-left">Version</th>
                    <th className="px-4 text-left">Owner</th>
                    <th className="px-4 text-left">File Size</th>
                    <th className="px-4 text-left">Status</th>
                    <th className="px-4 text-left">Uploaded Date</th>
                    <th className="px-6 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDocuments.length ? (
                    paginatedDocuments.map((document) => {
                      const Icon = document.icon;
                      return (
                        <tr key={document.id} className="border-t border-border-soft bg-surface">
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-secondary text-accent-primary">
                                <Icon className="h-4.5 w-4.5" />
                              </span>
                              <div className="space-y-1">
                                <Link href={`/projects/documents/${document.id}`} className="font-medium text-text-primary hover:text-accent-primary">
                                  {document.title}
                                </Link>
                                <p className="text-label text-text-muted">{document.summary}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge tone={document.normalizedCategory === "Permits" ? "warning" : document.normalizedCategory === "Contracts" ? "info" : document.normalizedCategory === "Reports" ? "success" : "neutral"}>
                              {document.normalizedCategory}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-text-muted" />
                              <span className="text-text-primary">{document.projectLabel}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge tone="neutral">{document.version}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-text-primary">{document.ownerName}</p>
                              <p className="text-label text-text-muted">Uploaded by {document.uploadedByName}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-text-secondary">{document.sizeLabel}</td>
                          <td className="px-4 py-4">
                            <Badge tone={getStatusTone(document.normalizedStatus)}>{document.normalizedStatus}</Badge>
                          </td>
                          <td className="px-4 py-4 text-text-secondary">{formatDateTime(document.uploadedAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link href={`/projects/documents/${document.id}`} className="inline-flex items-center gap-1 rounded-[var(--radius-button)] border border-border-soft px-3 py-2 text-body text-text-secondary hover:bg-hover hover:text-text-primary">
                                <ScanSearch className="h-4 w-4" />
                                View
                              </Link>
                              <a
                                href={document.fileUrl || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1 rounded-[var(--radius-button)] border border-border-soft px-3 py-2 text-body ${
                                  document.fileUrl ? "text-text-secondary hover:bg-hover hover:text-text-primary" : "pointer-events-none opacity-50"
                                }`}
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </a>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  const shareUrl = `${window.location.origin}/projects/documents/${document.id}`;
                                  if (navigator.share) {
                                    await navigator.share({ title: document.title, url: shareUrl });
                                  } else {
                                    await navigator.clipboard.writeText(shareUrl);
                                  }
                                }}
                              >
                                <Share2 className="h-4 w-4" />
                                Share
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (!confirm(`Archive ${document.title} from this session view?`)) return;
                                  setArchivedIds((current) => [...current, document.id]);
                                }}
                              >
                                <Archive className="h-4 w-4" />
                                Archive
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <TableEmptyStateRow
                      colSpan={9}
                      title="No documents match the current intelligence filters"
                      description="Adjust the register filters, reset the category strip, or upload a new document to expand coverage visibility."
                    />
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-border-soft bg-surface-secondary/20 px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="neutral">
                  Showing {filteredDocuments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredDocuments.length)} of {filteredDocuments.length} Documents
                </Badge>
                <div className="flex items-center gap-2 text-body text-text-secondary">
                  <span>Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                    className="h-9 rounded-[var(--radius-input)] border border-border-soft bg-surface px-2"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  Previous
                </Button>
                {pageNumbers.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === currentPage ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNumber)}
                    className={pageNumber === currentPage ? "text-white" : undefined}
                  >
                    {pageNumber}
                  </Button>
                ))}
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border-soft bg-surface-secondary/15 shadow-soft">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <p className="text-label uppercase tracking-[0.18em] text-text-muted">Executive readout</p>
              <ul className="grid grid-cols-1 gap-2 text-body text-text-secondary xl:grid-cols-2">
                <li>{documentationReady} projects are documentation-ready today.</li>
                <li>{coverageRows.filter((row) => row.missingCategories.length > 0).length} projects still have missing required document categories.</li>
                <li>{recentUploads.length} new uploads were logged this week.</li>
                <li>{complianceCoverage}% of compliance records are clear of immediate risk.</li>
              </ul>
            </div>
            <div className="flex items-center gap-2 text-body text-text-secondary">
              <Activity className="h-4 w-4 text-accent-primary" />
              Insights prioritize compliance exposure, review queue, and project readiness over raw file storage.
            </div>
          </div>
        </CardContent>
      </Card>

      {drawerOpen ? (
        <ProjectDocumentUploadDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          role={role}
          projects={projects.map((project) => ({ id: project.id, name: project.name }))}
          owners={owners}
          title="Upload Document"
          submitLabel="Publish Document"
          helperText="Use this publishing drawer to add new project evidence, compliance material, reports, and document revisions without returning to an inline form."
        />
      ) : null}
    </section>
  );
}
