"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { IndianRupee, AlertCircle, Building2, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { PayrollResponse } from "@/types/payroll";

interface PayrollKpiCardsProps {
  summaries: PayrollResponse["summaries"] | undefined;
  isLoading: boolean;
}

export function PayrollKpiCards({ summaries, isLoading }: PayrollKpiCardsProps) {
  if (isLoading || !summaries) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} className="animate-pulse bg-surface-secondary">
            <CardHeader className="h-12 border-none" />
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  const {
    monthlyPayrollCost,
    monthlyPayrollCostTrend,
    payrollLiability,
    payrollLiabilityStatus,
    costPerProject,
    costPerProjectTrend,
    attendanceEfficiency,
    attendanceEfficiencyStatus,
    payrollUtilization,
    payrollUtilizationStatus,
    productivityIndex,
    productivityIndexStatus,
    sparklines,
  } = summaries;

  const formatCurrency = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    return `₹${(val / 1000).toFixed(0)}k`;
  };

  const kpiItems = [
    {
      title: "Monthly Payroll Cost",
      value: formatCurrency(monthlyPayrollCost),
      trend: monthlyPayrollCostTrend,
      status: "Active Month",
      tone: "info" as const,
      icon: IndianRupee,
      sparklineData: sparklines.monthlyCost.map((v, i) => ({ id: i, val: v })),
    },
    {
      title: "Estimated Payroll Liability",
      value: formatCurrency(payrollLiability),
      trend: "Pending processing",
      status: payrollLiabilityStatus,
      tone: "warning" as const,
      icon: AlertCircle,
      sparklineData: sparklines.liability.map((v, i) => ({ id: i, val: v })),
    },
    {
      title: "Workforce Cost per Project",
      value: formatCurrency(costPerProject),
      trend: costPerProjectTrend,
      status: "Average Cost",
      tone: "neutral" as const,
      icon: Building2,
      sparklineData: sparklines.costPerProject.map((v, i) => ({ id: i, val: v })),
    },
    {
      title: "Attendance Efficiency",
      value: `${attendanceEfficiency}%`,
      trend: "Checked-in Roster",
      status: attendanceEfficiencyStatus,
      tone: "success" as const,
      icon: CheckCircle2,
      sparklineData: sparklines.attendance.map((v, i) => ({ id: i, val: v })),
    },
    {
      title: "Payroll Utilization Score",
      value: `${payrollUtilization}%`,
      trend: "Optimal Budget",
      status: payrollUtilizationStatus,
      tone: "info" as const,
      icon: TrendingUp,
      sparklineData: sparklines.utilization.map((v, i) => ({ id: i, val: v })),
    },
    {
      title: "Workforce Productivity Index",
      value: `${productivityIndex}%`,
      trend: "Above Benchmark",
      status: productivityIndexStatus,
      tone: "success" as const,
      icon: Zap,
      sparklineData: sparklines.productivity.map((v, i) => ({ id: i, val: v })),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {kpiItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Card key={item.title} className="card-kpi hover:shadow-soft transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-none pb-2 space-y-0">
              <CardTitle className="text-kpi-label text-text-kpi-label">{item.title}</CardTitle>
              <div className="rounded-full bg-surface-secondary p-1.5 text-text-secondary">
                <IconComponent className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-kpi-value text-text-primary font-semibold">{item.value}</p>
                  <p className="text-label text-text-muted mt-1">{item.status}</p>
                </div>
                <div className="h-8 w-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={item.sparklineData}>
                      <Line
                        type="monotone"
                        dataKey="val"
                        stroke={
                          item.tone === "success"
                            ? "#22c55e"
                            : item.tone === "warning"
                            ? "#f59e0b"
                            : item.tone === "info"
                            ? "#06b6d4"
                            : "#3b82f6"
                        }
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <Badge tone={item.tone} className="text-kpi-trend py-0.5">
                  {item.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
