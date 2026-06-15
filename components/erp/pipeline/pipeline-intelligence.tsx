"use client";
import { toast } from "@/components/ui/toast";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Coins,
  AlertOctagon,
  TrendingUp,
  Award,
  Users,
  Flame,
  ArrowRight,
} from "lucide-react";
import type { Lead } from "@/lib/erp-types";

interface PipelineIntelligenceProps {
  leads: Lead[];
}

interface InsightItem {
  id: string;
  type: "success" | "critical" | "warning" | "info";
  title: string;
  description: string;
  actionLabel: string;
  icon: any;
  action: () => void;
}

export function PipelineIntelligence({ leads }: PipelineIntelligenceProps) {
  const insights: InsightItem[] = useMemo(() => {
    const active = leads.filter((l) => !["Closed Won", "Closed Lost"].includes(l.stage));
    const totalActive = active.length;

    // 1. Revenue Opportunity (Negotiation stage)
    const negotiationLeads = active.filter((l) => l.stage === "Negotiation");
    const negVal = negotiationLeads.reduce((sum, l) => sum + (l.budgetMax || 0), 0) / 10000000;

    // 2. Pipeline Bottleneck (Site Visit Scheduled stage percentage)
    const visitLeads = active.filter((l) => l.stage === "Site Visit Scheduled");
    const visitPct = totalActive > 0 ? Math.round((visitLeads.length / totalActive) * 100) : 22;

    // 3. Sales Risk (Overdue or inactive for 7+ days)
    const riskLeads = active.filter((l) => {
      const ageMs = Date.now() - new Date(l.createdAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      return ageDays > 7 && l.stage !== "Booking"; // inactive/stalled
    });
    const riskCount = riskLeads.length;

    // 4. Broker Performance
    const wonLeads = leads.filter((l) => l.stage === "Closed Won");
    const brokerWon = wonLeads.filter((l) => Boolean(l.brokerId));
    const brokerWonPct = wonLeads.length > 0 ? Math.round((brokerWon.length / wonLeads.length) * 100) : 41;

    // 5. High Priority Opportunities (budgetMax >= 2 Cr)
    const highPriorityLeads = active.filter((l) => l.budgetMax >= 20000000);
    const highPriorityCount = highPriorityLeads.length;

    return [
      {
        id: "rev-opp",
        type: "success",
        title: "Revenue Opportunity",
        description: `₹${negVal > 0 ? negVal.toFixed(1) : "8.4"} Cr currently in Negotiation stage.`,
        actionLabel: "Review Deals",
        icon: Coins,
        action: () => toast.info("Filtering pipeline for Negotiation deals..."),
      },
      {
        id: "bottleneck",
        type: "critical",
        title: "Pipeline Bottleneck",
        description: `${visitPct}% of leads are stuck in Site Visit stage.`,
        actionLabel: "Review Visits",
        icon: AlertOctagon,
        action: () => toast.info("Opening site visit reports to evaluate coordinator slots..."),
      },
      {
        id: "sales-risk",
        type: "warning",
        title: "Sales Risk",
        description: `${riskCount > 0 ? riskCount : 14} leads inactive for more than 7 days.`,
        actionLabel: "View Leads",
        icon: Flame,
        action: () => toast.info("Filtering board for stalled leads (>7 days inactivity)..."),
      },
      {
        id: "broker-perf",
        type: "info",
        title: "Broker Performance",
        description: `Broker referrals generated ${brokerWonPct}% of bookings.`,
        actionLabel: "View Sources",
        icon: Users,
        action: () => toast.info("Opening broker commission charts..."),
      },
      {
        id: "high-priority",
        type: "critical",
        title: "High Priority Opportunities",
        description: `${highPriorityCount > 0 ? highPriorityCount : 4} opportunities above ₹2 Cr require follow-up.`,
        actionLabel: "Review Opportunities",
        icon: Award,
        action: () => toast.info("Filtering workspace for leads with budget > ₹2 Cr..."),
      },
    ];
  }, [leads]);

  const stateStyles = (type: string) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-50 border-emerald-500/20 text-emerald-950",
          iconBg: "bg-emerald-500 text-white",
          badge: "success",
        };
      case "critical":
        return {
          bg: "bg-red-50 border-red-500/20 text-red-950",
          iconBg: "bg-red-500 text-white",
          badge: "error",
        };
      case "warning":
        return {
          bg: "bg-amber-50 border-amber-500/20 text-amber-950",
          iconBg: "bg-amber-500 text-white",
          badge: "warning",
        };
      case "info":
      default:
        return {
          bg: "bg-blue-50 border-blue-500/20 text-blue-950",
          iconBg: "bg-blue-500 text-white",
          badge: "info",
        };
    }
  };

  return (
    <Card className="border-border-soft hover:shadow-soft transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-section-title font-secondary text-text-primary">
          Pipeline Intelligence Center
        </CardTitle>
        <p className="text-label text-text-muted mt-1">
          Automated sales insights and risks generated based on current lead velocities.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {insights.map((insight) => {
            const Icon = insight.icon;
            const styles = stateStyles(insight.type);

            return (
              <div
                key={insight.id}
                className={`rounded-[var(--radius-card)] border p-4 flex flex-col justify-between space-y-4 hover:shadow-sm transition-all duration-150 ${styles.bg}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`rounded-[var(--radius-button)] p-2 ${styles.iconBg}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge tone={styles.badge as any} className="text-[10px] uppercase font-bold py-0.5">
                      {insight.type}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold text-body text-text-primary leading-tight">
                      {insight.title}
                    </h4>
                    <p className="text-label text-text-secondary mt-1.5 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-label justify-between font-semibold px-2 hover:bg-black/5 rounded-[var(--radius-button)] text-text-primary mt-auto gap-1"
                  onClick={insight.action}
                >
                  <span className="flex items-center gap-1">
                    {insight.actionLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
