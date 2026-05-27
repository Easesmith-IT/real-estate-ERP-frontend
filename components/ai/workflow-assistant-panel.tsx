"use client";

import { useUiStore } from "@/store/ui-store";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function WorkflowAssistantPanel() {
  const open = useUiStore((state) => state.assistantPanelOpen);
  const toggleAssistantPanel = useUiStore((state) => state.toggleAssistantPanel);

  return (
    <Drawer open={open} onClose={() => toggleAssistantPanel(false)} title="Workflow Assistant">
      <div className="space-y-4">
        <div className="surface-secondary p-4">
          <p className="text-body text-text-secondary">Smart summary</p>
          <p className="mt-2 text-body text-text-primary">Two project milestones are delayed by more than 3 days. Low-stock cement and steel alerts need procurement review.</p>
        </div>
        <div className="space-y-2">
          <p className="text-body text-text-secondary">Context suggestions</p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">Open delayed milestone drilldown</Badge>
            <Badge tone="warning">Prepare urgent stock replenishment queue</Badge>
          </div>
        </div>
        <Button className="w-full">Generate weekly construction ops report</Button>
      </div>
    </Drawer>
  );
}
