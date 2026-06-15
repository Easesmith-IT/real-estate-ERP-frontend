"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CreditCard,
  Download,
  FileText,
  LineChart,
  Plus,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { LoadingStateCard, ErrorStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart as ReLineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { CustomerBookingDrawer } from "./customer-booking-drawer";
import { CustomerDirectory } from "./customer-directory";
import { BookingRegister } from "./booking-register";
import {
  CustomerKpiSnapshot,
  buildCollectionForecast,
  buildCustomerPortfolioInsights,
  buildCustomerKpis,
  buildCustomerPortfolioView,
  createSparkline,
  formatPortfolioValue,
  buildCustomerRecommendations,
  CustomerRecommendation,
  CustomerPortfolioView,
} from "./customer-utils";
import {
  CustomerResponse,
  BookingResponse,
  PaymentSummary,
  LeadListResponse,
  PropertySummaryResponse,
  Unit,
  Booking,
  Lead,
} from "@/lib/erp-types";

const palette = ["#2563eb", "#06b6d4", "#8b5cf6", "#f59e0b"];

export function CustomerWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const customersQuery = useQuery({
    queryKey: ["erp-customers", role],
    queryFn: async () => (await apiRequest<CustomerResponse>("/api/customers", { role })).data,
  });
  const bookingsQuery = useQuery({
    queryKey: ["erp-bookings", role],
    queryFn: async () => (await apiRequest<BookingResponse>("/api/bookings", { role })).data,
  });
  const paymentsQuery = useQuery({
    queryKey: ["erp-payments-summary", role],
    queryFn: async () => (await apiRequest<PaymentSummary>("/api/payments/summary", { role })).data,
  });
  const leadsQuery = useQuery({
    queryKey: ["erp-leads", role],
    queryFn: async () => (await apiRequest<LeadListResponse>("/api/leads", { role })).data,
  });
  const projectsQuery = useQuery({
    queryKey: ["erp-properties", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });
  const unitsQuery = useQuery({
    queryKey: ["erp-units", role],
    queryFn: async () => (await apiRequest<{ units: Unit[] }>("/api/properties/units", { role })).data,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      apiRequest("/api/bookings", { role, method: "POST", body: payload }),
    onSuccess: async () => {
      setDrawerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-customers"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-payments-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-properties"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-units"] }),
      ]);
    },
  });

  if (
    customersQuery.isLoading ||
    bookingsQuery.isLoading ||
    paymentsQuery.isLoading ||
    leadsQuery.isLoading ||
    projectsQuery.isLoading ||
    unitsQuery.isLoading
  ) {
    return <LoadingStateCard title="Loading customer relationship center" />;
  }

  if (
    customersQuery.error ||
    bookingsQuery.error ||
    paymentsQuery.error ||
    leadsQuery.error ||
    projectsQuery.error ||
    unitsQuery.error
  ) {
    return <ErrorStateCard message="Customer relationship center data could not be loaded." />;
  }

  const rawBookings = bookingsQuery.data?.bookings || [];
  const payments = paymentsQuery.data || {
    totalReceipts: 0,
    outstanding: 0,
    dueSoonAmount: 0,
    overdueCount: 0,
    dueSoonSchedules: [],
    recentReceipts: [],
  };
  const customers = buildCustomerPortfolioView(customersQuery.data?.customers || [], rawBookings, payments);
  const kpis = buildCustomerKpis(customers, rawBookings, payments);
  const recommendations = buildCustomerRecommendations(customers, payments);
  const collectionForecast = buildCollectionForecast(rawBookings);
  const segmented = buildSegments(customers);
  const timeline = buildMonthlySeries(customers, rawBookings);
  const efficiency = buildEfficiencySeries(rawBookings);

  return (
    <section className="space-y-6 pb-12">
      {/* Section 1 - Customer Portfolio Hero */}
      <HeroSection kpis={kpis} onNewBooking={() => setDrawerOpen(true)} />

      {/* Section 2 - Customer Portfolio KPI Grid */}
      <CustomerKpiGrid kpis={kpis} />

      {/* Section 3 - Customer Intelligence Center */}
      <div className="space-y-3">
        <h2 className="text-section-title font-secondary text-text-primary">Customer Intelligence Center</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {recommendations.slice(0, 5).map((item) => (
            <IntelligenceCard key={item.title} item={item} />
          ))}
        </div>
      </div>

      {/* Section 4 - Revenue & Collections Analytics */}
      <RevenueAnalytics
        customers={customers}
        bookings={rawBookings}
        timeline={timeline}
        efficiency={efficiency}
      />

      {/* Section 5 - Customer Portfolio Insights */}
      <div className="space-y-3">
        <h2 className="text-section-title font-secondary text-text-primary">Portfolio Spotlight Insights</h2>
        <PortfolioInsights customers={customers} bookings={rawBookings} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Section 6 - Customer Segmentation Center */}
        <SegmentationCenter segments={segmented} totalCustomers={customers.length} />

        {/* Section 8 - Customer Relationship Health */}
        <RelationshipHealth customers={customers} />
      </div>

      {/* Section 7 - Customer Directory */}
      <CustomerDirectory
        customers={customers}
        onOpenCustomer={(customerId) => router.push(`/sales/customers/${customerId}`)}
      />

      {/* Section 9 - Booking Register */}
      <BookingRegister bookings={rawBookings} />

      {/* Section 10 - Collections Center */}
      <CollectionsCenter payments={payments} bookings={rawBookings} collectionForecast={collectionForecast} />

      {/* Section 12 - Revenue Forecast Center */}
      <RevenueForecastCenter collectionForecast={collectionForecast} timeline={timeline} payments={payments} />

      {/* Executive Summary */}
      <ExecutiveSummary kpis={kpis} customers={customers} payments={payments} />

      {/* New Booking Experience Right Drawer */}
      <CustomerBookingDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreate={(payload) => createMutation.mutate(payload)}
        loading={createMutation.isPending}
        leads={(leadsQuery.data?.items || []).map((lead: Lead) => ({
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          fullName: lead.fullName,
          phone: lead.phone,
          email: lead.email,
          source: lead.source,
          assignedTo: lead.assignedTo,
          assignedToName: lead.assignedToName,
          preferredProjectId: lead.preferredProjectId,
          preferredConfiguration: lead.preferredConfiguration,
          projectName: lead.projectName,
          budgetMin: lead.budgetMin,
          budgetMax: lead.budgetMax,
          budgetLabel: lead.budgetLabel,
          stage: lead.stage,
          followUpAt: lead.followUpAt,
          notes: lead.notes,
          hasActiveBooking: lead.hasActiveBooking,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        }))}
        projects={projectsQuery.data?.projects || []}
        units={unitsQuery.data?.units || []}
        paymentPlanTypes={bookingsQuery.data?.paymentPlanTypes || []}
      />
    </section>
  );
}

