"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type ContractorKpiItem = {
  label: string;
  value: string;
  trend: string;
  status: string;
  tone: "success" | "warning" | "info" | "neutral" | "error";
  icon: LucideIcon;
  sparkline: number[];
  isTrendUp?: boolean;
};

function Sparkline({ points, tone }: { points: number[]; tone: string }) {
  const width = 120;
  const height = 40;
  const normalized = points && points.length ? points : [40, 50, 45, 60, 55, 70, 75];
  const min = Math.min(...normalized);
  const max = Math.max(...normalized);
  const range = max - min || 1;
  const path = normalized
    .map((point, index) => {
      const x = (index / Math.max(normalized.length - 1, 1)) * width;
      const y = height - ((point - min) / range) * (height - 6) - 3;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const colorMap: Record<string, string> = {
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#2563eb",
    neutral: "#94a3b8",
  };
  const color = colorMap[tone] || colorMap.info;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-full" style={{ color }} aria-hidden="true">
      <path
        d={`M 0 ${height} ${path} L ${width} ${height} Z`}
        fill="currentColor"
        opacity="0.08"
      />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ContractorKpiCards({ items }: { items: ContractorKpiItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;
        const isTrendUp = item.isTrendUp !== false;

        return (
          <Card key={item.label} className="card-kpi overflow-hidden border-border-soft/80 bg-surface">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="kpi-icon-shell flex h-10 w-10 items-center justify-center rounded-[12px] bg-active-soft">
                    <Icon className="h-5 w-5 text-accent-primary" />
                  </div>
                  <div>
                    <p className="text-kpi-label text-text-kpi-label font-medium">{item.label}</p>
                    <p className="mt-1 text-kpi-value text-text-primary font-semibold tracking-tight">{item.value}</p>
                  </div>
                </div>
                <Badge tone={item.tone} className="gap-1 px-1.5 py-0.5">
                  {isTrendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span className="text-[10px] font-medium">{item.status}</span>
                </Badge>
              </div>
              <div className="pt-1">
                <Sparkline points={item.sparkline} tone={item.tone} />
              </div>
              <p className="text-label text-text-secondary leading-none mt-1">{item.trend}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
