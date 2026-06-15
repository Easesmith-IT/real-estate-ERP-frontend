"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, AlertCircle } from "lucide-react";
import { ProjectSummary, DemoUser } from "@/lib/erp-types";

interface ProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  managers: DemoUser[];
  isLoading?: boolean;
}

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all";

export function ProjectDrawer({
  isOpen,
  onClose,
  onSubmit,
  managers,
  isLoading = false,
}: ProjectDrawerProps) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "Residential",
    location: "",
    managerId: "",
    stage: "Execution Planning",
    targetRevenue: "",
    launchDate: "",
    expectedCompletion: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: "",
        code: "",
        type: "Residential",
        location: "",
        managerId: managers[0]?.id || "",
        stage: "Execution Planning",
        targetRevenue: "",
        launchDate: new Date().toISOString().split("T")[0],
        expectedCompletion: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        notes: "",
      });
      setErrors({});
    }
  }, [isOpen, managers]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Project name is required";
    if (!form.code.trim()) newErrors.code = "Project code is required";
    if (form.code.length < 2) newErrors.code = "Code must be at least 2 characters";
    if (!form.location.trim()) newErrors.location = "Location is required";
    if (!form.managerId) newErrors.managerId = "Project manager is required";
    if (!form.targetRevenue) {
      newErrors.targetRevenue = "Target revenue is required";
    } else if (isNaN(Number(form.targetRevenue)) || Number(form.targetRevenue) <= 0) {
      newErrors.targetRevenue = "Target revenue must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      targetRevenue: Number(form.targetRevenue),
    });
  };

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <Drawer open={isOpen} title="Add New Project" size="xl" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6 pb-8">
        {Object.keys(errors).length > 0 && (
          <div className="flex items-start gap-2.5 rounded-[var(--radius-input)] border border-error-soft bg-error-soft/10 p-4 text-text-error">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-body font-semibold">Please correct the errors below</p>
              <ul className="list-disc pl-4 text-label space-y-0.5">
                {Object.values(errors).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Section 1: Project Information */}
        <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20">
          <h3 className="text-body font-semibold text-text-primary border-b border-border-soft pb-2">
            Project Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Project Name *</label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Skyline Towers"
                className={errors.name ? "border-error focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" : ""}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Project Code *</label>
              <Input
                value={form.code}
                onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                placeholder="e.g. SKYLINE"
                className={errors.code ? "border-error focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" : ""}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Project Type</label>
              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                className={selectClassName}
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Mixed-Use">Mixed-Use</option>
                <option value="Luxury Villas">Luxury Villas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Location & Ownership */}
        <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20">
          <h3 className="text-body font-semibold text-text-primary border-b border-border-soft pb-2">
            Location & Ownership
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Location *</label>
              <Input
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="e.g. Gurugram Sector 79"
                className={errors.location ? "border-error focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" : ""}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Project Manager *</label>
              <select
                value={form.managerId}
                onChange={(e) => updateField("managerId", e.target.value)}
                className={selectClassName}
              >
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.designation || manager.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Stage Configuration */}
        <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20">
          <h3 className="text-body font-semibold text-text-primary border-b border-border-soft pb-2">
            Stage Configuration
          </h3>
          <div className="space-y-1.5">
            <label className="text-label text-text-secondary font-medium">Lifecycle Stage</label>
            <select
              value={form.stage}
              onChange={(e) => updateField("stage", e.target.value)}
              className={selectClassName}
            >
              <option value="Execution Planning">Execution Planning</option>
              <option value="Sales Launch">Sales Launch</option>
              <option value="Inventory Release">Inventory Release</option>
              <option value="Possession Linked Sales">Possession Linked Sales</option>
            </select>
          </div>
        </div>

        {/* Section 4: Financial Overview */}
        <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20">
          <h3 className="text-body font-semibold text-text-primary border-b border-border-soft pb-2">
            Financial Overview
          </h3>
          <div className="space-y-1.5">
            <label className="text-label text-text-secondary font-medium">Target Revenue (INR) *</label>
            <Input
              type="number"
              value={form.targetRevenue}
              onChange={(e) => updateField("targetRevenue", e.target.value)}
              placeholder="e.g. 500000000 (₹50 Cr)"
              className={errors.targetRevenue ? "border-error focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" : ""}
            />
          </div>
        </div>

        {/* Section 5: Timeline & Details */}
        <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20">
          <h3 className="text-body font-semibold text-text-primary border-b border-border-soft pb-2">
            Timeline Information & Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Launch Date</label>
              <Input
                type="date"
                value={form.launchDate}
                onChange={(e) => updateField("launchDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-label text-text-secondary font-medium">Expected Completion</label>
              <Input
                type="date"
                value={form.expectedCompletion}
                onChange={(e) => updateField("expectedCompletion", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5 mt-4">
            <label className="text-label text-text-secondary font-medium">Notes & Briefing</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Provide strategic notes, design goals or specifications..."
              rows={4}
              className="w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all resize-none"
            />
          </div>
        </div>

        {/* Drawer Action Controls */}
        <div className="flex justify-end gap-3 border-t border-border-soft pt-5">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} className="text-white gap-1.5 font-semibold">
            <Save className="h-4.5 w-4.5" />
            <span>Create Project</span>
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
