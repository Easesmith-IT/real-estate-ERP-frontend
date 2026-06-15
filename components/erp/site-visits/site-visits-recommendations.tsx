"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  Target,
  Clock,
  UserPlus,
  Building2,
  BarChart3,
} from "lucide-react";
import type { SiteVisit, Lead } from "@/lib/erp-types";

interface SiteVisitsRecommendationsProps {
  visits: SiteVisit[];
  leads: Lead[] | undefined;
  isLoading: boolean;
}

interface Recommendation {
  id: string;
  type: "opportunity" | "insight" | "alert" | "suggestion";
  icon: typeof Lightbulb;
  title: string;
  detail: string;
  tone: "info" | "success" | "warning" | "neutral";
  priority: "high" | "medium" | "low";
}

export function SiteVisitsRecommendations({ visits, leads, isLoading }: SiteVisitsRecommendationsProps) {
  const recommendations = useMemo((): Recommendation[] => {
    if (!visits || visits.length === 0) return [];

    const items: Recommendation[] = [];
    const scheduled = visits.filter((v) => v.status === "Scheduled");
    const completed = visits.filter((v) => v.status === "Completed");
    const cancelled = visits.filter((v) => v.status === "Cancelled" || v.status === "Rejected");
    const noShow = visits.filter((v) => v.status === "No Show");

    const total = visits.length;
    const completedPct = total > 0 ? Math.round((completed.length / total) * 100) : 0;
    const noShowPct = total > 0 ? Math.round((noShow.length / total) * 100) : 0;
    const cancelledPct = total > 0 ? Math.round((cancelled.length / total) * 100) : 0;

    const today = new Date().toISOString().slice(0, 10);
    const todayScheduled = scheduled.filter((v) => v.scheduledAt?.startsWith(today));

    const leadsWithCompletedVisits = leads
      ? leads.filter((l) => visits.some((v) => v.leadId === l.id && v.status === "Completed"))
      : [];

    const bookedFromVisits = leadsWithCompletedVisits.filter((l) =>
      ["Booking", "Closed Won"].includes(l.stage)
    );

    const projectMap: Record<string, number> = {};
    visits.forEach((v) => {
      const name = v.projectName || "Unknown";
      projectMap[name] = (projectMap[name] || 0) + 1;
    });
    const topProject = Object.entries(projectMap).sort((a, b) => b[1] - a[1])[0];

    if (todayScheduled.length > 0) {
      items.push({
        id: "today-visits",
        type: "insight",
        icon: Clock,
        title: `${todayScheduled.length} Visit${todayScheduled.length > 1 ? "s" : ""} Scheduled Today`,
        detail: `You have ${todayScheduled.length} site visit${todayScheduled.length > 1 ? "s" : ""} scheduled for today. Ensure all coordinators are briefed and materials are ready.`,
        tone: "info",
        priority: "high",
      });
    }

    if (completedPct >= 60) {
      items.push({
        id: "strong-completion",
        type: "opportunity",
        icon: TrendingUp,
        title: "Strong Visit Completion Rate",
        detail: `${completedPct}% of visits are completed — well above average. Your coordination team is performing effectively.`,
        tone: "success",
        priority: "medium",
      });
    } else if (completedPct < 40 && completedPct > 0) {
      items.push({
        id: "low-completion",
        type: "alert",
        icon: AlertTriangle,
        title: "Low Visit Completion Rate",
        detail: `Only ${completedPct}% of visits end up completed. Review scheduling accuracy and coordinator availability.`,
        tone: "warning",
        priority: "high",
      });
    }

    if (noShowPct > 20) {
      items.push({
        id: "noshow-alert",
        type: "alert",
        icon: AlertTriangle,
        title: "High No-Show Rate",
        detail: `${noShowPct}% of leads missed their visit. Consider sending SMS/email reminders 24h and 2h before each appointment.`,
        tone: "warning",
        priority: "high",
      });
    }

    if (cancelledPct > 20) {
      items.push({
        id: "cancellation-rate",
        type: "alert",
        icon: TrendingDown,
        title: "Elevated Cancellation Rate",
        detail: `${cancelledPct}% of visits were cancelled. Reach out to these leads to reschedule and understand the reason.`,
        tone: "warning",
        priority: "medium",
      });
    }

    const leadDrop = leadsWithCompletedVisits.length - bookedFromVisits.length;
    if (leadDrop > 0) {
      items.push({
        id: "follow-up-gap",
        type: "suggestion",
        icon: UserPlus,
        title: `${leadDrop} Lead${leadDrop > 1 ? "s" : ""} Need Follow-Up After Visit`,
        detail: `${leadDrop} lead${leadDrop > 1 ? "s" : ""} completed a site visit but haven't moved to booking. Assign immediate follow-up to convert interest into commitment.`,
        tone: "neutral",
        priority: "high",
      });
    }

    if (topProject) {
      items.push({
        id: "top-project",
        type: "insight",
        icon: Building2,
        title: `High Demand: ${topProject[0]}`,
        detail: `${topProject[0]} has the highest visit volume (${topProject[1]} tours). Consider allocating additional coordinator bandwidth and reviewing inventory availability.`,
        tone: "info",
        priority: "medium",
      });
    }

    if (completed.length > 0 && leads) {
      const convRate = leadsWithCompletedVisits.length > 0
        ? Math.round((bookedFromVisits.length / leadsWithCompletedVisits.length) * 100)
        : 0;

      if (convRate >= 40) {
        items.push({
          id: "high-conversion",
          type: "opportunity",
          icon: Target,
          title: `Visit-to-Booking Conversion at ${convRate}%`,
          detail: "Your site visits are highly effective at converting leads. Double down on the current tour experience and scripts.",
          tone: "success",
          priority: "medium",
        });
      } else if (convRate > 0 && convRate < 20) {
        items.push({
          id: "low-conversion",
          type: "suggestion",
          icon: BarChart3,
          title: `Improve Visit-to-Booking Rate (${convRate}%)`,
          detail: "Visits are happening but not converting. Review tour scripts, property readiness, and follow-up speed to improve close rates.",
          tone: "warning",
          priority: "high",
        });
      }
    }

    if (items.length === 0) {
      items.push({
        id: "no-data",
        type: "insight",
        icon: Lightbulb,
        title: "Start Scheduling Site Visits",
        detail: "No visit data available yet. Schedule your first site visit to start tracking performance and conversion metrics.",
        tone: "neutral",
        priority: "low",
      });
    }

    return items.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  }, [visits, leads]);

  if (isLoading) {
    return (
      <Card className="animate-pulse bg-surface-secondary">
        <CardHeader className="h-12 border-none" />
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded bg-hover" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-soft transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-body font-semibold text-text-primary">
          Insights & Recommendations
        </CardTitle>
        <p className="text-label text-text-muted">
          AI-driven observations and actionable suggestions based on visit data.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => {
          const IconComponent = rec.icon;
          const borderColor =
            rec.tone === "success"
              ? "border-l-emerald-500"
              : rec.tone === "warning"
              ? "border-l-amber-500"
              : rec.tone === "info"
              ? "border-l-blue-500"
              : "border-l-slate-400";

          return (
            <div
              key={rec.id}
              className={`border-l-4 ${borderColor} bg-surface-secondary rounded-r-lg px-4 py-3.5 hover:brightness-[1.02] transition-all`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <IconComponent className="h-4 w-4 text-text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-body font-semibold text-text-primary">{rec.title}</p>
                    <Badge
                      tone={rec.tone}
                      className="text-[10px] uppercase tracking-wider px-1.5 py-0"
                    >
                      {rec.type}
                    </Badge>
                  </div>
                  <p className="text-label text-text-muted mt-1 leading-relaxed">{rec.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
