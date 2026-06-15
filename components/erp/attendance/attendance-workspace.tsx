"use client";
import { toast } from "@/components/ui/toast";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { SectionHeader } from "@/components/erp/page-primitives";
import { Button } from "@/components/ui/button";
import { Plus, Download, Settings, Cpu, AlertTriangle } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";

import { AttendanceKpiCards } from "./attendance-kpi-cards";
import { AttendanceInsights } from "./attendance-insights";
import { AttendanceAnalytics } from "./attendance-analytics";
import { AttendanceFilters } from "./attendance-filters";
import { AttendanceRegister } from "./attendance-register";
import { AttendancePendingCheckins } from "./attendance-pending-checkins";
import { AttendanceIntegrations } from "./attendance-integrations";
import { AttendanceDrawer } from "./attendance-drawer";

// Fetch type interfaces
type Employee = {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  department: string;
};

type Project = {
  id: string;
  name: string;
};

type KpiItem = {
  value: string | number;
  trend: string;
  trendType: "up" | "down" | "neutral" | "warning";
  status: string;
  sparkline: number[];
};

type AttendanceKpis = {
  presentToday: KpiItem;
  attendanceRate: KpiItem;
  absentEmployees: KpiItem;
  lateCheckins: KpiItem;
  activeSites: KpiItem;
  workforceAvailability: KpiItem;
};

type TrendData = {
  date: string;
  percentage: number;
  present: number;
  total: number;
};

type DepartmentData = {
  department: string;
  rate: number;
  present: number;
  total: number;
};

type SiteData = {
  site: string;
  count: number;
  percentage: number;
};

type LateData = {
  date: string;
  count: number;
};

type AttendanceAnalyticsData = {
  attendanceTrend: TrendData[];
  departmentAttendance: DepartmentData[];
  siteAttendance: SiteData[];
  lateArrivalTrend: LateData[];
};

type PendingEmployee = {
  id: string;
  name: string;
  department: string;
  designation: string;
  projectName: string;
};

type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDesignation: string;
  employeeDepartment: string;
  projectName: string;
  projectSite: string;
  shift: string;
  checkIn: string;
  checkOut: string | null;
  hoursWorked: number | null;
  status: "Present" | "Late" | "Absent" | "Half Day";
  remarks?: string;
  location?: string;
  supervisorNotes?: string;
};

