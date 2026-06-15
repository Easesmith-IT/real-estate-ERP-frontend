"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingDown, Users, Coins } from "lucide-react";

interface PipelineFunnelProps {
  leads: any[];
}

export function PipelineFunnel({ leads }: PipelineFunnelProps) {
  const funnelData = useMemo(() => {
    if (!leads || leads.length === 0) return [];

    const stages = [
      { id: "New", label: "New Leads", color: "#3b82f6", bg: "bg-blue-500/10 text-blue-500" },
      { id: "Contacted", label: "Contacted", color: "#06b6d4", bg: "bg-cyan-500/10 text-cyan-500" },
      { id: "Interested", label: "Interested", color: "#6366f1", bg: "bg-indigo-500/10 text-indigo-500" },
      { id: "Site Visit Scheduled", label: "Site Visit", color: "#f59e0b", bg: "bg-amber-500/10 text-amber-500" },
      { id: "Negotiation", label: "Negotiation", color: "#ec4899", bg: "bg-pink-500/10 text-pink-500" },
      { id: "Booking", label: "Booking", color: "#8b5cf6", bg: "bg-purple-500/10 text-purple-500" },
      { id: "Closed Won", label: "Closed Won", color: "#22c55e", bg: "bg-emerald-500/10 text-emerald-500" },
    ];

    // Compute cumulative counts & values
    // A lead in a later stage is assumed to have passed through all earlier stages.
    const getStageIndex = (stage: string) => {
      const idx = stages.findIndex((s) => s.id === stage);
      return idx === -1 ? 0 : idx;
    };

    const counts = stages.map((stage, idx) => {
      // Leads currently in this stage or any subsequent stage
      const matchingLeads = leads.filter((l) => {
        if (l.stage === "Closed Lost") return false;
        return getStageIndex(l.stage) >= idx;
      });

      const count = matchingLeads.length;
      const value = matchingLeads.reduce((sum, l) => sum + (l.budgetMax || 0), 0);

      return {
        ...stage,
        count,
        value,
      };
    });

    const totalLeads = counts[0]?.count || 1;

    return counts.map((item, idx) => {
      const prevCount = idx > 0 ? counts[idx - 1].count : totalLeads;
      const conversion = prevCount > 0 ? Math.round((item.count / prevCount) * 100) : 0;
      const dropOff = idx === 0 ? 0 : 100 - conversion;
      const totalConversion = Math.round((item.count / totalLeads) * 100);

      return {
        ...item,
        conversionFromPrev: idx === 0 ? 100 : conversion,
        dropOffFromPrev: dropOff,
        totalConversion,
      };
    });
  }, [leads]);

  // Compute Closed Lost separately as the funnel leakage
  const lostMetrics = useMemo(() => {
    const lostLeads = leads.filter((l) => l.stage === "Closed Lost");
    const count = lostLeads.length;
    const value = lostLeads.reduce((sum, l) => sum + (l.budgetMax || 0), 0);
    return { count, value };
  }, [leads]);

  const formatFunnelValue = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(val / 100000).toFixed(0)} L`;
  };

  const totalBase = funnelData[0]?.count || 0;

  return (
    <Card className="border-border-soft hover:shadow-soft transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-section-title font-secondary text-text-primary">
            Revenue Funnel Visualization
          </CardTitle>
          <p className="text-label text-text-muted mt-1">
            Conversion flows and drop-offs tracking deals from inquiry creation to final booking signature.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone="success" className="text-label py-1 px-3">
            Active Base: {totalBase} Leads
          </Badge>
          <Badge tone="error" className="text-label py-1 px-3">
            Lost Leakage: {lostMetrics.count} Leads ({formatFunnelValue(lostMetrics.value)})
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col xl:flex-row items-stretch justify-between gap-3 overflow-x-auto pb-4 min-w-[1000px] xl:min-w-0">
          {funnelData.map((stage, idx) => {
            const widthPct = Math.max(12, Math.round((stage.count / (totalBase || 1)) * 100));

            return (
              <div key={stage.id} className="flex-1 flex flex-row xl:flex-col items-center gap-2">
                <div className="flex-1 w-full bg-surface-secondary border border-border-soft rounded-[var(--radius-card)] pt-4 px-4 pb-7 flex flex-col justify-between space-y-4 hover:border-border-strong transition-all duration-150 relative overflow-hidden">
                  {/* Backdrop indicator */}
                  <div
                    className="absolute bottom-0 left-0 h-1 transition-all duration-300"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: stage.color,
                    }}
                  />

                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      Stage {idx + 1}
                    </span>
                    <Badge className={`py-0.5 px-2 font-semibold text-[11px] ${stage.bg}`}>
                      {stage.label === "Site Visit Scheduled" ? "Site Visit" : stage.label}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[28px] font-bold text-text-primary tracking-tight">
                        {stage.count}
                      </span>
                      <span className="text-label text-text-muted">Leads</span>
                    </div>
                    <div className="flex items-center gap-1 text-[13px] font-bold text-text-primary">
                      <Coins className="h-3.5 w-3.5 text-text-muted" />
                      <span>{formatFunnelValue(stage.value)}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-border-soft pt-3 text-label space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Overall conversion:</span>
                      <span className="font-semibold text-text-primary">{stage.totalConversion}%</span>
                    </div>
                    {idx > 0 && (
                      <div className="flex justify-between items-center text-text-muted">
                        <span className="flex items-center gap-1 text-emerald-500">
                          <ArrowRight className="h-3 w-3" />
                          {stage.conversionFromPrev}% kept
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <TrendingDown className="h-3 w-3" />
                          {stage.dropOffFromPrev}% drop
                        </span>
                      </div>
                    )}
                    {idx === 0 && (
                      <div className="text-[10px] text-text-muted italic text-center pt-0.5">
                        Top of Funnel Entry
                      </div>
                    )}
                  </div>
                </div>

                {idx < funnelData.length - 1 && (
                  <div className="flex xl:hidden items-center justify-center text-text-muted px-1">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
