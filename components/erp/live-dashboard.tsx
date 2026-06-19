"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Clock3,
  IndianRupee,
  PackageCheck,
  PackageOpen,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import type {
  DashboardActivityFeedResponse,
  DashboardActivityItem,
  DashboardAnalyticsResponse,
  DashboardMetric,
  DashboardOverviewResponse,
  DashboardProjectHealthCard,
  DashboardProjectHealthResponse,
  DashboardRecommendation,
  DashboardRecommendationsResponse,
} from "@/lib/erp-types";
import { ErrorStateCard } from "@/components/erp/live-state";
import { EnterpriseDashboardLoader } from "@/components/ui/loaders";
import { SectionHeader } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const chartPalette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  slate: "#64748b",
};

const piePalette = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8"];

function formatCompactCurrency(value: number) {
  return `₹${new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

function formatMetricValue(metric: DashboardMetric) {
  if (metric.format === "currency") {
    return formatCompactCurrency(metric.value);
  }

  if (metric.format === "percent") {
    return `${metric.value}%`;
  }

  if (metric.format === "decimal") {
    return `${metric.value.toFixed(2)}x`;
  }

  return new Intl.NumberFormat("en-IN").format(metric.value);
}

function formatAxisCurrency(value: number) {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }

  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }

  return `₹${Math.round(value / 1000)}K`;
}

function formatMetricTrend(metric: DashboardMetric) {
  const sign = metric.trendPercent > 0 ? "+" : "";
  return `${sign}${metric.trendPercent}%`;
}

function badgeToneFromStatus(status: DashboardMetric["status"] | DashboardProjectHealthCard["tone"]) {
  if (status === "healthy") {
    return "success";
  }

  if (status === "critical") {
    return "error";
  }

  if (status === "attention" || status === "watch") {
    return "warning";
  }

  return "neutral";
}

function badgeToneFromRecommendation(color: DashboardRecommendation["color"]) {
  if (color === "green") {
    return "success";
  }

  if (color === "red") {
    return "error";
  }

  return "warning";
}

function metricShellClass(status: DashboardMetric["status"]) {
  if (status === "healthy") {
    return "border-success/20 bg-linear-to-br from-white via-white to-success/8";
  }

  if (status === "critical") {
    return "border-error/20 bg-linear-to-br from-white via-white to-error/8";
  }

  if (status === "watch") {
    return "border-warning/20 bg-linear-to-br from-white via-white to-warning/8";
  }

  return "border-border-soft bg-linear-to-br from-white via-white to-slate-50";
}

function renderActivityIcon(item: DashboardActivityItem) {
  if (item.type === "attendance") {
    return <UserCheck className="h-4 w-4" />;
  }

  if (item.type === "dpr") {
    return <ClipboardList className="h-4 w-4" />;
  }

  if (item.type === "approval") {
    return <BadgeCheck className="h-4 w-4" />;
  }

  if (item.type === "material") {
    return <PackageCheck className="h-4 w-4" />;
  }

  return <Sparkles className="h-4 w-4" />;
}

function Sparkline({ values, color = chartPalette.blue }: { values: number[]; color?: string }) {
  const data = values.map((value, index) => ({ index, value }));

  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.24} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${color.replace("#", "")})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricCard({ metric, icon }: { metric: DashboardMetric; icon: React.ReactNode }) {
  const statusTone = badgeToneFromStatus(metric.status);
  const trendPositive = metric.trendPercent >= 0;

  return (
    <Card className={`overflow-hidden border ${metricShellClass(metric.status)}`}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface shadow-soft text-accent-primary">
            {icon}
          </div>
          <Badge tone={statusTone}>{metric.status === "watch" ? "Watch" : metric.status}</Badge>
        </div>
        <div>
          <p className="text-label uppercase tracking-[0.14em] text-text-muted">{metric.label}</p>
          <p className="mt-2 text-[30px] font-bold leading-none tracking-[-0.03em] text-text-primary">
            {formatMetricValue(metric)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className={`text-label ${trendPositive ? "text-success" : "text-warning"}`}>
            {trendPositive ? "↑" : "↓"} {formatMetricTrend(metric)}
          </p>
          <div className="w-28">
            <Sparkline
              values={metric.sparkline}
              color={
                metric.status === "critical"
                  ? chartPalette.red
                  : metric.status === "watch"
                    ? chartPalette.amber
                    : chartPalette.blue
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="items-start border-none pb-0">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <p className="text-body text-text-secondary">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

export function DashboardWorkspace() {
  const role = useUiStore((state) => state.role);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const [portfolio, setPortfolio] = useState("All Projects");

  const dashboardQuery = useQuery({
    queryKey: ["construction-command-center", role],
    queryFn: async () => {
      const [overview, projectHealth, analytics, recommendations, activityFeed] = await Promise.all([
        apiRequest<DashboardOverviewResponse>("/api/dashboard/overview", { role }),
        apiRequest<DashboardProjectHealthResponse>("/api/dashboard/project-health", { role }),
        apiRequest<DashboardAnalyticsResponse>("/api/dashboard/analytics", { role }),
        apiRequest<DashboardRecommendationsResponse>("/api/dashboard/recommendations", { role }),
        apiRequest<DashboardActivityFeedResponse>("/api/dashboard/activity-feed", { role }),
      ]);

      return {
        overview: overview.data,
        projectHealth: projectHealth.data,
        analytics: analytics.data,
        recommendations: recommendations.data,
        activityFeed: activityFeed.data,
      };
    },
  });

  if (dashboardQuery.isLoading) {
    return <EnterpriseDashboardLoader />;
  }

  if (dashboardQuery.error || !dashboardQuery.data) {
    return (
      <ErrorStateCard
        message={
          dashboardQuery.error instanceof Error
            ? dashboardQuery.error.message
            : "Dashboard data is unavailable."
        }
      />
    );
  }

  const { overview, projectHealth, analytics, recommendations, activityFeed } = dashboardQuery.data;
  const criticalProject = projectHealth.projects.find((item) => item.tone === "critical") || projectHealth.projects[0];

  return (
    <section className="space-y-8">
      <SectionHeader
        title="Executive Operations Dashboard"
        description="Centralized monitoring of portfolio performance, operational risk, workforce utilization, procurement activity, and financial outcomes."
        actions={
          <div className="flex items-center gap-3">
            <select
              value={portfolio}
              onChange={(event) => setPortfolio(event.target.value)}
              className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]"
            >
              {overview.portfolio.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="overflow-hidden border border-accent-primary/15 bg-linear-to-br from-white via-white to-accent-primary/8">
            <CardContent className={`grid gap-6 p-6 ${sidebarCollapsed ? "grid-cols-1 lg:grid-cols-[3fr_2fr] lg:items-center" : "grid-cols-1"}`}>
              {/* Header and narrative */}
              <motion.div
                layout
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className={`space-y-5 ${sidebarCollapsed ? "lg:col-start-1 lg:row-start-1" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={badgeToneFromStatus(overview.portfolio.tone)}>Portfolio Health Index</Badge>
                  <p className="text-label text-text-muted">{portfolio}</p>
                </div>
                <div className="space-y-3">
                  <p className="max-w-3xl text-body text-text-secondary">{overview.portfolio.narrative}</p>
                </div>
              </motion.div>

              {/* Radial Chart (Portfolio Health Index) */}
              <motion.div
                layout
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-[28px] border border-border-soft bg-white/80 p-5 shadow-floating backdrop-blur ${sidebarCollapsed ? "lg:col-start-2 lg:row-start-1 lg:row-span-2" : "w-full"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-label uppercase tracking-[0.16em] text-text-muted whitespace-nowrap">Portfolio Health Index</p>
                  </div>
                  <Badge className="shrink-0 whitespace-nowrap" tone={overview.portfolio.healthDelta >= 0 ? "success" : "warning"}>
                    {overview.portfolio.healthDelta >= 0 ? "+" : ""}
                    {overview.portfolio.healthDelta}% vs last month
                  </Badge>
                </div>
                <div className="relative mt-6 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      data={[{ name: "score", value: overview.portfolio.healthScore, fill: chartPalette.blue }]}
                      innerRadius="72%"
                      outerRadius="100%"
                      barSize={18}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={24} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[56px] font-bold leading-none tracking-[-0.05em] text-text-primary">
                      {overview.portfolio.healthScore}
                    </p>
                    <p className="mt-2 text-label uppercase tracking-[0.18em] text-text-muted">Out of 100</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-surface-secondary p-3">
                    <p className="text-label text-text-muted">Healthy</p>
                    <p className="mt-1 text-card-title text-success">{projectHealth.summary.healthyProjects}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-secondary p-3">
                    <p className="text-label text-text-muted">Attention</p>
                    <p className="mt-1 text-card-title text-warning">{projectHealth.summary.atRiskProjects}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-secondary p-3">
                    <p className="text-label text-text-muted">Critical</p>
                    <p className="mt-1 text-card-title text-error">{projectHealth.summary.criticalProjects}</p>
                  </div>
                </div>
              </motion.div>

              {/* 4 KPI Cards Grid */}
              <motion.div
                layout
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${sidebarCollapsed ? "lg:col-start-1 lg:row-start-2" : ""}`}
              >
                {overview.executiveKpis.map((metric) => {
                  const icon =
                    metric.id === "active-projects" ? <Building2 className="h-5 w-5" /> :
                    metric.id === "workforce-active" ? <Users className="h-5 w-5" /> :
                    metric.id === "inventory-value" ? <PackageOpen className="h-5 w-5" /> :
                    <IndianRupee className="h-5 w-5" />;

                  return <MetricCard key={metric.id} metric={metric} icon={icon} />;
                })}
              </motion.div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <MetricCard metric={overview.operationsKpis[0]} icon={<Building2 className="h-5 w-5" />} />
            <MetricCard metric={overview.operationsKpis[1]} icon={<TrendingUp className="h-5 w-5" />} />
            <MetricCard metric={overview.operationsKpis[2]} icon={<IndianRupee className="h-5 w-5" />} />
            <MetricCard metric={overview.operationsKpis[3]} icon={<WalletGlyph />} />
            <MetricCard metric={overview.operationsKpis[4]} icon={<Users className="h-5 w-5" />} />
            <MetricCard metric={overview.operationsKpis[5]} icon={<PackageOpen className="h-5 w-5" />} />
            <MetricCard metric={overview.operationsKpis[6]} icon={<Clock3 className="h-5 w-5" />} />
            <MetricCard metric={overview.operationsKpis[7]} icon={<ShieldAlert className="h-5 w-5" />} />
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="items-start border-none pb-0">
              <div className="space-y-2">
                <CardTitle>Project Delivery Health</CardTitle>
                <p className="text-body text-text-secondary">
                  Project schedule compliance, active risk indicators, and milestone status tracking.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-[22px] border border-success/15 bg-success/6 p-4">
                  <p className="text-label uppercase tracking-[0.14em] text-success">Healthy Projects</p>
                  <p className="mt-2 text-[34px] font-bold leading-none text-text-primary">{projectHealth.summary.healthyProjects}</p>
                </div>
                <div className="rounded-[22px] border border-warning/15 bg-warning/8 p-4">
                  <p className="text-label uppercase tracking-[0.14em] text-warning">Attention Required</p>
                  <p className="mt-2 text-[34px] font-bold leading-none text-text-primary">{projectHealth.summary.atRiskProjects}</p>
                </div>
                <div className="rounded-[22px] border border-error/15 bg-error/8 p-4">
                  <p className="text-label uppercase tracking-[0.14em] text-error">Critical Projects</p>
                  <p className="mt-2 text-[34px] font-bold leading-none text-text-primary">{projectHealth.summary.criticalProjects}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {projectHealth.projects.slice(0, 6).map((project) => (
                  <div
                    key={project.id}
                    className={`rounded-[24px] border p-5 ${
                      project.tone === "healthy"
                        ? "border-success/15 bg-linear-to-br from-white via-white to-success/8"
                        : project.tone === "critical"
                          ? "border-error/15 bg-linear-to-br from-white via-white to-error/8"
                          : "border-warning/15 bg-linear-to-br from-white via-white to-warning/8"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-card-title text-text-primary">{project.name}</p>
                        <p className="mt-1 text-label text-text-muted">{project.stage}</p>
                      </div>
                      <Badge tone={badgeToneFromStatus(project.tone)}>{project.riskLevel}</Badge>
                    </div>
                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[36px] font-bold leading-none tracking-[-0.03em] text-text-primary">{project.completion}%</p>
                        <p className="mt-2 text-body text-text-secondary">{project.statusLabel}</p>
                      </div>
                      <div className="rounded-2xl bg-surface px-3 py-2 text-right shadow-soft">
                        <p className="text-label text-text-muted">Risk Score</p>
                        <p className="mt-1 text-card-title text-text-primary">{project.riskScore}</p>
                      </div>
                    </div>
                    <div className="mt-5 h-3 rounded-full bg-hover">
                      <div
                        className={`h-3 rounded-full ${
                          project.tone === "healthy"
                            ? "bg-success"
                            : project.tone === "critical"
                              ? "bg-error"
                              : "bg-warning"
                        }`}
                        style={{ width: `${project.completion}%` }}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="neutral">{project.signalCount} signals</Badge>
                      {project.delayedMilestones > 0 ? <Badge tone="warning">{project.delayedMilestones} delayed milestones</Badge> : null}
                      {project.materialShortages > 0 ? <Badge tone="warning">{project.materialShortages} stock alerts</Badge> : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.45fr_1fr]">
            <ChartCard
              title="Revenue vs Collections"
              description="Comparative analysis of monthly revenue generation and collections performance."
            >
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics.revenueTrend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartPalette.blue} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={chartPalette.blue} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chartPalette.slate, fontSize: 12 }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={formatAxisCurrency} tick={{ fill: chartPalette.slate, fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={formatAxisCurrency} tick={{ fill: chartPalette.slate, fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatCompactCurrency(Number(value ?? 0))}
                      contentStyle={{ borderRadius: 16, border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 14px 28px rgba(15,23,42,0.08)" }}
                    />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke={chartPalette.blue} fill="url(#revenue-fill)" strokeWidth={2.5} />
                    <Line yAxisId="right" type="monotone" dataKey="collections" name="Collections" stroke={chartPalette.green} strokeWidth={3} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <SignalTile label="Revenue" value={formatCompactCurrency(overview.revenueCollections.totals.revenue)} tone="blue" />
                <SignalTile label="Collections" value={formatCompactCurrency(overview.revenueCollections.totals.collections)} tone="green" />
                <SignalTile label="Collection Efficiency" value={`${overview.revenueCollections.totals.collectionRate}%`} tone="amber" />
                <SignalTile label="Overdue Exposure" value={formatCompactCurrency(overview.revenueCollections.totals.overdueAmount)} tone="red" />
              </div>
            </ChartCard>

            <ChartCard
              title="Collections Aging"
              description="Accounts receivable aging analysis categorized by operating zones."
            >
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.revenueCollections.aging} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" />
                    <XAxis dataKey="bucket" axisLine={false} tickLine={false} tick={{ fill: chartPalette.slate, fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={formatAxisCurrency} tick={{ fill: chartPalette.slate, fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatCompactCurrency(Number(value ?? 0))}
                      contentStyle={{ borderRadius: 16, border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 14px 28px rgba(15,23,42,0.08)" }}
                    />
                    <Legend />
                    <Bar dataKey="north" stackId="aging" name="North Zone" fill={chartPalette.blue} radius={[10, 10, 0, 0]} />
                    <Bar dataKey="south" stackId="aging" name="South Zone" fill={chartPalette.amber} radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="items-start border-none pb-0">
              <div className="space-y-2">
                <CardTitle>Operational Insights</CardTitle>
                <p className="text-body text-text-secondary">
                  Operational recommendation workflows focused on sales risk, material supply, collections aging, workflow approvals, and schedule variance.
                </p>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 pt-5 lg:grid-cols-2 xl:grid-cols-3">
              {recommendations.items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[24px] border p-5 ${
                    item.color === "green"
                      ? "border-success/15 bg-linear-to-br from-white via-white to-success/8"
                      : item.color === "red"
                        ? "border-error/15 bg-linear-to-br from-white via-white to-error/8"
                        : "border-warning/15 bg-linear-to-br from-white via-white to-warning/8"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge tone={badgeToneFromRecommendation(item.color)}>{item.type}</Badge>
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color === "green" ? "bg-success" : item.color === "red" ? "bg-error" : "bg-warning"}`} />
                  </div>
                  <p className="mt-4 text-card-title text-text-primary">{item.title}</p>
                  <p className="mt-2 text-body text-text-secondary">{item.detail}</p>
                  <Link
                    href={item.actionRoute}
                    className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-surface px-4 py-2 text-body font-medium text-text-primary shadow-soft subtle-hover hover:-translate-y-px"
                  >
                    {item.actionLabel}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <SectionHeader
              title="Portfolio Analytics"
              description="Analytical visualizations of lead conversion funnels, pipeline trends, resource utilization, and inventory metrics."
            />

            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
              <ChartCard title="Lead Funnel" description="Conversion velocity through sales and pipeline stages.">
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(15,23,42,0.08)" }} />
                      <Funnel dataKey="value" data={analytics.leadFunnel} isAnimationActive fill={chartPalette.blue}>
                        <LabelList position="right" fill={chartPalette.slate} stroke="none" dataKey="stage" />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Monthly Lead Trend" description="Inflow volume of registered opportunities over a six-month period.">
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.monthlyLeadTrend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="lead-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartPalette.cyan} stopOpacity={0.28} />
                          <stop offset="95%" stopColor={chartPalette.cyan} stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chartPalette.slate, fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: chartPalette.slate, fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(15,23,42,0.08)" }} />
                      <Area type="monotone" dataKey="value" stroke={chartPalette.cyan} fill="url(#lead-fill)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Workforce Utilization" description="Distribution of active, unassigned, and absent personnel.">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr] lg:items-center">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.workforceDistribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={64}
                          outerRadius={92}
                          paddingAngle={4}
                        >
                          {analytics.workforceDistribution.map((entry, index) => (
                            <Cell key={entry.name} fill={piePalette[index % piePalette.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(15,23,42,0.08)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {analytics.workforceDistribution.map((item, index) => (
                      <LegendRow key={item.name} color={piePalette[index % piePalette.length]} label={item.name} value={new Intl.NumberFormat("en-IN").format(item.value)} />
                    ))}
                  </div>
                </div>
              </ChartCard>

              <ChartCard title="Inventory Distribution" description="Stock valuation breakdown by material category.">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr] lg:items-center">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.inventoryDistribution}
                          dataKey="value"
                          nameKey="category"
                          innerRadius={64}
                          outerRadius={92}
                          paddingAngle={3}
                        >
                          {analytics.inventoryDistribution.map((entry, index) => (
                            <Cell key={entry.category} fill={piePalette[index % piePalette.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(15,23,42,0.08)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {analytics.inventoryDistribution.map((item, index) => (
                      <LegendRow key={item.category} color={piePalette[index % piePalette.length]} label={item.category} value={new Intl.NumberFormat("en-IN").format(item.value)} />
                    ))}
                  </div>
                </div>
              </ChartCard>
            </div>

            <ChartCard title="Top Projects by Value" description="Valuation of active projects ranked by budget allocation.">
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topProjectsByValue} layout="vertical" margin={{ top: 8, right: 12, left: 16, bottom: 8 }}>
                    <CartesianGrid horizontal={false} stroke="rgba(15,23,42,0.06)" />
                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={formatAxisCurrency} tick={{ fill: chartPalette.slate, fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={150} axisLine={false} tickLine={false} tick={{ fill: chartPalette.slate, fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCompactCurrency(Number(value ?? 0))} contentStyle={{ borderRadius: 16, border: "1px solid rgba(15,23,42,0.08)" }} />
                    <Bar dataKey="value" radius={[0, 12, 12, 0]} fill={chartPalette.blue} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="items-start border-none pb-0">
              <div className="space-y-2">
                <CardTitle>Operational Activity Log</CardTitle>
                <p className="text-body text-text-secondary">
                  Audit log of field reports, procurement approvals, lead registration, and inventory transactions.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {activityFeed.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[52px_minmax(0,1fr)] gap-4">
                  <div className="relative flex justify-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-secondary text-accent-primary shadow-soft">
                      {renderActivityIcon(item)}
                    </div>
                    {index < activityFeed.items.length - 1 ? (
                      <span className="absolute top-12 h-full w-px bg-border-soft" />
                    ) : null}
                  </div>
                  <div className="rounded-[22px] border border-border-soft bg-linear-to-r from-white to-surface-secondary p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-card-title text-text-primary">{item.title}</p>
                        <p className="mt-1 text-body text-text-secondary">{item.detail}</p>
                      </div>
                      <p className="text-label text-text-muted">{item.relativeTime}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/10 text-label font-semibold text-accent-primary">
                        {item.avatarLabel}
                      </div>
                      <p className="text-label text-text-secondary">{item.actorName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden border border-accent-primary/15 bg-linear-to-br from-white via-white to-accent-primary/8">
            <CardHeader className="items-start border-none pb-0">
              <div className="space-y-2">
                <CardTitle>Executive Actions</CardTitle>
                <p className="text-body text-text-secondary">Action items requiring approval, authorization, or operational response.</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-2 gap-3">
                {overview.actionCenter.counts.map((item) => (
                  <div key={item.label} className="rounded-[18px] border border-border-soft bg-surface p-4 shadow-soft">
                    <p className="text-label text-text-muted">{item.label}</p>
                    <p className="mt-2 text-[28px] font-bold leading-none tracking-[-0.03em] text-text-primary">
                      {new Intl.NumberFormat("en-IN").format(item.value)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {overview.actionCenter.quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.route}
                    className="flex items-center justify-between rounded-[18px] border border-border-soft bg-white px-4 py-3 text-body font-medium text-text-primary shadow-soft subtle-hover hover:-translate-y-px"
                  >
                    <span>{action.label}</span>
                    <ArrowUpRight className="h-4 w-4 text-text-muted" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="items-start border-none pb-0">
              <div className="space-y-2">
                <CardTitle>Executive Performance Snapshot</CardTitle>
                <p className="text-body text-text-secondary">Summary metrics for executive reviews, operational alignment, and stakeholder briefings.</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <SignalTile label="Critical Project" value={criticalProject?.name || "Stable"} tone="red" />
              <SignalTile label="Collections at Risk" value={formatCompactCurrency(overview.revenueCollections.totals.overdueAmount)} tone="amber" />
              <SignalTile label="Vendor Approvals" value={new Intl.NumberFormat("en-IN").format(overview.actionCenter.counts[3]?.value || 0)} tone="blue" />
              <SignalTile label="Activity Log Entries" value={new Intl.NumberFormat("en-IN").format(activityFeed.items.length)} tone="green" />
              <div className="rounded-[20px] border border-border-soft bg-surface-secondary p-4">
                <p className="text-label uppercase tracking-[0.14em] text-text-muted">Operational Summary</p>
                <p className="mt-2 text-body text-text-secondary">
                  Health score is {overview.portfolio.healthScore}/100, collections are at {overview.revenueCollections.totals.collectionRate}% of revenue this month, and the top risk sits in {criticalProject?.name || "the active portfolio"}.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function SignalTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "amber" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "border-success/15 bg-success/8"
      : tone === "amber"
        ? "border-warning/15 bg-warning/8"
        : tone === "red"
          ? "border-error/15 bg-error/8"
          : "border-accent-primary/15 bg-accent-primary/8";

  return (
    <div className={`rounded-[20px] border p-4 ${toneClass}`}>
      <p className="text-label uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className="mt-2 text-card-title text-text-primary">{value}</p>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-border-soft bg-surface-secondary px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-body text-text-secondary">{label}</span>
      </div>
      <span className="text-card-title text-text-primary">{value}</span>
    </div>
  );
}

function WalletGlyph() {
  return <BriefcaseBusiness className="h-5 w-5" />;
}
