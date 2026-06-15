"use client";
import { toast } from "@/components/ui/toast";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCheck,
  Copy,
  Download,
  Edit,
  FolderKanban,
  HardHat,
  History,
  Link2,
  Plus,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Share2,
} from "lucide-react";
import { apiRequest } from "@/lib/erp-api";
import type { ComplianceItem, ComplianceResponse, DocumentRecord, DocumentRegisterResponse, PropertySummaryResponse, UserDirectoryResponse } from "@/lib/erp-types";
import { formatDate, formatDateTime } from "@/lib/erp-utils";
import { useUiStore } from "@/store/ui-store";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectDocumentUploadDrawer } from "./project-document-upload-drawer";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

function normalizeCategory(category: string | null | undefined) {
  const normalized = (category || "").toLowerCase();
  if (normalized.includes("drawing") || normalized.includes("plan") || normalized.includes("layout")) return "Drawings";
  if (normalized.includes("contract") || normalized.includes("agreement")) return "Contracts";
  if (normalized.includes("permit") || normalized.includes("approval") || normalized.includes("noc") || normalized.includes("compliance")) return "Permits";
  if (normalized.includes("report") || normalized.includes("inspection")) return "Reports";
  if (normalized.includes("test") || normalized.includes("material") || normalized.includes("qa")) return "Material Tests";
  if (normalized.includes("invoice") || normalized.includes("receipt")) return "Invoices";
  if (normalized.includes("photo") || normalized.includes("image")) return "Photos";
  return "Other";
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
  if (normalized.includes("ready") || normalized.includes("healthy") || normalized.includes("approved") || normalized.includes("low")) return "success";
  if (normalized.includes("critical") || normalized.includes("high") || normalized.includes("expired") || normalized.includes("rejected")) return "error";
  if (normalized.includes("pending") || normalized.includes("attention") || normalized.includes("expiring") || normalized.includes("watch")) return "warning";
  if (normalized.includes("review") || normalized.includes("linked")) return "info";
  return "neutral";
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

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "Record only";
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getVersionNumber(version: string) {
  const number = Number.parseInt(version.replace(/^v/i, ""), 10);
  return Number.isNaN(number) ? 1 : number;
}

function resolveFileUrl(fileUrl?: string | null) {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
  return `${apiBaseUrl}${fileUrl}`;
}

export function ProjectDocumentDetail({ documentId }: { documentId: string }) {
  const router = useRouter();
  const role = useUiStore((state) => state.role);
  const [newVersionOpen, setNewVersionOpen] = useState(false);
  const [nowTs] = useState(() => Date.now());
  const [localEvents, setLocalEvents] = useState<Array<{ id: string; title: string; detail: string; at: string; tone: "info" | "success" }>>([]);

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
    return <LoadingStateCard title="Loading Document Intelligence Detail..." />;
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
    return <ErrorStateCard message="Document intelligence detail is unavailable." />;
  }

  const documents = docsQuery.data.documents;
  const current = documents.find((document) => document.id === documentId);

  if (!current) {
    return <ErrorStateCard message="The requested document could not be found in the current vault register." />;
  }

  const complianceItems = complianceQuery.data.items;
  const currentStatus = getDocumentStatus(current, nowTs);
  const currentCategory = normalizeCategory(current.category);
  const previewUrl = resolveFileUrl(current.fileUrl);
  const extension = (current.originalName || "").split(".").pop()?.toLowerCase();
  const isPdf = current.mimeType?.includes("pdf") || extension === "pdf";
  const isImage = current.mimeType?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "");
  const isDwg = current.mimeType?.toLowerCase().includes("dwg") || extension === "dwg";

  const versionFamily = [...documents]
    .filter(
      (document) =>
        document.title === current.title &&
        document.projectId === current.projectId &&
        normalizeCategory(document.category) === currentCategory,
    )
    .sort((left, right) => getVersionNumber(right.version) - getVersionNumber(left.version));

  const projectCompliance = complianceItems.filter((item) => item.projectId === current.projectId);
  const linkedCompliance = projectCompliance.filter(
    (item) =>
      item.documentId === current.id ||
      item.documentTitle === current.title ||
      normalizeCategory(item.approvalType) === currentCategory,
  );
  const relatedDocuments = documents
    .filter(
      (document) =>
        document.id !== current.id &&
        (document.projectId === current.projectId || normalizeCategory(document.category) === currentCategory),
    )
    .slice(0, 6);

  const complianceSummary = {
    expiring: projectCompliance.filter((item) => getComplianceBucket(item, nowTs) === "Expiring").length,
    expired: projectCompliance.filter((item) => getComplianceBucket(item, nowTs) === "Expired").length,
    pending: projectCompliance.filter((item) => getComplianceBucket(item, nowTs) === "Pending").length,
    approved: projectCompliance.filter((item) => getComplianceBucket(item, nowTs) === "Approved").length,
  };

  const complianceScore = projectCompliance.length
    ? Math.round(((complianceSummary.approved + Math.max(0, projectCompliance.length - complianceSummary.pending - complianceSummary.expiring - complianceSummary.expired)) / projectCompliance.length) * 100)
    : 100;
  const riskLevel =
    complianceSummary.expired > 0
      ? "Critical"
      : complianceSummary.expiring > 0
        ? "High"
        : complianceSummary.pending > 0
          ? "Watch"
          : "Low";

  const generatedTimeline = [
    {
      id: `uploaded-${current.id}`,
      title: "Uploaded",
      detail: `${current.uploadedByName} published ${current.version} into the Project Document Vault.`,
      at: current.uploadedAt,
      tone: "info" as const,
    },
    ...(currentStatus !== "Pending"
      ? [
          {
            id: `reviewed-${current.id}`,
            title: currentStatus === "Approved" ? "Reviewed" : "Escalated",
            detail:
              currentStatus === "Approved"
                ? `${current.ownerName} moved the document into the approved set.`
                : `Workflow status is currently ${currentStatus}.`,
            at: current.uploadedAt,
            tone: currentStatus === "Approved" ? ("success" as const) : ("info" as const),
          },
        ]
      : []),
    ...(linkedCompliance.length > 0
      ? [
          {
            id: `linked-${current.id}`,
            title: "Linked",
            detail: `${linkedCompliance.length} compliance references are tied to this project context.`,
            at: current.uploadedAt,
            tone: "info" as const,
          },
        ]
      : []),
  ];

  const activityTimeline = [...localEvents, ...generatedTimeline].sort(
    (left, right) => new Date(right.at).getTime() - new Date(left.at).getTime(),
  );

  const infoItems = [
    { label: "Category", value: currentCategory },
    { label: "Module", value: current.module },
    { label: "Project", value: current.projectName || "General / Cross-project" },
    { label: "Owner", value: current.ownerName },
    { label: "Uploaded By", value: current.uploadedByName },
    { label: "File Size", value: formatFileSize(current.fileSize) },
    { label: "Uploaded Date", value: formatDateTime(current.uploadedAt) },
    { label: "Expiry Date", value: current.expiryDate ? formatDate(current.expiryDate) : "No expiry set" },
    { label: "Original File", value: current.originalName || "Record only" },
  ];

  const complianceMetricCards: Array<{
    label: string;
    value: string | number;
    tone: "success" | "warning" | "error" | "info" | "neutral";
  }> = [
    { label: "Expiring Approvals", value: complianceSummary.expiring, tone: complianceSummary.expiring > 0 ? "warning" : "success" },
    { label: "Expired Permits", value: complianceSummary.expired, tone: complianceSummary.expired > 0 ? "error" : "success" },
    { label: "Pending Reviews", value: complianceSummary.pending, tone: complianceSummary.pending > 0 ? "warning" : "success" },
    { label: "Compliance Score", value: `${complianceScore}%`, tone: complianceScore >= 85 ? "success" : "warning" },
  ];

  const projectRef = projectsQuery.data.projects.find((project) => project.id === current.projectId);

  const openUnsupportedEdit = () => {
    toast.info("Metadata editing is not yet exposed by the current documents API. Use New Version to publish a corrected revision.");
  };

  const triggerDownload = () => {
    if (!previewUrl) return;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
    setLocalEvents((events) => [
      {
        id: `download-${new Date().toISOString()}`,
        title: "Downloaded",
        detail: `${current.originalName || current.title} was opened from the document detail page.`,
        at: new Date().toISOString(),
        tone: "info",
      },
      ...events,
    ]);
  };

  const triggerShare = async () => {
    const shareUrl = `${window.location.origin}/projects/documents/${current.id}`;
    if (navigator.share) {
      await navigator.share({ title: current.title, url: shareUrl });
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
    setLocalEvents((events) => [
      {
        id: `share-${new Date().toISOString()}`,
        title: "Shared",
        detail: `Document link copied or shared from the intelligence detail page.`,
        at: new Date().toISOString(),
        tone: "success",
      },
      ...events,
    ]);
  };

  return (
    <section className="space-y-8 pb-12 animate-page-in">
      <div className="flex flex-col gap-4 border-b border-border-soft pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link href="/projects/documents">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Badge tone="neutral">Project Document Vault</Badge>
            <Badge tone={getStatusTone(currentStatus)}>{currentStatus}</Badge>
          </div>
          <h1 className="text-page-title font-secondary text-text-primary">{current.title}</h1>
          <p className="flex flex-wrap items-center gap-2 text-body text-text-secondary">
            <span>{current.projectName || "General / Cross-project"}</span>
            <span>•</span>
            <span>Version {current.version}</span>
            <span>•</span>
            <span>{currentCategory}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={triggerDownload} disabled={!previewUrl} className="text-white">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="secondary" onClick={triggerShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="secondary" onClick={openUnsupportedEdit}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setNewVersionOpen(true)}>
            <Plus className="h-4 w-4" />
            New Version
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.7fr_1fr]">
        <Card className="overflow-hidden border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex min-h-[520px] items-center justify-center bg-surface-secondary/20 p-6">
              {previewUrl && isPdf ? (
                <iframe src={previewUrl} title={current.title} className="h-[520px] w-full rounded-[var(--radius-card)] border border-border-soft bg-white" />
              ) : previewUrl && isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={current.title} className="max-h-[520px] w-full rounded-[var(--radius-card)] object-contain shadow-soft" />
              ) : previewUrl && isDwg ? (
                <div className="flex max-w-xl flex-col items-center gap-4 rounded-[var(--radius-card)] border border-dashed border-border-soft bg-surface p-8 text-center">
                  <ScrollText className="h-12 w-12 text-accent-primary" />
                  <div>
                    <p className="text-section-title text-text-primary">DWG thumbnail preview</p>
                    <p className="mt-2 text-body text-text-secondary">
                      Native CAD preview is not available in this ERP surface. Use the download action for the full drawing package.
                    </p>
                  </div>
                  <Button onClick={triggerDownload} disabled={!previewUrl}>
                    <Download className="h-4 w-4" />
                    Download Drawing
                  </Button>
                </div>
              ) : (
                <div className="flex max-w-xl flex-col items-center gap-4 rounded-[var(--radius-card)] border border-dashed border-border-soft bg-surface p-8 text-center">
                  <FolderKanban className="h-12 w-12 text-accent-primary" />
                  <div>
                    <p className="text-section-title text-text-primary">Record-only document</p>
                    <p className="mt-2 text-body text-text-secondary">
                      This document is tracked for workflow, approval, and compliance visibility but does not currently include a stored file preview.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-border-soft shadow-soft">
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              {infoItems.map((item) => (
                <div key={item.label} className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-4">
                  <p className="text-label uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
                  <p className="mt-2 text-body text-text-primary">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border-soft shadow-soft">
            <CardHeader>
              <CardTitle>Compliance Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {complianceMetricCards.map((item) => (
                  <div key={item.label} className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-4">
                    <p className="text-label uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-2xl font-semibold text-text-primary">{item.value}</p>
                      <Badge tone={item.tone}>{item.label === "Compliance Score" ? "Healthy" : "Live"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-body font-medium text-text-primary">Risk Level</p>
                  <Badge tone={getStatusTone(riskLevel)}>{riskLevel}</Badge>
                </div>
                <p className="mt-2 text-body text-text-secondary">
                  This document sits inside a project context with {projectCompliance.length} tracked compliance obligations and {linkedCompliance.length} direct reference matches.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle>Version History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {versionFamily.map((version) => (
              <div key={version.id} className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={version.id === current.id ? "info" : "neutral"}>{version.version}</Badge>
                    <Badge tone={getStatusTone(getDocumentStatus(version, nowTs))}>{getDocumentStatus(version, nowTs)}</Badge>
                  </div>
                  <p className="text-body text-text-primary">{formatDateTime(version.uploadedAt)}</p>
                  <p className="text-label text-text-muted">Owner: {version.ownerName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => window.open(resolveFileUrl(version.fileUrl) || "#", "_blank", "noopener,noreferrer")} disabled={!version.fileUrl}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" disabled={versionFamily.length < 2}>
                    <Copy className="h-4 w-4" />
                    Compare
                  </Button>
                  <Button variant="ghost" size="sm" disabled={version.id === current.id}>
                    <History className="h-4 w-4" />
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle>Project References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-accent-primary" />
                <div>
                  <p className="text-body font-medium text-text-primary">{projectRef?.name || current.projectName || "General / Cross-project"}</p>
                  <p className="text-label text-text-muted">Primary project context</p>
                </div>
              </div>
            </div>
            {linkedCompliance.length > 0 ? (
              linkedCompliance.map((item) => (
                <div key={item.id} className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-body font-medium text-text-primary">{item.approvalType}</p>
                    <Badge tone={getStatusTone(getComplianceBucket(item, nowTs))}>{getComplianceBucket(item, nowTs)}</Badge>
                  </div>
                  <p className="mt-1 text-body text-text-secondary">{item.authority}</p>
                  <p className="mt-2 text-label text-text-muted">Expires {formatDate(item.expiryDate)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[var(--radius-card)] border border-dashed border-border-soft bg-surface-secondary/20 p-6 text-center text-body text-text-secondary">
                No direct compliance link is stored for this document yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityTimeline.map((event) => (
              <div key={event.id} className="flex gap-3 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-4">
                <span className={`mt-1 h-2.5 w-2.5 rounded-full ${event.tone === "success" ? "bg-success" : "bg-accent-primary"}`} />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body font-medium text-text-primary">{event.title}</p>
                    <Badge tone={event.tone}>{formatDateTime(event.at)}</Badge>
                  </div>
                  <p className="text-body text-text-secondary">{event.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle>Related Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {relatedDocuments.length ? (
              relatedDocuments.map((document) => (
                <Link
                  key={document.id}
                  href={`/projects/documents/${document.id}`}
                  className="block rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-4 transition-all hover:-translate-y-0.5 hover:border-accent-primary/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-body font-medium text-text-primary">{document.title}</p>
                      <p className="mt-1 text-label text-text-muted">{document.projectName || "General"} • {normalizeCategory(document.category)}</p>
                    </div>
                    <Badge tone={getStatusTone(getDocumentStatus(document, nowTs))}>{getDocumentStatus(document, nowTs)}</Badge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[var(--radius-card)] border border-dashed border-border-soft bg-surface-secondary/20 p-6 text-center text-body text-text-secondary">
                No related documents were found for this category or project.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle>Audit Trail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                icon: CalendarClock,
                title: "Document registered",
                detail: `${current.uploadedByName} created the current record on ${formatDateTime(current.uploadedAt)}.`,
              },
              {
                icon: Link2,
                title: "Project linkage",
                detail: `Linked to ${current.projectName || "General / Cross-project"} for coverage and portfolio reporting.`,
              },
              {
                icon: ShieldAlert,
                title: "Compliance exposure",
                detail: `${linkedCompliance.length} direct compliance references and ${projectCompliance.length} project-level obligations influence this document context.`,
              },
            ].map((entry) => {
              const Icon = entry.icon;
              return (
                <div key={entry.title} className="flex gap-3 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface text-accent-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-body font-medium text-text-primary">{entry.title}</p>
                    <p className="mt-1 text-body text-text-secondary">{entry.detail}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border border-border-soft shadow-soft">
          <CardHeader>
            <CardTitle>Document Intelligence Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Version lineage", value: `${versionFamily.length} tracked revisions`, icon: History },
              { label: "Linked obligations", value: `${linkedCompliance.length} direct references`, icon: ShieldCheck },
              { label: "Project risk level", value: riskLevel, icon: HardHat },
              { label: "Workflow state", value: currentStatus, icon: CheckCheck },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary/20 p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-accent-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-label uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
                    <p className="mt-1 text-body font-medium text-text-primary">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {newVersionOpen ? (
        <ProjectDocumentUploadDrawer
          open={newVersionOpen}
          onClose={() => setNewVersionOpen(false)}
          role={role}
          projects={projectsQuery.data.projects.map((project) => ({ id: project.id, name: project.name }))}
          owners={usersQuery.data.users.map((user) => ({ id: user.id, name: user.name }))}
          title="Publish New Version"
          submitLabel="Publish Revision"
          helperText="This creates a new vault record using the same title, project, and category so revision history remains visible from the detail page."
          defaults={{
            title: current.title,
            category: currentCategory,
            module: current.module,
            projectId: current.projectId || "",
            version: `v${getVersionNumber(current.version) + 1}`,
            status: "Pending Review",
            expiryDate: current.expiryDate?.slice(0, 10) || "",
            ownerId: current.ownerId,
          }}
          onCreated={(document) => {
            setNewVersionOpen(false);
            router.push(`/projects/documents/${document.id}`);
          }}
        />
      ) : null}
    </section>
  );
}
