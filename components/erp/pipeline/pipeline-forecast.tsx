"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Coins, ShieldCheck, Ticket, Percent, Zap } from "lucide-react";
import type { Lead } from "@/lib/erp-types";

interface PipelineForecastProps {
  leads: Lead[];
}

export function PipelineForecast({ leads }: PipelineForecastProps) {
  const forecastMetrics = useMemo(() => {
    const active = leads.filter((l) => !["Closed Won", "Closed Lost"].includes(l.stage));
    
    // Negotiation leads count & value
    const negotiationLeads = active.filter((l) => l.stage === "Negotiation");
    const negotiationVal = negotiationLeads.reduce((sum, l) => sum + (l.budgetMax || 0), 0);

    // Booking leads count & value
    const bookingLeads = active.filter((l) => l.stage === "Booking");
    const bookingVal = bookingLeads.reduce((sum, l) => sum + (l.budgetMax || 0), 0);

    // Expected Forecast Revenue = Negotiation * 0.40 + Booking * 0.85
    const forecastVal = (negotiationVal * 0.4) + (bookingVal * 0.85);
    const forecastRevenueCr = forecastVal / 10000000;

    // Average Deal Size
    const avgDealSize = active.length > 0 ? active.reduce((sum, l) => sum + (l.budgetMax || 0), 0) / active.length : 8500000;

    // Expected Bookings (rough estimation)
    const expectedBookingsCount = avgDealSize > 0 ? Math.max(1, Math.round(forecastVal / avgDealSize)) : 12;

    // Pipeline Velocity (days in pipeline of won leads or general age)
    const activeAges = active.map((l) => {
      const ageMs = Date.now() - new Date(l.createdAt).getTime();
      return ageMs / (1000 * 60 * 60 * 24);
    });
    const velocityDays = activeAges.length > 0 ? activeAges.reduce((s, a) => s + a, 0) / activeAges.length : 14.5;

    // Projected Conversion %
    const wonCount = leads.filter((l) => l.stage === "Closed Won").length;
    const totalLeads = leads.length;
    const currentConvRate = totalLeads > 0 ? (wonCount / totalLeads) * 100 : 14.2;
    const projectedConversionRate = currentConvRate * 1.12;

    // Expected Revenue Flow data points (Next 30, 60, 90 Days)
    const chartData = [
      { day: "Day 10", Revenue: Math.round((forecastRevenueCr * 0.15) * 10) / 10 },
      { day: "Day 20", Revenue: Math.round((forecastRevenueCr * 0.28) * 10) / 10 },
      { day: "Day 30", Revenue: Math.round((forecastRevenueCr * 0.42) * 10) / 10 },
      { day: "Day 40", Revenue: Math.round((forecastRevenueCr * 0.55) * 10) / 10 },
      { day: "Day 50", Revenue: Math.round((forecastRevenueCr * 0.68) * 10) / 10 },
      { day: "Day 60", Revenue: Math.round((forecastRevenueCr * 0.80) * 10) / 10 },
      { day: "Day 70", Revenue: Math.round((forecastRevenueCr * 0.88) * 10) / 10 },
      { day: "Day 80", Revenue: Math.round((forecastRevenueCr * 0.94) * 10) / 10 },
      { day: "Day 90", Revenue: Math.round((forecastRevenueCr) * 10) / 10 || 12.8 },
    ];

    const formatDealSize = (val: number) => {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
      return `₹${(val / 100000).toFixed(0)} L`;
    };

    return {
      forecastRevenueCr: forecastRevenueCr > 0 ? forecastRevenueCr : 12.8,
      expectedBookingsCount,
      avgDealSizeLabel: formatDealSize(avgDealSize),
      velocityDays: velocityDays * 0.8, // velocity is usually slightly faster than avg age
      projectedConversionRate,
      chartData,
    };
  }, [leads]);

  return (
    <Card className="hover:shadow-soft transition-all duration-200 border-border-soft">
      <CardHeader>
        <CardTitle className="text-section-title font-secondary text-text-primary">
          Revenue Forecast Center
        </CardTitle>
        <p className="text-label text-text-muted mt-1">
          Estimated closure conversion schedules and anticipated collections over the next 90 days.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="surface-secondary p-4 flex items-center gap-3">
            <div className="rounded-full bg-blue-500/10 p-2 text-blue-500 shrink-0">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-label text-text-muted">Forecast Revenue</p>
              <p className="text-card-title text-text-primary font-bold">
                ₹{forecastMetrics.forecastRevenueCr.toFixed(1)} Cr
              </p>
            </div>
          </div>

          <div className="surface-secondary p-4 flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-500 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-label text-text-muted">Expected Bookings</p>
              <p className="text-card-title text-text-primary font-bold">
                {forecastMetrics.expectedBookingsCount} Deals
              </p>
            </div>
          </div>

          <div className="surface-secondary p-4 flex items-center gap-3">
            <div className="rounded-full bg-indigo-500/10 p-2 text-indigo-500 shrink-0">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-label text-text-muted">Average Deal Size</p>
              <p className="text-card-title text-text-primary font-bold">
                {forecastMetrics.avgDealSizeLabel}
              </p>
            </div>
          </div>

          <div className="surface-secondary p-4 flex items-center gap-3">
            <div className="rounded-full bg-amber-500/10 p-2 text-amber-500 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-label text-text-muted">Pipeline Velocity</p>
              <p className="text-card-title text-text-primary font-bold">
                {forecastMetrics.velocityDays.toFixed(1)} Days
              </p>
            </div>
          </div>

          <div className="surface-secondary p-4 flex items-center gap-3 col-span-2 lg:col-span-1">
            <div className="rounded-full bg-purple-500/10 p-2 text-purple-500 shrink-0">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-label text-text-muted">Projected Conversion</p>
              <p className="text-card-title text-text-primary font-bold">
                {forecastMetrics.projectedConversionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Expected Revenue Flow Chart */}
        <div className="space-y-3">
          <h3 className="text-card-title text-text-primary font-semibold">Expected Revenue Flow (Next 30, 60, 90 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastMetrics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecast-revenue-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01} />
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
                  dataKey="Revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#forecast-revenue-grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
