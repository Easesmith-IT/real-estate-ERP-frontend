"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Project {
  id: string;
  name: string;
}

interface Executive {
  id: string;
  name: string;
}

interface Broker {
  id: string;
  name: string;
}

interface LeadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  projects: Project[];
  executives: Executive[];
  brokers: Broker[];
  initialData?: any; // If editing
}

export function LeadDrawer({
  isOpen,
  onClose,
  onSubmit,
  projects,
  executives,
  brokers,
  initialData,
}: LeadDrawerProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    source: "Website",
    preferredProjectId: "",
    preferredConfiguration: "3BHK",
    budgetMin: "",
    budgetMax: "",
    followUpAt: "",
    assignedTo: "",
    stage: "New",
    brokerId: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        source: initialData.source || "Website",
        preferredProjectId: initialData.preferredProjectId || "",
        preferredConfiguration: initialData.preferredConfiguration || "3BHK",
        budgetMin: initialData.budgetMin ? String(initialData.budgetMin) : "",
        budgetMax: initialData.budgetMax ? String(initialData.budgetMax) : "",
        followUpAt: initialData.followUpAt ? initialData.followUpAt.split("T")[0] : "",
        assignedTo: initialData.assignedTo || "",
        stage: initialData.stage || "New",
        brokerId: initialData.brokerId || "",
        notes: initialData.notes || "",
      });
    } else {
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        source: "Website",
        preferredProjectId: "",
        preferredConfiguration: "3BHK",
        budgetMin: "",
        budgetMax: "",
        followUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        assignedTo: "",
        stage: "New",
        brokerId: "",
        notes: "",
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen || !mounted) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.preferredProjectId) newErrors.preferredProjectId = "Project interest is required";
    if (!form.budgetMin) newErrors.budgetMin = "Min budget is required";
    if (!form.budgetMax) newErrors.budgetMax = "Max budget is required";
    if (Number(form.budgetMin) > Number(form.budgetMax)) {
      newErrors.budgetMax = "Max budget must be greater than or equal to min budget";
    }
    if (!form.assignedTo) newErrors.assignedTo = "Executive assignment is required";
    if (!form.followUpAt) newErrors.followUpAt = "Follow-up schedule is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  const inputClass =
    "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] focus-visible:border-accent-primary";
  const selectClass =
    "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] focus-visible:border-accent-primary";
  const textareaClass =
    "min-h-[96px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] focus-visible:border-accent-primary";

  const sources = [
    "Website",
    "Google Ads",
    "Referral",
    "Broker Referral",
    "Walk-in",
    "WhatsApp",
    "Meta Campaign",
    "Channel Partner",
  ];

  const stages = [
    "New",
    "Contacted",
    "Interested",
    "Site Visit Scheduled",
    "Negotiation",
    "Booking",
    "Closed Won",
    "Closed Lost",
  ];

  const configurations = ["1BHK", "2BHK", "2BHK + Study", "3BHK", "3BHK + Deck", "4BHK", "Penthouse"];

  return createPortal(
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-overlay z-[var(--z-overlay)] backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="fixed top-0 right-0 h-full w-[480px] bg-surface border-l border-border-soft shadow-enterprise z-[var(--z-modal)] flex flex-col justify-between animate-page-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-soft flex items-center justify-between">
          <div>
            <h2 className="text-section-title font-secondary text-text-primary">
              {initialData ? "Edit Lead Profile" : "Create New Lead"}
            </h2>
            <p className="text-label text-text-muted mt-1">
              {initialData ? "Modify details of the active lead opportunity." : "Acquire a new opportunity into the workspace."}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-full text-text-muted hover:bg-surface-secondary"
            onClick={onClose}
          >
            <X className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Form Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Section 1: Basic & Contact Info */}
          <div className="space-y-3">
            <h3 className="text-card-title text-text-primary font-semibold border-b border-border-soft pb-1">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary font-medium">First Name *</label>
                <Input
                  className={inputClass}
                  value={form.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="e.g. Advik"
                />
                {errors.firstName && (
                  <p className="text-label text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.firstName}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary font-medium">Last Name *</label>
                <Input
                  className={inputClass}
                  value={form.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="e.g. Bansal"
                />
                {errors.lastName && (
                  <p className="text-label text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary font-medium">Phone Number *</label>
                <Input
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="e.g. +91 98..."
                />
                {errors.phone && (
                  <p className="text-label text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.phone}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary font-medium">Email Address</label>
                <Input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="e.g. contact@nimbuserp.local"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary font-medium">Lead Source *</label>
                <select
                  className={selectClass}
                  value={form.source}
                  onChange={(e) => handleInputChange("source", e.target.value)}
                >
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {form.source === "Broker Referral" && (
                <div className="space-y-1">
                  <label className="text-label text-text-secondary font-medium">Select Broker</label>
                  <select
                    className={selectClass}
                    value={form.brokerId}
                    onChange={(e) => handleInputChange("brokerId", e.target.value)}
                  >
                    <option value="">Choose Broker...</option>
                    {brokers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Property & Requirements */}
          <div className="space-y-3">
            <h3 className="text-card-title text-text-primary font-semibold border-b border-border-soft pb-1">
              Property Interest & Requirements
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary font-medium">Project Interest *</label>
                <select
                  className={selectClass}
                  value={form.preferredProjectId}
                  onChange={(e) => handleInputChange("preferredProjectId", e.target.value)}
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.preferredProjectId && (
                  <p className="text-label text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.preferredProjectId}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary font-medium">Preferred Layout</label>
                <select
                  className={selectClass}
                  value={form.preferredConfiguration}
                  onChange={(e) => handleInputChange("preferredConfiguration", e.target.value)}
                >
                  {configurations.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary font-medium">Min Budget (INR) *</label>
                <Input
                  type="number"
                  className={inputClass}
                  value={form.budgetMin}
                  onChange={(e) => handleInputChange("budgetMin", e.target.value)}
                  placeholder="e.g. 9000000"
                />
                {errors.budgetMin && (
                  <p className="text-label text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.budgetMin}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary font-medium">Max Budget (INR) *</label>
                <Input
                  type="number"
                  className={inputClass}
                  value={form.budgetMax}
                  onChange={(e) => handleInputChange("budgetMax", e.target.value)}
                  placeholder="e.g. 12000000"
                />
                {errors.budgetMax && (
                  <p className="text-label text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.budgetMax}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Scheduling & Executive Assignment */}
          <div className="space-y-3">
            <h3 className="text-card-title text-text-primary font-semibold border-b border-border-soft pb-1">
              Assignment & Scheduling
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary font-medium">Assigned Executive *</label>
                <select
                  className={selectClass}
                  value={form.assignedTo}
                  onChange={(e) => handleInputChange("assignedTo", e.target.value)}
                >
                  <option value="">Assign To...</option>
                  {executives.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                {errors.assignedTo && (
                  <p className="text-label text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.assignedTo}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary font-medium">Follow-Up Date *</label>
                <Input
                  type="date"
                  className={inputClass}
                  value={form.followUpAt}
                  onChange={(e) => handleInputChange("followUpAt", e.target.value)}
                />
                {errors.followUpAt && (
                  <p className="text-label text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.followUpAt}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary font-medium">Sales Stage</label>
                <select
                  className={selectClass}
                  value={form.stage}
                  onChange={(e) => handleInputChange("stage", e.target.value)}
                >
                  {stages.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-label text-text-secondary font-medium">Remarks / Requirements</label>
              <textarea
                className={textareaClass}
                value={form.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Mention unit numbers, client timeline, specific layout details, view interest etc."
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-soft bg-surface-secondary flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="text-label h-10 px-4 border-border-strong font-medium text-text-primary hover:bg-surface-secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="h-10 px-5 font-semibold"
            onClick={handleSubmit}
          >
            <span className="text-label flex items-center gap-1.5 text-white">
              <Save className="h-4 w-4" />
              {initialData ? "Save Changes" : "Create Lead"}
            </span>
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}
