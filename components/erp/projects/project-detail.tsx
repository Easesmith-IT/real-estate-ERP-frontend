"use client";
import { toast } from "@/components/ui/toast";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { LoadingStateCard, ErrorStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  Layers,
  ArrowLeft,
  Edit2,
  Download,
  FileText,
  Users,
  CheckCircle2,
  ShieldAlert,
  Percent,
  Clock,
  Eye,
  Search,
  Plus,
  Activity,
  FileCheck,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  PropertySummaryResponse,
  BookingResponse,
  ProjectRiskResponse,
} from "@/lib/erp-types";
import {
  formatCr,
  getStageTone,
  getHealthTone,
  getHealthLabel,
  getRiskTone,
  calculateProjectHealth,
} from "./project-utils";

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all";

interface ProjectDetailProps {
  projectId: string;
}

const chartPalette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  amber: "#f59e0b",
  red: "#ef4444",
  green: "#22c55e",
  slate: "#64748b",
};

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const role = useUiStore((state) => state.role);
  const [activeTab, setActiveTab] = useState<
    "overview" | "inventory" | "financials" | "milestones" | "bookings" | "timeline" | "documents" | "risk"
  >("overview");

  // Inventory Table states
  const [search, setSearch] = useState("");
  const [unitStatusFilter, setUnitStatusFilter] = useState("All");

  // API Queries
  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const bookingsQuery = useQuery({
    queryKey: ["erp-bookings", role],
    queryFn: async () => (await apiRequest<BookingResponse>("/api/bookings", { role })).data,
  });

  const riskQuery = useQuery({
    queryKey: ["erp-projects-risk", role],
    queryFn: async () => (await apiRequest<ProjectRiskResponse>("/api/projects/risk", { role })).data,
  });

  // Actions
  const handleEdit = () => {
    toast.info("Project editing drawer is only available in management mode.");
  };

  const handleReport = () => {
    toast.info("Generating Executive PDF Performance Report...");
  };

  const handleExport = () => {
    toast.info("Exporting project ledger data...");
  };

  const handleBack = () => {
    window.location.href = "/projects";
  };

  // Loading & Error States
  if (projectsQuery.isLoading || bookingsQuery.isLoading || riskQuery.isLoading) {
    return <LoadingStateCard title="Loading Project Profile Workspace..." />;
  }

  if (projectsQuery.error || bookingsQuery.error || riskQuery.error || !projectsQuery.data || !bookingsQuery.data || !riskQuery.data) {
    return <ErrorStateCard message="Failed to load project details from ERP database." />;
  }

  const { projects, units } = projectsQuery.data;
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="space-y-4 text-center py-12">
        <h2 className="text-xl font-bold text-text-primary">Project Not Found</h2>
        <p className="text-text-secondary">The requested project ID does not exist in the ERP index.</p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Button>
      </div>
    );
  }

  const riskData = riskQuery.data;
  const allBookings = bookingsQuery.data.bookings || [];

  // Filter project resources
  const projectUnits = units.filter((u) => u.projectId === project.id);
  const projectBookings = allBookings.filter((b) => b.projectId === project.id);
  const riskProject = riskData.projects.find((p) => p.id === project.id || p.projectName === project.name);

  // Health Score calculations
  const health = calculateProjectHealth(project, riskData);
  const healthLabel = getHealthLabel(health);
  const healthTone = getHealthTone(health);
  const riskLevel = riskProject?.riskLevel || "Low";

  // Financial KPIs
  const totalUnitsValue = project.inventoryValue || projectUnits.reduce((sum, u) => sum + u.finalPrice, 0);
  const bookedRevenue = projectBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const outstandingCollections = projectBookings.reduce((sum, b) => sum + (b.outstandingAmount || 0), 0);
  
  // Calculate payments
  const collectedRevenue = bookedRevenue - outstandingCollections;
  const collectionRate = bookedRevenue ? Math.round((collectedRevenue / bookedRevenue) * 100) : 0;
  const revenuePotential = projectUnits.filter((u) => u.status === "available").reduce((sum, u) => sum + u.finalPrice, 0);

  // Inventory filter
  const filteredUnits = projectUnits.filter((unit) => {
    const matchesSearch =
      unit.code.toLowerCase().includes(search.toLowerCase()) ||
      unit.configuration.toLowerCase().includes(search.toLowerCase()) ||
      unit.towerName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = unitStatusFilter === "All" || unit.status === unitStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Mock Financial Charts Data
  const financialTrendData = Array.from({ length: 6 }, (_, i) => {
    const months = ["Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26"];
    const baseValue = totalUnitsValue * 0.15;
    return {
      month: months[i],
      "Booked Revenue": Math.round(baseValue * (0.8 + i * 0.15)),
      "Collections Received": Math.round(baseValue * (0.5 + i * 0.16)),
    };
  });

  const configCounts = projectUnits.reduce((acc: Record<string, number>, unit) => {
    acc[unit.configuration] = (acc[unit.configuration] || 0) + 1;
    return acc;
  }, {});
  const configChartData = Object.entries(configCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Timeline Progress Milestones
  const milestoneProgress = [
    { name: "Planning", status: "Completed", date: "Jul 2025", desc: "Master layout design & RERA approval filed." },
    { name: "Launch", status: "Completed", date: "Sep 2025", desc: "Sales office setup & premium showcase launch." },
    { name: "Inventory Release", status: project.stage === "Execution Planning" ? "Pending" : "Completed", date: "Dec 2025", desc: "First release phase of towers completed." },
    { name: "Construction Progress", status: ["Execution Planning", "Sales Launch", "Inventory Release"].includes(project.stage) ? "In Progress" : "Completed", date: "Mar 2026", desc: "Excavation and sub-structure foundation works." },
    { name: "Possession", status: "Pending", date: "Dec 2027", desc: "Superstructure completion and fit-out handovers." },
  ];

  // Risks Alerts list
  const projectRisks = riskData.alerts.filter((a) => a.projectId === project.id || a.projectName === project.name);

  // DPR Activity logs
  const mockActivities = [
    { time: "2h ago", title: "Daily field progress update submitted", actor: "Rohan Malhotra (Manager)", detail: "Excavation at 94% volume. Concrete pour scheduled for Tower B tomorrow." },
    { time: "1d ago", title: "Material supply check completed", actor: "Neha Suri (Finance)", detail: "Steel rebar shipment of 45 tons received and validated on site ledger." },
    { time: "3d ago", title: "RERA filing updated", actor: "Aditi Mehra (Admin)", detail: "Q3 progress audit certification uploaded to government portal." },
    { time: "1w ago", title: "New unit block released", actor: "Rohan Malhotra (Manager)", detail: "Released Tower C premium club-facing units into active inventory register." },
  ];

  // Document list
  const mockDocs = [
    { title: "RERA_Registration_Certificate_AUR.pdf", size: "2.4 MB", uploadedAt: "Sep 12, 2025", category: "Compliance" },
    { title: "Architectural_Master_Blueprint_v3.dwg", size: "14.8 MB", uploadedAt: "Oct 01, 2025", category: "Blueprint" },
    { title: "Structural_Design_Audit_Report.pdf", size: "4.1 MB", uploadedAt: "Nov 15, 2025", category: "Design" },
    { title: "Fire_NOC_Clearance_No_22.pdf", size: "1.8 MB", uploadedAt: "Jan 10, 2026", category: "NOC" },
  ];

  return (
    <section className="space-y-6 pb-12 animate-page-in">
      {/* Back button */}
      <div>
        <Button onClick={handleBack} variant="ghost" size="sm" className="text-text-secondary gap-1.5 h-10 hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Portfolio Center</span>
        </Button>
      </div>

      {/* Project Hero Section */}
      <Card className="border border-border-soft bg-gradient-to-r from-surface to-surface-secondary/20 shadow-premium">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5">
            {/* Top Row: Project Title & Stage Badge on left, KPIs on right */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <Building2 className="h-7 w-7 text-accent-primary shrink-0" />
                <h1 className="text-3xl font-bold font-secondary text-text-primary">{project.name}</h1>
                <Badge tone={getStageTone(project.stage)} className="font-semibold whitespace-nowrap shrink-0">
                  {project.stage}
                </Badge>
              </div>

              {/* Quick KPIs in Hero */}
              <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap shrink-0">
                <div className="text-center bg-surface border border-border-soft px-4 py-2.5 rounded-[var(--radius-input)] shadow-soft shrink-0">
                  <span className="text-label text-text-muted">Health Score</span>
                  <p className="mt-0.5">
                    <Badge tone={healthTone} className="font-bold whitespace-nowrap">
                      {health} - {healthLabel}
                    </Badge>
                  </p>
                </div>
                <div className="text-center bg-surface border border-border-soft px-4 py-2.5 rounded-[var(--radius-input)] shadow-soft shrink-0">
                  <span className="text-label text-text-muted">Portfolio Value</span>
                  <p className="text-lg font-bold text-text-primary mt-0.5 whitespace-nowrap">{formatCr(totalUnitsValue)}</p>
                </div>
                <div className="text-center bg-surface border border-border-soft px-4 py-2.5 rounded-[var(--radius-input)] shadow-soft shrink-0">
                  <span className="text-label text-text-muted">Revenue Potential</span>
                  <p className="text-lg font-bold text-accent-primary mt-0.5 whitespace-nowrap">{formatCr(revenuePotential)}</p>
                </div>
              </div>
            </div>

            {/* Visual Divider */}
            <div className="h-px bg-border-soft/60" />

            {/* Bottom Row: Metadata on left, Quick Actions on right */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <p className="text-body text-text-secondary">
                Project Code: <strong className="text-text-primary">{project.code}</strong> · Location: <strong className="text-text-primary">{project.location}</strong> · Manager: <strong className="text-text-primary">{project.managerName}</strong>
              </p>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                <Button variant="outline" size="sm" onClick={handleExport} className="border-border-strong text-text-secondary gap-1.5 h-10 shrink-0">
                  <Download className="h-4 w-4" />
                  <span>Export Ledger</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleReport} className="border-border-strong text-text-secondary gap-1.5 h-10 shrink-0">
                  <FileText className="h-4 w-4" />
                  <span>Generate Report</span>
                </Button>
                <Button variant="primary" size="sm" onClick={handleEdit} className="text-white gap-1.5 h-10 font-semibold shrink-0">
                  <Edit2 className="h-4 w-4" />
                  <span>Edit Project</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-border-soft overflow-x-auto scrollbar-none gap-2">
        {[
          { id: "overview", label: "Overview", icon: Building2 },
          { id: "inventory", label: "Inventory", icon: Layers },
          { id: "financials", label: "Financials", icon: TrendingUp },
          { id: "milestones", label: "Milestones", icon: CheckCircle2 },
          { id: "bookings", label: "Booking Analytics", icon: Percent },
          { id: "timeline", label: "Activity Timeline", icon: Activity },
          { id: "documents", label: "Documents", icon: FileCheck },
          { id: "risk", label: "Risk Analysis", icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-body font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-accent-primary text-accent-primary font-semibold"
                  : "border-transparent text-text-secondary hover:border-border-soft hover:text-text-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.id === "risk" && projectRisks.length > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[10px] font-bold text-white shadow-soft">
                  {projectRisks.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        
        {/* PANEL: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1.2fr] gap-6">
            <div className="space-y-6">
              <Card className="border border-border-soft">
                <CardHeader>
                  <CardTitle>Project Profile Brief</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 leading-relaxed">
                  <p className="text-body text-text-secondary">
                    {project.name} (Code: {project.code}) is a high-profile {project.name.toLowerCase().includes("villas") ? "residential villa development" : "multi-tower residential community"} located in {project.location}. Designed to meet premium luxury standards, it features advanced structural architecture and rich lifestyle amenities.
                  </p>
                  <p className="text-body text-text-secondary">
                    The project is currently in the <strong className="text-text-primary">{project.stage}</strong> stage of its lifecycle. Sub-structure foundation engineering is fully completed, and work on the superstructure shell framing has initiated under active RERA inspection guidelines.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-border-soft/60 pt-4 mt-2">
                    <div>
                      <span className="text-label text-text-muted">Total Structure Area</span>
                      <p className="text-body font-semibold text-text-primary mt-0.5">324,500 Sq.Ft.</p>
                    </div>
                    <div>
                      <span className="text-label text-text-muted">Number of Towers / Blocks</span>
                      <p className="text-body font-semibold text-text-primary mt-0.5">3 active structures (Towers A, B, C)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Milestone Timeline widget */}
              <Card className="border border-border-soft">
                <CardHeader>
                  <CardTitle>Core Progress Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative border-l-2 border-border-soft pl-6 ml-2 space-y-6">
                    {milestoneProgress.map((m, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-[33px] top-0.5 h-4 w-4 rounded-full border-2 bg-surface ${
                            m.status === "Completed"
                              ? "border-text-success bg-text-success"
                              : m.status === "In Progress"
                              ? "border-accent-primary animate-pulse-soft"
                              : "border-border-soft"
                          }`}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-body text-text-primary">{m.name}</h4>
                            <Badge tone={m.status === "Completed" ? "success" : m.status === "In Progress" ? "info" : "neutral"} className="text-[10px] py-0.5 h-4 px-1.5 font-bold">
                              {m.status}
                            </Badge>
                          </div>
                          <span className="text-label text-text-muted">{m.date}</span>
                          <p className="text-body text-text-secondary mt-1">{m.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Manager card */}
              <Card className="border border-border-soft">
                <CardHeader>
                  <CardTitle>Project Team & Governance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold text-lg">
                      {project.managerName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h4 className="font-semibold text-body text-text-primary">{project.managerName}</h4>
                      <p className="text-label text-text-secondary">Project Superintendent / Sales Lead</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-body text-text-secondary border-t border-border-soft/60 pt-4 mt-2">
                    <div className="flex justify-between">
                      <span>Assigned Crew</span>
                      <strong className="text-text-primary">24 members</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Contracted Labor</span>
                      <strong className="text-text-primary">145 onsite</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Safety Audits</span>
                      <strong className="text-text-success">Passed (Zero incidents)</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk snapshot */}
              <Card className="border border-border-soft">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle>Risk Exposure</CardTitle>
                  <Badge tone={getRiskTone(riskLevel)}>{riskLevel} Risk</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projectRisks.length ? (
                    projectRisks.map((risk) => (
                      <div key={risk.id} className="flex gap-2.5 rounded-[var(--radius-input)] border border-error-soft bg-error-soft/5 p-3 text-text-error">
                        <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-label font-bold">{risk.title}</p>
                          <p className="text-label text-text-secondary mt-0.5">{risk.detail}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-text-success text-body py-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Zero active critical risk alerts reported.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* PANEL: Inventory */}
        {activeTab === "inventory" && (
          <Card className="overflow-hidden border border-border-soft">
            <CardHeader>
              <CardTitle>Inventory List</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft bg-surface-secondary/80 px-4 py-4">
                <div className="flex min-w-[280px] flex-1 flex-wrap items-center gap-3">
                  <div className="relative min-w-[240px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search unit, configuration, tower..."
                      className="h-11 bg-surface pl-9"
                    />
                  </div>
                  <select
                    value={unitStatusFilter}
                    onChange={(e) => setUnitStatusFilter(e.target.value)}
                    className={selectClassName + " max-w-[200px]"}
                  >
                    <option value="All">All statuses</option>
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <Badge tone="neutral">{filteredUnits.length} Units Found</Badge>
              </div>

              <div className="overflow-auto">
                <table className="w-full min-w-[800px] text-table">
                  <thead className="bg-surface-secondary text-text-secondary">
                    <tr className="h-12 border-b border-border-soft">
                      <th className="px-4 text-left">Unit Code</th>
                      <th className="px-4 text-left">Tower</th>
                      <th className="px-4 text-left">Configuration</th>
                      <th className="px-4 text-left">Floor</th>
                      <th className="px-4 text-left">Area (Sq.Ft.)</th>
                      <th className="px-4 text-left">Price (INR)</th>
                      <th className="px-4 text-left">Facing</th>
                      <th className="px-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.length ? (
                      filteredUnits.map((unit) => (
                        <tr key={unit.id} className="border-t border-border-soft hover:bg-hover/40 transition-colors">
                          <td className="px-4 py-3.5 font-medium text-text-primary">{unit.code}</td>
                          <td className="px-4 py-3.5 text-text-secondary">{unit.towerName}</td>
                          <td className="px-4 py-3.5">{unit.configuration}</td>
                          <td className="px-4 py-3.5">{unit.floorLabel}</td>
                          <td className="px-4 py-3.5">{unit.areaSqFt}</td>
                          <td className="px-4 py-3.5 text-text-primary font-medium">{formatCr(unit.finalPrice)}</td>
                          <td className="px-4 py-3.5">{unit.facing}</td>
                          <td className="px-4 py-3.5">
                            <Badge tone={unit.status === "available" ? "success" : unit.status === "booked" ? "info" : "warning"}>
                              {unit.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-text-secondary">
                          No units matched your filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PANEL: Financials */}
        {activeTab === "financials" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <Card className="card-kpi border border-border-soft">
                <CardHeader className="pb-1">
                  <span className="text-kpi-label text-text-kpi-label">Inventory Value</span>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-kpi-value text-text-primary">{formatCr(totalUnitsValue)}</p>
                  <span className="text-label text-text-secondary mt-1 inline-block">Total inventory portfolio</span>
                </CardContent>
              </Card>
              <Card className="card-kpi border border-border-soft">
                <CardHeader className="pb-1">
                  <span className="text-kpi-label text-text-kpi-label">Booked Revenue</span>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-kpi-value text-text-primary">{formatCr(bookedRevenue)}</p>
                  <span className="text-label text-text-secondary mt-1 inline-block">Sales committed revenue</span>
                </CardContent>
              </Card>
              <Card className="card-kpi border border-border-soft">
                <CardHeader className="pb-1">
                  <span className="text-kpi-label text-text-kpi-label">Outstanding Collections</span>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-kpi-value text-text-error">{formatCr(outstandingCollections)}</p>
                  <span className="text-label text-text-secondary mt-1 inline-block">Due payments remaining</span>
                </CardContent>
              </Card>
              <Card className="card-kpi border border-border-soft">
                <CardHeader className="pb-1">
                  <span className="text-kpi-label text-text-kpi-label">Collection Rate</span>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-kpi-value text-text-success">{collectionRate}%</p>
                  <span className="text-label text-text-secondary mt-1 inline-block">Milestone collections status</span>
                </CardContent>
              </Card>
              <Card className="card-kpi border border-border-soft">
                <CardHeader className="pb-1">
                  <span className="text-kpi-label text-text-kpi-label">Revenue Potential</span>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-kpi-value text-accent-primary">{formatCr(revenuePotential)}</p>
                  <span className="text-label text-text-secondary mt-1 inline-block">Available stock value</span>
                </CardContent>
              </Card>
            </div>

            {/* Financial charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Trend chart */}
              <Card className="border border-border-soft lg:col-span-2">
                <CardHeader>
                  <CardTitle>Sales Bookings vs Collections Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={financialTrendData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                        <defs>
                          <linearGradient id="bookTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartPalette.blue} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={chartPalette.blue} stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="collTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartPalette.green} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={chartPalette.green} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 11 }} tickFormatter={(v) => `₹${(v / 10000000).toFixed(1)} Cr`} />
                        <Tooltip formatter={(value: any) => [formatCr(value), ""]} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Area type="monotone" dataKey="Booked Revenue" stroke={chartPalette.blue} strokeWidth={2} fill="url(#bookTrend)" />
                        <Area type="monotone" dataKey="Collections Received" stroke={chartPalette.green} strokeWidth={2} fill="url(#collTrend)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration Distribution chart */}
              <Card className="border border-border-soft">
                <CardHeader>
                  <CardTitle>Inventory Mix Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center">
                  <div className="h-56 w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={configChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {configChartData.map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={Object.values(chartPalette)[idx % 6]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-bold font-secondary text-text-primary">
                        {projectUnits.length}
                      </span>
                      <span className="text-label text-text-muted">Total Units</span>
                    </div>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-2 text-label text-text-secondary mt-3">
                    {configChartData.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-1.5 border-b border-border-soft pb-1">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: Object.values(chartPalette)[idx % 6] }} />
                        <span className="truncate">{item.name} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* PANEL: Milestones */}
        {activeTab === "milestones" && (
          <Card className="border border-border-soft">
            <CardHeader>
              <CardTitle>RERA Milestones & Project Timelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8 py-4">
                {milestoneProgress.map((m, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center gap-4 border-b border-border-soft/60 pb-5 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3 md:w-1/4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                        m.status === "Completed"
                          ? "bg-text-success border-text-success text-white"
                          : m.status === "In Progress"
                          ? "border-accent-primary text-accent-primary animate-pulse-soft"
                          : "border-border-soft text-text-muted"
                      }`}>
                        {m.status === "Completed" ? <CheckCircle2 className="h-4.5 w-4.5" /> : idx + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-body text-text-primary">{m.name}</h4>
                        <span className="text-label text-text-muted">{m.date}</span>
                      </div>
                    </div>

                    <div className="flex-1 text-body text-text-secondary leading-relaxed md:px-4">
                      {m.desc}
                    </div>

                    <div className="md:w-1/6 md:text-right">
                      <Badge tone={m.status === "Completed" ? "success" : m.status === "In Progress" ? "info" : "neutral"} className="font-semibold">
                        {m.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PANEL: Booking Analytics */}
        {activeTab === "bookings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border-soft">
              <CardHeader>
                <CardTitle>Monthly Booking Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { month: "Jan", bookings: 4 },
                        { month: "Feb", bookings: 6 },
                        { month: "Mar", bookings: 8 },
                        { month: "Apr", bookings: 5 },
                        { month: "May", bookings: 9 },
                        { month: "Jun", bookings: 12 },
                      ]}
                      margin={{ left: -25, right: 10, top: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" vertical={false} />
                      <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate }} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate }} />
                      <Tooltip />
                      <Bar dataKey="bookings" fill={chartPalette.blue} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border-soft">
              <CardHeader>
                <CardTitle>Unit Stock Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-56 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Booked", value: projectBookings.length || 18 },
                          { name: "Available", value: projectUnits.filter((u) => u.status === "available").length || 12 },
                          { name: "Blocked", value: projectUnits.filter((u) => u.status === "blocked").length || 2 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        <Cell fill={chartPalette.blue} />
                        <Cell fill={chartPalette.green} />
                        <Cell fill={chartPalette.amber} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-6 text-label text-text-secondary mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                    <span>Booked ({projectBookings.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span>Available ({projectUnits.filter((u) => u.status === "available").length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span>Blocked ({projectUnits.filter((u) => u.status === "blocked").length})</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PANEL: Activity Timeline */}
        {activeTab === "timeline" && (
          <Card className="border border-border-soft">
            <CardHeader>
              <CardTitle>Operational Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 ml-2">
                {mockActivities.map((act, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-accent-secondary/10 flex items-center justify-center text-accent-secondary shrink-0">
                        <Activity className="h-4.5 w-4.5" />
                      </div>
                      {idx !== mockActivities.length - 1 && <div className="w-0.5 h-16 bg-border-soft mt-1" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-body text-text-primary">{act.title}</h4>
                        <span className="text-label text-text-muted">{act.time}</span>
                      </div>
                      <p className="text-label text-text-muted font-medium">Logged by: {act.actor}</p>
                      <p className="text-body text-text-secondary mt-1">{act.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PANEL: Documents */}
        {activeTab === "documents" && (
          <Card className="border border-border-soft">
            <CardHeader>
              <CardTitle>Project Documents Locker</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <div className="overflow-auto">
                <table className="w-full min-w-[700px] text-table">
                  <thead className="bg-surface-secondary text-text-secondary">
                    <tr className="h-12 border-b border-border-soft">
                      <th className="px-6 text-left">Document Title</th>
                      <th className="px-4 text-left">Category</th>
                      <th className="px-4 text-left">File Size</th>
                      <th className="px-4 text-left">Uploaded At</th>
                      <th className="px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockDocs.map((doc, idx) => (
                      <tr key={idx} className="border-t border-border-soft hover:bg-hover/40 transition-colors">
                        <td className="px-6 py-4 font-medium text-text-primary flex items-center gap-2">
                          <FileText className="h-4.5 w-4.5 text-text-muted" />
                          <span>{doc.title}</span>
                        </td>
                        <td className="px-4 py-4">
                          <Badge tone="info">{doc.category}</Badge>
                        </td>
                        <td className="px-4 py-4 text-text-secondary">{doc.size}</td>
                        <td className="px-4 py-4 text-text-secondary">{doc.uploadedAt}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="text-accent-primary gap-1">
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PANEL: Risk Analysis */}
        {activeTab === "risk" && (
          <Card className="border border-border-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Strategic Risk Assessment</CardTitle>
              <Badge tone={getRiskTone(riskLevel)} className="font-semibold">{riskLevel} RISK INDEX</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectRisks.length ? (
                projectRisks.map((risk) => (
                  <div key={risk.id} className="flex gap-4 rounded-[var(--radius-card)] border border-error-soft bg-error-soft/10 p-5">
                    <ShieldAlert className="h-6 w-6 text-text-error shrink-0 mt-0.5 animate-bounce-soft" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-body text-text-error">{risk.title}</h4>
                        <Badge tone="error" className="text-[10px] py-0 px-1.5 h-4 font-bold uppercase">{risk.severity}</Badge>
                      </div>
                      <p className="text-body text-text-secondary leading-relaxed">{risk.detail}</p>
                      
                      <div className="flex gap-4 text-label text-text-muted pt-1">
                        <span>Score Impact: <strong className="text-text-error">-{risk.scoreImpact} pts</strong></span>
                        {risk.dueAt && <span>Action Due: <strong>{new Date(risk.dueAt).toLocaleDateString()}</strong></span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[var(--radius-card)] border border-success-soft bg-success-soft/10 p-5 flex gap-4 text-text-success">
                  <CheckCircle2 className="h-6 w-6 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-body">Strategic Clear Standing</h4>
                    <p className="text-body text-text-secondary leading-relaxed">
                      This project portfolio component satisfies all active milestone dates, construction delivery checks, material buffers, and collections velocity checks. No corrective action plan required.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail page footer summary */}
      <Card className="border border-border-soft bg-surface-secondary/20">
        <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-label text-text-muted uppercase font-semibold tracking-wider">Project Summary</span>
            <p className="text-body text-text-secondary leading-snug">
              • Portfolio valuation at {formatCr(totalUnitsValue)} · sales contract collection rate stands at {collectionRate}%. <br />
              • Total units registered {projectUnits.length} · {projectUnits.filter((u) => u.status === "available").length} available for direct booking pipeline.
            </p>
          </div>
          <span className="text-label text-text-muted self-end">
            Last synced with main registry 2 minutes ago
          </span>
        </CardContent>
      </Card>
    </section>
  );
}
export default ProjectDetail;
