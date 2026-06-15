"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Lead, ProjectSummary, Unit } from "@/lib/erp-types";
import { formatPortfolioValue } from "./customer-utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: Record<string, unknown>) => void;
  loading?: boolean;
  leads: Lead[];
  projects: ProjectSummary[];
  units: Unit[];
  paymentPlanTypes: string[];
};

type BookingFormState = {
  leadId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  projectId: string;
  unitId: string;
  paymentPlanType: string;
};

type BookingFormErrors = Partial<Record<keyof BookingFormState, string>>;

const planFallback = ["Construction Linked", "EMI", "Down Payment"];
const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

export function CustomerBookingDrawer({ open, onClose, onCreate, loading = false, leads, projects, units, paymentPlanTypes }: Props) {
  const plans = paymentPlanTypes.length > 0 ? paymentPlanTypes : planFallback;
  const [form, setForm] = useState<BookingFormState>({
    leadId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    projectId: "",
    unitId: "",
    paymentPlanType: plans[0],
  });
  const [errors, setErrors] = useState<BookingFormErrors>({});

  const selectedLead = useMemo(() => leads.find((lead) => lead.id === form.leadId) || null, [leads, form.leadId]);
  const selectedProject = useMemo(() => projects.find((project) => project.id === form.projectId) || null, [projects, form.projectId]);
  const projectUnits = useMemo(
    () => units.filter((unit) => !form.projectId || unit.projectId === form.projectId).sort((left, right) => left.status.localeCompare(right.status) || left.code.localeCompare(right.code)),
    [form.projectId, units],
  );
  const selectedUnit = useMemo(() => projectUnits.find((unit) => unit.id === form.unitId) || units.find((unit) => unit.id === form.unitId) || null, [projectUnits, units, form.unitId]);

  useEffect(() => {
    if (!open) return;

    const lead = leads[0] || null;
    const projectId = lead?.preferredProjectId || projects[0]?.id || "";
    const nextUnits = units.filter((unit) => !projectId || unit.projectId === projectId);
    const nextUnit = nextUnits.find((unit) => unit.status === "available") || nextUnits[0] || null;

    setForm({
      leadId: lead?.id || "",
      customerName: lead?.fullName || "",
      customerPhone: lead?.phone || "",
      customerEmail: lead?.email || "",
      projectId,
      unitId: nextUnit?.id || "",
      paymentPlanType: plans[0],
    });
    setErrors({});
  }, [open, leads, projects, units, plans]);

  useEffect(() => {
    if (!selectedLead) return;

    setForm((current) => ({
      ...current,
      customerName: current.customerName || selectedLead.fullName,
      customerPhone: current.customerPhone || selectedLead.phone,
      customerEmail: current.customerEmail || selectedLead.email || "",
      projectId: current.projectId || selectedLead.preferredProjectId || projects[0]?.id || "",
    }));
  }, [projects, selectedLead]);

  useEffect(() => {
    if (!form.projectId) return;

    const nextUnit = units.find((unit) => unit.projectId === form.projectId && unit.id === form.unitId) || units.find((unit) => unit.projectId === form.projectId && unit.status === "available") || units.find((unit) => unit.projectId === form.projectId) || null;

    if (nextUnit && nextUnit.id !== form.unitId) {
      setForm((current) => ({ ...current, unitId: nextUnit.id }));
    }
  }, [form.projectId, form.unitId, units]);

  const amount = selectedUnit?.finalPrice || 0;
  const firstDueDate = useMemo(() => estimateFirstDueDate(form.paymentPlanType), [form.paymentPlanType]);
  const outstandingProjection = useMemo(() => estimateOutstandingProjection(amount, form.paymentPlanType), [amount, form.paymentPlanType]);

  const validate = () => {
    const nextErrors: BookingFormErrors = {};
    if (!form.leadId) nextErrors.leadId = "Select a lead to convert.";
    if (!form.projectId) nextErrors.projectId = "Choose a project.";
    if (!form.unitId) nextErrors.unitId = "Choose a unit.";
    if (!form.paymentPlanType) nextErrors.paymentPlanType = "Choose a payment plan.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;

    onCreate({
      leadId: form.leadId,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail,
      unitId: form.unitId,
      paymentPlanType: form.paymentPlanType,
    });
  };

  return (
    <Drawer open={open} title="New Booking" side="right" size="xl" onClose={onClose}>
      <div className="space-y-6 pb-28">
        <div className="rounded-[var(--radius-card)] border border-border-soft bg-linear-to-br from-accent-primary/8 via-surface to-surface-secondary p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge tone="info">Right Drawer · XL</Badge>
              <p className="text-section-title font-secondary text-text-primary">Booking conversion flow</p>
              <p className="max-w-2xl text-body text-text-secondary">Convert a lead into a live booking, pick the exact unit, and review payment exposure before committing.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-right sm:min-w-[260px]">
              <SummaryChip label="Project" value={selectedProject?.name || "Select project"} />
              <SummaryChip label="Unit" value={selectedUnit?.code || "Select unit"} />
              <SummaryChip label="Amount" value={amount ? formatPortfolioValue(amount) : "-"} />
              <SummaryChip label="Plan" value={form.paymentPlanType} />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Lead" error={errors.leadId} className="md:col-span-2">
              <select className={selectClassName} value={form.leadId} onChange={(event) => setForm((current) => ({ ...current, leadId: event.target.value }))}>
                <option value="">Select lead to convert</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.fullName} · {lead.projectName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Customer Name">
              <Input value={form.customerName} onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} />
            </Field>
            <Field label="Phone">
              <Input value={form.customerPhone} onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))} />
            </Field>
            <Field label="Email" className="md:col-span-2">
              <Input value={form.customerEmail} onChange={(event) => setForm((current) => ({ ...current, customerEmail: event.target.value }))} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4 md:col-span-2">
              {selectedLead ? (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-card-title text-text-primary">{selectedLead.fullName}</p>
                    <p className="text-body text-text-secondary">{selectedLead.phone} · {selectedLead.email || "No email"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="info">{selectedLead.stage}</Badge>
                    <Badge tone="neutral">{selectedLead.source}</Badge>
                    <Badge tone="success">{selectedLead.budgetLabel}</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-body text-text-secondary">Select a lead to unlock conversion details.</p>
              )}
            </div>
            <Field label="Preferred Project" error={errors.projectId}>
              <select className={selectClassName} value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))}>
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} · {project.stage}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Lifecycle Note">
              <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-secondary">
                {selectedLead?.preferredConfiguration || "Configuration preference will be captured from the lead."}
              </div>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unit Selection</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Unit" error={errors.unitId} className="md:col-span-2">
              <select className={selectClassName} value={form.unitId} onChange={(event) => setForm((current) => ({ ...current, unitId: event.target.value }))}>
                <option value="">Select unit</option>
                {projectUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} · {unit.configuration} · {formatPortfolioValue(unit.finalPrice)} · {unit.status}
                  </option>
                ))}
              </select>
            </Field>
            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4 md:col-span-2">
              {selectedUnit ? (
                <div className="grid grid-cols-2 gap-3 text-body text-text-secondary sm:grid-cols-4">
                  <InfoCell label="Tower" value={selectedUnit.towerName} />
                  <InfoCell label="Floor" value={selectedUnit.floorLabel} />
                  <InfoCell label="Configuration" value={selectedUnit.configuration} />
                  <InfoCell label="Status" value={selectedUnit.status} />
                </div>
              ) : (
                <p className="text-body text-text-secondary">Pick a project to see available inventory.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Plan</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Plan" error={errors.paymentPlanType}>
              <select className={selectClassName} value={form.paymentPlanType} onChange={(event) => setForm((current) => ({ ...current, paymentPlanType: event.target.value }))}>
                {plans.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </Field>
            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
              <p className="text-label uppercase tracking-[0.12em] text-text-muted">Plan Guidance</p>
              <p className="mt-2 text-body text-text-secondary">The booking summary updates live as the unit and payment plan change.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-3 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
                <SummaryRow label="Project" value={selectedProject?.name || "-"} />
                <SummaryRow label="Unit" value={selectedUnit?.code || "-"} />
                <SummaryRow label="Amount" value={amount ? formatPortfolioValue(amount) : "-"} />
                <SummaryRow label="Payment Plan" value={form.paymentPlanType} />
                <SummaryRow label="First Due Date" value={firstDueDate} />
                <SummaryRow label="Outstanding Projection" value={amount ? formatPortfolioValue(outstandingProjection) : "-"} highlight />
              </div>
              <div className="space-y-3 rounded-[var(--radius-card)] border border-border-soft bg-linear-to-br from-accent-primary/10 to-surface p-4">
                <p className="text-card-title text-text-primary">Live execution preview</p>
                <p className="text-body text-text-secondary">The selected unit will be locked when the booking is created. Customer portfolio metrics update immediately after confirmation.</p>
                <div className="grid grid-cols-2 gap-3">
                  <SummaryChip label="Lead" value={selectedLead?.fullName || "-"} />
                  <SummaryChip label="Plan" value={form.paymentPlanType} />
                  <SummaryChip label="Due" value={firstDueDate} />
                  <SummaryChip label="Projection" value={amount ? formatPortfolioValue(outstandingProjection) : "-"} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <ChecklistItem title="Customer info verified" description="Lead identity and contact details are ready for booking." />
              <ChecklistItem title="Unit availability confirmed" description="The drawer reflects the latest property inventory." />
              <ChecklistItem title="Payment plan selected" description="Revenue and collection forecasts have been updated." />
            </div>
            <p className="text-label text-text-muted">After creation, the unit status, customer relationship record, and booking register will refresh automatically.</p>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 border-t border-border-soft bg-surface/95 px-1 pt-4 backdrop-blur">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button loading={loading} onClick={handleCreate}>
              Create Booking
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-2">
      <p className="text-label uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className="mt-1 text-body font-medium text-text-primary line-clamp-1">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-soft pb-2 last:border-b-0 last:pb-0">
      <p className="text-label uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className={`text-body font-medium ${highlight ? "text-accent-primary" : "text-text-primary"}`}>{value}</p>
    </div>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <label className="text-label text-text-secondary">{label}</label>
      {children}
      {error ? <p className="text-label text-error">{error}</p> : null}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-label uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className="mt-1 text-body font-medium text-text-primary">{value}</p>
    </div>
  );
}

function ChecklistItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
      <p className="text-body font-medium text-text-primary">{title}</p>
      <p className="mt-1 text-body text-text-secondary">{description}</p>
    </div>
  );
}

function estimateFirstDueDate(paymentPlanType: string) {
  const offsetDays = paymentPlanType === "Down Payment" ? 15 : paymentPlanType === "EMI" ? 30 : 45;
  const due = new Date();
  due.setDate(due.getDate() + offsetDays);
  return due.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function estimateOutstandingProjection(amount: number, paymentPlanType: string) {
  const factor = paymentPlanType === "Down Payment" ? 0.25 : paymentPlanType === "EMI" ? 0.45 : 0.65;
  return Math.round(amount * factor);
}
