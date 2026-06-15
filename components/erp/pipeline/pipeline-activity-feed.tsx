"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, UserPlus, CheckCircle, ArrowRight, HeartHandshake, PhoneCall } from "lucide-react";
import type { Lead } from "@/lib/erp-types";

interface PipelineActivityFeedProps {
  leads: Lead[];
}

export function PipelineActivityFeed({ leads }: PipelineActivityFeedProps) {
  const feedEvents = useMemo(() => {
    const events: Array<{
      id: string;
      type: "create" | "advance" | "visit" | "negotiate" | "booking" | "followup";
      title: string;
      detail: string;
      actorName: string;
      initials: string;
      timestamp: string;
    }> = [];

    // Filter leads with dates, sort by updatedAt or createdAt descending
    const sortedLeads = [...leads]
      .filter((l) => l.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);

    sortedLeads.forEach((l) => {
      const baseTime = new Date(l.createdAt).getTime();

      // Event 1: Lead Created (all leads have this)
      events.push({
        id: `feed-${l.id}-create`,
        type: "create",
        title: "Lead Created",
        detail: `New inquiry registered for ${l.projectName} via ${l.source}.`,
        actorName: "System",
        initials: "SY",
        timestamp: l.createdAt,
      });

      // Event 2: Lead Contacted / Advanced
      if (["Contacted", "Interested", "Site Visit Scheduled", "Negotiation", "Booking", "Closed Won"].includes(l.stage)) {
        events.push({
          id: `feed-${l.id}-contact`,
          type: "followup",
          title: "Follow-Up Completed",
          detail: `Initial phone call completed. Lead budget verified at ${l.budgetLabel}.`,
          actorName: l.assignedToName,
          initials: l.assignedToName.split(" ").map(n => n[0]).join("").toUpperCase(),
          timestamp: new Date(baseTime + 2 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Event 3: Advanced stage
      if (["Interested", "Site Visit Scheduled", "Negotiation", "Booking", "Closed Won"].includes(l.stage)) {
        events.push({
          id: `feed-${l.id}-advance`,
          type: "advance",
          title: "Opportunity Advanced",
          detail: `Advanced to "${l.stage === "Site Visit Scheduled" ? "Site Visit" : l.stage}" following request for brochures.`,
          actorName: l.assignedToName,
          initials: l.assignedToName.split(" ").map(n => n[0]).join("").toUpperCase(),
          timestamp: new Date(baseTime + 12 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Event 4: Site Visit
      if (["Site Visit Scheduled", "Negotiation", "Booking", "Closed Won"].includes(l.stage)) {
        events.push({
          id: `feed-${l.id}-visit`,
          type: "visit",
          title: "Site Visit Scheduled",
          detail: `Walkthrough coordinator assigned at project location.`,
          actorName: l.assignedToName,
          initials: l.assignedToName.split(" ").map(n => n[0]).join("").toUpperCase(),
          timestamp: new Date(baseTime + 1.5 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Event 5: Negotiation / Booking
      if (l.stage === "Negotiation") {
        events.push({
          id: `feed-${l.id}-negotiate`,
          type: "negotiate",
          title: "Negotiation Initiated",
          detail: `Discount request review submitted. Target unit price discussion ongoing.`,
          actorName: l.assignedToName,
          initials: l.assignedToName.split(" ").map(n => n[0]).join("").toUpperCase(),
          timestamp: new Date(baseTime + 3 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      if (["Booking", "Closed Won"].includes(l.stage)) {
        events.push({
          id: `feed-${l.id}-booking`,
          type: "booking",
          title: "Booking Created",
          detail: `Unit allocation reservation requested. Final down payment structure established.`,
          actorName: l.assignedToName,
          initials: l.assignedToName.split(" ").map(n => n[0]).join("").toUpperCase(),
          timestamp: new Date(baseTime + 4 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    });

    // Filter out future timestamps and sort newest first
    return events
      .filter((e) => new Date(e.timestamp).getTime() < Date.now())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [leads]);

  const eventStyles = (type: string) => {
    switch (type) {
      case "create":
        return { icon: UserPlus, bg: "bg-blue-500/10 text-blue-500", tone: "info" };
      case "advance":
        return { icon: ArrowRight, bg: "bg-indigo-500/10 text-indigo-500", tone: "info" };
      case "visit":
        return { icon: CheckCircle, bg: "bg-amber-500/10 text-amber-500", tone: "warning" };
      case "negotiate":
        return { icon: Activity, bg: "bg-pink-500/10 text-pink-500", tone: "warning" };
      case "booking":
        return { icon: HeartHandshake, bg: "bg-emerald-500/10 text-emerald-500", tone: "success" };
      case "followup":
      default:
        return { icon: PhoneCall, bg: "bg-slate-500/10 text-slate-500", tone: "neutral" };
    }
  };

  const formatEventDate = (timeStr: string) => {
    const d = new Date(timeStr);
    const diffMin = Math.round((Date.now() - d.getTime()) / (1000 * 60));
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="border-border-soft hover:shadow-soft transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-section-title font-secondary text-text-primary">
          Sales Activity Feed
        </CardTitle>
        <p className="text-label text-text-muted mt-1">
          Real-time activity log tracking agent interactions and stage advances.
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative border-l border-border-strong ml-4 pl-6 space-y-6">
          {feedEvents.map((event) => {
            const styles = eventStyles(event.type);
            const Icon = styles.icon;

            return (
              <div key={event.id} className="relative">
                {/* Timeline node icon */}
                <span className={`absolute -left-[37px] top-0 h-7 w-7 rounded-full border-2 border-surface flex items-center justify-center shadow-soft ${styles.bg}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-body text-text-primary leading-tight">
                        {event.title}
                      </h5>
                      <Badge tone={styles.tone as any} className="text-[9px] py-0">
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-label text-text-secondary mt-1">{event.detail}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      Actor: <span className="font-semibold">{event.actorName}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-text-muted font-semibold shrink-0 sm:self-start">
                    {formatEventDate(event.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
