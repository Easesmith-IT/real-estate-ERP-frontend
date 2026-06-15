"use client";

import type { ReactNode } from "react";
import type { Employee, ProjectSummary } from "@/lib/erp-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type EmployeeFormValues = {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  position: string;
  projectId: string;
  teamName: string;
  status: string;
  dateJoined: string;
  emergencyContact: string;
  address: string;
};

export type EmployeeFormErrors = Partial<Record<keyof EmployeeFormValues, string>>;

export const employeeStatusOptions = ["Active", "On Leave", "Probation", "Inactive"];

export const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

export const textareaClassName =
  "min-h-[108px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

export function createEmptyEmployeeFormValues(): EmployeeFormValues {
  return {
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    position: "",
    projectId: "",
    teamName: "",
    status: "Active",
    dateJoined: "",
    emergencyContact: "",
    address: "",
  };
}

export function buildEmployeeFormValues(employee?: Partial<Employee>): EmployeeFormValues {
  return {
    name: employee?.name || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    department: employee?.department || "",
    designation: employee?.designation || "",
    position: employee?.position || employee?.designation || "",
    projectId: employee?.projectId || "",
    teamName: employee?.teamName || "",
    status: employee?.status || "Active",
    dateJoined: employee?.dateJoined ? employee.dateJoined.slice(0, 10) : "",
    emergencyContact: employee?.emergencyContact || "",
    address: employee?.address || "",
  };
}

export function validateEmployeeForm(values: EmployeeFormValues): EmployeeFormErrors {
  const errors: EmployeeFormErrors = {};

  if (!values.name.trim()) errors.name = "Employee name is required.";
  if (!values.email.trim()) errors.email = "Email is required.";
  if (!values.phone.trim()) errors.phone = "Phone is required.";
  if (!values.department.trim()) errors.department = "Department is required.";
  if (!values.designation.trim()) errors.designation = "Designation is required.";
  if (!values.position.trim()) errors.position = "Position is required.";
  if (!values.projectId.trim()) errors.projectId = "Project assignment is required.";
  if (!values.teamName.trim()) errors.teamName = "Team is required.";
  if (!values.dateJoined.trim()) errors.dateJoined = "Joined date is required.";
  if (!values.emergencyContact.trim()) errors.emergencyContact = "Emergency contact is required.";
  if (!values.address.trim()) errors.address = "Address is required.";

  return errors;
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-label text-text-secondary">{label}</span>
      {children}
      {error ? <span className="text-label text-error">{error}</span> : null}
    </label>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border-soft pt-5 first:border-t-0 first:pt-0">
      <div className="space-y-1">
        <h3 className="text-card-title font-secondary text-text-primary">{title}</h3>
        <p className="text-body text-text-secondary">{description}</p>
      </div>
      {children}
    </section>
  );
}

type EmployeeFormProps = {
  mode: "create" | "edit";
  values: EmployeeFormValues;
  errors: EmployeeFormErrors;
  departments: string[];
  teamOptions: string[];
  projects: ProjectSummary[];
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: <K extends keyof EmployeeFormValues>(field: K, value: EmployeeFormValues[K]) => void;
  onSubmit: () => void;
};

export function EmployeeForm({
  mode,
  values,
  errors,
  departments,
  teamOptions,
  projects,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
}: EmployeeFormProps) {
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <FormSection
        title="Basic Information"
        description="Core identity and direct contact information used across workforce operations."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Name" error={errors.name}>
            <Input value={values.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Full employee name" />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <Input type="email" value={values.email} onChange={(event) => onChange("email", event.target.value)} placeholder="name@company.com" />
          </FormField>
          <FormField label="Phone" error={errors.phone}>
            <Input value={values.phone} onChange={(event) => onChange("phone", event.target.value)} placeholder="+91 98..." />
          </FormField>
          <FormField label="Department" error={errors.department}>
            <select value={values.department} onChange={(event) => onChange("department", event.target.value)} className={selectClassName}>
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Employment Information"
        description="Operational role, employment state, and timeline metadata for the workforce record."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Designation" error={errors.designation}>
            <Input value={values.designation} onChange={(event) => onChange("designation", event.target.value)} placeholder="Designation" />
          </FormField>
          <FormField label="Position" error={errors.position}>
            <Input value={values.position} onChange={(event) => onChange("position", event.target.value)} placeholder="Position title" />
          </FormField>
          <FormField label="Status">
            <select value={values.status} onChange={(event) => onChange("status", event.target.value)} className={selectClassName}>
              {employeeStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Date Joined" error={errors.dateJoined}>
            <Input type="date" value={values.dateJoined} onChange={(event) => onChange("dateJoined", event.target.value)} />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Project Assignment"
        description="Place the employee into the correct project, team, and operating unit."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Project" error={errors.projectId}>
            <select value={values.projectId} onChange={(event) => onChange("projectId", event.target.value)} className={selectClassName}>
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Team" error={errors.teamName}>
            <input
              list="employee-team-options"
              className={selectClassName}
              value={values.teamName}
              onChange={(event) => onChange("teamName", event.target.value)}
              placeholder="Assignment team"
            />
            <datalist id="employee-team-options">
              {teamOptions.map((teamName) => (
                <option key={teamName} value={teamName} />
              ))}
            </datalist>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Emergency Contact"
        description="Fallback contact information for field and workforce compliance workflows."
      >
        <FormField label="Emergency Contact" error={errors.emergencyContact}>
          <Input
            value={values.emergencyContact}
            onChange={(event) => onChange("emergencyContact", event.target.value)}
            placeholder="Contact name and phone"
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Additional Information"
        description="Supporting information used on the employee profile and workforce detail views."
      >
        <FormField label="Address" error={errors.address}>
          <textarea
            className={textareaClassName}
            value={values.address}
            onChange={(event) => onChange("address", event.target.value)}
            placeholder="Current address"
          />
        </FormField>
      </FormSection>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border-soft pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {mode === "create" ? "Create Employee" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
