"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SelectHTMLAttributes } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
  leads: Array<{ id: string; fullName: string; phone: string; email?: string | null; projectName?: string }>;
};

const customerTypes = ["Premium", "Investor", "End User", "Corporate", "Referral"];
const sourceTypes = ["Direct", "Lead Conversion", "Broker Referral", "Walk-In", "Campaign"];

const selectClassName = "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

export function CustomerDrawer({ open, onClose, onSave, leads }: Props) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    type: "Premium",
    sourceType: "Direct",
    tags: "",
    sourceLeadId: "",
    notes: "",
    remarks: "",
    preferences: "",
  });

  useEffect(() => {
    if (!form.sourceLeadId || leads.length === 0) return;
    const lead = leads.find((item) => item.id === form.sourceLeadId);
    if (!lead) return;

    setForm((current) => ({
      ...current,
      name: current.name || lead.fullName,
      phone: current.phone || lead.phone,
      email: current.email || lead.email || "",
    }));
  }, [form.sourceLeadId, leads]);

  return (
    <Drawer open={open} title="Create Customer" size="xl" side="right" onClose={onClose}>
      <div className="space-y-6">
        <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-label text-text-secondary">Full Name</label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary">Phone Number</label>
              <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary">Email Address</label>
              <Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <SelectField label="Customer Type" value={form.type} options={customerTypes} onChange={(value) => setForm((current) => ({ ...current, type: value }))} />
            <SelectField label="Source Type" value={form.sourceType} options={sourceTypes} onChange={(value) => setForm((current) => ({ ...current, sourceType: value }))} />
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-label text-text-secondary">Tags</label>
              <Input placeholder="Premium, VIP, NRI" value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-card-title text-text-primary">Lead Association</p>
              <p className="text-body text-text-secondary">Auto-fill details if a lead is selected.</p>
            </div>
            <Badge tone="info">Optional</Badge>
          </div>
          <div className="space-y-1.5">
            <label className="text-label text-text-secondary">Source Lead Selector</label>
            <select className={selectClassName} value={form.sourceLeadId} onChange={(event) => setForm((current) => ({ ...current, sourceLeadId: event.target.value }))}>
              <option value="">No lead linked</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.fullName} {lead.projectName ? `- ${lead.projectName}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
          <p className="text-card-title text-text-primary">Additional Information</p>
          <div className="grid grid-cols-1 gap-4">
            <TextAreaField label="Notes" value={form.notes} onChange={(value) => setForm((current) => ({ ...current, notes: value }))} />
            <TextAreaField label="Remarks" value={form.remarks} onChange={(value) => setForm((current) => ({ ...current, remarks: value }))} />
            <TextAreaField label="Preferences" value={form.preferences} onChange={(value) => setForm((current) => ({ ...current, preferences: value }))} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-soft pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSave({
              name: form.name,
              phone: form.phone,
              email: form.email,
              type: form.type,
              sourceType: form.sourceType,
              tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
              sourceLeadId: form.sourceLeadId || null,
              notes: form.notes,
              remarks: form.remarks,
              preferences: form.preferences,
            })}
          >
            Save Customer
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-label text-text-secondary">{label}</label>
      <select className={selectClassName} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-label text-text-secondary">{label}</label>
      <textarea className="min-h-[88px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
