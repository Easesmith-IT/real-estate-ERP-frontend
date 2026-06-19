"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles, WandSparkles } from "lucide-react";
import { apiRequest } from "@/lib/erp-api";
import { formatDateTime, toneForSeverity } from "@/lib/erp-utils";
import type { AssistantOverviewResponse } from "@/lib/erp-types";
import { useUiStore } from "@/store/ui-store";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function WorkflowAssistantPanel() {
  const role = useUiStore((state) => state.role);
  const open = useUiStore((state) => state.assistantPanelOpen);
  const assistantSession = useUiStore((state) => state.assistantSession);
  const clearAssistantSession = useUiStore((state) => state.clearAssistantSession);
  const toggleAssistantPanel = useUiStore((state) => state.toggleAssistantPanel);
  const toggleCommandPalette = useUiStore((state) => state.toggleCommandPalette);

  const overviewQuery = useQuery({
    queryKey: ["erp-ai-overview", role],
    queryFn: async () => (await apiRequest<AssistantOverviewResponse>("/api/ai/overview", { role })).data,
    enabled: open,
  });

  return (
    <Drawer open={open} onClose={() => toggleAssistantPanel(false)} title="Workflow Assistant">
      <div className="space-y-4">
        <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">Operational Mode</Badge>
            <p className="text-label text-text-muted">Deterministic operational summaries based on active data registers.</p>
          </div>
        </div>

        {assistantSession ? (
          <>
            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-body text-text-secondary">Latest command result</p>
                  <p className="mt-2 text-lg font-semibold text-text-primary">{assistantSession.title}</p>
                </div>
                <WandSparkles className="h-5 w-5 text-accent-primary" />
              </div>
              <p className="mt-3 text-body text-text-secondary">{assistantSession.summary}</p>
              <p className="mt-3 text-label text-text-muted">{formatDateTime(assistantSession.generatedAt)}</p>
            </div>

            <div className="space-y-2">
              <p className="text-body text-text-secondary">Insights</p>
              {assistantSession.insights.map((insight) => (
                <div key={insight} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4 text-body text-text-secondary">
                  {insight}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-body text-text-secondary">Suggested next actions</p>
              {assistantSession.recommendations.map((recommendation) => (
                <div key={recommendation.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-text-primary">{recommendation.title}</p>
                    <Badge tone={toneForSeverity(recommendation.priority)}>{recommendation.priority}</Badge>
                  </div>
                  <p className="mt-2 text-body text-text-secondary">{recommendation.detail}</p>
                  <p className="mt-2 text-label text-text-muted">{recommendation.route}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => toggleCommandPalette(true)}>
                Execute another command
              </Button>
              <Button variant="ghost" className="flex-1" onClick={clearAssistantSession}>
                Clear result
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
              <p className="text-body text-text-secondary">Live shell brief</p>
              {overviewQuery.data ? (
                <>
                  <p className="mt-2 text-lg font-semibold text-text-primary">{overviewQuery.data.headline}</p>
                  <p className="mt-3 text-body text-text-secondary">{overviewQuery.data.summary}</p>
                </>
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="h-6 w-3/4 rounded shimmer-skeleton" />
                  <div className="h-4 w-full rounded shimmer-skeleton" />
                  <div className="h-4 w-5/6 rounded shimmer-skeleton" />
                </div>
              )}
            </div>

            {overviewQuery.data ? (
              <>
                <div className="space-y-2">
                  <p className="text-body text-text-secondary">Signals</p>
                  {overviewQuery.data.signals.map((signal) => (
                    <div key={signal.label} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-text-primary">{signal.label}</p>
                        <Badge tone={signal.tone}>{signal.value}</Badge>
                      </div>
                      <p className="mt-2 text-body text-text-secondary">{signal.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-body text-text-secondary">Recommended focus</p>
                  {overviewQuery.data.recommendations.map((recommendation) => (
                    <div key={recommendation.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-text-primary">{recommendation.title}</p>
                        <Badge tone={toneForSeverity(recommendation.priority)}>{recommendation.priority}</Badge>
                      </div>
                      <p className="mt-2 text-body text-text-secondary">{recommendation.detail}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            <Button className="w-full" onClick={() => toggleCommandPalette(true)}>
              <Sparkles className="h-4 w-4" />
              Open Command Center
            </Button>
          </>
        )}
      </div>
    </Drawer>
  );
}
