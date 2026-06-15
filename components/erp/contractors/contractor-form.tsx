"use client";

import type { ReactNode } from "react";
import type { Contractor, ProjectSummary } from "@/lib/erp-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ContractorFormValues = {
  name: string;
  trade: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  pan: string;
  address: string;
  contractStart: string;
  contractEnd: string;
  rateType: string;
  rateValue: string;
  workforce: string;
  status: string;
  complianceStatus: string;
  projectId: string;
};

export type ContractorFormErrors = Partial<Record<keyof ContractorFormValues, string>>;

export const tradeOptions = ["Civil", "Electrical", "MEP", "Landscape", "Finishing", "Infrastructure", "HVAC", "Waterproofing"];
export const contractorStatusOptions = ["Engaged", "Mobilizing", "Closed"];
export const rateTypeOptions = ["Daily", "Hourly", "Per Sq Ft", "Lump Sum"];
export const complianceStatusOptions = ["Compliant", "Pending Review", "Expired Documents"];

export const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

export const textareaClassName =
  "min-h-[96px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

export function createEmptyContractorFormValues(): ContractorFormValues {
  return {
    name: "",
    trade: "Civil",
    contactPerson: "",
    phone: "",
    email: "",
    gstin: "",
    pan: "",
    address: "",
    contractStart: "",
    contractEnd: "",
    rateType: "Daily",
    rateValue: "0",
    workforce: "0",
    status: "Engaged",
    complianceStatus: "Compliant",
    projectId: "",
  };
}

export function buildContractorFormValues(contractor?: Partial<Contractor>): ContractorFormValues {
  return {
    name: contractor?.name || "",
    trade: contractor?.trade || "Civil",
    contactPerson: contractor?.contactPerson || "",
    phone: contractor?.phone || "",
    email: contractor?.email || "",
    gstin: contractor?.gstin || "",
    pan: contractor?.pan || "",
    address: contractor?.address || "",
    contractStart: contractor?.contractStart ? contractor.contractStart.slice(0, 10) : "",
    contractEnd: contractor?.contractEnd ? contractor.contractEnd.slice(0, 10) : "",
    rateType: contractor?.rateType || "Daily",
    rateValue: contractor?.rateValue !== undefined ? String(contractor.rateValue) : "0",
    workforce: contractor?.workforce !== undefined ? String(contractor.workforce) : "0",
    status: contractor?.status || "Engaged",
    complianceStatus: contractor?.complianceStatus || "Compliant",
    projectId: contractor?.projectId || "",
  };
}

export function validateContractorForm(values: ContractorFormValues): ContractorFormErrors {
  const errors: ContractorFormErrors = {};

  if (!values.name.trim()) errors.name = "Company name is required.";
  if (!values.trade.trim()) errors.trade = "Trade category is required.";
  if (!values.contactPerson.trim()) errors.contactPerson = "Contact person is required.";
  if (!values.phone.trim()) errors.phone = "Phone number is required.";
  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = "Invalid email format.";
  }
  if (!values.gstin.trim()) {
    errors.gstin = "GSTIN is required.";
  } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(values.gstin.toUpperCase())) {
    errors.gstin = "Invalid GSTIN format (e.g. 07AAAAA1111A1Z0).";
  }
  if (!values.pan.trim()) {
    errors.pan = "PAN is required.";
  } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(values.pan.toUpperCase())) {
    errors.pan = "Invalid PAN format (e.g. ABCDE1234F).";
  }
  if (!values.address.trim()) errors.address = "Address is required.";
  if (!values.contractStart.trim()) errors.contractStart = "Contract start date is required.";
  if (!values.contractEnd.trim()) errors.contractEnd = "Contract end date is required.";
  if (!values.projectId.trim()) errors.projectId = "Project assignment is required.";
  if (!values.rateValue.trim() || isNaN(Number(values.rateValue)) || Number(values.rateValue) < 0) {
    errors.rateValue = "Rate value must be a non-negative number.";
  }
  if (!values.workforce.trim() || isNaN(Number(values.workforce)) || Number(values.workforce) < 0) {
    errors.workforce = "Workforce count must be a non-negative number.";
  }

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
    <div className="space-y-1.5">
      <span className="text-label font-medium text-text-secondary">{label}</span>
      {children}
      {error ? <span className="text-label text-error block mt-0.5">{error}</span> : null}
    </div>
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
      <div className="space-y-4">{children}</div>
    </section>
  );
}

type ContractorFormProps = {
  mode: "create" | "edit";
  values: ContractorFormValues;
  errors: ContractorFormErrors;
  projects: Array<{ id: string; name: string }>;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: <K extends keyof ContractorFormValues>(field: K, value: ContractorFormValues[K]) => void;
  onSubmit: () => void;
};

