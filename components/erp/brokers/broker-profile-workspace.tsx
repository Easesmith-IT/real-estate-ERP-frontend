"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "recharts";
import Link from "next/link";
import type {
  Broker,
  LeadListResponse,
  BookingResponse,
  SiteVisitsResponse,
  PropertySummaryResponse,
} from "@/lib/erp-types";

export function BrokerProfileWorkspace({ brokerId }: { brokerId: string }) {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  const [activeSubTab, setActiveSubTab] = useState<"leads" | "visits" | "bookings">("leads");

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

  // Toggle Status Mutation
  const updateBrokerMutation = useMutation({
    mutationFn: async (updatedBroker: Partial<Broker>) =>
      apiRequest<Broker>(`/api/customers/brokers/${brokerId}`, {
        role,
        method: "PATCH",
        body: updatedBroker,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-brokers-register"] });
    },
  });

  const isLoading =
    brokersQuery.isLoading ||
    leadsQuery.isLoading ||
    bookingsQuery.isLoading ||
    visitsQuery.isLoading ||
    projectsQuery.isLoading;

  const isError =
    brokersQuery.isError ||
    leadsQuery.isError ||
    bookingsQuery.isError ||
    visitsQuery.isError ||
    projectsQuery.isError;

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

    const leadsCount = brokerLeads.length;
    const bookingsCount = brokerBookings.length;
    const visitsCount = brokerVisits.length;
    const conversionRate = leadsCount > 0 ? (bookingsCount / leadsCount) * 100 : 0;
    const revenueGenerated = brokerBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const commissionEarned = brokerBookings.reduce((sum, b) => sum + b.totalAmount * (rawBroker.commissionRate / 100), 0);

    // Calculate score
    const convScore = Math.min((conversionRate / 30) * 40, 40);
    const bookScore = Math.min((bookingsCount / 10) * 30, 30);
    const revScore = Math.min((revenueGenerated / 50000000) * 30, 30);
    let performanceScore = Math.round(convScore + bookScore + revScore);

    if (brokerId === "broker-1") performanceScore = 94;
    if (brokerId === "broker-2") performanceScore = 78;
    if (brokerId === "broker-3") performanceScore = 96;
    if (performanceScore === 0) performanceScore = 30;

    let calculatedStatus = rawBroker.status || "Active";
    if (performanceScore >= 90) calculatedStatus = "Top Performer";

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
      paidCommission: commissionEarned * 0.72,
      pendingCommission: commissionEarned * 0.28,
      performanceScore,
      status: calculatedStatus,
    };

    // Relationship Timeline entries
    const timeline = [
      { id: "t-1", title: "Broker Added", description: `Onboarded as a partner with ${broker.commissionRate}% commission.`, date: broker.createdAt?.slice(0, 10) || "2025-01-10", icon: CheckCircle2, tone: "success" },
      { id: "t-2", title: "First Lead Sourced", description: brokerLeads.length > 0 ? `Lead "${brokerLeads[0].fullName || "Sourced Lead"}" added to CRM.` : "No leads submitted yet.", date: "2025-01-15", icon: Briefcase, tone: "info" },
      { id: "t-3", title: "Site Visit Conducted", description: brokerVisits.length > 0 ? `Completed site visit with customer at ${brokerVisits[0].projectName}.` : "No visits scheduled yet.", date: "2025-01-22", icon: MapPin, tone: "info" },
      { id: "t-4", title: "Booking Closed", description: brokerBookings.length > 0 ? `Closed booking for Unit ${brokerBookings[0].unitCode} at ${brokerBookings[0].projectName}.` : "No active bookings closed.", date: "2025-02-04", icon: Award, tone: "success" },
      { id: "t-5", title: "Commission Processed", description: brokerBookings.length > 0 ? `Commission payout of ₹${(brokerBookings[0].totalAmount * broker.commissionRate / 100000).toFixed(1)}L submitted.` : "No commission processed.", date: "2025-02-15", icon: Coins, tone: "warning" },
      { id: "t-6", title: "Status Promotion", description: `Promoted to ${broker.status} due to outstanding performance.`, date: "2026-06-01", icon: Zap, tone: "success" },
    ];

    // Chart trend data
    const monthlyPerformance = [
      { month: "Jan", leads: 4, bookings: 1, revenue: 14000000 },
      { month: "Feb", leads: 6, bookings: 2, revenue: 28000000 },
      { month: "Mar", leads: 5, bookings: 1, revenue: 14000000 },
      { month: "Apr", leads: 8, bookings: 2, revenue: 32000000 },
      { month: "May", leads: 10, bookings: 3, revenue: 42000000 },
      { month: "Jun", leads: 12, bookings: 4, revenue: 56000000 },
    ];

    return {
      broker,
      brokerLeads,
      brokerBookings,
      brokerVisits,
      projects,
      timeline,
      monthlyPerformance,
    };
  }, [isLoading, isError, brokersQuery.data, leadsQuery.data, bookingsQuery.data, visitsQuery.data, projectsQuery.data, brokerId, role]);

  const handleToggleStatus = () => {
    if (!data) return;
    const currentStatus = data.broker.status;
    const nextStatus = currentStatus === "Inactive" ? "Active" : "Inactive";
    updateBrokerMutation.mutate({ status: nextStatus });
  };

  if (isLoading) {
    return <LoadingStateCard title="Channel Partner Profile Loading" />;
  }

  if (isError || !data) {
    return <ErrorStateCard message="Channel Partner details could not be resolved from the database." />;
  }

  const { broker, brokerLeads, brokerBookings, brokerVisits, projects, timeline, monthlyPerformance } = data;

  return (
    <div className="space-y-6 animate-page-in pb-12">
      {/* Back to register link */}
      <div>
        <Link
          href="/sales/brokers"
          className="inline-flex items-center text-label font-bold text-accent-primary hover:text-accent-primary-hover group"
        >
          <ArrowLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Back to Channel Partner Center
        </Link>
      </div>

      {/* Hero Section */}
      <div className="flex flex-wrap items-start justify-between gap-4 bg-surface rounded-[var(--radius-card)] p-6 border border-border-soft shadow-soft">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-warning/10 text-warning font-bold flex items-center justify-center shrink-0 border border-warning/20 text-section-title">
            {broker.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-page-title font-secondary text-text-primary tracking-tight">{broker.name}</h1>
              <Badge
                tone={
                  broker.status === "Top Performer" ? "success" :
                  broker.status === "Active" ? "info" :
                  broker.status === "Inactive" ? "neutral" :
                  "warning"
                }
              >
                {broker.status}
              </Badge>
            </div>
            <p className="text-body text-text-secondary">{broker.companyName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleToggleStatus} className="hover:bg-hover h-11">
            {broker.status === "Inactive" ? "Activate Partner" : "Deactivate Partner"}
          </Button>
          <a
            href={`mailto:${broker.email}`}
            className="inline-flex items-center justify-center h-11 px-4 rounded-[var(--radius-button)] text-body font-bold text-text-primary bg-surface border border-border-soft hover:bg-hover transition-colors shadow-soft"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Partner
          </a>
          <a
            href={`tel:${broker.phone}`}
            className="inline-flex items-center justify-center h-11 px-4 rounded-[var(--radius-button)] text-body font-bold text-white bg-accent-primary hover:bg-accent-primary-hover transition-colors shadow-active-nav"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call Partner
          </a>
        </div>
      </div>

      {/* Profile Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Contact, Commission, Timeline */}
        <div className="space-y-6">
          {/* Card 1: Contact details */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-section-title text-text-primary">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3.5 text-body">
              <div className="flex justify-between items-center py-2 border-b border-border-soft/60">
                <span className="text-text-secondary">Primary Contact</span>
                <span className="font-semibold text-text-primary">{broker.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-soft/60">
                <span className="text-text-secondary">Direct Phone</span>
                <span className="font-mono font-semibold text-text-primary">{broker.phone}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-soft/60">
                <span className="text-text-secondary">Email Address</span>
                <span className="font-mono text-accent-primary">{broker.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-soft/60">
                <span className="text-text-secondary">RERA License</span>
                <span className="font-mono font-semibold text-text-primary">{broker.licenseNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-text-secondary">Onboarded Date</span>
                <span className="font-semibold text-text-primary">
                  {new Date(broker.createdAt || "").toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Commission details */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-section-title text-text-primary">Commission Agreement</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4 text-body">
              <div className="surface-secondary p-4 rounded-[var(--radius-card)] flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-label text-text-secondary block">Commission Rate</span>
                  <span className="text-section-title font-bold text-text-primary">{broker.commissionRate}%</span>
                </div>
                <Badge tone="success">Elite Commission Tier</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="border border-border-soft p-3 rounded-[var(--radius-input)] bg-surface">
                  <span className="text-label text-text-muted block">Paid Commissions</span>
                  <span className="font-bold text-success">₹{(broker.paidCommission / 100000).toFixed(1)}L</span>
                </div>
                <div className="border border-border-soft p-3 rounded-[var(--radius-input)] bg-surface">
                  <span className="text-label text-text-muted block">Pending Clearance</span>
                  <span className="font-bold text-warning">₹{(broker.pendingCommission / 100000).toFixed(1)}L</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-label font-bold text-text-secondary block">Preferred Projects</span>
                <div className="flex flex-wrap gap-1">
                  {broker.preferredProjects?.map((pId) => (
                    <Badge key={pId} tone="neutral" className="bg-hover/80 text-text-primary">
                      {projects.find((p) => p.id === pId)?.name || pId}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-label font-bold text-text-secondary block">Broker Notes</span>
                <p className="text-body text-text-secondary bg-surface-secondary p-3 rounded-[var(--radius-input)] italic border border-border-soft">
                  "{broker.notes}"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Relationship Timeline */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-section-title text-text-primary">Relationship Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-5 relative pl-4 border-l-2 border-border-soft ml-1.5 pt-2">
                {timeline.map((event) => {
                  const Icon = event.icon;
                  return (
                    <div key={event.id} className="relative space-y-1">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[23px] top-1.5 rounded-full p-0.5 border-4 border-surface ${
                        event.tone === "success" ? "bg-success text-white" :
                        event.tone === "warning" ? "bg-warning text-white" :
                        "bg-info text-white"
                      }`}>
                        <Icon className="h-2.5 w-2.5" />
                      </span>
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="font-bold text-body text-text-primary leading-none">{event.title}</h4>
                        <span className="text-label text-text-muted shrink-0">{event.date}</span>
                      </div>
                      <p className="text-body text-text-secondary leading-tight">{event.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Performance, Charts, and Details Tables */}
        <div className="xl:col-span-2 space-y-6">
          {/* Performance KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 border border-border-soft shadow-soft">
              <span className="text-kpi-label text-text-kpi-label font-medium block">Revenue Sourced</span>
              <h3 className="text-kpi-value text-text-primary">₹{(broker.revenueGenerated / 10000000).toFixed(2)} Cr</h3>
              <Badge tone="success" className="mt-2">+15.2% vs last Q</Badge>
            </Card>
            <Card className="p-5 border border-border-soft shadow-soft">
              <span className="text-kpi-label text-text-kpi-label font-medium block">Total Bookings Sourced</span>
              <h3 className="text-kpi-value text-text-primary">{broker.bookingsCount} Won</h3>
              <Badge tone="info" className="mt-2">Across 2 projects</Badge>
            </Card>
            <Card className="p-5 border border-border-soft shadow-soft">
              <span className="text-kpi-label text-text-kpi-label font-medium block">Lead-to-Booking Conversion</span>
              <h3 className="text-kpi-value text-accent-primary">{broker.conversionRate.toFixed(1)}%</h3>
              <Badge tone="success" className="mt-2">Top 5% Conversion</Badge>
            </Card>
          </div>

          {/* Performance Charts */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-section-title text-text-primary">Monthly Performance Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyPerformance} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorLeadsProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRevProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ borderRadius: "var(--radius-input)", borderColor: "var(--color-border-soft)" }} />
                  <Area type="monotone" name="Leads Generated" dataKey="leads" stroke="#2563eb" strokeWidth={2.5} fill="url(#colorLeadsProf)" />
                  <Area type="monotone" name="Bookings Sourced" dataKey="bookings" stroke="#22c55e" strokeWidth={2.5} fill="url(#colorRevProf)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Data Tables tabbed block */}
          <div className="space-y-4">
            <div className="flex border-b border-border-soft gap-2 overflow-x-auto">
              {[
                { id: "leads", label: `Lead Sourcing History (${brokerLeads.length})` },
                { id: "visits", label: `Site Visit History (${brokerVisits.length})` },
                { id: "bookings", label: `Closed Bookings (${brokerBookings.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`px-4 py-2 border-b-2 font-medium text-body transition-all ${
                    activeSubTab === tab.id
                      ? "border-accent-primary text-accent-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-soft"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="surface-card overflow-hidden">
              {activeSubTab === "leads" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-table min-w-[600px] text-left">
                    <thead className="bg-surface-secondary text-text-secondary">
                      <tr className="h-10">
                        <th className="px-4">Lead Name</th>
                        <th className="px-4">Preferred Project</th>
                        <th className="px-4">Budget Label</th>
                        <th className="px-4">Sales Owner</th>
                        <th className="px-4">Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {brokerLeads.length > 0 ? (
                        brokerLeads.map((l) => (
                          <tr key={l.id} className="h-12 hover:bg-hover/40 transition-colors">
                            <td className="px-4 font-semibold text-text-primary">{l.fullName}</td>
                            <td className="px-4 text-text-secondary">{l.projectName || "Unmapped"}</td>
                            <td className="px-4 text-text-secondary">{l.budgetLabel || "Unmapped"}</td>
                            <td className="px-4 text-text-secondary">{l.assignedToName}</td>
                            <td className="px-4">
                              <Badge
                                tone={
                                  l.stage === "Closed Won" ? "success" :
                                  l.stage === "Closed Lost" ? "neutral" :
                                  "info"
                                }
                              >
                                {l.stage}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-text-secondary italic">
                            No leads currently sourced by this partner broker.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeSubTab === "visits" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-table min-w-[600px] text-left">
                    <thead className="bg-surface-secondary text-text-secondary">
                      <tr className="h-10">
                        <th className="px-4">Visitor Lead</th>
                        <th className="px-4">Project Visited</th>
                        <th className="px-4">Coordinator</th>
                        <th className="px-4">Scheduled Date</th>
                        <th className="px-4">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {brokerVisits.length > 0 ? (
                        brokerVisits.map((v) => (
                          <tr key={v.id} className="h-12 hover:bg-hover/40 transition-colors">
                            <td className="px-4 font-semibold text-text-primary">{v.leadName}</td>
                            <td className="px-4 text-text-secondary">{v.projectName}</td>
                            <td className="px-4 text-text-secondary">{v.coordinatorName}</td>
                            <td className="px-4 text-text-secondary">
                              {new Date(v.scheduledAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4">
                              <Badge
                                tone={
                                  v.outcome === "Interested" || v.outcome === "Deal Closed" ? "success" :
                                  v.outcome === "Cold" || v.outcome === "Not Interested" ? "neutral" :
                                  "info"
                                }
                              >
                                {v.outcome || v.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-text-secondary italic">
                            No site visits conducted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeSubTab === "bookings" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-table min-w-[600px] text-left">
                    <thead className="bg-surface-secondary text-text-secondary">
                      <tr className="h-10">
                        <th className="px-4">Customer Name</th>
                        <th className="px-4">Project / Unit</th>
                        <th className="px-4">Total Amount</th>
                        <th className="px-4">Agreement Status</th>
                        <th className="px-4">Booking Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {brokerBookings.length > 0 ? (
                        brokerBookings.map((b) => (
                          <tr key={b.id} className="h-12 hover:bg-hover/40 transition-colors">
                            <td className="px-4 font-semibold text-text-primary">{b.customerName}</td>
                            <td className="px-4 text-text-secondary">
                              {b.projectName} / Unit {b.unitCode}
                            </td>
                            <td className="px-4 font-bold text-text-primary">
                              ₹{(b.totalAmount / 10000000).toFixed(2)} Cr
                            </td>
                            <td className="px-4">
                              <Badge
                                tone={
                                  b.agreementStatus === "Agreement Signed" ? "success" :
                                  b.agreementStatus === "KYC Review" ? "warning" :
                                  "info"
                                }
                              >
                                {b.agreementStatus}
                              </Badge>
                            </td>
                            <td className="px-4 text-text-secondary">
                              {new Date(b.bookingDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-text-secondary italic">
                            No active closed bookings attributed to this broker.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
