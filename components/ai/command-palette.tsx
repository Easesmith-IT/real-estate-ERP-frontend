"use client";

import { useCallback, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

const actions = [
  "Generate daily construction operations summary",
  "Highlight critical material stock alerts",
  "Show delayed milestones with risk indicators",
  "Draft follow-up plan for high-value sales leads",
];

export function AICommandPalette() {
  const open = useUiStore((state) => state.commandPaletteOpen);
  const toggleCommandPalette = useUiStore((state) => state.toggleCommandPalette);
  const [activeIndex, setActiveIndex] = useState(-1);
  const actionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleAction = useCallback((action: string) => {
    // Placeholder — wire to actual command execution
    console.log("Execute:", action);
    toggleCommandPalette(false);
  }, [toggleCommandPalette]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = Math.min(activeIndex + 1, actions.length - 1);
        setActiveIndex(next);
        actionRefs.current[next]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        setActiveIndex(prev);
        actionRefs.current[prev]?.focus();
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        handleAction(actions[activeIndex]);
      }
    },
    [activeIndex, handleAction],
  );

  return (
    <Modal open={open} onClose={() => toggleCommandPalette(false)} title="AI Command Palette" description="Fast operational actions across construction ERP workflows">
      <div className="space-y-3" onKeyDown={onKeyDown}>
        <Input
          placeholder="Type a command or ask for a report"
          className="bg-surface-secondary"
          aria-label="Command input"
          onFocus={() => setActiveIndex(-1)}
        />
        <div className="space-y-2" role="listbox" aria-label="Suggested actions">
          {actions.map((action, index) => (
            <button
              key={action}
              ref={(el) => { actionRefs.current[index] = el; }}
              role="option"
              aria-selected={activeIndex === index}
              onClick={() => handleAction(action)}
              className="subtle-hover flex w-full items-center justify-between rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary px-3 py-3 text-left text-body text-text-secondary hover:bg-hover focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-primary" />
                {action}
              </span>
              <Search className="h-4 w-4 text-text-muted" />
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
