"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  MessageSquare,
  Paperclip,
  Play,
  Plus,
  AlertTriangle,
  Trash2,
  TrendingUp,
  User,
  ShieldAlert,
  History as HistoryIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatDate, toneForSeverity, toneForStatus } from "@/lib/erp-utils";
import type {
  ProjectTask,
  PropertySummaryResponse,
  UserDirectoryResponse,
} from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";
const textareaClassName =
  "min-h-[104px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

type ActivityTimelineEntry = {
  id: string;
  eventType: string;
  title: string;
  detail: string;
  timestamp: string;
  actorName: string;
};

type HistoryEntry = {
  timestamp: string;
  actorName: string;
  change: string;
};

type TaskDetail = ProjectTask & {
  description: string;
  startDate: string;
  dependencies: string;
  notes: string;
  comments: Array<{ id: string; authorName: string; authorRole: string; text: string; timestamp: string }>;
  documents: Array<{ id: string; name: string; url: string; size: string; uploadedAt: string }>;
  activityTimeline: ActivityTimelineEntry[];
  history: HistoryEntry[];
};

type TaskDetailResponse = {
  success: boolean;
  message: string;
  data: TaskDetail;
};

export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  const router = useRouter();
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  // Local state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "comments" | "documents">("overview");
  
  // Quick inputs
  const [progressInput, setProgressInput] = useState<number>(0);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  
  const [commentText, setCommentText] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    projectId: "",
    ownerId: "",
    discipline: "Civil",
    priority: "Medium",
    startDate: "",
    dueDate: "",
    completion: 0,
    dependencies: "",
    notes: "",
  });

  // Queries
  const taskQuery = useQuery({
    queryKey: ["erp-project-task-detail", taskId, role],
    queryFn: async () => (await apiRequest<TaskDetail>(`/api/projects/tasks/${taskId}`, { role })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const usersQuery = useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });

  // Load task into forms
  useEffect(() => {
    if (taskQuery.data) {
      const task = taskQuery.data;
      setProgressInput(task.completion);
      setEditForm({
        title: task.title,
        description: task.description || "",
        projectId: task.projectId,
        ownerId: task.ownerId,
        discipline: task.discipline,
        priority: task.priority,
        startDate: task.startDate ? task.startDate.split("T")[0] : "",
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        completion: task.completion,
        dependencies: task.dependencies || "",
        notes: task.notes || "",
      });
    }
  }, [taskQuery.data]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<TaskDetail> & { commentText?: string; document?: any }) =>
      apiRequest(`/api/projects/tasks/${taskId}`, {
        role,
        method: "PATCH",
        body: payload,
      }),
    onSuccess: async () => {
      setIsEditDrawerOpen(false);
      setIsUpdatingProgress(false);
      setCommentText("");
      await queryClient.invalidateQueries({ queryKey: ["erp-project-task-detail", taskId] });
      await queryClient.invalidateQueries({ queryKey: ["erp-project-tasks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/projects/tasks/${taskId}`, {
        role,
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-project-tasks"] });
      router.push("/projects/tasks");
    },
  });

  const advanceMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/projects/tasks/${taskId}/advance`, {
        role,
        method: "PATCH",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-project-task-detail", taskId] });
      await queryClient.invalidateQueries({ queryKey: ["erp-project-tasks"] });
    },
  });

  // Calculations
  const task = taskQuery.data;
  
  // Progress calculations
  const progressMetrics = useMemo(() => {
    if (!task) return { expected: 0, variance: 0, forecast: "N/A" };
    
    const start = new Date(task.startDate || task.dueDate).getTime();
    const due = new Date(task.dueDate).getTime();
    const now = Date.now();
    
    let expected = 0;
    if (due > start) {
      expected = Math.round(((now - start) / (due - start)) * 100);
      expected = Math.max(0, Math.min(100, expected));
    }
    
    const variance = task.completion - expected;
    
    // Forecast completion
    let forecast = formatDate(task.dueDate);
    if (variance < -15 && task.status !== "Done") {
      const daysRemaining = Math.max(1, Math.round((due - now) / (24 * 60 * 60 * 1000)));
      const actualDailyRate = task.completion / Math.max(1, Math.round((now - start) / (24 * 60 * 60 * 1000)));
      if (actualDailyRate > 0) {
        const remainingProgress = 100 - task.completion;
        const forecastedDays = Math.round(remainingProgress / actualDailyRate);
        const forecastDate = new Date(now + forecastedDays * 24 * 60 * 60 * 1000);
        forecast = formatDate(forecastDate.toISOString());
      }
    }
    
    return {
      expected,
      variance,
      forecast,
    };
  }, [task]);

  // Risk scores
  const risks = useMemo(() => {
    if (!task) return { delay: "Low", delayTone: "success", dependency: "Low", dependencyTone: "success", resource: "Low", resourceTone: "success", review: "Low", reviewTone: "success", overall: 100 };
    
    const isOverdue = task.status !== "Done" && new Date(task.dueDate).getTime() < Date.now();
    const daysRemaining = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    
    // Delay Risk
    let delay = "Low";
    let delayTone = "success";
    if (isOverdue) {
      delay = "High";
      delayTone = "error";
    } else if (task.status !== "Done" && daysRemaining <= 3 && task.completion < 80) {
      delay = "Medium";
      delayTone = "warning";
    }
    
    // Dependency Risk
    const hasDeps = !!task.dependencies;
    const dependency = hasDeps ? "Medium" : "Low";
    const dependencyTone = hasDeps ? "warning" : "success";
    
    // Resource Risk (Mocking resource workload based on task counts)
    const resource = task.priority === "High" && task.status !== "Done" ? "Medium" : "Low";
    const resourceTone = task.priority === "High" && task.status !== "Done" ? "warning" : "success";
    
    // Review Risk
    let review = "Low";
    let reviewTone = "success";
    if (task.status === "Review") {
      review = "Medium";
      reviewTone = "warning";
    }

    // Overall Execution Health score
    let overall = 100;
    if (delay === "High") overall -= 40;
    else if (delay === "Medium") overall -= 20;
    
    if (dependency === "Medium") overall -= 10;
    if (resource === "Medium") overall -= 10;
    if (review === "Medium") overall -= 10;
    
    overall = Math.max(0, overall);

    return {
      delay,
      delayTone,
      dependency,
      dependencyTone,
      resource,
      resourceTone,
      review,
      reviewTone,
      overall,
    };
  }, [task]);

  if (taskQuery.isLoading || projectsQuery.isLoading || usersQuery.isLoading) {
    return <LoadingStateCard title="Loading Task Execution Detail" />;
  }

  if (taskQuery.error || !task || !projectsQuery.data || !usersQuery.data) {
    return <ErrorStateCard message="Task details could not be retrieved from the server." />;
  }

  // Comments submit
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    updateMutation.mutate({ commentText });
  };

  // Document uploader
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      uploadMockFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      uploadMockFile(file);
    }
  };

  const uploadMockFile = (file: File) => {
    updateMutation.mutate({
      document: {
        name: file.name,
        url: "#",
        size: `${(file.size / 1024).toFixed(1)} KB`,
      },
    });
  };

  const handleQuickProgressUpdate = () => {
    updateMutation.mutate({ completion: progressInput });
  };

  return (
    <section className="space-y-8 animate-page-in">
      
      {/* NAVIGATION CRUMB */}
      <Link href="/projects/tasks" className="inline-flex items-center gap-2 text-body text-text-muted hover:text-accent-primary transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks Dashboard
      </Link>

      {/* TASK DETAIL HEADER */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border-soft pb-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={(task.status === "Done" ? "success" : toneForStatus(task.status))}>
              {task.status}
            </Badge>
            <Badge tone={toneForSeverity(task.priority)}>
              {task.priority} Priority
            </Badge>
            <span className="text-body text-text-muted">|</span>
            <span className="text-body font-semibold text-text-secondary">{task.projectName}</span>
          </div>
          
          <h1 className="text-page-title font-secondary text-text-primary">{task.title}</h1>
          
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Owner: <span className="font-semibold text-text-primary">{task.ownerName}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Due: <span className="font-semibold text-text-primary">{formatDate(task.dueDate)}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" />
              Execution Health: <span className={`font-semibold ${risks.overall > 85 ? 'text-success' : risks.overall > 70 ? 'text-warning' : 'text-error'}`}>{risks.overall} / 100</span>
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => setIsEditDrawerOpen(true)}>
            <Edit className="h-4 w-4" />
            Edit Task
          </Button>
          
          {task.status !== "Done" && (
            <Button variant="primary" loading={advanceMutation.isPending} onClick={() => advanceMutation.mutate()}>
              <Play className="h-4 w-4" />
              Advance Status
            </Button>
          )}

          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => {
            if (confirm("Are you sure you want to delete this task?")) {
              deleteMutation.mutate();
            }
          }}>
            <Trash2 className="h-4 w-4" />
            Delete Task
          </Button>
        </div>
      </div>

      {/* CORE CONTENT GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* LEFT TWO COLUMNS: Metrics, Comments, Documents */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* PROGRESS TRACKING WIDGET */}
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent-primary" />
                Progress Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                
                {/* Current */}
                <div className="bg-surface-secondary p-4 rounded-xl text-center">
                  <span className="text-xs text-text-muted block mb-1">Current Progress</span>
                  <span className="text-3xl font-bold text-accent-primary">{task.completion}%</span>
                </div>

                {/* Expected */}
                <div className="bg-surface-secondary p-4 rounded-xl text-center">
                  <span className="text-xs text-text-muted block mb-1">Expected Progress</span>
                  <span className="text-3xl font-bold text-text-primary">{progressMetrics.expected}%</span>
                </div>

                {/* Variance */}
                <div className="bg-surface-secondary p-4 rounded-xl text-center">
                  <span className="text-xs text-text-muted block mb-1">Schedule Variance</span>
                  <span className={`text-3xl font-bold ${progressMetrics.variance >= 0 ? "text-success" : "text-error"}`}>
                    {progressMetrics.variance >= 0 ? `+${progressMetrics.variance}` : progressMetrics.variance}%
                  </span>
                </div>

                {/* Forecast Date */}
                <div className="bg-surface-secondary p-4 rounded-xl text-center">
                  <span className="text-xs text-text-muted block mb-1">Forecast Completion</span>
                  <span className="text-body font-bold text-text-primary block mt-2 truncate">{progressMetrics.forecast}</span>
                </div>

              </div>

              {/* Progress slider input */}
              <div className="flex items-center gap-4 pt-4 border-t border-border-soft">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text-secondary">Quick Progress Update</span>
                    <span className="text-text-primary">{progressInput}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressInput}
                    onChange={(e) => setProgressInput(Number(e.target.value))}
                    className="w-full h-2 bg-hover rounded-lg appearance-none cursor-pointer accent-accent-primary"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-10 mt-6 shrink-0" loading={updateMutation.isPending} onClick={handleQuickProgressUpdate}>
                  Update Progress
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* RISK ASSESSMENT */}
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-accent-primary" />
                Execution Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                
                {/* Delay Risk */}
                <div className="p-4 rounded-xl border border-border-soft">
                  <span className="text-xs text-text-muted block mb-1">Delay Risk</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary">{risks.delay}</span>
                    <Badge tone={risks.delayTone as any}>{risks.delay}</Badge>
                  </div>
                </div>

                {/* Dependency Risk */}
                <div className="p-4 rounded-xl border border-border-soft">
                  <span className="text-xs text-text-muted block mb-1">Dependency Risk</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary">{risks.dependency}</span>
                    <Badge tone={risks.dependencyTone as any}>{risks.dependency}</Badge>
                  </div>
                </div>

                {/* Resource Risk */}
                <div className="p-4 rounded-xl border border-border-soft">
                  <span className="text-xs text-text-muted block mb-1">Resource Overload</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary">{risks.resource}</span>
                    <Badge tone={risks.resourceTone as any}>{risks.resource}</Badge>
                  </div>
                </div>

                {/* Review Risk */}
                <div className="p-4 rounded-xl border border-border-soft">
                  <span className="text-xs text-text-muted block mb-1">Review Bottleneck</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary">{risks.review}</span>
                    <Badge tone={risks.reviewTone as any}>{risks.review}</Badge>
                  </div>
                </div>

              </div>

              <div className="bg-surface-secondary p-4 rounded-xl flex items-center justify-between text-body">
                <span className="text-text-secondary">Combined Task Health Score:</span>
                <span className={`font-bold text-lg ${risks.overall > 85 ? 'text-success' : risks.overall > 70 ? 'text-warning' : 'text-error'}`}>
                  {risks.overall} / 100 ({risks.overall > 85 ? 'Stable' : risks.overall > 70 ? 'Watch' : 'Critical'})
                </span>
              </div>
            </CardContent>
          </Card>

          {/* COMMENTS & DOCUMENTS SECTION */}
          <Card className="surface-card">
            
            {/* TAB SELECTOR */}
            <div className="flex border-b border-border-soft bg-surface-secondary p-1 rounded-t-[var(--radius-card)]">
              <button
                className={`flex-1 py-3 text-body font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "overview" ? "bg-surface text-text-primary shadow-soft" : "text-text-secondary hover:bg-hover"}`}
                onClick={() => setActiveTab("overview")}
              >
                <FileText className="h-4 w-4" />
                Task Overview
              </button>
              <button
                className={`flex-1 py-3 text-body font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "comments" ? "bg-surface text-text-primary shadow-soft" : "text-text-secondary hover:bg-hover"}`}
                onClick={() => setActiveTab("comments")}
              >
                <MessageSquare className="h-4 w-4" />
                Comments ({task.comments?.length || 0})
              </button>
              <button
                className={`flex-1 py-3 text-body font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "documents" ? "bg-surface text-text-primary shadow-soft" : "text-text-secondary hover:bg-hover"}`}
                onClick={() => setActiveTab("documents")}
              >
                <Paperclip className="h-4 w-4" />
                Documents ({task.documents?.length || 0})
              </button>
            </div>

            <CardContent className="p-6">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-text-primary text-body">Description</h3>
                    <p className="text-body text-text-secondary leading-relaxed whitespace-pre-line">
                      {task.description || "No description provided for this execution task."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 pt-6 border-t border-border-soft">
                    <div className="space-y-1">
                      <span className="text-xs text-text-muted block">Discipline Scope</span>
                      <span className="text-body font-semibold text-text-primary">{task.discipline}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-text-muted block">Associated Project</span>
                      <span className="text-body font-semibold text-text-primary">{task.projectName}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-text-muted block">Start Date</span>
                      <span className="text-body font-semibold text-text-primary">{task.startDate ? formatDate(task.startDate) : "Not Set"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-text-muted block">Target Due Date</span>
                      <span className="text-body font-semibold text-text-primary">{formatDate(task.dueDate)}</span>
                    </div>
                  </div>

                  {task.notes && (
                    <div className="bg-surface-secondary/70 p-4 rounded-xl border border-border-soft space-y-1">
                      <span className="text-xs text-text-muted block font-semibold">Execution Field Notes</span>
                      <p className="text-body text-text-secondary whitespace-pre-line">{task.notes}</p>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: COMMENTS */}
              {activeTab === "comments" && (
                <div className="space-y-6">
                  
                  {/* Comments Thread */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto scroll-root pr-2">
                    {task.comments && task.comments.length > 0 ? (
                      task.comments.map((comment) => (
                        <div key={comment.id} className="bg-surface-secondary/50 p-4 rounded-xl border border-border-soft space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-text-primary">
                              {comment.authorName} <span className="text-text-muted font-normal">({comment.authorRole})</span>
                            </span>
                            <span className="text-text-muted">{formatDate(comment.timestamp)}</span>
                          </div>
                          <p className="text-body text-text-secondary">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-body text-text-muted text-center py-6">
                        No team comments yet. Start the conversation.
                      </p>
                    )}
                  </div>

                  {/* Comment input form */}
                  <form onSubmit={handleCommentSubmit} className="space-y-3 pt-4 border-t border-border-soft">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className={textareaClassName}
                      placeholder="Post a progress update or task notes..."
                      required
                    />
                    <div className="flex justify-end">
                      <Button type="submit" loading={updateMutation.isPending}>
                        Submit Comment
                      </Button>
                    </div>
                  </form>

                </div>
              )}

              {/* TAB 3: DOCUMENTS */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  
                  {/* Document list */}
                  <div className="space-y-3 max-h-[200px] overflow-y-auto scroll-root pr-2">
                    {task.documents && task.documents.length > 0 ? (
                      task.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border-soft bg-surface hover:bg-hover transition-colors text-body">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-accent-primary shrink-0" />
                            <div className="truncate max-w-[250px]">
                              <span className="font-semibold text-text-primary block truncate">{doc.name}</span>
                              <span className="text-xs text-text-muted">{doc.size} • Uploaded {formatDate(doc.uploadedAt)}</span>
                            </div>
                          </div>
                          <a href={doc.url} download className="text-xs text-accent-primary font-semibold hover:underline">
                            Download
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-body text-text-muted text-center py-6">
                        No documents attached. Upload specifications, receipts, or checklist PDFs below.
                      </p>
                    )}
                  </div>

                  {/* Drag and drop file uploader */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragActive ? 'border-accent-primary bg-accent-primary/5' : 'border-border-soft bg-surface-secondary/40 hover:bg-surface-secondary/80'}`}
                  >
                    <Paperclip className="h-8 w-8 text-text-muted mb-2" />
                    <span className="text-body font-semibold text-text-primary block mb-1">
                      Drag & drop your files here
                    </span>
                    <span className="text-xs text-text-muted block mb-4">
                      Supports PDF, PNG, JPG, CAD (Max 10MB)
                    </span>
                    
                    <label className="inline-flex items-center justify-center h-10 px-4 rounded-[var(--radius-button)] bg-accent-primary text-white text-body font-medium hover:bg-accent-primary-hover cursor-pointer">
                      Browse Files
                      <input type="file" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>

                </div>
              )}

            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: Activity, Dependencies, History */}
        <div className="space-y-8">
          
          {/* ACTIVITY TIMELINE */}
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent-primary" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 max-h-[350px] overflow-y-auto scroll-root pr-2">
              
              <div className="relative border-l-2 border-border-soft pl-6 space-y-6 ml-2">
                {task.activityTimeline && task.activityTimeline.map((item) => (
                  <div key={item.id} className="relative text-body space-y-1">
                    
                    {/* Timeline bullet */}
                    <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-surface bg-accent-primary shadow-soft" />
                    
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-text-primary">{item.title}</span>
                      <span className="text-xs text-text-muted">{formatDate(item.timestamp)}</span>
                    </div>
                    <p className="text-xs text-text-muted">By {item.actorName}</p>
                    <p className="text-body text-text-secondary pt-1 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>

          {/* DEPENDENCIES */}
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-accent-primary" />
                Dependencies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-body text-text-secondary">
              {task.dependencies ? (
                <div className="p-3 rounded-lg bg-surface-secondary/70 border border-border-soft space-y-1">
                  <span className="text-xs text-text-muted uppercase font-semibold block">Prerequisite Tasks</span>
                  <span className="font-semibold text-text-primary block">{task.dependencies}</span>
                  <span className="text-xs text-text-muted block">Must achieve 100% completion before closing current task scope.</span>
                </div>
              ) : (
                <p className="text-center py-4 text-text-muted text-xs">
                  No blockers or prerequisite dependencies set.
                </p>
              )}
            </CardContent>
          </Card>

          {/* HISTORY CHANGE LOG */}
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HistoryIcon className="h-5 w-5 text-accent-primary" />
                Task History Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[200px] overflow-y-auto scroll-root pr-2">
              {task.history && task.history.length > 0 ? (
                <div className="space-y-3 text-xs">
                  {task.history.map((log, idx) => (
                    <div key={idx} className="pb-3 border-b border-border-soft last:border-b-0 space-y-1">
                      <div className="flex justify-between text-text-muted">
                        <span>{log.actorName}</span>
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                      <p className="text-text-secondary">{log.change}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-text-muted text-xs">
                  No audit edits recorded.
                </p>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

      {/* EDIT FORM DRAWER (md size) */}
      <Drawer
        open={isEditDrawerOpen}
        title="Edit Execution Task"
        size="md"
        onClose={() => setIsEditDrawerOpen(false)}
      >
        <div className="space-y-6">
          <p className="text-body text-text-muted pb-4 border-b border-border-soft">
            Modify details, schedules, disciplines, or assignments for this task.
          </p>
          
          <div className="space-y-4">
            
            {/* Project selection */}
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Project</label>
              <select
                value={editForm.projectId}
                onChange={(e) => setEditForm((curr) => ({ ...curr, projectId: e.target.value }))}
                className={selectClassName}
              >
                {projectsQuery.data?.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Title */}
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Task Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((curr) => ({ ...curr, title: e.target.value }))}
                placeholder="e.g. Cast structural columns"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((curr) => ({ ...curr, description: e.target.value }))}
                className={textareaClassName}
                placeholder="Detailed scope, materials required, location details..."
              />
            </div>

            {/* Discipline */}
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Discipline</label>
              <select
                value={editForm.discipline}
                onChange={(e) => setEditForm((curr) => ({ ...curr, discipline: e.target.value }))}
                className={selectClassName}
              >
                <option value="Civil">Civil</option>
                <option value="Electrical">Electrical</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Finishing">Finishing</option>
                <option value="Procurement">Procurement</option>
                <option value="Quality">Quality</option>
              </select>
            </div>

            {/* Owner selection */}
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Assigned User</label>
              <select
                value={editForm.ownerId}
                onChange={(e) => setEditForm((curr) => ({ ...curr, ownerId: e.target.value }))}
                className={selectClassName}
              >
                {usersQuery.data?.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.designation})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority selection */}
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Priority</label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm((curr) => ({ ...curr, priority: e.target.value }))}
                className={selectClassName}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Completion progress */}
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Progress %</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={editForm.completion}
                onChange={(e) => setEditForm((curr) => ({ ...curr, completion: Number(e.target.value) }))}
              />
            </div>

            {/* Start date */}
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Start Date</label>
              <Input
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm((curr) => ({ ...curr, startDate: e.target.value }))}
              />
            </div>

            {/* Due date */}
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Due Date</label>
              <Input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm((curr) => ({ ...curr, dueDate: e.target.value }))}
              />
            </div>

            {/* Dependencies */}
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Dependencies</label>
              <Input
                value={editForm.dependencies}
                onChange={(e) => setEditForm((curr) => ({ ...curr, dependencies: e.target.value }))}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Execution Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm((curr) => ({ ...curr, notes: e.target.value }))}
                className={textareaClassName}
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border-soft">
            <Button variant="ghost" onClick={() => setIsEditDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => updateMutation.mutate(editForm)} loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      </Drawer>

    </section>
  );
}
