"use client";

import type { LucideIcon } from "lucide-react";
import { FilePenLine, Users, ShieldCheck, Landmark, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/erp-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type ContractorTimelineItem = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  category: string; // "Contract" | "Workforce" | "Compliance" | "Finance"
};

function iconForCategory(category: string): LucideIcon {
  if (category === "Contract") return FilePenLine;
  if (category === "Workforce") return Users;
  if (category === "Compliance") return ShieldCheck;
  return Landmark;
}

function toneForCategory(category: string) {
  if (category === "Contract") return "info" as const;
  if (category === "Workforce") return "warning" as const;
  if (category === "Compliance") return "success" as const;
  return "neutral" as const;
}

export function ContractorTimeline({ items }: { items: ContractorTimelineItem[] }) {
  return (
    <Card className="border-border-soft/80 bg-surface">
      <CardHeader>
        <CardTitle className="text-section-title font-secondary text-text-primary">Operational Timeline</CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-6 pl-6 before:absolute before:left-8 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-soft">
        {items.map((item) => {
          const Icon = iconForCategory(item.category);
          const tone = toneForCategory(item.category);

          return (
            <div key={item.id} className="relative flex gap-4 pl-6 group">
              {/* Timeline Marker Anchor */}
              <div className="absolute left-[-22px] top-1 flex h-9 w-9 items-center justify-center rounded-full border border-border-soft bg-surface shadow-soft transition-transform group-hover:scale-110 z-10">
                <Icon className="h-4 w-4 text-accent-primary" />
              </div>

              {/* Event Card */}
              <div className="flex-1 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4 shadow-soft hover:border-accent-primary/40 transition-colors duration-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-card-title text-text-primary font-semibold">{item.title}</p>
                      <Badge tone={tone} className="text-[10px] px-1.5 py-0.5 uppercase tracking-wider font-semibold">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-body text-text-secondary">{item.detail}</p>
                  </div>
                  <span className="text-label text-text-muted font-medium bg-surface px-2 py-1 rounded-[var(--radius-input)] border border-border-soft/60">
                    {formatDate(item.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
