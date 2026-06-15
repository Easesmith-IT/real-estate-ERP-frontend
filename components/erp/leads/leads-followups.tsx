"use client";
import { toast } from "@/components/ui/toast";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, ExternalLink, CalendarClock, X } from "lucide-react";
import { Lead } from "@/lib/erp-types";
import { formatDateTime } from "@/lib/erp-utils";

interface LeadsFollowupsProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[] | undefined;
  isLoading: boolean;
  onViewLead: (leadId: string) => void;
}

export function LeadsFollowups({ isOpen, onClose, leads, isLoading, onViewLead }: LeadsFollowupsProps) {
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow" | "overdue">("today");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredFollowups = useMemo(() => {
    if (!leads) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

    return leads.filter((lead) => {
      // Exclude closed deals
      if (["Closed Won", "Closed Lost"].includes(lead.stage)) return false;
      if (!lead.followUpAt) return false;

      const fuDate = new Date(lead.followUpAt);

      if (activeTab === "overdue") {
        return fuDate < today;
      } else if (activeTab === "today") {
        return fuDate >= today && fuDate < tomorrow;
      } else {
        // tomorrow
        return fuDate >= tomorrow && fuDate < dayAfterTomorrow;
      }
    });
  }, [leads, activeTab]);

  if (!isOpen || !mounted) return null;

  const handleCall = (name: string, phone: string) => {
    toast.info(`Initiating VOIP audio call to ${name} (${phone})...`);
  };

  const handleMessage = (name: string, phone: string) => {
    toast.info(`Opening SMS/WhatsApp messaging window for ${name} (${phone})...`);
  };

  const getPriority = (lead: Lead) => {
    if (lead.budgetMax >= 20000000 || lead.stage === "Booking") return { label: "High", tone: "error" as const };
    if (lead.stage === "Negotiation" || lead.stage === "Site Visit Scheduled") return { label: "Medium", tone: "warning" as const };
    return { label: "Low", tone: "neutral" as const };
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
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-accent-primary" />
            <div>
              <h2 className="text-section-title font-secondary text-text-primary">
                Follow-Up Center
              </h2>
              <p className="text-label text-text-muted mt-0.5">
                Checklist for active customer follow-ups.
              </p>
            </div>
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

        {/* Tab Selection */}
        <div className="px-6 py-3 bg-surface-secondary/40 border-b border-border-soft flex justify-center">
          <div className="flex border border-border-soft rounded-[var(--radius-button)] bg-surface p-1 w-full">
            <button
              className={`text-label flex-1 py-1.5 rounded-[var(--radius-button)] font-medium transition-all ${
                activeTab === "overdue"
                  ? "bg-surface-secondary text-red-500 font-semibold shadow-soft"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              onClick={() => setActiveTab("overdue")}
            >
              Overdue
            </button>
            <button
              className={`text-label flex-1 py-1.5 rounded-[var(--radius-button)] font-medium transition-all ${
                activeTab === "today"
                  ? "bg-surface-secondary text-accent-primary font-semibold shadow-soft"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              onClick={() => setActiveTab("today")}
            >
              Today
            </button>
            <button
              className={`text-label flex-1 py-1.5 rounded-[var(--radius-button)] font-medium transition-all ${
                activeTab === "tomorrow"
                  ? "bg-surface-secondary text-text-primary font-semibold shadow-soft"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              onClick={() => setActiveTab("tomorrow")}
            >
              Tomorrow
            </button>
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-16 bg-surface-secondary animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredFollowups.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-body font-medium">
              No follow-ups scheduled for this period.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFollowups.map((lead) => {
                const priority = getPriority(lead);
                return (
                  <div
                    key={lead.id}
                    className="flex flex-col border border-border-soft rounded-lg p-3 hover:bg-surface-secondary/40 transition-all duration-150 gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-semibold text-text-primary text-body truncate block">
                          {lead.fullName}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          {lead.projectName}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Badge tone={priority.tone} className="py-0 text-[10px]">
                          {priority.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-label text-text-secondary mt-1">
                      <span>Stage: <span className="font-medium text-text-primary">{lead.stage}</span></span>
                      <span>Scheduled: <span className="font-medium text-text-primary">{formatDateTime(lead.followUpAt)}</span></span>
                    </div>

                    <div className="border-t border-border-soft/60 pt-2 flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-border-strong text-text-secondary hover:bg-surface"
                        onClick={() => handleCall(lead.fullName, lead.phone)}
                        title="Call Lead"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-border-strong text-text-secondary hover:bg-surface"
                        onClick={() => handleMessage(lead.fullName, lead.phone)}
                        title="Message Lead"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-accent-primary hover:bg-surface gap-1"
                        onClick={() => onViewLead(lead.id)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Quick View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-soft bg-surface-secondary flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            className="text-label h-10 px-5 border-border-strong font-medium text-text-primary hover:bg-surface-secondary"
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
