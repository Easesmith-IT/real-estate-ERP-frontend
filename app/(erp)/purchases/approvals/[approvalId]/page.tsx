"use client";
import { toast } from "@/components/ui/toast";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Siren,
  Send,
  ArrowUpRight
} from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatCurrency, formatDate, formatDateTime, toneForSeverity, toneForStatus } from "@/lib/erp-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EnterprisePageLoader } from "@/components/ui/loaders";

interface TimelineEvent {
  id: string;
  event: string;
  status: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  notes: string;
}

interface CommentItem {
  id: string;
  actorId: string;
  actorName: string;
  content: string;
  timestamp: string;
}

interface LinkedEntity {
  id: string;
  type: string;
  code: string;
  vendorName: string;
  amount: number;
  status: string;
  itemsCount: number;
  date: string;
  details?: string;
}

interface ApprovalDetailsResponse {
  id: string;
  title: string;
  module: string;
  requestType: string;
  priority: string;
  status: string;
  requestedBy: string;
  requestedByName: string;
  ownerId: string;
  ownerName: string;
  submittedAt: string;
  dueAt: string;
  summary: string;
  actedAt?: string | null;
  actedBy?: string | null;
  actedByName?: string | null;
  timeline: TimelineEvent[];
  comments: CommentItem[];
  linkedEntitySummary: LinkedEntity | null;
  approvalMetrics: {
    daysOpen: number;
    slaStatus: string;
    actionTime: string;
    businessImpact: string;
  };
}

