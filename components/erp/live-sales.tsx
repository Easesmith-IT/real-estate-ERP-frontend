"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarClock, ChevronRight, Plus, TrendingUp, UserRoundCheck, XCircle } from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatCurrency, formatDate, formatDateTime, nextSalesStage, toneForStage, toneForStatus } from "@/lib/erp-utils";
import type {
  Booking,
  BookingResponse,
  Broker,
  CustomerResponse,
  Lead,
  LeadListResponse,
  LeadStats,
  PipelineResponse,
  PropertySummaryResponse,
  Reservation,
  ReservationResponse,
  SiteVisit,
  SiteVisitsResponse,
  Unit,
  UserDirectoryResponse,
} from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { KpiGrid, SectionHeader, TableEmptyStateRow, TableToolbar } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SiteVisitsKpis } from "@/components/erp/site-visits/site-visits-kpis";
import { SiteVisitsAnalytics } from "@/components/erp/site-visits/site-visits-analytics";
import { SiteVisitsRecommendations } from "@/components/erp/site-visits/site-visits-recommendations";

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";
const textareaClassName =
  "min-h-[104px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

function useSalesUsers() {
  const role = useUiStore((state) => state.role);
  return useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });
}

export function LeadsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [stageFilter, setStageFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    preferredProjectId: "",
    preferredConfiguration: "",
    budgetMin: "",
    budgetMax: "",
    assignedTo: "",
    source: "Website",
    brokerId: "",
    followUpAt: "",
    notes: "",
  });

  const leadsQuery = useQuery({
    queryKey: ["erp-leads", role],
    queryFn: async () => (await apiRequest<LeadListResponse>("/api/leads", { role })).data,
  });
  const statsQuery = useQuery({
    queryKey: ["erp-lead-stats", role],
    queryFn: async () => (await apiRequest<LeadStats>("/api/leads/stats", { role })).data,
  });
  const usersQuery = useSalesUsers();
  const customersQuery = useQuery({
    queryKey: ["erp-brokers", role],
    queryFn: async () => (await apiRequest<CustomerResponse>("/api/customers", { role })).data,
  });
  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const saveLeadMutation = useMutation({
    mutationFn: async () =>
      apiRequest<Lead>(editingLeadId ? `/api/leads/${editingLeadId}` : "/api/leads", {
        role,
        method: editingLeadId ? "PATCH" : "POST",
        body: {
          ...form,
          budgetMin: Number(form.budgetMin),
          budgetMax: Number(form.budgetMax),
          brokerId: form.brokerId || undefined,
        },
      }),
    onSuccess: async () => {
      setEditingLeadId(null);
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        preferredProjectId: "",
        preferredConfiguration: "",
        budgetMin: "",
        budgetMax: "",
        assignedTo: "",
        source: "Website",
        brokerId: "",
        followUpAt: "",
        notes: "",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-lead-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-pipeline"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  const advanceStageMutation = useMutation({
    mutationFn: async ({ leadId, stage }: { leadId: string; stage: string }) =>
      apiRequest<Lead>(`/api/leads/${leadId}/stage`, {
        role,
        method: "PATCH",
        body: { stage },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-lead-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-pipeline"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
      ]);
    },
  });

  const salesOwners = useMemo(
    () => (usersQuery.data?.users || []).filter((user) => user.role === "sales" || user.role === "manager"),
    [usersQuery.data],
  );
  const brokers = customersQuery.data?.brokers || [];
  const projects = projectsQuery.data?.projects || [];
  const leads = useMemo(() => {
    const rows = leadsQuery.data?.items || [];
    return rows.filter((lead) => {
      const needle = deferredSearch.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        lead.fullName.toLowerCase().includes(needle) ||
        lead.projectName.toLowerCase().includes(needle) ||
        lead.source.toLowerCase().includes(needle);
      const matchesStage = stageFilter === "All" || lead.stage === stageFilter;
      const matchesOwner = ownerFilter === "All" || lead.assignedTo === ownerFilter;
      const matchesSource = sourceFilter === "All" || lead.source === sourceFilter;
      return matchesSearch && matchesStage && matchesOwner && matchesSource;
    });
  }, [deferredSearch, leadsQuery.data, ownerFilter, sourceFilter, stageFilter]);

  useEffect(() => {
    if (!form.assignedTo && salesOwners[0]?.id) {
      setForm((current) => ({ ...current, assignedTo: salesOwners[0].id }));
    }
  }, [form.assignedTo, salesOwners]);

  useEffect(() => {
    if (!form.preferredProjectId && projects[0]?.id) {
      setForm((current) => ({ ...current, preferredProjectId: projects[0].id }));
    }
  }, [form.preferredProjectId, projects]);

  if (leadsQuery.isLoading || statsQuery.isLoading || usersQuery.isLoading || customersQuery.isLoading || projectsQuery.isLoading) {
    return <LoadingStateCard title="Loading lead operations workspace" />;
  }

  if (leadsQuery.error || statsQuery.error || usersQuery.error || customersQuery.error || projectsQuery.error) {
    return (
      <ErrorStateCard
        message={
          leadsQuery.error instanceof Error
            ? leadsQuery.error.message
            : statsQuery.error instanceof Error
              ? statsQuery.error.message
              : "One or more sales data sources failed to load."
        }
      />
    );
  }

  const stats = statsQuery.data as LeadStats;
  const leadStages = leadsQuery.data?.stages || [];
  const leadSources = Array.from(new Set((leadsQuery.data?.items || []).map((lead) => lead.source))).sort();
  const overdueFollowUps = leads.filter((lead) => new Date(lead.followUpAt).getTime() < Date.now());
  const premiumLeads = leads.filter((lead) => lead.budgetMax >= 18000000);
  const brokerLinkedLeads = leads.filter((lead) => Boolean(lead.brokerId));
  const activeLeadFilters = [
    stageFilter !== "All" ? `Stage: ${stageFilter}` : null,
    ownerFilter !== "All" ? `Owner: ${salesOwners.find((user) => user.id === ownerFilter)?.name || ownerFilter}` : null,
    sourceFilter !== "All" ? `Source: ${sourceFilter}` : null,
  ].filter(Boolean) as string[];

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Lead Operations"
        description="Capture, assign, and progress real sales opportunities through the internal ERP without leaving the sales workspace."
        actions={
          <Badge tone="info" className="h-fit">
            User Role: {role}
          </Badge>
        }
      />

      <KpiGrid
        items={[
          { label: "Active Leads", value: `${stats.activeLeads}`, trend: "Open sales opportunities", tone: "info" },
          { label: "Scheduled Visits", value: `${stats.scheduledVisits}`, trend: "Site tours lined up", tone: "warning" },
          { label: "High-Value Leads", value: `${stats.highValue}`, trend: "Budget above 1.8 Cr", tone: "success" },
          { label: "Booked This Cycle", value: `${stats.bookedThisCycle}`, trend: "Converted to booking", tone: "success" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.8fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>Lead Register</CardTitle>
              <p className="text-body text-text-secondary">
                Search, segment, and advance opportunities without losing sales context during a live walkthrough.
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <TableToolbar
              searchPlaceholder="Search by lead, project, owner, or source"
              searchValue={search}
              onSearchChange={setSearch}
              filters={
                <>
                  <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} className={selectClassName}>
                    <option value="All">All stages</option>
                    {leadStages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                  <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} className={selectClassName}>
                    <option value="All">All owners</option>
                    {salesOwners.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className={selectClassName}>
                    <option value="All">All sources</option>
                    {leadSources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </>
              }
              resultLabel={`${leads.length} of ${leadsQuery.data?.items.length || 0} leads`}
              activeFilters={activeLeadFilters}
              summary={`${overdueFollowUps.length} overdue follow-ups · ${premiumLeads.length} high-value leads · ${brokerLinkedLeads.length} broker-linked`}
              onClear={() => {
                setSearch("");
                setStageFilter("All");
                setOwnerFilter("All");
                setSourceFilter("All");
              }}
            />
            <div className="overflow-auto">
              <table className="w-full min-w-[920px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Lead</th>
                    <th className="px-4 text-left">Project</th>
                    <th className="px-4 text-left">Source</th>
                    <th className="px-4 text-left">Budget</th>
                    <th className="px-4 text-left">Stage</th>
                    <th className="px-4 text-left">Owner</th>
                    <th className="px-4 text-left">Follow-Up</th>
                    <th className="px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length ? leads.map((lead) => {
                    const nextStage = nextSalesStage(lead.stage);
                    return (
                      <tr key={lead.id} className="border-t border-border-soft text-text-secondary transition-colors hover:bg-hover/40">
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-text-primary">{lead.fullName}</p>
                            <p className="text-label text-text-muted">{lead.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">{lead.projectName}</td>
                        <td className="px-4 py-4">{lead.source}</td>
                        <td className="px-4 py-4 text-text-primary">{lead.budgetLabel}</td>
                        <td className="px-4 py-4">
                          <Badge tone={toneForStage(lead.stage)}>{lead.stage}</Badge>
                        </td>
                        <td className="px-4 py-4">{lead.assignedToName}</td>
                        <td className="px-4 py-4">{formatDateTime(lead.followUpAt)}</td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingLeadId(lead.id);
                                setForm({
                                  firstName: lead.firstName,
                                  lastName: lead.lastName,
                                  phone: lead.phone,
                                  email: lead.email,
                                  preferredProjectId: lead.preferredProjectId,
                                  preferredConfiguration: lead.preferredConfiguration,
                                  budgetMin: `${lead.budgetMin}`,
                                  budgetMax: `${lead.budgetMax}`,
                                  assignedTo: lead.assignedTo,
                                  source: lead.source,
                                  brokerId: lead.brokerId || "",
                                  followUpAt: lead.followUpAt.slice(0, 16),
                                  notes: lead.notes,
                                });
                              }}
                            >
                              Edit
                            </Button>
                            {nextStage ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                loading={advanceStageMutation.isPending}
                                onClick={() => advanceStageMutation.mutate({ leadId: lead.id, stage: nextStage })}
                              >
                                Advance
                              </Button>
                            ) : (
                              <Badge tone={lead.stage === "Closed Won" ? "success" : "neutral"}>{lead.stage}</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <TableEmptyStateRow
                      colSpan={8}
                      title="No leads match the current filters"
                      description="Reset the filters to restore the full pipeline view or capture a new lead from the form panel."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{editingLeadId ? "Edit Lead" : "Capture New Lead"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">First name</label>
                <Input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Last name</label>
                <Input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Phone</label>
                <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Email</label>
                <Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Preferred project</label>
                <select
                  value={form.preferredProjectId}
                  onChange={(event) => setForm((current) => ({ ...current, preferredProjectId: event.target.value }))}
                  className={selectClassName}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Configuration</label>
                <Input
                  value={form.preferredConfiguration}
                  onChange={(event) => setForm((current) => ({ ...current, preferredConfiguration: event.target.value }))}
                  placeholder="2BHK / 3BHK / flexible"
                />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Budget min</label>
                <Input value={form.budgetMin} onChange={(event) => setForm((current) => ({ ...current, budgetMin: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Budget max</label>
                <Input value={form.budgetMax} onChange={(event) => setForm((current) => ({ ...current, budgetMax: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Assigned owner</label>
                <select value={form.assignedTo} onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))} className={selectClassName}>
                  {salesOwners.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Lead source</label>
                <Input value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Broker</label>
                <select value={form.brokerId} onChange={(event) => setForm((current) => ({ ...current, brokerId: event.target.value }))} className={selectClassName}>
                  <option value="">Direct lead</option>
                  {brokers.map((broker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Follow-up</label>
                <Input type="datetime-local" value={form.followUpAt} onChange={(event) => setForm((current) => ({ ...current, followUpAt: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Sales notes</label>
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className={textareaClassName} />
            </div>
            <div className="flex justify-end">
              <div className="flex w-full gap-3">
                <Button className="flex-1" loading={saveLeadMutation.isPending} onClick={() => saveLeadMutation.mutate()}>
                  <Plus className="h-4 w-4" />
                  {editingLeadId ? "Save Lead" : "Save Lead"}
                </Button>
                {editingLeadId ? (
                  <Button
                    className="flex-1"
                    variant="ghost"
                    onClick={() => {
                      setEditingLeadId(null);
                      setForm({
                        firstName: "",
                        lastName: "",
                        phone: "",
                        email: "",
                        preferredProjectId: projects[0]?.id || "",
                        preferredConfiguration: "",
                        budgetMin: "",
                        budgetMax: "",
                        assignedTo: salesOwners[0]?.id || "",
                        source: "Website",
                        brokerId: "",
                        followUpAt: "",
                        notes: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function PipelineWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  const pipelineQuery = useQuery({
    queryKey: ["erp-pipeline", role],
    queryFn: async () => (await apiRequest<PipelineResponse>("/api/leads/pipeline", { role })).data,
  });

  const advanceStageMutation = useMutation({
    mutationFn: async ({ leadId, stage }: { leadId: string; stage: string }) =>
      apiRequest<Lead>(`/api/leads/${leadId}/stage`, {
        role,
        method: "PATCH",
        body: { stage },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-pipeline"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-lead-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
      ]);
    },
  });

  if (pipelineQuery.isLoading) {
    return <LoadingStateCard title="Loading sales pipeline" />;
  }

  if (pipelineQuery.error || !pipelineQuery.data) {
    return <ErrorStateCard message={pipelineQuery.error instanceof Error ? pipelineQuery.error.message : "Pipeline data is unavailable."} />;
  }

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Sales Pipeline"
        description="Track live stage movement from inquiry to booking, with each stage card backed by the ERP lead register."
      />

      <KpiGrid
        items={[
          { label: "Active Pipeline", value: `${pipelineQuery.data.totals.activeLeads}`, trend: "Open stage cards", tone: "info" },
          { label: "Closed Won", value: `${pipelineQuery.data.totals.won}`, trend: "Converted to booking flow", tone: "success" },
          { label: "Closed Lost", value: `${pipelineQuery.data.totals.lost}`, trend: "Dropped opportunities", tone: "warning" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Kanban Progression</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <div className="grid min-w-[1180px] grid-cols-6 gap-4">
            {pipelineQuery.data.stages.map((stage) => (
              <div key={stage.stage} className="surface-secondary flex min-h-[340px] flex-col gap-3 rounded-[var(--radius-card)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-card-title text-text-primary">{stage.stage}</p>
                  <Badge tone={toneForStage(stage.stage)}>{stage.leads.length}</Badge>
                </div>
                <div className="space-y-3">
                  {stage.leads.length === 0 ? (
                    <div className="rounded-[var(--radius-input)] border border-dashed border-border-soft bg-surface px-3 py-5 text-body text-text-muted">
                      No leads in this stage.
                    </div>
                  ) : (
                    stage.leads.map((lead) => {
                      const nextStage = nextSalesStage(lead.stage);
                      return (
                        <div key={lead.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface p-3 shadow-soft">
                          <p className="font-medium text-text-primary">{lead.fullName}</p>
                          <p className="mt-1 text-label text-text-muted">{lead.projectName}</p>
                          <p className="mt-2 text-body text-text-primary">{lead.budgetLabel}</p>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <Badge tone="info">{lead.assignedToName}</Badge>
                            {nextStage ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                loading={advanceStageMutation.isPending}
                                onClick={() => advanceStageMutation.mutate({ leadId: lead.id, stage: nextStage })}
                              >
                                <ChevronRight className="h-4 w-4" />
                                Next
                              </Button>
                            ) : (
                              <Badge tone="success">Ready</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function SiteVisitsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    leadId: "",
    projectId: "",
    coordinatorId: "",
    scheduledAt: "",
    outcome: "",
  });

  const visitsQuery = useQuery({
    queryKey: ["erp-site-visits", role],
    queryFn: async () => (await apiRequest<SiteVisitsResponse>("/api/leads/site-visits", { role })).data,
  });
  const leadsQuery = useQuery({
    queryKey: ["erp-leads", role],
    queryFn: async () => (await apiRequest<LeadListResponse>("/api/leads", { role })).data,
  });
  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const visitMutation = useMutation({
    mutationFn: async () =>
      apiRequest<SiteVisit>("/api/leads/site-visits", {
        role,
        method: "POST",
        body: form,
      }),
    onSuccess: async () => {
      setForm({
        leadId: "",
        projectId: "",
        coordinatorId: "",
        scheduledAt: "",
        outcome: "",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-site-visits"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-pipeline"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-lead-stats"] }),
      ]);
    },
  });

  const leadOptions = (leadsQuery.data?.items || []).filter((lead) => lead.stage !== "Closed Lost" && !lead.hasActiveBooking);
  const projects = projectsQuery.data?.projects || [];
  const coordinators = visitsQuery.data?.coordinators || [];

  useEffect(() => {
    if (!form.leadId && leadOptions[0]?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((current) => ({ ...current, leadId: leadOptions[0].id, projectId: leadOptions[0].preferredProjectId }));
    }
  }, [form.leadId, leadOptions]);

  useEffect(() => {
    if (!form.coordinatorId && coordinators[0]?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((current) => ({ ...current, coordinatorId: coordinators[0].id }));
    }
  }, [coordinators, form.coordinatorId]);

  if (visitsQuery.isLoading || leadsQuery.isLoading || projectsQuery.isLoading) {
    return <LoadingStateCard title="Loading site visit workspace" />;
  }

  if (visitsQuery.error || leadsQuery.error || projectsQuery.error || !visitsQuery.data) {
    return <ErrorStateCard message="Site visit data could not be loaded from the ERP backend." />;
  }

  const allLeads = leadsQuery.data?.items;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Site Visits"
        description="Schedule and monitor site walkthroughs for active leads, with every visit mapped to a project and coordinator."
      />

      <SiteVisitsKpis
        visits={visitsQuery.data.visits}
        isLoading={visitsQuery.isLoading}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <SiteVisitsAnalytics
          visits={visitsQuery.data.visits}
          isLoading={visitsQuery.isLoading}
        />
        <SiteVisitsRecommendations
          visits={visitsQuery.data.visits}
          leads={allLeads}
          isLoading={visitsQuery.isLoading || leadsQuery.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Upcoming and Recent Visits</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[760px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Lead</th>
                    <th className="px-4 text-left">Project</th>
                    <th className="px-4 text-left">Coordinator</th>
                    <th className="px-4 text-left">Schedule</th>
                    <th className="px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visitsQuery.data.visits.map((visit) => (
                    <tr key={visit.id} className="border-t border-border-soft">
                      <td className="px-4 py-4 text-text-primary">{visit.leadName}</td>
                      <td className="px-4 py-4">{visit.projectName}</td>
                      <td className="px-4 py-4">{visit.coordinatorName}</td>
                      <td className="px-4 py-4">{formatDateTime(visit.scheduledAt)}</td>
                      <td className="px-4 py-4">
                        <Badge tone={toneForStatus(visit.status)}>{visit.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule a Visit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Lead</label>
              <select
                value={form.leadId}
                onChange={(event) => {
                  const lead = leadOptions.find((item) => item.id === event.target.value);
                  setForm((current) => ({
                    ...current,
                    leadId: event.target.value,
                    projectId: lead?.preferredProjectId || current.projectId,
                  }));
                }}
                className={selectClassName}
              >
                {leadOptions.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.fullName} - {lead.projectName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Project</label>
              <select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} className={selectClassName}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Coordinator</label>
              <select value={form.coordinatorId} onChange={(event) => setForm((current) => ({ ...current, coordinatorId: event.target.value }))} className={selectClassName}>
                {coordinators.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Schedule</label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Outcome plan</label>
              <textarea className={textareaClassName} value={form.outcome} onChange={(event) => setForm((current) => ({ ...current, outcome: event.target.value }))} />
            </div>
            <div className="flex justify-end">
              <Button loading={visitMutation.isPending} onClick={() => visitMutation.mutate()}>
                <CalendarClock className="h-4 w-4" />
                Schedule Visit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function CustomersBookingsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [form, setForm] = useState({
    leadId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    unitId: "",
    paymentPlanType: "",
  });
  const [reserveForm, setReserveForm] = useState({ leadId: "", unitId: "", notes: "" });

  const customersQuery = useQuery({
    queryKey: ["erp-customers", role],
    queryFn: async () => (await apiRequest<CustomerResponse>("/api/customers", { role })).data,
  });
  const bookingsQuery = useQuery({
    queryKey: ["erp-bookings", role],
    queryFn: async () => (await apiRequest<BookingResponse>("/api/bookings", { role })).data,
  });
  const leadsQuery = useQuery({
    queryKey: ["erp-leads", role],
    queryFn: async () => (await apiRequest<LeadListResponse>("/api/leads", { role })).data,
  });
  const unitsQuery = useQuery({
    queryKey: ["erp-available-units", role, form.leadId],
    queryFn: async () => (await apiRequest<Unit[]>(`/api/properties/units?onlyAvailable=true&reservedByLeadId=${form.leadId}`, { role })).data,
  });
  const reservationsQuery = useQuery({
    queryKey: ["erp-reservations", role],
    queryFn: async () => (await apiRequest<ReservationResponse>("/api/reservations", { role })).data,
  });

  const bookingMutation = useMutation({
    mutationFn: async () =>
      apiRequest<Booking>("/api/bookings", {
        role,
        method: "POST",
        body: form,
      }),
    onSuccess: async () => {
      setForm({
        leadId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        unitId: "",
        paymentPlanType: "",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-customers"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-available-units"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-pipeline"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-properties-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-payments-summary"] }),
      ]);
    },
  });

  const reserveMutation = useMutation({
    mutationFn: async () =>
      apiRequest<Reservation>("/api/reservations", { role, method: "POST", body: reserveForm }),
    onSuccess: async () => {
      setReserveForm({ leadId: "", unitId: "", notes: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-reservations"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-properties-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-available-units"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-pipeline"] }),
      ]);
    },
  });

  const releaseReserveMutation = useMutation({
    mutationFn: async (reservationId: string) =>
      apiRequest(`/api/reservations/${reservationId}`, { role, method: "DELETE" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-reservations"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-properties-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-available-units"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-pipeline"] }),
      ]);
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) =>
      apiRequest<Booking>(`/api/bookings/${bookingId}/cancel`, {
        role,
        method: "PATCH",
        body: {
          reason: "Cancelled from customers and bookings workspace",
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-customers"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-available-units"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-pipeline"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-properties-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-payments-summary"] }),
      ]);
    },
  });

  const leads = useMemo(() => {
    return (leadsQuery.data?.items || []).filter((lead) => !lead.hasActiveBooking && lead.stage !== "Closed Lost");
  }, [leadsQuery.data]);
  const bookings = bookingsQuery.data?.bookings || [];
  const activeBookings = bookings.filter((booking) => booking.status !== "Cancelled");
  const customers = useMemo(() => {
    const rows = customersQuery.data?.customers || [];
    if (!deferredSearch.trim()) {
      return rows;
    }

    const needle = deferredSearch.toLowerCase();
    return rows.filter(
      (customer) =>
        customer.name.toLowerCase().includes(needle) ||
        customer.phone.toLowerCase().includes(needle) ||
        (customer.email || "").toLowerCase().includes(needle),
    );
  }, [customersQuery.data, deferredSearch]);
  const units = useMemo(() => unitsQuery.data || [], [unitsQuery.data]);

  useEffect(() => {
    if (!form.leadId && leads[0]?.id) {
      const firstLead = leads[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((current) => ({
        ...current,
        leadId: firstLead.id,
        customerName: firstLead.fullName,
        customerPhone: firstLead.phone,
        customerEmail: firstLead.email,
      }));
    }
  }, [form.leadId, leads]);

  useEffect(() => {
    if (!form.unitId && units[0]?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((current) => ({ ...current, unitId: units[0].id }));
    }
  }, [form.unitId, units]);

  useEffect(() => {
    if (!form.paymentPlanType && bookingsQuery.data?.paymentPlanTypes[0]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((current) => ({ ...current, paymentPlanType: bookingsQuery.data?.paymentPlanTypes[0] || "" }));
    }
  }, [bookingsQuery.data?.paymentPlanTypes, form.paymentPlanType]);

  if (customersQuery.isLoading || bookingsQuery.isLoading || leadsQuery.isLoading || unitsQuery.isLoading) {
    return <LoadingStateCard title="Loading customer and booking workspace" />;
  }

  if (customersQuery.error || bookingsQuery.error || leadsQuery.error || unitsQuery.error || !bookingsQuery.data) {
    return <ErrorStateCard message="Customer and booking data could not be loaded." />;
  }

  const totalOutstanding = activeBookings.reduce((sum, booking) => sum + booking.outstandingAmount, 0);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Customers and Bookings"
        description="Promote qualified leads into booked customers, attach them to available inventory, and keep dues visible from one web workspace."
      />

      <KpiGrid
        items={[
          { label: "Active Customers", value: `${customersQuery.data?.customers.length || 0}`, trend: "Profiles in ERP", tone: "info" },
          { label: "Active Bookings", value: `${activeBookings.length}`, trend: "Commercially live units", tone: "success" },
          { label: "Available Units", value: `${units.length}`, trend: "Ready for booking", tone: "warning" },
          { label: "Outstanding Dues", value: formatCurrency(totalOutstanding), trend: "Across all bookings", tone: "warning" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <CardTitle>Customer Directory</CardTitle>
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="max-w-sm bg-surface-secondary"
                  placeholder="Search customers"
                />
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <div className="overflow-auto">
                <table className="w-full min-w-[780px] text-table">
                  <thead className="bg-surface-secondary text-text-secondary">
                    <tr className="h-12 border-b border-border-soft">
                      <th className="px-4 text-left">Customer</th>
                      <th className="px-4 text-left">Source Lead</th>
                      <th className="px-4 text-left">Bookings</th>
                      <th className="px-4 text-left">Booked Value</th>
                      <th className="px-4 text-left">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-t border-border-soft">
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-text-primary">{customer.name}</p>
                            <p className="text-label text-text-muted">{customer.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">{customer.sourceLeadName || "Direct"}</td>
                        <td className="px-4 py-4">{customer.bookingCount}</td>
                        <td className="px-4 py-4 text-text-primary">{formatCurrency(customer.totalBookedValue)}</td>
                        <td className="px-4 py-4 text-text-primary">{formatCurrency(customer.outstandingAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Booking Register</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <div className="overflow-auto">
                <table className="w-full min-w-[920px] text-table">
                  <thead className="bg-surface-secondary text-text-secondary">
                    <tr className="h-12 border-b border-border-soft">
                      <th className="px-4 text-left">Customer</th>
                      <th className="px-4 text-left">Project</th>
                      <th className="px-4 text-left">Unit</th>
                      <th className="px-4 text-left">Plan</th>
                      <th className="px-4 text-left">Status</th>
                      <th className="px-4 text-left">Collected</th>
                      <th className="px-4 text-left">Outstanding</th>
                      <th className="px-4 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-t border-border-soft">
                        <td className="px-4 py-4 text-text-primary">{booking.customerName}</td>
                        <td className="px-4 py-4">{booking.projectName}</td>
                        <td className="px-4 py-4">{booking.unitCode}</td>
                        <td className="px-4 py-4">{booking.paymentPlanType}</td>
                        <td className="px-4 py-4">
                          <Badge tone={toneForStatus(booking.status)}>{booking.status}</Badge>
                        </td>
                        <td className="px-4 py-4 text-text-primary">{formatCurrency(booking.totalPaid)}</td>
                        <td className="px-4 py-4 text-text-primary">{formatCurrency(booking.outstandingAmount)}</td>
                        <td className="px-4 py-4">
                          {booking.status === "Cancelled" ? (
                            <span className="text-label text-text-muted">{booking.cancellationReason || "Inventory released"}</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={cancelBookingMutation.isPending}
                              onClick={() => cancelBookingMutation.mutate(booking.id)}
                            >
                              <XCircle className="h-4 w-4" />
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Qualified lead</label>
              <select
                value={form.leadId}
                onChange={(event) => {
                  const nextLeadId = event.target.value;
                  const selectedLead = leads.find((lead) => lead.id === nextLeadId);
                  setForm((current) => ({
                    ...current,
                    leadId: nextLeadId,
                    customerName: selectedLead?.fullName || "",
                    customerPhone: selectedLead?.phone || "",
                    customerEmail: selectedLead?.email || "",
                  }));
                }}
                className={selectClassName}
              >
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.fullName} - {lead.projectName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Customer name</label>
                <Input value={form.customerName} onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Phone</label>
                <Input value={form.customerPhone} onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-label text-text-secondary">Email</label>
                <Input value={form.customerEmail} onChange={(event) => setForm((current) => ({ ...current, customerEmail: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Available unit</label>
              <select value={form.unitId} onChange={(event) => setForm((current) => ({ ...current, unitId: event.target.value }))} className={selectClassName}>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.projectName} / {unit.code} / {formatCurrency(unit.finalPrice)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Payment plan</label>
              <select value={form.paymentPlanType} onChange={(event) => setForm((current) => ({ ...current, paymentPlanType: event.target.value }))} className={selectClassName}>
                {bookingsQuery.data.paymentPlanTypes.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4 text-body text-text-secondary">
              Booking confirmation will reserve the unit, create or update the customer profile, generate the payment schedule, and move the lead to closed won.
            </div>
            <div className="flex justify-end">
              <Button loading={bookingMutation.isPending} onClick={() => bookingMutation.mutate()}>
                <UserRoundCheck className="h-4 w-4" />
                Confirm Booking
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unit Reservations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Lead</label>
                <select value={reserveForm.leadId} onChange={(e) => setReserveForm((f) => ({ ...f, leadId: e.target.value }))} className={selectClassName}>
                  <option value="">Select lead</option>
                  {leads.slice(0, 10).map((lead) => (
                    <option key={lead.id} value={lead.id}>{lead.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Unit</label>
                <select value={reserveForm.unitId} onChange={(e) => setReserveForm((f) => ({ ...f, unitId: e.target.value }))} className={selectClassName}>
                  <option value="">Select unit</option>
                  {units.slice(0, 20).map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.projectName} / {unit.code}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Notes</label>
                <Input value={reserveForm.notes} onChange={(e) => setReserveForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Hold reason" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                loading={reserveMutation.isPending}
                disabled={!reserveForm.leadId || !reserveForm.unitId}
                onClick={() => reserveMutation.mutate()}
              >
                <CalendarClock className="h-4 w-4" />
                Reserve Unit (7-day hold)
              </Button>
            </div>

            {(reservationsQuery.data?.reservations || []).length > 0 && (
              <div className="overflow-auto">
                <table className="w-full text-table">
                  <thead className="bg-surface-secondary text-text-secondary">
                    <tr className="h-10 border-b border-border-soft">
                      <th className="px-3 text-left">Lead</th>
                      <th className="px-3 text-left">Unit</th>
                      <th className="px-3 text-left">Expires</th>
                      <th className="px-3 text-left">Status</th>
                      <th className="px-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reservationsQuery.data?.reservations || []).slice(0, 5).map((r) => (
                      <tr key={r.id} className="border-t border-border-soft">
                        <td className="px-3 py-3 text-body text-text-primary">{r.leadName}</td>
                        <td className="px-3 py-3 text-body">{r.unitCode}</td>
                        <td className="px-3 py-3 text-body">{formatDate(r.expiresAt)}</td>
                        <td className="px-3 py-3">
                          <Badge tone={r.isExpired ? "error" : "warning"}>{r.isExpired ? "Expired" : "Held"}</Badge>
                        </td>
                        <td className="px-3 py-3">
                          {!r.isExpired && (
                            <Button size="sm" variant="ghost" loading={releaseReserveMutation.isPending} onClick={() => releaseReserveMutation.mutate(r.id)}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function BrokersWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    commissionRate: "2",
  });

  const brokersQuery = useQuery({
    queryKey: ["erp-brokers-register", role],
    queryFn: async () => (await apiRequest<Broker[]>("/api/customers/brokers", { role })).data,
  });
  const leadsQuery = useQuery({
    queryKey: ["erp-leads", role],
    queryFn: async () => (await apiRequest<LeadListResponse>("/api/leads", { role })).data,
  });

  const createBrokerMutation = useMutation({
    mutationFn: async () =>
      apiRequest<Broker>("/api/customers/brokers", {
        role,
        method: "POST",
        body: {
          name: form.name,
          commissionRate: Number(form.commissionRate),
        },
      }),
    onSuccess: async () => {
      setForm({
        name: "",
        commissionRate: "2",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-brokers-register"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-brokers"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
      ]);
    },
  });

  if (brokersQuery.isLoading || leadsQuery.isLoading) {
    return <LoadingStateCard title="Loading broker management workspace" />;
  }

  if (brokersQuery.error || leadsQuery.error || !brokersQuery.data || !leadsQuery.data) {
    return <ErrorStateCard message="Broker operations could not be loaded from the ERP backend." />;
  }

  const liveDealCountByBrokerId = new Map<string, number>();
  leadsQuery.data.items.forEach((lead) => {
    if (!lead.brokerId || lead.stage === "Closed Lost") {
      return;
    }

    liveDealCountByBrokerId.set(lead.brokerId, (liveDealCountByBrokerId.get(lead.brokerId) || 0) + 1);
  });

  const brokers = brokersQuery.data.map((broker) => ({
    ...broker,
    activeDeals: liveDealCountByBrokerId.get(broker.id) ?? broker.activeDeals,
  }));
  const averageCommission = brokers.length
    ? brokers.reduce((sum, broker) => sum + broker.commissionRate, 0) / brokers.length
    : 0;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Broker Register"
        description="Maintain external broker records, track live broker-sourced opportunities, and keep the lead-assignment bench current for the sales team."
      />

      <KpiGrid
        items={[
          { label: "Registered Brokers", value: `${brokers.length}`, trend: "Available partner records", tone: "info" },
          { label: "Engaged Brokers", value: `${brokers.filter((broker) => broker.activeDeals > 0).length}`, trend: "With live opportunities", tone: "success" },
          { label: "Broker-Sourced Leads", value: `${leadsQuery.data.items.filter((lead) => lead.brokerId).length}`, trend: "Total sourced pipeline", tone: "warning" },
          { label: "Avg Commission", value: `${averageCommission.toFixed(1)}%`, trend: "Current commercial benchmark", tone: "info" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Broker Register</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[720px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Broker</th>
                    <th className="px-4 text-left">Commission</th>
                    <th className="px-4 text-left">Active Deals</th>
                    <th className="px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {brokers.map((broker) => (
                    <tr key={broker.id} className="border-t border-border-soft">
                      <td className="px-4 py-4 text-text-primary">{broker.name}</td>
                      <td className="px-4 py-4">{broker.commissionRate}%</td>
                      <td className="px-4 py-4">{broker.activeDeals}</td>
                      <td className="px-4 py-4">
                        <Badge tone={broker.activeDeals > 0 ? "success" : "neutral"}>
                          {broker.activeDeals > 0 ? "Engaged" : "Dormant"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Broker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Broker name</label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Commission rate (%)</label>
              <Input value={form.commissionRate} onChange={(event) => setForm((current) => ({ ...current, commissionRate: event.target.value }))} />
            </div>
            <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4 text-body text-text-secondary">
              New brokers become selectable immediately during lead capture for direct attribution and active-deal tracking.
            </div>
            <div className="flex justify-end">
              <Button loading={createBrokerMutation.isPending} onClick={() => createBrokerMutation.mutate()}>
                <Building2 className="h-4 w-4" />
                Save Broker
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function FollowUpsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [form, setForm] = useState({
    assignedTo: "",
    followUpAt: "",
    notes: "",
  });

  const leadsQuery = useQuery({
    queryKey: ["erp-leads", role],
    queryFn: async () => (await apiRequest<LeadListResponse>("/api/leads", { role })).data,
  });
  const siteVisitsQuery = useQuery({
    queryKey: ["erp-site-visits", role],
    queryFn: async () => (await apiRequest<SiteVisitsResponse>("/api/leads/site-visits", { role })).data,
  });
  const usersQuery = useSalesUsers();
  const updateLeadMutation = useMutation({
    mutationFn: async () =>
      apiRequest<Lead>(`/api/leads/${editingLeadId}`, {
        role,
        method: "PATCH",
        body: form,
      }),
    onSuccess: async () => {
      setEditingLeadId(null);
      setForm({
        assignedTo: "",
        followUpAt: "",
        notes: "",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-lead-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-pipeline"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });
  const advanceStageMutation = useMutation({
    mutationFn: async ({ leadId, stage }: { leadId: string; stage: string }) =>
      apiRequest<Lead>(`/api/leads/${leadId}/stage`, {
        role,
        method: "PATCH",
        body: { stage },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-lead-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-pipeline"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard-reports"] }),
      ]);
    },
  });

  if (leadsQuery.isLoading || siteVisitsQuery.isLoading || usersQuery.isLoading) {
    return <LoadingStateCard title="Loading follow-up workspace" />;
  }

  if (leadsQuery.error || siteVisitsQuery.error || usersQuery.error || !leadsQuery.data || !siteVisitsQuery.data || !usersQuery.data) {
    return <ErrorStateCard message="Lead follow-up data could not be loaded." />;
  }

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const followUps = leadsQuery.data.items
    .filter((lead) => !["Closed Won", "Closed Lost"].includes(lead.stage))
    .filter((lead) => {
      if (!deferredSearch.trim()) {
        return true;
      }

      const needle = deferredSearch.toLowerCase();
      return (
        lead.fullName.toLowerCase().includes(needle) ||
        lead.projectName.toLowerCase().includes(needle) ||
        lead.assignedToName.toLowerCase().includes(needle)
      );
    })
    .sort((left, right) => new Date(left.followUpAt).getTime() - new Date(right.followUpAt).getTime());

  const overdue = followUps.filter((lead) => new Date(lead.followUpAt).getTime() < now);
  const dueToday = followUps.filter((lead) => {
    const date = new Date(lead.followUpAt);
    const current = new Date(now);
    return date.toDateString() === current.toDateString();
  });
  const withVisits = new Set(siteVisitsQuery.data.visits.map((visit) => visit.leadId));
  const nextVisits = siteVisitsQuery.data.visits
    .filter((visit) => visit.status === "Scheduled")
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime())
    .slice(0, 5);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Sales Follow-Ups"
        description="Work the upcoming contact queue, surface overdue actions, and keep site visits aligned with the live lead pipeline."
      />

      <KpiGrid
        items={[
          { label: "Open Follow-Ups", value: `${followUps.length}`, trend: "Leads needing touchpoints", tone: "info" },
          { label: "Overdue", value: `${overdue.length}`, trend: "Require immediate action", tone: overdue.length > 0 ? "warning" : "success" },
          { label: "Due Today", value: `${dueToday.length}`, trend: "Priority for the current shift", tone: "warning" },
          { label: "Visit-Linked", value: `${followUps.filter((lead) => withVisits.has(lead.id)).length}`, trend: "Mapped to site visits", tone: "success" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <CardTitle>Follow-Up Queue</CardTitle>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="max-w-sm bg-surface-secondary"
                placeholder="Search lead, project, or owner"
              />
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[860px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">Lead</th>
                    <th className="px-4 text-left">Project</th>
                    <th className="px-4 text-left">Owner</th>
                    <th className="px-4 text-left">Stage</th>
                    <th className="px-4 text-left">Follow-Up</th>
                    <th className="px-4 text-left">Visit</th>
                    <th className="px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.map((lead) => {
                    const nextStage = nextSalesStage(lead.stage);
                    return (
                    <tr key={lead.id} className="border-t border-border-soft">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-text-primary">{lead.fullName}</p>
                          <p className="text-label text-text-muted">{lead.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">{lead.projectName}</td>
                      <td className="px-4 py-4">{lead.assignedToName}</td>
                      <td className="px-4 py-4">
                        <Badge tone={toneForStage(lead.stage)}>{lead.stage}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-text-primary">{formatDateTime(lead.followUpAt)}</p>
                          <p className="text-label text-text-muted">{new Date(lead.followUpAt).getTime() < now ? "Overdue" : "Scheduled"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={withVisits.has(lead.id) ? "success" : "neutral"}>
                          {withVisits.has(lead.id) ? "Visit Linked" : "No Visit"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingLeadId(lead.id);
                              setForm({
                                assignedTo: lead.assignedTo,
                                followUpAt: lead.followUpAt.slice(0, 16),
                                notes: lead.notes,
                              });
                            }}
                          >
                            Reschedule
                          </Button>
                          {nextStage ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={advanceStageMutation.isPending}
                              onClick={() => advanceStageMutation.mutate({ leadId: lead.id, stage: nextStage })}
                            >
                              Advance
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingLeadId ? "Update Follow-Up" : "Upcoming Site Visits"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {editingLeadId ? (
              <>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Assigned owner</label>
                  <select value={form.assignedTo} onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))} className={selectClassName}>
                    {usersQuery.data.users
                      .filter((user) => user.role === "sales" || user.role === "manager")
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Follow-up time</label>
                  <Input type="datetime-local" value={form.followUpAt} onChange={(event) => setForm((current) => ({ ...current, followUpAt: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Notes</label>
                  <textarea className={textareaClassName} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1" loading={updateLeadMutation.isPending} onClick={() => updateLeadMutation.mutate()}>
                    Save Follow-Up
                  </Button>
                  <Button
                    className="flex-1"
                    variant="ghost"
                    onClick={() => {
                      setEditingLeadId(null);
                      setForm({
                        assignedTo: "",
                        followUpAt: "",
                        notes: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              nextVisits.map((visit) => (
                <div key={visit.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-card-title text-text-primary">{visit.leadName}</p>
                    <Badge tone={toneForStatus(visit.status)}>{visit.status}</Badge>
                  </div>
                  <p className="mt-2 text-body text-text-secondary">{visit.projectName}</p>
                  <p className="mt-1 text-label text-text-muted">Coordinator: {visit.coordinatorName}</p>
                  <p className="mt-2 text-label text-text-primary">{formatDateTime(visit.scheduledAt)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function SalesInsightsWorkspace() {
  const role = useUiStore((state) => state.role);

  const statsQuery = useQuery({
    queryKey: ["erp-lead-stats", role],
    queryFn: async () => (await apiRequest<LeadStats>("/api/leads/stats", { role })).data,
  });
  const leadsQuery = useQuery({
    queryKey: ["erp-leads", role],
    queryFn: async () => (await apiRequest<LeadListResponse>("/api/leads", { role })).data,
  });
  const propertiesQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });
  const bookingsQuery = useQuery({
    queryKey: ["erp-bookings", role],
    queryFn: async () => (await apiRequest<BookingResponse>("/api/bookings", { role })).data,
  });

  if (statsQuery.isLoading || leadsQuery.isLoading || propertiesQuery.isLoading || bookingsQuery.isLoading) {
    return <LoadingStateCard title="Loading sales insights workspace" />;
  }

  if (statsQuery.error || leadsQuery.error || propertiesQuery.error || bookingsQuery.error || !statsQuery.data || !leadsQuery.data || !propertiesQuery.data || !bookingsQuery.data) {
    return <ErrorStateCard message="Sales analytics could not be loaded." />;
  }

  const totalLeadBase = statsQuery.data.activeLeads + statsQuery.data.bookedThisCycle;
  const conversionRate = totalLeadBase > 0 ? (statsQuery.data.bookedThisCycle / totalLeadBase) * 100 : 0;
  const activeBookings = bookingsQuery.data.bookings.filter((booking) => booking.status !== "Cancelled");
  const sourceCounts = Array.from(
    leadsQuery.data.items.reduce((map, lead) => {
      map.set(lead.source, (map.get(lead.source) || 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((left, right) => right[1] - left[1]);
  const projectDemand = propertiesQuery.data.projects
    .map((project) => ({
      ...project,
      demand: leadsQuery.data.items.filter((lead) => lead.preferredProjectId === project.id).length,
    }))
    .sort((left, right) => right.demand - left.demand)
    .slice(0, 5);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Sales Insights"
        description="Read demand, conversion, and inventory pressure from live ERP data so commercial decisions stay inside the web portal."
      />

      <KpiGrid
        items={[
          { label: "Lead Conversion", value: `${conversionRate.toFixed(1)}%`, trend: "Lead to active booking", tone: "success" },
          { label: "Open Pipeline", value: `${statsQuery.data.activeLeads}`, trend: "Non-closed sales opportunities", tone: "info" },
          { label: "Active Bookings", value: `${activeBookings.length}`, trend: "Commercially live closures", tone: "success" },
          { label: "Scheduled Visits", value: `${statsQuery.data.scheduledVisits}`, trend: "Near-term conversion pool", tone: "warning" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sourceCounts.map(([source, count]) => {
              const width = sourceCounts[0]?.[1] ? (count / sourceCounts[0][1]) * 100 : 0;
              return (
                <div key={source} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-body text-text-primary">{source}</p>
                    <Badge tone="info">{count}</Badge>
                  </div>
                  <div className="h-2 rounded-full bg-surface-secondary">
                    <div className="h-2 rounded-full bg-accent-primary" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Demand vs Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectDemand.map((project) => (
              <div key={project.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-card-title text-text-primary">{project.name}</p>
                    <p className="text-label text-text-muted">{project.location}</p>
                  </div>
                  <Badge tone={project.availableUnits > 0 ? "success" : "warning"}>{project.availableUnits} open</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-body text-text-secondary">
                  <div>
                    <p className="text-label text-text-muted">Demand</p>
                    <p className="text-text-primary">{project.demand}</p>
                  </div>
                  <div>
                    <p className="text-label text-text-muted">Booked</p>
                    <p className="text-text-primary">{project.bookedUnits}</p>
                  </div>
                  <div>
                    <p className="text-label text-text-muted">Stage</p>
                    <p className="text-text-primary">{project.stage}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stage Movement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statsQuery.data.stageCounts.map((item) => (
              <div key={item.stage} className="flex items-center justify-between rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary px-4 py-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-accent-primary" />
                  <p className="text-body text-text-primary">{item.stage}</p>
                </div>
                <Badge tone={toneForStage(item.stage)}>{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Closures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-card-title text-text-primary">{booking.customerName}</p>
                  <Badge tone={toneForStatus(booking.status)}>{booking.status}</Badge>
                </div>
                <p className="mt-2 text-body text-text-secondary">
                  {booking.projectName} / {booking.unitCode}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 text-label text-text-muted">
                  <span>{booking.paymentPlanType}</span>
                  <span>{formatDate(booking.bookingDate)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
