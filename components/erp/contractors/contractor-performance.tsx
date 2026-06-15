"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TrendItem = { date: string; value: number };
type ContributionItem = { name: string; value: number };

type ContractorPerformanceProps = {
  workforceTrend: TrendItem[];
  productivityTrend: TrendItem[];
  attendanceTrend: TrendItem[];
  projectContribution: ContributionItem[];
};

const colors = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444"];

export function ContractorPerformance({
  workforceTrend,
  productivityTrend,
  attendanceTrend,
  projectContribution,
}: ContractorPerformanceProps) {
  const [activeTab, setActiveTab] = useState<"deployment" | "metrics">("deployment");

  return (
    <Card className="border-border-soft/80 bg-surface">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border-soft pb-4">
        <CardTitle className="text-section-title font-secondary text-text-primary">Performance Analytics</CardTitle>
        <div className="flex rounded-[var(--radius-button)] bg-surface-secondary p-1 border border-border-soft">
          <button
            onClick={() => setActiveTab("deployment")}
            className={`px-3 py-1.5 text-label font-medium rounded-[var(--radius-button)] transition-all ${
              activeTab === "deployment"
                ? "bg-surface text-accent-primary shadow-soft"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Workforce Strength
          </button>
          <button
            onClick={() => setActiveTab("metrics")}
            className={`px-3 py-1.5 text-label font-medium rounded-[var(--radius-button)] transition-all ${
              activeTab === "metrics"
                ? "bg-surface text-accent-primary shadow-soft"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Productivity & Attendance
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Trend Chart Column */}
          <div className="lg:col-span-8 space-y-4">
            {activeTab === "deployment" ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-card-title text-text-primary font-semibold">Workforce Deployment Trend</h4>
                  <span className="text-label text-text-secondary">Historical deployed head count</span>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={workforceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWorkforce" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" opacity={0.6} />
                      <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} />
                      <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-bg-surface)",
                          borderColor: "var(--color-border-soft)",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorWorkforce)"
                        name="Workers Deployed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-card-title text-text-primary font-semibold">Productivity vs. Attendance Trends</h4>
                  <span className="text-label text-text-secondary">Percentage indices over time</span>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={productivityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" opacity={0.6} />
                      <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} />
                      <YAxis domain={[50, 100]} stroke="var(--color-text-muted)" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-bg-surface)",
                          borderColor: "var(--color-border-soft)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#22c55e"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Productivity Index (%)"
                      />
                      <Line
                        type="monotone"
                        data={attendanceTrend}
                        dataKey="value"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                        name="Attendance Rate (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Project Split Column */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-border-soft pt-6 lg:pt-0 lg:pl-6 flex flex-col justify-between">
            <div className="space-y-2">
              <h4 className="text-card-title text-text-primary font-semibold">Project Contribution</h4>
              <p className="text-label text-text-secondary">Workload distribution across sites</p>
            </div>
            <div className="h-[180px] my-3 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectContribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {projectContribution.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-bg-surface)",
                      borderColor: "var(--color-border-soft)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {projectContribution.map((item, index) => (
                <div key={item.name} className="flex justify-between items-center text-label">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="text-text-primary font-medium">{item.name}</span>
                  </div>
                  <span className="text-text-secondary font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
