"use client";
import { toast } from "@/components/ui/toast";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { SectionHeader } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, BarChart4, Download } from "lucide-react";
import { LoadingStateCard, ErrorStateCard } from "@/components/erp/live-state";
import {
  LeadListResponse,
  SiteVisitsResponse,
  UserDirectoryResponse,
  PropertySummaryResponse,
  BookingResponse,
  Lead,
} from "@/lib/erp-types";

// Import subcomponents
import { ActionScore } from "./action-score";
import { ExecutiveSummary } from "./executive-summary";
import { KpiGrid } from "./kpi-grid";
import { IntelligenceCenter } from "./intelligence-center";
import { FollowUpAnalytics } from "./follow-up-analytics";
import { EffectivenessCenter } from "./effectiveness-center";
import { TeamPerformance } from "./team-performance";
import { HighPriorityOpportunities } from "./high-priority-opportunities";
import { FollowUpRegister } from "./follow-up-register";
import { FollowUpDrawer } from "./follow-up-drawer";

export function FollowUpsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  // Scroll references
  const analyticsRef = useRef<HTMLDivElement>(null);
  const ledgerRef = useRef<HTMLDivElement>(null);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<Lead | undefined>(undefined);

  // API Queries
  const leadsQuery = useQuery({
    queryKey: ["erp-leads", role],
    queryFn: async () => (await apiRequest<LeadListResponse>("/api/leads", { role })).data,
  });

  const siteVisitsQuery = useQuery({
    queryKey: ["erp-site-visits", role],
    queryFn: async () => (await apiRequest<SiteVisitsResponse>("/api/leads/site-visits", { role })).data,
  });

  const usersQuery = useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const bookingsQuery = useQuery({
    queryKey: ["erp-bookings", role],
    queryFn: async () => (await apiRequest<BookingResponse>("/api/bookings", { role })).data,
  });

  // Mutate endpoints
  const createLeadMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Find lead info to mock
      const lead = (leadsQuery.data?.items || []).find((l) => l.id === payload.leadId);
      const project = (projectsQuery.data?.projects || []).find((p) => p.id === payload.projectId);
      const owner = (usersQuery.data?.users || []).find((u) => u.id === payload.ownerId);

      return apiRequest<Lead>("/api/leads", {
        role,
        method: "POST",
        body: {
          firstName: lead?.firstName || "New",
          lastName: lead?.lastName || "Follow-up",
          phone: lead?.phone || "+91 99999 88888",
          email: lead?.email || "followup@example.com",
          preferredProjectId: payload.projectId,
          assignedTo: payload.ownerId,
          source: lead?.source || "Website",
          followUpAt: payload.followUpAt,
          notes: payload.notes,
          budgetMin: lead?.budgetMin || 5000000,
          budgetMax: lead?.budgetMax || 10000000,
        },
      });
    },
    onSuccess: async () => {
      setIsDrawerOpen(false);
      await invalidateAll();
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiRequest<Lead>(`/api/leads/${payload.leadId}`, {
        role,
        method: "PATCH",
        body: {
          followUpAt: payload.followUpAt,
          notes: payload.notes,
          assignedTo: payload.ownerId,
          preferredProjectId: payload.projectId,
        },
      });
    },
    onSuccess: async () => {
      setIsDrawerOpen(false);
      setDrawerData(undefined);
      await invalidateAll();
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      // Simulate delete or archive lead
      toast.info(`Archiving/deleting follow-up lead record ${leadId}...`);
      return Promise.resolve();
    },
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  const advanceStageMutation = useMutation({
    mutationFn: async ({ leadId, stage }: { leadId: string; stage: string }) => {
      return apiRequest<Lead>(`/api/leads/${leadId}/stage`, {
        role,
        method: "PATCH",
        body: { stage },
      });
    },
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-site-visits"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-lead-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-bookings"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
    ]);
  };

  const handleRefresh = async () => {
    await invalidateAll();
  };

  const handleScrollToAnalytics = () => {
    analyticsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Intelligence action clicks mapping
  const handleIntelligenceAction = (actionType: string, payload?: any) => {
    if (actionType === "filter_overdue") {
      ledgerRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (actionType === "view_lead" && payload) {
      routerPush(`/sales/follow-ups/${payload}`);
    } else if (actionType === "filter_neglected") {
      ledgerRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (actionType === "schedule_visits") {
      routerPush("/sales/site-visits");
    } else if (actionType === "view_workload") {
      analyticsRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const routerPush = (path: string) => {
    // Navigate using browser location since router is client side
    window.location.href = path;
  };

  // Loading state
  if (
    leadsQuery.isLoading ||
    siteVisitsQuery.isLoading ||
    usersQuery.isLoading ||
    projectsQuery.isLoading ||
    bookingsQuery.isLoading
  ) {
    return <LoadingStateCard title="Loading Sales Action Command Center..." />;
  }

  // Error state
  if (
    leadsQuery.error ||
    siteVisitsQuery.error ||
    usersQuery.error ||
    projectsQuery.error ||
    bookingsQuery.error ||
    !leadsQuery.data ||
    !siteVisitsQuery.data ||
    !usersQuery.data ||
    !projectsQuery.data ||
    !bookingsQuery.data
  ) {
    return <ErrorStateCard message="Sales follow-up systems could not load from the ERP database." />;
  }

  const leads = leadsQuery.data.items;
  const visits = siteVisitsQuery.data.visits;
  const projects = projectsQuery.data.projects;
  const executives = usersQuery.data.users.filter((user) => user.role === "sales" || user.role === "manager");

  const handleFormSubmit = (formData: any) => {
    if (drawerData) {
      updateLeadMutation.mutate({ ...formData, leadId: drawerData.id });
    } else {
      createLeadMutation.mutate(formData);
    }
  };

  return (
    <section className="space-y-6 pb-12 animate-page-in">
      <SectionHeader
        title="Sales Follow-Up Center"
        description="Track customer engagement, monitor pending actions, reduce lead leakage, and improve conversion outcomes."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-border-strong text-text-secondary gap-1.5 h-10"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrollToAnalytics}
              className="border-border-strong text-text-secondary gap-1.5 h-10"
            >
              <BarChart4 className="h-4 w-4" />
              <span>Follow-Up Analytics</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setDrawerData(undefined);
                setIsDrawerOpen(true);
              }}
              className="text-white gap-1.5 h-10 font-semibold"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add Follow-Up</span>
            </Button>
          </div>
        }
      />

      {/* Top Section: Action Score & Executive Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActionScore leads={leads} />
        <ExecutiveSummary leads={leads} visits={visits} />
      </div>

      {/* Section 2: Executive KPI Grid */}
      <KpiGrid leads={leads} visits={visits} />

      {/* Section 3: Sales Intelligence Center */}
      <IntelligenceCenter leads={leads} visits={visits} onActionClick={handleIntelligenceAction} />

      {/* Section 4 & 5: Analytics and Effectiveness */}
      <div ref={analyticsRef} className="space-y-6 pt-2">
        <h3 className="text-section-title font-secondary text-text-primary">
          Engagement & Conversion Intelligence
        </h3>
        <FollowUpAnalytics leads={leads} />
        <EffectivenessCenter leads={leads} visits={visits} />
      </div>

      {/* Section 6 & 7: Team & Opportunities */}
      <div className="grid grid-cols-1 gap-6 pt-2">
        <TeamPerformance leads={leads} />
        <HighPriorityOpportunities leads={leads} />
      </div>

      {/* Section 8: Follow-Up Register Table */}
      <div ref={ledgerRef} className="pt-2">
        <FollowUpRegister
          leads={leads}
          projects={projects}
          executives={executives}
          visits={visits}
          onEdit={(lead) => {
            setDrawerData(lead);
            setIsDrawerOpen(true);
          }}
          onReschedule={(lead) => {
            setDrawerData(lead);
            setIsDrawerOpen(true);
          }}
          onDelete={(leadId) => deleteLeadMutation.mutate(leadId)}
          onAdvanceStage={(leadId, stage) => advanceStageMutation.mutate({ leadId, stage })}
        />
      </div>

      {/* Add / Edit Drawer */}
      <FollowUpDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerData(undefined);
        }}
        onSubmit={handleFormSubmit}
        leads={leads}
        projects={projects}
        executives={executives}
        initialData={drawerData}
      />
    </section>
  );
}
export default FollowUpsWorkspace;
