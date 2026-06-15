"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ShieldAlert, Award, TrendingUp } from "lucide-react";
import { PayrollResponse } from "@/types/payroll";

interface PayrollProductivityProps {
  matrix: PayrollResponse["productivityMatrix"] | undefined;
  isLoading: boolean;
}

export function PayrollProductivity({ matrix, isLoading }: PayrollProductivityProps) {
  if (isLoading || !matrix) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Card key={idx} className="animate-pulse bg-surface-secondary">
            <CardHeader className="h-10 border-none" />
            <CardContent className="h-44" />
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${(val / 1000).toFixed(0)}k`;
  };

  const getHeatmapColor = (score: number) => {
    if (score >= 93) return "bg-accent-green/10 text-accent-green border-accent-green/20";
    if (score >= 88) return "bg-accent-blue/10 text-accent-blue border-accent-blue/20";
    if (score >= 80) return "bg-accent-amber/10 text-accent-amber border-accent-amber/20";
    return "bg-accent-red/10 text-accent-red border-accent-red/20";
  };

  const getHeatBadgeTone = (score: number) => {
    if (score >= 90) return "success" as const;
    if (score >= 80) return "info" as const;
    return "warning" as const;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-accent-primary/10 p-1 text-accent-primary">
          <Activity className="h-4 w-4" />
        </div>
        <h2 className="text-body font-semibold text-text-primary">Workforce Productivity Matrix</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {matrix.map((row) => (
          <Card
            key={row.department}
            className="overflow-hidden border-border-soft hover:shadow-soft transition-all duration-200 bg-surface-primary hover:border-text-secondary/20 flex flex-col justify-between"
          >
            <CardHeader className="pb-3 border-b border-border-soft/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-body font-bold text-text-primary">
                  {row.department}
                </CardTitle>
                <Badge tone={getHeatBadgeTone(row.costEfficiency)} className="text-[10px] font-bold">
                  {row.costEfficiency >= 90 ? "High Yield" : row.costEfficiency >= 80 ? "Optimal" : "Needs Review"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {/* Heatmap Grid Stats */}
              <div className="grid grid-cols-2 gap-2 text-center">
                
                {/* Attendance Cell */}
                <div className={`p-2.5 rounded-lg border flex flex-col items-center justify-center ${getHeatmapColor(row.attendanceRate)}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 leading-none">Attendance</span>
                  <span className="text-body font-bold mt-1.5 leading-none">{row.attendanceRate}%</span>
                </div>

                {/* Productivity Cell */}
                <div className={`p-2.5 rounded-lg border flex flex-col items-center justify-center ${getHeatmapColor(row.productivityScore)}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 leading-none">Productivity</span>
                  <span className="text-body font-bold mt-1.5 leading-none">{row.productivityScore}%</span>
                </div>

                {/* Cost Cell */}
                <div className="p-2.5 rounded-lg border border-border-soft bg-surface-secondary/40 text-text-secondary flex flex-col items-center justify-center col-span-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted leading-none">Payroll Expenditure</span>
                  <span className="text-body font-bold text-text-primary mt-1.5 leading-none">{formatCurrency(row.payrollCost)}</span>
                </div>

              </div>

              {/* Cost Efficiency Heat Score Ring/Progress */}
              <div className="space-y-2 pt-2 border-t border-border-soft/60">
                <div className="flex items-center justify-between text-label">
                  <div className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-text-secondary" />
                    <span className="text-text-secondary font-medium">Cost Efficiency</span>
                  </div>
                  <span className="font-bold text-text-primary">{row.costEfficiency}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-hover overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${row.costEfficiency}%`,
                      backgroundColor:
                        row.costEfficiency >= 90
                          ? "#22c55e"
                          : row.costEfficiency >= 80
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
