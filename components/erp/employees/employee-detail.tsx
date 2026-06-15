"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, FileUp, Printer, Repeat, UserX } from "lucide-react";
import type { EmployeeDetailResponse, PropertySummaryResponse } from "@/lib/erp-types";
import { apiRequest, uploadDocument } from "@/lib/erp-api";
import { formatDate, toneForStatus } from "@/lib/erp-utils";
import { useUiStore } from "@/store/ui-store";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { EmployeeAttendance } from "@/components/erp/employees/employee-attendance";
import {
  EmployeeForm,
  buildEmployeeFormValues,
  createEmptyEmployeeFormValues,
  type EmployeeFormErrors,
  validateEmployeeForm,
} from "@/components/erp/employees/employee-form";
import { EmployeeActivityTimeline, EmployeeTimeline } from "@/components/erp/employees/employee-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";

function AvatarHero({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-active-soft text-xl font-semibold text-accent-primary">
      {initials}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border-soft/80">
      <CardContent className="space-y-2 p-4">
        <p className="text-label text-text-secondary">{label}</p>
        <p className="text-card-title text-text-primary">{value}</p>
      </CardContent>
    </Card>
  );
}

function InformationCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="space-y-1 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
            <p className="text-label text-text-secondary">{item.label}</p>
            <p className="text-body text-text-primary">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EmployeeDetail({ employeeId: providedEmployeeId }: { employeeId?: string }) {
  const params = useParams<{ id: string }>();
  const employeeId = providedEmployeeId || params?.id;
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formValues, setFormValues] = useState(createEmptyEmployeeFormValues());
  const [formErrors, setFormErrors] = useState<EmployeeFormErrors>({});
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const detailQuery = useQuery({
    queryKey: ["erp-employee-detail", employeeId, role],
    queryFn: async () =>
      (await apiRequest<EmployeeDetailResponse>(`/api/workforce/employees/${employeeId}`, { role })).data,
    enabled: Boolean(employeeId),
  });
  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/workforce/employees/${employeeId}`, {
        role,
        method: "PATCH",
        body: formValues,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-employee-detail", employeeId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-employees"] }),
      ]);
      setDrawerOpen(false);
      setFormErrors({});
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/workforce/employees/${employeeId}`, {
        role,
        method: "PATCH",
        body: { status: "Inactive" },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-employee-detail", employeeId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-employees"] }),
      ]);
    },
  });

  if (detailQuery.isLoading || projectsQuery.isLoading) {
    return <LoadingStateCard title="Loading employee profile" />;
  }

  if (detailQuery.error || projectsQuery.error || !detailQuery.data || !projectsQuery.data) {
    return <ErrorStateCard message="Employee profile data is unavailable." />;
  }

  const detail = detailQuery.data;
  const employee = detail.employee;
  const departments = Array.from(
    new Set(["Projects", "Procurement", "Finance", "Sales", "Administration", "Engineering", employee.department]),
  ).filter(Boolean);
  const teamOptions = Array.from(new Set([employee.teamName, ...detail.allocationTimeline.map((item) => `${item.projectName} Team`)])).filter(Boolean);

  const openEditDrawer = () => {
    setFormValues(buildEmployeeFormValues(employee));
    setFormErrors({});
    setDrawerOpen(true);
  };

  const handleSubmit = () => {
    const errors = validateEmployeeForm(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    saveMutation.mutate();
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/people/employees" className="inline-flex items-center gap-2 text-body text-text-secondary hover:text-accent-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to Workforce Operations
        </Link>
        {uploadMessage ? <Badge tone="info">{uploadMessage}</Badge> : null}
      </div>

      <Card className="overflow-hidden border-border-soft/80 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_32%),linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))]">
        <CardContent className="flex flex-col gap-6 p-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <AvatarHero name={employee.name} />
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={toneForStatus(employee.status)}>{employee.status}</Badge>
                  <Badge tone="info">{employee.department}</Badge>
                  <Badge tone="neutral">{employee.teamName}</Badge>
                </div>
                <div>
                  <h1 className="text-page-title font-secondary text-text-primary">{employee.name}</h1>
                  <p className="mt-2 text-body text-text-secondary">
                    {employee.designation} · {employee.position} · Reporting to {employee.reportingManager}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">{employee.projectName}</Badge>
                <Badge tone="neutral">{employee.email}</Badge>
                <Badge tone="neutral">{employee.phone}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={openEditDrawer}>
              Edit Employee
            </Button>
            <Button variant="secondary" onClick={openEditDrawer}>
              <Repeat className="h-4 w-4" />
              Transfer Employee
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print Profile
            </Button>
            <Button variant="danger" loading={deactivateMutation.isPending} onClick={() => deactivateMutation.mutate()}>
              <UserX className="h-4 w-4" />
              Deactivate
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Attendance %" value={`${detail.summary.attendancePercent}%`} />
        <SummaryCard label="Projects Assigned" value={`${detail.summary.projectsAssigned}`} />
        <SummaryCard label="Teams Assigned" value={`${detail.summary.teamsAssigned}`} />
        <SummaryCard label="Years of Service" value={`${detail.summary.yearsOfService}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-accent-primary/10">
          <CardHeader>
            <CardTitle>Current Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[var(--radius-card)] border border-accent-primary/15 bg-active-soft/60 p-5">
              <p className="text-section-title font-secondary text-text-primary">{detail.assignment.projectName}</p>
              <p className="mt-2 text-body text-text-secondary">{detail.assignment.role}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-label text-text-secondary">Project Start Date</p>
                  <p className="text-body text-text-primary">{formatDate(detail.assignment.projectStartDate)}</p>
                </div>
                <div>
                  <p className="text-label text-text-secondary">Reporting Manager</p>
                  <p className="text-body text-text-primary">{detail.assignment.reportingManager}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <InformationCard
          title="Personal Information"
          items={[
            { label: "Email", value: detail.personalInformation.email },
            { label: "Phone", value: detail.personalInformation.phone },
            { label: "Emergency Contact", value: detail.personalInformation.emergencyContact },
            { label: "Date of Birth", value: formatDate(detail.personalInformation.dateOfBirth) },
            { label: "Address", value: detail.personalInformation.address },
          ]}
        />
      </div>

      <InformationCard
        title="Employment Information"
        items={[
          { label: "Employee ID", value: detail.employmentInformation.employeeCode },
          { label: "Department", value: detail.employmentInformation.department },
          { label: "Designation", value: detail.employmentInformation.designation },
          { label: "Position", value: detail.employmentInformation.position },
          { label: "Date Joined", value: formatDate(detail.employmentInformation.dateJoined) },
          { label: "Reporting Manager", value: detail.employmentInformation.reportingManager },
        ]}
      />

      <EmployeeAttendance attendance={detail.attendanceAnalytics} attendancePercent={detail.summary.attendancePercent} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <EmployeeTimeline items={detail.allocationTimeline} title="Project Allocation Timeline" />

        <Card>
          <CardHeader className="flex flex-col gap-3 border-b border-border-soft lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Documents</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => uploadInputRef.current?.click()}>
              <FileUp className="h-4 w-4" />
              Upload Support
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.documents.map((document) => (
              <div key={document.id} className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-card-title text-text-primary">{document.title}</p>
                  <Badge tone={document.status.toLowerCase().includes("pending") ? "warning" : "success"}>
                    {document.status}
                  </Badge>
                </div>
                <p className="mt-2 text-label text-text-muted">{document.fileName}</p>
                <p className="mt-1 text-label text-text-muted">Updated {formatDate(document.uploadedAt)}</p>
                <div className="mt-3">
                  <Button variant="ghost" size="sm" onClick={() => uploadInputRef.current?.click()}>
                    <Download className="h-4 w-4" />
                    Upload New Version
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <EmployeeActivityTimeline items={detail.activity} />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Edit Employee" size="lg">
        <EmployeeForm
          mode="edit"
          values={formValues}
          errors={formErrors}
          departments={departments}
          teamOptions={teamOptions}
          projects={projectsQuery.data.projects}
          isSubmitting={saveMutation.isPending}
          onCancel={() => setDrawerOpen(false)}
          onChange={(field, value) => setFormValues((current) => ({ ...current, [field]: value }))}
          onSubmit={handleSubmit}
        />
      </Drawer>

      <input
        ref={uploadInputRef}
        type="file"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;

          try {
            await uploadDocument(role, file, {
              title: `${employee.name} ${file.name}`,
              category: "Employee Document",
              module: "Workforce",
              relatedEntityId: employee.id,
              projectId: employee.projectId,
            });
            setUploadMessage(`${file.name} uploaded to the workforce document register.`);
          } catch {
            setUploadMessage(`Upload failed for ${file.name}.`);
          } finally {
            event.target.value = "";
          }
        }}
      />
    </section>
  );
}