export default function Page({ params }: { params: Promise<{ approvalId: string }> }) {
  const { approvalId } = use(params);
  const router = useRouter();
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"overview" | "entity" | "timeline" | "comments" | "risk">("overview");
  const [commentText, setCommentText] = useState("");
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignTo, setReassignTo] = useState("user-manager");

  // Action Modals
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    action: "approve" | "reject";
    title: string;
    reason?: string;
  } | null>(null);

  // Fetch approval details
  const query = useQuery({
    queryKey: ["erp-approval-details", approvalId, role],
    queryFn: async () => (await apiRequest<ApprovalDetailsResponse>(`/api/admin/approvals/${approvalId}`, { role })).data,
  });

  // Action Mutation
  const actionMutation = useMutation({
    mutationFn: async ({ action, reason }: { action: "approve" | "reject"; reason?: string }) =>
      apiRequest(`/api/admin/approvals/${approvalId}`, {
        role,
        method: "PATCH",
        body: { action, reason },
      }),
    onSuccess: async () => {
      setActionModal(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-approval-details", approvalId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-approvals"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  // Comment Mutation
  const commentMutation = useMutation({
    mutationFn: async (comment: string) =>
      apiRequest(`/api/admin/approvals/${approvalId}`, {
        role,
        method: "PATCH",
        body: { action: "comment", comment },
      }),
    onSuccess: async () => {
      setCommentText("");
      await queryClient.invalidateQueries({ queryKey: ["erp-approval-details", approvalId] });
    },
  });

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  const handleAction = (action: "approve" | "reject") => {
    actionMutation.mutate({
      action,
      reason: actionModal?.reason
    });
  };

  const handleReassign = () => {
    toast.info(`Reassigning approval to user: ${reassignTo}`);
    setIsReassigning(false);
  };

  if (query.isLoading) {
    return <EnterprisePageLoader title="Loading Approval Workspace" variant="generic" />;
  }

  if (query.error || !query.data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4 rounded-xl border border-border-soft bg-surface p-12 text-center shadow-soft">
        <ShieldAlert className="h-12 w-12 text-accent-critical" />
        <h3 className="text-section-title font-medium text-text-primary">Approval Not Found</h3>
        <p className="max-w-md text-body text-text-muted">The approval request ID you are trying to view does not exist or has been deleted.</p>
        <Button onClick={() => router.push("/purchases/approvals")}>Back to Command Center</Button>
      </div>
    );
  }

  const approval = query.data;
  const metrics = approval.approvalMetrics;
  const linked = approval.linkedEntitySummary;

  return (
    <section className="space-y-8 pb-12">
      {/* BACK NAVIGATION */}
      <div className="flex items-center">
        <button
          onClick={() => router.push("/purchases/approvals")}
          className="inline-flex items-center gap-1.5 text-body font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Command Center
        </button>
      </div>

      {/* SECTION 1: HEADER */}
      <div className="flex flex-col gap-5 border-b border-border-soft pb-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-label text-text-muted bg-surface-secondary px-2 py-0.5 rounded border border-border-soft">
              {approval.id}
            </span>
            <Badge tone={toneForSeverity(approval.priority)}>{approval.priority} Priority</Badge>
            <Badge tone={toneForStatus(approval.status)}>{approval.status}</Badge>
          </div>
          
          <h1 className="text-page-title font-secondary text-text-primary">{approval.title}</h1>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 max-w-xl text-body text-text-secondary md:grid-cols-4">
            <div>
              <span className="text-label text-text-muted block">Requestor</span>
              <span className="font-medium text-text-primary">{approval.requestedByName}</span>
            </div>
            <div>
              <span className="text-label text-text-muted block">Owner</span>
              <span className="font-medium text-text-primary">{approval.ownerName}</span>
            </div>
            <div>
              <span className="text-label text-text-muted block">Submitted</span>
              <span className="font-medium text-text-primary">{formatDate(approval.submittedAt)}</span>
            </div>
            <div>
              <span className="text-label text-text-muted block">Due Date</span>
              <span className="font-medium text-text-primary">{formatDate(approval.dueAt)}</span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {approval.status === "Pending" ? (
            <>
              <Button
                variant="primary"
                onClick={() => setActionModal({
                  open: true,
                  action: "approve",
                  title: "Approve Request",
                  reason: ""
                })}
                className="hover:shadow-soft"
              >
                Approve
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setActionModal({
                  open: true,
                  action: "reject",
                  title: "Reject Request",
                  reason: ""
                })}
                className="text-accent-critical hover:bg-red-50 border border-border-soft"
              >
                Reject
              </Button>

              <Button
                variant="secondary"
                onClick={() => setIsReassigning(true)}
                className="border border-border-soft"
              >
                Reassign
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-surface-secondary/40 border border-border-soft px-4 py-2.5 rounded-lg text-body text-text-muted">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
              <span>Handled by <span className="font-semibold text-text-primary">{approval.actedByName || "Approver"}</span> on {approval.actedAt && formatDate(approval.actedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: APPROVAL HEALTH CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Days Open */}
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-1">
            <span className="text-label font-medium text-text-muted uppercase">Days Open</span>
            <p className="text-section-title font-bold text-text-primary">{metrics.daysOpen} Days</p>
            <p className="text-xs text-text-secondary">Since submission window</p>
          </CardContent>
        </Card>

        {/* SLA Status */}
        <Card className={`shadow-soft border-l-4 ${
          metrics.slaStatus === "Overdue" ? "border-l-red-500 bg-red-50/10" :
          metrics.slaStatus === "Due Soon" ? "border-l-amber-500 bg-amber-50/10" : "border-l-emerald-500 bg-emerald-50/10"
        }`}>
          <CardContent className="p-4 space-y-1">
            <span className="text-label font-medium text-text-muted uppercase">SLA Status</span>
            <p className={`text-section-title font-bold ${
              metrics.slaStatus === "Overdue" ? "text-red-600" :
              metrics.slaStatus === "Due Soon" ? "text-amber-600" : "text-emerald-600"
            }`}>{metrics.slaStatus}</p>
            <p className="text-xs text-text-secondary">Based on compliance limits</p>
          </CardContent>
        </Card>

        {/* Linked Items */}
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-1">
            <span className="text-label font-medium text-text-muted uppercase">Linked Items</span>
            <p className="text-section-title font-bold text-text-primary">
              {linked ? "1 Document" : "0 Documents"}
            </p>
            <p className="text-xs text-text-secondary">{linked?.type || "No direct links"}</p>
          </CardContent>
        </Card>

        {/* Action Time */}
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-1">
            <span className="text-label font-medium text-text-muted uppercase">Response Age</span>
            <p className="text-section-title font-bold text-text-primary">{metrics.actionTime}</p>
            <p className="text-xs text-text-secondary">Average review cycle duration</p>
          </CardContent>
        </Card>

        {/* Business Impact */}
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-1">
            <span className="text-label font-medium text-text-muted uppercase">Business Risk</span>
            <p className="text-body font-bold text-text-primary line-clamp-1">{metrics.businessImpact}</p>
            <p className="text-xs text-text-secondary">Impact level on operations</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: TABBED LAYOUT */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Left main workspace */}
        <div className="space-y-6">
          {/* Tab Control */}
          <div className="flex border-b border-border-soft gap-6">
            {(["overview", "entity", "timeline", "comments", "risk"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3.5 text-body font-semibold border-b-2 transition-all capitalize ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab === "entity" ? "Linked Entity" : tab === "risk" ? "Risk Assessment" : tab}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <Card className="shadow-soft">
            <CardContent className="p-6">
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <h3 className="text-body font-semibold text-text-primary">Approval Specifications</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-label text-text-muted block">Request Title</span>
                      <span className="text-body font-medium text-text-primary">{approval.title}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-label text-text-muted block">Module Origin</span>
                      <span className="text-body font-medium text-text-primary">{approval.module}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-label text-text-muted block">Request Type</span>
                      <span className="text-body font-medium text-text-primary">{approval.requestType}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-label text-text-muted block">Priority Matrix</span>
                      <span className="text-body font-medium text-text-primary">{approval.priority}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-label text-text-muted block">Initiator</span>
                      <span className="text-body font-medium text-text-primary">{approval.requestedByName}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-label text-text-muted block">Workflow Delegate</span>
                      <span className="text-body font-medium text-text-primary">{approval.ownerName}</span>
                    </div>
                  </div>

                  <div className="border-t border-border-soft pt-6 space-y-2">
                    <span className="text-label text-text-muted block">Summary Description</span>
                    <p className="text-body text-text-primary leading-relaxed bg-surface-secondary/35 p-4 rounded-lg border border-border-soft/60">
                      {approval.summary}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-label text-text-muted block">Business Context & Impact</span>
                    <p className="text-body text-text-secondary leading-relaxed">
                      This approval is governed by the organization&apos;s delegation of authority rules. Any delay in actioning this item beyond the SLA limits ({formatDate(approval.dueAt)}) may escalate to senior leadership and cause downstream project blockers.
                    </p>
                  </div>
                </div>
              )}

              {/* LINKED ENTITY TAB */}
              {activeTab === "entity" && (
                <div className="space-y-6">
                  <h3 className="text-body font-semibold text-text-primary">Source Document Summary</h3>
                  {linked ? (
                    <Card className="border border-border-soft bg-surface-secondary/20 shadow-none">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-label font-bold text-blue-600 tracking-wider uppercase">{linked.type}</span>
                            <h4 className="text-section-title font-semibold text-text-primary mt-1">{linked.code}</h4>
                          </div>
                          <Badge tone={toneForStatus(linked.status)}>{linked.status}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-body text-text-secondary">
                          <div>
                            <span className="text-label text-text-muted block">Counterparty / Vendor</span>
                            <span className="font-semibold text-text-primary">{linked.vendorName}</span>
                          </div>
                          <div>
                            <span className="text-label text-text-muted block">Total Amount</span>
                            <span className="font-semibold text-text-primary">{formatCurrency(linked.amount)}</span>
                          </div>
                          <div>
                            <span className="text-label text-text-muted block">Total Line Items</span>
                            <span>{linked.itemsCount} Items</span>
                          </div>
                          <div>
                            <span className="text-label text-text-muted block">Creation Date</span>
                            <span>{formatDate(linked.date)}</span>
                          </div>
                        </div>

                        {linked.details && (
                          <div className="border-t border-border-soft/60 pt-3 text-xs text-text-muted">
                            <span className="font-semibold text-text-secondary">Description: </span>
                            {linked.details}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-end">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              if (linked.type === "Purchase Order") {
                                router.push(`/purchases/purchase-orders/${linked.id}`);
                              } else {
                                toast.info(`Navigation logic to ${linked.type} details`);
                              }
                            }}
                            className="flex items-center gap-1 text-xs px-3 h-8 border border-border-soft"
                          >
                            Go to Source Document <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-12 text-body text-text-muted">
                      No linked entity or source documents are registered for this approval request.
                    </div>
                  )}
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === "timeline" && (
                <div className="space-y-6">
                  <h3 className="text-body font-semibold text-text-primary">Workflow Activity History</h3>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-border-soft">
                    {approval.timeline.map((event, index) => {
                      const isComplete = event.status === "Approved" || event.status === "Completed";
                      const isRejected = event.status === "Rejected";
                      
                      return (
                        <div key={event.id || index} className="relative space-y-1">
                          {/* Dotted indicator dot */}
                          <span className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 bg-surface transition-all ${
                            isComplete ? "border-emerald-500" :
                            isRejected ? "border-red-500" : "border-blue-500"
                          }`} />

                          <div className="flex items-center justify-between">
                            <span className="text-body font-semibold text-text-primary">{event.event}</span>
                            <span className="text-[10px] font-mono text-text-muted">{formatDateTime(event.timestamp)}</span>
                          </div>
                          
                          <p className="text-label text-text-secondary">
                            Actioned by <span className="font-semibold text-text-primary">{event.actorName}</span>
                          </p>
                          
                          {event.notes && (
                            <p className="text-xs text-text-muted italic bg-surface-secondary/40 px-3 py-1.5 rounded border border-border-soft/60 mt-1 max-w-xl">
                              &quot;{event.notes}&quot;
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COMMENTS TAB */}
              {activeTab === "comments" && (
                <div className="space-y-6">
                  <h3 className="text-body font-semibold text-text-primary">Internal Notes & Collaboration</h3>
                  
                  {/* Feed */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {approval.comments.length === 0 ? (
                      <p className="text-center py-6 text-body text-text-muted">No internal discussions yet. Write a note below.</p>
                    ) : (
                      approval.comments.map((comment) => (
                        <div key={comment.id} className="bg-surface-secondary/40 border border-border-soft rounded-lg p-3 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-text-primary flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-800 font-bold uppercase shrink-0">
                                {comment.actorName.slice(0,2)}
                              </div>
                              {comment.actorName}
                            </span>
                            <span className="text-text-muted font-mono">{formatDateTime(comment.timestamp)}</span>
                          </div>
                          <p className="text-body text-text-secondary pl-6">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Composer */}
                  <form onSubmit={handlePostComment} className="border-t border-border-soft pt-4 flex gap-3">
                    <Input
                      type="text"
                      placeholder="Write a comment, note, or query..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1"
                      disabled={commentMutation.isPending}
                    />
                    <Button
                      type="submit"
                      disabled={!commentText.trim() || commentMutation.isPending}
                      className="flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="h-4 w-4" />
                      Comment
                    </Button>
                  </form>
                  <p className="text-[10px] text-text-muted">Comments are visible internally only. Mention support to flag administrative issues.</p>
                </div>
              )}

              {/* RISK ASSESSMENT TAB */}
              {activeTab === "risk" && (
                <div className="space-y-6">
                  <h3 className="text-body font-semibold text-text-primary">Business Risk Assessment</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Project Delay Risk */}
                    <Card className="border-l-4 border-l-amber-500 shadow-none">
                      <CardContent className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-text-primary">Project Delay Risk</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Medium</span>
                        </div>
                        <p className="text-xs text-text-muted">
                          If this request is delayed beyond 48 hours, it may push the materials procurement timeline out by 7 days.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Vendor Payment Risk */}
                    <Card className="border-l-4 border-l-blue-500 shadow-none">
                      <CardContent className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-text-primary">Vendor Relationship Risk</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Low</span>
                        </div>
                        <p className="text-xs text-text-muted">
                          Active contract allows standard payment terms, posing low default risks on milestones.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Commission Release Risk */}
                    <Card className="border-l-4 border-l-slate-400 shadow-none">
                      <CardContent className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-text-primary">Commission Release Risk</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">Low</span>
                        </div>
                        <p className="text-xs text-text-muted">
                          Milestone releases are audited against the ledger prior to trigger commands.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Material Procurement Risk */}
                    <Card className="border-l-4 border-l-red-500 shadow-none">
                      <CardContent className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-text-primary">Material Supply Chain Risk</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">High</span>
                        </div>
                        <p className="text-xs text-text-muted">
                          Critical building materials locked. Direct impact on foundation works at Aurora heights project site.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right side info advisory */}
        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-3 border-b border-border-soft/60">
              <CardTitle className="text-body font-semibold text-text-primary flex items-center gap-1.5">
                <Siren className="h-4.5 w-4.5 text-blue-500" />
                Command Center Advisory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs text-text-secondary leading-relaxed">
              <div className="space-y-1">
                <span className="font-semibold text-text-primary block">SLA Threshold Alert</span>
                <p>
                  This approval request has an SLA of 48 hours. Please review details, supporting documents under Linked Entity, and audit history prior to submitting decisions.
                </p>
              </div>

              <div className="space-y-1 border-t border-border-soft/60 pt-3">
                <span className="font-semibold text-text-primary block">Downstream System Impact</span>
                <p>
                  Approving this request releases the status block in the Procurement module, allowing the purchase order to transition into &quot;Released&quot; state and unlocking delivery dispatch updates.
                </p>
              </div>

              <div className="space-y-1 border-t border-border-soft/60 pt-3">
                <span className="font-semibold text-text-primary block">Audited Transactions</span>
                <p>
                  All approval logs, timelines, reassignment comments, and action times are permanently logged into the ERP system compliance register.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CONFIRMATION / ACTION MODAL */}
      <Modal
        open={!!actionModal?.open}
        title={actionModal?.title || "Approval Action"}
        onClose={() => setActionModal(null)}
      >
        <div className="space-y-4">
          {actionModal?.action === "approve" ? (
            <div className="space-y-3">
              <p className="text-body text-text-secondary">
                You are approving request <span className="font-semibold text-text-primary">{approval.id}</span>. This action will release the related workflow and trigger subsequent actions.
              </p>
              <p className="text-xs text-text-muted">This transaction complies with the delegation of authority framework.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-body text-text-secondary">
                Rejections require a detailed business reason to be sent back to the requestor.
              </p>
              <div className="space-y-1">
                <label className="text-label font-semibold text-text-secondary">Rejection Reason *</label>
                <textarea
                  value={actionModal?.reason || ""}
                  onChange={(e) => setActionModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
                  placeholder="Enter rejection reason (e.g. Budget variance, missing quotation details...)"
                  className="w-full h-24 p-3 border border-border-soft rounded-lg text-body text-text-primary focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-soft">
            <Button variant="ghost" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button
              variant={actionModal?.action === "approve" ? "primary" : "ghost"}
              className={actionModal?.action === "reject" ? "bg-accent-critical hover:bg-accent-critical/90 text-white font-semibold" : ""}
              disabled={actionModal?.action === "reject" && !actionModal.reason?.trim()}
              loading={actionMutation.isPending}
              onClick={() => handleAction(actionModal?.action || "approve")}
            >
              Confirm {actionModal?.action === "approve" ? "Release" : "Reject"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* REASSIGNMENT MODAL */}
      <Modal
        open={isReassigning}
        title="Reassign Approval workflow"
        onClose={() => setIsReassigning(false)}
      >
        <div className="space-y-4">
          <p className="text-body text-text-secondary">Reassign this workflow to another authorized delegator in the system.</p>
          
          <div className="space-y-1">
            <label className="text-label font-semibold text-text-secondary">Select Authorized Approver</label>
            <select
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
              className="h-10 w-full text-body rounded-lg border border-border-soft bg-surface px-3 text-text-primary focus:outline-none focus:border-blue-500"
            >
              <option value="user-manager">Sanjay Mehta (Ops Manager)</option>
              <option value="user-admin">Administrator</option>
              <option value="user-accountant">Accountant</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-soft">
            <Button variant="ghost" onClick={() => setIsReassigning(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleReassign}>Reassign Workflow</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
