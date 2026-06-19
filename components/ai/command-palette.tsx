"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Command, Search, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/erp-api";
import type { AssistantCommandResponse, AssistantOverviewResponse } from "@/lib/erp-types";
import { useUiStore } from "@/store/ui-store";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AICommandPalette() {
  const role = useUiStore((state) => state.role);
  const open = useUiStore((state) => state.commandPaletteOpen);
  const toggleCommandPalette = useUiStore((state) => state.toggleCommandPalette);
  const toggleAssistantPanel = useUiStore((state) => state.toggleAssistantPanel);
  const setAssistantSession = useUiStore((state) => state.setAssistantSession);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [query, setQuery] = useState("");
  const actionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const overviewQuery = useQuery({
    queryKey: ["erp-ai-overview", role],
    queryFn: async () => (await apiRequest<AssistantOverviewResponse>("/api/ai/overview", { role })).data,
    enabled: open,
  });

  const commands = overviewQuery.data?.suggestedCommands || [];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCommands = !normalizedQuery
    ? commands
    : commands.filter((command) =>
      [command.title, command.description, ...command.keywords].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );

  const runCommandMutation = useMutation({
    mutationFn: async (payload: { commandId?: string; query?: string }) =>
      (await apiRequest<AssistantCommandResponse>("/api/ai/command", { role, method: "POST", body: payload })).data,
    onSuccess: (data) => {
      setAssistantSession(data);
      toggleCommandPalette(false);
      toggleAssistantPanel(true);
    },
  });

  const handleAction = useCallback((commandId?: string) => {
    runCommandMutation.mutate({
      commandId,
      query: query.trim() || undefined,
    });
  }, [query, runCommandMutation]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
      setQuery("");
    }
  }, [open]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = Math.min(activeIndex + 1, Math.max(filteredCommands.length - 1, 0));
        setActiveIndex(next);
        actionRefs.current[next]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        setActiveIndex(prev);
        actionRefs.current[prev]?.focus();
      } else if (event.key === "Enter" && activeIndex >= 0 && filteredCommands[activeIndex]) {
        event.preventDefault();
        handleAction(filteredCommands[activeIndex].id);
      } else if (event.key === "Enter" && query.trim()) {
        event.preventDefault();
        handleAction();
      }
    },
    [activeIndex, filteredCommands, handleAction, query],
  );

  return (
    <Modal open={open} onClose={() => toggleCommandPalette(false)} title="Command Center" description="Fast operational actions across construction ERP workflows">
      <div className="space-y-4" onKeyDown={onKeyDown}>
        <Input
          placeholder="Type a command or ask for a report"
          className="bg-surface-secondary"
          aria-label="Command input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setActiveIndex(-1)}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">Operational Mode</Badge>
          <p className="text-label text-text-muted">Accesses the operational data register. Deterministic execution.</p>
        </div>

        {overviewQuery.isLoading ? (
          <div className="space-y-2">
            <div className="h-12 w-full rounded-[var(--radius-input)] shimmer-skeleton" />
            <div className="h-12 w-full rounded-[var(--radius-input)] shimmer-skeleton" />
            <div className="h-12 w-full rounded-[var(--radius-input)] shimmer-skeleton" />
          </div>
        ) : null}
        {overviewQuery.error ? <p className="text-body text-error">Assistant commands are unavailable.</p> : null}

        <div className="space-y-2" role="listbox" aria-label="Suggested actions">
          {filteredCommands.map((command, index) => (
            <button
              key={command.id}
              ref={(el) => { actionRefs.current[index] = el; }}
              role="option"
              aria-selected={activeIndex === index}
              onClick={() => handleAction(command.id)}
              className="subtle-hover flex w-full items-center justify-between rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary px-3 py-3 text-left text-body text-text-secondary hover:bg-hover focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-text-primary">
                  <Sparkles className="h-4 w-4 text-accent-primary" />
                  {command.title}
                </span>
                <span className="mt-1 block text-label text-text-muted">{command.description}</span>
              </span>
              <span className="ml-3 flex items-center gap-2">
                <Badge tone="neutral">{command.route}</Badge>
                <Search className="h-4 w-4 text-text-muted" />
              </span>
            </button>
          ))}

          {!overviewQuery.isLoading && filteredCommands.length === 0 ? (
            <div className="rounded-[var(--radius-input)] border border-dashed border-border-soft bg-surface-secondary px-4 py-5 text-body text-text-secondary">
              No preset matched the current query. Press Enter to execute a query based on the typed prompt.
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-4">
          <div className="text-label text-text-muted">
            {query.trim() ? `Prompt: ${query.trim()}` : "Select a suggested workflow command or type your own prompt."}
          </div>
          <Button loading={runCommandMutation.isPending} onClick={() => handleAction(filteredCommands[activeIndex]?.id)}>
            <Command className="h-4 w-4" />
            Execute Command
          </Button>
        </div>

        {runCommandMutation.error ? <p className="text-body text-error">Command execution failed. Please retry.</p> : null}
      </div>
    </Modal>
  );
}
