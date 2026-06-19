"use client";

import { useQuery } from "@tanstack/react-query";
import { BellRing, Clock3, TriangleAlert } from "lucide-react";
import { apiRequest } from "@/lib/erp-api";
import { formatDateTime, toneForSeverity } from "@/lib/erp-utils";
import type { NotificationsResponse } from "@/lib/erp-types";
import { useUiStore } from "@/store/ui-store";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function NotificationCenter() {
  const role = useUiStore((state) => state.role);
  const open = useUiStore((state) => state.notificationCenterOpen);
  const toggleNotificationCenter = useUiStore((state) => state.toggleNotificationCenter);

  const query = useQuery({
    queryKey: ["erp-notifications", role],
    queryFn: async () => (await apiRequest<NotificationsResponse>("/api/notifications", { role })).data,
    enabled: open,
  });

  return (
    <Drawer open={open} onClose={() => toggleNotificationCenter(false)} title="Notifications">
      <div className="space-y-5">
        <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-accent-primary" />
            <p className="font-medium text-text-primary">Operations Notification Center Feed</p>
          </div>
          <p className="mt-2 text-body text-text-secondary">
            Operational updates and notifications generated in real-time from active ERP registers and risk signals.
          </p>
        </div>

        {query.data ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
              <p className="text-label text-text-muted">Unread</p>
              <p className="mt-1 text-2xl font-semibold text-text-primary">{query.data.summary.unread}</p>
            </div>
            <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
              <p className="text-label text-text-muted">Critical / High</p>
              <p className="mt-1 text-2xl font-semibold text-text-primary">{query.data.summary.critical + query.data.summary.high}</p>
            </div>
          </div>
        ) : null}

        {query.isLoading ? (
          <div className="space-y-3">
            <div className="h-20 w-full rounded-[var(--radius-card)] shimmer-skeleton" />
            <div className="h-20 w-full rounded-[var(--radius-card)] shimmer-skeleton" />
          </div>
        ) : null}
        {query.error ? <p className="text-body text-error">Notification feed is unavailable.</p> : null}

        {query.data ? (
          <div className="space-y-3">
            {query.data.notifications.map((item) => (
              <div key={item.id} className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-text-primary">{item.title}</p>
                      <Badge tone={toneForSeverity(item.severity)}>{item.severity}</Badge>
                    </div>
                    <p className="text-body text-text-secondary">{item.message}</p>
                  </div>
                  <Badge tone="neutral">{item.category}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-label text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDateTime(item.createdAt)}
                  </span>
                  {item.dueAt ? (
                    <span className="inline-flex items-center gap-1">
                      <TriangleAlert className="h-3.5 w-3.5" />
                      Due {formatDateTime(item.dueAt)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-label text-text-muted">{item.source}</p>
                  <Button variant="secondary" size="sm" onClick={() => toggleNotificationCenter(false)}>
                    {item.actionLabel}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}
