"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { SiteVisit } from "@/lib/erp-types";

interface SiteVisitsAnalyticsProps {
  visits: SiteVisit[];
  isLoading: boolean;
}

const palette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  amber: "#f59e0b",
  red: "#ef4444",
  green: "#22c55e",
  slate: "#64748b",
  purple: "#a855f7",
  pink: "#ec4899",
};

const donutColors = [
  palette.green,
  palette.blue,
  palette.amber,
  palette.red,
  palette.slate,
  palette.purple,
  palette.cyan,
  palette.pink,
];

export function SiteVisitsAnalytics({ visits, isLoading }: SiteVisitsAnalyticsProps) {
  const analyticsData = useMemo(() => {
    if (!visits || visits.length === 0) return null;

    const scheduled = visits.filter((v) => v.status === "Scheduled").length;
    const completed = visits.filter((v) => v.status === "Completed").length;
    const cancelled = visits.filter((v) => v.status === "Cancelled" || v.status === "Rejected").length;
    const noShow = visits.filter((v) => v.status === "No Show").length;

    const statusDistribution = [
      { name: "Completed", value: completed || 1, color: palette.green },
      { name: "Scheduled", value: scheduled || 1, color: palette.blue },
      { name: "Cancelled", value: cancelled || 0, color: palette.red },
      { name: "No Show", value: noShow || 0, color: palette.amber },
    ].filter((s) => s.value > 0);

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap: Record<string, { scheduled: number; completed: number }> = {};

    visits.forEach((v) => {
      if (!v.scheduledAt) return;
      const date = new Date(v.scheduledAt);
      const key = `${monthLabels[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      if (!monthlyMap[key]) monthlyMap[key] = { scheduled: 0, completed: 0 };
      monthlyMap[key].scheduled++;
      if (v.status === "Completed") monthlyMap[key].completed++;
    });

    const monthlyTrend = Object.entries(monthlyMap)
      .map(([month, counts]) => ({
        month,
        scheduled: counts.scheduled,
        completed: counts.completed,
        timestamp: new Date(month + " 01").getTime(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-12)
      .map(({ month, scheduled, completed }) => ({ month, scheduled, completed }));

    const projectMap: Record<string, number> = {};
    visits.forEach((v) => {
      const name = v.projectName || "Unknown";
      projectMap[name] = (projectMap[name] || 0) + 1;
    });
    const visitsByProject = Object.entries(projectMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const coordinatorMap: Record<string, { total: number; completed: number }> = {};
    visits.forEach((v) => {
      const name = v.coordinatorName || "Unassigned";
      if (!coordinatorMap[name]) coordinatorMap[name] = { total: 0, completed: 0 };
      coordinatorMap[name].total++;
      if (v.status === "Completed") coordinatorMap[name].completed++;
    });
    const coordinatorWorkload = Object.entries(coordinatorMap)
      .map(([name, counts]) => ({
        name,
        total: counts.total,
        completed: counts.completed,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    const upcomingVisits = visits.filter((v) => {
      if (v.status !== "Scheduled" || !v.scheduledAt) return false;
      const vDate = v.scheduledAt.slice(0, 10);
      return vDate >= todayKey;
    }).length;

    return {
      statusDistribution,
      monthlyTrend,
      visitsByProject,
      coordinatorWorkload,
      upcomingVisits,
    };
  }, [visits]);

  if (isLoading || !analyticsData) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse bg-surface-secondary">
            <CardHeader className="h-12 border-none" />
            <CardContent className="h-64" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Visit Status Distribution
            </CardTitle>
            <p className="text-label text-text-muted">Breakdown of site visit outcomes and current statuses.</p>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row justify-between items-center h-64 pb-6">
            <div className="h-44 w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {analyticsData.statusDistribution.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={donutColors[i % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} visits`, "Count"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 grid grid-cols-1 gap-2 text-label mt-2 px-2">
              {analyticsData.statusDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between gap-1.5 border-b border-border-soft pb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: donutColors[i % donutColors.length] }}
                    />
                    <span className="truncate text-text-secondary font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-text-primary">
                    {Math.round((item.value / analyticsData.statusDistribution.reduce((a, s) => a + s.value, 0)) * 100)}% ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Monthly Visit Trend
            </CardTitle>
            <p className="text-label text-text-muted">Scheduled vs completed site visits over time.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.monthlyTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scheduled-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.blue} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={palette.blue} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="completed-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.green} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={palette.green} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: palette.slate, fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: palette.slate, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="scheduled" stroke={palette.blue} strokeWidth={2} fillOpacity={1} fill="url(#scheduled-grad)" />
                  <Area type="monotone" dataKey="completed" stroke={palette.green} strokeWidth={2} fillOpacity={1} fill="url(#completed-grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Visits by Project
            </CardTitle>
            <p className="text-label text-text-muted">Total site visits per project ranked by volume.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.visitsByProject} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(15,23,42,0.06)" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: palette.slate, fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} tick={{ fill: palette.slate, fontSize: 10 }} />
                  <Tooltip
                    formatter={(value) => [`${value} visits`, "Volume"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill={palette.indigo} radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Coordinator Workload
            </CardTitle>
            <p className="text-label text-text-muted">Total and completed visits handled per coordinator.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.coordinatorWorkload} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: palette.slate, fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: palette.slate, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                  <Bar dataKey="total" fill={palette.blue} radius={[4, 4, 0, 0]} barSize={12} name="Total" />
                  <Bar dataKey="completed" fill={palette.green} radius={[4, 4, 0, 0]} barSize={12} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
