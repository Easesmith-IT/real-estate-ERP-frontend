"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight, AlertTriangle, Info, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type WorkforceInsight = {
  id: string;
  priority: "Success" | "Warning" | "Critical" | "Information";
  title: string;
  description: string;
  action: string;
  icon: "success" | "warning" | "critical" | "info";
};

function iconForInsight(icon: WorkforceInsight["icon"]): LucideIcon {
  if (icon === "success") return ShieldCheck;
  if (icon === "warning") return UsersRound;
  if (icon === "critical") return AlertTriangle;
  return Info;
}

function toneForInsight(priority: WorkforceInsight["priority"]) {
  if (priority === "Success") return "success" as const;
  if (priority === "Warning") return "warning" as const;
  if (priority === "Critical") return "error" as const;
  return "info" as const;
}

export function EmployeeInsights({ items }: { items: WorkforceInsight[] }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-section-title font-secondary text-text-primary">Workforce Insights</h2>
          <p className="mt-1 text-body text-text-secondary">
            Operational signals surface staffing pressure, attendance health, and capacity movement before you enter the directory.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {items.map((item) => {
          const Icon = iconForInsight(item.icon);

          return (
            <Card key={item.id} className="overflow-hidden border-border-soft/80">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="kpi-icon-shell flex h-11 w-11 items-center justify-center">
                    <Icon className="h-5 w-5 text-accent-primary" />
                  </div>
                  <Badge tone={toneForInsight(item.priority)}>{item.priority}</Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="text-card-title text-text-primary">{item.title}</h3>
                  <p className="text-body text-text-secondary">{item.description}</p>
                </div>
                <Button variant="ghost" className="h-auto justify-start px-0 text-accent-primary hover:bg-transparent">
                  {item.action}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
