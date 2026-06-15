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

type TrendData = {
  date: string;
  percentage: number;
  present: number;
  total: number;
};

type DepartmentData = {
  department: string;
  rate: number;
  present: number;
  total: number;
};

type SiteData = {
  site: string;
  count: number;
  percentage: number;
};

type LateData = {
  date: string;
  count: number;
};

type AttendanceAnalyticsProps = {
  analyticsData: {
    attendanceTrend: TrendData[];
    departmentAttendance: DepartmentData[];
    siteAttendance: SiteData[];
    lateArrivalTrend: LateData[];
  } | undefined;
  isLoading: boolean;
};

const chartPalette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  slate: "#64748b",
};

const donutColors = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#64748b", "#a855f7", "#ec4899"];

export function AttendanceAnalytics({ analyticsData, isLoading }: AttendanceAnalyticsProps) {
  if (isLoading || !analyticsData) {
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

  const { attendanceTrend, departmentAttendance, siteAttendance, lateArrivalTrend } = analyticsData;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      
      {/* Chart 1: Attendance Trend */}
      <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-body font-semibold text-text-primary">
            Workforce Presence Trend
          </CardTitle>
          <p className="text-label text-text-muted">Last 30 days active workforce attendance percentage.</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendance-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartPalette.cyan} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={chartPalette.cyan} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                <YAxis domain={[75, 100]} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [`${value}% Presence`, "Rate"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke={chartPalette.cyan}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#attendance-grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Chart 2: Department Attendance */}
      <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-body font-semibold text-text-primary">
            Department Attendance Health
          </CardTitle>
          <p className="text-label text-text-muted">Attendance rates today by department.</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentAttendance}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(15,23,42,0.06)" />
                <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="department"
                  width={90}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: chartPalette.slate, fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}% Rate`, "Attendance"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                />
                <Bar dataKey="rate" fill={chartPalette.blue} radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Chart 3: Site Attendance Distribution */}
      <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-body font-semibold text-text-primary">
            Workforce Site Deployment
          </CardTitle>
          <p className="text-label text-text-muted">Distribution of checked-in personnel across active projects.</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-[1.2fr_1fr] sm:items-center">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={siteAttendance}
                  dataKey="count"
                  nameKey="site"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  isAnimationActive={false}
                >
                  {siteAttendance.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} Workers`, name]}
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {siteAttendance.map((item, index) => (
              <div key={item.site} className="flex items-center justify-between text-body gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: donutColors[index % donutColors.length] }}
                  />
                  <span className="truncate font-medium text-text-primary text-label">{item.site}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-semibold text-text-primary text-label">{item.count}</span>
                  <span className="text-text-muted text-label ml-1.5">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart 4: Late Arrival Trend */}
      <Card className="overflow-hidden hover:shadow-soft transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-body font-semibold text-text-primary">
            Late Check-in Inflow Trend
          </CardTitle>
          <p className="text-label text-text-muted">Daily frequency of late arrival logs over the last 30 days.</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lateArrivalTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [`${value} Arrivals`, "Late Check-ins"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={chartPalette.amber}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
