"use client";
import { toast } from "@/components/ui/toast";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { SectionHeader } from "@/components/erp/page-primitives";
import { Button } from "@/components/ui/button";
import { Download, FileText, Settings, ShieldAlert, CheckCircle2 } from "lucide-react";
import { PayrollResponse } from "@/types/payroll";

import { PayrollKpiCards } from "./payroll-kpi-cards";
import { PayrollInsights } from "./payroll-insights";
import { PayrollAnalytics } from "./payroll-analytics";
import { PayrollRegister } from "./payroll-register";
import { PayrollBreakdown } from "./payroll-breakdown";
import { PayrollProjectCosts } from "./payroll-project-costs";
import { PayrollProductivity } from "./payroll-productivity";

export function PayrollWorkspace() {
  const role = useUiStore((state) => state.role);
  
  // Filters State
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    projectId: "",
    status: "",
    page: 1,
    limit: 20,
  });

  // Projects Query
  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => {
      const res = await apiRequest<{ projects: { id: string; name: string }[] }>("/api/properties/summary", { role });
      return res.data;
    },
  });

  // Payroll Query
  const payrollQuery = useQuery({
    queryKey: ["erp-payroll", filters, role],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.department) params.append("department", filters.department);
      if (filters.projectId) params.append("projectId", filters.projectId);
      if (filters.status) params.append("status", filters.status);
      params.append("page", String(filters.page));
      params.append("limit", String(filters.limit));

      const res = await apiRequest<PayrollResponse>(`/api/workforce/payroll?${params.toString()}`, { role });
      return res.data;
    },
  });

  const handleExport = () => {
    toast.info("Exporting payroll cost data to CSV...");
  };

  const handleGenerateReport = () => {
    toast.info("Generating strategic workforce cost report PDF...");
  };

  const handleOpenSettings = () => {
    toast.info("Opening payroll configuration and rate tier settings...");
  };

  const handleInsightAction = (actionName: string, detail: any) => {
    toast.info(`Executing action "${actionName}" for alert: ${detail.title}`);
  };

  return (
    <section className="space-y-6 pb-12">
      {/* Section 1: Hero */}
      <SectionHeader
        title="Workforce Cost Center"
        description="Monitor payroll performance, workforce cost distribution, labor efficiency, attendance impact, and staffing expenditure across all active projects."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 px-3.5 border-border-strong font-medium text-text-primary hover:bg-surface-secondary gap-1.5"
              onClick={handleOpenSettings}
            >
              <Settings className="h-4 w-4" />
              Payroll Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 px-3.5 border-border-strong font-medium text-text-primary hover:bg-surface-secondary gap-1.5"
              onClick={handleGenerateReport}
            >
              <FileText className="h-4 w-4" />
              Generate Payroll Report
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="text-xs h-9 px-4 font-semibold gap-1.5"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              Export Payroll
            </Button>
          </div>
        }
      />

      {/* Section 2: KPI Grid */}
      <PayrollKpiCards summaries={payrollQuery.data?.summaries} isLoading={payrollQuery.isLoading} />

      {/* Section 3: Intelligence Insights */}
      <PayrollInsights
        recommendations={payrollQuery.data?.recommendations}
        isLoading={payrollQuery.isLoading}
        onExecuteAction={handleInsightAction}
      />

      {/* Section 4: Analytics graphs */}
      <PayrollAnalytics analytics={payrollQuery.data?.analytics} isLoading={payrollQuery.isLoading} />

      {/* Section 5: Cost Register */}
      <PayrollRegister
        data={payrollQuery.data}
        isLoading={payrollQuery.isLoading}
        filters={filters}
        setFilters={setFilters}
        projects={projectsQuery.data?.projects || []}
        onExport={handleExport}
      />

      {/* Section 6: Breakdown Panel */}
      <PayrollBreakdown data={payrollQuery.data} isLoading={payrollQuery.isLoading} />

      {/* Section 8: Productivity Matrix */}
      <PayrollProductivity matrix={payrollQuery.data?.productivityMatrix} isLoading={payrollQuery.isLoading} />

      {/* Section 7: Project Cost Overview */}
      <PayrollProjectCosts projectCosts={payrollQuery.data?.projectLaborCosts} isLoading={payrollQuery.isLoading} />
    </section>
  );
}
