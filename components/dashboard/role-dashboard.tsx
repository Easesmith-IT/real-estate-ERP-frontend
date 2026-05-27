"use client";

import { useMemo } from "react";
import { BarChart3, Building2, CircleDollarSign, Users } from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const baseStats = {
  admin: [
    { title: "Active Projects", value: "42", delta: "+3", icon: Building2 },
    { title: "Monthly Revenue", value: "INR 8.4 Cr", delta: "+11%", icon: CircleDollarSign },
    { title: "Team Productivity", value: "91%", delta: "+5%", icon: Users },
    { title: "Forecast Accuracy", value: "88%", delta: "+2%", icon: BarChart3 },
  ],
  manager: [
    { title: "Pipeline Value", value: "INR 23.8 Cr", delta: "+9%", icon: BarChart3 },
    { title: "Site Inventory", value: "312 units", delta: "-2%", icon: Building2 },
    { title: "Win Rate", value: "34%", delta: "+4%", icon: Users },
    { title: "Collections", value: "INR 5.2 Cr", delta: "+8%", icon: CircleDollarSign },
  ],
  accountant: [
    { title: "Due This Week", value: "INR 2.1 Cr", delta: "+6%", icon: CircleDollarSign },
    { title: "Invoice Closure", value: "96%", delta: "+1%", icon: BarChart3 },
    { title: "Ledger Variance", value: "0.4%", delta: "-0.2%", icon: Users },
    { title: "Overdue Accounts", value: "19", delta: "-3", icon: Building2 },
  ],
  sales: [
    { title: "New Leads", value: "142", delta: "+12", icon: Users },
    { title: "Qualified", value: "71", delta: "+8", icon: BarChart3 },
    { title: "Site Visits", value: "39", delta: "+5", icon: Building2 },
    { title: "Closures", value: "12", delta: "+2", icon: CircleDollarSign },
  ],
};

export function RoleDashboard() {
  const role = useUiStore((state) => state.role);
  const stats = useMemo(() => baseStats[role], [role]);

  return (
    <div className="section-separator grid grid-cols-1 gap-4 pt-6 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="card-kpi subtle-hover hover:-translate-y-0.5">
          <CardHeader className="items-start border-none pb-1">
            <div className="flex w-full items-start justify-between">
              <CardTitle className="text-kpi-label text-text-kpi-label">{stat.title}</CardTitle>
              <div className="kpi-icon-shell p-2 text-accent-primary">
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-1">
            <p className="text-kpi-value truncate text-text-primary">{stat.value}</p>
            <Badge tone={stat.delta.startsWith("-") ? "warning" : "success"} className="text-kpi-trend">
              {stat.delta} vs last cycle
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
