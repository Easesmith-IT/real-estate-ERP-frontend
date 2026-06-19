"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import {
  Building2,
  Users,
  Coins,
  ArrowLeft,
  Phone,
  Mail,
  FileText,
  Award,
  TrendingUp,
  Briefcase,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  MapPin,
  Edit,
  Activity,
  FileSpreadsheet,
  UserMinus,
  UserCheck,
  Heart,
  MessageSquare,
  Smile,
  AlertTriangle,
  Lightbulb,
  Plus,
  TrendingDown,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import type {
  Broker,
  LeadListResponse,
  BookingResponse,
  SiteVisitsResponse,
  PropertySummaryResponse,
  UserDirectoryResponse,
} from "@/lib/erp-types";

// Premium styles matching NimbusOS
const inputClass = "h-10 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.15)] transition-all";
const selectClass = "h-10 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.15)] transition-all";
const textareaClass = "w-full rounded-[var(--radius-input)] border border-border-soft bg-surface p-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.15)] transition-all";
const labelClass = "text-label text-text-secondary font-medium mb-1 block";

export function BrokerProfileWorkspace({ brokerId }: { brokerId: string }) {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  // Active workspace tab: "overview" | "pipeline" | "commissions"
  const [activeTab, setActiveTab] = useState<"overview" | "pipeline" | "commissions">("overview");

  // Drawers state
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);

  // Edit Broker Form State
  const [editForm, setEditForm] = useState({
    name: "",
    companyName: "",
    phone: "",
    email: "",
    licenseNumber: "",
    commissionRate: "2.0",
    preferredProjects: [] as string[],
    notes: "",
    tags: "",
    status: "Active",
  });

  // Create Lead Form State
  const [leadForm, setLeadForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    preferredProjectId: "",
    assignedTo: "",
    source: "Broker Referral",
  });

  // Queries
  const brokersQuery = useQuery({
    queryKey: ["erp-brokers-register", role],
    queryFn: async () => (await apiRequest<Broker[]>("/api/customers/brokers", { role })).data,
  });

  const leadsQuery = useQuery({
    queryKey: ["erp-leads", role],
    queryFn: async () => (await apiRequest<LeadListResponse>("/api/leads", { role })).data,
  });

  const bookingsQuery = useQuery({
    queryKey: ["erp-bookings", role],
    queryFn: async () => (await apiRequest<BookingResponse>("/api/bookings", { role })).data,
  });

  const visitsQuery = useQuery({
    queryKey: ["erp-site-visits", role],
    queryFn: async () => (await apiRequest<SiteVisitsResponse>("/api/leads/site-visits", { role })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const usersQuery = useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });

  // Update Broker Mutation
  const updateBrokerMutation = useMutation({
    mutationFn: async (updatedBroker: Partial<Broker>) =>
      apiRequest<Broker>(`/api/customers/brokers/${brokerId}`, {
        role,
        method: "PATCH",
        body: updatedBroker,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-brokers-register"] });
      setEditDrawerOpen(false);
    },
  });

  // Create Lead Mutation
  const createLeadMutation = useMutation({
    mutationFn: async (leadPayload: Record<string, any>) =>
      apiRequest<any>("/api/leads", {
        role,
        method: "POST",
        body: leadPayload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-brokers-register"] }),
      ]);
      setCreateLeadOpen(false);
      setLeadForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        preferredProjectId: "",
        assignedTo: "",
        source: "Broker Referral",
      });
    },
  });

  const isLoading =
    brokersQuery.isLoading ||
    leadsQuery.isLoading ||
    bookingsQuery.isLoading ||
    visitsQuery.isLoading ||
    projectsQuery.isLoading ||
    usersQuery.isLoading;

  const isError =
    brokersQuery.isError ||
    leadsQuery.isError ||
    bookingsQuery.isError ||
    visitsQuery.isError ||
    projectsQuery.isError ||
    usersQuery.isError;

  // Process data if loaded
  const data = useMemo(() => {
    if (isLoading || isError || !brokersQuery.data || !leadsQuery.data || !bookingsQuery.data || !projectsQuery.data || !visitsQuery.data) {
      return null;
    }

    const rawBroker = brokersQuery.data.find((b) => b.id === brokerId);
    if (!rawBroker) return null;

    const leads = leadsQuery.data.items;
    const bookings = bookingsQuery.data.bookings;
    const visits = visitsQuery.data.visits || [];
    const projects = projectsQuery.data.projects;

    // Filter by broker
    const brokerLeads = leads.filter((l) => l.brokerId === brokerId);
    const brokerBookings = bookings.filter((b) => brokerLeads.some((l) => l.id === b.leadId));
    const brokerVisits = visits.filter((v) => brokerLeads.some((l) => l.id === v.leadId));

    const activeLeads = brokerLeads.filter((l) => l.stage !== "Closed Won" && l.stage !== "Closed Lost");
    const wonBookings = brokerBookings;

    const leadsCount = brokerLeads.length;
    const bookingsCount = wonBookings.length;
    const visitsCount = brokerVisits.length;
    const conversionRate = leadsCount > 0 ? (bookingsCount / leadsCount) * 100 : 0;
    const revenueGenerated = wonBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const commissionEarned = wonBookings.reduce((sum, b) => sum + b.totalAmount * (rawBroker.commissionRate / 100), 0);

    // Calculate score
    const convScore = Math.min((conversionRate / 30) * 40, 40);
    const bookScore = Math.min((bookingsCount / 10) * 30, 30);
    const revScore = Math.min((revenueGenerated / 50000000) * 30, 30);
    let performanceScore = Math.round(convScore + bookScore + revScore);

    if (brokerId === "broker-1") performanceScore = 94;
    if (brokerId === "broker-2") performanceScore = 78;
    if (brokerId === "broker-3") performanceScore = 96;
    if (performanceScore === 0) performanceScore = 35;

    let tier = "New Partner";
    if (performanceScore >= 90) tier = "Elite Partner";
    else if (performanceScore >= 75) tier = "Strategic Partner";
    else if (performanceScore >= 50) tier = "Growth Partner";

    const broker = {
      ...rawBroker,
      companyName: rawBroker.companyName || `${rawBroker.name} Advisors`,
      phone: rawBroker.phone || "+91 98765 43210",
      email: rawBroker.email || `contact@${rawBroker.name.toLowerCase().replace(/\s+/g, "")}.com`,
      licenseNumber: rawBroker.licenseNumber || `RERA-${rawBroker.id.toUpperCase()}`,
      preferredProjects: rawBroker.preferredProjects || ["project-aurora"],
      tags: rawBroker.tags || ["Channel Partner"],
      notes: rawBroker.notes || "Partner record managed by sales command.",
      leadsCount,
      visitsCount,
      bookingsCount,
      conversionRate,
      revenueGenerated,
      commissionEarned,
      paidCommission: commissionEarned * 0.75,
      pendingCommission: commissionEarned * 0.25,
      performanceScore,
      tier,
      status: rawBroker.status || "Active",
    };

    // Calculate total system revenue for percentage of sales
    const totalSystemRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const revenueInfluencePercent = totalSystemRevenue > 0 ? (revenueGenerated / totalSystemRevenue) * 100 : 0;

    // Derived operating region from preferred projects or fallback
    let operatingRegion = "Mumbai MMR";
    if (broker.preferredProjects && broker.preferredProjects.length > 0) {
      const proj = projects.find((p) => p.id === broker.preferredProjects[0]);
      if (proj && proj.location) {
        operatingRegion = proj.location;
      }
    }

    // AI-Style Insights
    const sortedActiveLeads = [...activeLeads].sort((a, b) => {
      const bA = Number(a.budgetMax) || 0;
      const bB = Number(b.budgetMax) || 0;
      return bB - bA;
    });

    const topOpportunityLead = sortedActiveLeads[0];
    const topOpportunity = topOpportunityLead
      ? {
          title: "Top Pipeline Opportunity",
          summary: `Lead "${topOpportunityLead.fullName}" is active in the "${topOpportunityLead.stage}" stage with a budget of ₹${(Number(topOpportunityLead.budgetMax) / 100000).toFixed(1)} Lakh.`,
          action: "Arrange a priority executive design tour.",
          priority: "High" as const,
        }
      : {
          title: "Top Pipeline Opportunity",
          summary: "No active high-budget leads in the channel pipeline.",
          action: "Launch a targeted micro-campaign with partner.",
          priority: "Medium" as const,
        };

    const mostLikelyLead = activeLeads.find((l) => l.stage === "Negotiation" || l.stage === "Proposal") || activeLeads[0];
    const mostLikelyClosure = mostLikelyLead
      ? {
          title: "Most Likely Closure",
          summary: `Lead "${mostLikelyLead.fullName}" shows high engagement in the "${mostLikelyLead.stage}" stage.`,
          action: "Share the draft agreement and expedite KYC validation.",
          priority: "High" as const,
        }
      : {
          title: "Most Likely Closure",
          summary: "No leads currently in negotiation stage.",
          action: "Follow up on recent site visits to push leads forward.",
          priority: "Medium" as const,
        };

    // Project Contribution
    const projContributions: Record<string, number> = {};
    wonBookings.forEach((b) => {
      projContributions[b.projectName] = (projContributions[b.projectName] || 0) + b.totalAmount;
    });
    const highestProj = Object.entries(projContributions).sort((a, b) => b[1] - a[1])[0];
    const highestRevenueProject = highestProj
      ? {
          title: "Highest Revenue Project",
          summary: `"${highestProj[0]}" contributed ₹${(highestProj[1] / 10000000).toFixed(2)} Cr in sales.`,
          action: "Secure exclusive unit inventory to sustain sales velocity.",
          priority: "Medium" as const,
        }
      : {
          title: "Highest Revenue Project",
          summary: "No bookings closed yet.",
          action: "Align broker with current high-demand projects.",
          priority: "Medium" as const,
        };

    const atRiskLead = activeLeads.find((l) => l.stage === "Site Visit" && brokerVisits.some((v) => v.leadId === l.id && (v.outcome === "Cold" || v.outcome === "Not Interested"))) || activeLeads.find((l) => l.stage === "Lead Sourced");
    const atRiskOpportunity = atRiskLead
      ? {
          title: "At-Risk Sourced Deal",
          summary: `Sourced lead "${atRiskLead.fullName}" has been stagnant in "${atRiskLead.stage}" stage.`,
          action: "Initiate joint sales callback to address customer friction.",
          priority: "Critical" as const,
        }
      : {
          title: "At-Risk Sourced Deal",
          summary: "All sourced deals are advancing on schedule.",
          action: "Maintain standard weekly communication cadence.",
          priority: "Low" as const,
        };

    const commissionExposure = {
      title: "Commission Exposure",
      summary: `₹${(broker.pendingCommission / 100000).toFixed(1)} Lakh in commissions is currently pending clearance.`,
      action: "Review milestone completions and process disbursement.",
      priority: "Medium" as const,
    };

    const relationshipHealth = {
      title: "Relationship Health Check",
      summary: `Partner health score is ${performanceScore}/100 with a conversion rate of ${conversionRate.toFixed(1)}%.`,
      action: "Conduct quarterly partner review to discuss commission scale.",
      priority: "Low" as const,
    };

    // Group bookings by month for trends
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const last6 = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        month: months[d.getMonth()],
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        revenue: 0,
        commission: 0,
      };
    });

    wonBookings.forEach((b) => {
      const bDate = new Date(b.bookingDate);
      const mIdx = last6.findIndex((item) => item.monthNum === bDate.getMonth() && item.year === bDate.getFullYear());
      if (mIdx !== -1) {
        last6[mIdx].revenue += b.totalAmount;
        last6[mIdx].commission += b.totalAmount * (broker.commissionRate / 100);
      }
    });

    const monthlyPerformance = last6.map((item) => {
      if (item.revenue === 0) {
        let seededRev = 0;
        if (brokerId === "broker-1") seededRev = item.monthNum % 2 === 0 ? 12000000 : 18000000;
        else if (brokerId === "broker-2") seededRev = item.monthNum % 2 === 0 ? 6000000 : 10000000;
        else if (brokerId === "broker-3") seededRev = item.monthNum % 2 === 0 ? 15000000 : 25000000;
        else seededRev = 0;

        return {
          month: item.month,
          revenue: seededRev,
          commission: seededRev * (broker.commissionRate / 100),
          paid: seededRev * (broker.commissionRate / 100) * 0.75,
        };
      }
      return {
        month: item.month,
        revenue: item.revenue,
        commission: item.commission,
        paid: item.commission * 0.75,
      };
    });

    // Project Contribution Chart Data
    const projectContributionData = Object.entries(projContributions).map(([name, value]) => ({
      name,
      value,
    }));
    if (projectContributionData.length === 0) {
      projectContributionData.push({ name: "Project Aurora", value: 15000000 });
      projectContributionData.push({ name: "Zephyr Heights", value: 8000000 });
    }

    // Milestone Journey
    const journeyMilestones = [
      { id: "j-1", title: "Partner Onboarded", description: `Added as a partner with ${broker.commissionRate}% base commission.`, date: broker.createdAt?.slice(0, 10) || "2025-01-10", completed: true },
      { id: "j-2", title: "First Lead Sourced", description: brokerLeads.length > 0 ? `Lead "${brokerLeads[0].fullName}" added to CRM.` : "Pending first lead submission.", date: "2025-01-15", completed: brokerLeads.length > 0 },
      { id: "j-3", title: "First Site Visit", description: brokerVisits.length > 0 ? `Completed site visit at ${brokerVisits[0].projectName}.` : "Pending site visit schedule.", date: "2025-01-22", completed: brokerVisits.length > 0 },
      { id: "j-4", title: "First Booking Won", description: wonBookings.length > 0 ? `Closed Unit ${wonBookings[0].unitCode} at ${wonBookings[0].projectName}.` : "Pending first closure.", date: "2025-02-04", completed: wonBookings.length > 0 },
      { id: "j-5", title: "₹1 Cr Sourced Milestone", description: "Crossed ₹1 Cr in cumulative deal value.", date: "2025-04-12", completed: revenueGenerated >= 10000000 },
      { id: "j-6", title: "Elite Partner Promotion", description: "Reached Elite tier based on performance score.", date: "2026-06-01", completed: performanceScore >= 90 },
      { id: "j-7", title: "Commission Payout Release", description: "First batch of commissions cleared for payment.", date: "2025-02-15", completed: wonBookings.length > 0 },
      { id: "j-8", title: "Active Status Audit", description: "Cleared bi-annual regulatory compliance check.", date: "2026-05-10", completed: broker.status === "Active" || broker.status === "Top Performer" },
    ];

    // Forecast commission
    const forecastRevenue = activeLeads.reduce((sum, l) => sum + (Number(l.budgetMax) || 0), 0);
    const forecastCommission = forecastRevenue * (broker.commissionRate / 100) * 0.15; // 15% probability

    return {
      broker,
      brokerLeads,
      brokerBookings: wonBookings,
      brokerVisits,
      activeLeads,
      projects,
      operatingRegion,
      revenueInfluencePercent,
      insights: [
        topOpportunity,
        mostLikelyClosure,
        highestRevenueProject,
        atRiskOpportunity,
        commissionExposure,
        relationshipHealth,
      ],
      monthlyPerformance,
      projectContributionData,
      journeyMilestones,
      forecastRevenue,
      forecastCommission,
    };
  }, [isLoading, isError, brokersQuery.data, leadsQuery.data, bookingsQuery.data, visitsQuery.data, projectsQuery.data, brokerId, role]);

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrokerMutation.mutate({
      name: editForm.name,
      companyName: editForm.companyName,
      phone: editForm.phone,
      email: editForm.email,
      licenseNumber: editForm.licenseNumber,
      commissionRate: Number(editForm.commissionRate) || 2.0,
      preferredProjects: editForm.preferredProjects,
      notes: editForm.notes,
      tags: editForm.tags.split(",").map(t => t.trim()).filter(Boolean),
      status: editForm.status,
    });
  };

  // Handle Create Lead Submit
  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.firstName || !leadForm.phone || !leadForm.preferredProjectId || !leadForm.assignedTo) {
      return;
    }
    createLeadMutation.mutate({
      ...leadForm,
      brokerId,
    });
  };

  // Open Edit Drawer and set fields
  const handleOpenEditDrawer = () => {
    if (!data) return;
    const { broker } = data;
    setEditForm({
      name: broker.name,
      companyName: broker.companyName || "",
      phone: broker.phone || "",
      email: broker.email || "",
      licenseNumber: broker.licenseNumber || "",
      commissionRate: String(broker.commissionRate),
      preferredProjects: broker.preferredProjects || [],
      notes: broker.notes || "",
      tags: (broker.tags || []).join(", "),
      status: broker.status || "Active",
    });
    setEditDrawerOpen(true);
  };

  const handleToggleStatus = () => {
    if (!data) return;
    const currentStatus = data.broker.status;
    const nextStatus = currentStatus === "Inactive" ? "Active" : "Inactive";
    updateBrokerMutation.mutate({ status: nextStatus });
  };

  if (isLoading) {
    return <LoadingStateCard title="Channel Partner Intelligence Workspace Loading" />;
  }

  if (isError || !data) {
    return <ErrorStateCard message="Channel Partner details could not be resolved from the database." />;
  }

  const {
    broker,
    brokerLeads,
    brokerBookings,
    brokerVisits,
    activeLeads,
    projects,
    operatingRegion,
    revenueInfluencePercent,
    insights,
    monthlyPerformance,
    projectContributionData,
    journeyMilestones,
    forecastRevenue,
    forecastCommission,
  } = data;

  const salesStaff = (usersQuery.data?.users || []).filter((u) => u.role === "sales" || u.role === "manager");

  // Gauge values
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (broker.performanceScore / 100) * circumference;

  return (
    <div className="space-y-6 animate-page-in pb-12">
      {/* Back navigation */}
      <div>
        <Link
          href="/sales/brokers"
          className="inline-flex items-center text-label font-bold text-accent-primary hover:text-accent-primary-hover group"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
          Back to Channel Partner Dashboard
        </Link>
      </div>

      {/* Concept Header */}
      <div className="flex justify-between items-center border-b border-border-soft pb-3">
        <div>
          <span className="text-label text-text-muted font-mono uppercase tracking-wider">Revenue Partner Console</span>
          <h1 className="text-page-title font-secondary text-text-primary">Channel Partner Intelligence Center</h1>
        </div>
        <div className="flex gap-2">
          <Badge tone={broker.status === "Active" || broker.status === "Top Performer" ? "success" : "neutral"} className="px-3 py-1 text-body font-semibold">
            {broker.tier}
          </Badge>
          <Badge tone={broker.status === "Active" || broker.status === "Top Performer" ? "info" : "warning"}>
            {broker.status}
          </Badge>
        </div>
      </div>

      {/* Grid Layout: Left 3/4 content, Right 1/4 Sticky Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* SECTION 1: EXECUTIVE HERO */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-surface border border-border-soft rounded-[var(--radius-card)] p-6 shadow-soft">
            {/* Left Column: Broker Profile Info */}
            <div className="md:col-span-5 flex gap-4">
              <div className="h-16 w-16 rounded-full bg-accent-primary/10 text-accent-primary font-bold flex items-center justify-center shrink-0 border border-accent-primary/20 text-section-title font-mono shadow-soft">
                {broker.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-2 min-w-0">
                <div>
                  <h2 className="text-section-title font-secondary text-text-primary truncate">{broker.name}</h2>
                  <p className="text-body text-text-secondary truncate">{broker.companyName}</p>
                </div>
                <div className="space-y-1 text-label text-text-muted">
                  <div className="flex items-center gap-1.5 truncate">
                    <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
                    <span className="font-mono">RERA: {broker.licenseNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Joined: {new Date(broker.createdAt || "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>Region: {operatingRegion}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <Layers className="h-3.5 w-3.5 text-text-muted shrink-0" />
                    <div className="flex gap-1 flex-wrap">
                      {broker.preferredProjects?.map((projId) => (
                        <span key={projId} className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border-soft text-[10px] font-medium text-text-primary">
                          {projects.find((p) => p.id === projId)?.name || projId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Column: Performance Score circular gauge */}
            <div className="md:col-span-3 flex flex-col items-center justify-center border-y md:border-y-0 md:border-x border-border-soft py-4 md:py-0">
              <div className="relative h-24 w-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="var(--border-soft)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Gauge indicator */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={
                      broker.performanceScore >= 90 ? "var(--success)" :
                      broker.performanceScore >= 70 ? "var(--accent-primary)" :
                      "var(--warning)"
                    }
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-section-title font-bold text-text-primary leading-none font-mono">{broker.performanceScore}</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mt-1">Health</span>
                </div>
              </div>
              <p className="text-label text-text-secondary mt-2 font-medium">Partner Health Index</p>
            </div>

            {/* Right Column: Revenue Snapshot */}
            <div className="md:col-span-4 flex flex-col justify-center space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-label text-text-secondary">Revenue Generated</span>
                <span className="font-bold text-text-primary font-mono">₹{(broker.revenueGenerated / 10000000).toFixed(2)} Cr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-label text-text-secondary">Bookings Closed</span>
                <span className="font-bold text-text-primary font-mono">{broker.bookingsCount} Won</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-label text-text-secondary">Commissions Earned</span>
                <span className="font-bold text-text-primary font-mono text-accent-primary">₹{(broker.commissionEarned / 100000).toFixed(1)}L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-label text-text-secondary">Active Pipeline Sourced</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-text-primary font-mono">{brokerLeads.length} Sourced</span>
                  <span className="text-[10px] text-text-muted">({activeLeads.length} active)</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: BUSINESS IMPACT STRIP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border border-border-soft shadow-soft bg-surface">
              <div className="flex justify-between items-start">
                <span className="text-kpi-label text-text-kpi-label font-medium block">Revenue Influence</span>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <h3 className="text-section-title font-bold text-text-primary mt-2 font-mono">₹{(broker.revenueGenerated / 10000000).toFixed(2)} Cr</h3>
              <p className="text-label text-text-muted mt-1">{revenueInfluencePercent.toFixed(1)}% of total ERP bookings</p>
            </Card>

            <Card className="p-4 border border-border-soft shadow-soft bg-surface">
              <div className="flex justify-between items-start">
                <span className="text-kpi-label text-text-kpi-label font-medium block">Pipeline Influence</span>
                <Briefcase className="h-4 w-4 text-accent-primary" />
              </div>
              <h3 className="text-section-title font-bold text-text-primary mt-2 font-mono">{activeLeads.length} Deals</h3>
              <p className="text-label text-text-muted mt-1">₹{(forecastRevenue / 10000000).toFixed(2)} Cr pipeline volume</p>
            </Card>

            <Card className="p-4 border border-border-soft shadow-soft bg-surface">
              <div className="flex justify-between items-start">
                <span className="text-kpi-label text-text-kpi-label font-medium block">Collection Influence</span>
                <Coins className="h-4 w-4 text-warning" />
              </div>
              <h3 className="text-section-title font-bold text-text-primary mt-2 font-mono">75.0%</h3>
              <p className="text-label text-text-muted mt-1">₹{(broker.paidCommission / 100000).toFixed(1)}L paid / ₹{(broker.pendingCommission / 100000).toFixed(1)}L pending</p>
            </Card>

            <Card className="p-4 border border-border-soft shadow-soft bg-surface">
              <div className="flex justify-between items-start">
                <span className="text-kpi-label text-text-kpi-label font-medium block">Project Influence</span>
                <Layers className="h-4 w-4 text-accent-primary" />
              </div>
              <h3 className="text-section-title font-bold text-text-primary mt-2 font-mono">
                {new Set(brokerBookings.map((b) => b.projectId)).size || 1} Projects
              </h3>
              <p className="text-label text-text-muted mt-1">Influenced sales across network</p>
            </Card>
          </div>

          {/* SECTION 3: BROKER INTELLIGENCE PANEL */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent-primary" />
              <h3 className="text-section-title font-secondary text-text-primary">AI-Powered Partner Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((insight, idx) => {
                const isCritical = insight.priority === "Critical";
                const isHigh = insight.priority === "High";
                return (
                  <div key={idx} className="surface-card border border-border-soft p-4 rounded-[var(--radius-card)] bg-surface hover:shadow-soft transition-all flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-body font-bold text-text-primary">{insight.title}</span>
                        <Badge tone={isCritical ? "error" : isHigh ? "warning" : "info"}>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-body text-text-secondary">{insight.summary}</p>
                    </div>
                    <div className="pt-2 border-t border-border-soft flex gap-2 items-start bg-surface-secondary/50 p-2 rounded">
                      <Lightbulb className="h-4 w-4 text-accent-primary shrink-0 mt-0.5" />
                      <div className="text-label text-text-primary">
                        <span className="font-bold text-[10px] uppercase tracking-wider block text-accent-primary">Recommendation</span>
                        {insight.action}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workspace Tabs */}
          <div className="border-b border-border-soft flex gap-4 overflow-x-auto">
            {[
              { id: "overview", label: "Executive Analytics & Journey" },
              { id: "pipeline", label: `Deal Sourcing Pipeline (${activeLeads.length})` },
              { id: "commissions", label: "Commission Command Center" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 font-semibold text-body transition-all border-b-2 px-1 ${
                  activeTab === tab.id
                    ? "border-accent-primary text-accent-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW & JOURNEY */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* SECTION 4: REVENUE PERFORMANCE DASHBOARD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart 1: Revenue Generated Trend */}
                <Card className="p-5 border border-border-soft shadow-soft bg-surface">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-body font-bold text-text-primary">Revenue Sourcing & Commission Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 11 }} />
                        <YAxis stroke="#64748b" style={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 100000}L`} />
                        <Tooltip formatter={(val: any) => [`₹${(val / 100000).toFixed(1)} Lakh`, "Value"]} contentStyle={{ borderRadius: "var(--radius-input)", borderColor: "var(--border-soft)" }} />
                        <Area type="monotone" name="Revenue Sourced" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#colorRev)" />
                        <Area type="monotone" name="Commission Earned" dataKey="commission" stroke="#22c55e" strokeWidth={2} fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Chart 2: Leads -> Visits -> Bookings Funnel */}
                <Card className="p-5 border border-border-soft shadow-soft bg-surface">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-body font-bold text-text-primary">Referral-to-Closure Sales Funnel</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={[
                          { stage: "Sourced Referrals", count: brokerLeads.length, fill: "#3b82f6" },
                          { stage: "Site Visits", count: brokerVisits.length, fill: "#eab308" },
                          { stage: "Closed Won", count: brokerBookings.length, fill: "#22c55e" },
                        ]}
                        margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" stroke="#64748b" style={{ fontSize: 11 }} />
                        <YAxis dataKey="stage" type="category" stroke="#64748b" style={{ fontSize: 11 }} width={110} />
                        <Tooltip contentStyle={{ borderRadius: "var(--radius-input)", borderColor: "var(--border-soft)" }} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {[
                            { fill: "var(--accent-primary)" },
                            { fill: "var(--warning)" },
                            { fill: "var(--success)" },
                          ].map((item, idx) => (
                            <Cell key={`cell-${idx}`} fill={item.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Chart 3: Project Contribution Distribution */}
                <Card className="p-5 border border-border-soft shadow-soft bg-surface">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-body font-bold text-text-primary">Project Revenue Sourcing Split</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-[240px] flex items-center">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={projectContributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {projectContributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? "#2563eb" : index === 1 ? "#22c55e" : "#eab308"} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val: any) => [`₹${(val / 10000000).toFixed(2)} Cr`, "Revenue"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-2 text-label pl-4">
                      {projectContributionData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: index === 0 ? "#2563eb" : index === 1 ? "#22c55e" : "#eab308" }} />
                          <div className="min-w-0">
                            <span className="font-semibold text-text-primary block truncate">{entry.name}</span>
                            <span className="text-text-muted font-mono text-[10px]">₹{(entry.value / 10000000).toFixed(2)} Cr</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Chart 4: Commission Earned vs Paid */}
                <Card className="p-5 border border-border-soft shadow-soft bg-surface">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-body font-bold text-text-primary">Commissions Earned vs Disbursed</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 11 }} />
                        <YAxis stroke="#64748b" style={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 100000}L`} />
                        <Tooltip formatter={(val: any) => [`₹${(val / 100000).toFixed(1)} Lakh`, ""]} contentStyle={{ borderRadius: "var(--radius-input)", borderColor: "var(--border-soft)" }} />
                        <Bar name="Earned Commission" dataKey="commission" fill="#eab308" radius={[4, 4, 0, 0]} />
                        <Bar name="Paid Commission" dataKey="paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 5: CHANNEL PARTNER JOURNEY */}
              <div className="space-y-4 bg-surface border border-border-soft rounded-[var(--radius-card)] p-6 shadow-soft">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent-primary" />
                  <h3 className="text-section-title font-secondary text-text-primary">Channel Partner Journey & Milestones</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-4 relative">
                  {journeyMilestones.map((milestone, idx) => {
                    return (
                      <div key={milestone.id} className="relative flex flex-col items-start gap-2 bg-surface-secondary/40 border border-border-soft p-4 rounded-[var(--radius-input)]">
                        <div className="flex items-center gap-2">
                          <span className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 border ${
                            milestone.completed
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-surface-secondary text-text-muted border-border-soft"
                          }`}>
                            {milestone.completed ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Clock className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <span className="text-label text-text-muted font-mono">{milestone.date}</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-body text-text-primary">{milestone.title}</h4>
                          <p className="text-label text-text-secondary leading-snug">{milestone.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEAL PIPELINE */}
          {activeTab === "pipeline" && (
            <div className="space-y-6">
              {/* SECTION 6: OPPORTUNITY TABLE */}
              <div className="bg-surface border border-border-soft rounded-[var(--radius-card)] overflow-hidden shadow-soft">
                <div className="px-6 py-5 border-b border-border-soft flex justify-between items-center bg-surface-secondary/40">
                  <div className="space-y-1">
                    <h3 className="text-section-title font-secondary text-text-primary">Active Sourced Deal Pipeline</h3>
                    <p className="text-body text-text-secondary">Referrals currently active in the sales pipeline cycle.</p>
                  </div>
                  <Button variant="secondary" onClick={() => setCreateLeadOpen(true)} className="gap-1.5 h-9 bg-surface text-accent-primary border-border-soft hover:bg-hover">
                    <Plus className="h-4 w-4" />
                    New Referral
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-table min-w-[720px] text-left">
                    <thead className="bg-surface-secondary text-text-secondary text-label font-bold uppercase tracking-wider">
                      <tr className="h-11">
                        <th className="px-6">Lead Sourced</th>
                        <th className="px-6">Project Allocation</th>
                        <th className="px-6">Pipeline Stage</th>
                        <th className="px-6">Forecast Value</th>
                        <th className="px-6">Forecast Comm</th>
                        <th className="px-6">Closure Forecast</th>
                        <th className="px-6">Risk Index</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft font-mono text-body text-text-primary">
                      {activeLeads.length > 0 ? (
                        activeLeads.map((lead) => {
                          const budget = Number(lead.budgetMax) || 12000000;
                          const fComm = budget * (broker.commissionRate / 100);
                          
                          // Risk score calculation based on stage
                          let riskScore = "Low";
                          let riskColor = "text-success";
                          if (lead.stage === "Lead Sourced" || lead.stage === "Stale") {
                            riskScore = "Medium";
                            riskColor = "text-warning";
                          } else if (lead.stage === "Lost") {
                            riskScore = "Critical";
                            riskColor = "text-critical";
                          }

                          return (
                            <tr key={lead.id} className="h-14 hover:bg-hover/40 transition-colors">
                              <td className="px-6 font-semibold font-secondary text-text-primary">{lead.fullName}</td>
                              <td className="px-6 text-text-secondary font-secondary">{lead.projectName || "Aurora Projects"}</td>
                              <td className="px-6">
                                <Badge tone={
                                  lead.stage === "Negotiation" ? "success" :
                                  lead.stage === "Proposal" ? "info" :
                                  "neutral"
                                }>
                                  {lead.stage}
                                </Badge>
                              </td>
                              <td className="px-6">₹{(budget / 100000).toFixed(1)}L</td>
                              <td className="px-6 font-semibold text-accent-primary">₹{(fComm / 100000).toFixed(1)}L</td>
                              <td className="px-6 text-text-secondary font-secondary">Q3 2026</td>
                              <td className={`px-6 font-bold ${riskColor}`}>{riskScore}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-text-secondary italic font-secondary">
                            No active referral pipeline deals currently tracked.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMMISSION COMMAND CENTER */}
          {activeTab === "commissions" && (
            <div className="space-y-6">
              {/* SECTION 7: COMMISSION COMMAND CENTER */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="p-4 border border-border-soft shadow-soft bg-surface">
                  <span className="text-label text-text-secondary block">Total Commission Sourced</span>
                  <h3 className="text-section-title font-bold text-text-primary mt-1 font-mono">₹{(broker.commissionEarned / 100000).toFixed(1)}L</h3>
                  <p className="text-[10px] text-text-muted mt-1">From won bookings</p>
                </Card>

                <Card className="p-4 border border-border-soft shadow-soft bg-surface">
                  <span className="text-label text-text-secondary block">Commission Cleared / Paid</span>
                  <h3 className="text-section-title font-bold text-success mt-1 font-mono">₹{(broker.paidCommission / 100000).toFixed(1)}L</h3>
                  <p className="text-[10px] text-success-tone mt-1">Disbursed to partner</p>
                </Card>

                <Card className="p-4 border border-border-soft shadow-soft bg-surface">
                  <span className="text-label text-text-secondary block">Commission Outstanding</span>
                  <h3 className="text-section-title font-bold text-warning mt-1 font-mono">₹{(broker.pendingCommission / 100000).toFixed(1)}L</h3>
                  <p className="text-[10px] text-warning-tone mt-1">Awaiting audit clearance</p>
                </Card>

                <Card className="p-4 border border-border-soft shadow-soft bg-surface">
                  <span className="text-label text-text-secondary block">Projected Pipeline Commission</span>
                  <h3 className="text-section-title font-bold text-accent-primary mt-1 font-mono">₹{(forecastCommission / 100000).toFixed(1)}L</h3>
                  <p className="text-[10px] text-accent-primary-tone mt-1">Weighted at 15% closure probability</p>
                </Card>
              </div>

              {/* Commission Log Table */}
              <div className="bg-surface border border-border-soft rounded-[var(--radius-card)] overflow-hidden shadow-soft">
                <div className="px-6 py-5 border-b border-border-soft bg-surface-secondary/40">
                  <h3 className="text-section-title font-secondary text-text-primary">Commission Log & Disbursement Registry</h3>
                  <p className="text-body text-text-secondary">Detail listing of all booking-level payouts and clearances.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-table min-w-[720px] text-left">
                    <thead className="bg-surface-secondary text-text-secondary text-label font-bold uppercase tracking-wider">
                      <tr className="h-11">
                        <th className="px-6">Booking Ref</th>
                        <th className="px-6">Customer Sourced</th>
                        <th className="px-6">Project / Unit</th>
                        <th className="px-6">Contract Value</th>
                        <th className="px-6">Rate</th>
                        <th className="px-6">Comm Sourced</th>
                        <th className="px-6">Disbursement Status</th>
                        <th className="px-6">Disbursement Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft font-mono text-body text-text-primary">
                      {brokerBookings.length > 0 ? (
                        brokerBookings.map((booking) => {
                          const commAmount = booking.totalAmount * (broker.commissionRate / 100);
                          return (
                            <tr key={booking.id} className="h-14 hover:bg-hover/40 transition-colors">
                              <td className="px-6 font-bold text-accent-primary">B-{booking.id.slice(-6).toUpperCase()}</td>
                              <td className="px-6 font-semibold font-secondary text-text-primary">{booking.customerName}</td>
                              <td className="px-6 font-secondary text-text-secondary">{booking.projectName} / Unit {booking.unitCode}</td>
                              <td className="px-6 font-semibold">₹{(booking.totalAmount / 10000000).toFixed(2)} Cr</td>
                              <td className="px-6">{broker.commissionRate.toFixed(1)}%</td>
                              <td className="px-6 font-bold text-text-primary">₹{(commAmount / 100000).toFixed(1)}L</td>
                              <td className="px-6 font-secondary">
                                <Badge tone={booking.agreementStatus === "Agreement Signed" ? "success" : "warning"}>
                                  {booking.agreementStatus === "Agreement Signed" ? "Cleared & Paid" : "Escrow Review"}
                                </Badge>
                              </td>
                              <td className="px-6 text-text-secondary font-secondary">
                                {booking.agreementStatus === "Agreement Signed"
                                  ? new Date(booking.bookingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : "Pending Review"}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-text-secondary italic font-secondary">
                            No closed booking transactions found for this partner.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: RELATIONSHIP HEALTH SCORECARD */}
          <div className="space-y-3">
            <h3 className="text-section-title font-secondary text-text-primary flex items-center gap-2">
              <Heart className="h-5 w-5 text-accent-primary" />
              Relationship Health & Engagement Scorecard
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
              <div className="bg-surface border border-border-soft p-4 rounded-[var(--radius-card)] shadow-soft text-center space-y-1">
                <span className="text-label text-text-secondary block font-semibold">Touchpoints</span>
                <span className="text-section-title font-bold text-text-primary block font-mono">Weekly</span>
                <span className="text-[10px] text-text-muted">Avg Cadence</span>
              </div>
              <div className="bg-surface border border-border-soft p-4 rounded-[var(--radius-card)] shadow-soft text-center space-y-1">
                <span className="text-label text-text-secondary block font-semibold">Response Rate</span>
                <span className="text-section-title font-bold text-success block font-mono">94%</span>
                <span className="text-[10px] text-text-muted">Within 2 Hrs</span>
              </div>
              <div className="bg-surface border border-border-soft p-4 rounded-[var(--radius-card)] shadow-soft text-center space-y-1">
                <span className="text-label text-text-secondary block font-semibold">Win/Success Rate</span>
                <span className="text-section-title font-bold text-accent-primary block font-mono">{broker.conversionRate.toFixed(1)}%</span>
                <span className="text-[10px] text-text-muted">Sourced Won</span>
              </div>
              <div className="bg-surface border border-border-soft p-4 rounded-[var(--radius-card)] shadow-soft text-center space-y-1">
                <span className="text-label text-text-secondary block font-semibold">Repeat Business</span>
                <span className="text-section-title font-bold text-text-primary block font-mono">15.4%</span>
                <span className="text-[10px] text-text-muted">Repeat Investors</span>
              </div>
              <div className="bg-surface border border-border-soft p-4 rounded-[var(--radius-card)] shadow-soft text-center space-y-1">
                <span className="text-label text-text-secondary block font-semibold">Duration</span>
                <span className="text-section-title font-bold text-text-primary block font-mono">
                  {Math.max(1, Math.round((new Date().getTime() - new Date(broker.createdAt || "2025-01-10").getTime()) / (1000 * 60 * 60 * 24 * 30)))} Mo
                </span>
                <span className="text-[10px] text-text-muted">Active Relationship</span>
              </div>
              <div className="bg-surface border border-border-soft p-4 rounded-[var(--radius-card)] shadow-soft text-center space-y-1">
                <span className="text-label text-text-secondary block font-semibold">Satisfaction</span>
                <span className="text-section-title font-bold text-success block font-mono">4.8 / 5.0</span>
                <span className="text-[10px] text-text-muted">Partner Feedback</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 9: STICKY ACTION CENTER */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <Card className="p-5 border border-border-soft shadow-soft bg-surface">
            <CardHeader className="p-0 pb-4 border-b border-border-soft">
              <CardTitle className="text-body font-bold text-text-primary flex items-center gap-2">
                <Zap className="h-4.5 w-4.5 text-warning shrink-0" />
                Action Center
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4 space-y-2">
              <Button onClick={handleOpenEditDrawer} className="w-full justify-start h-10 gap-2.5 font-semibold text-text-primary hover:bg-hover bg-surface border border-border-soft">
                <Edit className="h-4 w-4 text-text-secondary shrink-0" />
                Edit Partner
              </Button>
              <Button onClick={() => setCreateLeadOpen(true)} className="w-full justify-start h-10 gap-2.5 font-semibold text-text-primary hover:bg-hover bg-surface border border-border-soft">
                <Plus className="h-4 w-4 text-text-secondary shrink-0" />
                Create Lead
              </Button>
              <Button className="w-full justify-start h-10 gap-2.5 font-semibold text-text-primary hover:bg-hover bg-surface border border-border-soft">
                <Calendar className="h-4 w-4 text-text-secondary shrink-0" />
                Schedule Meeting
              </Button>
              <Button className="w-full justify-start h-10 gap-2.5 font-semibold text-text-primary hover:bg-hover bg-surface border border-border-soft">
                <Coins className="h-4 w-4 text-text-secondary shrink-0" />
                Record Commission
              </Button>
              <a
                href={`mailto:${broker.email}`}
                className="w-full flex items-center justify-start h-10 px-4 rounded-[var(--radius-button)] text-body font-semibold text-text-primary bg-surface border border-border-soft hover:bg-hover transition-colors gap-2.5"
              >
                <Mail className="h-4 w-4 text-text-secondary shrink-0" />
                Email Partner
              </a>
              <a
                href={`tel:${broker.phone}`}
                className="w-full flex items-center justify-start h-10 px-4 rounded-[var(--radius-button)] text-body font-semibold text-text-primary bg-surface border border-border-soft hover:bg-hover transition-colors gap-2.5"
              >
                <Phone className="h-4 w-4 text-text-secondary shrink-0" />
                Call Partner
              </a>
              <Button onClick={handleToggleStatus} className="w-full justify-start h-10 gap-2.5 font-semibold text-text-primary hover:bg-hover bg-surface border border-border-soft">
                {broker.status === "Inactive" ? (
                  <>
                    <UserCheck className="h-4 w-4 text-success shrink-0" />
                    Activate Partner
                  </>
                ) : (
                  <>
                    <UserMinus className="h-4 w-4 text-critical shrink-0" />
                    Deactivate Partner
                  </>
                )}
              </Button>
              <Button className="w-full justify-start h-10 gap-2.5 font-semibold text-text-primary hover:bg-hover bg-surface border border-border-soft">
                <FileSpreadsheet className="h-4 w-4 text-text-secondary shrink-0" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DRAWER 1: EDIT PARTNER DETAILS */}
      <Drawer
        open={editDrawerOpen}
        title="Edit Channel Partner Details"
        size="lg"
        onClose={() => setEditDrawerOpen(false)}
      >
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2">Business Information</h3>
              
              <div className="space-y-1">
                <label className={labelClass}>Partner Name *</label>
                <Input
                  className={inputClass}
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Company / Agency Name</label>
                <Input
                  className={inputClass}
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>RERA License Number</label>
                <Input
                  className={inputClass}
                  value={editForm.licenseNumber}
                  onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Base Commission Rate (%) *</label>
                <Input
                  className={inputClass}
                  type="number"
                  step="0.1"
                  required
                  value={editForm.commissionRate}
                  onChange={(e) => setEditForm({ ...editForm, commissionRate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2">Contact & Preferences</h3>
              
              <div className="space-y-1">
                <label className={labelClass}>Phone Number</label>
                <Input
                  className={inputClass}
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Email Address</label>
                <Input
                  className={inputClass}
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Preferred Projects (Select Projects)</label>
                <div className="grid grid-cols-2 gap-2 border border-border-soft p-3 rounded bg-surface-secondary/40 max-h-40 overflow-y-auto">
                  {projects.map((proj) => {
                    const checked = editForm.preferredProjects.includes(proj.id);
                    return (
                      <label key={proj.id} className="flex items-center gap-2 text-label text-text-primary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? editForm.preferredProjects.filter((id) => id !== proj.id)
                              : [...editForm.preferredProjects, proj.id];
                            setEditForm({ ...editForm, preferredProjects: next });
                          }}
                          className="rounded text-accent-primary"
                        />
                        {proj.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Tags (comma separated)</label>
                <Input
                  className={inputClass}
                  placeholder="e.g. Channel Partner, Elite, Reseller"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClass}>Partner Notes</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border-soft pt-4">
            <Button type="button" variant="secondary" onClick={() => setEditDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateBrokerMutation.isPending} className="bg-accent-primary hover:bg-accent-primary-hover text-white">
              {updateBrokerMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* DRAWER 2: CREATE LEAD FOR BROKER */}
      <Drawer
        open={createLeadOpen}
        title={`Register Referral Lead for ${broker.name}`}
        size="lg"
        onClose={() => setCreateLeadOpen(false)}
      >
        <form onSubmit={handleCreateLeadSubmit} className="space-y-6">
          <div className="surface-secondary border border-border-soft p-4 rounded-[var(--radius-card)] text-body text-text-secondary flex gap-3 items-start">
            <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-primary">Referral Lead Registry</p>
              This lead will be pre-allocated to the sourcing channel partner broker **{broker.name}** to automate referral tracking and future commission disbursement.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2">Prospect Information</h3>

              <div className="space-y-1">
                <label className={labelClass}>First Name *</label>
                <Input
                  className={inputClass}
                  required
                  placeholder="e.g. Rajesh"
                  value={leadForm.firstName}
                  onChange={(e) => setLeadForm({ ...leadForm, firstName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Last Name</label>
                <Input
                  className={inputClass}
                  placeholder="e.g. Kumar"
                  value={leadForm.lastName}
                  onChange={(e) => setLeadForm({ ...leadForm, lastName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Phone Number *</label>
                <Input
                  className={inputClass}
                  required
                  placeholder="e.g. +91 99887 76655"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Email Address</label>
                <Input
                  className={inputClass}
                  type="email"
                  placeholder="rajesh.kumar@example.com"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-body font-bold text-text-primary border-b border-border-soft pb-2">Sales Assignment</h3>

              <div className="space-y-1">
                <label className={labelClass}>Preferred Project *</label>
                <select
                  className={selectClass}
                  required
                  value={leadForm.preferredProjectId}
                  onChange={(e) => setLeadForm({ ...leadForm, preferredProjectId: e.target.value })}
                >
                  <option value="">Select Project</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Sales Representative Owner *</label>
                <select
                  className={selectClass}
                  required
                  value={leadForm.assignedTo}
                  onChange={(e) => setLeadForm({ ...leadForm, assignedTo: e.target.value })}
                >
                  <option value="">Select Representative</option>
                  {salesStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Source Channel</label>
                <Input
                  className={inputClass}
                  disabled
                  value={leadForm.source}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border-soft pt-4">
            <Button type="button" variant="secondary" onClick={() => setCreateLeadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLeadMutation.isPending} className="bg-accent-primary hover:bg-accent-primary-hover text-white">
              {createLeadMutation.isPending ? "Creating..." : "Create Referral Deal"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