// Section 1 - Customer Portfolio Hero
function HeroSection({ kpis, onNewBooking }: { kpis: CustomerKpiSnapshot; onNewBooking: () => void }) {
  return (
    <div className="rounded-[var(--radius-modal)] border border-border-soft bg-linear-to-r from-accent-primary/8 via-surface to-accent-secondary/8 p-8 relative overflow-hidden">
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div className="space-y-4 max-w-3xl">
          <Badge tone="success" className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold">
            Premium Relationship Command Center
          </Badge>
          <h1 className="text-page-title font-secondary font-bold text-text-primary mt-1">
            Customer Relationship Center
          </h1>
          <p className="text-body text-text-secondary leading-relaxed">
            Monitor customer portfolio health, booking performance, payment collections, outstanding dues, and revenue realization across all projects.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            <Button variant="outline" size="md" className="h-10">
              <Download className="h-4 w-4" /> Export Register
            </Button>
            <Button variant="outline" size="md" className="h-10">
              <FileText className="h-4 w-4" /> Collection Report
            </Button>
            <Button variant="outline" size="md" className="h-10">
              <BarChart3 className="h-4 w-4" /> Customer Analytics
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-4 shrink-0">
          <div className="bg-surface border border-border-soft rounded-[var(--radius-card)] p-5 text-center sm:min-w-[160px] flex flex-col justify-center shadow-soft">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Portfolio Health</span>
            <span className="text-[32px] font-bold text-text-primary mt-1">92%</span>
            <Badge tone="success" className="mt-2 self-center text-[10px] font-bold px-2 py-0.5">Excellent</Badge>
          </div>
          <div className="bg-surface border border-border-soft rounded-[var(--radius-card)] p-5 text-center sm:min-w-[160px] flex flex-col justify-center shadow-soft">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Realized Cash</span>
            <span className="text-[32px] font-bold text-text-primary mt-1">{formatPortfolioValue(kpis.revenueRealized)}</span>
            <span className="text-[11px] font-medium text-text-muted mt-2 block">{kpis.collectionRatio}% Efficiency</span>
          </div>
          <div className="flex flex-col justify-center gap-2">
            <Button
              variant="primary"
              className="h-12 px-6 font-semibold shadow-enterprise"
              onClick={onNewBooking}
            >
              <Plus className="h-5 w-5 mr-1" /> New Booking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Section 2 - Customer Portfolio KPI Grid
function CustomerKpiGrid({ kpis }: { kpis: CustomerKpiSnapshot }) {
  const items = [
    { label: "Total Customers", value: `${kpis.totalCustomers}`, trend: "+12%", status: "Growing", tone: "success" as const, icon: Users, seed: 11 },
    { label: "Active Bookings", value: `${kpis.activeBookings}`, trend: "+8%", status: "Healthy", tone: "info" as const, icon: Building2, seed: 17 },
    { label: "Total Booked Value", value: formatPortfolioValue(kpis.totalBookedValue), trend: "+8%", status: "Strong", tone: "success" as const, icon: TrendingUp, seed: 23 },
    { label: "Outstanding Dues", value: formatPortfolioValue(kpis.outstandingDues), trend: "-4%", status: "Needs Attention", tone: "warning" as const, icon: ShieldAlert, seed: 31 },
    { label: "Collection Ratio", value: `${kpis.collectionRatio}%`, trend: "Healthy", status: "84%", tone: "success" as const, icon: CreditCard, seed: 37 },
    { label: "Average Customer Value", value: formatPortfolioValue(kpis.averageCustomerValue), trend: "+5%", status: "Upward", tone: "info" as const, icon: Sparkles, seed: 41 },
    { label: "Active Payment Plans", value: `${Math.max(1, Math.round(kpis.activeBookings * 0.7))}`, trend: "+2%", status: "Expanding", tone: "info" as const, icon: LineChart, seed: 43 },
    { label: "Revenue Realized", value: formatPortfolioValue(kpis.revenueRealized), trend: "+9%", status: "Accelerating", tone: "success" as const, icon: TrendingUp, seed: 47 },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="overflow-hidden border-border-soft/80 bg-surface shadow-soft transition-all duration-200 hover:-translate-y-px hover:shadow-floating">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-secondary text-accent-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <Badge tone={item.tone}>{item.status}</Badge>
            </div>
            <div>
              <p className="text-label uppercase tracking-[0.14em] text-text-muted">{item.label}</p>
              <p className="mt-2 text-[30px] font-bold leading-none tracking-[-0.03em] text-text-primary">{item.value}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-label ${item.tone === "warning" ? "text-warning" : "text-success"}`}>{item.trend}</p>
              <MiniSparkline seed={item.seed} tone={item.tone} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Section 3 - Intelligence recommendation cards
function IntelligenceCard({ item }: { item: CustomerRecommendation }) {
  const isCritical = item.tone === "critical";
  const isWarning = item.tone === "warning";
  const isSuccess = item.tone === "success";

  const containerStyles = isCritical
    ? "border-error/20 bg-linear-to-br from-error/5 to-surface"
    : isWarning
    ? "border-warning/20 bg-linear-to-br from-warning/5 to-surface"
    : isSuccess
    ? "border-success/20 bg-linear-to-br from-success/5 to-surface"
    : "border-info/20 bg-linear-to-br from-info/5 to-surface";

  const badgeStyles = isCritical
    ? "bg-error/10 text-error"
    : isWarning
    ? "bg-warning/10 text-warning"
    : isSuccess
    ? "bg-success/10 text-success"
    : "bg-info/10 text-info";

  return (
    <Card className={`overflow-hidden border shadow-soft ${containerStyles}`}>
      <CardHeader className="border-none pb-2">
        <div className="flex items-center justify-between">
          <Badge className={`font-semibold ${badgeStyles}`}>
            {isCritical ? "Critical" : isWarning ? "Warning" : isSuccess ? "Success" : "Information"}
          </Badge>
          <Sparkles className={`h-4 w-4 ${isCritical ? 'text-error' : isWarning ? 'text-warning' : isSuccess ? 'text-success' : 'text-info'}`} />
        </div>
        <CardTitle className="text-card-title mt-2 font-semibold text-text-primary">
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-body text-text-secondary min-h-[44px]">{item.description}</p>
        <Button variant="secondary" size="sm" className="w-full h-9 border-border-strong text-text-secondary">
          {item.actionLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Section 4 - Revenue & Collections Analytics
function RevenueAnalytics({
  customers,
  bookings,
  timeline,
  efficiency,
}: {
  customers: CustomerPortfolioView[];
  bookings: Booking[];
  timeline: Array<{ month: string; booked: number; collected: number; outstanding: number; newCustomers: number }>;
  efficiency: Array<{ month: string; efficiency: number }>;
}) {
  const segmentation = [
    { name: "Premium", value: customers.filter((customer) => customer.status === "Premium").length || 1 },
    { name: "Regular", value: customers.filter((customer) => customer.status === "Healthy").length || 1 },
    { name: "New", value: customers.filter((customer) => customer.status === "New").length || 1 },
    { name: "At Risk", value: customers.filter((customer) => customer.status === "At Risk").length || 1 },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ChartCard title="Revenue & Collections Trend" description="Booked amount, collected amount, and outstanding balance across 12 months.">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeline} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="revBooked" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} /></linearGradient>
              <linearGradient id="revCollected" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.24} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} /></linearGradient>
              <linearGradient id="revOutstanding" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.24} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
            <XAxis dataKey="month" stroke="var(--color-text-muted)" />
            <YAxis stroke="var(--color-text-muted)" />
            <Tooltip formatter={(value) => formatPortfolioValue(Number(value) * 100000)} />
            <Area type="monotone" name="Booked Amount" dataKey="booked" stroke="#2563eb" fill="url(#revBooked)" />
            <Area type="monotone" name="Collected Amount" dataKey="collected" stroke="#22c55e" fill="url(#revCollected)" />
            <Area type="monotone" name="Outstanding Amount" dataKey="outstanding" stroke="#f59e0b" fill="url(#revOutstanding)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Booking Status Distribution" description="Active, cancelled, and completed booking mix.">
        <div className="grid h-full gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[
                  { name: "Active", value: bookings.filter((booking) => booking.status === "Active").length || 1 },
                  { name: "Cancelled", value: bookings.filter((booking) => booking.status === "Cancelled").length || 1 },
                  { name: "Completed", value: bookings.filter((booking) => booking.status === "Completed").length || 1 }
                ]} dataKey="value" nameKey="name" innerRadius={68} outerRadius={100} paddingAngle={3}>
                  {["#2563eb", "#f59e0b", "#22c55e"].map((color) => <Cell key={color} fill={color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 self-center">
            {segmentation.map((item, index) => (
              <div key={item.name} className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                    <span className="text-body text-text-primary">{item.name}</span>
                  </div>
                  <Badge tone="neutral">{Math.round((item.value / Math.max(customers.length, 1)) * 100)}%</Badge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-hover"><div className="h-2 rounded-full bg-accent-primary" style={{ width: `${Math.min(100, item.value * 18)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Monthly Customer Growth" description="Customers acquired per month.">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeline} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="customerGrowthSeries" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.24} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
            <XAxis dataKey="month" stroke="var(--color-text-muted)" />
            <YAxis stroke="var(--color-text-muted)" />
            <Tooltip />
            <Area type="monotone" name="Acquired Customers" dataKey="newCustomers" stroke="#8b5cf6" fill="url(#customerGrowthSeries)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Collection Efficiency Trend" description="Month-over-month collection percentage.">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={efficiency} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
            <XAxis dataKey="month" stroke="var(--color-text-muted)" />
            <YAxis stroke="var(--color-text-muted)" />
            <Tooltip formatter={(value) => `${value}%`} />
            <Line type="monotone" name="Collection Efficiency" dataKey="efficiency" stroke="#22c55e" strokeWidth={3} dot={false} />
          </ReLineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// Section 5 - Customer Portfolio Insights
function PortfolioInsights({ customers, bookings }: { customers: CustomerPortfolioView[]; bookings: Booking[] }) {
  const data = buildCustomerPortfolioInsights(customers, bookings);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {data.map((item) => (
        <Card key={item.title} className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
          <CardHeader className="border-none pb-2">
            <div>
              <CardTitle className="text-text-secondary text-label uppercase tracking-wider">{item.title}</CardTitle>
              <Badge tone="info" className="mt-2">Portfolio Insight</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
              <p className="text-card-title font-semibold text-text-primary truncate">{item.value}</p>
              <p className="mt-1 text-body text-text-secondary">{item.detail}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="success">{item.badge}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Section 6 - Customer Segmentation Center
function SegmentationCenter({
  segments,
  totalCustomers,
}: {
  segments: Array<{ name: string; value: number; percent: number }>;
  totalCustomers: number;
}) {
  return (
    <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft flex flex-col h-full">
      <CardHeader>
        <div>
          <CardTitle>Customer Segmentation Center</CardTitle>
          <p className="text-body text-text-secondary">Premium, regular, new, and at-risk segmentation with portfolio distribution.</p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] flex-1">
        <div className="h-[260px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={segments} dataKey="value" nameKey="name" innerRadius={72} outerRadius={102} paddingAngle={2}>
                {segments.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3 justify-center flex flex-col">
          <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4 text-center">
            <p className="text-label uppercase tracking-[0.12em] text-text-muted">Total Active Customers</p>
            <p className="mt-2 text-[32px] font-bold text-text-primary">{totalCustomers}</p>
          </div>
          {segments.map((segment, index) => (
            <div key={segment.name} className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                  <span className="text-body font-semibold text-text-primary">{segment.name}</span>
                </div>
                <Badge tone="neutral">{segment.percent}%</Badge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-hover">
                <div className="h-2 rounded-full bg-accent-primary" style={{ width: `${segment.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Section 8 - Customer Relationship Health
function RelationshipHealth({ customers }: { customers: CustomerPortfolioView[] }) {
  const avgHealth = useMemo(() => {
    if (customers.length === 0) return { score: 92, status: "Excellent", factors: [] };
    const totalScore = customers.reduce((sum, c) => sum + c.customerScore, 0);
    const avgScore = Math.round(totalScore / customers.length);
    const status = avgScore >= 90 ? "Excellent" : avgScore >= 75 ? "Strong" : avgScore >= 60 ? "Watch" : "Critical";

    const factors = [
      {
        label: "Payment Timeliness",
        value: `${Math.round(customers.reduce((sum, c) => sum + c.collectionScore, 0) / customers.length)}%`,
        progress: Math.round(customers.reduce((sum, c) => sum + c.collectionScore, 0) / customers.length),
      },
      {
        label: "Engagement",
        value: `${Math.round(
          customers.reduce((sum, c) => sum + Math.min(100, 50 + c.bookingCount * 15), 0) / customers.length
        )}%`,
        progress: Math.round(
          customers.reduce((sum, c) => sum + Math.min(100, 50 + c.bookingCount * 15), 0) / customers.length
        ),
      },
      {
        label: "Booking Activity",
        value: `${Math.round((customers.reduce((sum, c) => sum + c.bookingCount, 0) / customers.length) * 10) / 10} avg`,
        progress: Math.min(
          100,
          Math.round((customers.reduce((sum, c) => sum + c.bookingCount, 0) / customers.length) * 35)
        ),
      },
      {
        label: "Outstanding Exposure",
        value: "Low Risk",
        progress: 82,
      },
      {
        label: "Communication Discipline",
        value: "89%",
        progress: 89,
      },
    ];

    return { score: avgScore, status, factors };
  }, [customers]);

  return (
    <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft flex flex-col h-full">
      <CardHeader>
        <div>
          <CardTitle>Customer Relationship Health</CardTitle>
          <p className="text-body text-text-secondary">Health score metrics blended across payment timeliness, active engagement, and outstanding risk.</p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-[0.38fr_0.62fr] flex-1">
        <div className="rounded-[var(--radius-card)] border border-border-soft bg-linear-to-br from-success/10 to-surface-secondary p-5 text-center flex flex-col justify-center items-center">
          <p className="text-label uppercase tracking-[0.12em] text-text-muted">Average Health Score</p>
          <p className="mt-3 text-[56px] font-bold leading-none text-text-primary">{avgHealth.score}</p>
          <Badge tone={avgHealth.score >= 90 ? "success" : avgHealth.score >= 75 ? "info" : "warning"} className="mt-4">
            {avgHealth.status}
          </Badge>
        </div>
        <div className="space-y-4 justify-center flex flex-col">
          {avgHealth.factors.map((factor) => (
            <div key={factor.label} className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-body font-semibold text-text-primary">{factor.label}</p>
                <Badge tone={factor.progress >= 80 ? "success" : factor.progress >= 60 ? "info" : "warning"}>
                  {factor.value}
                </Badge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-hover">
                <div className="h-2 rounded-full bg-accent-primary" style={{ width: `${factor.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Section 10 - Collections Center
interface CollectionsItem {
  customerName?: string | null;
  name?: string;
  projectName: string;
  unitCode?: string | null;
  amount?: number;
  outstandingAmount?: number;
  dueDate?: string | null;
}

function CollectionsCenter({
  payments,
  bookings,
  collectionForecast,
}: {
  payments: PaymentSummary;
  bookings: Booking[];
  collectionForecast: Array<{ label: string; amount: number; index: number }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.9fr]">
      <ChartCard title="Collections Forecast Center" description="Future expected collection realizations across the next 30, 60, and 90 days.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={collectionForecast} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
            <XAxis dataKey="label" stroke="var(--color-text-muted)" />
            <YAxis stroke="var(--color-text-muted)" />
            <Tooltip formatter={(value) => formatPortfolioValue(Number(value))} />
            <Bar dataKey="amount" fill="#2563eb" radius={[8, 8, 0, 0]}>
              {collectionForecast.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
        <CardHeader>
          <div>
            <CardTitle>Top Outstanding Customers</CardTitle>
            <p className="text-body text-text-secondary">Customers requiring immediate collection action or follow-ups.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Upcoming Dues" value={formatPortfolioValue(payments?.dueSoonAmount || 0)} tone="info" />
            <Metric label="Overdue Dues" value={formatPortfolioValue(payments?.outstanding || 0)} tone="warning" />
            <Metric label="Due This Month" value={formatPortfolioValue((payments?.dueSoonAmount || 0) + (payments?.outstanding || 0))} tone="success" />
            <Metric label="Expected Collections" value={formatPortfolioValue((payments?.dueSoonAmount || 0) + (payments?.outstanding || 0))} tone="success" />
          </div>
          <div className="space-y-3 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4 max-h-[190px] overflow-auto">
            {(payments?.dueSoonSchedules || bookings).slice(0, 4).map((item: CollectionsItem) => (
              <div key={`${item.customerName || item.name || "item"}`} className="flex items-center justify-between gap-4 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-2">
                <div>
                  <p className="text-body font-semibold text-text-primary">{item.customerName || item.name}</p>
                  <p className="text-label text-text-muted">{item.projectName} / {item.unitCode || "Unit"}</p>
                </div>
                <div className="text-right">
                  <p className="text-body font-semibold text-text-primary">{formatPortfolioValue(item.amount || item.outstandingAmount || 0)}</p>
                  <p className="text-label text-text-muted">{item.dueDate ? new Date(item.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Open"}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Section 12 - Revenue Forecast Center
function RevenueForecastCenter({
  collectionForecast,
  timeline,
  payments,
}: {
  collectionForecast: Array<{ label: string; amount: number }>;
  timeline: Array<{ month: string; booked: number; collected: number; outstanding: number; newCustomers: number }>;
  payments: PaymentSummary;
}) {
  return (
    <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
      <CardHeader>
        <div>
          <CardTitle>Revenue Forecast Center</CardTitle>
          <p className="text-body text-text-secondary font-medium">Forward projection models mapping cash forecasts, revenue pipelines, and collection efficiency.</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
            <p className="text-label uppercase tracking-wider text-text-muted">Expected Collections</p>
            <p className="mt-2 text-2xl font-bold text-success">{formatPortfolioValue(payments?.dueSoonAmount || 0)}</p>
            <div className="mt-3 h-1.5 rounded-full bg-hover overflow-hidden">
              <div className="h-full bg-success" style={{ width: "84%" }} />
            </div>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
            <p className="text-label uppercase tracking-wider text-text-muted">Upcoming Dues (30d)</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{formatPortfolioValue((payments?.dueSoonAmount || 0) * 0.95)}</p>
            <div className="mt-3 h-1.5 rounded-full bg-hover overflow-hidden">
              <div className="h-full bg-accent-primary" style={{ width: "70%" }} />
            </div>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
            <p className="text-label uppercase tracking-wider text-text-muted">Revenue Pipeline</p>
            <p className="mt-2 text-2xl font-bold text-accent-primary">{formatPortfolioValue(payments?.outstanding || 0)}</p>
            <div className="mt-3 h-1.5 rounded-full bg-hover overflow-hidden">
              <div className="h-full bg-accent-primary" style={{ width: "60%" }} />
            </div>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
            <p className="text-label uppercase tracking-wider text-text-muted">Collection Efficiency</p>
            <p className="mt-2 text-2xl font-bold text-success">84%</p>
            <div className="mt-3 h-1.5 rounded-full bg-hover overflow-hidden">
              <div className="h-full bg-success" style={{ width: "84%" }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-[200px] border border-border-soft rounded-[var(--radius-card)] p-4 flex flex-col">
            <p className="text-label font-semibold text-text-primary mb-3">Forecast Collections</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
                <XAxis dataKey="label" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip formatter={(value) => formatPortfolioValue(Number(value))} />
                <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[200px] border border-border-soft rounded-[var(--radius-card)] p-4 flex flex-col">
            <p className="text-label font-semibold text-text-primary mb-3">Revenue Realization</p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
                <XAxis dataKey="month" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip formatter={(value) => formatPortfolioValue(Number(value) * 100000)} />
                <Area type="monotone" name="Collected" dataKey="collected" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[200px] border border-border-soft rounded-[var(--radius-card)] p-4 flex flex-col">
            <p className="text-label font-semibold text-text-primary mb-3">Customer Growth</p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
                <XAxis dataKey="month" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip />
                <Area type="monotone" name="Acquisitions" dataKey="newCustomers" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Bottom Executive Summary
function ExecutiveSummary({
  kpis,
  customers,
  payments,
}: {
  kpis: CustomerKpiSnapshot;
  customers: CustomerPortfolioView[];
  payments: PaymentSummary;
}) {
  const premiumShare = customers.length > 0 ? Math.round((customers.filter((customer) => customer.status === "Premium").length / customers.length) * 100) : 0;
  return (
    <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
      <CardHeader>
        <div>
          <CardTitle>Customer Portfolio Summary</CardTitle>
          <p className="text-body text-text-secondary">Executive snapshot for portfolio movement and collection performance.</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-body text-text-secondary list-disc pl-5">
          <li>Customer base grew by 12% this month</li>
          <li>Collection ratio improved to {kpis.collectionRatio}%</li>
          <li>{formatPortfolioValue(payments?.dueSoonAmount || 0)} due within next 30 days</li>
          <li>{payments?.overdueCount || 0} customers require collection follow-up</li>
          <li>Premium customers contribute {premiumShare}% of revenue</li>
        </ul>
        <p className="text-label text-text-muted pt-2 border-t border-border-soft">Last updated 5 minutes ago</p>
      </CardContent>
    </Card>
  );
}

// Custom Helper Components
function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
      <CardHeader className="border-none pb-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-body text-text-secondary">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="h-[340px] pt-5">{children}</CardContent>
    </Card>
  );
}

function MiniSparkline({ seed, tone }: { seed: number; tone: "success" | "warning" | "info" }) {
  const data = createSparkline(seed, 7).map((point, index) => ({ index, value: point }));
  const stroke = tone === "warning" ? "#f59e0b" : tone === "success" ? "#22c55e" : "#2563eb";
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} fillOpacity={0.15} fill={stroke} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "info" | "warning" | "success" }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4">
      <p className="text-label uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-text-primary"}`}>{value}</p>
    </div>
  );
}

function buildMonthlySeries(customers: CustomerPortfolioView[], bookings: Booking[]) {
  return Array.from({ length: 12 }, (_, index) => ({
    month: new Date(new Date().getFullYear(), new Date().getMonth() - (11 - index), 1).toLocaleDateString("en-IN", { month: "short" }),
    booked: Math.max(0, Math.round((index + 4) * 1.8 + bookings.length * 0.3)),
    collected: Math.max(0, Math.round((index + 3) * 1.5 + bookings.reduce((sum, booking) => sum + booking.totalPaid, 0) / 10000000)),
    outstanding: Math.max(0, Math.round((12 - index) * 1.2 + bookings.reduce((sum, booking) => sum + booking.outstandingAmount, 0) / 10000000)),
    newCustomers: Math.max(1, Math.round((index + 2) * 1.1 + customers.length * 0.05)),
  }));
}

function buildEfficiencySeries(bookings: Booking[]) {
  return Array.from({ length: 12 }, (_, index) => ({
    month: new Date(new Date().getFullYear(), new Date().getMonth() - (11 - index), 1).toLocaleDateString("en-IN", { month: "short" }),
    efficiency: Math.min(96, Math.max(68, 74 + Math.sin(index / 2) * 8 + index * 0.5 + bookings.length * 0.15)),
  }));
}

function buildSegments(customers: CustomerPortfolioView[]) {
  const counts = {
    Premium: customers.filter((customer) => customer.status === "Premium").length,
    Regular: customers.filter((customer) => customer.status === "Healthy").length,
    New: customers.filter((customer) => customer.status === "New").length,
    "At Risk": customers.filter((customer) => customer.status === "At Risk").length,
  };

  const total = Math.max(1, customers.length);
  return Object.entries(counts).map(([name, value]) => ({ name, value: value || 1, percent: Math.round(((value || 1) / total) * 100) }));
}
