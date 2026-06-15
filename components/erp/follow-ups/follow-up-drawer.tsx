"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, AlertCircle } from "lucide-react";
import { Lead, ProjectSummary, DemoUser } from "@/lib/erp-types";

interface FollowUpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  leads: Lead[];
  projects: ProjectSummary[];
  executives: DemoUser[];
  initialData?: any; // If editing / rescheduling
}

export function FollowUpDrawer({
  isOpen,
  onClose,
  onSubmit,
  leads,
  projects,
  executives,
  initialData,
}: FollowUpDrawerProps) {
  const [form, setForm] = useState({
    leadId: "",
    projectId: "",
    followUpDate: "",
    followUpTime: "10:00",
    priority: "Medium",
    ownerId: "",
    communicationType: "Call",
    outcome: "Interested",
    notes: "",
    reminder: true,
    status: "Scheduled",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      // Split ISO datetime
      let datePart = "";
      let timePart = "10:00";
      if (initialData.followUpAt) {
        const parts = initialData.followUpAt.split("T");
        datePart = parts[0];
        if (parts[1]) {
          timePart = parts[1].slice(0, 5);
        }
      }
      setForm({
        leadId: initialData.id || "",
        projectId: initialData.preferredProjectId || "",
        followUpDate: datePart,
        followUpTime: timePart,
        priority: initialData.budgetMax >= 15000000 ? "High" : "Medium",
        ownerId: initialData.assignedTo || "",
        communicationType: "Call",
        outcome: "Interested",
        notes: initialData.notes || "",
        reminder: true,
        status: new Date(initialData.followUpAt).getTime() < Date.now() ? "Missed" : "Scheduled",
      });
    } else {
      // Default creation state
      const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const datePart = twoDaysFromNow.toISOString().split("T")[0];
      setForm({
        leadId: leads[0]?.id || "",
        projectId: projects[0]?.id || "",
        followUpDate: datePart,
        followUpTime: "11:00",
        priority: "Medium",
        ownerId: executives[0]?.id || "",
        communicationType: "Call",
        outcome: "Interested",
        notes: "",
        reminder: true,
        status: "Scheduled",
      });
    }
    setErrors({});
  }, [initialData, isOpen, leads, projects, executives]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.leadId) newErrors.leadId = "Lead selection is required";
    if (!form.projectId) newErrors.projectId = "Project selection is required";
    if (!form.followUpDate) newErrors.followUpDate = "Follow-up date is required";
    if (!form.followUpTime) newErrors.followUpTime = "Follow-up time is required";
    if (!form.ownerId) newErrors.ownerId = "Assigned owner is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
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
      // Re-compose followUpAt
      const followUpAt = `${form.followUpDate}T${form.followUpTime}:00.000Z`;
      onSubmit({
        ...form,
        followUpAt,
      });
    }
  };

  const inputClass =
    "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] focus-visible:border-accent-primary";
  const selectClass =
    "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] focus-visible:border-accent-primary";
  const textareaClass =
    "min-h-[100px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] focus-visible:border-accent-primary";

  return (
    <Drawer open={isOpen} title={initialData ? "Reschedule / Edit Follow-Up" : "Add Sales Follow-Up"} size="lg" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6 pb-12">
        {/* Section 1: Lead Information */}
        <div className="space-y-4">
          <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-1.5">
            Lead & Project Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary font-semibold">Select Lead</label>
              <select
                value={form.leadId}
                onChange={(e) => handleInputChange("leadId", e.target.value)}
                className={selectClass}
                disabled={Boolean(initialData)}
              >
                <option value="">Choose a lead...</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.fullName} ({l.phone})
                  </option>
                ))}
              </select>
              {errors.leadId && (
                <p className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" /> {errors.leadId}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-label text-text-secondary font-semibold">Project</label>
              <select
                value={form.projectId}
                onChange={(e) => handleInputChange("projectId", e.target.value)}
                className={selectClass}
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.location})
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" /> {errors.projectId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Follow-Up Details */}
        <div className="space-y-4 pt-2">
          <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-1.5">
            Follow-Up Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-label text-text-secondary font-semibold">Follow-Up Date</label>
              <Input
                type="date"
                value={form.followUpDate}
                onChange={(e) => handleInputChange("followUpDate", e.target.value)}
                className={inputClass}
              />
              {errors.followUpDate && (
                <p className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" /> {errors.followUpDate}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-label text-text-secondary font-semibold">Follow-Up Time</label>
              <Input
                type="time"
                value={form.followUpTime}
                onChange={(e) => handleInputChange("followUpTime", e.target.value)}
                className={inputClass}
              />
              {errors.followUpTime && (
                <p className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" /> {errors.followUpTime}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-label text-text-secondary font-semibold">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                className={selectClass}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Next Action & Owner */}
        <div className="space-y-4 pt-2">
          <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-1.5">
            Responsibility & Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary font-semibold">Assigned Executive (Owner)</label>
              <select
                value={form.ownerId}
                onChange={(e) => handleInputChange("ownerId", e.target.value)}
                className={selectClass}
              >
                <option value="">Select owner...</option>
                {executives.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {errors.ownerId && (
                <p className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" /> {errors.ownerId}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-label text-text-secondary font-semibold">Status</label>
              <select
                value={form.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className={selectClass}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Missed">Missed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-label text-text-secondary font-semibold">Communication Type</label>
              <select
                value={form.communicationType}
                onChange={(e) => handleInputChange("communicationType", e.target.value)}
                className={selectClass}
              >
                <option value="Call">Phone Call</option>
                <option value="WhatsApp">WhatsApp Message</option>
                <option value="Email">Email Thread</option>
                <option value="In-Person">In-Person Meeting</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Notes & Outcome */}
        <div className="space-y-4 pt-2">
          <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-1.5">
            Communication Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary font-semibold">Follow-Up Outcome</label>
              <select
                value={form.outcome}
                onChange={(e) => handleInputChange("outcome", e.target.value)}
                className={selectClass}
              >
                <option value="Interested">Interested (Warm)</option>
                <option value="Scheduled Visit">Site Visit Scheduled</option>
                <option value="Negotiation">Negotiation / Price Offer</option>
                <option value="No Response">No Response / Silent</option>
                <option value="Dropped">Not Interested (Dropped)</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-label text-text-secondary font-semibold">Notes Preview</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Details of the sales conversation, special pricing requests, or reschedule reason..."
                className={textareaClass}
              />
            </div>
          </div>
        </div>

        {/* Section 5: Reminder Settings */}
        <div className="space-y-4 pt-2">
          <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-1.5">
            Reminder Settings
          </h3>
          <div className="flex items-center gap-3 bg-surface-secondary p-4 rounded-[var(--radius-input)] border border-border-soft">
            <input
              type="checkbox"
              id="reminder-setting"
              checked={form.reminder}
              onChange={(e) => handleInputChange("reminder", e.target.checked)}
              className="h-5 w-5 rounded border-border-strong text-accent-primary focus:ring-accent-primary"
            />
            <label htmlFor="reminder-setting" className="text-body text-text-primary font-semibold select-none cursor-pointer">
              Send automated alerts to Owner and Coordinator (Email, SMS, WhatsApp) 2 hours prior to schedule.
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border-soft">
          <Button type="button" variant="outline" className="h-11 border-border-strong px-6" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="h-11 px-8 text-white font-semibold gap-1.5">
            <Save className="h-4.5 w-4.5" />
            <span>Save Action</span>
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
