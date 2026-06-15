"use client";

import { Clock3, UserCheck, UserMinus } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EmployeeDetailResponse } from "@/lib/erp-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EmployeeAttendanceProps = {
  attendance: EmployeeDetailResponse["attendanceAnalytics"];
  attendancePercent: number;
};

function AttendanceStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Clock3;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
      <div className="flex items-center gap-3">
        <div className="kpi-icon-shell flex h-10 w-10 items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-accent-primary" />
        </div>
        <div>
          <p className="text-label text-text-secondary">{label}</p>
          <p className="text-card-title text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function EmployeeAttendance({
  attendance,
  attendancePercent,
}: EmployeeAttendanceProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-section-title font-secondary text-text-primary">Attendance Analytics</h2>
        <p className="mt-1 text-body text-text-secondary">
          Monthly attendance movement, punctuality, and absence trends for workforce reliability tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AttendanceStat label="Attendance %" value={`${attendancePercent}%`} icon={UserCheck} />
        <AttendanceStat label="Present Days" value={`${attendance.summary.presentDays}`} icon={UserCheck} />
        <AttendanceStat label="Late Arrivals" value={`${attendance.summary.lateArrivals}`} icon={Clock3} />
        <AttendanceStat label="Absent Days" value={`${attendance.summary.absentDays}`} icon={UserMinus} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendance.monthlyTrend}>
                <defs>
                  <linearGradient id="attendance-area" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(15,23,42,0.08)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} width={32} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="attendanceRate"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#attendance-area)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Composition</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendance.monthlyTrend}>
                <CartesianGrid stroke="rgba(15,23,42,0.08)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} width={32} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                  }}
                />
                <Bar dataKey="presentDays" stackId="attendance" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="lateArrivals" stackId="attendance" fill="#0ea5e9" />
                <Bar dataKey="absentDays" stackId="attendance" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
