"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  LineChart,
  Line,
} from "recharts";
import { PayrollAnalytics as IPayrollAnalytics } from "@/types/payroll";

interface PayrollAnalyticsProps {
  analytics: IPayrollAnalytics | undefined;
  isLoading: boolean;
}

const chartPalette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  slate: "#64748b",
};

const donutColors = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444"];

export function PayrollAnalytics({ analytics, isLoading }: PayrollAnalyticsProps) {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="animate-pulse bg-surface-secondary">
            <CardHeader className="h-12 border-none" />
            <CardContent className="h-64" />
          </Card>
        ))}
      </div>
    );
  }

  const { monthlyTrend, costByDepartment, payrollDistribution, efficiencyTrend, topProjects } = analytics;

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${(val / 1000).toFixed(0)}k`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Chart 1: Monthly Payroll Trend */}
        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Monthly Payroll Trend
            </CardTitle>
            <p className="text-label text-text-muted">Total workforce cost expenditure over the last 12 months.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="payroll-trend-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPalette.blue} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartPalette.blue} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`}
                    tick={{ fill: chartPalette.slate, fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Payroll Cost"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke={chartPalette.blue}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#payroll-trend-grad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Payroll Cost by Department */}
        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Payroll Cost by Department
            </CardTitle>
            <p className="text-label text-text-muted">Monthly payroll expenditure by operational departments.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costByDepartment} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(15,23,42,0.06)" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`}
                    tick={{ fill: chartPalette.slate, fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="department"
                    width={90}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartPalette.slate, fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Cost"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                  <Bar dataKey="cost" fill={chartPalette.cyan} radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Chart 3: Payroll Distribution */}
        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Payroll Distribution
            </CardTitle>
            <p className="text-label text-text-muted">Breakdown percentage of total payroll by department.</p>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-72 pb-6">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payrollDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    isAnimationActive={false}
                  >
                    {payrollDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Share"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-label mt-2 px-2">
              {payrollDistribution.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: donutColors[index % donutColors.length] }}
                  />
                  <span className="truncate text-text-secondary font-medium">{item.name}:</span>
                  <span className="font-semibold text-text-primary">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Attendance vs Payroll Efficiency */}
        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Attendance vs Payroll Efficiency
            </CardTitle>
            <p className="text-label text-text-muted">Attendance percentage correlated with cost utilization.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={efficiencyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <YAxis domain={[70, 100]} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    name="Attendance %"
                    stroke={chartPalette.green}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="payrollEfficiency"
                    name="Payroll Efficiency %"
                    stroke={chartPalette.amber}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 5: Top Workforce Cost Projects */}
        <Card className="overflow-hidden hover:shadow-soft transition-all duration-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-body font-semibold text-text-primary">
              Top Workforce Cost Projects
            </CardTitle>
            <p className="text-label text-text-muted">Top projects by total monthly labor expenditure.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProjects} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(15,23,42,0.06)" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`}
                    tick={{ fill: chartPalette.slate, fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="project"
                    width={90}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartPalette.slate, fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Labor cost"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                  />
                  <Bar dataKey="cost" fill={chartPalette.blue} radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