type AttendanceListResponse = {
  attendance: AttendanceRecord[];
  snapshotDate: string;
  summary: {
    present: number;
    late: number;
    absent: number;
  };
  pagination: {
    totalCount: number;
    page: number;
    limit: number;
    pageCount: number;
  };
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

export function AttendanceWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);

  // Table Filters State
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    department: "",
    projectId: "",
    startDate: "",
    endDate: "",
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // 1. Fetch KPI Overview
  const overviewQuery = useQuery({
    queryKey: ["erp-attendance", "overview", role],
    queryFn: async () => (await apiRequest<AttendanceKpis>("/api/workforce/attendance/overview", { role })).data,
  });

  // 2. Fetch Analytics
  const analyticsQuery = useQuery({
    queryKey: ["erp-attendance", "analytics", role],
    queryFn: async () => (await apiRequest<AttendanceAnalyticsData>("/api/workforce/attendance/analytics", { role })).data,
  });

  // 3. Fetch Pending Check-ins
  const pendingQuery = useQuery({
    queryKey: ["erp-attendance", "pending", role],
    queryFn: async () => (await apiRequest<PendingEmployee[]>("/api/workforce/attendance/pending-checkins", { role })).data,
  });

  // 4. Fetch Employees (for dropdown inside drawer)
  const employeesQuery = useQuery({
    queryKey: ["erp-employees", role],
    queryFn: async () => (await apiRequest<{ employees: Employee[] }>("/api/workforce/employees", { role })).data,
  });

  // 5. Fetch Projects (for filter selectors)
  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<{ projects: Project[] }>("/api/properties/summary", { role })).data,
  });

  // 6. Fetch Register (History List Table)
  const registerQuery = useQuery({
    queryKey: ["erp-attendance", "list", filters, page, limit, role],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.department) params.append("department", filters.department);
      if (filters.projectId) params.append("projectId", filters.projectId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("page", String(page));
      params.append("limit", String(limit));

      const path = `/api/workforce/attendance?${params.toString()}`;
      return (await apiRequest<AttendanceListResponse>(path, { role })).data;
    },
  });

  // 7. Add Attendance Mutation
  const addAttendanceMutation = useMutation({
    mutationFn: async (body: AttendancePayload) =>
      apiRequest("/api/workforce/attendance", {
        role,
        method: "POST",
        body,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-attendance"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-project-risk"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
      ]);
      toast.success("Attendance log successfully created!");
    },
  });

  // Reset filter selections
  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "",
      department: "",
      projectId: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };

  // Export report mock action
  const handleExport = () => {
    toast.info("Exporting workforce attendance intelligence report (CSV)...");
  };

  // Generate department list for filters based on employees loaded
  const departmentOptions = [
    "Projects",
    "Procurement",
    "Finance",
    "Sales",
    "Admin",
    "Quality",
    "Planning",
    "HSE",
  ];

  return (
    <section className="space-y-6">
      
      {/* Section 1 - Workforce Attendance Hero */}
      <SectionHeader
        title="Attendance Operations"
        description="Monitor workforce attendance, site deployment, workforce availability, absentee trends, and attendance performance across all active projects."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={handleExport} className="h-10">
              <Download className="mr-1.5 h-4 w-4" /> Export Attendance
            </Button>
            <Button variant="secondary" onClick={() => setIntegrationsOpen(true)} className="h-10">
              <Cpu className="mr-1.5 h-4 w-4" /> Biometric Setup
            </Button>
            <Button variant="secondary" onClick={() => toast.info("Attendance Settings panel opened.")} className="h-10">
              <Settings className="mr-1.5 h-4 w-4" /> Attendance Settings
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPendingOpen(true)}
              className="h-10 border-warning/30 hover:bg-warning/5 text-warning relative"
            >
              <AlertTriangle className="mr-1.5 h-4 w-4" />
              Pending Check-ins
              {pendingQuery.data && pendingQuery.data.length > 0 && (
                <span className="ml-1.5 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                  {pendingQuery.data.length}
                </span>
              )}
            </Button>
            <Button onClick={() => setDrawerOpen(true)} className="h-10">
              <Plus className="mr-1.5 h-4 w-4" /> Add Attendance
            </Button>
          </div>
        }
      />

      {/* Section 2 - Attendance KPI Grid */}
      <AttendanceKpiCards
        kpis={overviewQuery.data}
        isLoading={overviewQuery.isLoading}
      />

      {/* Section 3 - Attendance Intelligence */}
      <AttendanceInsights
        attendanceRate={parseFloat(String(overviewQuery.data?.attendanceRate?.value || "0"))}
        lateCount={Number(overviewQuery.data?.lateCheckins?.value || 0)}
      />

      {/* Section 4 - Attendance Overview Analytics */}
      <AttendanceAnalytics
        analyticsData={analyticsQuery.data}
        isLoading={analyticsQuery.isLoading}
      />

      {/* Section 5 & 6 - Register & Pending check-ins */}
      <div className="space-y-4">
        <h2 className="text-section-title font-secondary text-text-primary">
          Attendance Logs & Alerts
        </h2>
        
        {/* Filters Toolbar */}
        <AttendanceFilters
          filters={filters}
          setFilters={setFilters}
          projects={projectsQuery.data?.projects || []}
          departments={departmentOptions}
          onReset={handleResetFilters}
          onExport={handleExport}
        />

        <div className="space-y-4 min-w-0">
          <AttendanceRegister
            records={registerQuery.data?.attendance || []}
            pagination={
              registerQuery.data?.pagination || {
                totalCount: 0,
                page: 1,
                limit: 20,
                pageCount: 1,
              }
            }
            isLoading={registerQuery.isLoading}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Add Attendance Drawer */}
      <AttendanceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        employees={employeesQuery.data?.employees || []}
        onSubmit={async (data) => {
          await addAttendanceMutation.mutateAsync(data);
        }}
        isSubmitting={addAttendanceMutation.isPending}
      />

      {/* Biometric Integrations Drawer */}
      <Drawer
        open={integrationsOpen}
        title="Biometric Integrations"
        onClose={() => setIntegrationsOpen(false)}
        size="md"
      >
        <AttendanceIntegrations />
      </Drawer>

      {/* Pending Check-ins Drawer */}
      <Drawer
        open={pendingOpen}
        title="Today's Pending Check-ins"
        onClose={() => setPendingOpen(false)}
        size="lg"
      >
        <AttendancePendingCheckins
          pendingList={pendingQuery.data || []}
          isLoading={pendingQuery.isLoading}
        />
      </Drawer>

    </section>
  );
}
