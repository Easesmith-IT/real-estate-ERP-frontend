"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  Download,
  Edit,
  FileText,
  Flag,
  GitBranch,
  History,
  Layers3,
  Play,
  ShieldAlert,
  Target,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/erp-api";
import { formatDate, toneForSeverity, toneForStatus } from "@/lib/erp-utils";
import type { ApprovalsResponse, ProjectTasksResponse, PropertySummaryResponse, UserDirectoryResponse } from "@/lib/erp-types";
import { useUiStore } from "@/store/ui-store";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  buildMilestoneDescription,
  daysUntil,
  getHealthLabelFromScore,
  getHealthToneFromScore,
  getMilestoneCategory,
  getMilestoneStatus,
  getRiskLevel,
  getRiskTone,
  makeDeliveryScore,
  milestoneCategories,
  milestonePriorities,
  selectClassName,
  splitDependencies,
  textareaClassName,
  type MilestoneComment,
  type MilestoneDocument,
  type MilestoneHistoryEntry,
  type MilestoneTask,
  type MilestoneTimelineEntry,
} from "./milestone-shared";

type MilestoneDetailRecord = MilestoneTask & {
  comments?: MilestoneComment[];
  documents?: MilestoneDocument[];
  activityTimeline?: MilestoneTimelineEntry[];
  history?: MilestoneHistoryEntry[];
};

type MilestoneFormState = {
  title: string;
  description: string;
  projectId: string;
  ownerId: string;
  category: string;
  priority: string;
  dueDate: string;
  dependencies: string;
  notes: string;
  completion: number;
};

