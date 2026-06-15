"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import {
  CalendarClock,
  CheckCircle2,
  Percent,
  TrendingUp,
  UserRoundCheck,
  Ban,
} from "lucide-react";
import type { SiteVisit } from "@/lib/erp-types";

interface SiteVisitsKpisProps {
  visits: SiteVisit[];
  isLoading: boolean;
}

export function SiteVisitsKpis({ visits, isLoading }: SiteVisitsKpisProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse bg-surface-secondary">
            <CardHeader className="h-12 border-none" />
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const scheduled = visits.filter((v) => v.status === "Scheduled");
  const completed = visits.filter((v) => v.status === "Completed");
  const cancelled = visits.filter((v) => v.status === "Cancelled" || v.status === "Rejected");
  const todayVisits = visits.filter((v) => v.scheduledAt?.startsWith(today));
  const completedToday = todayVisits.filter((v) => v.status === "Completed");
  const noShow = visits.filter((v) => v.status === "No Show");

  const visitToBookingRate =
    completed.length > 0
      ? Math.round((completed.length / (completed.length + scheduled.length + cancelled.length)) * 100)
      : 0;

  const coordinatorMap: Record<string, number> = {};
  completed.forEach((v) => {
    coordinatorMap[v.coordinatorName] = (coordinatorMap[v.coordinatorName] || 0) + 1;
  });
  const topCoordinator = Object.entries(coordinatorMap).sort((a, b) => b[1] - a[1])[0];

  const kpiItems = [
    {
      key: "scheduled",
      title: "Scheduled Visits",
      value: scheduled.length,
      trend: `${scheduled.length} active`,
      status: scheduled.length > 0 ? "Pending confirmation" : "No pending visits",
      tone: "info" as const,
      icon: CalendarClock,
    },
    {
      key: "completed",
      title: "Completed Today",
      value: completedToday.length,
      trend: completedToday.length > 0 ? "Today" : "No visits today",
      status: completedToday.length > 0 ? `${completedToday.length} tours done` : "No tours completed",
      tone: completedToday.length > 0 ? "success" as const : "neutral" as const,
      icon: CheckCircle2,
    },
    {
      key: "conversion",
      title: "Visit-to-Booking",
      value: `${visitToBookingRate}%`,
      trend: `${completed.length} completed`,
      status: visitToBookingRate >= 50 ? "Strong conversion" : "Needs improvement",
      tone: visitToBookingRate >= 50 ? "success" as const : "warning" as const,
      icon: Percent,
    },
    {
      key: "today",
      title: "Today's Visits",
      value: todayVisits.length,
      trend: `${todayVisits.length} scheduled`,
      status: todayVisits.length > 0 ? `${completedToday.length} done, ${todayVisits.length - completedToday.length} pending` : "No visits scheduled",
      tone: todayVisits.length > 0 ? "info" as const : "neutral" as const,
      icon: TrendingUp,
    },
    {
      key: "coordinator",
      title: "Top Coordinator",
      value: topCoordinator?.[1] || 0,
      trend: topCoordinator?.[0] || "N/A",
      status: topCoordinator ? `${topCoordinator[1]} visits completed` : "No data",
      tone: "neutral" as const,
      icon: UserRoundCheck,
    },
    {
      key: "noshow",
      title: "No-Show Rate",
      value: `${visits.length > 0 ? Math.round((noShow.length / visits.length) * 100) : 0}%`,
      trend: `${noShow.length} missed`,
      status: noShow.length > 0 ? `${noShow.length} leads missed their visit` : "All visits honored",
      tone: noShow.length > 0 ? "warning" as const : "success" as const,
      icon: Ban,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                    <LineChart data={[{ val: 0 }, { val: typeof item.value === 'number' ? item.value : parseInt(item.value) || 0 }]}>
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
