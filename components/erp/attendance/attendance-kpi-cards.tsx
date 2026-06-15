"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { Users, Percent, UserX, Clock, Building, CalendarCheck2, ArrowUpRight, ArrowDownRight } from "lucide-react";

type KpiItem = {
  value: string | number;
  trend: string;
  trendType: "up" | "down" | "neutral" | "warning";
  status: string;
  sparkline: number[];
};

type AttendanceKpis = {
  presentToday: KpiItem;
  attendanceRate: KpiItem;
  absentEmployees: KpiItem;
  lateCheckins: KpiItem;
  activeSites: KpiItem;
  workforceAvailability: KpiItem;
};

type KpiCardsProps = {
  kpis: AttendanceKpis | undefined;
  isLoading: boolean;
};

const iconMap = {
  present: Users,
  rate: Percent,
  absent: UserX,
  late: Clock,
  sites: Building,
  availability: CalendarCheck2,
};

export function AttendanceKpiCards({ kpis, isLoading }: KpiCardsProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} className="animate-pulse bg-surface-secondary">
            <CardContent className="h-28" />
          </Card>
        ))}
      </div>
    );
  }

  const cardsData = [
    {
      key: "present",
      label: "Present Today",
      data: kpis.presentToday,
      icon: iconMap.present,
      color: "#22c55e",
      fill: "rgba(34, 197, 94, 0.1)",
    },
    {
      key: "rate",
      label: "Attendance Rate",
      data: kpis.attendanceRate,
      icon: iconMap.rate,
      color: "#2563eb",
      fill: "rgba(37, 99, 235, 0.1)",
    },
    {
      key: "absent",
      label: "Absent Employees",
      data: kpis.absentEmployees,
      icon: iconMap.absent,
      color: "#ef4444",
      fill: "rgba(239, 68, 68, 0.1)",
    },
    {
      key: "late",
      label: "Late Check-ins",
      data: kpis.lateCheckins,
      icon: iconMap.late,
      color: "#f59e0b",
      fill: "rgba(245, 158, 11, 0.1)",
    },
    {
      key: "availability",
      label: "Workforce Availability",
      data: kpis.workforceAvailability,
      icon: iconMap.availability,
      color: "#06b6d4",
      fill: "rgba(6, 182, 212, 0.1)",
    },
    {
      key: "sites",
      label: "Active Sites",
      data: kpis.activeSites,
      icon: iconMap.sites,
      color: "#64748b",
      fill: "rgba(100, 116, 139, 0.1)",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cardsData.map(({ key, label, data, icon: Icon, color, fill }) => {
        if (!data) return null;

        const sparklineData = data.sparkline.map((val, idx) => ({ id: idx, value: val }));
        


        const isPositive = data.trendType === "up" || (key === "absent" && data.trendType === "down");
        const isNegative = data.trendType === "down" && key !== "absent";

        return (
          <Card key={key} className="overflow-hidden hover:shadow-soft transition-all duration-200">
            <CardContent className="p-4 space-y-3">
              {/* Header: Label & Icon */}
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-label font-medium">{label}</span>
                <div className="rounded-full bg-hover p-1.5 text-text-secondary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              {/* Body: Value & Sparkline */}
              <div className="flex items-end justify-between gap-2">
                <div className="space-y-1">
                  <h4 className="text-h3 font-secondary text-text-primary font-bold">{data.value}</h4>
                  <div className="flex items-center gap-1">
                    {isPositive && <ArrowUpRight className="h-3 w-3 text-success shrink-0" />}
                    {isNegative && <ArrowDownRight className="h-3 w-3 text-red shrink-0" />}
                    <span className="text-label text-text-muted">{data.trend}</span>
                  </div>
                </div>

                {/* Sparkline chart */}
                <div className="h-8 w-16 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        fill={fill}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
