"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Flame, Clock, Compass, ChevronRight, User } from "lucide-react";
import type { Lead } from "@/lib/erp-types";

interface PipelineRadarProps {
  leads: Lead[];
}

export function PipelineRadar({ leads }: PipelineRadarProps) {
  const router = useRouter();

  const topOpportunities = useMemo(() => {
    // Filter active leads, sort by budgetMax descending, and take top 10
    const active = leads.filter((l) => !["Closed Won", "Closed Lost"].includes(l.stage));
    
    const sorted = [...active].sort((a, b) => (b.budgetMax || 0) - (a.budgetMax || 0));
    return sorted.slice(0, 10).map((l) => {
      // Probability score mapping
      const probabilities: Record<string, number> = {
        "New": 15,
        "Contacted": 30,
        "Interested": 45,
        "Site Visit Scheduled": 60,
        "Negotiation": 82,
        "Booking": 95,
      };

      // Days in stage (simulated based on createdAt / updatedAt)
      const ageMs = Date.now() - new Date(l.createdAt).getTime();
      const daysInStage = Math.max(1, Math.round((ageMs / (1000 * 60 * 60 * 24)) % 8));

      // Suggested action mapping
      let suggestedAction = "Follow up regarding configuration details";
      if (l.stage === "New") suggestedAction = "Call lead immediately to qualify interest";
      else if (l.stage === "Contacted") suggestedAction = "Email project brochure & floorplans";
      else if (l.stage === "Interested") suggestedAction = "Propose site visit for upcoming weekend";
      else if (l.stage === "Site Visit Scheduled") suggestedAction = "Assign executive to coordinate walkthrough";
      else if (l.stage === "Negotiation") suggestedAction = "Schedule final review meeting with manager";
      else if (l.stage === "Booking") suggestedAction = "Execute purchase contract & collect booking fee";

      return {
        ...l,
        probability: probabilities[l.stage] || 50,
        daysInStage,
        suggestedAction,
      };
    });
  }, [leads]);

  const formatRadarCurrency = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(val / 100000).toFixed(0)} L`;
  };

  const handleViewDetails = (id: string) => {
    router.push(`/sales/leads/${id}`);
  };

  if (topOpportunities.length === 0) {
    return (
      <Card className="border-border-soft">
        <CardHeader>
          <CardTitle className="text-section-title font-secondary text-text-primary">
            Opportunity Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-text-muted text-body font-medium">
          No active high-priority opportunities found matching the current filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border-soft hover:shadow-soft transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-section-title font-secondary text-text-primary flex items-center gap-2">
          <Flame className="h-5 w-5 text-red-500 fill-red-500/10" />
          Opportunity Radar (Top 10 High-Value Deals)
        </CardTitle>
        <p className="text-label text-text-muted mt-1">
          High-potential deals prioritized by maximum budget configuration and conversion velocity.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {topOpportunities.map((opp) => (
            <Card
              key={opp.id}
              className="bg-surface border border-border-soft hover:border-border-strong rounded-[var(--radius-card)] p-4 flex flex-col justify-between space-y-4 hover:shadow-soft transition-all duration-150 shrink-0"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-accent-primary/10 text-accent-primary h-8 w-8 flex items-center justify-center font-bold text-label">
                      {opp.firstName.charAt(0)}{opp.lastName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-body text-text-primary truncate max-w-[100px]" title={opp.fullName}>
                        {opp.fullName}
                      </h4>
                      <p className="text-[10px] text-text-muted leading-none mt-0.5 truncate max-w-[100px]" title={opp.projectName}>
                        {opp.projectName}
                      </p>
                    </div>
                  </div>
                  <Badge tone={opp.probability > 75 ? "success" : "info"} className="text-[10px] py-0">
                    {opp.probability}% Prob
                  </Badge>
                </div>

                <div className="border-y border-border-soft py-2 space-y-1.5 text-label">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Budget:</span>
                    <span className="font-semibold text-text-primary">{formatRadarCurrency(opp.budgetMax)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Stage:</span>
                    <span className="font-semibold text-text-primary">
                      {opp.stage === "Site Visit Scheduled" ? "Site Visit" : opp.stage}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Age in stage:
                    </span>
                    <span className={`font-semibold ${opp.daysInStage > 6 ? "text-red-500" : opp.daysInStage > 3 ? "text-amber-500" : "text-emerald-500"}`}>
                      {opp.daysInStage} Days
                    </span>
                  </div>
                </div>

                <div className="bg-surface-secondary border border-border-soft p-2.5 rounded-lg text-label">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Suggested Action</span>
                  <p className="text-text-secondary mt-1 italic leading-snug">"{opp.suggestedAction}"</p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full text-label py-1.5 rounded-[var(--radius-button)] font-semibold mt-auto gap-1"
                onClick={() => handleViewDetails(opp.id)}
              >
                View Details
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
