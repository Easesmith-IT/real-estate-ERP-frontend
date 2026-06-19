"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle2, TrendingUp, Cpu } from "lucide-react";
import { PayrollRecommendation } from "@/types/payroll";

interface PayrollInsightsProps {
  recommendations: PayrollRecommendation[] | undefined;
  isLoading: boolean;
  onExecuteAction?: (action: string, recommendation: PayrollRecommendation) => void;
}

export function PayrollInsights({ recommendations, isLoading, onExecuteAction }: PayrollInsightsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body font-semibold flex items-center gap-2">
            <Cpu className="h-4 w-4 animate-spin text-accent-primary" />
            Generating Recommendations...
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-[var(--radius-input)] shimmer-skeleton" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getPriorityIcon = (status: string) => {
    switch (status) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-accent-red" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-accent-amber" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-accent-green" />;
      default:
        return <Info className="h-4 w-4 text-accent-blue" />;
    }
  };

  const getTone = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "warning"; // badge uses warning or critical, let's map to supported tone
      case "warning":
        return "warning";
      case "success":
        return "success";
      default:
        return "info";
    }
  };

  return (
    <Card className="border-border-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-accent-primary/10 p-1 text-accent-primary">
            <Cpu className="h-4 w-4" />
          </div>
          <CardTitle className="text-body font-semibold text-text-primary">
            Workforce Cost Intelligence & Recommendations
          </CardTitle>
        </div>
        <p className="text-label text-text-muted">
          AI-driven operational alerts and cost optimization opportunities based on recent attendance and rate trends.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`flex flex-col justify-between rounded-[var(--radius-input)] border border-border-soft p-4 transition-all duration-200 hover:border-text-secondary/20 bg-surface-secondary/30`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getPriorityIcon(rec.status)}
                    <span className="text-label font-semibold text-text-primary">{rec.category}</span>
                  </div>
                  <Badge tone={getTone(rec.priority)} className="text-[10px] uppercase font-bold px-2 py-0.5">
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-body font-medium text-text-primary leading-tight">
                  {rec.title}
                </p>
                <p className="text-label text-text-muted leading-relaxed">
                  {rec.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border-soft flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-label h-8 px-3 border-border-strong font-medium text-text-primary hover:bg-surface-secondary"
                  onClick={() => onExecuteAction?.(rec.action, rec)}
                >
                  {rec.action}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
