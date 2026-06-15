"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight, AlertTriangle, Info, ShieldCheck, UsersRound, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type ContractorInsight = {
  id: string;
  priority: "Success" | "Warning" | "Critical" | "Information";
  title: string;
  description: string;
  action: string;
  type: "workforce" | "compliance" | "performance" | "expiry";
  onClickAction?: () => void;
};

function iconForInsight(type: ContractorInsight["type"]): LucideIcon {
  if (type === "workforce") return UsersRound;
  if (type === "compliance") return AlertTriangle;
  if (type === "performance") return ShieldCheck;
  return CalendarClock;
}

function toneForInsight(priority: ContractorInsight["priority"]) {
  if (priority === "Success") return "success" as const;
  if (priority === "Warning") return "warning" as const;
  if (priority === "Critical") return "error" as const;
  return "info" as const;
}

export function ContractorInsights({
  items,
  onActionClick,
}: {
  items: ContractorInsight[];
  onActionClick?: (item: ContractorInsight) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-section-title font-secondary text-text-primary">Contractor Intelligence</h2>
          <p className="mt-1 text-body text-text-secondary">
            Operational anomalies, compliance highlights, and scheduling risk signals across active partner networks.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = iconForInsight(item.type);
          const tone = toneForInsight(item.priority);

          return (
            <Card key={item.id} className="overflow-hidden border-border-soft/80 bg-surface shadow-soft transition-all duration-200 hover:shadow-md">
              <CardContent className="space-y-4 p-5 flex flex-col justify-between h-full min-h-[190px]">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="kpi-icon-shell flex h-10 w-10 items-center justify-center rounded-[12px] bg-active-soft">
                      <Icon className="h-5 w-5 text-accent-primary" />
                    </div>
                    <Badge tone={tone}>{item.priority}</Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-card-title text-text-primary font-semibold">{item.title}</h3>
                    <p className="text-body text-text-secondary leading-relaxed">{item.description}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto justify-start p-0 text-accent-primary hover:bg-transparent font-medium group"
                    onClick={() => {
                      if (item.onClickAction) item.onClickAction();
                      else if (onActionClick) onActionClick(item);
                    }}
                  >
                    <span>{item.action}</span>
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
