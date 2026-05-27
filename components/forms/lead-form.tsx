"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function FormSection({
  title,
  children,
  defaultOpen = true,
  isLast = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isLast?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("bg-surface-secondary", !isLast && "border-b border-border-soft")}>
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left text-card-title text-text-primary subtle-hover hover:bg-hover"
        onClick={() => setOpen((value) => !value)}
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="grid grid-cols-1 gap-3 border-t border-border-soft p-4 lg:grid-cols-2">{children}</div>}
    </div>
  );
}

export function LeadForm() {
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSaving(false);
  };

  return (
    <Card className="flex min-h-[620px] flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>Lead Intake Form</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-auto pr-1">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-border-soft">
            <FormSection title="Contact Details">
              <div className="space-y-1">
                <label htmlFor="lead-first-name" className="text-label text-text-secondary">First name</label>
                <Input id="lead-first-name" placeholder="e.g. Priya" aria-label="First name" />
              </div>
              <div className="space-y-1">
                <label htmlFor="lead-last-name" className="text-label text-text-secondary">Last name</label>
                <Input id="lead-last-name" placeholder="e.g. Sharma" aria-label="Last name" />
              </div>
              <div className="space-y-1">
                <label htmlFor="lead-phone" className="text-label text-text-secondary">Phone number</label>
                <Input id="lead-phone" placeholder="e.g. +91 98765 43210" aria-label="Phone number" />
              </div>
              <div className="space-y-1">
                <label htmlFor="lead-email" className="text-label text-text-secondary">Email address</label>
                <Input id="lead-email" placeholder="e.g. priya@email.com" aria-label="Email address" />
              </div>
            </FormSection>

            <FormSection title="Property Preferences" defaultOpen={false}>
              <div className="space-y-1">
                <label htmlFor="lead-project" className="text-label text-text-secondary">Preferred project</label>
                <Input id="lead-project" placeholder="e.g. Aurora Heights" aria-label="Preferred project" />
              </div>
              <div className="space-y-1">
                <label htmlFor="lead-config" className="text-label text-text-secondary">Configuration</label>
                <Input id="lead-config" placeholder="e.g. 2BHK / 3BHK" aria-label="Configuration" />
              </div>
              <div className="space-y-1">
                <label htmlFor="lead-budget" className="text-label text-text-secondary">Budget range</label>
                <Input id="lead-budget" placeholder="e.g. INR 80L – 1.2 Cr" aria-label="Budget range" />
              </div>
              <div className="space-y-1">
                <label htmlFor="lead-possession" className="text-label text-text-secondary">Possession timeline</label>
                <Input id="lead-possession" placeholder="e.g. 2026 Q3" aria-label="Possession timeline" />
              </div>
            </FormSection>

            <FormSection title="Sales Assignment" defaultOpen={false} isLast>
              <div className="space-y-1">
                <label htmlFor="lead-exec" className="text-label text-text-secondary">Assigned sales executive</label>
                <Input id="lead-exec" placeholder="e.g. Aman Singh" aria-label="Assigned sales executive" />
              </div>
              <div className="space-y-1">
                <label htmlFor="lead-source" className="text-label text-text-secondary">Lead source</label>
                <Input id="lead-source" placeholder="e.g. Website, Referral" aria-label="Lead source" />
              </div>
              <div className="space-y-1">
                <label htmlFor="lead-campaign" className="text-label text-text-secondary">Campaign</label>
                <Input id="lead-campaign" placeholder="e.g. Summer 2026" aria-label="Campaign" />
              </div>
              <div className="space-y-1">
                <label htmlFor="lead-followup" className="text-label text-text-secondary">Follow-up date</label>
                <Input id="lead-followup" placeholder="e.g. 2026-06-15" aria-label="Follow-up date" />
              </div>
            </FormSection>
          </div>
        </div>

        <div className="section-separator sticky bottom-0 -mx-6 mt-auto flex justify-end gap-2 bg-surface px-6 pb-1 pt-4">
          <Button variant="secondary">Cancel</Button>
          <Button loading={saving} onClick={onSave}>
            Save & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
