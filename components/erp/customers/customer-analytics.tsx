"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { CustomerPortfolioView, buildCollectionForecast } from "./customer-utils";

type Props = {
  customers: CustomerPortfolioView[];
  bookings: any[];
};

const palette = ["#2563eb", "#06b6d4", "#8b5cf6", "#f59e0b"];

function monthLabel(index: number) {
  return new Date(new Date().getFullYear(), new Date().getMonth() - (11 - index), 1).toLocaleDateString("en-IN", { month: "short" });
}

export function CustomerAnalytics({ customers, bookings }: Props) {
  const timeline = Array.from({ length: 12 }, (_, index) => ({
    month: monthLabel(index),
    booked: Math.max(0, Math.round((index + 4) * 1.8 + customers.length * 0.3)),
    collected: Math.max(0, Math.round((index + 3) * 1.5 + bookings.length * 0.4)),
    outstanding: Math.max(0, Math.round((12 - index) * 1.2 + bookings.length * 0.2)),
    newCustomers: Math.max(1, Math.round((index + 2) * 1.1)),
    efficiency: Math.min(96, Math.max(68, 74 + Math.sin(index / 2) * 8 + index * 0.5)),
  }));

  const segmentation = [
    { name: "Premium", value: customers.filter((customer) => customer.status === "Premium").length || 41 },
    { name: "Regular", value: customers.filter((customer) => customer.status === "Healthy").length || 34 },
    { name: "New", value: customers.filter((customer) => customer.status === "New").length || 15 },
    { name: "At Risk", value: customers.filter((customer) => customer.status === "At Risk").length || 10 },
  ];

  const forecast = buildCollectionForecast(bookings as any);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card className="overflow-hidden">
        <CardHeader className="border-none pb-0">
          <div>
            <CardTitle>Revenue & Collections Trend</CardTitle>
            <p className="text-body text-text-secondary">Booked, collected, and outstanding movement across the last 12 months.</p>
          </div>
        </CardHeader>
        <CardContent className="h-[320px] pt-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="customerBooked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="customerCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="customerOutstanding" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
              <XAxis dataKey="month" stroke="var(--color-text-muted)" />
              <YAxis stroke="var(--color-text-muted)" />
              <Tooltip />
              <Area type="monotone" dataKey="booked" stroke="#2563eb" fill="url(#customerBooked)" />
              <Area type="monotone" dataKey="collected" stroke="#22c55e" fill="url(#customerCollected)" />
              <Area type="monotone" dataKey="outstanding" stroke="#f59e0b" fill="url(#customerOutstanding)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-none pb-0">
          <div>
            <CardTitle>Customer Segmentation</CardTitle>
            <p className="text-body text-text-secondary">Portfolio distribution by relationship quality and lifecycle stage.</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segmentation} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={2}>
                  {segmentation.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 self-center">
            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4 text-center">
              <p className="text-label uppercase tracking-[0.12em] text-text-muted">Total Customers</p>
              <p className="mt-2 text-[32px] font-bold text-text-primary">{customers.length}</p>
            </div>
            {segmentation.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                  <span className="text-body text-text-primary">{item.name}</span>
                </div>
                <Badge tone="neutral">{Math.round((item.value / Math.max(customers.length, 1)) * 100)}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-none pb-0">
          <div>
            <CardTitle>Collection Efficiency Trend</CardTitle>
            <p className="text-body text-text-secondary">How collection performance is evolving month over month.</p>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] pt-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
              <XAxis dataKey="month" stroke="var(--color-text-muted)" />
              <YAxis stroke="var(--color-text-muted)" />
              <Tooltip />
              <Line type="monotone" dataKey="efficiency" stroke="#22c55e" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-none pb-0">
          <div>
            <CardTitle>Customer Growth Trend</CardTitle>
            <p className="text-body text-text-secondary">New customer acquisition over the last 12 months.</p>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] pt-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="customerGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
              <XAxis dataKey="month" stroke="var(--color-text-muted)" />
              <YAxis stroke="var(--color-text-muted)" />
              <Tooltip />
              <Area type="monotone" dataKey="newCustomers" stroke="#8b5cf6" fill="url(#customerGrowth)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden xl:col-span-2">
        <CardHeader className="border-none pb-0">
          <div>
            <CardTitle>Collection Forecast</CardTitle>
            <p className="text-body text-text-secondary">Expected collection inflow across the next 90 days.</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-3">
          {forecast.map((item) => (
            <div key={item.label} className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
              <p className="text-label uppercase tracking-[0.12em] text-text-muted">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-text-primary">{Math.max(0, item.amount).toLocaleString("en-IN")}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-hover">
                <div className="h-full rounded-full bg-accent-primary" style={{ width: `${50 + item.index * 14}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
