"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type WorkforceBreakdown = {
  skilled: number;
  semiSkilled: number;
  supervisors: number;
  engineers: number;
  laborers: number;
};

const rolesConfig = [
  { key: "skilled", label: "Skilled Workers", color: "#2563eb" },
  { key: "semiSkilled", label: "Semi-Skilled Workers", color: "#06b6d4" },
  { key: "laborers", label: "Laborers", color: "#22c55e" },
  { key: "supervisors", label: "Supervisors", color: "#f59e0b" },
  { key: "engineers", label: "Engineers", color: "#ef4444" },
];

export function ContractorWorkforce({ breakdown }: { breakdown: WorkforceBreakdown }) {
  const total =
    breakdown.skilled +
    breakdown.semiSkilled +
    breakdown.supervisors +
    breakdown.engineers +
    breakdown.laborers;

  const data = rolesConfig
    .map((role) => ({
      name: role.label,
      value: breakdown[role.key as keyof WorkforceBreakdown] || 0,
      color: role.color,
    }))
    .filter((d) => d.value > 0);

  return (
    <Card className="border-border-soft/80 bg-surface">
      <CardHeader>
        <CardTitle className="text-section-title font-secondary text-text-primary">Workforce Composition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Donut Chart */}
          <div className="md:col-span-5 h-[220px] relative flex items-center justify-center">
            {total > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-bg-surface)",
                        borderColor: "var(--color-border-soft)",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "var(--color-text-primary)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold text-text-primary tracking-tight">{total}</span>
                  <span className="text-label text-text-secondary uppercase tracking-wider font-semibold">Total Deployed</span>
                </div>
              </>
            ) : (
              <p className="text-body text-text-muted">No workforce deployed.</p>
            )}
          </div>

          {/* Progress Indicators & Legend */}
          <div className="md:col-span-7 space-y-4">
            {rolesConfig.map((role) => {
              const value = breakdown[role.key as keyof WorkforceBreakdown] || 0;
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

              return (
                <div key={role.key} className="space-y-1.5">
                  <div className="flex justify-between items-center text-body">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: role.color }} />
                      <span className="text-text-primary font-medium">{role.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary font-semibold">{value}</span>
                      <span className="text-label text-text-muted">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: role.color,
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {rolesConfig.map((role) => {
            const value = breakdown[role.key as keyof WorkforceBreakdown] || 0;
            return (
              <div
                key={role.key}
                className="p-3 rounded-[var(--radius-card)] border border-border-soft/60 bg-surface-secondary text-center space-y-1.5"
              >
                <p className="text-label text-text-secondary leading-none">{role.label}</p>
                <p className="text-xl font-bold text-text-primary leading-none" style={{ color: role.color }}>
                  {value}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
