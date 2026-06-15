"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PayrollResponse } from "@/types/payroll";

interface PayrollBreakdownProps {
  data: PayrollResponse | undefined;
  isLoading: boolean;
}

const donutColors = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444"];

export function PayrollBreakdown({ data, isLoading }: PayrollBreakdownProps) {
  if (isLoading || !data) {
    return (
      <Card className="animate-pulse bg-surface-secondary">
        <CardHeader className="h-12 border-none" />
        <CardContent className="h-96" />
      </Card>
    );
  }

  const { analytics, productivityMatrix } = data;
  const { payrollDistribution } = analytics;

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${(val / 1000).toFixed(0)}k`;
  };

  // Build cost allocation card information
  const allocationCards = productivityMatrix.map((matrixItem, index) => {
    // Find matching distribution percentage
    const dist = payrollDistribution.find((d) => d.name === matrixItem.department);
    const percentage = dist ? dist.value : 0;
    
    return {
      department: matrixItem.department,
      percentage,
      cost: matrixItem.payrollCost,
      color: donutColors[index % donutColors.length],
    };
  }).sort((a, b) => b.cost - a.cost);

  return (
    <Card className="border-border-soft hover:shadow-soft transition-all duration-200 h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-2">
          <CardTitle className="text-body font-semibold text-text-primary">
            Payroll Cost Distribution
          </CardTitle>
          <p className="text-label text-text-muted">Operational cost mix breakdown across primary departments.</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Donut Chart Visualization */}
          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={payrollDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={3}
                  isAnimationActive={false}
                >
                  {payrollDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, "Share"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-label text-text-muted font-medium">Total Cost</span>
              <span className="text-body font-bold text-text-primary mt-0.5">
                {formatCurrency(data.summaries.monthlyPayrollCost)}
              </span>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-3.5">
            {allocationCards.map((item) => (
              <div key={item.department} className="space-y-1.5">
                <div className="flex items-center justify-between text-body">
                  <span className="font-semibold text-text-primary">{item.department}</span>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-text-primary">{formatCurrency(item.cost)}</span>
                    <span className="text-text-muted">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-hover overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>

      <div className="p-6 pt-0 mt-6 border-t border-border-soft space-y-3 bg-surface-secondary/10 rounded-b-[var(--radius-input)]">
        <p className="text-label font-bold text-text-primary uppercase tracking-wider mt-4">Department Cost Allocations</p>
        <div className="grid grid-cols-1 gap-2.5">
          {allocationCards.slice(0, 3).map((item) => (
            <div key={item.department} className="flex items-center justify-between rounded-lg border border-border-soft bg-surface-primary p-2.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-label font-semibold text-text-primary">{item.department}</span>
              </div>
              <span className="text-label font-bold text-text-primary">{formatCurrency(item.cost)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
