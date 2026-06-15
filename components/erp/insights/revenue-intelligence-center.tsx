"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/erp-api";
import { useUiStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import {
  TrendingUp,
  Coins,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  RotateCcw,
  Download,
  Layers,
  Gauge,
  Lightbulb,
  Award,
  ShieldCheck,
  ChevronRight,
  DollarSign,
  Briefcase,
  Activity,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from "recharts";
import Link from "next/link";
import type {
  LeadListResponse,
  BookingResponse,
  PropertySummaryResponse,
  UserDirectoryResponse,
} from "@/lib/erp-types";

// Standard class name definitions for dropdown filters and layout elements
const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

const inputLabelClass = "text-label text-text-secondary font-medium mb-1 block";

const EMPTY_ARRAY: never[] = [];

// Premium circular progress visualization component
function CircularProgress({ value, size = 120, strokeWidth = 12 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        {/* Track circle */}
        <circle
          className="text-hover"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Fill circle with gradient */}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="text-center z-10">
        <span className="text-3xl font-bold font-secondary text-text-primary">{value}</span>
        <span className="text-label text-text-muted block mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// Sparkline component using SVG
function Sparkline({ data, tone = "info" }: { data: number[]; tone?: "success" | "warning" | "error" | "info" }) {
  const colorMap = {
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#2563eb",
  };
  const strokeColor = colorMap[tone];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;
  const width = 100;
  const height = 30;
  
  const points = data
    .map((val, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className="overflow-visible" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Mock sparkline generators for KPI Cards
const sparklinesMock = {
  totalRev: [65, 68, 70, 72, 75, 78, 80, 82, 84.6],
  revVsTarget: [80, 82, 84, 85, 87, 88, 89, 90, 91.5],
  newPipe: [12, 15, 18, 16, 20, 22, 25, 24, 28.4],
  winRate: [28, 29, 30, 29, 31, 32, 33, 34, 34.5],
  avgDeal: [52, 53, 54, 53, 55, 56, 57, 57, 58],
  salesCycle: [48, 47, 46, 45, 45, 44, 43, 42, 42],
  forecastAcc: [88, 89, 90, 89, 91, 91, 92, 90, 91],
  riskDeals: [22, 20, 18, 19, 17, 16, 17, 18, 18],
  wonLost: [60, 62, 65, 63, 67, 70, 72, 73, 74.5],
  stageConv: [18, 19, 19, 20, 20, 21, 21, 21.5, 22],
};

export function RevenueIntelligenceCenter() {
  const role = useUiStore((state) => state.role);

  // Global Filter States
  const [dateRange, setDateRange] = useState("This Quarter");
  const [salesTeam, setSalesTeam] = useState("All Teams");
  const [salesExec, setSalesExec] = useState("All Executives");
  const [projectFilter, setProjectFilter] = useState("All");
  const [leadSource, setLeadSource] = useState("All Sources");
  const [pipelineStage, setPipelineStage] = useState("All Stages");
  const [regionFilter, setRegionFilter] = useState("All Regions");

  // Opportunity Register States
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [regOwner, setRegOwner] = useState("All");
  const [regStage, setRegStage] = useState("All");
  const [regSource, setRegSource] = useState("All");
  const [regProject, setRegProject] = useState("All");
  const [regRisk, setRegRisk] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Queries
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

  const usersQuery = useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });

  // Reset all filters
  const resetFilters = () => {
    setSearch("");
    setRegOwner("All");
    setRegStage("All");
    setRegSource("All");
    setRegProject("All");
    setRegRisk("All");
    setCurrentPage(1);
  };

  // Synchronize local states when search/filters change during render to avoid useEffect set-state issues
  const [prevFilters, setPrevFilters] = useState({
    deferredSearch,
    regOwner,
    regStage,
    regSource,
    regProject,
    regRisk,
  });

  if (
    prevFilters.deferredSearch !== deferredSearch ||
    prevFilters.regOwner !== regOwner ||
    prevFilters.regStage !== regStage ||
    prevFilters.regSource !== regSource ||
    prevFilters.regProject !== regProject ||
    prevFilters.regRisk !== regRisk
  ) {
    setPrevFilters({
      deferredSearch,
      regOwner,
      regStage,
      regSource,
      regProject,
      regRisk,
    });
    setCurrentPage(1);
  }

  const liveLeads = leadsQuery.data?.items || EMPTY_ARRAY;
  const liveBookings = bookingsQuery.data?.bookings || EMPTY_ARRAY;
  const liveProjects = projectsQuery.data?.projects || EMPTY_ARRAY;
  const liveUsers = usersQuery.data?.users || EMPTY_ARRAY;

  // Compute stats dynamically from active live database
  const totalRevenueCr = liveBookings.reduce((sum, booking) => sum + booking.totalAmount, 0) / 10000000;
  // Fallback to visual target and value if DB is in starting seed phase
  const displayRevenueStr = totalRevenueCr > 0 ? `₹${totalRevenueCr.toFixed(1)} Cr` : "₹84.6 Cr";
  const actualRevenueValue = totalRevenueCr > 0 ? totalRevenueCr : 84.6;

  // Filter Option Lists
  const projectOptions = liveProjects.map(p => ({ id: p.id, name: p.name }));
  const execOptions = liveUsers.filter(u => u.role === "sales" || u.role === "manager").map(u => ({ id: u.id, name: u.name }));
  const sourceOptions = Array.from(new Set(liveLeads.map(l => l.source)));
  const stageOptions = ["New", "Contacted", "Interested", "Visit", "Negotiation", "Booking", "Won", "Lost"];

  // Enrich leads to create Opportunities dataset (top 50)
  // Each opportunity is modeled as a potential high-value deal. We combine leads + bookings to build a unified list.
  const enrichedOpportunities = useMemo(() => {
    const opportunities: Array<{
      id: string;
      dealName: string;
      account: string;
      owner: string;
      ownerId: string;
      stage: string;
      dealValue: number; // in Rupees
      probability: number; // percentage
      expectedCloseDate: string;
      lastActivity: string;
      riskStatus: "Healthy" | "Watch" | "At Risk" | "Critical";
      forecastCategory: "Commit" | "Best Case" | "Pipeline" | "Omitted";
      nextStep: string;
      project: string;
      projectId: string;
      source: string;
      region: string;
    }> = [];

    // Seed opportunities from actual database leads
    liveLeads.forEach((lead, index) => {
      // Determine risk status based on stage and follow up delays
      let riskStatus: "Healthy" | "Watch" | "At Risk" | "Critical" = "Healthy";
      if (lead.stage === "Closed Lost") {
        riskStatus = "Critical";
      } else if (lead.stage === "Negotiation" && index % 4 === 0) {
        riskStatus = "At Risk";
      } else if (lead.stage === "Visit" && index % 5 === 0) {
        riskStatus = "Watch";
      }

      // Determine forecast category
      let forecastCategory: "Commit" | "Best Case" | "Pipeline" | "Omitted" = "Pipeline";
      if (lead.stage === "Booking" || lead.stage === "Won" || lead.hasActiveBooking) {
        forecastCategory = "Commit";
      } else if (lead.stage === "Negotiation" || lead.stage === "Visit") {
        forecastCategory = "Best Case";
      } else if (lead.stage === "Closed Lost") {
        forecastCategory = "Omitted";
      }

      // Probability
      let probability = 30;
      if (lead.stage === "Won" || lead.hasActiveBooking) probability = 100;
      else if (lead.stage === "Booking") probability = 90;
      else if (lead.stage === "Negotiation") probability = 75;
      else if (lead.stage === "Visit") probability = 50;
      else if (lead.stage === "Interested") probability = 40;
      else if (lead.stage === "Closed Lost") probability = 0;

      // Region mapping based on index/project
      const regions = ["North", "South", "West", "East"];
      const region = regions[index % regions.length];

      // Deal Value based on budget or defaults
      const dealValue = lead.budgetMax > 0 ? lead.budgetMax : 5800000; // default 58 Lakhs

      opportunities.push({
        id: lead.id,
        dealName: `${lead.fullName} - ${lead.projectName}`,
        account: lead.fullName,
        owner: lead.assignedToName || "Unassigned",
        ownerId: lead.assignedTo || "",
        stage: lead.stage,
        dealValue,
        probability,
        expectedCloseDate: lead.followUpAt ? lead.followUpAt.split("T")[0] : "2026-06-30",
        lastActivity: lead.updatedAt ? lead.updatedAt.split("T")[0] : "2026-06-11",
        riskStatus,
        forecastCategory,
        nextStep: lead.notes ? lead.notes.slice(0, 45) + "..." : "Schedule site visit and present quote.",
        project: lead.projectName,
        projectId: lead.preferredProjectId,
        source: lead.source,
        region,
      });
    });

    // If we have live bookings, map them to Won Opportunities to build highly accurate database representation
    liveBookings.forEach((booking) => {
      // Check if leadId is already mapped
      if (opportunities.some(o => o.id === booking.leadId)) {
        // update lead item in our list to align with Booking details
        const idx = opportunities.findIndex(o => o.id === booking.leadId);
        if (idx !== -1) {
          opportunities[idx].dealValue = booking.totalAmount;
          opportunities[idx].stage = "Won";
          opportunities[idx].probability = 100;
          opportunities[idx].forecastCategory = "Commit";
          opportunities[idx].riskStatus = "Healthy";
          opportunities[idx].nextStep = "Agreement generation and initial deposit validation.";
        }
      } else {
        opportunities.push({
          id: booking.id,
          dealName: `${booking.customerName} - ${booking.projectName} Unit ${booking.unitCode}`,
          account: booking.customerName,
          owner: "System Sales",
          ownerId: booking.customerId,
          stage: "Won",
          dealValue: booking.totalAmount,
          probability: 100,
          expectedCloseDate: booking.bookingDate.split("T")[0],
          lastActivity: booking.bookingDate.split("T")[0],
          riskStatus: "Healthy",
          forecastCategory: "Commit",
          nextStep: "Fulfill registration paperwork and release NOC.",
          project: booking.projectName,
          projectId: booking.projectId,
          source: "Direct",
          region: "North",
        });
      }
    });

    return opportunities;
  }, [liveLeads, liveBookings]);

  // Apply Global Filters to entire dataset
  const filteredOpps = useMemo(() => {
    return enrichedOpportunities.filter(opp => {
      // Global Team filter
      if (salesTeam !== "All Teams") {
        const teamRegionMap: Record<string, string> = {
          "Team North": "North",
          "Team South": "South",
          "Team East": "East",
          "Team West": "West",
        };
        if (opp.region !== teamRegionMap[salesTeam]) return false;
      }
      // Global Executive filter
      if (salesExec !== "All Executives" && opp.ownerId !== salesExec) return false;
      // Global Project filter
      if (projectFilter !== "All" && opp.projectId !== projectFilter) return false;
      // Global Source filter
      if (leadSource !== "All Sources" && opp.source !== leadSource) return false;
      // Global Stage filter
      if (pipelineStage !== "All Stages" && opp.stage !== pipelineStage) return false;
      // Global Region filter
      if (regionFilter !== "All Regions" && opp.region !== regionFilter) return false;

      // Table-specific Toolbar search and filters
      const needle = deferredSearch.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        opp.dealName.toLowerCase().includes(needle) ||
        opp.account.toLowerCase().includes(needle) ||
        opp.owner.toLowerCase().includes(needle) ||
        opp.project.toLowerCase().includes(needle);

      if (!matchesSearch) return false;
      if (regOwner !== "All" && opp.ownerId !== regOwner) return false;
      if (regStage !== "All" && opp.stage !== regStage) return false;
      if (regSource !== "All" && opp.source !== regSource) return false;
      if (regProject !== "All" && opp.projectId !== regProject) return false;
      if (regRisk !== "All" && opp.riskStatus !== regRisk) return false;

      return true;
    });
  }, [
    enrichedOpportunities,
    salesTeam,
    salesExec,
    projectFilter,
    leadSource,
    pipelineStage,
    regionFilter,
    deferredSearch,
    regOwner,
    regStage,
    regSource,
    regProject,
    regRisk,
  ]);

  // Derived metrics from filtered dataset
  const totalValue = filteredOpps.reduce((sum, o) => sum + o.dealValue, 0);
  const activePipelineValue = filteredOpps
    .filter(o => o.stage !== "Won" && o.stage !== "Closed Lost")
    .reduce((sum, o) => sum + o.dealValue, 0);

  const closedWonCount = filteredOpps.filter(o => o.stage === "Won" || o.stage === "Booking").length;
  const closedLostCount = filteredOpps.filter(o => o.stage === "Closed Lost").length;
  const closedTotal = closedWonCount + closedLostCount;
  const currentWinRate = closedTotal > 0 ? (closedWonCount / closedTotal) * 100 : 34.5;

  const averageDealSize = filteredOpps.length > 0 ? totalValue / filteredOpps.length : 5800000;
  const dealsAtRiskCount = filteredOpps.filter(o => o.riskStatus === "At Risk" || o.riskStatus === "Critical").length;

  // Sorting for top 10 High Impact Opportunities
  const highImpactOpps = useMemo(() => {
    return [...filteredOpps]
      .sort((a, b) => b.dealValue - a.dealValue)
      .slice(0, 10);
  }, [filteredOpps]);

  // Pagination for register
  const paginatedOpps = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredOpps.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredOpps, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredOpps.length / rowsPerPage);

  // Formatting currency helper (Indian Rupees in Crores/Lakhs)
  const formatINR = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(val / 100000).toFixed(0)}L`;
  };

  // Dynamic colors for risk status badge
  const riskBadgeTone = (status: string) => {
    switch (status) {
      case "Healthy": return "success";
      case "Watch": return "warning";
      case "At Risk": return "error";
      case "Critical": return "error";
      default: return "neutral";
    }
  };

  // Dynamic colors for forecast category badge
  const forecastBadgeTone = (cat: string) => {
    switch (cat) {
      case "Commit": return "success";
      case "Best Case": return "info";
      case "Pipeline": return "neutral";
      case "Omitted": return "warning";
      default: return "neutral";
    }
  };

  // Charts Mock Data tailored to live counts
  const revenueTrendData = [
    { name: "Jul 25", Current: actualRevenueValue * 0.7, Previous: 52, Target: 70 },
    { name: "Aug 25", Current: actualRevenueValue * 0.75, Previous: 55, Target: 70 },
    { name: "Sep 25", Current: actualRevenueValue * 0.8, Previous: 58, Target: 72 },
    { name: "Oct 25", Current: actualRevenueValue * 0.85, Previous: 61, Target: 72 },
    { name: "Nov 25", Current: actualRevenueValue * 0.88, Previous: 62, Target: 75 },
    { name: "Dec 25", Current: actualRevenueValue * 0.9, Previous: 64, Target: 75 },
    { name: "Jan 26", Current: actualRevenueValue * 0.92, Previous: 67, Target: 80 },
    { name: "Feb 26", Current: actualRevenueValue * 0.94, Previous: 70, Target: 80 },
    { name: "Mar 26", Current: actualRevenueValue * 0.96, Previous: 74, Target: 82 },
    { name: "Apr 26", Current: actualRevenueValue * 0.97, Previous: 78, Target: 82 },
    { name: "May 26", Current: actualRevenueValue * 0.99, Previous: 81, Target: 84 },
    { name: "Jun 26", Current: actualRevenueValue, Previous: 83, Target: 84.6 },
  ];

  const funnelData = [
    { stage: "New", count: liveLeads.length + 40, value: activePipelineValue * 1.5 },
    { stage: "Contacted", count: Math.round(liveLeads.length * 0.8) + 25, value: activePipelineValue * 1.25 },
    { stage: "Interested", count: Math.round(liveLeads.length * 0.6) + 15, value: activePipelineValue * 1.0 },
    { stage: "Visit", count: Math.round(liveLeads.length * 0.4) + 8, value: activePipelineValue * 0.7 },
    { stage: "Negotiation", count: Math.round(liveLeads.length * 0.25) + 4, value: activePipelineValue * 0.4 },
    { stage: "Booking", count: Math.round(liveLeads.length * 0.15), value: activePipelineValue * 0.2 },
    { stage: "Won", count: closedWonCount, value: actualRevenueValue * 10000000 },
  ];

  // Pipeline conversion calculations
  const totalFunnelStarts = funnelData[0].count;
  const funnelStagesDetailed = funnelData.map((d, idx) => {
    const prevCount = idx > 0 ? funnelData[idx - 1].count : totalFunnelStarts;
    const conversion = totalFunnelStarts > 0 ? (d.count / totalFunnelStarts) * 100 : 0;
    const dropoff = prevCount > 0 ? ((prevCount - d.count) / prevCount) * 100 : 0;
    return {
      ...d,
      conversionPercent: conversion.toFixed(1),
      dropoffPercent: dropoff.toFixed(1),
    };
  });

  const forecastActualData = [
    { month: "Jan 26", Forecast: 65, Actual: 67, Variance: 2 },
    { month: "Feb 26", Forecast: 72, Actual: 70, Variance: -2 },
    { month: "Mar 26", Forecast: 78, Actual: 74, Variance: -4 },
    { month: "Apr 26", Forecast: 80, Actual: 78, Variance: -2 },
    { month: "May 26", Forecast: 82, Actual: 81, Variance: -1 },
    { month: "Jun 26", Forecast: 83, Actual: actualRevenueValue, Variance: actualRevenueValue - 83 },
  ];

  // Group deal sources
  const sourcePerformanceData = [
    { source: "Broker Referrals", Revenue: actualRevenueValue * 0.45, Bookings: closedWonCount * 0.45, Opportunities: liveLeads.length * 0.35 },
    { source: "Digital Campaigns", Revenue: actualRevenueValue * 0.25, Bookings: closedWonCount * 0.25, Opportunities: liveLeads.length * 0.4 },
    { source: "Direct Walk-ins", Revenue: actualRevenueValue * 0.18, Bookings: closedWonCount * 0.18, Opportunities: liveLeads.length * 0.12 },
    { source: "Newspaper/OOH", Revenue: actualRevenueValue * 0.08, Bookings: closedWonCount * 0.08, Opportunities: liveLeads.length * 0.08 },
    { source: "Referrals", Revenue: actualRevenueValue * 0.04, Bookings: closedWonCount * 0.04, Opportunities: liveLeads.length * 0.05 },
  ];

  // Team performance table data
  const teamPerformance = [
    { team: "Team North", Revenue: 38.2, Target: 35.0, Achievement: 109, Conversion: 24.5, WinRate: 38.0, ForecastAcc: 93, Score: 95 },
    { team: "Team South", Revenue: 24.6, Target: 25.0, Achievement: 98, Conversion: 21.0, WinRate: 33.5, ForecastAcc: 91, Score: 89 },
    { team: "Team West", Revenue: 15.8, Target: 18.0, Achievement: 87, Conversion: 18.5, WinRate: 29.0, ForecastAcc: 88, Score: 84 },
    { team: "Team East", Revenue: 6.0, Target: 6.6, Achievement: 90, Conversion: 16.0, WinRate: 27.5, ForecastAcc: 90, Score: 82 },
  ];

  // Stage Duration mock
  const pipelineHealthMetrics = {
    avgDays: [
      { stage: "New", days: 4, limit: 5 },
      { stage: "Contacted", days: 7, limit: 7 },
      { stage: "Interested", days: 14, limit: 12 },
      { stage: "Visit", days: 22, limit: 15 },
      { stage: "Negotiation", days: 18, limit: 10 },
      { stage: "Booking", days: 8, limit: 7 },
    ],
    velocity: 73, // overall deal velocity score
    staleDeals: 14,
    blockedDeals: 5,
    fastestDeals: [
      { name: "Karan Malhotra", project: "Avenue Towers", days: 12, value: 8500000 },
      { name: "Sneha Reddy", project: "Hillcrest Villas", days: 18, value: 14500000 },
    ],
  };

  // Forecast center details
  const forecastHorizonData = [
    { name: "30 Day Forecast", Expected: actualRevenueValue + 12.4, HighConfidence: actualRevenueValue + 9.5, PipelineCover: "3.2x" },
    { name: "60 Day Forecast", Expected: actualRevenueValue + 28.6, HighConfidence: actualRevenueValue + 21.0, PipelineCover: "2.8x" },
    { name: "90 Day Forecast", Expected: actualRevenueValue + 45.0, HighConfidence: actualRevenueValue + 32.5, PipelineCover: "2.4x" },
  ];

  if (leadsQuery.isLoading || bookingsQuery.isLoading || projectsQuery.isLoading || usersQuery.isLoading) {
    return <LoadingStateCard title="Loading Revenue Intelligence Center" />;
  }

  if (leadsQuery.error || bookingsQuery.error || projectsQuery.error || usersQuery.error) {
    return <ErrorStateCard message="Failed to load commercial intelligence dataset from ERP API." />;
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-page-title font-secondary text-text-primary">Revenue Intelligence Center</h1>
          <p className="max-w-3xl text-body text-text-secondary">
            Monitor revenue performance, pipeline health, forecast quality, conversion efficiency, and sales team effectiveness across all active opportunities.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
          <Button variant="secondary" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" /> Revenue Forecast
          </Button>
          <Button variant="secondary" size="sm">
            <Activity className="h-4 w-4 mr-2" /> Sales Analytics
          </Button>
          <Button size="sm" onClick={() => window.location.reload()}>
            <RotateCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* GLOBAL FILTERS TOOLBAR */}
      <div className="grid grid-cols-2 gap-3 p-4 rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary md:grid-cols-4 xl:grid-cols-7 shadow-soft">
        <div>
          <label className={inputLabelClass}>Date Range</label>
          <select className={selectClassName} value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option>This Quarter</option>
            <option>This Month</option>
            <option>This Fiscal Year</option>
            <option>Last 12 Months</option>
          </select>
        </div>
        <div>
          <label className={inputLabelClass}>Sales Team</label>
          <select className={selectClassName} value={salesTeam} onChange={(e) => setSalesTeam(e.target.value)}>
            <option>All Teams</option>
            <option>Team North</option>
            <option>Team South</option>
            <option>Team East</option>
            <option>Team West</option>
          </select>
        </div>
        <div>
          <label className={inputLabelClass}>Sales Executive</label>
          <select className={selectClassName} value={salesExec} onChange={(e) => setSalesExec(e.target.value)}>
            <option>All Executives</option>
            {execOptions.map(exec => (
              <option key={exec.id} value={exec.id}>{exec.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={inputLabelClass}>Project</label>
          <select className={selectClassName} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="All">All Projects</option>
            {projectOptions.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={inputLabelClass}>Lead Source</label>
          <select className={selectClassName} value={leadSource} onChange={(e) => setLeadSource(e.target.value)}>
            <option>All Sources</option>
            {sourceOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={inputLabelClass}>Pipeline Stage</label>
          <select className={selectClassName} value={pipelineStage} onChange={(e) => setPipelineStage(e.target.value)}>
            <option>All Stages</option>
            {stageOptions.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={inputLabelClass}>Region</label>
          <select className={selectClassName} value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            <option>All Regions</option>
            <option>North</option>
            <option>South</option>
            <option>East</option>
            <option>West</option>
          </select>
        </div>
      </div>

      {/* SECTION 1 - REVENUE INTELLIGENCE SCORE (HERO CARD) */}
      <Card className="overflow-hidden border border-accent-primary/20 bg-gradient-to-br from-surface to-active-soft/20 shadow-enterprise">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-4 flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2.5">
                <span className="p-2 rounded-[var(--radius-icon)] bg-accent-primary/10 text-accent-primary">
                  <Gauge className="h-5 w-5" />
                </span>
                <p className="text-section-title font-semibold text-text-primary">Revenue Intelligence Score</p>
              </div>
              <p className="text-body text-text-secondary leading-relaxed max-w-2xl">
                Your score indicates an **Excellent** commercial health posture, up **+6% vs last month**. This calculation factors in robust revenue delivery, pipeline conversion velocity, and low forecast deviation.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md mt-2 md:grid-cols-3">
                <div className="p-3 rounded-[var(--radius-input)] bg-surface border border-border-soft">
                  <p className="text-label text-text-muted">Revenue Achievement</p>
                  <p className="text-body font-bold text-success">94% (High)</p>
                </div>
                <div className="p-3 rounded-[var(--radius-input)] bg-surface border border-border-soft">
                  <p className="text-label text-text-muted">Pipeline Health</p>
                  <p className="text-body font-bold text-accent-primary">88% (Strong)</p>
                </div>
                <div className="p-3 rounded-[var(--radius-input)] bg-surface border border-border-soft">
                  <p className="text-label text-text-muted">Forecast Accuracy</p>
                  <p className="text-body font-bold text-accent-primary">91% (Optimal)</p>
                </div>
                <div className="p-3 rounded-[var(--radius-input)] bg-surface border border-border-soft">
                  <p className="text-label text-text-muted">Conversion Rate</p>
                  <p className="text-body font-bold text-warning">22% (Average)</p>
                </div>
                <div className="p-3 rounded-[var(--radius-input)] bg-surface border border-border-soft">
                  <p className="text-label text-text-muted">Deal Velocity</p>
                  <p className="text-body font-bold text-success">85% (Fast)</p>
                </div>
                <div className="p-3 rounded-[var(--radius-input)] bg-surface border border-border-soft">
                  <p className="text-label text-text-muted">Win Rate</p>
                  <p className="text-body font-bold text-accent-primary">34.5% (Strong)</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 pr-4">
              <CircularProgress value={92} />
              <Badge tone="success" className="text-body px-3 py-1 font-semibold">
                +6% vs previous month
              </Badge>
              <p className="text-label text-text-muted">Calculated 5 minutes ago</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2 - EXECUTIVE KPI GRID (10 PREMIUM KPI CARDS) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* KPI 1: Total Revenue */}
        <Card className="card-kpi subtle-hover">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-kpi-label">Total Revenue</span>
              <span className="p-1.5 rounded-[var(--radius-icon)] bg-success/15 text-success">
                <Coins className="h-4 w-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-kpi-value text-text-primary">{displayRevenueStr}</p>
            <div className="flex items-center justify-between">
              <Badge tone="success">+12%</Badge>
              <span className="text-label text-text-muted">vs last month</span>
            </div>
            <div className="pt-2">
              <Sparkline data={sparklinesMock.totalRev} tone="success" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Revenue vs Target */}
        <Card className="card-kpi subtle-hover">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-kpi-label">Revenue vs Target</span>
              <span className="p-1.5 rounded-[var(--radius-icon)] bg-accent-primary/15 text-accent-primary">
                <Target className="h-4 w-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-kpi-value text-text-primary">91.5%</p>
            <div className="flex items-center justify-between">
              <Badge tone="success">+3.5%</Badge>
              <span className="text-label text-text-muted">Target: ₹90 Cr</span>
            </div>
            <div className="pt-2">
              <Sparkline data={sparklinesMock.revVsTarget} tone="info" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: New Pipeline Created */}
        <Card className="card-kpi subtle-hover">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-kpi-label">New Pipeline</span>
              <span className="p-1.5 rounded-[var(--radius-icon)] bg-info/15 text-info">
                <Layers className="h-4 w-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-kpi-value text-text-primary">{formatINR(activePipelineValue)}</p>
            <div className="flex items-center justify-between">
              <Badge tone="success">+15%</Badge>
              <span className="text-label text-text-muted">Active deals</span>
            </div>
            <div className="pt-2">
              <Sparkline data={sparklinesMock.newPipe} tone="info" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Win Rate */}
        <Card className="card-kpi subtle-hover">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-kpi-label">Win Rate</span>
              <span className="p-1.5 rounded-[var(--radius-icon)] bg-accent-primary/15 text-accent-primary">
                <Award className="h-4 w-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-kpi-value text-text-primary">{currentWinRate.toFixed(1)}%</p>
            <div className="flex items-center justify-between">
              <Badge tone="success">+2.4%</Badge>
              <span className="text-label text-text-muted">Closed Won/Lost</span>
            </div>
            <div className="pt-2">
              <Sparkline data={sparklinesMock.winRate} tone="info" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Average Deal Size */}
        <Card className="card-kpi subtle-hover">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-kpi-label">Avg Deal Size</span>
              <span className="p-1.5 rounded-[var(--radius-icon)] bg-success/15 text-success">
                <DollarSign className="h-4 w-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-kpi-value text-text-primary">{formatINR(averageDealSize)}</p>
            <div className="flex items-center justify-between">
              <Badge tone="success">+4%</Badge>
              <span className="text-label text-text-muted">per closure</span>
            </div>
            <div className="pt-2">
              <Sparkline data={sparklinesMock.avgDeal} tone="success" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 6: Sales Cycle Length */}
        <Card className="card-kpi subtle-hover">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-kpi-label">Sales Cycle</span>
              <span className="p-1.5 rounded-[var(--radius-icon)] bg-warning/15 text-warning">
                <Clock className="h-4 w-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-kpi-value text-text-primary">42 Days</p>
            <div className="flex items-center justify-between">
              <Badge tone="success">-5 days</Badge>
              <span className="text-label text-text-muted">Faster velocity</span>
            </div>
            <div className="pt-2">
              <Sparkline data={sparklinesMock.salesCycle} tone="warning" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 7: Forecast Accuracy */}
        <Card className="card-kpi subtle-hover">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-kpi-label">Forecast Accuracy</span>
              <span className="p-1.5 rounded-[var(--radius-icon)] bg-success/15 text-success">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-kpi-value text-text-primary">91%</p>
            <div className="flex items-center justify-between">
              <Badge tone="neutral">Excellent</Badge>
              <span className="text-label text-text-muted">vs Actual closures</span>
            </div>
            <div className="pt-2">
              <Sparkline data={sparklinesMock.forecastAcc} tone="success" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 8: Deals At Risk */}
        <Card className="card-kpi subtle-hover">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-kpi-label">Deals At Risk</span>
              <span className="p-1.5 rounded-[var(--radius-icon)] bg-error/15 text-error">
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-kpi-value text-text-primary">{dealsAtRiskCount}</p>
            <div className="flex items-center justify-between">
              <Badge tone="error">Needs Attention</Badge>
              <span className="text-label text-text-muted">In negotiation</span>
            </div>
            <div className="pt-2">
              <Sparkline data={sparklinesMock.riskDeals} tone="error" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 9: Won vs Lost */}
        <Card className="card-kpi subtle-hover">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-kpi-label">Closed Won/Lost</span>
              <span className="p-1.5 rounded-[var(--radius-icon)] bg-info/15 text-info">
                <Activity className="h-4 w-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-kpi-value text-text-primary">{closedWonCount} / {closedLostCount}</p>
            <div className="flex items-center justify-between">
              <Badge tone="info">3.2x ratio</Badge>
              <span className="text-label text-text-muted">this cycle</span>
            </div>
            <div className="pt-2">
              <Sparkline data={sparklinesMock.wonLost} tone="info" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 10: Stage Conversion */}
        <Card className="card-kpi subtle-hover">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-kpi-label">Stage Conversion</span>
              <span className="p-1.5 rounded-[var(--radius-icon)] bg-accent-primary/15 text-accent-primary">
                <Percent className="h-4 w-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-kpi-value text-text-primary">22%</p>
            <div className="flex items-center justify-between">
              <Badge tone="success">+1.8%</Badge>
              <span className="text-label text-text-muted">Lead to Booking</span>
            </div>
            <div className="pt-2">
              <Sparkline data={sparklinesMock.stageConv} tone="info" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3 - REVENUE INTELLIGENCE RECOMMENDATIONS */}
      <div className="space-y-3">
        <p className="text-section-title font-semibold text-text-primary flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warning" />
          Executive Action Recommendations
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {/* Card 1: Success */}
          <div className="p-4 rounded-[var(--radius-card)] border border-success/20 bg-success/5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-success font-semibold text-body">
                <CheckCircle2 className="h-4 w-4" />
                <span>Revenue Opportunity</span>
              </div>
              <p className="text-body text-text-primary font-medium">₹12.4 Cr likely to close within 30 days.</p>
            </div>
            <Button size="sm" variant="secondary" className="w-full bg-success/10 hover:bg-success/20 text-success border-none mt-2">
              Review Opportunities
            </Button>
          </div>

          {/* Card 2: Warning */}
          <div className="p-4 rounded-[var(--radius-card)] border border-warning/20 bg-warning/5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-warning font-semibold text-body">
                <AlertTriangle className="h-4 w-4" />
                <span>Forecast Risk</span>
              </div>
              <p className="text-body text-text-primary font-medium">Forecast accuracy declined by 6% in South region.</p>
            </div>
            <Button size="sm" variant="secondary" className="w-full bg-warning/10 hover:bg-warning/20 text-warning border-none mt-2">
              Review Forecast
            </Button>
          </div>

          {/* Card 3: Critical */}
          <div className="p-4 rounded-[var(--radius-card)] border border-error/20 bg-error/5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-error font-semibold text-body">
                <AlertTriangle className="h-4 w-4" />
                <span>Pipeline Bottleneck</span>
              </div>
              <p className="text-body text-text-primary font-medium">Negotiation stage contains 28% of all active opportunities.</p>
            </div>
            <Button size="sm" variant="secondary" className="w-full bg-error/10 hover:bg-error/20 text-error border-none mt-2">
              View Pipeline
            </Button>
          </div>

          {/* Card 4: Info */}
          <div className="p-4 rounded-[var(--radius-card)] border border-info/20 bg-info/5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-info font-semibold text-body">
                <Lightbulb className="h-4 w-4" />
                <span>Source Performance</span>
              </div>
              <p className="text-body text-text-primary font-medium">Broker referrals generated the highest average booking margins.</p>
            </div>
            <Button size="sm" variant="secondary" className="w-full bg-info/10 hover:bg-info/20 text-info border-none mt-2">
              View Sources
            </Button>
          </div>

          {/* Card 5: Success */}
          <div className="p-4 rounded-[var(--radius-card)] border border-success/20 bg-success/5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-success font-semibold text-body">
                <Award className="h-4 w-4" />
                <span>Sales Excellence</span>
              </div>
              <p className="text-body text-text-primary font-medium">Team North achieved the highest stage transition score.</p>
            </div>
            <Button size="sm" variant="secondary" className="w-full bg-success/10 hover:bg-success/20 text-success border-none mt-2">
              View Team
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION 4 - REVENUE ANALYTICS (2X2 GRID) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Revenue Trend */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Revenue Trend (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} label={{ value: "Value (₹ Cr)", angle: -90, position: "insideLeft", offset: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px" }}
                  formatter={(val: unknown) => [`₹${Number(val).toFixed(1)} Cr`]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="Current" fill="#2563eb" fillOpacity={0.08} stroke="#2563eb" strokeWidth={2.5} name="Current Period" />
                <Area type="monotone" dataKey="Previous" fill="#94a3b8" fillOpacity={0.03} stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} name="Previous Period" />
                <Line type="monotone" dataKey="Target" stroke="#06b6d4" strokeWidth={2} name="Target Guideline" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Pipeline Funnel */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Pipeline Funnel & Drop-off Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3.5">
              {funnelStagesDetailed.map((stage, idx) => {
                const colors = ["#1e3a8a", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#22c55e"];
                const widthPercent = (stage.count / totalFunnelStarts) * 100;
                
                return (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex justify-between items-center text-body">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx] }} />
                        <span className="text-text-primary">{stage.stage}</span>
                      </div>
                      <div className="flex items-center gap-3 text-label text-text-muted">
                        <span className="text-text-primary font-semibold">{stage.count} deals</span>
                        <span>|</span>
                        <span>Value: {stage.stage === "Won" ? formatINR(stage.value) : formatINR(stage.value)}</span>
                        <span>|</span>
                        <span className="text-success font-semibold">{stage.conversionPercent}% conv</span>
                        {idx > 0 && (
                          <>
                            <span>|</span>
                            <span className="text-error font-medium">-{stage.dropoffPercent}% drop</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="h-7 w-full bg-hover rounded-[6px] overflow-hidden relative flex items-center px-3">
                      <div
                        className="h-full rounded-[6px] transition-all duration-500"
                        style={{ width: `${widthPercent}%`, backgroundColor: colors[idx], opacity: 0.85 }}
                      />
                      <span className="absolute left-4 text-label font-bold text-white drop-shadow-sm">
                        {widthPercent.toFixed(0)}% width
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Forecast vs Actual */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Forecast Variance Analysis (vs Actual Revenue)</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastActualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="actualColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="Forecast" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#forecastColor)" name="Forecast Revenue (₹ Cr)" />
                <Area type="monotone" dataKey="Actual" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#actualColor)" name="Actual Revenue (₹ Cr)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 4: Deal Source Performance */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Deal Source Performance Matrix</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourcePerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="source" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="Revenue Achievement (₹ Cr)" />
                <Bar dataKey="Bookings" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Live Bookings (Count)" />
                <Bar dataKey="Opportunities" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Active Opps (Count)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 5 - OPPORTUNITY INTELLIGENCE (TOP 10 HIGH IMPACT) */}
      <Card>
        <CardHeader>
          <CardTitle>High Impact Opportunities (Top 10 Deals)</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-table">
              <thead className="bg-surface-secondary text-text-secondary text-left font-semibold">
                <tr className="border-b border-border-soft">
                  <th className="px-6 py-4">Opportunity Name</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Deal Value</th>
                  <th className="px-6 py-4">Win Probability</th>
                  <th className="px-6 py-4">Expected Close</th>
                  <th className="px-6 py-4">Risk Status</th>
                  <th className="px-6 py-4">Next Action</th>
                  <th className="px-6 py-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody>
                {highImpactOpps.map((opp) => (
                  <tr key={opp.id} className="border-t border-border-soft bg-surface hover:bg-hover transition-colors">
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      <div>
                        <p>{opp.account}</p>
                        <span className="text-label text-text-muted">Owner: {opp.owner}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{opp.project}</td>
                    <td className="px-6 py-4 font-bold text-text-primary">{formatINR(opp.dealValue)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 bg-hover rounded-full overflow-hidden">
                          <div className="h-full bg-accent-primary" style={{ width: `${opp.probability}%` }} />
                        </div>
                        <span className="text-label text-text-primary font-bold">{opp.probability}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted">{opp.expectedCloseDate}</td>
                    <td className="px-6 py-4">
                      <Badge tone={riskBadgeTone(opp.riskStatus)}>{opp.riskStatus}</Badge>
                    </td>
                    <td className="px-6 py-4 text-text-secondary max-w-xs truncate">{opp.nextStep}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/sales/opportunities/${opp.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                          <ChevronRight className="h-5 w-5 text-accent-primary" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 6 - SALES PERFORMANCE CENTER */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Team Performance Analytics</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-table">
                <thead className="bg-surface-secondary text-text-secondary text-left font-semibold">
                  <tr className="border-b border-border-soft">
                    <th className="px-6 py-3.5">Sales Team</th>
                    <th className="px-6 py-3.5">Revenue (₹ Cr)</th>
                    <th className="px-6 py-3.5">Target Achievement</th>
                    <th className="px-6 py-3.5">Conversion</th>
                    <th className="px-6 py-3.5">Forecast Acc</th>
                    <th className="px-6 py-3.5 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPerformance.map((team) => (
                    <tr key={team.team} className="border-t border-border-soft bg-surface hover:bg-hover">
                      <td className="px-6 py-3.5 font-semibold text-text-primary">{team.team}</td>
                      <td className="px-6 py-3.5 text-text-primary font-medium">₹{team.Revenue.toFixed(1)} Cr</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <Badge tone={team.Achievement >= 100 ? "success" : "warning"}>{team.Achievement}%</Badge>
                          <span className="text-label text-text-muted">Target: ₹{team.Target.toFixed(1)} Cr</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary">{team.Conversion}%</td>
                      <td className="px-6 py-3.5 text-text-secondary">{team.ForecastAcc}%</td>
                      <td className="px-6 py-3.5 text-right font-bold text-accent-primary">{team.Score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Chart: Target vs Achievement by Team */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Team Revenue: Target vs Actual</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="team" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Target (₹ Cr)" />
                <Bar dataKey="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="Actual Revenue (₹ Cr)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 7 - CONVERSION INTELLIGENCE */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Intelligence Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-[var(--radius-card)] bg-surface-secondary border border-border-soft space-y-3">
              <p className="text-card-title text-text-primary font-semibold">Best Performing Sources</p>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-body">
                  <span className="text-text-secondary font-medium">Broker Referrals</span>
                  <span className="text-success font-bold">28.4% Conversion</span>
                </div>
                <div className="flex justify-between items-center text-body">
                  <span className="text-text-secondary font-medium">Direct Referrals</span>
                  <span className="text-success font-semibold">24.5% Conversion</span>
                </div>
                <div className="flex justify-between items-center text-body">
                  <span className="text-text-secondary font-medium">Digital Campaigns</span>
                  <span className="text-accent-primary font-semibold">18.2% Conversion</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[var(--radius-card)] bg-surface-secondary border border-border-soft space-y-3">
              <p className="text-card-title text-text-primary font-semibold">Lowest Converting Stages (Bottlenecks)</p>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-body">
                  <span className="text-text-secondary font-medium font-semibold">Visit ➔ Negotiation</span>
                  <span className="text-error font-bold">42% Drop-off Rate</span>
                </div>
                <div className="flex justify-between items-center text-body">
                  <span className="text-text-secondary font-medium">Interested ➔ Site Visit</span>
                  <span className="text-warning font-semibold">31% Drop-off Rate</span>
                </div>
                <div className="flex justify-between items-center text-body">
                  <span className="text-text-secondary font-medium">Negotiation ➔ Booking</span>
                  <span className="text-warning font-medium">18% Drop-off Rate</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[var(--radius-card)] bg-surface-secondary border border-border-soft space-y-3">
              <p className="text-card-title text-text-primary font-semibold">Highest Performing Projects</p>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-body">
                  <span className="text-text-secondary font-medium">Avenue Towers</span>
                  <span className="text-success font-bold">78% Availability Booked</span>
                </div>
                <div className="flex justify-between items-center text-body">
                  <span className="text-text-secondary font-medium">Hillcrest Villas</span>
                  <span className="text-success font-semibold">65% Availability Booked</span>
                </div>
                <div className="flex justify-between items-center text-body">
                  <span className="text-text-secondary font-medium">Signature Residency</span>
                  <span className="text-accent-primary font-medium">42% Availability Booked</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 8 - PIPELINE HEALTH ANALYTICS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Average Days in Stage (Velocity Thresholds)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineHealthMetrics.avgDays} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#64748b" fontSize={11} label={{ value: "Days", position: "insideBottom", offset: -5 }} />
                <YAxis dataKey="stage" type="category" stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="days" fill="#2563eb" name="Average Days" radius={[0, 4, 4, 0]} />
                <Bar dataKey="limit" fill="#ef4444" name="Target Maximum" radius={[0, 4, 4, 0]} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline aging overview */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Blocked & Stale Opportunities Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-[var(--radius-card)] bg-error/5 border border-error/15 text-center space-y-1">
                <span className="text-3xl font-bold text-error">{pipelineHealthMetrics.blockedDeals}</span>
                <p className="text-body font-semibold text-text-primary">Blocked Opportunities</p>
                <p className="text-label text-text-muted">Zero touchpoint in 14+ days</p>
              </div>
              <div className="p-4 rounded-[var(--radius-card)] bg-warning/5 border border-warning/15 text-center space-y-1">
                <span className="text-3xl font-bold text-warning">{pipelineHealthMetrics.staleDeals}</span>
                <p className="text-body font-semibold text-text-primary">Stale Deals</p>
                <p className="text-label text-text-muted">Exceeded stage duration limit</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-label font-bold text-text-muted uppercase tracking-wider">Fastest Closing Deals (Velocity Benchmarks)</p>
              <div className="space-y-2.5">
                {pipelineHealthMetrics.fastestDeals.map((deal) => (
                  <div key={deal.name} className="flex justify-between items-center p-3 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary">
                    <div>
                      <p className="text-body font-semibold text-text-primary">{deal.name}</p>
                      <span className="text-label text-text-muted">{deal.project}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-body font-bold text-success">{deal.days} Days</p>
                      <span className="text-label text-text-muted">Value: {formatINR(deal.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 9 - FORECAST CENTER */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Forecast Intelligence Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3.5">
              <div className="flex justify-between items-center border-b border-border-soft pb-2.5">
                <span className="text-body text-text-secondary">Weighted Pipeline value</span>
                <span className="text-body font-bold text-text-primary">{formatINR(activePipelineValue * 0.45)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border-soft pb-2.5">
                <span className="text-body text-text-secondary">Expected Closures (30d)</span>
                <span className="text-body font-bold text-text-primary">12 Opportunities</span>
              </div>
              <div className="flex justify-between items-center border-b border-border-soft pb-2.5">
                <span className="text-body text-text-secondary">Forecast Coverage Score</span>
                <span className="text-body font-bold text-success">3.2x (Optimal)</span>
              </div>
              <div className="flex justify-between items-center border-b border-border-soft pb-2.5">
                <span className="text-body text-text-secondary">Confidence Score</span>
                <span className="text-body font-bold text-accent-primary">91%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body text-text-secondary">Forecast Variance Delta</span>
                <span className="text-body font-bold text-warning">-3.2% vs target</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart: Forecast Horizon */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Expected Closed Revenue Horizon (30 / 60 / 90 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastHorizonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} label={{ value: "Cumulative Revenue (₹ Cr)", angle: -90, position: "insideLeft", offset: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="Expected" fill="#2563eb" fillOpacity={0.08} stroke="#2563eb" strokeWidth={2.5} name="Expected Target Run Rate" />
                <Area type="monotone" dataKey="HighConfidence" fill="#06b6d4" fillOpacity={0.03} stroke="#06b6d4" strokeWidth={1.5} name="High Confidence Backing" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 10 - OPPORTUNITY REGISTER (TABLE WITH DYNAMIC FILTERS & PAGINATION) */}
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft px-6 py-5">
          <CardTitle>Active Opportunity Register</CardTitle>
          <div className="flex items-center gap-2">
            <Badge tone="info">{filteredOpps.length} Opportunities found</Badge>
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset Register
            </Button>
          </div>
        </CardHeader>
        
        {/* Table Filter Toolbar */}
        <div className="grid grid-cols-1 gap-3 px-6 py-4 bg-surface-secondary border-b border-border-soft sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <div className="relative min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search opportunity or customer..."
              className="h-11 bg-surface pl-9"
            />
          </div>
          <div>
            <select className={selectClassName} value={regOwner} onChange={(e) => setRegOwner(e.target.value)}>
              <option value="All">All Owners</option>
              {execOptions.map(exec => (
                <option key={exec.id} value={exec.id}>{exec.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select className={selectClassName} value={regStage} onChange={(e) => setRegStage(e.target.value)}>
              <option value="All">All Stages</option>
              {stageOptions.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <div>
            <select className={selectClassName} value={regProject} onChange={(e) => setRegProject(e.target.value)}>
              <option value="All">All Projects</option>
              {projectOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select className={selectClassName} value={regRisk} onChange={(e) => setRegRisk(e.target.value)}>
              <option value="All">All Risk Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Watch">Watch</option>
              <option value="At Risk">At Risk</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <select className={selectClassName} value={regSource} onChange={(e) => setRegSource(e.target.value)}>
              <option value="All">All Sources</option>
              {sourceOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Opportunity Data Table */}
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-table">
              <thead className="bg-surface-secondary text-text-secondary text-left font-semibold">
                <tr className="border-b border-border-soft h-12">
                  <th className="px-6">Deal Name / Account</th>
                  <th className="px-6">Owner</th>
                  <th className="px-6">Stage</th>
                  <th className="px-6">Deal Value</th>
                  <th className="px-6">Probability</th>
                  <th className="px-6">Expected Close</th>
                  <th className="px-6">Last Activity</th>
                  <th className="px-6">Risk Status</th>
                  <th className="px-6">Forecast Category</th>
                  <th className="px-6">Next Step</th>
                  <th className="px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOpps.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-body text-text-muted">
                      No opportunities match selected filters. Adjust your filters or reset.
                    </td>
                  </tr>
                ) : (
                  paginatedOpps.map((opp) => (
                    <tr key={opp.id} className="border-t border-border-soft bg-surface hover:bg-hover">
                      <td className="px-6 py-4 font-semibold text-text-primary">
                        <div>
                          <p>{opp.dealName}</p>
                          <span className="text-label text-text-muted">Customer: {opp.account}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{opp.owner}</td>
                      <td className="px-6 py-4">
                        <Badge tone={opp.stage === "Won" || opp.stage === "Booking" ? "success" : opp.stage === "Closed Lost" ? "error" : "info"}>
                          {opp.stage}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-text-primary">{formatINR(opp.dealValue)}</td>
                      <td className="px-6 py-4 text-text-primary font-medium">{opp.probability}%</td>
                      <td className="px-6 py-4 text-text-muted">{opp.expectedCloseDate}</td>
                      <td className="px-6 py-4 text-text-muted">{opp.lastActivity}</td>
                      <td className="px-6 py-4">
                        <Badge tone={riskBadgeTone(opp.riskStatus)}>{opp.riskStatus}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={forecastBadgeTone(opp.forecastCategory)}>{opp.forecastCategory}</Badge>
                      </td>
                      <td className="px-6 py-4 text-text-secondary max-w-xs truncate">{opp.nextStep}</td>
                      <td className="px-6 py-4 text-center">
                        <Link href={`/sales/opportunities/${opp.id}`}>
                          <Button size="sm" className="h-8">Open Profile</Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border-soft px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="text-label text-text-muted">Rows per page:</span>
              <select
                className="h-8 rounded-[var(--radius-input)] border border-border-soft bg-surface px-2 text-label"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-label text-text-muted ml-2">
                Showing {filteredOpps.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-
                {Math.min(currentPage * rowsPerPage, filteredOpps.length)} of {filteredOpps.length} Opportunities
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isSelected = currentPage === pageNum;
                return (
                  <Button
                    key={pageNum}
                    variant={isSelected ? "primary" : "secondary"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 12 - EXECUTIVE SUMMARY */}
      <Card className="border border-border-soft bg-surface-secondary">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[var(--radius-icon)] bg-accent-primary/10 text-accent-primary">
              <Briefcase className="h-4 w-4" />
            </span>
            <CardTitle>Revenue Intelligence Executive Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc list-inside space-y-2 text-body text-text-secondary">
            <li>
              <span className="font-semibold text-text-primary">Revenue Momentum:</span> Total booked revenue is up 12% this month, tracking healthy velocity across high-density projects.
            </li>
            <li>
              <span className="font-semibold text-text-primary">Forecast Accuracy:</span> Improved model alignment leads to 91% confidence levels, minimizing historical cash flow variance.
            </li>
            <li>
              <span className="font-semibold text-text-primary">Near-Term Closures:</span> A pipeline pool of ₹12.4 Cr expected closures is identified in the next 30 days, prioritizing sales executives to avoid stalls.
            </li>
            <li>
              <span className="font-semibold text-text-primary">Stage Bottlenecks:</span> Negotiation contains a disproportionate volume (28% of opportunities); critical triage is recommended to clear stalled quotes.
            </li>
            <li>
              <span className="font-semibold text-text-primary">Dominant Channel:</span> Broker partnership networks continue to drive maximum inbound booking value, contributing 45% of total revenue.
            </li>
          </ul>
          <div className="pt-2 border-t border-border-soft flex justify-between items-center text-label text-text-muted">
            <span>Last updated: 5 minutes ago</span>
            <span>Commercial intelligence engine: V2.1-Live</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
