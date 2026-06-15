"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardPlus } from "lucide-react";

type Employee = {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  department: string;
};

type AttendancePayload = {
  employeeId: string;
  projectId: string;
  shift: string;
  status: string;
  checkIn: string;
  checkOut: string | null;
  location: string;
  remarks: string;
  supervisorNotes: string;
};

type AttendanceDrawerProps = {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  onSubmit: (data: AttendancePayload) => Promise<void>;
  isSubmitting: boolean;
};

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";
const textareaClassName =
  "min-h-[72px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-2.5 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

export function AttendanceDrawer({ open, onClose, employees, onSubmit, isSubmitting }: AttendanceDrawerProps) {
  const [form, setForm] = useState(() => {
    const first = employees[0];
    return {
      employeeId: first?.id || "",
      projectId: first?.projectId || "",
      department: first?.department || "Projects",
      shift: "Day",
      status: "Present",
      checkIn: new Date().toISOString().slice(0, 16),
      checkOut: "",
      location: "Main Gate 1",
      remarks: "",
      supervisorNotes: "",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});



  const handleEmployeeChange = (empId: string) => {
    const employee = employees.find((e) => e.id === empId);
    if (employee) {
      setForm((prev) => ({
        ...prev,
        employeeId: empId,
        projectId: employee.projectId,
        department: employee.department || "Projects",
      }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.employeeId) newErrors.employeeId = "Employee selection is required";
    if (!form.projectId) newErrors.projectId = "Project selection is required";
    if (!form.checkIn) newErrors.checkIn = "Check-in time is required";
    
    if (form.checkOut && new Date(form.checkOut) < new Date(form.checkIn)) {
      newErrors.checkOut = "Check-out time cannot be before check-in time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit({
        employeeId: form.employeeId,
        projectId: form.projectId,
        shift: form.shift,
        status: form.status,
        checkIn: new Date(form.checkIn).toISOString(),
        checkOut: form.checkOut ? new Date(form.checkOut).toISOString() : null,
        location: form.location,
        remarks: form.remarks,
        supervisorNotes: form.supervisorNotes,
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Drawer open={open} title="Add New Attendance" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-6 pb-8">
        
        {/* Section 1: Employee Information */}
        <div className="space-y-4">
          <h3 className="text-body font-semibold text-text-primary border-b border-border-soft pb-1">
            Section 1: Employee Information
          </h3>
          <div className="space-y-1">
            <label className="text-label text-text-secondary">Employee</label>
            <select
              value={form.employeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className={selectClassName}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.id})
                </option>
              ))}
            </select>
            {errors.employeeId && <p className="text-xs text-red font-medium mt-1">{errors.employeeId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Department</label>
              <Input value={form.department} disabled className="opacity-70" />
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Assigned Project</label>
              <Input
                value={employees.find((e) => e.id === form.employeeId)?.projectName || "Unassigned"}
                disabled
                className="opacity-70"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Attendance Details */}
        <div className="space-y-4">
          <h3 className="text-body font-semibold text-text-primary border-b border-border-soft pb-1">
            Section 2: Attendance Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Shift</label>
              <select
                value={form.shift}
                onChange={(e) => setForm((prev) => ({ ...prev, shift: e.target.value }))}
                className={selectClassName}
              >
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className={selectClassName}
              >
                <option value="Present">Present</option>
                <option value="Late">Late Check-in</option>
                <option value="Absent">Absent</option>
                <option value="Half Day">Half Day</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Check-in Date & Time</label>
              <Input
                type="datetime-local"
                value={form.checkIn}
                onChange={(e) => setForm((prev) => ({ ...prev, checkIn: e.target.value }))}
              />
              {errors.checkIn && <p className="text-xs text-red font-medium mt-1">{errors.checkIn}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Check-out Date & Time (Optional)</label>
              <Input
                type="datetime-local"
                value={form.checkOut}
                disabled={form.status === "Absent"}
                onChange={(e) => setForm((prev) => ({ ...prev, checkOut: e.target.value }))}
              />
              {errors.checkOut && <p className="text-xs text-red font-medium mt-1">{errors.checkOut}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Additional Information */}
        <div className="space-y-4">
          <h3 className="text-body font-semibold text-text-primary border-b border-border-soft pb-1">
            Section 3: Additional Information
          </h3>

          <div className="space-y-1">
            <label className="text-label text-text-secondary">Location / Gate</label>
            <Input
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Sector 4 Gate A"
            />
          </div>

          <div className="space-y-1">
            <label className="text-label text-text-secondary">Remarks / Employee Notes</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
              className={textareaClassName}
              placeholder="Add details regarding late check-in, leaves, etc."
            />
          </div>

          <div className="space-y-1">
            <label className="text-label text-text-secondary">Supervisor Notes</label>
            <textarea
              value={form.supervisorNotes}
              onChange={(e) => setForm((prev) => ({ ...prev, supervisorNotes: e.target.value }))}
              className={textareaClassName}
              placeholder="Add authorization details or shift verification notes"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-soft">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <ClipboardPlus className="mr-1.5 h-4 w-4" />
            Submit Attendance
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
