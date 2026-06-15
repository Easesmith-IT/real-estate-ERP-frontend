"use client";

import type { EmployeeActivityItem, EmployeeTimelineItem } from "@/lib/erp-types";
import { formatDate, toneForSeverity } from "@/lib/erp-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EmployeeTimeline({
  items,
  title,
}: {
  items: EmployeeTimelineItem[];
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-4">
            <div className="flex w-16 shrink-0 flex-col items-center">
              <div className="rounded-full bg-active-soft px-3 py-1 text-label text-accent-primary">{item.year}</div>
              {index < items.length - 1 ? <div className="mt-2 h-full w-px bg-border-soft" /> : null}
            </div>
            <div className="min-h-[88px] flex-1 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-card-title text-text-primary">{item.projectName}</p>
                  <p className="mt-1 text-body text-text-secondary">{item.role}</p>
                </div>
                <Badge tone={item.status === "Current Assignment" ? "success" : "info"}>{item.status}</Badge>
              </div>
              <p className="mt-3 text-label text-text-muted">Started {formatDate(item.startDate)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EmployeeActivityTimeline({
  items,
}: {
  items: EmployeeActivityItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-primary" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-card-title text-text-primary">{item.title}</p>
                <Badge tone={toneForSeverity(item.type)}>{item.type}</Badge>
              </div>
              <p className="text-body text-text-secondary">{item.description}</p>
              <p className="text-label text-text-muted">{formatDate(item.createdAt)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
