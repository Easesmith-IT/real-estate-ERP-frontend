"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Lead } from "@/lib/erp-types";

interface LeadsAnalyticsProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
}

const chartPalette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  amber: "#f59e0b",
  red: "#ef4444",
  green: "#22c55e",
  slate: "#64748b",
};

const donutColors = [
  chartPalette.blue,
  chartPalette.cyan,
  chartPalette.indigo,
  chartPalette.amber,
  chartPalette.green,
  chartPalette.red,
];

export function LeadsAnalytics({ leads, isLoading }: LeadsAnalyticsProps) {
  const analyticsData = useMemo(() => {
    if (!leads || leads.length === 0) return null;

    // 1. Lead Source Distribution
    const sourceMap: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.source || "Website";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });
    const sources = Object.entries(sourceMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const totalSources = sources.reduce((sum, s) => sum + s.value, 0);
    const sourceDistribution = sources.map((s) => ({
      ...s,
      percentage: Math.round((s.value / totalSources) * 100),
    }));

    // 2. Monthly Lead Trend (Last 12 Months)
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    // Aggregate by month-year
    const monthlyMap: Record<string, number> = {};
    leads.forEach((l) => {
      if (!l.createdAt) return;
      const date = new Date(l.createdAt);
      const mLabel = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      monthlyMap[mLabel] = (monthlyMap[mLabel] || 0) + 1;
    });

    // Sort chronologically (rough sort based on parsed dates)
    const monthlyTrend = Object.entries(monthlyMap)
      .map(([month, count]) => ({
        month,
        count,
        timestamp: new Date(month + " 01").getTime(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-12)
      .map(({ month, count }) => ({ month, count }));

    // 3. Budget Distribution
    let below50L = 0;
    let between50L1Cr = 0;
    let between1Cr2Cr = 0;
    let above2Cr = 0;

    leads.forEach((l) => {
      const budget = l.budgetMax || 0;
      if (budget < 5000000) below50L++;
      else if (budget >= 5000000 && budget < 10000000) between50L1Cr++;
      else if (budget >= 10000000 && budget <= 20000000) between1Cr2Cr++;
      else if (budget > 20000000) above2Cr++;
    });

    const budgetDistribution = [
      { range: "Below ₹50L", count: below50L },
      { range: "₹50L - ₹1Cr", count: between50L1Cr },
      { range: "₹1Cr - ₹2Cr", count: between1Cr2Cr },
      { range: "Above ₹2Cr", count: above2Cr },
    ];

    // 4. Lead Quality Distribution
    let hot = 0;
    let warm = 0;
    let cold = 0;
    let unqualified = 0;

    leads.forEach((l) => {
      // Logic for score
      const stage = l.stage;
      if (stage === "Closed Won" || stage === "Booking" || stage === "Negotiation") {
        hot++;
      } else if (stage === "Site Visit Scheduled" || stage === "Interested") {
        warm++;
      } else if (stage === "Closed Lost") {
        unqualified++;
      } else {
        cold++;
      }
    });

    const totalQuality = hot + warm + cold + unqualified || 1;
    const qualityDistribution = [
      { name: "Hot Leads", value: hot, color: chartPalette.red, percentage: Math.round((hot / totalQuality) * 100) },
      { name: "Warm Leads", value: warm, color: chartPalette.amber, percentage: Math.round((warm / totalQuality) * 100) },
      { name: "Cold Leads", value: cold, color: chartPalette.blue, percentage: Math.round((cold / totalQuality) * 100) },
      { name: "Unqualified", value: unqualified, color: chartPalette.slate, percentage: Math.round((unqualified / totalQuality) * 100) },
    ].filter(q => q.value > 0);

    return {
      sourceDistribution,
      monthlyTrend,
      budgetDistribution,
      qualityDistribution,
    };
  }, [leads]);

  if (isLoading || !analyticsData) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="animate-pulse bg-surface-secondary">
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
        {/* Chart 1: Lead Source Distribution */}
        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Lead Source Distribution
            </CardTitle>
            <p className="text-label text-text-muted">Breakdown of incoming lead acquisition channels.</p>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row justify-between items-center h-64 pb-6">
            <div className="h-44 w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.sourceDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    isAnimationActive={false}
                  >
                    {analyticsData.sourceDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} Leads`, "Volume"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 grid grid-cols-1 gap-2 text-label mt-2 px-2 max-h-48 overflow-y-auto">
              {analyticsData.sourceDistribution.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-1.5 border-b border-border-soft pb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: donutColors[index % donutColors.length] }}
                    />
                    <span className="truncate text-text-secondary font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-text-primary">{item.percentage}% ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Monthly Lead Trend */}
        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Monthly Lead Trend
            </CardTitle>
            <p className="text-label text-text-muted">Total leads registered monthly over the last 12 months.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.monthlyTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lead-trend-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPalette.blue} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartPalette.blue} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => [`${value} Leads`, "Volume"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={chartPalette.blue}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#lead-trend-grad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 3: Budget Distribution */}
        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Budget Distribution
            </CardTitle>
            <p className="text-label text-text-muted">Total leads segmented by unit budget configuration ranges.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.budgetDistribution} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(15,23,42,0.06)" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="range"
                    width={100}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartPalette.slate, fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} Leads`, "Volume"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill={chartPalette.indigo} radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Lead Quality Distribution */}
        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Lead Quality Distribution
            </CardTitle>
            <p className="text-label text-text-muted">Active lead pipeline health segment proportions.</p>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row justify-between items-center h-64 pb-6">
            <div className="h-44 w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.qualityDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    isAnimationActive={false}
                  >
                    {analyticsData.qualityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} Leads`, "Volume"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 grid grid-cols-1 gap-2 text-label mt-2 px-2">
              {analyticsData.qualityDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-1.5 border-b border-border-soft pb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-text-secondary font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-text-primary">{item.percentage}% ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
