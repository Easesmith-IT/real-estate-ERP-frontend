"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowUpRight, Flame, User, Building, Coins } from "lucide-react";
import { Lead } from "@/lib/erp-types";
import Link from "next/link";

interface HighPriorityOpportunitiesProps {
  leads: Lead[];
}

export function HighPriorityOpportunities({ leads }: HighPriorityOpportunitiesProps) {
  const topOpportunities = useMemo(() => {
    const now = Date.now();
    const open = leads.filter((l) => !["Closed Won", "Closed Lost"].includes(l.stage));

    return open
      .map((lead) => {
        // Compute dynamic priority score out of 100
        let score = 50;
        
        // 1. Budget weight: 8 points per 50 Lakhs budget (max 30)
        const budgetCrores = lead.budgetMax / 10000000;
        score += Math.min(30, Math.round(budgetCrores * 8));

        // 2. Overdue weight: 10 points per day overdue (max 30)
        const isOverdue = new Date(lead.followUpAt).getTime() < now;
        let daysOverdue = 0;
        if (isOverdue) {
          const diffMs = now - new Date(lead.followUpAt).getTime();
          daysOverdue = Math.floor(diffMs / (24 * 60 * 60 * 1000)) || 1;
          score += Math.min(30, daysOverdue * 10);
        } else {
          // Due today gets minor bonus
          const isToday = new Date(lead.followUpAt).toDateString() === new Date().toDateString();
          if (isToday) score += 10;
        }

        // 3. Stage weight: Interested, visit scheduled, negotiation get higher weights
        if (lead.stage === "Negotiation") score += 20;
        else if (lead.stage === "Site Visit Scheduled") score += 15;
        else if (lead.stage === "Interested") score += 10;

        // Next action advice
        let nextAction = "Call to schedule site tour";
        if (lead.stage === "Negotiation") {
          nextAction = "Present commercial proposal discount";
        } else if (lead.stage === "Site Visit Scheduled") {
          nextAction = "Confirm coordinator attendance";
        } else if (lead.stage === "Interested") {
          nextAction = "Share project brochure & price list";
        } else if (lead.stage === "Contacted") {
          nextAction = "Conduct discovery call & budget check";
        }

        return {
          ...lead,
          score: Math.min(99, score),
          daysOverdue,
          nextAction,
          isOverdue,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [leads]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    if (score >= 75) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-blue-500 bg-blue-500/10 border-blue-500/20";
  };

  return (
    <Card className="border-border-soft bg-surface">
      <CardHeader className="pb-3 border-b border-border-soft flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-card-title font-semibold text-text-primary flex items-center gap-2">
            <Flame className="h-5 w-5 text-rose-500 animate-pulse" />
            <span>High Priority Opportunities</span>
          </CardTitle>
          <p className="text-label text-text-muted">Top 10 follow-ups requiring immediate executive attention based on deal size and age.</p>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-0 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 px-4 pb-4 overflow-x-auto max-h-[380px] overflow-y-auto">
          {topOpportunities.map((opp) => (
            <Card
              key={opp.id}
              className="relative flex flex-col justify-between border border-border-soft bg-surface-secondary/35 hover:shadow-soft transition-all duration-200"
            >
              <CardContent className="p-4 space-y-4 h-full flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Lead Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-body font-bold text-text-primary leading-tight">
                        {opp.fullName}
                      </h4>
                      <p className="text-label text-text-muted mt-1 truncate max-w-[130px] flex items-center gap-1">
                        <Building className="h-3.5 w-3.5" />
                        <span>{opp.projectName}</span>
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-label font-bold border ${getScoreColor(opp.score)}`}>
                      Prio: {opp.score}
                    </span>
                  </div>

                  {/* Budget & Overdue */}
                  <div className="grid grid-cols-2 gap-2 text-label border-y border-border-soft py-2">
                    <div className="space-y-0.5">
                      <p className="text-text-muted flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5 text-text-muted shrink-0" />
                        <span>Budget</span>
                      </p>
                      <p className="font-bold text-text-primary">{opp.budgetLabel}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-text-muted flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 text-text-muted shrink-0" />
                        <span>Status</span>
                      </p>
                      <p className={`font-bold ${opp.isOverdue ? "text-error" : "text-success"}`}>
                        {opp.isOverdue ? `${opp.daysOverdue}d Overdue` : "Due Today"}
                      </p>
                    </div>
                  </div>

                  {/* Next action instructions */}
                  <div className="space-y-1">
                    <p className="text-label font-semibold text-text-secondary flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-text-muted" />
                      <span>Owner: {opp.assignedToName}</span>
                    </p>
                    <p className="text-label text-text-secondary bg-surface p-2 rounded border border-border-soft italic leading-snug">
                      "{opp.nextAction}"
                    </p>
                  </div>
                </div>

                {/* View button */}
                <div className="pt-3 border-t border-border-soft mt-3">
                  <Link href={`/sales/follow-ups/${opp.id}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-label font-bold text-accent-primary gap-1"
                    >
                      <span>Action Centre Profile</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
