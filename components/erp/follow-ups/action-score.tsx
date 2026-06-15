"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";
import { Lead } from "@/lib/erp-types";

interface ActionScoreProps {
  leads: Lead[];
}

export function ActionScore({ leads }: ActionScoreProps) {
  const scoreData = useMemo(() => {
    const total = leads.length;
    if (total === 0) return { score: 100, status: "Healthy", trend: "+0%", tone: "success" as const, overdue: 0, highRisk: 0, completionRate: 100, responseRate: 100 };

    const now = Date.now();
    const openLeads = leads.filter(
      (l) => !["Closed Won", "Closed Lost"].includes(l.stage)
    );
    const overdue = openLeads.filter(
      (l) => new Date(l.followUpAt).getTime() < now
    ).length;
    
    // Calculate a dynamic score out of 100 based on health metrics
    let penalty = 0;
    
    // 1. Overdue penalty: 3 points per overdue follow-up (max 40)
    penalty += Math.min(40, overdue * 3);
    
    // 2. High risk leads penalty (open leads not updated in 7+ days)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const highRisk = openLeads.filter(
      (l) => new Date(l.updatedAt).getTime() < sevenDaysAgo
    ).length;
    penalty += Math.min(20, highRisk * 2);

    // 3. Stage progression reward (Interested or beyond leads)
    const advancedLeads = leads.filter(
      (l) => ["Interested", "Site Visit Scheduled", "Negotiation", "Booking", "Closed Won"].includes(l.stage)
    ).length;
    const progressionBonus = Math.min(15, Math.round((advancedLeads / total) * 30));

    let score = Math.max(45, Math.min(98, 100 - penalty + progressionBonus));
    
    let status = "Healthy";
    let tone: "success" | "warning" | "error" = "success";
    
    if (score < 70) {
      status = "Needs Action";
      tone = "error";
    } else if (score < 85) {
      status = "Warning";
      tone = "warning";
    }

    return {
      score,
      status,
      tone,
      overdue,
      highRisk,
      completionRate: Math.round(((total - overdue) / total) * 100),
      responseRate: Math.round(((total - highRisk) / total) * 100),
    };
  }, [leads]);

  const { score, status, tone, overdue, highRisk, completionRate, responseRate } = scoreData;

  // Circular progress math
  const radius = 58;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="relative overflow-hidden border-border-soft bg-surface hover:shadow-soft transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-card-title font-semibold text-text-primary">
          Sales Action Health
        </CardTitle>
        <p className="text-label text-text-muted">Proactive engagement performance score.</p>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left: Circular visualization */}
          <div className="relative flex items-center justify-center h-36 w-36 shrink-0">
            <svg className="h-full w-full transform -rotate-90">
              <circle
                className="text-hover"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
                r={normalizedRadius}
                cx={72}
                cy={72}
              />
              <circle
                className={
                  tone === "success" 
                    ? "text-success" 
                    : tone === "warning" 
                      ? "text-warning" 
                      : "text-error"
                }
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + " " + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={normalizedRadius}
                cx={72}
                cy={72}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-kpi-value font-bold text-text-primary">{score}</span>
              <span className="text-label text-text-muted font-semibold">/ 100</span>
            </div>
          </div>

          {/* Right: Metrics & Trend */}
          <div className="flex-1 space-y-3.5 w-full">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {tone === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : tone === "warning" ? (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-error" />
                )}
                <span className="text-body font-bold text-text-primary">
                  Engagement Health:
                </span>
                <Badge tone={tone === "success" ? "success" : tone === "warning" ? "warning" : "error"} className="px-2.5 py-0.5 uppercase tracking-wider text-[10px] font-bold">
                  {status}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-success text-label font-bold">
                <TrendingUp className="h-4 w-4" />
                <span>+5% vs last week</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-dashed border-border-soft">
              <div className="space-y-1">
                <p className="text-label text-text-muted">Completion Rate</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-full rounded-full bg-hover relative overflow-hidden">
                    <div className="h-1.5 rounded-full bg-success" style={{ width: `${completionRate}%` }} />
                  </div>
                  <span className="text-label font-bold text-text-primary">{completionRate}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-label text-text-muted">Response Rate</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-full rounded-full bg-hover relative overflow-hidden">
                    <div className="h-1.5 rounded-full bg-accent-primary" style={{ width: `${responseRate}%` }} />
                  </div>
                  <span className="text-label font-bold text-text-primary">{responseRate}%</span>
                </div>
              </div>
            </div>

            <div className="text-label text-text-secondary leading-relaxed bg-surface-secondary p-3 rounded-[var(--radius-input)] border border-border-soft">
              {overdue > 0 ? (
                <span>⚠️ <strong>{overdue} overdue follow-ups</strong> are dragging down performance. Complete them to boost score.</span>
              ) : (
                <span>🎉 Zero overdue items! Engagement pipeline is moving exceptionally well today.</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
