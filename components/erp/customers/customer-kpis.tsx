"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { Users, UserCheck, Building2, Wallet, Percent, IndianRupee, Star, TrendingUp } from "lucide-react";
import { CustomerKpiSnapshot, createSparkline, formatPortfolioValue } from "./customer-utils";

type Props = {
  kpis: CustomerKpiSnapshot;
};

const items = [
  { key: "totalCustomers", title: "Total Customers", icon: Users, tone: "info" as const },
  { key: "activeBookings", title: "Active Customers", icon: UserCheck, tone: "success" as const },
  { key: "totalBookedValue", title: "Portfolio Value", icon: Building2, tone: "info" as const },
  { key: "outstandingDues", title: "Outstanding Dues", icon: Wallet, tone: "warning" as const },
  { key: "collectionRatio", title: "Collection Rate", icon: Percent, tone: "success" as const },
  { key: "averageCustomerValue", title: "Average Customer Value", icon: IndianRupee, tone: "info" as const },
  { key: "premiumCustomers", title: "Premium Customers", icon: Star, tone: "success" as const },
  { key: "revenueRealized", title: "Revenue Realized", icon: TrendingUp, tone: "success" as const },
] as const;

export function CustomerKpis({ kpis }: Props) {
  const row = [
    kpis.totalCustomers,
    kpis.activeBookings,
    kpis.totalBookedValue,
    kpis.outstandingDues,
    kpis.collectionRatio,
    kpis.averageCustomerValue,
    kpis.premiumCustomers,
    kpis.revenueRealized,
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const value = row[index];
        const Icon = item.icon;
        const sparkline = createSparkline((index + 3) * 10 + (typeof value === "number" ? value / 1000000 : 0), 7).map((point, pointIndex) => ({ pointIndex, value: point }));
        const display = item.key === "totalBookedValue" || item.key === "outstandingDues" || item.key === "averageCustomerValue" || item.key === "revenueRealized"
          ? formatPortfolioValue(Number(value))
          : item.key === "collectionRatio"
            ? `${value}%`
            : `${value}`;

        return (
          <Card key={item.key} className="card-kpi overflow-hidden border-border-soft/80 bg-surface hover:shadow-soft transition-all duration-200">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-secondary text-accent-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge tone={item.tone}>{item.key === "outstandingDues" ? "Watch" : item.tone}</Badge>
              </div>
              <div>
                <p className="text-label uppercase tracking-[0.14em] text-text-muted">{item.title}</p>
                <p className="mt-2 text-[28px] font-bold leading-none tracking-[-0.03em] text-text-primary">{display}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className={`text-label ${item.tone === "warning" ? "text-warning" : "text-success"}`}>
                  {item.key === "outstandingDues" ? "+8.4%" : "+4.2%"}
                </p>
                <div className="h-10 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparkline}>
                      <defs>
                        <linearGradient id={`customer-kpi-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={item.tone === "warning" ? "#f59e0b" : "#2563eb"} stopOpacity={0.28} />
                          <stop offset="95%" stopColor={item.tone === "warning" ? "#f59e0b" : "#2563eb"} stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke={item.tone === "warning" ? "#f59e0b" : "#2563eb"} strokeWidth={2} fill={`url(#customer-kpi-${item.key})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
