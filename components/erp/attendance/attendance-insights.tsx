"use client";
import { toast } from "@/components/ui/toast";

import { CheckCircle2, AlertTriangle, AlertOctagon, Info, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type InsightCard = {
  id: string;
  title: string;
  type: "success" | "warning" | "critical" | "info";
  description: string;
  actionText: string;
  onAction: () => void;
};

type AttendanceInsightsProps = {
  attendanceRate: number;
  lateCount: number;
};

export function AttendanceInsights({ attendanceRate, lateCount }: AttendanceInsightsProps) {
  
  const handleAction = (title: string, action: string) => {
    toast.info(`Triggered action for "${title}": ${action}`);
  };

  const insightsList: InsightCard[] = [];

  // 1. Overall Attendance State (Stable vs Risk)
  if (attendanceRate >= 93) {
    insightsList.push({
      id: "opt-stable",
      title: "Attendance Stable",
      type: "success",
      description: `${attendanceRate}% attendance across active sites today. Operation schedules are running at optimal capacity.`,
      actionText: "Review Site Allocations",
      onAction: () => handleAction("Attendance Stable", "Opening site allocation reviews..."),
    });
  } else {
    insightsList.push({
      id: "opt-risk",
      title: "Workforce Risk",
      type: "warning",
      description: `Site B attendance dropped by 12% today. Cross-reference with supervisor shift updates for blocker logs.`,
      actionText: "Inspect Site B Updates",
      onAction: () => handleAction("Workforce Risk", "Opening Site B daily logs..."),
    });
  }

  // 2. Labor Shortages (Critical Alert)
  insightsList.push({
    id: "opt-shortage",
    title: "Labor Shortage",
    type: "critical",
    description: "Riverfront Towers is understaffed by 8 workers. Concrete pouring phase faces immediate schedule delays.",
    actionText: "Reallocate Workforce",
    onAction: () => handleAction("Labor Shortage", "Opening workforce allocation matching screen..."),
  });

  // 3. Late Check-in Patterns (Warning Alert)
  if (lateCount > 15) {
    insightsList.push({
      id: "opt-late",
      title: "Late Arrival Pattern",
      type: "warning",
      description: `Procurement department reported ${lateCount} late arrivals today. Investigating transport logs or route delays.`,
      actionText: "View Late Check-ins",
      onAction: () => handleAction("Late Arrival Pattern", "Filtering register for late check-ins..."),
    });
  }

  // 4. Positive Achievements (Success Alert)
  insightsList.push({
    id: "opt-improvement",
    title: "Attendance Improvement",
    type: "success",
    description: "Sales team achieved 100% attendance this week. High engagement noted across sales office locations.",
    actionText: "Send Appreciation",
    onAction: () => handleAction("Attendance Improvement", "Sending email acknowledgement to sales supervisor..."),
  });

  // Icon selector based on status type
  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />;
      case "critical":
        return <AlertOctagon className="h-5 w-5 text-red shrink-0 mt-0.5" />;
      default:
        return <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />;
    }
  };

  // Badge tone mapper
  const getBadgeTone = (type: string): "success" | "warning" | "neutral" | "info" => {
    switch (type) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "critical":
        return "warning"; // mapping critical to warning badge color
      default:
        return "info";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-section-title font-secondary text-text-primary">
          Attendance Operations Intelligence
        </CardTitle>
        <p className="text-body text-text-secondary mt-1">
          Automated recommendations and risk detection metrics processed for today&apos;s deployment.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {insightsList.map((insight) => (
            <div
              key={insight.id}
              className="flex flex-col justify-between rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4 hover:shadow-soft transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {getIcon(insight.type)}
                    <span className="font-semibold text-text-primary text-body">{insight.title}</span>
                  </div>
                  <Badge tone={getBadgeTone(insight.type)} className="capitalize">
                    {insight.type === "critical" ? "Critical" : insight.type}
                  </Badge>
                </div>
                <p className="text-body text-text-secondary leading-relaxed">{insight.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-border-soft flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs font-semibold text-accent-primary hover:text-accent-secondary p-0 hover:bg-transparent flex items-center gap-1.5"
                  onClick={insight.onAction}
                >
                  {insight.actionText}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
