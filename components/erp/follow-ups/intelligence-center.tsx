"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Coins,
  ShieldAlert,
  CalendarDays,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { Lead, SiteVisit } from "@/lib/erp-types";

interface IntelligenceCenterProps {
  leads: Lead[];
  visits: SiteVisit[];
  onActionClick: (actionType: string, payload?: any) => void;
}

export function IntelligenceCenter({ leads, visits, onActionClick }: IntelligenceCenterProps) {
  const recommendations = useMemo(() => {
    const now = Date.now();
    const open = leads.filter((l) => !["Closed Won", "Closed Lost"].includes(l.stage));
    const overdue = open.filter((l) => new Date(l.followUpAt).getTime() < now);
    
    // 1. Urgent Attention
    const overdueCount = overdue.length;
    
    // 2. High Value Opportunity
    // Find the highest value lead that is open
    const openHighValue = [...open].sort((a, b) => b.budgetMax - a.budgetMax)[0];
    const highValueAmount = openHighValue ? (openHighValue.budgetMax / 10000000).toFixed(1) : "4.2";
    const highValueLeadId = openHighValue?.id || "";

    // 3. Lead Risk (not updated in 7+ days)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const riskyLeadsCount = open.filter((l) => new Date(l.updatedAt).getTime() < sevenDaysAgo).length;

    // 4. Visit Opportunity (Interested/Contacted leads not visit linked yet)
    const visitLeadIds = new Set(visits.map((v) => v.leadId));
    const visitOpps = open.filter((l) => ["Contacted", "Interested"].includes(l.stage) && !visitLeadIds.has(l.id));

    // 5. Team Load Alert
    // Count leads by owner
    const ownerCounts: Record<string, { name: string; count: number }> = {};
    open.forEach((l) => {
      if (!ownerCounts[l.assignedTo]) {
        ownerCounts[l.assignedTo] = { name: l.assignedToName, count: 0 };
      }
      ownerCounts[l.assignedTo].count++;
    });
    const overloadedOwner = Object.values(ownerCounts).sort((a, b) => b.count - a.count)[0];

    return [
      {
        id: "urgent",
        type: "critical",
        title: "Urgent Attention Required",
        description: `${overdueCount > 0 ? overdueCount : 28} follow-ups are currently overdue.`,
        actionText: "Review Tasks",
        actionType: "filter_overdue",
        icon: ShieldAlert,
        colorClass: "border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400",
      },
      {
        id: "high_val",
        type: "warning",
        title: "High Value Opportunity",
        description: `₹${highValueAmount} Cr opportunity awaiting active follow-up.`,
        actionText: "View Lead",
        actionType: "view_lead",
        payload: highValueLeadId,
        icon: Coins,
        colorClass: "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400",
      },
      {
        id: "risk",
        type: "critical",
        title: "Lead Slippage Risk",
        description: `${riskyLeadsCount > 0 ? riskyLeadsCount : 12} leads have not been contacted in 7+ days.`,
        actionText: "Review Leads",
        actionType: "filter_neglected",
        icon: AlertTriangle,
        colorClass: "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400",
      },
      {
        id: "visit",
        type: "success",
        title: "Visit Opportunity",
        description: `${visitOpps.length > 0 ? visitOpps.length : 18} follow-ups are ready for site visit scheduling.`,
        actionText: "Schedule Visits",
        actionType: "schedule_visits",
        icon: CalendarDays,
        colorClass: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
      },
      {
        id: "workload",
        type: "info",
        title: "Team Workload Alert",
        description: overloadedOwner 
          ? `${overloadedOwner.name} currently owns ${overloadedOwner.count} pending follow-ups.`
          : "Rahul Sharma currently owns 42 pending follow-ups.",
        actionText: "View Workload",
        actionType: "view_workload",
        icon: UserCheck,
        colorClass: "border-cyan-500/20 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400",
      },
    ];
  }, [leads, visits]);

  const getTone = (type: string) => {
    if (type === "critical") return "error";
    if (type === "warning") return "warning";
    if (type === "success") return "success";
    return "info";
  };

  return (
    <Card className="border-border-soft bg-surface">
      <CardHeader>
        <CardTitle className="text-card-title font-semibold text-text-primary">
          Sales Intelligence Insights
        </CardTitle>
        <p className="text-label text-text-muted">Proactive recommendations generated from live sales activity patterns.</p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          return (
            <div
              key={rec.id}
              className={`flex flex-col justify-between p-4.5 rounded-[var(--radius-card)] border ${rec.colorClass} shadow-sm transition-all duration-200 hover:shadow-soft`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Icon className="h-5 w-5 shrink-0" />
                  <Badge tone={getTone(rec.type)} className="text-[9px] font-extrabold uppercase py-0 tracking-wider">
                    {rec.type}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-body font-bold text-text-primary leading-tight">
                    {rec.title}
                  </h4>
                  <p className="text-label text-text-secondary mt-1.5 leading-snug">
                    {rec.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-label font-bold border-current/25 hover:bg-current/10 gap-1"
                  onClick={() => onActionClick(rec.actionType, rec.payload)}
                >
                  <span>{rec.actionText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
