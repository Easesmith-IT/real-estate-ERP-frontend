"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatPortfolioValue } from "./customer-utils";

type Props = {
  payments: {
    dueSoonAmount: number;
    outstanding: number;
    overdueCount: number;
    dueSoonSchedules: Array<{
      customerName: string;
      unitCode: string;
      projectName: string;
      label: string;
      amount: number;
      dueDate: string;
    }>;
  };
};

export function CustomerCollections({ payments }: Props) {
  const data = Array.from({ length: 12 }, (_, index) => ({
    month: new Date(new Date().getFullYear(), new Date().getMonth() - (11 - index), 1).toLocaleDateString("en-IN", { month: "short" }),
    due: Math.max(0, Math.round(18 + Math.sin(index / 2) * 5 + index * 1.2)),
    recovered: Math.max(0, Math.round(14 + Math.cos(index / 2) * 4 + index * 1.1)),
    forecast: Math.max(0, Math.round(12 + index * 1.5)),
  }));

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden">
        <CardHeader className="border-none pb-0">
          <div>
            <CardTitle>Collections Center</CardTitle>
            <p className="text-body text-text-secondary">Upcoming dues, overdue exposure, and forward collection visibility.</p>
          </div>
        </CardHeader>
        <CardContent className="h-[320px] pt-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="collectionsDue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} /></linearGradient>
                <linearGradient id="collectionsRecovered" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.24} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} /></linearGradient>
                <linearGradient id="collectionsForecast" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.24} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
              <XAxis dataKey="month" stroke="var(--color-text-muted)" />
              <YAxis stroke="var(--color-text-muted)" />
              <Tooltip />
              <Area type="monotone" dataKey="due" stroke="#2563eb" fill="url(#collectionsDue)" />
              <Area type="monotone" dataKey="recovered" stroke="#22c55e" fill="url(#collectionsRecovered)" />
              <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" fill="url(#collectionsForecast)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-none pb-0">
          <div>
            <CardTitle>Collection Health</CardTitle>
            <p className="text-body text-text-secondary">Core collection exposure and upcoming payment workload.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Upcoming Collections" value={formatPortfolioValue(payments.dueSoonAmount)} tone="info" />
            <Metric label="Overdue Collections" value={formatPortfolioValue(payments.outstanding)} tone="warning" />
            <Metric label="Expected Collections" value={formatPortfolioValue(payments.outstanding + payments.dueSoonAmount)} tone="success" />
            <Metric label="Collection Efficiency" value={`${Math.max(0, 100 - payments.overdueCount * 6)}%`} tone="success" />
          </div>
          <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
            <div className="flex items-center justify-between">
              <p className="text-card-title text-text-primary">Top Outstanding Accounts</p>
                  <Badge tone={payments.overdueCount > 0 ? "warning" : "success"}>{payments.overdueCount} Risk</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {payments.dueSoonSchedules.slice(0, 4).map((item) => (
                <div key={`${item.customerName}-${item.unitCode}`} className="flex items-center justify-between gap-4 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-2">
                  <div>
                    <p className="text-body text-text-primary">{item.customerName}</p>
                    <p className="text-label text-text-muted">{item.projectName} / {item.unitCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-body font-medium text-text-primary">{formatPortfolioValue(item.amount)}</p>
                    <p className="text-label text-text-muted">{new Date(item.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "info" | "warning" | "success" }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
      <p className="text-label uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-text-primary"}`}>{value}</p>
    </div>
  );
}