function createEditForm(milestone?: MilestoneDetailRecord): MilestoneFormState {
  return {
    title: milestone?.title || "",
    description: milestone?.description || "",
    projectId: milestone?.projectId || "",
    ownerId: milestone?.ownerId || "",
    category: milestone ? getMilestoneCategory(milestone) : "Structural",
    priority: milestone?.priority || "Medium",
    dueDate: milestone?.dueDate ? milestone.dueDate.split("T")[0] : "",
    dependencies: milestone?.dependencies || "",
    notes: milestone?.notes || "",
    completion: milestone?.completion || 0,
  };
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function MilestoneDetail({ milestoneId }: { milestoneId: string }) {
  const router = useRouter();
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editForm, setEditForm] = useState<MilestoneFormState>(createEditForm());

  const milestoneQuery = useQuery({
    queryKey: ["erp-project-task-detail", milestoneId, role],
    queryFn: async () => (await apiRequest<MilestoneDetailRecord>(`/api/projects/tasks/${milestoneId}`, { role })).data,
  });

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

  useEffect(() => {
    if (milestoneQuery.data) {
      setEditForm(createEditForm(milestoneQuery.data));
    }
  }, [milestoneQuery.data]);

  const refreshMilestone = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["erp-project-task-detail", milestoneId] }),
      queryClient.invalidateQueries({ queryKey: ["erp-project-tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-admin-approvals"] }),
    ]);
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      apiRequest(`/api/projects/tasks/${milestoneId}`, {
        role,
        method: "PATCH",
        body: payload,
      }),
    onSuccess: async () => {
      setCommentText("");
      setIsEditDrawerOpen(false);
      await refreshMilestone();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/projects/tasks/${milestoneId}`, {
        role,
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-project-tasks"] });
      router.push("/projects/milestones");
    },
  });

  const advanceMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/projects/tasks/${milestoneId}/advance`, {
        role,
        method: "PATCH",
      }),
    onSuccess: async () => {
      await refreshMilestone();
    },
  });

  const milestone = milestoneQuery.data;

  const derived = useMemo(() => {
    if (!milestone) return null;

    const category = getMilestoneCategory(milestone);
    const status = getMilestoneStatus(milestone);
    const dependencyItems = splitDependencies(milestone.dependencies);
    const deliveryScore = makeDeliveryScore(milestone);
    const healthLabel = getHealthLabelFromScore(deliveryScore);
    const healthTone = getHealthToneFromScore(deliveryScore);
    const risk = getRiskLevel(milestone);
    const riskTone = getRiskTone(risk);

    const start = milestone.startDate ? new Date(milestone.startDate).getTime() : new Date(milestone.dueDate).getTime() - 21 * 24 * 60 * 60 * 1000;
    const due = new Date(milestone.dueDate).getTime();
    const now = Date.now();
    const expectedProgress = due > start ? Math.max(0, Math.min(100, Math.round(((now - start) / (due - start)) * 100))) : milestone.completion;
    const variance = milestone.completion - expectedProgress;
    const daysRemaining = daysUntil(milestone.dueDate);

    let approvalRisk = "Low";
    if (status === "Review" || category === "Approval") approvalRisk = "High";
    else if ((approvalsQuery.data?.summary.pending || 0) > 5) approvalRisk = "Moderate";

    const dependencyRisk = dependencyItems.length >= 2 ? "High" : dependencyItems.length === 1 ? "Moderate" : "Low";
    const scheduleRisk = daysRemaining < 0 ? "High" : daysRemaining <= 7 && milestone.completion < 80 ? "Moderate" : "Low";
    const executionRisk = milestone.priority === "High" && milestone.completion < 60 ? "High" : milestone.completion < 75 ? "Moderate" : "Low";

    return {
      category,
      status,
      dependencyItems,
      deliveryScore,
      healthLabel,
      healthTone,
      risk,
      riskTone,
      expectedProgress,
      variance,
      forecast: variance < -15 ? "At risk of slipping beyond current target." : "On pace with present execution momentum.",
      daysRemaining,
      approvalRisk,
      dependencyRisk,
      scheduleRisk,
      executionRisk,
      descriptionText: buildMilestoneDescription(milestone),
    };
  }, [approvalsQuery.data?.summary.pending, milestone]);

  const linkedTasks = useMemo(() => {
    if (!milestone || !tasksQuery.data) return [];
    return (tasksQuery.data.tasks as MilestoneTask[])
      .filter((task) => task.projectId === milestone.projectId && task.id !== milestone.id)
      .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())
      .slice(0, 6);
  }, [milestone, tasksQuery.data]);

  const executiveSummary = useMemo(() => {
    if (!milestone || !derived) return [];
    return [
      `${milestone.projectName} milestone is currently ${derived.status.toLowerCase()} with a delivery health score of ${derived.deliveryScore}/100.`,
      `${Math.max(0, derived.daysRemaining)} days remain before the current due date, with ${derived.dependencyItems.length} active dependency references.`,
      `${approvalsQuery.data?.summary.pending || 0} approvals remain in the queue, increasing governance sensitivity for review-based milestones.`,
      `${linkedTasks.length} linked project tasks sit in the adjacent execution stream and may affect readiness.`,
    ];
  }, [approvalsQuery.data?.summary.pending, derived, linkedTasks.length, milestone]);

  if (milestoneQuery.isLoading || tasksQuery.isLoading || projectsQuery.isLoading || usersQuery.isLoading || approvalsQuery.isLoading) {
    return <LoadingStateCard title="Loading Milestone Delivery Profile" />;
  }

  if (milestoneQuery.error || tasksQuery.error || projectsQuery.error || usersQuery.error || approvalsQuery.error || !milestone || !derived || !projectsQuery.data || !usersQuery.data) {
    return <ErrorStateCard message="Milestone details could not be retrieved from the ERP services." />;
  }

  return (
    <section className="space-y-8 pb-10">
      <Link href="/projects/milestones" className="inline-flex items-center gap-2 text-body text-text-muted hover:text-accent-primary transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Project Delivery Command Center
      </Link>

      <div className="flex flex-col gap-6 border-b border-border-soft pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="info">{milestone.projectName}</Badge>
            <Badge tone={toneForSeverity(milestone.priority)}>{milestone.priority} Priority</Badge>
            <Badge tone="info">{derived.category}</Badge>
            <Badge tone={toneForStatus(derived.status)}>{derived.status}</Badge>
          </div>
          <h1 className="text-page-title font-secondary text-text-primary">{milestone.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-body text-text-secondary">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              Owner: <span className="font-semibold text-text-primary">{milestone.ownerName}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Due: <span className="font-semibold text-text-primary">{formatDate(milestone.dueDate)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              Delivery Health Score: <span className="font-semibold text-text-primary">{derived.deliveryScore} / 100</span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => setIsEditDrawerOpen(true)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          {derived.status !== "Completed" ? (
            <Button loading={advanceMutation.isPending} onClick={() => advanceMutation.mutate()}>
              <Play className="h-4 w-4" />
              Advance Status
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() =>
              downloadTextFile(
                `milestone-${milestone.id}-report.txt`,
                [
                  "Milestone Delivery Report",
                  "",
                  `Title: ${milestone.title}`,
                  `Project: ${milestone.projectName}`,
                  `Owner: ${milestone.ownerName}`,
                  `Category: ${derived.category}`,
                  `Status: ${derived.status}`,
                  `Health Score: ${derived.deliveryScore}/100`,
                  `Due Date: ${formatDate(milestone.dueDate)}`,
                  "",
                  "Executive Summary",
                  ...executiveSummary.map((item) => `- ${item}`),
                ].join("\n"),
              )
            }
          >
            <Download className="h-4 w-4" />
            Generate Report
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm(`Delete milestone "${milestone.title}"?`)) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <Card className="overflow-hidden border border-accent-primary/12 bg-linear-to-r from-white via-white to-accent-primary/8">
            <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 xl:grid-cols-4">
              <ScoreTile label="Completion %" value={`${milestone.completion}%`} tone="info" />
              <ScoreTile label="Expected Progress" value={`${derived.expectedProgress}%`} tone="neutral" />
              <ScoreTile label="Variance" value={`${derived.variance >= 0 ? "+" : ""}${derived.variance}%`} tone={derived.variance >= 0 ? "success" : "error"} />
              <ScoreTile label="Milestone Health Score" value={`${derived.deliveryScore}`} tone={derived.healthTone} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-body leading-relaxed text-text-secondary">{derived.descriptionText}</p>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <MetaItem label="Project" value={milestone.projectName} />
                <MetaItem label="Owner" value={milestone.ownerName} />
                <MetaItem label="Priority" value={milestone.priority} />
                <MetaItem label="Category" value={derived.category} />
                <MetaItem label="Due Date" value={formatDate(milestone.dueDate)} />
                <MetaItem label="Status" value={derived.status} />
              </div>
              {milestone.notes ? (
                <div className="rounded-[20px] border border-border-soft bg-surface-secondary px-4 py-4">
                  <p className="text-label uppercase tracking-[0.14em] text-text-muted">Notes</p>
                  <p className="mt-2 text-body text-text-secondary whitespace-pre-line">{milestone.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-body text-text-secondary">
                  <span>Current completion</span>
                  <span className="font-semibold text-text-primary">{milestone.completion}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-hover">
                  <div className={`h-3 rounded-full ${milestone.completion >= 85 ? "bg-success" : milestone.completion >= 55 ? "bg-accent-primary" : "bg-warning"}`} style={{ width: `${milestone.completion}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ProgressCard title="Expected Progress" value={`${derived.expectedProgress}%`} description="Modelled from current start-to-due schedule span." />
                <ProgressCard title="Completion Forecast" value={derived.forecast} description="Forward-looking delivery commentary based on current variance." />
                <ProgressCard title="Schedule Variance" value={`${derived.variance >= 0 ? "+" : ""}${derived.variance}%`} description="Positive variance indicates delivery is ahead of target curve." />
                <ProgressCard title="Days Remaining" value={derived.daysRemaining < 0 ? `${Math.abs(derived.daysRemaining)} overdue` : `${derived.daysRemaining} days`} description="Time remaining before milestone due date." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dependency Tracker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetaItem label="Blocked By" value={derived.dependencyItems.length ? derived.dependencyItems.join(", ") : "No blockers"} />
                <MetaItem label="Blocks" value={linkedTasks.length ? `${linkedTasks.length} linked tasks` : "No downstream tasks"} />
                <MetaItem label="Dependency Status" value={derived.dependencyItems.length ? derived.dependencyRisk : "Clear"} />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {derived.dependencyItems.length ? (
                  derived.dependencyItems.map((dependency) => (
                    <div key={dependency} className="rounded-[20px] border border-border-soft bg-surface-secondary px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-body font-semibold text-text-primary">{dependency}</p>
                        <Badge tone={getRiskTone(derived.dependencyRisk)}>{derived.dependencyRisk}</Badge>
                      </div>
                      <p className="mt-2 text-body text-text-secondary">Visual dependency watch remains active until the upstream requirement is closed.</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-border-soft bg-surface-secondary px-4 py-6 text-center text-body text-text-muted md:col-span-2">
                    This milestone is not blocked by any declared dependency chain.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {linkedTasks.length ? (
                linkedTasks.map((task) => (
                  <div key={task.id} className="grid grid-cols-1 gap-3 rounded-[20px] border border-border-soft bg-surface-secondary px-4 py-4 md:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
                    <div>
                      <p className="text-body font-semibold text-text-primary">{task.title}</p>
                      <p className="mt-1 text-label text-text-muted">{task.projectName}</p>
                    </div>
                    <MetaCompact label="Owner" value={task.ownerName} />
                    <MetaCompact label="Status" value={task.status} />
                    <MetaCompact label="Progress" value={`${task.completion}%`} />
                    <MetaCompact label="Due Date" value={formatDate(task.dueDate)} />
                  </div>
                ))
              ) : (
                <p className="text-body text-text-muted">No related tasks were found for this milestone's project stream.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {milestone.documents?.length ? (
                milestone.documents.map((document) => (
                  <div key={document.id} className="flex flex-col gap-3 rounded-[20px] border border-border-soft bg-surface-secondary px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-body font-semibold text-text-primary">{document.name}</p>
                      <p className="mt-1 text-label text-text-muted">{document.size} uploaded on {formatDate(document.uploadedAt)}</p>
                    </div>
                    <a href={document.url} className="text-body font-medium text-accent-primary hover:underline">
                      Download
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-body text-text-muted">No documents are attached to this milestone yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Risk Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RiskRow label="Approval Risk" value={derived.approvalRisk} />
              <RiskRow label="Dependency Risk" value={derived.dependencyRisk} />
              <RiskRow label="Schedule Risk" value={derived.scheduleRisk} />
              <RiskRow label="Execution Risk" value={derived.executionRisk} />
              <RiskRow label="Overall Delivery Risk" value={derived.risk} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="relative ml-2 border-l-2 border-border-soft pl-6">
                {(milestone.activityTimeline || []).map((item) => (
                  <div key={item.id} className="relative mb-6 last:mb-0">
                    <span className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-surface bg-accent-primary shadow-soft" />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-body font-semibold text-text-primary">{item.title}</p>
                      <p className="text-label text-text-muted">{formatDate(item.timestamp)}</p>
                    </div>
                    <p className="mt-1 text-label text-text-muted">By {item.actorName}</p>
                    <p className="mt-2 text-body text-text-secondary">{item.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {milestone.history?.length ? (
                milestone.history.map((entry, index) => (
                  <div key={`${entry.timestamp}-${index}`} className="rounded-[18px] border border-border-soft bg-surface-secondary px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-body font-semibold text-text-primary">{entry.actorName}</p>
                      <p className="text-label text-text-muted">{formatDate(entry.timestamp)}</p>
                    </div>
                    <p className="mt-2 text-body text-text-secondary">{entry.change}</p>
                  </div>
                ))
              ) : (
                <p className="text-body text-text-muted">No audit history is currently recorded for this milestone.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-accent-primary/12 bg-linear-to-br from-white via-white to-accent-primary/6">
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {executiveSummary.map((item) => (
                <p key={item} className="text-body text-text-secondary">
                  {item}
                </p>
              ))}
              <div className="border-t border-border-soft pt-4">
                <p className="text-label text-text-muted">Last updated from delivery records just now.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {milestone.comments?.length ? (
                milestone.comments.map((comment) => (
                  <div key={comment.id} className="rounded-[18px] border border-border-soft bg-surface-secondary px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-body font-semibold text-text-primary">
                        {comment.authorName} <span className="text-label text-text-muted">({comment.authorRole})</span>
                      </p>
                      <p className="text-label text-text-muted">{formatDate(comment.timestamp)}</p>
                    </div>
                    <p className="mt-2 text-body text-text-secondary">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-body text-text-muted">No milestone commentary has been posted yet.</p>
              )}
              <div className="border-t border-border-soft pt-4">
                <label className="text-label text-text-secondary">Add update</label>
                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  className={`${textareaClassName} mt-2`}
                  placeholder="Post a delivery update, escalation note, or review summary."
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={() => {
                      if (commentText.trim()) {
                        updateMutation.mutate({ commentText });
                      }
                    }}
                    loading={updateMutation.isPending}
                  >
                    Save Note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Drawer open={isEditDrawerOpen} title="Edit Milestone" size="xl" onClose={() => setIsEditDrawerOpen(false)}>
        <div className="space-y-6">
          <p className="border-b border-border-soft pb-4 text-body text-text-muted">
            Update milestone scope, delivery assumptions, ownership, completion, and dependency posture.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Project">
              <select value={editForm.projectId} onChange={(event) => setEditForm((current) => ({ ...current, projectId: event.target.value }))} className={selectClassName}>
                {projectsQuery.data.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Milestone Title">
              <Input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} className={textareaClassName} />
            </Field>
            <Field label="Category">
              <select value={editForm.category} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))} className={selectClassName}>
                {milestoneCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Owner">
              <select value={editForm.ownerId} onChange={(event) => setEditForm((current) => ({ ...current, ownerId: event.target.value }))} className={selectClassName}>
                {usersQuery.data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select value={editForm.priority} onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value }))} className={selectClassName}>
                {milestonePriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due Date">
              <Input type="date" value={editForm.dueDate} onChange={(event) => setEditForm((current) => ({ ...current, dueDate: event.target.value }))} />
            </Field>
            <Field label="Dependencies">
              <Input value={editForm.dependencies} onChange={(event) => setEditForm((current) => ({ ...current, dependencies: event.target.value }))} />
            </Field>
            <Field label="Completion %" >
              <Input
                type="number"
                min={0}
                max={100}
                value={editForm.completion}
                onChange={(event) => setEditForm((current) => ({ ...current, completion: Number(event.target.value) }))}
              />
            </Field>
            <Field label="Notes" className="md:col-span-2">
              <textarea value={editForm.notes} onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))} className={textareaClassName} />
            </Field>
          </div>
          <div className="flex justify-end gap-3 border-t border-border-soft pt-6">
            <Button variant="ghost" onClick={() => setIsEditDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateMutation.mutate({
                  title: editForm.title,
                  description: editForm.description,
                  projectId: editForm.projectId,
                  ownerId: editForm.ownerId,
                  discipline: editForm.category,
                  priority: editForm.priority,
                  dueDate: editForm.dueDate,
                  dependencies: editForm.dependencies,
                  notes: editForm.notes,
                  completion: editForm.completion,
                })
              }
              loading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Drawer>
    </section>
  );
}

function ScoreTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "info" | "warning" | "success" | "error";
}) {
  const color =
    tone === "success" ? "text-success" :
    tone === "warning" ? "text-warning" :
    tone === "error" ? "text-error" :
    tone === "info" ? "text-accent-primary" :
    "text-text-primary";

  return (
    <div className="rounded-[20px] border border-border-soft bg-surface px-4 py-4 shadow-soft">
      <p className="text-label uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className={`mt-2 text-[30px] font-bold leading-none tracking-[-0.03em] ${color}`}>{value}</p>
    </div>
  );
}

function ProgressCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[20px] border border-border-soft bg-surface-secondary px-4 py-4">
      <p className="text-label uppercase tracking-[0.14em] text-text-muted">{title}</p>
      <p className="mt-2 text-card-title text-text-primary">{value}</p>
      <p className="mt-2 text-body text-text-secondary">{description}</p>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-border-soft bg-surface-secondary px-4 py-4">
      <p className="text-label uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className="mt-2 text-body font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function MetaCompact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-label text-text-muted">{label}</p>
      <p className="mt-1 text-body font-medium text-text-primary">{value}</p>
    </div>
  );
}

function RiskRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-border-soft bg-surface-secondary px-4 py-4">
      <p className="text-body text-text-secondary">{label}</p>
      <Badge tone={getRiskTone(value)}>{value}</Badge>
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
