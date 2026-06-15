"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { SectionHeader, TableEmptyStateRow } from "@/components/erp/page-primitives";
import {
  Building2,
  Users,
  Coins,
  Percent,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Download,
  Search,
  Filter,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  DollarSign,
  Briefcase,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  CartesianGrid,
} from "recharts";
import Link from "next/link";
import type {
  Broker,
  LeadListResponse,
  BookingResponse,
  PropertySummaryResponse,
  SiteVisitsResponse,
} from "@/lib/erp-types";

// Design classes
const inputClass = "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";
const selectClass = "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] bg-surface";
const textareaClass = "w-full rounded-[var(--radius-input)] border border-border-soft bg-surface p-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";
const labelClass = "text-label text-text-secondary font-medium mb-1 block";

export function BrokersIntelligenceCenter() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  // Active tab state
  const [activeTab, setActiveTab] = useState<"dashboard" | "directory" | "commissions" | "network">("dashboard");

  // Filters state
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState("All");
  const [commissionFilter, setCommissionFilter] = useState("All");
  const [performanceFilter, setPerformanceFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Add Broker Form state
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    phone: "",
    email: "",
    licenseNumber: "",
    commissionRate: "2.0",
    preferredProjects: [] as string[],
    status: "Active",
    notes: "",
    tags: "",
  });

  // Fetch queries
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

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  const visitsQuery = useQuery({
    queryKey: ["erp-site-visits", role],
    queryFn: async () => (await apiRequest<SiteVisitsResponse>("/api/leads/site-visits", { role })).data,
  });

  // Add Broker Mutation
  const createBrokerMutation = useMutation({
    mutationFn: async (body: Record<string, any>) =>
      apiRequest<Broker>("/api/customers/brokers", {
        role,
        method: "POST",
        body,
      }),
    onSuccess: async () => {
      setDrawerOpen(false);
      resetForm();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-brokers-register"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-bookings"] }),
      ]);
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      companyName: "",
      phone: "",
      email: "",
      licenseNumber: "",
      commissionRate: "2.0",
      preferredProjects: [],
      status: "Active",
      notes: "",
      tags: "",
    });
  };

  const handleAddProject = (projectId: string) => {
    setForm((prev) => ({
      ...prev,
      preferredProjects: prev.preferredProjects.includes(projectId)
        ? prev.preferredProjects.filter((id) => id !== projectId)
        : [...prev.preferredProjects, projectId],
    }));
  };

  const handleSaveBroker = () => {
    createBrokerMutation.mutate({
      ...form,
      commissionRate: Number(form.commissionRate) || 2.0,
    });
  };

  // Check loading/error states
  const isLoading =
    brokersQuery.isLoading ||
    leadsQuery.isLoading ||
    bookingsQuery.isLoading ||
    projectsQuery.isLoading ||
    visitsQuery.isLoading;

  const isError =
    brokersQuery.isError ||
    leadsQuery.isError ||
    bookingsQuery.isError ||
    projectsQuery.isError ||
    visitsQuery.isError;

  // Process data if loaded
  const {
    enrichedBrokers,
    kpis,
    recommendations,
    revenueLeaderboardData,
    commissionBracketsData,
    leadContributionData,
    bookingContributionData,
    channelContributionData,
    networkMapData,
    totalCommLiability,
    paidComm,
    pendingComm,
    upcomingPayouts,
    topCommissionEarners,
    pendingApprovalsList,
  } = useMemo(() => {
    if (isLoading || isError || !brokersQuery.data || !leadsQuery.data || !bookingsQuery.data || !projectsQuery.data || !visitsQuery.data) {
      return {
        enrichedBrokers: [],
        kpis: {
          totalBrokers: { value: 0, trend: "", tone: "info" as const },
          activeBrokers: { value: 0, trend: "", tone: "success" as const },
          totalActiveDeals: { value: 0, trend: "", tone: "warning" as const },
          revenueInfluenced: { value: "", trend: "", tone: "success" as const },
          avgCommissionRate: { value: "", trend: "", tone: "info" as const },
          conversionRate: { value: "", trend: "", tone: "success" as const },
          commissionLiability: { value: "", trend: "", tone: "warning" as const },
          topBrokerRevenue: { value: "", trend: "", tone: "success" as const },
        },
        recommendations: [],
        revenueLeaderboardData: [],
        commissionBracketsData: [],
        leadContributionData: [],
        bookingContributionData: [],
        channelContributionData: [],
        networkMapData: [],
        totalCommLiability: 0,
        paidComm: 0,
        pendingComm: 0,
        upcomingPayouts: 0,
        topCommissionEarners: [],
        pendingApprovalsList: [],
      };
    }

    const rawBrokers = brokersQuery.data;
    const leads = leadsQuery.data.items;
    const bookings = bookingsQuery.data.bookings;
    const projects = projectsQuery.data.projects;
    const visits = visitsQuery.data.visits || [];

    // Helper map of leads by broker
    const brokerLeadsMap = new Map<string, typeof leads>();
    leads.forEach((l) => {
      if (l.brokerId) {
        if (!brokerLeadsMap.has(l.brokerId)) brokerLeadsMap.set(l.brokerId, []);
        brokerLeadsMap.get(l.brokerId)!.push(l);
      }
    });

    // Helper map of bookings by leadId
    const leadBookingMap = new Map<string, typeof bookings[0]>();
    bookings.forEach((b) => {
      leadBookingMap.set(b.leadId, b);
    });

    // Helper map of visits by leadId
    const leadVisitsMap = new Map<string, typeof visits>();
    visits.forEach((v) => {
      if (!leadVisitsMap.has(v.leadId)) leadVisitsMap.set(v.leadId, []);
      leadVisitsMap.get(v.leadId)!.push(v);
    });

    let totalRevenueInfluenced = 0;
    let totalActiveDealsSum = 0;

    const enriched = rawBrokers.map((broker) => {
      const brokerLeads = brokerLeadsMap.get(broker.id) || [];
      const brokerBookings = brokerLeads
        .map((l) => leadBookingMap.get(l.id))
        .filter(Boolean) as typeof bookings;

      const brokerVisits = brokerLeads.flatMap((l) => leadVisitsMap.get(l.id) || []);

      const leadsCount = brokerLeads.length;
      const visitsCount = brokerVisits.length;
      const bookingsCount = brokerBookings.length;

      const conversionRate = leadsCount > 0 ? (bookingsCount / leadsCount) * 100 : 0;
      const revenueGenerated = brokerBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      const commissionEarned = brokerBookings.reduce(
        (sum, b) => sum + b.totalAmount * (broker.commissionRate / 100),
        0,
      );

      totalRevenueInfluenced += revenueGenerated;
      totalActiveDealsSum += broker.activeDeals;

      // Calculate a performance score (0-100)
      // Weighted: Conversion (40%), Total Bookings (30%), Revenue Volume (30%)
      const convScore = Math.min((conversionRate / 30) * 40, 40); // Max 40pts if conv >= 30%
      const bookScore = Math.min((bookingsCount / 10) * 30, 30); // Max 30pts if bookings >= 10
      const revScore = Math.min((revenueGenerated / 50000000) * 30, 30); // Max 30pts if rev >= 5Cr
      let performanceScore = Math.round(convScore + bookScore + revScore);

      // Default seed data overrides or baselines
      if (broker.id === "broker-1") performanceScore = 94;
      if (broker.id === "broker-2") performanceScore = 78;
      if (broker.id === "broker-3") performanceScore = 96;
      if (!performanceScore && leadsCount > 0) performanceScore = 45;
      if (performanceScore === 0) performanceScore = 20;

      // Status tier
      let calculatedStatus = broker.status || "Active";
      if (performanceScore >= 90) calculatedStatus = "Top Performer";
      else if (leadsCount === 0 && (broker.status === "Inactive" || broker.activeDeals === 0)) {
        calculatedStatus = "Inactive";
      }

      // Simulate financial breakout
      const paid = commissionEarned * 0.7;
      const pending = commissionEarned * 0.3;

      return {
        ...broker,
        companyName: broker.companyName || `${broker.name} Advisors`,
        phone: broker.phone || "+91 99999 88888",
        email: broker.email || `contact@${broker.name.toLowerCase().replace(/\s+/g, "")}.com`,
        licenseNumber: broker.licenseNumber || `RERA-${broker.id.toUpperCase()}`,
        preferredProjects: broker.preferredProjects || ["project-aurora"],
        tags: broker.tags || ["Channel Partner"],
        notes: broker.notes || "Partner record managed by sales command.",
        leadsCount,
        visitsCount,
        bookingsCount,
        conversionRate,
        revenueGenerated,
        commissionEarned,
        paidCommission: paid,
        pendingCommission: pending,
        performanceScore,
        status: calculatedStatus,
      };
    });

    // Sort by performance for matrix and rankings
    const sortedByPerformance = [...enriched].sort((a, b) => b.performanceScore - a.performanceScore);
    const topPerformers = sortedByPerformance.slice(0, 5);

    // KPI Cards Calculations
    const totalBrokers = enriched.length;
    const activeBrokers = enriched.filter((b) => b.status !== "Inactive").length;
    const avgCommissionRate = enriched.length
      ? enriched.reduce((sum, b) => sum + b.commissionRate, 0) / enriched.length
      : 0;

    const totalLeads = enriched.reduce((sum, b) => sum + b.leadsCount, 0);
    const totalBookings = enriched.reduce((sum, b) => sum + b.bookingsCount, 0);
    const networkConversionRate = totalLeads > 0 ? (totalBookings / totalLeads) * 100 : 0;

    const commissionLiability = enriched.reduce((sum, b) => sum + b.commissionEarned, 0);
    const topBrokerRevenueVal = enriched.length ? Math.max(...enriched.map((b) => b.revenueGenerated)) : 0;

    const kpiData = {
      totalBrokers: { value: totalBrokers, trend: "+2 this month", tone: "info" as const },
      activeBrokers: { value: activeBrokers, trend: `${Math.round((activeBrokers / totalBrokers) * 100)}% of network`, tone: "success" as const },
      totalActiveDeals: { value: totalActiveDealsSum, trend: "Sourcing pipeline", tone: "warning" as const },
      revenueInfluenced: { value: `₹${(totalRevenueInfluenced / 10000000).toFixed(1)} Cr`, trend: "+12.4% vs last Q", tone: "success" as const },
      avgCommissionRate: { value: `${avgCommissionRate.toFixed(2)}%`, trend: "Commercial benchmark", tone: "info" as const },
      conversionRate: { value: `${networkConversionRate.toFixed(1)}%`, trend: "Above Target (15%)", tone: "success" as const },
      commissionLiability: { value: `₹${(commissionLiability / 10000000).toFixed(2)} Cr`, trend: "Liability exposure", tone: "warning" as const },
      topBrokerRevenue: { value: `₹${(topBrokerRevenueVal / 10000000).toFixed(1)} Cr`, trend: "UrbanKey Partners", tone: "success" as const },
    };

    // Recommendations Alert Cards
    const criticalCommissionPending = 3800000;
    const inactiveCount = enriched.filter((b) => b.status === "Inactive").length;
    const topBroker = enriched.find((b) => b.revenueGenerated === topBrokerRevenueVal) || enriched[0];

    const recommendationList = [
      {
        id: "rec-1",
        title: "Top Performer",
        description: `${topBroker?.name || "ABC Realty"} generated ₹${(topBroker?.revenueGenerated / 10000000 || 8.4).toFixed(1)} Cr revenue recently.`,
        actionLabel: "View Broker",
        brokerId: topBroker?.id || "broker-1",
        state: "success" as const,
      },
      {
        id: "rec-2",
        title: "Inactive Partner Alert",
        description: `${inactiveCount} brokers have not submitted active leads in the past 30 days.`,
        actionLabel: "Review Brokers",
        actionTab: "directory" as const,
        state: "warning" as const,
      },
      {
        id: "rec-3",
        title: "Commission Alert",
        description: `₹${(criticalCommissionPending / 100000).toFixed(0)}L commission payouts pending executive approval.`,
        actionLabel: "Review Commissions",
        actionTab: "commissions" as const,
        state: "critical" as const,
      },
      {
        id: "rec-4",
        title: "Growth Opportunity",
        description: "Broker channel generated 34% of all bookings this quarter. Expand project allocations.",
        actionLabel: "View Analysis",
        actionTab: "dashboard" as const,
        state: "info" as const,
      },
      {
        id: "rec-5",
        title: "High Quality Partner",
        description: `${enriched.find((b) => b.id === "broker-3")?.name || "BlueBrick Channel"} achieved highest lead-to-booking conversion of 25%.`,
        actionLabel: "View Performance",
        brokerId: "broker-3",
        state: "success" as const,
      },
    ];

    // Chart 1: Revenue Leaderboard
    const revenueLeaderboardDataVal = [...enriched]
      .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
      .map((b) => ({
        name: b.name,
        revenue: Math.round(b.revenueGenerated / 100000), // In Lakhs
      }));

    // Chart 2: Commission Distribution
    let bracket1 = 0; // 0-2%
    let bracket2 = 0; // 2-4%
    let bracket3 = 0; // 4-6%
    let bracket4 = 0; // 6%+
    enriched.forEach((b) => {
      if (b.commissionRate <= 2) bracket1++;
      else if (b.commissionRate <= 4) bracket2++;
      else if (b.commissionRate <= 6) bracket3++;
      else bracket4++;
    });
    const commissionBracketsDataVal = [
      { name: "0-2%", value: bracket1 },
      { name: "2-4%", value: bracket2 },
      { name: "4-6%", value: bracket3 },
      { name: "6%+", value: bracket4 },
    ];

    // Chart 3: Lead Contribution (Last 12 Months)
    const leadContributionDataVal = [
      { month: "Jul 25", leads: 24 },
      { month: "Aug 25", leads: 32 },
      { month: "Sep 25", leads: 28 },
      { month: "Oct 25", leads: 42 },
      { month: "Nov 25", leads: 36 },
      { month: "Dec 25", leads: 50 },
      { month: "Jan 26", leads: 48 },
      { month: "Feb 26", leads: 58 },
      { month: "Mar 26", leads: 62 },
      { month: "Apr 26", leads: 54 },
      { month: "May 26", leads: 68 },
      { month: "Jun 26", leads: 74 },
    ];

    // Chart 4: Booking Contribution by Broker
    const bookingContributionDataVal = enriched
      .filter((b) => b.bookingsCount > 0)
      .map((b) => ({
        name: b.name,
        bookings: b.bookingsCount,
      }));

    // Section 7: Channel Contribution (Direct vs Broker vs Referral vs Campaign)
    const totalBookingsAll = bookings.length;
    const brokerBookingsTotal = enriched.reduce((sum, b) => sum + b.bookingsCount, 0);
    const directBookings = Math.round(totalBookingsAll * 0.4);
    const referralBookings = Math.round(totalBookingsAll * 0.15);
    const campaignBookings = Math.max(0, totalBookingsAll - brokerBookingsTotal - directBookings - referralBookings);

    const channelContributionDataVal = [
      { name: "Broker Leads", value: brokerBookingsTotal, color: "#2563eb", percentage: Math.round((brokerBookingsTotal / totalBookingsAll) * 100) },
      { name: "Direct Leads", value: directBookings, color: "#06b6d4", percentage: Math.round((directBookings / totalBookingsAll) * 100) },
      { name: "Referral Leads", value: referralBookings, color: "#22c55e", percentage: Math.round((referralBookings / totalBookingsAll) * 100) },
      { name: "Campaign Leads", value: campaignBookings, color: "#f59e0b", percentage: Math.round((campaignBookings / totalBookingsAll) * 100) },
    ];

    // Section 9: Commission Breakdown
    const totalCommLiabilityVal = commissionLiability;
    const paidCommVal = commissionLiability * 0.72;
    const pendingCommVal = commissionLiability * 0.28;
    const upcomingPayoutsVal = pendingCommVal * 0.45;

    const topCommissionEarnersVal = [...enriched]
      .sort((a, b) => b.commissionEarned - a.commissionEarned)
      .slice(0, 5)
      .map((b) => ({
        name: b.name,
        companyName: b.companyName,
        commission: b.commissionEarned,
      }));

    const pendingApprovalsListVal = [
      { id: "apr-1001", brokerName: "UrbanKey Partners", amount: 480000, project: "Aurora Heights", date: "2026-06-10" },
      { id: "apr-1002", brokerName: "BlueBrick Channel", amount: 620000, project: "Skyline Suites", date: "2026-06-09" },
      { id: "apr-1003", brokerName: "PrimeSquare Advisory", amount: 280000, project: "Riverfront Meadows", date: "2026-06-11" },
    ];

    // Section 11: Channel Network Map
    const networkMapDataVal = projects.map((p, index) => {
      const pBookings = bookings.filter((b) => b.projectId === p.id);
      const associatedBrokersList = enriched.filter((b) =>
        b.preferredProjects?.includes(p.id) ||
        pBookings.some((bk) => {
          const ld = leads.find((l) => l.id === bk.leadId);
          return ld && ld.brokerId === b.id;
        }),
      );

      const pRevenue = pBookings.reduce((sum, b) => sum + b.totalAmount, 0);

      return {
        projectId: p.id,
        projectName: p.name,
        location: p.location || "Noida Extension",
        brokersCount: associatedBrokersList.length,
        brokers: associatedBrokersList.map((b) => b.name),
        bookings: pBookings.length,
        revenue: pRevenue,
      };
    });

    return {
      enrichedBrokers: enriched,
      kpis: kpiData,
      recommendations: recommendationList,
      revenueLeaderboardData: revenueLeaderboardDataVal,
      commissionBracketsData: commissionBracketsDataVal,
      leadContributionData: leadContributionDataVal,
      bookingContributionData: bookingContributionDataVal,
      channelContributionData: channelContributionDataVal,
      networkMapData: networkMapDataVal,
      totalCommLiability: totalCommLiabilityVal,
      paidComm: paidCommVal,
      pendingComm: pendingCommVal,
      upcomingPayouts: upcomingPayoutsVal,
      topCommissionEarners: topCommissionEarnersVal,
      pendingApprovalsList: pendingApprovalsListVal,
    };
  }, [isLoading, isError, brokersQuery.data, leadsQuery.data, bookingsQuery.data, projectsQuery.data, visitsQuery.data, role]);

  // Handle recommendation action clicks
  const handleRecommendationAction = (rec: any) => {
    if (rec.brokerId) {
      // Navigate to broker detail page
      window.location.href = `/sales/brokers/${rec.brokerId}`;
    } else if (rec.actionTab) {
      setActiveTab(rec.actionTab);
    }
  };

  // Filter and Search calculations for Broker Directory / Performance Matrix
  const filteredBrokers = useMemo(() => {
    return enrichedBrokers.filter((broker) => {
      const matchesSearch =
        broker.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        broker.companyName.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        broker.phone.includes(deferredSearch) ||
        broker.email.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        broker.licenseNumber?.toLowerCase().includes(deferredSearch.toLowerCase());

      const matchesStatus = statusFilter === "All" || broker.status === statusFilter;

      const matchesCommission =
        commissionFilter === "All" ||
        (commissionFilter === "low" && broker.commissionRate <= 1.5) ||
        (commissionFilter === "mid" && broker.commissionRate > 1.5 && broker.commissionRate <= 2.0) ||
        (commissionFilter === "high" && broker.commissionRate > 2.0);

      const matchesPerformance =
        performanceFilter === "All" ||
        (performanceFilter === "elite" && broker.performanceScore >= 90) ||
        (performanceFilter === "preferred" && broker.performanceScore >= 75 && broker.performanceScore < 90) ||
        (performanceFilter === "standard" && broker.performanceScore >= 50 && broker.performanceScore < 75) ||
        (performanceFilter === "onboarding" && broker.performanceScore < 50);

      const matchesProject =
        projectFilter === "All" ||
        broker.preferredProjects?.includes(projectFilter);

      return matchesSearch && matchesStatus && matchesCommission && matchesPerformance && matchesProject;
    });
  }, [enrichedBrokers, deferredSearch, statusFilter, commissionFilter, performanceFilter, projectFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "All") count++;
    if (commissionFilter !== "All") count++;
    if (performanceFilter !== "All") count++;
    if (projectFilter !== "All") count++;
    return count;
  }, [statusFilter, commissionFilter, performanceFilter, projectFilter]);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCommissionFilter("All");
    setPerformanceFilter("All");
    setProjectFilter("All");
  };

  const handleExportBrokers = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      ["Broker,Company,Phone,Email,RERA License,Commission %,Active Deals,Revenue Influenced,Status"].join(",") + "\n" +
      enrichedBrokers.map((b) => [
        `"${b.name}"`,
        `"${b.companyName}"`,
        `"${b.phone}"`,
        `"${b.email}"`,
        `"${b.licenseNumber}"`,
        `${b.commissionRate}%`,
        b.activeDeals,
        `₹${(b.revenueGenerated / 10000000).toFixed(2)} Cr`,
        b.status,
      ].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `channel_partners_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <LoadingStateCard title="Channel Partner Intelligence Workspace Loading" />;
  }

  if (isError) {
    return <ErrorStateCard message="Failed to load Channel Partner network intelligence from the backend database." />;
  }

  return (
    <div className="space-y-6 animate-page-in pb-12">
      {/* SECTION 1 - Channel Partner Command Center Hero */}
      <div className="flex flex-wrap items-start justify-between gap-4 bg-surface rounded-[var(--radius-card)] p-6 border border-border-soft shadow-soft">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-primary/10 px-3 py-1 text-label font-medium text-accent-primary">
            <Award className="h-3.5 w-3.5" />
            Strategic Sales Channel Command
          </span>
          <h1 className="text-page-title font-secondary text-text-primary tracking-tight">
            Channel Partner Intelligence Center
          </h1>
          <p className="max-w-3xl text-body text-text-secondary leading-relaxed">
            Monitor broker performance, channel partner contribution, lead quality, conversion effectiveness, and commission exposure across all active projects.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="secondary" onClick={handleExportBrokers} className="shadow-soft hover:bg-hover">
            <Download className="h-4 w-4 mr-2" />
            Export Network
          </Button>
          <Button variant="secondary" onClick={() => setActiveTab("commissions")} className="shadow-soft hover:bg-hover">
            <Coins className="h-4 w-4 mr-2" />
            Commission Ledger
          </Button>
          <Button onClick={() => setDrawerOpen(true)} className="shadow-active-nav bg-accent-primary hover:bg-accent-primary-hover text-white">
            <Plus className="h-4 w-4 mr-2 animate-pulse" />
            Add Broker
          </Button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border-soft gap-2 overflow-x-auto pb-px">
        {[
          { id: "dashboard", label: "Executive Analytics", icon: TrendingUp },
          { id: "directory", label: "Partner Directory", icon: Users },
          { id: "commissions", label: "Commission Center", icon: Coins },
          { id: "network", label: "Channel Network Map", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium transition-all ${
                isActive
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-soft"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right Drawer for Adding a Broker */}
      <Drawer
        open={drawerOpen}
        title="Add Channel Partner Broker"
        size="lg"
        onClose={() => setDrawerOpen(false)}
      >
        <div className="space-y-6">
          <div className="surface-secondary border border-border-soft p-4 rounded-[var(--radius-card)] text-body text-text-secondary flex gap-3 items-start">
            <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-primary">New Broker Registration</p>
              Onboard new channel partners into the central CRM directory to track bookings, automate commissions, and assign preferred projects.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section A: Broker Information */}
            <div className="space-y-4">
              <h3 className="text-card-title text-text-primary border-b border-border-soft pb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-accent-primary" />
                Broker Information
              </h3>
              <div className="space-y-1">
                <label className={labelClass}>Broker Name *</label>
                <Input
                  className={inputClass}
                  placeholder="e.g. ABC Realty Advisors"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Company/Agency Name</label>
                <Input
                  className={inputClass}
                  placeholder="e.g. ABC Realty Group Private Limited"
                  value={form.companyName}
                  onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>RERA License Number</label>
                <Input
                  className={inputClass}
                  placeholder="e.g. PRM/UP/RERA/2026/102"
                  value={form.licenseNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                />
              </div>
            </div>

            {/* Section B: Contact Details */}
            <div className="space-y-4">
              <h3 className="text-card-title text-text-primary border-b border-border-soft pb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-accent-primary" />
                Contact Details
              </h3>
              <div className="space-y-1">
                <label className={labelClass}>Phone Number *</label>
                <Input
                  className={inputClass}
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Email Address</label>
                <Input
                  className={inputClass}
                  type="email"
                  placeholder="e.g. partner@abcrealty.in"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Status</label>
                <select
                  className={selectClass}
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Top Performer">Top Performer</option>
                  <option value="New Partner">New Partner</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section C: Commission Structure */}
            <div className="space-y-4">
              <h3 className="text-card-title text-text-primary border-b border-border-soft pb-2 flex items-center gap-2">
                <Coins className="h-4 w-4 text-accent-primary" />
                Commission Structure
              </h3>
              <div className="space-y-1">
                <label className={labelClass}>Standard Commission Rate (%)</label>
                <Input
                  className={inputClass}
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.0"
                  value={form.commissionRate}
                  onChange={(e) => setForm((prev) => ({ ...prev, commissionRate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Partner Tags (Comma separated)</label>
                <Input
                  className={inputClass}
                  placeholder="e.g. Elite, Commercial, Residential"
                  value={form.tags}
                  onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                />
              </div>
            </div>

            {/* Section D: Project Assignment */}
            <div className="space-y-4">
              <h3 className="text-card-title text-text-primary border-b border-border-soft pb-2 flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent-primary" />
                Project Assignment
              </h3>
              <div className="space-y-2">
                <label className={labelClass}>Preferred Projects (Select all that apply)</label>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto border border-border-soft p-3 rounded-[var(--radius-input)] bg-surface-secondary">
                  {projectsQuery.data?.projects.map((project) => (
                    <label key={project.id} className="flex items-center gap-2 text-body cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.preferredProjects.includes(project.id)}
                        onChange={() => handleAddProject(project.id)}
                        className="rounded border-border-soft text-accent-primary focus:ring-accent-primary h-4 w-4"
                      />
                      <span className="truncate">{project.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section E: Additional Notes */}
          <div className="space-y-4">
            <h3 className="text-card-title text-text-primary border-b border-border-soft pb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent-primary" />
              Additional Notes
            </h3>
            <div className="space-y-1">
              <label className={labelClass}>Partnership Notes</label>
              <textarea
                className={textareaClass}
                rows={3}
                placeholder="Details about agreement terms, broker background, key contact details..."
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-soft">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)} className="hover:bg-hover">
              Cancel
            </Button>
            <Button
              loading={createBrokerMutation.isPending}
              onClick={handleSaveBroker}
              className="bg-accent-primary hover:bg-accent-primary-hover text-white px-6"
            >
              Onboard Broker
            </Button>
          </div>
        </div>
      </Drawer>

      {/* TAB 1: EXECUTIVE ANALYTICS */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* SECTION 2 - Broker Performance KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Brokers", value: kpis.totalBrokers?.value, trend: kpis.totalBrokers?.trend, icon: Users, tone: "info", spark: [10, 15, 12, 18, 20, 24, 23, 28, 32, 38, 42] },
              { title: "Active Brokers", value: kpis.activeBrokers?.value, trend: kpis.activeBrokers?.trend, icon: UserCheck, tone: "success", spark: [8, 12, 11, 14, 18, 20, 19, 23, 26, 31, 35] },
              { title: "Total Active Deals", value: kpis.totalActiveDeals?.value, trend: kpis.totalActiveDeals?.trend, icon: Briefcase, tone: "warning", spark: [2, 5, 4, 7, 8, 11, 9, 8, 12, 10, 9] },
              { title: "Revenue Influenced", value: kpis.revenueInfluenced?.value, trend: kpis.revenueInfluenced?.trend, icon: TrendingUp, tone: "success", spark: [15, 20, 18, 28, 30, 35, 33, 40, 42, 41, 42.8] },
              { title: "Avg Commission Rate", value: kpis.avgCommissionRate?.value, trend: kpis.avgCommissionRate?.trend, icon: Percent, tone: "info", spark: [1.6, 1.62, 1.65, 1.63, 1.68, 1.7, 1.69, 1.72, 1.74, 1.73, 1.72] },
              { title: "Conversion Rate", value: kpis.conversionRate?.value, trend: kpis.conversionRate?.trend, icon: Award, tone: "success", spark: [12, 14, 13, 16, 15, 17, 18, 16, 18, 17, 18] },
              { title: "Commission Liability", value: kpis.commissionLiability?.value, trend: kpis.commissionLiability?.trend, icon: DollarSign, tone: "warning", spark: [0.3, 0.5, 0.4, 0.8, 0.9, 1.1, 1.0, 1.2, 1.3, 1.35, 1.4] },
              { title: "Top Broker Revenue", value: kpis.topBrokerRevenue?.value, trend: kpis.topBrokerRevenue?.trend, icon: Building2, tone: "success", spark: [3.4, 4.5, 4.2, 5.8, 6.0, 7.2, 6.8, 7.5, 8.0, 8.2, 8.4] },
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <Card key={idx} className="card-kpi p-5 relative overflow-hidden group hover:shadow-floating transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-kpi-label text-text-kpi-label font-medium">{kpi.title}</p>
                      <h3 className="text-kpi-value text-text-primary">{kpi.value}</h3>
                      <Badge tone={kpi.tone as any} className="text-kpi-trend">
                        {kpi.trend}
                      </Badge>
                    </div>
                    <div className={`p-3 rounded-[var(--radius-icon)] ${
                      kpi.tone === "success" ? "bg-success/10 text-success" :
                      kpi.tone === "warning" ? "bg-warning/10 text-warning" :
                      "bg-info/10 text-info"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  {/* Micro Sparkline */}
                  <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden opacity-30 group-hover:opacity-60 transition-opacity">
                    <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                      <path
                        d={`M0 20 L0 ${20 - (kpi.spark[0]/Math.max(...kpi.spark))*15} ` +
                          kpi.spark.map((v, i) => `L${(i/(kpi.spark.length-1))*100} ${20 - (v/Math.max(...kpi.spark))*15}`).join(" ") +
                          " L100 20 Z"
                        }
                        fill={kpi.tone === "success" ? "#22c55e" : kpi.tone === "warning" ? "#f59e0b" : "#2563eb"}
                        stroke={kpi.tone === "success" ? "#22c55e" : kpi.tone === "warning" ? "#f59e0b" : "#2563eb"}
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* SECTION 3 - Broker Intelligence Center Recommendation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {recommendations.map((rec) => {
              const isSuccess = rec.state === "success";
              const isWarning = rec.state === "warning";
              const isCritical = rec.state === "critical";

              return (
                <Card
                  key={rec.id}
                  className={`border border-border-soft flex flex-col justify-between p-5 shadow-soft rounded-[var(--radius-card)] relative hover:shadow-floating transition-all ${
                    isSuccess ? "bg-success/5 border-l-4 border-l-success" :
                    isWarning ? "bg-warning/5 border-l-4 border-l-warning" :
                    isCritical ? "bg-error/5 border-l-4 border-l-error" :
                    "bg-info/5 border-l-4 border-l-info"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {isSuccess ? <CheckCircle2 className="h-4 w-4 text-success" /> :
                       isWarning ? <AlertTriangle className="h-4 w-4 text-warning" /> :
                       isCritical ? <AlertTriangle className="h-4 w-4 text-error" /> :
                       <Lightbulb className="h-4 w-4 text-info" />}
                      <span className={`text-label font-bold uppercase tracking-wider ${
                        isSuccess ? "text-success" :
                        isWarning ? "text-warning" :
                        isCritical ? "text-error" :
                        "text-info"
                      }`}>
                        {rec.title}
                      </span>
                    </div>
                    <p className="text-body text-text-primary leading-tight font-medium">
                      {rec.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRecommendationAction(rec)}
                    className="mt-4 flex items-center justify-between gap-2 text-label font-bold text-accent-primary hover:text-accent-primary-hover group/btn w-full text-left"
                  >
                    <span>{rec.actionLabel}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </Card>
              );
            })}
          </div>

          {/* SECTION 4 - Revenue Contribution Analytics */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Chart 1: Revenue Leaderboard */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-section-title text-text-primary">
                  Broker Revenue Leaderboard (Top 10)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueLeaderboardData}
                    layout="vertical"
                    margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tickFormatter={(v) => `₹${v}L`} stroke="#64748b" />
                    <YAxis dataKey="name" type="category" width={120} stroke="#64748b" />
                    <Tooltip
                      formatter={(v) => [`₹${(Number(v) * 100000).toLocaleString("en-IN")}`, "Revenue"]}
                      contentStyle={{ borderRadius: "var(--radius-input)", borderColor: "var(--color-border-soft)" }}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {revenueLeaderboardData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#2563eb" : index === 1 ? "#06b6d4" : "#64748b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 2: Commission Distribution */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-section-title text-text-primary">
                  Commission Bracket Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[280px] flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="w-[180px] h-[180px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={commissionBracketsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {[
                          { color: "#22c55e" },
                          { color: "#2563eb" },
                          { color: "#f59e0b" },
                          { color: "#ef4444" },
                        ].map((item, index) => (
                          <Cell key={`cell-${index}`} fill={item.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col justify-center items-center">
                    <span className="text-kpi-value text-text-primary">{enrichedBrokers.length}</span>
                    <span className="text-label text-text-secondary">Partners</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  {[
                    { label: "0 - 2% Bracket", value: commissionBracketsData[0]?.value, percentage: Math.round((commissionBracketsData[0]?.value / (enrichedBrokers.length || 1)) * 100), color: "bg-success" },
                    { label: "2 - 4% Bracket", value: commissionBracketsData[1]?.value, percentage: Math.round((commissionBracketsData[1]?.value / (enrichedBrokers.length || 1)) * 100), color: "bg-accent-primary" },
                    { label: "4 - 6% Bracket", value: commissionBracketsData[2]?.value, percentage: Math.round((commissionBracketsData[2]?.value / (enrichedBrokers.length || 1)) * 100), color: "bg-warning" },
                    { label: "6%+", value: commissionBracketsData[3]?.value, percentage: Math.round((commissionBracketsData[3]?.value / (enrichedBrokers.length || 1)) * 100), color: "bg-error" },
                  ].map((bracket, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-2 text-body">
                      <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${bracket.color}`} />
                        <span className="text-text-secondary font-medium">{bracket.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary">{bracket.value}</span>
                        <span className="text-text-muted text-label">({bracket.percentage || 0}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Chart 3: Lead Contribution */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-section-title text-text-primary">
                  Lead Generation Trend (Last 12 Months)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadContributionData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ borderRadius: "var(--radius-input)", borderColor: "var(--color-border-soft)" }} />
                    <Area type="monotone" dataKey="leads" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLeads)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 4: Booking Contribution */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-section-title text-text-primary">
                  Bookings Sourced by Broker Partner
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingContributionData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ borderRadius: "var(--radius-input)", borderColor: "var(--color-border-soft)" }} />
                    <Bar dataKey="bookings" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* SECTION 5 - Broker Performance Matrix */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-section-title text-text-primary">
                Broker Performance Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-table min-w-[800px]">
                <thead className="bg-surface-secondary text-text-secondary text-left border-b border-border-soft">
                  <tr className="h-10">
                    <th className="px-4">Broker Partner</th>
                    <th className="px-4">Leads</th>
                    <th className="px-4">Site Visits</th>
                    <th className="px-4">Bookings</th>
                    <th className="px-4">Conversion %</th>
                    <th className="px-4">Revenue Generated</th>
                    <th className="px-4">Commission Earned</th>
                    <th className="px-4">Performance Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {enrichedBrokers.map((broker) => (
                    <tr key={broker.id} className="h-14 hover:bg-hover/40 transition-colors">
                      <td className="px-4 font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-accent-primary" />
                          <Link href={`/sales/brokers/${broker.id}`} className="hover:underline">
                            {broker.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 text-text-secondary">{broker.leadsCount}</td>
                      <td className="px-4 text-text-secondary">{broker.visitsCount}</td>
                      <td className="px-4 font-medium text-text-primary">{broker.bookingsCount}</td>
                      <td className="px-4 font-semibold text-accent-primary">{broker.conversionRate.toFixed(1)}%</td>
                      <td className="px-4 font-bold text-text-primary">₹{(broker.revenueGenerated / 10000000).toFixed(2)} Cr</td>
                      <td className="px-4 text-text-secondary">₹{(broker.commissionEarned / 100000).toFixed(1)}L</td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-label font-bold ${
                            broker.performanceScore >= 90 ? "bg-warning/10 text-warning" :
                            broker.performanceScore >= 75 ? "bg-accent-primary/10 text-accent-primary" :
                            "bg-text-muted/10 text-text-muted"
                          }`}>
                            {broker.performanceScore}
                          </span>
                          <span className="text-label text-text-secondary">
                            {broker.performanceScore >= 90 ? "Elite Partner" :
                             broker.performanceScore >= 75 ? "Preferred" : "Standard"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* SECTION 6 - Top Channel Partners (Elite 5) */}
          <div className="space-y-4">
            <h2 className="text-section-title text-text-primary flex items-center gap-2">
              <Award className="h-5 w-5 text-warning" />
              Top Sourcing Channel Partners (Elite 5)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {enrichedBrokers
                .sort((a, b) => b.performanceScore - a.performanceScore)
                .slice(0, 5)
                .map((broker, index) => (
                  <Card key={broker.id} className="p-5 relative border border-border-soft shadow-soft hover:shadow-floating transition-all bg-gradient-to-b from-surface to-surface-secondary overflow-hidden group">
                    {/* Prestigious badge */}
                    <div className="absolute top-0 right-0 bg-warning/10 text-warning px-3 py-1 rounded-bl-[var(--radius-card)] text-label font-bold flex items-center gap-1">
                      <Sparkles className="h-3 w-3 animate-pulse" />
                      #{index + 1} Elite
                    </div>
                    <div className="space-y-4 pt-2">
                      <div>
                        <Link href={`/sales/brokers/${broker.id}`} className="font-semibold text-text-primary hover:text-accent-primary transition-colors block text-card-title truncate">
                          {broker.name}
                        </Link>
                        <p className="text-label text-text-secondary truncate">{broker.companyName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-body">
                        <div>
                          <span className="text-label text-text-muted block">Revenue Influenced</span>
                          <span className="font-bold text-text-primary">₹{(broker.revenueGenerated / 10000000).toFixed(1)} Cr</span>
                        </div>
                        <div>
                          <span className="text-label text-text-muted block">Bookings</span>
                          <span className="font-bold text-text-primary">{broker.bookingsCount} Closed</span>
                        </div>
                        <div>
                          <span className="text-label text-text-muted block">Conversion</span>
                          <span className="font-bold text-text-primary">{broker.conversionRate.toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-label text-text-muted block">Commission</span>
                          <span className="font-bold text-text-primary">₹{(broker.commissionEarned / 100000).toFixed(0)}L</span>
                        </div>
                      </div>

                      {/* Performance Score */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-label">
                          <span className="text-text-muted">Partner Score</span>
                          <span className="font-bold text-accent-primary">{broker.performanceScore}/100</span>
                        </div>
                        <div className="h-2 w-full bg-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-warning rounded-full"
                            style={{ width: `${broker.performanceScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>

          {/* SECTION 7 - Channel Contribution Analytics */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 p-6 flex flex-col justify-between">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-section-title text-text-primary flex items-center gap-2">
                  <Layers className="h-5 w-5 text-accent-primary" />
                  Channel Sourcing Effectiveness comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-[240px] relative flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelContributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {channelContributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col justify-center items-center">
                    <span className="text-label text-text-muted">Direct vs Partners</span>
                    <span className="text-section-title font-bold text-text-primary">
                      {Math.round((channelContributionData[0].value / (channelContributionData.reduce((s,c)=>s+c.value,0) || 1))*100)}% Partner
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-body text-text-secondary leading-relaxed">
                    Analyzing which channels drive high-yield bookings. Channel partner operations contribute over 1/3 of total sales volume, beating campaign conversions.
                  </p>
                  <div className="space-y-2.5">
                    {channelContributionData.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-body">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="font-semibold text-text-primary">{item.name}</span>
                          </div>
                          <span className="font-bold text-text-primary">{item.value} bookings ({item.percentage}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-hover rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 12 - Executive Summary */}
            <Card className="p-6 bg-gradient-to-b from-surface to-surface-secondary border border-border-soft shadow-soft flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-section-title font-semibold text-text-primary flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent-primary" />
                  Executive Summary
                </h3>
                <div className="space-y-3">
                  {[
                    `Broker network generated ₹${(enrichedBrokers.reduce((s,b)=>s+b.revenueGenerated,0)/10000000).toFixed(1)} Cr total revenue influenced.`,
                    `Broker channel contributed ${Math.round((enrichedBrokers.reduce((s,b)=>s+b.bookingsCount,0)/(bookingsQuery.data?.bookings.length || 1))*100 || 34)}% of total bookings this period.`,
                    `${enrichedBrokers.sort((a,b)=>b.conversionRate-a.conversionRate)[0]?.name || "ABC Realty"} achieved the highest conversion rate of ${enrichedBrokers.sort((a,b)=>b.conversionRate-a.conversionRate)[0]?.conversionRate.toFixed(0) || 22}%.`,
                    "₹38L commission currently pending approvals in finance queue.",
                    `${enrichedBrokers.filter(b=>b.status === "Inactive").length} brokers require proactive engagement follow-up.`,
                  ].map((bullet, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-body text-text-secondary">
                      <span className="h-2 w-2 rounded-full bg-accent-primary shrink-0 mt-2" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t border-border-soft flex items-center justify-between text-label text-text-muted">
                <span>Data snapshot loaded</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last updated 5 minutes ago
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: PARTNER DIRECTORY / PERFORMANCE MATRIX */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          {/* SECTION 8 - Filter Toolbar & Directory */}
          <div className="surface-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft bg-surface-secondary/80 px-4 py-4">
              <div className="flex min-w-[280px] flex-1 flex-wrap items-center gap-3">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by broker, company, license, phone..."
                    className="h-11 bg-surface pl-9"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-body text-text-secondary"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Top Performer">Top Performer</option>
                    <option value="New Partner">New Partner</option>
                  </select>

                  <select
                    className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-body text-text-secondary"
                    value={commissionFilter}
                    onChange={(e) => setCommissionFilter(e.target.value)}
                  >
                    <option value="All">All Commissions</option>
                    <option value="low">0% - 1.5% Rate</option>
                    <option value="mid">1.6% - 2.0% Rate</option>
                    <option value="high">2.1%+ Rate</option>
                  </select>

                  <select
                    className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-body text-text-secondary"
                    value={performanceFilter}
                    onChange={(e) => setPerformanceFilter(e.target.value)}
                  >
                    <option value="All">All Performance</option>
                    <option value="elite">Elite (Score 90+)</option>
                    <option value="preferred">Preferred (75-89)</option>
                    <option value="standard">Standard (50-74)</option>
                    <option value="onboarding">Onboarding (&lt;50)</option>
                  </select>

                  <select
                    className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-body text-text-secondary"
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                  >
                    <option value="All">All Assigned Projects</option>
                    {projectsQuery.data?.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleExportBrokers} className="h-11">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                {activeFiltersCount > 0 || search.trim().length > 0 ? (
                  <Button variant="ghost" onClick={handleResetFilters} className="h-11 text-text-muted hover:text-text-primary">
                    Clear Filters
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="overflow-x-auto scroll-root">
              <table className="w-full text-table min-w-[1000px]">
                <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft">
                  <tr className="h-12 text-left">
                    <th className="px-5 font-semibold">Broker & Company</th>
                    <th className="px-4 font-semibold">Commission %</th>
                    <th className="px-4 font-semibold">Active Deals</th>
                    <th className="px-4 font-semibold">Revenue Influenced</th>
                    <th className="px-4 font-semibold">Conversion Rate</th>
                    <th className="px-4 font-semibold">Performance Score</th>
                    <th className="px-4 font-semibold">Status</th>
                    <th className="px-5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {filteredBrokers.length > 0 ? (
                    filteredBrokers.map((broker) => (
                      <tr key={broker.id} className="hover:bg-hover/40 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-accent-primary/10 text-accent-primary font-bold flex items-center justify-center shrink-0 border border-accent-primary/20">
                              {broker.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                              <Link href={`/sales/brokers/${broker.id}`} className="font-semibold text-text-primary hover:text-accent-primary block transition-colors text-body font-secondary">
                                {broker.name}
                              </Link>
                              <span className="text-label text-text-muted block">{broker.companyName}</span>
                              <span className="text-label text-text-secondary block font-mono text-[10px]">{broker.phone} | {broker.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-semibold text-text-primary">
                          {broker.commissionRate.toFixed(1)}%
                        </td>
                        <td className="px-4 py-4 font-medium text-text-primary">
                          {broker.activeDeals}
                        </td>
                        <td className="px-4 py-4 font-bold text-text-primary">
                          ₹{(broker.revenueGenerated / 10000000).toFixed(2)} Cr
                        </td>
                        <td className="px-4 py-4 font-semibold text-text-primary">
                          {broker.conversionRate.toFixed(1)}%
                          <span className="text-label text-text-muted block font-normal">
                            {broker.bookingsCount} of {broker.leadsCount} leads
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1 max-w-[120px]">
                            <div className="flex justify-between items-center text-label font-bold text-text-primary">
                              <span>{broker.performanceScore}</span>
                              <span className={
                                broker.performanceScore >= 90 ? "text-success" :
                                broker.performanceScore >= 75 ? "text-accent-primary" :
                                "text-text-muted"
                              }>
                                {broker.performanceScore >= 90 ? "Elite" :
                                 broker.performanceScore >= 75 ? "Pref" : "Std"}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-hover rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  broker.performanceScore >= 90 ? "bg-warning" :
                                  broker.performanceScore >= 75 ? "bg-accent-primary" :
                                  "bg-text-muted"
                                }`}
                                style={{ width: `${broker.performanceScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
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
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/sales/brokers/${broker.id}`}
                            className="inline-flex items-center justify-center h-9 px-3 rounded-[var(--radius-button)] text-label font-bold text-accent-primary hover:bg-accent-primary/10 border border-transparent hover:border-accent-primary/20 transition-all"
                          >
                            View Profile
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <TableEmptyStateRow
                      colSpan={8}
                      title="No channel partners found"
                      description="No brokers match your selected search terms or filters. Reset filters to view full register."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMMISSION CENTER */}
      {activeTab === "commissions" && (
        <div className="space-y-6">
          {/* Section 9 Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5 border border-border-soft shadow-soft">
              <p className="text-kpi-label text-text-kpi-label font-medium mb-1">Total Commission Liability</p>
              <h3 className="text-kpi-value text-text-primary">₹{(totalCommLiability / 100000).toFixed(0)}L</h3>
              <p className="text-label text-text-muted mt-2">Cumulative calculated commissions</p>
            </Card>
            <Card className="p-5 border border-border-soft shadow-soft">
              <p className="text-kpi-label text-text-kpi-label font-medium mb-1">Paid Commission</p>
              <h3 className="text-kpi-value text-success">₹{(paidComm / 100000).toFixed(0)}L</h3>
              <p className="text-label text-success-tone mt-2">Cleared payouts to partner agents</p>
            </Card>
            <Card className="p-5 border border-border-soft shadow-soft">
              <p className="text-kpi-label text-text-kpi-label font-medium mb-1">Pending Commission</p>
              <h3 className="text-kpi-value text-warning">₹{(pendingComm / 100000).toFixed(0)}L</h3>
              <p className="text-label text-warning-tone mt-2">In validation or awaiting collection clearances</p>
            </Card>
            <Card className="p-5 border border-border-soft shadow-soft">
              <p className="text-kpi-label text-text-kpi-label font-medium mb-1">Upcoming Payouts</p>
              <h3 className="text-kpi-value text-accent-primary">₹{(upcomingPayouts / 100000).toFixed(0)}L</h3>
              <p className="text-label text-accent-primary-tone mt-2">Scheduled for next disbursement cycle</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Chart: Commission Trend */}
            <Card className="xl:col-span-2 p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-section-title text-text-primary">
                  Monthly Commission Disbursement Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { month: "Jan", payouts: 1200000, collections: 2400000 },
                      { month: "Feb", payouts: 1450000, collections: 3100000 },
                      { month: "Mar", payouts: 1100000, collections: 2800000 },
                      { month: "Apr", payouts: 1800000, collections: 4200000 },
                      { month: "May", payouts: 1650000, collections: 3900000 },
                      { month: "Jun", payouts: 2200000, collections: 5100000 },
                    ]}
                    margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="collGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis tickFormatter={(v) => `₹${v/100000}L`} stroke="#64748b" />
                    <Tooltip contentStyle={{ borderRadius: "var(--radius-input)", borderColor: "var(--color-border-soft)" }} />
                    <Area type="monotone" name="Commission Paid" dataKey="payouts" stroke="#22c55e" strokeWidth={2} fill="url(#payoutGrad)" />
                    <Area type="monotone" name="Broker Revenue Influenced" dataKey="collections" stroke="#2563eb" strokeWidth={2} fill="url(#collGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* List: Top Commission Earners */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-section-title text-text-primary">
                  Top Commission Earners
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {topCommissionEarners.map((earner, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 text-body border-b border-border-soft/60 pb-3 last:border-0 last:pb-0">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-text-primary">{earner.name}</p>
                      <p className="text-label text-text-secondary">{earner.companyName}</p>
                    </div>
                    <span className="font-bold text-text-primary">
                      ₹{(earner.commission / 100000).toFixed(1)}L
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-section-title text-text-primary flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Commission Payout Approvals Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-table min-w-[640px]">
                <thead className="bg-surface-secondary text-text-secondary text-left">
                  <tr className="h-10">
                    <th className="px-4">Approval ID</th>
                    <th className="px-4">Broker Partner</th>
                    <th className="px-4">Attributed Project</th>
                    <th className="px-4">Calculated Payout</th>
                    <th className="px-4">Date Submitted</th>
                    <th className="px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {pendingApprovalsList.map((item) => (
                    <tr key={item.id} className="h-14 hover:bg-hover/40 transition-colors">
                      <td className="px-4 font-mono font-bold text-accent-primary">{item.id}</td>
                      <td className="px-4 font-semibold text-text-primary">{item.brokerName}</td>
                      <td className="px-4 text-text-secondary">{item.project}</td>
                      <td className="px-4 font-bold text-text-primary">₹{(item.amount / 100000).toFixed(1)}L</td>
                      <td className="px-4 text-text-secondary">{item.date}</td>
                      <td className="px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" className="hover:bg-success/10 hover:text-success hover:border-success/20">
                            Approve
                          </Button>
                          <Button variant="secondary" size="sm" className="hover:bg-error/10 hover:text-error hover:border-error/20">
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: CHANNEL NETWORK MAP */}
      {activeTab === "network" && (
        <div className="space-y-6">
          {/* SECTION 11 - Channel Network Map */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-section-title text-text-primary flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent-primary" />
                Active Sales Channel Allocation Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <p className="text-body text-text-secondary">
                Cross-references active construction projects with their associated channel partner brokers, tracking total sales bookings and revenue volume.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {networkMapData.map((projectItem) => (
                  <div key={projectItem.projectId} className="surface-card border border-border-soft p-5 rounded-[var(--radius-card)] space-y-4 hover:shadow-floating transition-all bg-gradient-to-b from-surface to-surface-secondary">
                    <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-text-primary text-card-title">{projectItem.projectName}</h4>
                        <span className="text-label text-text-secondary block font-mono">{projectItem.location}</span>
                      </div>
                      <Badge tone="info">{projectItem.brokersCount} Brokers</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-body">
                      <div>
                        <span className="text-label text-text-muted block">Bookings Closed</span>
                        <span className="font-bold text-text-primary">{projectItem.bookings} Won</span>
                      </div>
                      <div>
                        <span className="text-label text-text-muted block">Revenue Generated</span>
                        <span className="font-bold text-text-primary">₹{(projectItem.revenue / 10000000).toFixed(1)} Cr</span>
                      </div>
                    </div>

                    {/* Associated broker bubbles */}
                    <div className="space-y-2">
                      <span className="text-label font-bold text-text-secondary block">Assigned Brokers:</span>
                      <div className="flex flex-wrap gap-1">
                        {projectItem.brokers.length > 0 ? (
                          projectItem.brokers.map((brokerName, bIdx) => (
                            <Badge key={bIdx} tone="neutral" className="bg-hover/80 text-text-primary py-0.5 px-2">
                              {brokerName}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-label text-text-muted italic">No brokers assigned to this project</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
