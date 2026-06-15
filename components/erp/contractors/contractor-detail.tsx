"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Printer,
  CalendarClock,
  ShieldCheck,
  UserX,
  Building2,
  FileCheck2,
  Star,
  UsersRound,
  FileText,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import type { ContractorDetailResponse, PropertySummaryResponse } from "@/lib/erp-types";
import { apiRequest } from "@/lib/erp-api";
import { formatDate, toneForStatus, formatCurrency } from "@/lib/erp-utils";
import { useUiStore } from "@/store/ui-store";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { ContractorForm, buildContractorFormValues, validateContractorForm, createEmptyContractorFormValues } from "@/components/erp/contractors/contractor-form";
import { ContractorWorkforce } from "@/components/erp/contractors/contractor-workforce";
import { ContractorPerformance } from "@/components/erp/contractors/contractor-performance";
import { ContractorTimeline } from "@/components/erp/contractors/contractor-timeline";

function AvatarHero({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-active-soft text-xl font-semibold text-accent-primary shrink-0">
      {initials}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, subtext }: { label: string; value: string; icon: any; subtext?: string }) {
  return (
    <Card className="border-border-soft/80 bg-surface">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-active-soft text-accent-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-label text-text-secondary leading-none">{label}</p>
          <p className="text-2xl font-bold text-text-primary tracking-tight leading-none pt-1">{value}</p>
          {subtext ? <p className="text-[11px] text-text-muted leading-none pt-1">{subtext}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-[var(--radius-card)] border border-border-soft/60 bg-surface-secondary p-3">
      <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">{label}</p>
      <p className="text-body font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5 text-amber-500 font-medium text-body">
      {"★".repeat(fullStars)}
      {halfStar ? "½" : ""}
      {"☆".repeat(emptyStars)}
      <span className="ml-1.5 text-label text-text-secondary font-semibold">({rating}/5)</span>
    </div>
  );
}

function toneForCompliance(status: string) {
  if (status === "Compliant") return "success" as const;
  if (status === "Pending Review") return "warning" as const;
  return "error" as const;
}

export function ContractorDetail({ contractorId: providedContractorId }: { contractorId?: string }) {
  const params = useParams<{ contractorId: string }>();
  const contractorId = providedContractorId || params?.contractorId;
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formValues, setFormValues] = useState(createEmptyContractorFormValues());
  const [formErrors, setFormErrors] = useState({});

  const detailQuery = useQuery({
    queryKey: ["erp-contractor-detail", contractorId, role],
    queryFn: async () =>
      (await apiRequest<ContractorDetailResponse>(`/api/workforce/contractors/${contractorId}`, { role })).data,
    enabled: Boolean(contractorId),
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/workforce/contractors/${contractorId}`, {
        role,
        method: "PATCH",
        body: {
          ...formValues,
          workforce: Number(formValues.workforce) || 0,
          rateValue: Number(formValues.rateValue) || 0,
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-contractor-detail", contractorId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-contractors"] }),
      ]);
      setDrawerOpen(false);
      setFormErrors({});
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/workforce/contractors/${contractorId}`, {
        role,
        method: "PATCH",
        body: { status: "Closed" },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-contractor-detail", contractorId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-contractors"] }),
      ]);
      router.push("/people/contractors");
    },
  });

  const renewMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/workforce/contractors/${contractorId}`, {
        role,
        method: "PATCH",
        body: {
          status: "Engaged",
          complianceStatus: "Compliant",
          contractEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-contractor-detail", contractorId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-contractors"] }),
      ]);
    },
  });

  if (detailQuery.isLoading || projectsQuery.isLoading) {
    return <LoadingStateCard title="Loading contractor intelligence profile" />;
  }

  if (detailQuery.error || projectsQuery.error || !detailQuery.data || !projectsQuery.data) {
    return <ErrorStateCard message="Contractor profile data is unavailable." />;
  }

  const detail = detailQuery.data;
  const profile = detail.profile;
  const projectList = projectsQuery.data.projects || [];

  const handleOpenEdit = () => {
    setFormValues(buildContractorFormValues(profile));
    setFormErrors({});
    setDrawerOpen(true);
  };

  const handleFormChange = <K extends keyof typeof formValues>(field: K, value: typeof formValues[K]) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleFormSubmit = () => {
    const errors = validateContractorForm(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    saveMutation.mutate();
  };

  return (
    <section className="space-y-6">
      {/* Top breadcrumb navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/people/contractors"
          className="inline-flex items-center gap-2 text-body text-text-secondary hover:text-accent-primary transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contractor Operations
        </Link>
      </div>

      {/* Flagship Profile Hero */}
      <Card className="overflow-hidden border-border-soft/80 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_25%),linear-gradient(135deg,var(--color-bg-surface),var(--color-bg-surface-secondary))]">
        <CardContent className="flex flex-col gap-6 p-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <AvatarHero name={profile.name} />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={toneForStatus(profile.status)}>{profile.status}</Badge>
                <Badge tone={toneForCompliance(profile.complianceStatus || "Compliant")}>
                  {profile.complianceStatus}
                </Badge>
                <Badge tone="info">{profile.trade}</Badge>
              </div>
              <div>
                <h1 className="text-page-title font-secondary text-text-primary tracking-tight font-bold">
                  {profile.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-body text-text-secondary font-medium">
                    Vendor Partner ID: <span className="text-text-primary font-semibold">{profile.id}</span>
                  </span>
                  <span className="h-4 w-px bg-border-soft hidden sm:block" />
                  <RatingStars rating={profile.rating || 4.5} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleOpenEdit}>
              Edit Contractor
            </Button>
            <Button variant="secondary" onClick={() => renewMutation.mutate()} loading={renewMutation.isPending}>
              <CalendarClock className="h-4 w-4" />
              Renew Contract
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print Profile
            </Button>
            {profile.status !== "Closed" ? (
              <Button
                variant="danger"
                onClick={() => deactivateMutation.mutate()}
                loading={deactivateMutation.isPending}
              >
                <UserX className="h-4 w-4" />
                Deactivate
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Contractor Operations Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Active Workforce" value={`${profile.workforce || 0} Craftsmen`} icon={UsersRound} subtext="Mobilized at project site" />
        <SummaryCard label="Projects Supported" value={`${detail.engagementHistory.length} Sites`} icon={Building2} subtext="Active and historic scope" />
        <SummaryCard
          label="Contract Duration"
          value={`${formatDate(profile.contractStart || "")} to ${formatDate(profile.contractEnd || "")}`}
          icon={FileText}
          subtext="Valid agreement period"
        />
        <SummaryCard label="Performance Score" value={`${(profile.rating || 4.5) * 20}%`} icon={Star} subtext="Quality, safety & speed index" />
      </div>

      {/* Main Grid: Left (Detailed Analytics/Lists) | Right (Meta Information & Business Specs) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column: 8-cols */}
        <div className="lg:col-span-8 space-y-6">
          {/* Workforce Breakdown */}
          <ContractorWorkforce breakdown={detail.workforceBreakdown} />

          {/* Project Engagements */}
          <Card className="border-border-soft/80 bg-surface">
            <CardHeader>
              <CardTitle className="text-section-title font-secondary text-text-primary">Project Engagements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {detail.engagementHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary flex flex-col justify-between min-h-[135px] hover:border-accent-primary/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-body font-bold text-text-primary leading-tight">{item.projectName}</h4>
                        <Badge tone={item.status === "Active" ? "success" : "neutral"}>{item.status}</Badge>
                      </div>
                      <p className="text-label text-text-secondary">Duration: {item.duration}</p>
                    </div>
                    <div className="flex justify-between items-end pt-3 border-t border-border-soft/60 mt-3">
                      <div>
                        <span className="text-[10px] text-text-muted block uppercase tracking-wider font-semibold">Workforce</span>
                        <span className="text-body font-bold text-text-primary">{item.workforceDeployed} workers</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-text-muted block uppercase tracking-wider font-semibold">Rating</span>
                        <span className="text-body font-bold text-amber-500">★ {item.performanceRating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Analytics (Charts) */}
          <ContractorPerformance
            workforceTrend={detail.performanceMetrics.workforceTrend}
            productivityTrend={detail.performanceMetrics.productivityTrend}
            attendanceTrend={detail.performanceMetrics.attendanceTrend}
            projectContribution={detail.performanceMetrics.projectContribution}
          />

          {/* Compliance Center */}
          <Card className="border-border-soft/80 bg-surface">
            <CardHeader>
              <CardTitle className="text-section-title font-secondary text-text-primary">Compliance Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-label text-text-secondary block font-medium">Agreement Clearance</span>
                    <span className="text-body font-bold text-text-primary">{detail.complianceSummary.agreementStatus}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-label text-text-secondary block font-medium">Workmen Compensation Insurance</span>
                    <span className="text-body font-bold text-text-primary">{detail.complianceSummary.insuranceStatus}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-label text-text-secondary block font-medium">Labor License Status</span>
                    <span className="text-body font-bold text-text-primary">{detail.complianceSummary.licenseStatus}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-label text-text-secondary block font-medium">Safety Standard Certification</span>
                    <span className="text-body font-bold text-text-primary">{detail.complianceSummary.safetyCertification}</span>
                  </div>
                </div>
              </div>

              {/* Verified Documents List */}
              <div className="pt-2">
                <h4 className="text-body font-bold text-text-primary mb-3">Verification Documentation Checklist</h4>
                <div className="overflow-hidden border border-border-soft rounded-[var(--radius-card)]">
                  <table className="w-full text-table text-left">
                    <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft">
                      <tr className="h-10">
                        <th className="px-4 font-semibold">Document Name</th>
                        <th className="px-4 font-semibold">Category</th>
                        <th className="px-4 font-semibold">Valid Till</th>
                        <th className="px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.documents.map((doc) => (
                        <tr key={doc.id} className="border-t border-border-soft bg-surface hover:bg-surface-secondary/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-text-primary">{doc.name}</td>
                          <td className="px-4 py-3 text-text-secondary">{doc.documentType}</td>
                          <td className="px-4 py-3 text-text-secondary">{formatDate(doc.expiryDate)}</td>
                          <td className="px-4 py-3">
                            <Badge tone={doc.status === "Compliant" ? "success" : doc.status === "Pending Review" ? "warning" : "error"}>
                              {doc.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <ContractorTimeline items={detail.timelineData} />
        </div>

        {/* Right column: 4-cols */}
        <div className="lg:col-span-4 space-y-6">
          {/* Contact Details */}
          <Card className="border-border-soft/80 bg-surface">
            <CardHeader className="border-b border-border-soft pb-3">
              <CardTitle className="text-card-title text-text-primary font-semibold flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-accent-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <InfoBlock label="Contact Person" value={profile.contactPerson || "Amit Sharma"} />
              <InfoBlock label="Phone Number" value={profile.phone || "+91 98765 43210"} />
              <InfoBlock label="Email Address" value={profile.email || "contact@workforce.local"} />
              <InfoBlock label="Office Address" value={profile.address || "Plot 12, Industrial Area, Noida"} />
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card className="border-border-soft/80 bg-surface">
            <CardHeader className="border-b border-border-soft pb-3">
              <CardTitle className="text-card-title text-text-primary font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-accent-primary" />
                Business Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <InfoBlock label="GSTIN" value={profile.gstin || "07AAAAA0000A1Z0"} />
              <InfoBlock label="PAN Number" value={profile.pan || "ABCDE1234F"} />
              <InfoBlock label="Company Type" value="Partnership / Workforce Agency" />
              <InfoBlock label="System Registration" value={formatDate(profile.createdAt || "")} />
            </CardContent>
          </Card>

          {/* Contract Details */}
          <Card className="border-border-soft/80 bg-surface">
            <CardHeader className="border-b border-border-soft pb-3">
              <CardTitle className="text-card-title text-text-primary font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent-primary" />
                Agreement Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <InfoBlock label="Start Date" value={formatDate(profile.contractStart || "")} />
              <InfoBlock label="End Date" value={formatDate(profile.contractEnd || "")} />
              <div className="grid grid-cols-2 gap-3">
                <InfoBlock label="Rate Type" value={profile.rateType || "Daily"} />
                <InfoBlock label="Rate Value" value={formatCurrency(profile.rateValue || 0)} />
              </div>
              <InfoBlock label="Estimated Annual Contract Value" value={formatCurrency((profile.rateValue || 350) * (profile.workforce || 10) * 250)} />
            </CardContent>
          </Card>

          {/* Financial Snapshot */}
          <Card className="border-border-soft/80 bg-surface">
            <CardHeader className="border-b border-border-soft pb-3">
              <CardTitle className="text-card-title text-text-primary font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent-primary" />
                Financial Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="p-3 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary text-center">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold block mb-1">Raised</span>
                  <span className="text-body font-bold text-text-primary">{formatCurrency(detail.financialSummary.invoicesRaised)}</span>
                </div>
                <div className="p-3 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary text-center">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold block mb-1">Cleared</span>
                  <span className="text-body font-bold text-success">{formatCurrency(detail.financialSummary.invoicesPaid)}</span>
                </div>
              </div>

              <div className="p-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary text-center space-y-1">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold block">Outstanding Balance</span>
                <span className="text-xl font-bold text-error">{formatCurrency(detail.financialSummary.outstandingAmount)}</span>
              </div>

              <div className="flex justify-between items-center px-3 py-2.5 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary text-label">
                <span className="text-text-secondary font-medium">Payment Performance</span>
                <Badge tone={detail.financialSummary.paymentPerformance === "On Time" ? "success" : "warning"}>
                  {detail.financialSummary.paymentPerformance}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Contractor Drawer */}
      <Drawer
        open={drawerOpen}
        title="Edit Contractor Profile"
        onClose={() => setDrawerOpen(false)}
        size="lg"
      >
        <ContractorForm
          mode="edit"
          values={formValues}
          errors={formErrors}
          projects={projectList}
          isSubmitting={saveMutation.isPending}
          onCancel={() => setDrawerOpen(false)}
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
        />
      </Drawer>
    </section>
  );
}
