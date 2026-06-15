"use client";
import { toast } from "@/components/ui/toast";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone,
  MessageSquare,
  CalendarDays,
  ArrowRight,
  ChevronRight,
  Clock,
  User,
  X,
  Plus,
} from "lucide-react";
import type { Lead, ProjectSummary, DemoUser } from "@/lib/erp-types";

interface PipelineKanbanProps {
  leads: Lead[];
  onAdvanceStage: (leadId: string, stage: string) => void;
  onScheduleVisit: (body: any) => void;
  salesOwners: DemoUser[];
  projects: ProjectSummary[];
}

export function PipelineKanban({
  leads,
  onAdvanceStage,
  onScheduleVisit,
  salesOwners,
  projects,
}: PipelineKanbanProps) {
  const router = useRouter();

  // Dialog state for visit scheduling
  const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null);
  const [visitForm, setVisitForm] = useState({
    coordinatorId: "",
    projectId: "",
    scheduledAt: "",
    outcome: "Standard site walkthrough for configuration verification.",
  });

  const stages = useMemo(() => {
    return [
      { id: "New", label: "New" },
      { id: "Contacted", label: "Contacted" },
      { id: "Interested", label: "Interested" },
      { id: "Site Visit Scheduled", label: "Site Visit" },
      { id: "Negotiation", label: "Negotiation" },
      { id: "Booking", label: "Booking" },
    ];
  }, []);

  // Compute Kanban stage columns
  const kanbanColumns = useMemo(() => {
    return stages.map((stage) => {
      const stageLeads = leads.filter((l) => l.stage === stage.id);
      const count = stageLeads.length;
      
      const totalVal = stageLeads.reduce((sum, l) => sum + (l.budgetMax || 0), 0);
      const valueLabel = totalVal >= 10000000 
        ? `₹${(totalVal / 10000000).toFixed(1)} Cr` 
        : `₹${(totalVal / 100000).toFixed(0)} L`;

      const ages = stageLeads.map((l) => {
        const ageMs = Date.now() - new Date(l.createdAt).getTime();
        return ageMs / (1000 * 60 * 60 * 24);
      });
      const avgAge = ages.length > 0 ? ages.reduce((s, a) => s + a, 0) / ages.length : 0;

      return {
        ...stage,
        leads: stageLeads.map((l) => {
          const ageMs = Date.now() - new Date(l.createdAt).getTime();
          const daysInStage = Math.max(1, Math.round((ageMs / (1000 * 60 * 60 * 24)) % 8));
          
          let ageColor = "success"; // green
          if (daysInStage >= 7) ageColor = "error"; // red
          else if (daysInStage >= 4) ageColor = "warning"; // amber

          const probabilities: Record<string, number> = {
            "New": 15,
            "Contacted": 30,
            "Interested": 45,
            "Site Visit Scheduled": 60,
            "Negotiation": 80,
            "Booking": 95,
          };

          return {
            ...l,
            daysInStage,
            ageColor,
            probability: probabilities[l.stage] || 50,
          };
        }),
        count,
        valueLabel,
        avgAge,
      };
    });
  }, [stages, leads]);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      onAdvanceStage(leadId, targetStage);
    }
  };

  const formatKanbanCardCurrency = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(val / 100000).toFixed(0)} L`;
  };

  const handleOpenScheduleModal = (lead: Lead) => {
    setSchedulingLead(lead);
    setVisitForm({
      coordinatorId: lead.assignedTo || salesOwners[0]?.id || "",
      projectId: lead.preferredProjectId || projects[0]?.id || "",
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // default to 2 days out
      outcome: "Standard site walkthrough for configuration verification.",
    });
  };

  const handleScheduleSubmit = () => {
    if (!schedulingLead) return;
    onScheduleVisit({
      leadId: schedulingLead.id,
      projectId: visitForm.projectId,
      coordinatorId: visitForm.coordinatorId,
      scheduledAt: new Date(visitForm.scheduledAt).toISOString(),
      outcome: visitForm.outcome,
    });
    setSchedulingLead(null);
  };

  return (
    <Card className="border-border-soft">
      <CardHeader className="pb-3 border-b border-border-soft">
        <CardTitle className="text-section-title font-secondary text-text-primary">
          Kanban Progression Board
        </CardTitle>
        <p className="text-label text-text-muted mt-1">
          Drag and drop lead cards to advance pipeline stages, or perform quick actions to engage with prospects.
        </p>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-0">
        <div className="overflow-x-auto p-4 bg-surface-secondary/40">
          <div className="grid grid-cols-6 gap-4 min-w-[1280px]">
            {kanbanColumns.map((col) => (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.id)}
                className="flex flex-col gap-3 min-h-[500px]"
              >
                {/* Stage Header */}
                <div className="flex flex-col gap-1 border-b border-border-soft pb-2 px-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-body text-text-primary">{col.label}</span>
                    <Badge tone={col.count > 0 ? "info" : "neutral"} className="text-label font-bold py-0.5">
                      {col.count}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-muted mt-1 font-semibold">
                    <span>{col.valueLabel}</span>
                    {col.count > 0 && <span>{col.avgAge.toFixed(1)}d Avg</span>}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 flex flex-col gap-3">
                  {col.leads.length === 0 ? (
                    <div className="rounded-[var(--radius-input)] border border-dashed border-border-strong/40 bg-surface px-3 py-6 text-center text-label text-text-muted select-none">
                      No opportunities here.
                    </div>
                  ) : (
                    col.leads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className={`rounded-[var(--radius-input)] border-t-[3px] bg-surface p-3 shadow-soft cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-150 relative space-y-3 border-x border-b border-border-soft ${
                          lead.ageColor === "error"
                            ? "border-t-red-500"
                            : lead.ageColor === "warning"
                            ? "border-t-amber-500"
                            : "border-t-emerald-500"
                        }`}
                      >
                        {/* Header information */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-accent-primary/10 text-accent-primary h-7 w-7 flex items-center justify-center font-bold text-label shrink-0">
                              {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h5
                                className="font-semibold text-body text-text-primary leading-tight truncate max-w-[100px]"
                                title={lead.fullName}
                              >
                                {lead.fullName}
                              </h5>
                              <p className="text-[10px] text-text-muted truncate mt-0.5 max-w-[100px]" title={lead.projectName}>
                                {lead.projectName}
                              </p>
                            </div>
                          </div>
                          <Badge tone="info" className="text-[10px] py-0 font-bold shrink-0">
                            {lead.probability}%
                          </Badge>
                        </div>

                        {/* Mid section metrics */}
                        <div className="flex justify-between items-center text-label">
                          <span className="font-semibold text-text-primary">
                            {formatKanbanCardCurrency(lead.budgetMax)}
                          </span>
                          <div className="flex items-center gap-1 text-text-muted">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-semibold text-[10px]">{lead.daysInStage}d</span>
                          </div>
                        </div>

                        {/* Assignee / Date */}
                        <div className="flex justify-between items-center text-[10px] text-text-muted border-t border-border-soft pt-2">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {lead.assignedToName}
                          </span>
                          {lead.followUpAt && (
                            <span className="font-semibold">
                              FU: {new Date(lead.followUpAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>

                        {/* Quick actions panel */}
                        <div className="flex items-center justify-between gap-1 border-t border-border-soft pt-2 mt-1">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => toast.info(`Dialing contact: ${lead.fullName} (${lead.phone})`)}
                              className="rounded-full bg-slate-50 hover:bg-slate-100 border border-border-soft p-1.5 text-text-secondary transition-colors"
                              title="Call Lead"
                            >
                              <Phone className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, "")}`, "_blank")}
                              className="rounded-full bg-slate-50 hover:bg-slate-100 border border-border-soft p-1.5 text-text-secondary transition-colors"
                              title="WhatsApp Message"
                            >
                              <MessageSquare className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleOpenScheduleModal(lead)}
                              className="rounded-full bg-slate-50 hover:bg-slate-100 border border-border-soft p-1.5 text-text-secondary transition-colors"
                              title="Schedule Site Visit"
                            >
                              <CalendarDays className="h-3 w-3" />
                            </button>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[10px] py-1 px-2 h-7 font-bold hover:bg-slate-50 border border-border-soft text-text-secondary rounded-[var(--radius-button)]"
                              onClick={() => router.push(`/sales/leads/${lead.id}`)}
                            >
                              Details
                            </Button>
                            {lead.stage !== "Booking" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-[10px] py-1 px-1.5 h-7 font-bold text-accent-primary rounded-[var(--radius-button)]"
                                onClick={() => {
                                  const idx = stages.findIndex((s) => s.id === lead.stage);
                                  if (idx !== -1 && idx < stages.length - 1) {
                                    onAdvanceStage(lead.id, stages[idx + 1].id);
                                  }
                                }}
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Scheduling Modal */}
      {schedulingLead && (
        <div className="fixed inset-0 bg-overlay z-[var(--z-modal)] flex items-center justify-center p-4">
          <div className="bg-surface border border-border-soft shadow-floating max-w-md w-full rounded-[var(--radius-modal)] p-6 space-y-5 animate-page-in">
            <div className="flex items-center justify-between pb-1 border-b border-border-soft">
              <h3 className="text-section-title font-secondary font-bold text-text-primary">
                Schedule Site Visit
              </h3>
              <button
                onClick={() => setSchedulingLead(null)}
                className="text-text-muted hover:text-text-primary transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-label text-text-muted font-semibold uppercase tracking-wider block">Lead Name</span>
                <p className="font-semibold text-body text-text-primary">{schedulingLead.fullName}</p>
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Project Site</label>
                <select
                  value={visitForm.projectId}
                  onChange={(e) => setVisitForm((c) => ({ ...c, projectId: e.target.value }))}
                  className="h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary px-4 text-body text-text-primary focus-visible:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Assigned Coordinator</label>
                <select
                  value={visitForm.coordinatorId}
                  onChange={(e) => setVisitForm((c) => ({ ...c, coordinatorId: e.target.value }))}
                  className="h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary px-4 text-body text-text-primary focus-visible:outline-none"
                >
                  {salesOwners.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Schedule Date & Time</label>
                <Input
                  type="datetime-local"
                  value={visitForm.scheduledAt}
                  onChange={(e) => setVisitForm((c) => ({ ...c, scheduledAt: e.target.value }))}
                  className="h-11 bg-surface-secondary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Walkthrough Notes / Target Outcomes</label>
                <textarea
                  value={visitForm.outcome}
                  onChange={(e) => setVisitForm((c) => ({ ...c, outcome: e.target.value }))}
                  className="w-full min-h-[80px] rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary px-4 py-3 text-body text-text-primary focus-visible:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1 rounded-[var(--radius-button)]"
                onClick={() => setSchedulingLead(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 rounded-[var(--radius-button)]"
                onClick={handleScheduleSubmit}
              >
                Schedule Visit
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
