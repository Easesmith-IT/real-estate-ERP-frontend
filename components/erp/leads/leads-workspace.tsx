"use client";
import { toast } from "@/components/ui/toast";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { SectionHeader } from "@/components/erp/page-primitives";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, Settings, CalendarClock } from "lucide-react";
import { LeadsKpis } from "./leads-kpis";
import { LeadsIntelligence } from "./leads-intelligence";
import { LeadsFunnel } from "./leads-funnel";
import { LeadsAnalytics } from "./leads-analytics";
import { LeadsForecast } from "./leads-forecast";
import { LeadsFollowups } from "./leads-followups";
import { LeadsRegister } from "./leads-register";
import { LeadDrawer } from "./lead-drawer";
import { LeadViewDrawer } from "./lead-view-drawer";
import { Lead, LeadListResponse, CustomerResponse, PropertySummaryResponse, UserDirectoryResponse } from "@/lib/erp-types";
import { EnterprisePageLoader } from "@/components/ui/loaders";

export function LeadsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const [isFollowupsOpen, setIsFollowupsOpen] = useState(false);

  // Queries
  const leadsQuery = useQuery({
    queryKey: ["erp-leads", role],
    queryFn: async () => (await apiRequest<LeadListResponse>("/api/leads", { role })).data,
  });

  const statsQuery = useQuery({
    queryKey: ["erp-lead-stats", role],
    queryFn: async () => (await apiRequest<any>("/api/leads/stats", { role })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const usersQuery = useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });

  const customersQuery = useQuery({
    queryKey: ["erp-brokers", role],
    queryFn: async () => (await apiRequest<CustomerResponse>("/api/customers", { role })).data,
  });

  // Mutations
  const saveLeadMutation = useMutation({
    mutationFn: async (formData: any) => {
      const isEdit = Boolean(editingLead);
      const url = isEdit ? `/api/leads/${editingLead?.id}` : "/api/leads";
      const method = isEdit ? "PATCH" : "POST";
      
      return apiRequest(url, {
        role,
        method,
        body: {
          ...formData,
          budgetMin: Number(formData.budgetMin),
          budgetMax: Number(formData.budgetMax),
          brokerId: formData.brokerId || undefined,
        },
      });
    },
    onSuccess: async () => {
      setIsDrawerOpen(false);
      setEditingLead(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-lead-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
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
      ]);
    },
  });

  const createSiteVisitMutation = useMutation({
    mutationFn: async ({ leadId, projectId, coordinatorId, scheduledAt }: any) =>
      apiRequest("/api/leads/site-visits", {
        role,
        method: "POST",
        body: {
          leadId,
          projectId,
          coordinatorId,
          scheduledAt,
        },
      }),
    onSuccess: async () => {
      toast.success("Site visit scheduled successfully!");
      await queryClient.invalidateQueries({ queryKey: ["erp-lead-stats"] });
    },
  });

  // Derived options lists
  const projects = useMemo(() => projectsQuery.data?.projects || [], [projectsQuery.data]);
  const executives = useMemo(
    () => (usersQuery.data?.users || []).filter((u) => u.role === "sales" || u.role === "manager"),
    [usersQuery.data]
  );
  const brokers = useMemo(() => customersQuery.data?.brokers || [], [customersQuery.data]);

  // Actions
  const handleOpenAddDrawer = () => {
    setEditingLead(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (lead: Lead) => {
    setEditingLead(lead);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setEditingLead(null);
  };

  const handleDrawerSubmit = (formData: any) => {
    saveLeadMutation.mutate(formData);
  };

  const handleViewLeadDetail = (leadId: string) => {
    setIsFollowupsOpen(false); // Close follow-ups drawer if open
    setViewingLeadId(leadId);
  };

  const handleAdvanceStage = (leadId: string, currentStage: string) => {
    const stages = ["New", "Contacted", "Interested", "Site Visit Scheduled", "Negotiation", "Booking", "Closed Won"];
    const currentIdx = stages.indexOf(currentStage);
    if (currentIdx !== -1 && currentIdx < stages.length - 1) {
      const nextStage = stages[currentIdx + 1];
      advanceStageMutation.mutate({ leadId, stage: nextStage });
    } else {
      toast.info("Opportunity is already at final closure stage.");
    }
  };

  const handleScheduleVisit = (leadId: string) => {
    const lead = (leadsQuery.data?.items || []).find((l: Lead) => l.id === leadId);
    if (!lead || !projects[0] || !executives[0]) {
      toast.error("Unable to schedule: Projects or Sales agents are unavailable.");
      return;
    }
    
    // Auto-schedule demo visit 3 days out
    const scheduledTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    createSiteVisitMutation.mutate({
      leadId,
      projectId: lead.preferredProjectId || projects[0].id,
      coordinatorId: lead.assignedTo || executives[0].id,
      scheduledAt: scheduledTime,
    });
  };

  const handleIntelligenceAction = (actionKey: string) => {
    if (actionKey === "view-overdue") {
      toast.info("Filtering database for overdue follow-up records...");
    } else if (actionKey === "schedule-high-value") {
      toast.info("Filtering pipeline for premium site visit setups...");
    } else {
      toast.info(`Sales Intelligence Command executing action trigger: ${actionKey}`);
    }
  };

  if (leadsQuery.isLoading || statsQuery.isLoading || projectsQuery.isLoading || usersQuery.isLoading) {
    return <EnterprisePageLoader title="Sales Command Center" variant="dashboard" />;
  }

  return (
    <section className="space-y-6 pb-12">
      {/* Section 1: Hero header */}
      <SectionHeader
        title="Sales Command Center"
        description="Monitor lead performance, sales pipeline health, conversion opportunities, site visit effectiveness, and revenue forecasting across all active projects."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-label h-9 px-3 border-border-strong text-text-secondary hover:bg-surface-secondary gap-1.5"
              onClick={() => toast.info("Opening CRM settings page...")}
            >
              <Settings className="h-4 w-4" />
              Sales Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-label h-9 px-3 border-border-strong text-text-secondary hover:bg-surface-secondary gap-1.5"
              onClick={() => toast.info("Importing lead templates CSV...")}
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-label h-9 px-3 border-border-strong text-text-secondary hover:bg-surface-secondary gap-1.5"
              onClick={() => toast.info("Exporting sales dashboards...")}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-label h-9 px-3 border-border-strong text-text-secondary hover:bg-surface-secondary gap-1.5"
              onClick={() => setIsFollowupsOpen(true)}
            >
              <CalendarClock className="h-4 w-4 text-text-secondary" />
              Follow-Ups
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-9 px-4 font-semibold"
              onClick={handleOpenAddDrawer}
            >
              <span className="text-label flex items-center gap-1.5 text-white">
                <Plus className="h-4 w-4" />
                Add Lead
              </span>
            </Button>
          </div>
        }
      />

      {/* Section 2: KPIs */}
      <LeadsKpis kpis={statsQuery.data?.kpis} isLoading={statsQuery.isLoading} />

      {/* Section 3: Sales Intelligence */}
      <LeadsIntelligence onAction={handleIntelligenceAction} isLoading={statsQuery.isLoading} />

      {/* Funnel & Forecasting (Full Width) */}
      <div className="space-y-6">
        {/* Section 4: Funnel */}
        <LeadsFunnel stageCounts={statsQuery.data?.stageCounts} isLoading={statsQuery.isLoading} />
        {/* Section 6: Forecast */}
        <LeadsForecast kpis={statsQuery.data?.kpis} isLoading={statsQuery.isLoading} />
      </div>

      {/* Section 5: Analytics Grid */}
      <LeadsAnalytics leads={leadsQuery.data?.items} isLoading={leadsQuery.isLoading} />

      {/* Section 9: Register Table */}
      <div className="space-y-3">
        <h2 className="text-section-title font-secondary text-text-primary">Lead Pipeline Register</h2>
        <LeadsRegister
          leads={leadsQuery.data?.items}
          isLoading={leadsQuery.isLoading}
          projects={projects}
          executives={executives}
          onView={handleViewLeadDetail}
          onEdit={handleOpenEditDrawer}
          onAdvanceStage={handleAdvanceStage}
          onScheduleVisit={handleScheduleVisit}
        />
      </div>

      {/* Drawer */}
      <LeadDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onSubmit={handleDrawerSubmit}
        projects={projects}
        executives={executives}
        brokers={brokers}
        initialData={editingLead}
      />

      {/* Side Panel Quick View */}
      <LeadViewDrawer
        leadId={viewingLeadId}
        isOpen={Boolean(viewingLeadId)}
        onClose={() => setViewingLeadId(null)}
        role={role}
      />

      {/* Follow-Ups Side Panel Drawer */}
      <LeadsFollowups
        isOpen={isFollowupsOpen}
        onClose={() => setIsFollowupsOpen(false)}
        leads={leadsQuery.data?.items}
        isLoading={leadsQuery.isLoading}
        onViewLead={handleViewLeadDetail}
      />
    </section>
  );
}
