"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingDown } from "lucide-react";

interface StageCount {
  stage: string;
  count: number;
}

interface LeadsFunnelProps {
  stageCounts: StageCount[] | undefined;
  isLoading: boolean;
}

export function LeadsFunnel({ stageCounts, isLoading }: LeadsFunnelProps) {
  if (isLoading || !stageCounts) {
    return (
      <Card className="bg-surface">
        <CardHeader>
          <CardTitle>Lead Funnel Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-64 animate-pulse bg-surface-secondary rounded-[var(--radius-card)]" />
      </Card>
    );
  }

  // Map backend stages to display names and colors
  // Stages: "New", "Contacted", "Interested", "Site Visit Scheduled", "Negotiation", "Booking", "Closed Won", "Closed Lost"
  const stageMeta: Record<string, { label: string; color: string; bg: string }> = {
    "New": { label: "New Leads", color: "#3b82f6", bg: "bg-blue-500/10 text-blue-500" },
    "Contacted": { label: "Contacted", color: "#06b6d4", bg: "bg-cyan-500/10 text-cyan-500" },
    "Interested": { label: "Interested", color: "#6366f1", bg: "bg-indigo-500/10 text-indigo-500" },
    "Site Visit Scheduled": { label: "Site Visit", color: "#f59e0b", bg: "bg-amber-500/10 text-amber-500" },
    "Negotiation": { label: "Negotiation", color: "#ec4899", bg: "bg-pink-500/10 text-pink-500" },
    "Booking": { label: "Booking", color: "#8b5cf6", bg: "bg-purple-500/10 text-purple-500" },
    "Closed Won": { label: "Closed Won", color: "#22c55e", bg: "bg-emerald-500/10 text-emerald-500" },
    "Closed Lost": { label: "Closed Lost", color: "#ef4444", bg: "bg-red-500/10 text-red-500" },
  };

  // Order stages logically
  const orderedStages = [
    "New",
    "Contacted",
    "Interested",
    "Site Visit Scheduled",
    "Negotiation",
    "Booking",
    "Closed Won",
  ];

  // Extract counts
  const data = orderedStages.map((stage) => {
    const found = stageCounts.find((sc) => sc.stage === stage);
    return {
      stage,
      count: found ? found.count : 0,
      ...stageMeta[stage],
    };
  });

  const totalLeads = data[0]?.count || 1;

  // Calculate conversion and drop-off
  const funnelData = data.map((item, idx) => {
    const prevCount = idx > 0 ? data[idx - 1].count : totalLeads;
    const conversion = prevCount > 0 ? Math.round((item.count / prevCount) * 100) : 0;
    const dropOff = 100 - conversion;
    const totalConversion = Math.round((item.count / totalLeads) * 100);

    return {
      ...item,
      conversionFromPrev: idx === 0 ? 100 : conversion,
      dropOffFromPrev: idx === 0 ? 0 : dropOff,
      totalConversion,
    };
  });

  return (
    <Card className="hover:shadow-soft transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-section-title font-secondary text-text-primary">
            Lead Funnel Visualization
          </CardTitle>
          <p className="text-label text-text-muted mt-1">
            Conversion rates and stage-by-stage drop-offs across the active sales lifecycle.
          </p>
        </div>
        <Badge tone="success" className="text-label">
          Total Base: {totalLeads} Leads
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {funnelData.map((stage, idx) => {
            const widthPct = Math.max(10, Math.round((stage.count / totalLeads) * 100));

            return (
              <div key={stage.stage} className="flex flex-col h-full">
                <div className="flex-1 w-full bg-surface-secondary border border-border-soft rounded-[var(--radius-card)] pt-4 px-4 pb-6 flex flex-col justify-between space-y-4 hover:border-border-strong transition-all duration-150 relative overflow-hidden">
                  {/* Backdrop width bar */}
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-accent-primary/20 transition-all duration-300"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: stage.color,
                    }}
                  />

                  <div className="flex justify-between items-start">
                    <span className="text-label text-text-muted font-semibold uppercase tracking-wider">
                      Stage {idx + 1}
                    </span>
                    <Badge className={`py-0.5 ${stage.bg}`}>{stage.label}</Badge>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-page-title font-bold text-text-primary">
                        {stage.count}
                      </span>
                      <span className="text-label text-text-muted">Leads</span>
                    </div>

                    <div className="flex justify-between items-center mt-2.5 text-label">
                      <span className="text-text-secondary">Overall conversion:</span>
                      <span className="font-semibold text-text-primary">{stage.totalConversion}%</span>
                    </div>
                  </div>

                  {idx > 0 && (
                    <div className="border-t border-dashed border-border-soft pt-2.5 flex justify-between items-center text-label text-text-secondary">
                      <div className="flex items-center gap-1">
                        <ArrowRight className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{stage.conversionFromPrev}% kept</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-500">
                        <TrendingDown className="h-3.5 w-3.5" />
                        <span>{stage.dropOffFromPrev}% drop</span>
                      </div>
                    </div>
                  )}
                  {idx === 0 && (
                    <div className="border-t border-dashed border-border-soft pt-2.5 text-label text-text-muted font-medium text-center">
                      Top of Funnel Entry
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