export function ContractorForm({
  mode,
  values,
  errors,
  projects,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
}: ContractorFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      {/* Section 1: Company Information */}
      <FormSection title="1. Company Information" description="Basic identification details, trade specialization, and status.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Company Name *" error={errors.name}>
            <Input
              value={values.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="e.g. ABC Infrastructure"
            />
          </FormField>

          <FormField label="Trade Category *" error={errors.trade}>
            <select
              value={values.trade}
              onChange={(e) => onChange("trade", e.target.value)}
              className={selectClassName}
            >
              {tradeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="GSTIN *" error={errors.gstin}>
            <Input
              value={values.gstin}
              onChange={(e) => onChange("gstin", e.target.value)}
              placeholder="e.g. 07AAAAA1111A1Z0"
            />
          </FormField>

          <FormField label="PAN *" error={errors.pan}>
            <Input
              value={values.pan}
              onChange={(e) => onChange("pan", e.target.value)}
              placeholder="e.g. ABCDE1234F"
            />
          </FormField>
        </div>

        <FormField label="Company Address *" error={errors.address}>
          <textarea
            value={values.address}
            onChange={(e) => onChange("address", e.target.value)}
            className={textareaClassName}
            placeholder="e.g. Plot 42, Industrial Area, Sector 3"
          />
        </FormField>
      </FormSection>

      {/* Section 2: Primary Contact */}
      <FormSection title="2. Primary Contact" description="Information about the primary representative for operational correspondence.">
        <FormField label="Contact Person Name *" error={errors.contactPerson}>
          <Input
            value={values.contactPerson}
            onChange={(e) => onChange("contactPerson", e.target.value)}
            placeholder="e.g. Amit Sharma"
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Phone Number *" error={errors.phone}>
            <Input
              value={values.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
          </FormField>

          <FormField label="Email Address *" error={errors.email}>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="e.g. contact@company.com"
            />
          </FormField>
        </div>
      </FormSection>

      {/* Section 3: Contract Information */}
      <FormSection title="3. Contract Information" description="Billing rate settings and active service duration.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Contract Start Date *" error={errors.contractStart}>
            <Input
              type="date"
              value={values.contractStart}
              onChange={(e) => onChange("contractStart", e.target.value)}
            />
          </FormField>

          <FormField label="Contract End Date *" error={errors.contractEnd}>
            <Input
              type="date"
              value={values.contractEnd}
              onChange={(e) => onChange("contractEnd", e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Rate Type *" error={errors.rateType}>
            <select
              value={values.rateType}
              onChange={(e) => onChange("rateType", e.target.value)}
              className={selectClassName}
            >
              {rateTypeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Rate Value (₹) *" error={errors.rateValue}>
            <Input
              type="number"
              min="0"
              value={values.rateValue}
              onChange={(e) => onChange("rateValue", e.target.value)}
              placeholder="0.00"
            />
          </FormField>
        </div>
      </FormSection>

      {/* Section 4: Project Assignment */}
      <FormSection title="4. Project Assignment" description="Mobilization target and active workforce deployment strength.">
        <FormField label="Assigned Project Site *" error={errors.projectId}>
          <select
            value={values.projectId}
            onChange={(e) => onChange("projectId", e.target.value)}
            className={selectClassName}
          >
            <option value="">-- Select Project Site --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Current Workforce Deployed *" error={errors.workforce}>
            <Input
              type="number"
              min="0"
              value={values.workforce}
              onChange={(e) => onChange("workforce", e.target.value)}
              placeholder="0"
            />
          </FormField>

          <FormField label="Operational Status *" error={errors.status}>
            <select
              value={values.status}
              onChange={(e) => onChange("status", e.target.value)}
              className={selectClassName}
            >
              {contractorStatusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </FormField>
        </div>
      </FormSection>

      {/* Section 5: Compliance & Documents */}
      <FormSection title="5. Compliance & Documents" description="Initial certification clearance and verification status.">
        <FormField label="Compliance Status *" error={errors.complianceStatus}>
          <select
            value={values.complianceStatus}
            onChange={(e) => onChange("complianceStatus", e.target.value)}
            className={selectClassName}
          >
            {complianceStatusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </FormField>
      </FormSection>

      {/* Actions */}
      <div className="fixed bottom-0 right-0 z-10 flex w-full max-w-3xl items-center justify-end gap-3 border-t border-border-soft bg-surface px-6 py-4">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {mode === "create" ? "Add Contractor" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
