"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { X, Phone, Mail, User, Building, Coins, Clock, MessageSquare, Calendar, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingStateCard, ErrorStateCard } from "@/components/erp/live-state";
import { formatDate, formatDateTime } from "@/lib/erp-utils";
import Link from "next/link";

interface LeadViewDrawerProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  role: any;
}

export function LeadViewDrawer({ leadId, isOpen, onClose, role }: LeadViewDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "comms">("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch lead details only when drawer is open and leadId is provided
  const leadQuery = useQuery({
    queryKey: ["erp-lead-detail", leadId, role],
    queryFn: async () => {
      const res = await apiRequest<any>(`/api/leads/${leadId}`, { role });
      return res.data;
    },
    enabled: isOpen && Boolean(leadId),
  });

  if (!isOpen || !mounted) return null;

  const getStageTone = (stage: string) => {
    switch (stage) {
      case "New":
        return "info";
      case "Contacted":
        return "neutral";
      case "Interested":
        return "info";
      case "Site Visit Scheduled":
        return "warning";
      case "Negotiation":
        return "warning";
      case "Booking":
        return "info";
      case "Closed Won":
        return "success";
      case "Closed Lost":
      default:
        return "neutral";
    }
  };

  const getLeadScore = (stage: string) => {
    if (stage === "Closed Won" || stage === "Booking" || stage === "Negotiation") {
      return { label: "Hot Lead", bg: "bg-red-500/10 text-red-500 border border-red-500/20" };
    }
    if (stage === "Site Visit Scheduled" || stage === "Interested") {
      return { label: "Warm Lead", bg: "bg-amber-500/10 text-amber-500 border border-amber-500/20" };
    }
    if (stage === "Closed Lost") {
      return { label: "Cold Lead", bg: "bg-slate-500/10 text-slate-500 border border-slate-500/20" };
    }
    return { label: "Qualified", bg: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" };
  };

  return createPortal(
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-overlay z-[var(--z-overlay)] backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="fixed top-0 right-0 h-full w-[480px] bg-surface border-l border-border-soft shadow-enterprise z-[var(--z-modal)] flex flex-col justify-between animate-page-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-soft flex items-center justify-between">
          <div>
            <h2 className="text-section-title font-secondary text-text-primary">
              Lead Side Panel Profile
            </h2>
            <p className="text-label text-text-muted mt-1">
              Quick view console for lead details and histories.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-full text-text-muted hover:bg-surface-secondary"
            onClick={onClose}
          >
            <X className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Dynamic content area */}
        {leadQuery.isLoading ? (
          <div className="flex-1 p-6"><LoadingStateCard /></div>
        ) : leadQuery.isError || !leadQuery.data ? (
          <div className="flex-1 p-6"><ErrorStateCard message="Failed to load lead details." /></div>
        ) : (
          <>
            {/* Lead Brief summary card */}
            <div className="px-6 py-4 bg-surface-secondary/40 border-b border-border-soft space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-accent-primary/10 text-accent-primary p-2 h-12 w-12 flex items-center justify-center font-bold text-body">
                  {leadQuery.data.profile.firstName.charAt(0)}{leadQuery.data.profile.lastName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-text-primary text-body">
                      {leadQuery.data.profile.fullName}
                    </span>
                    <Badge tone={getStageTone(leadQuery.data.profile.stage)} className="text-[10px] py-0 uppercase">
                      {leadQuery.data.profile.stage}
                    </Badge>
                  </div>
                  <p className="text-label text-text-muted mt-0.5">{leadQuery.data.profile.projectName}</p>
                </div>
              </div>

              {/* Tabs list */}
              <div className="flex border border-border-soft rounded-[var(--radius-button)] bg-surface p-1">
                <button
                  className={`text-label flex-1 py-1.5 rounded-[var(--radius-button)] font-medium transition-all ${
                    activeTab === "overview"
                      ? "bg-surface-secondary text-accent-primary font-semibold shadow-soft"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </button>
                <button
                  className={`text-label flex-1 py-1.5 rounded-[var(--radius-button)] font-medium transition-all ${
                    activeTab === "comms"
                      ? "bg-surface-secondary text-accent-primary font-semibold shadow-soft"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                  onClick={() => setActiveTab("comms")}
                >
                  Communications
                </button>
                <button
                  className={`text-label flex-1 py-1.5 rounded-[var(--radius-button)] font-medium transition-all ${
                    activeTab === "timeline"
                      ? "bg-surface-secondary text-accent-primary font-semibold shadow-soft"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                  onClick={() => setActiveTab("timeline")}
                >
                  Activity Feed
                </button>
              </div>
            </div>

            {/* Scrollable tab panels */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              
              {/* Tab 1: Overview */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h3 className="text-label text-text-muted font-bold uppercase tracking-wider">Contact Info</h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-body">
                        <Phone className="h-4 w-4 text-text-muted shrink-0" />
                        <span className="text-text-primary font-medium">{leadQuery.data.profile.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-body">
                        <Mail className="h-4 w-4 text-text-muted shrink-0" />
                        <span className="text-text-primary truncate">{leadQuery.data.profile.email || "No email listed"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-body">
                        <User className="h-4 w-4 text-text-muted shrink-0" />
                        <span className="text-text-secondary">Assigned: {leadQuery.data.profile.assignedToName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border-soft">
                    <h3 className="text-label text-text-muted font-bold uppercase tracking-wider">Requirements</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-label text-text-muted">Budget Segment</p>
                        <p className="font-semibold text-text-primary text-body mt-0.5">{leadQuery.data.profile.budgetLabel}</p>
                      </div>
                      <div>
                        <p className="text-label text-text-muted">Configuration</p>
                        <p className="font-semibold text-text-primary text-body mt-0.5">{leadQuery.data.profile.preferredConfiguration}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-label text-text-muted">Lead Quality Score</p>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-label font-bold border ${getLeadScore(leadQuery.data.profile.stage).bg}`}>
                        {getLeadScore(leadQuery.data.profile.stage).label}
                      </span>
                    </div>
                    <div>
                      <p className="text-label text-text-muted">Remarks</p>
                      <p className="text-text-secondary mt-1 text-label italic leading-relaxed bg-surface-secondary p-3 rounded-lg border border-border-soft">
                        "{leadQuery.data.profile.notes || "No extra configuration notes recorded."}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Communications & Visits */}
              {activeTab === "comms" && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h3 className="text-label text-text-muted font-bold uppercase tracking-wider">Communication Logs</h3>
                    <div className="space-y-3.5">
                      {leadQuery.data.communications.map((comm: any) => (
                        <div key={comm.id} className="border-b border-border-soft pb-2.5 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-semibold text-text-primary text-label">{comm.subject}</span>
                            <span className="text-[10px] text-text-muted">{formatDate(comm.createdAt)}</span>
                          </div>
                          <p className="text-label text-text-secondary mt-1 leading-relaxed">{comm.summary}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-text-muted font-medium">
                            <Badge className="py-0 px-1 text-[8px]">{comm.type}</Badge>
                            <span>Status: {comm.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border-soft">
                    <h3 className="text-label text-text-muted font-bold uppercase tracking-wider">Site Visits</h3>
                    {leadQuery.data.siteVisits.length === 0 ? (
                      <p className="text-label text-text-muted italic">No site visits scheduled.</p>
                    ) : (
                      <div className="space-y-3">
                        {leadQuery.data.siteVisits.map((v: any) => (
                          <div key={v.id} className="bg-surface-secondary p-2.5 rounded-lg border border-border-soft">
                            <div className="flex justify-between items-center text-label font-semibold">
                              <span>{formatDateTime(v.scheduledAt)}</span>
                              <Badge className="py-0 text-[9px]">{v.status}</Badge>
                            </div>
                            <p className="text-label text-text-secondary mt-1">Outcome: {v.outcome}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Activity Feed */}
              {activeTab === "timeline" && (
                <div className="space-y-3">
                  <h3 className="text-label text-text-muted font-bold uppercase tracking-wider">System Activity Feed</h3>
                  <div className="relative border-l border-border-strong ml-2.5 pl-4 space-y-4 pt-2">
                    {leadQuery.data.activities.map((act: any) => (
                      <div key={act.id} className="relative">
                        <span className="absolute -left-6.5 top-0.5 h-4 w-4 rounded-full border border-surface bg-accent-primary text-[8px] font-bold text-white flex items-center justify-center">
                          •
                        </span>
                        <div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-semibold text-text-primary text-label">{act.title}</span>
                            <span className="text-[10px] text-text-muted">{formatDate(act.createdAt)}</span>
                          </div>
                          <p className="text-label text-text-secondary mt-0.5">{act.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-soft bg-surface-secondary flex items-center justify-end gap-3">
          {leadId && (
            <Link href={`/sales/leads/${leadId}`}>
              <Button
                type="button"
                variant="primary"
                className="h-10 px-4 font-semibold"
              >
                <span className="text-label text-white">View Full Profile</span>
              </Button>
            </Link>
          )}
          <Button
            type="button"
            variant="outline"
            className="text-label h-10 px-4 border-border-strong font-medium text-text-primary hover:bg-surface-secondary"
            onClick={onClose}
          >
            Close Panel
          </Button>
        </div>

      </div>
    </>,
    document.body
  );
}
