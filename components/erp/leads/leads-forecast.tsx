"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Coins, ShieldCheck, Ticket, Percent } from "lucide-react";

interface KpiData {
  value: number;
}

interface LeadsForecastProps {
  kpis: {
    forecastRevenue: KpiData;
    bookedThisCycle: KpiData;
    conversionRate: KpiData;
  } | undefined;
  isLoading: boolean;
}

export function LeadsForecast({ kpis, isLoading }: LeadsForecastProps) {
  if (isLoading || !kpis) {
    return (
      <Card className="animate-pulse bg-surface-secondary">
        <CardHeader className="h-12 border-none" />
        <CardContent className="h-64" />
      </Card>
    );
  }

  // Next 90 days cumulative revenue pipeline projection data
  const chartData = [
    { day: "Day 10", revenue: 1.8 },
    { day: "Day 20", revenue: 3.2 },
    { day: "Day 30", revenue: 4.8 },
    { day: "Day 40", revenue: 6.2 },
    { day: "Day 50", revenue: 8.0 },
    { day: "Day 60", revenue: 9.5 },
    { day: "Day 70", revenue: 10.8 },
    { day: "Day 80", revenue: 11.9 },
    { day: "Day 90", revenue: kpis.forecastRevenue.value },
  ];

  // Expected Deals = roughly forecastRevenue / 0.71 Cr
  const expectedDeals = Math.max(2, Math.round(kpis.forecastRevenue.value / 0.71));
  const avgTicketSize = "₹71 L";
  const projectedConversion = `${Math.round(kpis.conversionRate.value * 1.1)}%`;

  return (
    <Card className="hover:shadow-soft transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-section-title font-secondary text-text-primary">
          Revenue Forecast Center
        </CardTitle>
        <p className="text-label text-text-muted mt-1">
          Estimated closure conversions and expected pipeline collections for the upcoming 90 days.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="surface-secondary p-4 flex items-center gap-3">
            <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-label text-text-muted">Expected Revenue</p>
              <p className="text-card-title text-text-primary font-bold">₹{kpis.forecastRevenue.value} Cr</p>
            </div>
          </div>

          <div className="surface-secondary p-4 flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-label text-text-muted">Expected Closures</p>
              <p className="text-card-title text-text-primary font-bold">{expectedDeals} Deals</p>
            </div>
          </div>

          <div className="surface-secondary p-4 flex items-center gap-3">
            <div className="rounded-full bg-indigo-500/10 p-2 text-indigo-500">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-label text-text-muted">Avg. Ticket Size</p>
              <p className="text-card-title text-text-primary font-bold">{avgTicketSize}</p>
            </div>
          </div>

          <div className="surface-secondary p-4 flex items-center gap-3">
            <div className="rounded-full bg-amber-500/10 p-2 text-amber-500">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-label text-text-muted">Projected Conv.</p>
              <p className="text-card-title text-text-primary font-bold">{projectedConversion}</p>
            </div>
          </div>
        </div>

        {/* Expected Revenue chart */}
        <div className="space-y-2">
          <h3 className="text-card-title text-text-primary font-semibold">Expected Revenue Pipeline (90 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecast-trend-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}Cr`}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`₹${value} Cr`, "Cumulative Forecast"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#forecast-trend-grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
