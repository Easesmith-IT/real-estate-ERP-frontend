"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import {
  Users,
  Calendar,
  Sparkles,
  BookmarkCheck,
  Clock,
  Percent,
  TrendingUp,
  Coins,
} from "lucide-react";

interface KpiData {
  value: number;
  trend: string;
  status: string;
  sparkline: number[];
}

interface LeadsKpisProps {
  kpis: {
    activeLeads: KpiData;
    scheduledVisits: KpiData;
    highValue: KpiData;
    bookedThisCycle: KpiData;
    overdueFollowUps: KpiData;
    conversionRate: KpiData;
    pipelineValue: KpiData;
    forecastRevenue: KpiData;
  } | undefined;
  isLoading: boolean;
}

export function LeadsKpis({ kpis, isLoading }: LeadsKpisProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <Card key={idx} className="animate-pulse bg-surface-secondary">
            <CardHeader className="h-12 border-none" />
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  const formatValue = (key: string, value: number) => {
    if (key === "conversionRate") return `${value}%`;
    if (key === "pipelineValue" || key === "forecastRevenue") return `₹${value} Cr`;
    return value.toLocaleString("en-IN");
  };

  const kpiItems = [
    {
      key: "activeLeads",
      title: "Active Leads",
      value: formatValue("activeLeads", kpis.activeLeads.value),
      trend: kpis.activeLeads.trend,
      status: kpis.activeLeads.status,
      tone: "info" as const,
      icon: Users,
      sparklineData: kpis.activeLeads.sparkline.map((v, i) => ({ id: i, val: v })),
    },
    {
      key: "scheduledVisits",
      title: "Scheduled Site Visits",
      value: formatValue("scheduledVisits", kpis.scheduledVisits.value),
      trend: kpis.scheduledVisits.trend,
      status: kpis.scheduledVisits.status,
      tone: "info" as const,
      icon: Calendar,
      sparklineData: kpis.scheduledVisits.sparkline.map((v, i) => ({ id: i, val: v })),
    },
    {
      key: "highValue",
      title: "High Value Opportunities",
      value: formatValue("highValue", kpis.highValue.value),
      trend: kpis.highValue.trend,
      status: kpis.highValue.status,
      tone: "neutral" as const,
      icon: Sparkles,
      sparklineData: kpis.highValue.sparkline.map((v, i) => ({ id: i, val: v })),
    },
    {
      key: "bookedThisCycle",
      title: "Booked This Cycle",
      value: formatValue("bookedThisCycle", kpis.bookedThisCycle.value),
      trend: kpis.bookedThisCycle.trend,
      status: kpis.bookedThisCycle.status,
      tone: "success" as const,
      icon: BookmarkCheck,
      sparklineData: kpis.bookedThisCycle.sparkline.map((v, i) => ({ id: i, val: v })),
    },
    {
      key: "overdueFollowUps",
      title: "Overdue Follow-Ups",
      value: formatValue("overdueFollowUps", kpis.overdueFollowUps.value),
      trend: kpis.overdueFollowUps.trend,
      status: kpis.overdueFollowUps.status,
      tone: kpis.overdueFollowUps.value > 0 ? ("warning" as const) : ("success" as const),
      icon: Clock,
      sparklineData: kpis.overdueFollowUps.sparkline.map((v, i) => ({ id: i, val: v })),
    },
    {
      key: "conversionRate",
      title: "Conversion Rate",
      value: formatValue("conversionRate", kpis.conversionRate.value),
      trend: kpis.conversionRate.trend,
      status: kpis.conversionRate.status,
      tone: "success" as const,
      icon: Percent,
      sparklineData: kpis.conversionRate.sparkline.map((v, i) => ({ id: i, val: v })),
    },
    {
      key: "pipelineValue",
      title: "Pipeline Value",
      value: formatValue("pipelineValue", kpis.pipelineValue.value),
      trend: kpis.pipelineValue.trend,
      status: kpis.pipelineValue.status,
      tone: "info" as const,
      icon: TrendingUp,
      sparklineData: kpis.pipelineValue.sparkline.map((v, i) => ({ id: i, val: v })),
    },
    {
      key: "forecastRevenue",
      title: "Forecast Revenue",
      value: formatValue("forecastRevenue", kpis.forecastRevenue.value),
      trend: kpis.forecastRevenue.trend,
      status: kpis.forecastRevenue.status,
      tone: "neutral" as const,
      icon: Coins,
      sparklineData: kpis.forecastRevenue.sparkline.map((v, i) => ({ id: i, val: v })),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiItems.map((item) => {
        const IconComponent = item.icon;
        const strokeColor =
          item.tone === "success"
            ? "#22c55e"
            : item.tone === "warning"
            ? "#f59e0b"
            : item.tone === "info"
            ? "#0ea5e9"
            : "#64748b";

        return (
          <Card key={item.key} className="card-kpi hover:shadow-soft transition-all duration-200">
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
                        stroke={strokeColor}
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
