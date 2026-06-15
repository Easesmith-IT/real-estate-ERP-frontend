"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Cpu, Award } from "lucide-react";
import { PayrollResponse } from "@/types/payroll";

interface PayrollProjectCostsProps {
  projectCosts: PayrollResponse["projectLaborCosts"] | undefined;
  isLoading: boolean;
}

export function PayrollProjectCosts({ projectCosts, isLoading }: PayrollProjectCostsProps) {
  if (isLoading || !projectCosts) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="animate-pulse bg-surface-secondary">
            <CardHeader className="h-12 border-none" />
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${(val / 1000).toFixed(0)}k`;
  };

  const getEfficiencyTone = (score: number) => {
    if (score >= 90) return "success" as const;
    if (score >= 80) return "info" as const;
    return "warning" as const;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-accent-secondary/10 p-1 text-accent-secondary">
          <TrendingUp className="h-4 w-4" />
        </div>
        <h2 className="text-body font-semibold text-text-primary">Project Labor Cost Overview</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {projectCosts.map((project) => (
          <Card
            key={project.projectName}
            className="overflow-hidden border-border-soft hover:shadow-soft transition-all duration-200 bg-surface-primary hover:border-text-secondary/20 flex flex-col justify-between"
          >
            <CardHeader className="pb-2 border-b border-border-soft/60">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-body font-semibold text-text-primary truncate" title={project.projectName}>
                  {project.projectName}
                </CardTitle>
                <Badge
                  tone={project.costTrend.startsWith("-") ? "success" : "warning"}
                  className="text-[10px] shrink-0 font-semibold px-1.5 py-0.5"
                >
                  {project.costTrend}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              <div className="space-y-1">
                <span className="text-label text-text-muted font-medium">Labor Cost</span>
                <p className="text-page-title font-bold text-accent-primary leading-none">
                  {formatCurrency(project.laborCost)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-border-soft/60 pt-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="rounded bg-surface-secondary p-1 text-text-secondary">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-text-muted font-medium uppercase leading-none">Workforce</p>
                    <p className="text-label font-bold text-text-primary mt-0.5 truncate">{project.workforceCount} Workers</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="rounded bg-surface-secondary p-1 text-text-secondary">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-text-muted font-medium uppercase leading-none">Efficiency</p>
                    <p className="text-label font-bold text-text-primary mt-0.5 truncate">{project.efficiencyScore} Score</p>
                  </div>
                </div>
              </div>

              {/* Progress visual indicator of efficiency */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-text-muted font-medium uppercase">
                  <span>Efficiency Rating</span>
                  <span className="font-bold text-text-primary">{project.efficiencyScore}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-hover overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${project.efficiencyScore}%`,
                      backgroundColor:
                        project.efficiencyScore >= 90
                          ? "#22c55e"
                          : project.efficiencyScore >= 80
                          ? "#06b6d4"
                          : "#f59e0b",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
