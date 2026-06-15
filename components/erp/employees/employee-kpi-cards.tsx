"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type WorkforceKpiCard = {
  label: string;
  value: string;
  trend: string;
  status: string;
  tone: "success" | "warning" | "info" | "neutral";
  icon: LucideIcon;
  sparkline: number[];
};

function Sparkline({ points }: { points: number[] }) {
  const width = 120;
  const height = 42;
  const normalized = points.length ? points : [48, 56, 60, 64, 72, 79, 84];
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

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-full text-accent-primary" aria-hidden="true">
      <path
        d={`M 0 ${height} ${path} L ${width} ${height} Z`}
        fill="url(#workforce-spark-fill)"
        opacity="0.2"
      />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="workforce-spark-fill" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function EmployeeKpiCards({ items }: { items: WorkforceKpiCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label} className="card-kpi overflow-hidden border-border-soft/80">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="kpi-icon-shell flex h-11 w-11 items-center justify-center">
                    <Icon className="h-5 w-5 text-accent-primary" />
                  </div>
                  <div>
                    <p className="text-kpi-label text-text-kpi-label">{item.label}</p>
                    <p className="mt-2 text-kpi-value text-text-primary">{item.value}</p>
                  </div>
                </div>
                <Badge tone={item.tone} className="gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {item.status}
                </Badge>
              </div>
              <Sparkline points={item.sparkline} />
              <p className="text-body text-text-secondary">{item.trend}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
