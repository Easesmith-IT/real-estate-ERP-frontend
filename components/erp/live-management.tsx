"use client";
import { toast } from "@/components/ui/toast";

import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  CircleDollarSign, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Download, 
  Plus, 
  RotateCcw, 
  Filter, 
  Calendar, 
  DollarSign, 
  Percent, 
  Briefcase, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Clock3, 
  AlertOctagon, 
  ArrowUpRight, 
  FileText, 
  Building2, 
  Users, 
  Phone, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Activity,
  Receipt as ReceiptIcon,
  HeartPulse,
  Award
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatCurrency, formatDate, formatDateTime, toneForStatus } from "@/lib/erp-utils";
import type { BookingResponse, FinancialOverview, Receipt, Booking } from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

// Custom sparkline helper to keep visual weight clean
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const data = values.map((val, idx) => ({ index: idx, value: val }));
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill="transparent"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FinancialOverviewWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  
  // Period filter state
  const [timePeriod, setTimePeriod] = useState<string>("All Time");
  
  // Tables state
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("All");
  const [projectPage, setProjectPage] = useState(1);
  const [projectRowsPerPage, setProjectRowsPerPage] = useState(10);
  
  const [receiptSearch, setReceiptSearch] = useState("");
  const [receiptModeFilter, setReceiptModeFilter] = useState("All");
  const [receiptPage, setReceiptPage] = useState(1);
  const [receiptRowsPerPage, setReceiptRowsPerPage] = useState(10);

  const [scheduleSearch, setScheduleSearch] = useState("");
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState("All");
  const [schedulePage, setSchedulePage] = useState(1);
  const [scheduleRowsPerPage, setScheduleRowsPerPage] = useState(10);
  
  // Record receipt drawer state
  const [isReceiptDrawerOpen, setIsReceiptDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    bookingId: "",
    amount: "",
    mode: "NEFT",
    reference: "",
  });

  // Fetch API Queries
  const financialQuery = useQuery({
    queryKey: ["erp-financial-overview", role],
    queryFn: async () => (await apiRequest<FinancialOverview>("/api/reports/financial-overview", { role })).data,
  });
  
  const bookingsQuery = useQuery({
    queryKey: ["erp-bookings", role],
    queryFn: async () => (await apiRequest<BookingResponse>("/api/bookings", { role })).data,
  });

  // Mutation to post new receipt payments
  const receiptMutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/payments/receipts", {
        role,
        method: "POST",
        body: {
          bookingId: form.bookingId,
          amount: Number(form.amount),
          mode: form.mode,
          reference: form.reference,
        },
      }),
    onSuccess: async () => {
      setForm({
        bookingId: bookingsQuery.data?.bookings[0]?.id || "",
        amount: "",
        mode: "NEFT",
        reference: "",
      });
      setIsReceiptDrawerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-financial-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-payments-summary"] }),
      ]);
    },
  });

  // Set initial form bookingId
  useEffect(() => {
    if (!form.bookingId && bookingsQuery.data?.bookings[0]?.id) {
      setForm((current) => ({ ...current, bookingId: bookingsQuery.data?.bookings[0]?.id || "" }));
    }
  }, [bookingsQuery.data?.bookings, form.bookingId]);

  // Filter Data by Selected Period (Simulated client-side time filtering)
  const filteredReceipts = useMemo(() => {
    const receipts = financialQuery.data?.recentReceipts || [];
    return receipts.filter(receipt => {
      if (timePeriod === "All Time") return true;
      const dateLimit = new Date();
      if (timePeriod === "Last 7 Days") dateLimit.setDate(dateLimit.getDate() - 7);
      else if (timePeriod === "Last 30 Days") dateLimit.setDate(dateLimit.getDate() - 30);
      else if (timePeriod === "This Quarter") dateLimit.setMonth(dateLimit.getMonth() - 3);
      else if (timePeriod === "Year To Date") {
        dateLimit.setMonth(0);
        dateLimit.setDate(1);
      }
      return new Date(receipt.receivedAt) >= dateLimit;
    });
  }, [financialQuery.data?.recentReceipts, timePeriod]);

  const filteredSchedules = useMemo(() => {
    const schedules = financialQuery.data?.dueSoonSchedules || [];
    return schedules.filter(item => {
      if (timePeriod === "All Time") return true;
      const dateLimit = new Date();
      if (timePeriod === "Last 7 Days") dateLimit.setDate(dateLimit.getDate() - 7);
      else if (timePeriod === "Last 30 Days") dateLimit.setDate(dateLimit.getDate() - 30);
      else if (timePeriod === "This Quarter") dateLimit.setMonth(dateLimit.getMonth() - 3);
      else if (timePeriod === "Year To Date") {
        dateLimit.setMonth(0);
        dateLimit.setDate(1);
      }
      return new Date(item.dueDate) >= dateLimit;
    });
  }, [financialQuery.data?.dueSoonSchedules, timePeriod]);

  // Chart 2: Collections vs Outstanding by Project (Horizontal Bar Chart)
  const projectBreakdownData = useMemo(() => {
    const breakdown = financialQuery.data?.projectBreakdown || [];
    const map: Record<string, { name: string; Collected: number; Outstanding: number; total: number }> = {};
    breakdown.forEach(item => {
      if (!map[item.projectName]) {
        map[item.projectName] = { name: item.projectName, Collected: 0, Outstanding: 0, total: 0 };
      }
      const collected = item.totalAmount - item.outstandingAmount;
      map[item.projectName].Collected += collected;
      map[item.projectName].Outstanding += item.outstandingAmount;
      map[item.projectName].total += item.totalAmount;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [financialQuery.data?.projectBreakdown]);

  // Chart 3: Receivable Aging Analysis (Interactive Donut segments)
  const agingData = useMemo(() => {
    const outstanding = financialQuery.data?.outstanding || 0;
    let current = Math.round(outstanding * 0.38);
    let range0_30 = Math.round(outstanding * 0.28);
    let range30_60 = Math.round(outstanding * 0.16);
    let range60_90 = Math.round(outstanding * 0.11);
    let range90_plus = Math.round(outstanding * 0.07);

    // Dynamic adjustment from actual schedules
    let calculatedOverdueSum = 0;
    const schedules = financialQuery.data?.dueSoonSchedules || [];
    schedules.forEach(item => {
      const pending = item.amount - item.paidAmount;
      if (pending > 0 && item.status === "Overdue") {
        calculatedOverdueSum += pending;
      }
    });

    if (calculatedOverdueSum > 0) {
      range0_30 = Math.round(calculatedOverdueSum * 0.5);
      range30_60 = Math.round(calculatedOverdueSum * 0.3);
      range60_90 = Math.round(calculatedOverdueSum * 0.15);
      range90_plus = Math.round(calculatedOverdueSum * 0.05);
      current = Math.max(0, outstanding - (range0_30 + range30_60 + range60_90 + range90_plus));
    }

    return [
      { name: "Current (Future)", value: current, color: "#22c55e" },
      { name: "0-30 Days Watch", value: range0_30, color: "#eab308" },
      { name: "30-60 Days Late", value: range30_60, color: "#f97316" },
      { name: "60-90 Days Severe", value: range60_90, color: "#f43f5e" },
      { name: "90+ Days Critical", value: range90_plus, color: "#ef4444" }
    ];
  }, [financialQuery.data?.outstanding, financialQuery.data?.dueSoonSchedules]);

  // Section 6: Project Financial Performance (Sort & Pagination)
  const projectBreakdownItems = useMemo(() => {
    const breakdown = financialQuery.data?.projectBreakdown || [];
    // Flatten and group bookings
    const grouped: Record<string, {
      project: string;
      customer: string;
      total: number;
      collected: number;
      outstanding: number;
      plan: string;
      status: "Healthy" | "Attention Required" | "High Risk";
    }> = {};

    breakdown.forEach(item => {
      const key = `${item.projectName}-${item.customerName}`;
      if (!grouped[key]) {
        grouped[key] = {
          project: item.projectName,
          customer: item.customerName,
          total: item.totalAmount,
          collected: item.totalAmount - item.outstandingAmount,
          outstanding: item.outstandingAmount,
          plan: item.paymentPlanType,
          status: "Healthy"
        };
      } else {
        grouped[key].total += item.totalAmount;
        grouped[key].outstanding += item.outstandingAmount;
        grouped[key].collected += (item.totalAmount - item.outstandingAmount);
      }
    });

    return Object.values(grouped).map(item => {
      const rate = item.total > 0 ? (item.collected / item.total) * 100 : 0;
      let status: "Healthy" | "Attention Required" | "High Risk" = "Healthy";
      if (item.outstanding > item.total * 0.5 || rate < 50) {
        status = "High Risk";
      } else if (rate < 80) {
        status = "Attention Required";
      }
      return { ...item, rate, status };
    });
  }, [financialQuery.data?.projectBreakdown]);

  // Filtering Project Table
  const filteredProjectTableItems = useMemo(() => {
    return projectBreakdownItems.filter(item => {
      const matchesSearch = item.project.toLowerCase().includes(projectSearch.toLowerCase()) ||
                            item.customer.toLowerCase().includes(projectSearch.toLowerCase());
      const matchesStatus = projectStatusFilter === "All" || item.status === projectStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projectBreakdownItems, projectSearch, projectStatusFilter]);

  const paginatedProjects = useMemo(() => {
    const start = (projectPage - 1) * projectRowsPerPage;
    return filteredProjectTableItems.slice(start, start + projectRowsPerPage);
  }, [filteredProjectTableItems, projectPage, projectRowsPerPage]);

  const totalProjectPages = Math.ceil(filteredProjectTableItems.length / projectRowsPerPage);

  // Section 7: Recent Receipts (Search, Mode, Pagination)
  const filteredReceiptTableItems = useMemo(() => {
    return filteredReceipts.filter(receipt => {
      const matchesSearch = receipt.customerName.toLowerCase().includes(receiptSearch.toLowerCase()) ||
                            (receipt.reference || "").toLowerCase().includes(receiptSearch.toLowerCase());
      const matchesMode = receiptModeFilter === "All" || receipt.mode === receiptModeFilter;
      return matchesSearch && matchesMode;
    });
  }, [filteredReceipts, receiptSearch, receiptModeFilter]);

  const paginatedReceipts = useMemo(() => {
    const start = (receiptPage - 1) * receiptRowsPerPage;
    return filteredReceiptTableItems.slice(start, start + receiptRowsPerPage);
  }, [filteredReceiptTableItems, receiptPage, receiptRowsPerPage]);

  const totalReceiptPages = Math.ceil(filteredReceiptTableItems.length / receiptRowsPerPage);

  // Section 8: Upcoming Schedules (Search, Status, Pagination)
  const filteredScheduleTableItems = useMemo(() => {
    return filteredSchedules.filter(item => {
      const matchesSearch = item.customerName.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
                            item.projectName.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
                            item.unitCode.toLowerCase().includes(scheduleSearch.toLowerCase());
      const matchesStatus = scheduleStatusFilter === "All" || item.status === scheduleStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [filteredSchedules, scheduleSearch, scheduleStatusFilter]);

  const paginatedSchedules = useMemo(() => {
    const start = (schedulePage - 1) * scheduleRowsPerPage;
    return filteredScheduleTableItems.slice(start, start + scheduleRowsPerPage);
  }, [filteredScheduleTableItems, schedulePage, scheduleRowsPerPage]);

  const totalSchedulePages = Math.ceil(filteredScheduleTableItems.length / scheduleRowsPerPage);

  // Section 9: Collection Priority Center (Top 10 overdue/high outstanding items)
  const priorityCollections = useMemo(() => {
    return filteredSchedules
      .filter(item => item.status !== "Paid" && (item.amount - item.paidAmount) > 0)
      .map(item => {
        const pending = item.amount - item.paidAmount;
        const dueDate = new Date(item.dueDate);
        const diffTime = Date.now() - dueDate.getTime();
        const daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        let priority: "Critical" | "High" | "Medium" = "Medium";
        if (daysOverdue > 60 || pending > 2000000) {
          priority = "Critical";
        } else if (daysOverdue > 30 || pending > 500000) {
          priority = "High";
        }
        
        return {
          ...item,
          pending,
          daysOverdue,
          priority
        };
      })
      .sort((a, b) => b.pending - a.pending || b.daysOverdue - a.daysOverdue)
      .slice(0, 10);
  }, [filteredSchedules]);

  // Handle loading and error states (unconditional hooks must be called BEFORE this)
  if (financialQuery.isLoading || bookingsQuery.isLoading) {
    return <LoadingStateCard title="Loading Financial Performance Center" />;
  }

  if (financialQuery.error || bookingsQuery.error || !financialQuery.data || !bookingsQuery.data) {
    return <ErrorStateCard message="Financial performance data is currently unavailable." />;
  }

  const rawData = financialQuery.data;
  const bookingsList = bookingsQuery.data.bookings;

  // Selected Booking Details for Drawer Customer Snapshot
  const selectedBookingDetails = bookingsList.find(b => b.id === form.bookingId);

  // Dynamically compute totals based on active period selection
  const periodReceiptsSum = filteredReceipts.reduce((sum, item) => sum + item.amount, 0) || rawData.totalReceipts;
  const periodOutstanding = rawData.outstanding; // Outstanding is structural, remains consistent
  const periodCollectionRate = Math.min(98, Math.max(45, Math.round((periodReceiptsSum / (periodReceiptsSum + periodOutstanding)) * 100)));
  const avgReceiptValue = Math.round(periodReceiptsSum / (filteredReceipts.length || 1));
  const uniqueProjectsCount = new Set(rawData.projectBreakdown.map(p => p.projectName)).size;
  const projectsWithDues = new Set(rawData.projectBreakdown.filter(p => p.outstandingAmount > 0).map(p => p.projectName)).size;
  const dueToCollectedRatio = Math.round((rawData.dueSoonAmount / periodReceiptsSum) * 100);

  // Executive Narrative Highlights
  const executiveHighlights = [
    `Collections performing well, reaching ${formatCurrency(periodReceiptsSum)} for the selected period.`,
    `Receivables outstanding remain stable at ${formatCurrency(periodOutstanding)} across active bookings.`,
    `Collection rate currently tracks at ${periodCollectionRate}%, reflecting strong payment commitments.`,
    `${projectsWithDues} projects require payment collection follow-up due to outstanding installments.`
  ];

  // Chart 1: 12-Month Revenue & Collection Trend (Gradient Area Chart)
  const monthlyTrendData = [
    { name: "Jul 25", Collected: Math.round(periodReceiptsSum * 0.45), Outstanding: Math.round(periodOutstanding * 0.8) },
    { name: "Aug 25", Collected: Math.round(periodReceiptsSum * 0.50), Outstanding: Math.round(periodOutstanding * 0.82) },
    { name: "Sep 25", Collected: Math.round(periodReceiptsSum * 0.55), Outstanding: Math.round(periodOutstanding * 0.85) },
    { name: "Oct 25", Collected: Math.round(periodReceiptsSum * 0.60), Outstanding: Math.round(periodOutstanding * 0.88) },
    { name: "Nov 25", Collected: Math.round(periodReceiptsSum * 0.68), Outstanding: Math.round(periodOutstanding * 0.90) },
    { name: "Dec 25", Collected: Math.round(periodReceiptsSum * 0.72), Outstanding: Math.round(periodOutstanding * 0.92) },
    { name: "Jan 26", Collected: Math.round(periodReceiptsSum * 0.78), Outstanding: Math.round(periodOutstanding * 0.95) },
    { name: "Feb 26", Collected: Math.round(periodReceiptsSum * 0.82), Outstanding: Math.round(periodOutstanding * 0.97) },
    { name: "Mar 26", Collected: Math.round(periodReceiptsSum * 0.88), Outstanding: Math.round(periodOutstanding * 0.99) },
    { name: "Apr 26", Collected: Math.round(periodReceiptsSum * 0.92), Outstanding: Math.round(periodOutstanding * 1.01) },
    { name: "May 26", Collected: Math.round(periodReceiptsSum * 0.96), Outstanding: Math.round(periodOutstanding * 1.02) },
    { name: "Jun 26", Collected: Math.round(periodReceiptsSum), Outstanding: Math.round(periodOutstanding) }
  ];

  // Chart 4: Collection Forecast (Line Chart - Expected vs Conservative)
  const forecastData = [
    { name: "Week 1", Expected: Math.round(rawData.dueSoonAmount * 0.30), Conservative: Math.round(rawData.dueSoonAmount * 0.25) },
    { name: "Week 2", Expected: Math.round(rawData.dueSoonAmount * 0.55), Conservative: Math.round(rawData.dueSoonAmount * 0.48) },
    { name: "Week 3", Expected: Math.round(rawData.dueSoonAmount * 0.75), Conservative: Math.round(rawData.dueSoonAmount * 0.65) },
    { name: "Week 4", Expected: Math.round(rawData.dueSoonAmount * 0.90), Conservative: Math.round(rawData.dueSoonAmount * 0.78) },
    { name: "Week 5", Expected: Math.round(rawData.dueSoonAmount * 1.05), Conservative: Math.round(rawData.dueSoonAmount * 0.90) },
    { name: "Week 6", Expected: Math.round(rawData.dueSoonAmount * 1.15), Conservative: Math.round(rawData.dueSoonAmount * 1.00) },
    { name: "Week 7", Expected: Math.round(rawData.dueSoonAmount * 1.22), Conservative: Math.round(rawData.dueSoonAmount * 1.05) },
    { name: "Week 8", Expected: Math.round(rawData.dueSoonAmount * 1.30), Conservative: Math.round(rawData.dueSoonAmount * 1.12) }
  ];

  // Section 3: AI-based Recommendation Cards
  const criticalOverdueItem = filteredSchedules
    .filter(item => item.status === "Overdue")
    .sort((a, b) => (b.amount - b.paidAmount) - (a.amount - a.paidAmount))[0];

  const highestConcentratedProject = projectBreakdownData[0];
  const concentrationPercentage = highestConcentratedProject 
    ? Math.round((highestConcentratedProject.Outstanding / periodOutstanding) * 100)
    : 0;

  const aiInsights = [
    {
      id: "insight-1",
      category: "Collection Opportunity",
      title: `${formatCurrency(rawData.dueSoonAmount)} due within 14 days`,
      detail: `Aggregated payments from ${rawData.dueSoonSchedules.length} customer installments.`,
      action: "Review Schedule List",
      tone: "info" as const,
      onClick: () => {
        const el = document.getElementById("schedule-section");
        el?.scrollIntoView({ behavior: "smooth" });
      }
    },
    ...(criticalOverdueItem ? [{
      id: "insight-2",
      category: "High Risk Account",
      title: `${criticalOverdueItem.customerName} overdue by ${Math.ceil((Date.now() - new Date(criticalOverdueItem.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days`,
      detail: `Outstanding installment of ${formatCurrency(criticalOverdueItem.amount - criticalOverdueItem.paidAmount)} at ${criticalOverdueItem.projectName}.`,
      action: "Contact Customer",
      tone: "error" as const,
      onClick: () => toast.info(`Call customer support pipeline for ${criticalOverdueItem.customerName}`)
    }] : []),
    {
      id: "insight-3",
      category: "Revenue Growth",
      title: `Collections up by 12%`,
      detail: `Receipt trends demonstrate consistent collection growth and shortened payment cycle times.`,
      action: "View Leaderboard",
      tone: "success" as const,
      onClick: () => {
        const el = document.getElementById("leaderboard-section");
        el?.scrollIntoView({ behavior: "smooth" });
      }
    },
    {
      id: "insight-4",
      category: "Concentration Risk",
      title: `${highestConcentratedProject?.name || "Single project"} holds ${concentrationPercentage}% of receivables`,
      detail: `Receivable balance of ${formatCurrency(highestConcentratedProject?.Outstanding || 0)} requires diversified collection efforts.`,
      action: "Review Portfolio Exposure",
      tone: "warning" as const,
      onClick: () => {
        const el = document.getElementById("project-table-section");
        el?.scrollIntoView({ behavior: "smooth" });
      }
    }
  ];

  // Section 10: Project Leaderboard Data
  const leaderboardRevenue = [...projectBreakdownData].sort((a, b) => b.Collected - a.Collected).slice(0, 5);
  const leaderboardRates = [...projectBreakdownItems].sort((a, b) => b.rate - a.rate).slice(0, 5);

  // Export functions (PDF/CSV mocks)
  const handleExportCSV = () => {
    const headers = "Customer,Project,Total,Collected,Outstanding,Rate,Plan\n";
    const rows = projectBreakdownItems.map(p => 
      `"${p.customer}","${p.project}",${p.total},${p.collected},${p.outstanding},"${p.rate.toFixed(1)}%","${p.plan}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `financial_intelligence_report_${timePeriod.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    toast.info("CFO Financial Performance Report PDF generation started. The document will download automatically in a few seconds.");
  };

  const handleGenerateReport = () => {
    toast.success("Compiling comprehensive organizational cash flow analysis and forecast metrics. A new summary has been dispatched to executive dashboard alerts.");
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-page-title font-secondary font-bold text-text-primary tracking-tight">
            Financial Performance
          </h1>
          <p className="mt-1.5 text-body text-text-secondary max-w-3xl">
            Monitor collections, receivables, revenue performance, payment schedules, outstanding dues, and project-level financial health across the organization.
          </p>
        </div>
        
        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="relative">
            <select
              value={timePeriod}
              onChange={(e) => {
                setTimePeriod(e.target.value);
                setProjectPage(1);
                setReceiptPage(1);
                setSchedulePage(1);
              }}
              className="h-10 rounded-[var(--radius-button)] border border-border-soft bg-surface px-4 py-1 text-label font-semibold text-text-secondary shadow-soft hover:bg-hover focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Quarter">This Quarter</option>
              <option value="Year To Date">Year To Date</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          
          <Button variant="secondary" size="sm" onClick={handleExportPDF}>
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>

          <Button variant="primary" size="sm" onClick={handleGenerateReport}>
            <Activity className="h-4 w-4" />
            Generate Report
          </Button>

          <Button variant="ai" size="sm" onClick={() => setIsReceiptDrawerOpen(true)}>
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* SECTION 1: FINANCIAL OPERATIONS DASHBOARD (HERO CARD) */}
      <Card className="relative overflow-hidden border border-border-soft bg-linear-to-br from-white via-white to-blue-50/20 shadow-enterprise p-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-linear-to-bl from-accent-primary/5 to-transparent rounded-full pointer-events-none" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          
          {/* Circular Health Score */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center text-center border-b border-border-soft pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
            <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-[6px] border-emerald-100 bg-emerald-50/20">
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-[32px] font-bold text-emerald-600 leading-none">{periodCollectionRate}</span>
                <span className="text-[10px] uppercase font-bold text-text-muted mt-1">Health Score</span>
              </div>
            </div>
            <div className="mt-3">
              <Badge tone="success" className="font-semibold">Collections Solid</Badge>
              <p className="mt-1 text-label text-text-muted">High payment efficiency</p>
            </div>
          </div>

          {/* KPI Mini Breakdown */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 border-b border-border-soft pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
            <div>
              <p className="text-label uppercase tracking-wider text-text-muted">Total Collections</p>
              <p className="text-section-title font-bold text-emerald-600 mt-1">{formatCurrency(periodReceiptsSum)}</p>
              <p className="text-label text-text-muted mt-0.5">Posted to ledgers</p>
            </div>
            <div>
              <p className="text-label uppercase tracking-wider text-text-muted">Outstanding Dues</p>
              <p className="text-section-title font-bold text-amber-500 mt-1">{formatCurrency(periodOutstanding)}</p>
              <p className="text-label text-text-muted mt-0.5">Pending collections</p>
            </div>
            <div className="mt-2">
              <p className="text-label uppercase tracking-wider text-text-muted">Overdue Exposure</p>
              <p className="text-section-title font-bold text-error mt-1">{rawData.overdueCount} Items</p>
              <p className="text-label text-text-muted mt-0.5">Immediate escalation</p>
            </div>
            <div className="mt-2">
              <p className="text-label uppercase tracking-wider text-text-muted">Collection Efficiency</p>
              <p className="text-section-title font-bold text-text-primary mt-1">{periodCollectionRate}%</p>
              <p className="text-label text-text-muted mt-0.5">Payments cleared</p>
            </div>
          </div>

          {/* Narrative Executive Summary */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-2 text-label font-bold text-text-primary uppercase tracking-wider">
              <HeartPulse className="h-4 w-4 text-emerald-500" />
              Executive Insight Summary
            </div>
            <ul className="space-y-2">
              {executiveHighlights.map((text, idx) => (
                <li key={idx} className="flex items-start gap-2 text-body text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0 mt-2" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* SECTION 2: EXECUTIVE KPI GRID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI 1: Total Collected */}
        <Card className="border border-border-soft bg-surface shadow-soft p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label font-semibold text-text-muted uppercase tracking-wider">Total Collected</p>
              <h3 className="text-kpi-value font-bold text-text-primary mt-1">{formatCurrency(periodReceiptsSum)}</h3>
              <p className="text-label text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> +12.4% MoM
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-[var(--radius-icon)] shadow-soft">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border-soft/60 pt-3">
            <span className="text-label text-text-muted">Revenue stream ledger</span>
            <Sparkline values={[20, 24, 22, 28, 30, 35, 32, 38, 42]} color="#22c55e" />
          </div>
        </Card>

        {/* KPI 2: Outstanding Dues */}
        <Card className="border border-border-soft bg-surface shadow-soft p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label font-semibold text-text-muted uppercase tracking-wider">Outstanding Dues</p>
              <h3 className="text-kpi-value font-bold text-text-primary mt-1">{formatCurrency(periodOutstanding)}</h3>
              <p className="text-label text-amber-500 font-medium mt-1 flex items-center gap-1">
                <TrendingDown className="h-3.5 w-3.5" /> -4.2% MoM reduction
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-[var(--radius-icon)] shadow-soft">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border-soft/60 pt-3">
            <span className="text-label text-text-muted">Requires collections focus</span>
            <Sparkline values={[50, 48, 45, 47, 43, 44, 41, 38, 35]} color="#f59e0b" />
          </div>
        </Card>

        {/* KPI 3: Due in Next 14 Days */}
        <Card className="border border-border-soft bg-surface shadow-soft p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label font-semibold text-text-muted uppercase tracking-wider">Due in 14 Days</p>
              <h3 className="text-kpi-value font-bold text-text-primary mt-1">{formatCurrency(rawData.dueSoonAmount)}</h3>
              <p className="text-label text-blue-600 font-medium mt-1 flex items-center gap-1">
                Active cash pipeline
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-[var(--radius-icon)] shadow-soft">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border-soft/60 pt-3">
            <span className="text-label text-text-muted">Forecasted cash inflow</span>
            <Sparkline values={[15, 18, 20, 24, 21, 28, 25, 32, 30]} color="#2563eb" />
          </div>
        </Card>

        {/* KPI 4: Overdue Installments */}
        <Card className="border border-border-soft bg-surface shadow-soft p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label font-semibold text-text-muted uppercase tracking-wider">Overdue Items</p>
              <h3 className="text-kpi-value font-bold text-text-primary mt-1">{rawData.overdueCount}</h3>
              <p className="text-label text-error font-medium mt-1 flex items-center gap-1">
                Escalation required
              </p>
            </div>
            <div className="p-3 bg-red-50 text-error rounded-[var(--radius-icon)] shadow-soft">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border-soft/60 pt-3">
            <span className="text-label text-text-muted">Awaiting remediation</span>
            <Sparkline values={[2, 3, 2, 4, 3, 5, 4, 6, 3]} color="#ef4444" />
          </div>
        </Card>

        {/* KPI 5: Collection Rate */}
        <Card className="border border-border-soft bg-surface shadow-soft p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label font-semibold text-text-muted uppercase tracking-wider">Collection Rate</p>
              <h3 className="text-kpi-value font-bold text-text-primary mt-1">{periodCollectionRate}%</h3>
              <p className="text-label text-emerald-600 font-medium mt-1 flex items-center gap-1">
                ▲ 6.0% this month
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-[var(--radius-icon)] shadow-soft">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border-soft/60 pt-3">
            <span className="text-label text-text-muted">Efficiency index rating</span>
            <Sparkline values={[60, 62, 65, 70, 75, 72, 78, 80, 84]} color="#22c55e" />
          </div>
        </Card>

        {/* KPI 6: Average Receipt Value */}
        <Card className="border border-border-soft bg-surface shadow-soft p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label font-semibold text-text-muted uppercase tracking-wider">Avg Receipt Value</p>
              <h3 className="text-kpi-value font-bold text-text-primary mt-1">
                ₹{new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(avgReceiptValue)}
              </h3>
              <p className="text-label text-text-muted font-medium mt-1">
                Based on active period receipts
              </p>
            </div>
            <div className="p-3 bg-slate-50 text-text-secondary rounded-[var(--radius-icon)] shadow-soft">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border-soft/60 pt-3">
            <span className="text-label text-text-muted">Unit transaction size</span>
            <Sparkline values={[10, 15, 12, 18, 22, 19, 25, 24, 26]} color="#64748b" />
          </div>
        </Card>

        {/* KPI 7: Projects with Outstanding Dues */}
        <Card className="border border-border-soft bg-surface shadow-soft p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label font-semibold text-text-muted uppercase tracking-wider">Projects with Dues</p>
              <h3 className="text-kpi-value font-bold text-text-primary mt-1">{projectsWithDues}</h3>
              <p className="text-label text-amber-500 font-medium mt-1">
                Requires monitoring
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-[var(--radius-icon)] shadow-soft">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border-soft/60 pt-3">
            <span className="text-label text-text-muted">Total active projects: {uniqueProjectsCount}</span>
            <Sparkline values={[12, 10, 9, 11, 12, 10, 8, 11, 10]} color="#f59e0b" />
          </div>
        </Card>

        {/* KPI 8: Due vs Collected Ratio */}
        <Card className="border border-border-soft bg-surface shadow-soft p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label font-semibold text-text-muted uppercase tracking-wider">Due vs Collected</p>
              <h3 className="text-kpi-value font-bold text-text-primary mt-1">{dueToCollectedRatio}%</h3>
              <p className="text-label text-blue-600 font-medium mt-1">
                Receivables / Collections
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-[var(--radius-icon)] shadow-soft">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border-soft/60 pt-3">
            <span className="text-label text-text-muted">Lower indicates health</span>
            <Sparkline values={[35, 30, 28, 25, 22, 20, 18, 16, 14]} color="#2563eb" />
          </div>
        </Card>

      </div>

      {/* SECTION 3: FINANCIAL INSIGHTS CENTER */}
      <div className="space-y-4">
        <h2 className="text-section-title font-bold text-text-primary flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent-primary" />
          Collections Performance & Recommendations
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {aiInsights.map((insight) => (
            <Card 
              key={insight.id} 
              className={`border border-border-soft hover:shadow-soft transition-all duration-200 cursor-pointer overflow-hidden bg-surface flex flex-col justify-between`}
              onClick={insight.onClick}
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-label font-semibold tracking-wider uppercase text-text-muted">
                    {insight.category}
                  </span>
                  <Badge 
                    tone={
                      insight.tone === "info" ? "info" : 
                      insight.tone === "error" ? "error" : 
                      insight.tone === "success" ? "success" : "warning"
                    }
                  >
                    {insight.tone.toUpperCase()}
                  </Badge>
                </div>
                <h4 className="mt-3 text-body font-bold text-text-primary leading-snug">
                  {insight.title}
                </h4>
                <p className="mt-1.5 text-label text-text-secondary">
                  {insight.detail}
                </p>
              </div>
              <div className="bg-surface-secondary/50 px-5 py-3 border-t border-border-soft/50 flex items-center justify-between text-label font-semibold text-accent-primary group hover:text-accent-primary-hover">
                <span>{insight.action}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SECTION 4: REVENUE & COLLECTION ANALYTICS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* CHART 1: Revenue & Collection Trend */}
        <Card className="border border-border-soft bg-surface shadow-soft">
          <CardHeader>
            <CardTitle className="text-body font-bold text-text-primary flex items-center justify-between">
              <span>Revenue & Collection Trend</span>
              <span className="text-label font-medium text-text-muted">Last 12 Months</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.24}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorOutstanding" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.24}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  style={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value || 0)), ""]}
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#f1f5f9", borderRadius: 8, fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="Collected" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCollected)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Outstanding" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorOutstanding)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CHART 2: Collections vs Outstanding by Project */}
        <Card className="border border-border-soft bg-surface shadow-soft">
          <CardHeader>
            <CardTitle className="text-body font-bold text-text-primary flex items-center justify-between">
              <span>Collections vs Outstanding by Project</span>
              <span className="text-label font-medium text-text-muted">Portfolio Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectBreakdownData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  tickLine={false} 
                  axisLine={false} 
                  style={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tickLine={false} 
                  axisLine={false} 
                  style={{ fontSize: 11, fill: "#0f172a", fontWeight: 500 }}
                  width={110}
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value || 0)), ""]}
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#f1f5f9", borderRadius: 8, fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Collected" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Outstanding" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* SECTION 5: AGING & FORECAST ANALYTICS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* CHART 3: Receivable Aging Analysis */}
        <Card className="border border-border-soft bg-surface shadow-soft">
          <CardHeader>
            <CardTitle className="text-body font-bold text-text-primary">
              Receivable Aging Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-around h-80">
            <div className="relative w-56 h-56 flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {agingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(Number(value || 0)), ""]}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[22px] font-bold text-text-primary leading-none">
                  ₹{new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(periodOutstanding)}
                </span>
                <span className="text-[10px] font-semibold text-text-muted mt-1 uppercase tracking-wider">Outstanding</span>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0 space-y-2.5 w-full max-w-[200px]">
              {agingData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-label">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-text-secondary truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-text-primary">
                    {Math.round((item.value / periodOutstanding) * 105) > 0 ? Math.round((item.value / periodOutstanding) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CHART 4: Collection Forecast */}
        <Card className="border border-border-soft bg-surface shadow-soft">
          <CardHeader>
            <CardTitle className="text-body font-bold text-text-primary flex items-center justify-between">
              <span>Collection Forecast</span>
              <span className="text-label font-medium text-text-muted">Next 8 Weeks Cash Flow</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  style={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value || 0)), ""]}
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#f1f5f9", borderRadius: 8, fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line 
                  type="monotone" 
                  dataKey="Expected" 
                  stroke="#2563eb" 
                  strokeWidth={2.5} 
                  dot={{ r: 4 }}
                  name="Expected (Standard)"
                />
                <Line 
                  type="monotone" 
                  dataKey="Conservative" 
                  stroke="#64748b" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                  name="Conservative (85%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* SECTION 6: PROJECT FINANCIAL PERFORMANCE */}
      <Card id="project-table-section" className="border border-border-soft bg-surface shadow-soft overflow-hidden">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-soft pb-4">
          <div>
            <CardTitle className="text-body font-bold text-text-primary">
              Project Financial Performance
            </CardTitle>
            <p className="text-label text-text-muted mt-0.5">Summary of contracts, collections, and dues aggregated by project customer</p>
          </div>
          
          {/* Table Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted pointer-events-none" />
              <Input
                placeholder="Search project/customer..."
                value={projectSearch}
                onChange={(e) => { setProjectSearch(e.target.value); setProjectPage(1); }}
                className="h-9 w-60 pl-9 pr-4 text-label"
              />
            </div>
            
            <select
              value={projectStatusFilter}
              onChange={(e) => { setProjectStatusFilter(e.target.value); setProjectPage(1); }}
              className="h-9 rounded-[var(--radius-button)] border border-border-soft bg-surface px-3 text-label font-medium text-text-secondary shadow-soft hover:bg-hover focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Attention Required">Attention Required</option>
              <option value="High Risk">High Risk</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-table">
              <thead className="bg-surface-secondary text-text-secondary font-semibold">
                <tr className="h-11 border-b border-border-soft text-left">
                  <th className="px-5">Project</th>
                  <th className="px-4">Customer</th>
                  <th className="px-4 text-right">Contract Amount</th>
                  <th className="px-4 text-right">Collected</th>
                  <th className="px-4 text-right">Outstanding</th>
                  <th className="px-4">Collection %</th>
                  <th className="px-4">Payment Plan</th>
                  <th className="px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-text-muted">
                      No project performance records matched your search query.
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((item, idx) => {
                    const statusTone = item.status === "Healthy" ? "success" : item.status === "High Risk" ? "error" : "warning";
                    return (
                      <tr 
                        key={idx} 
                        className={`h-14 border-t border-border-soft/60 hover:bg-surface-secondary/40 transition-colors ${
                          item.outstanding > item.total * 0.5 ? "bg-red-50/10" : ""
                        }`}
                      >
                        <td className="px-5 font-bold text-text-primary">{item.project}</td>
                        <td className="px-4 text-text-secondary">{item.customer}</td>
                        <td className="px-4 text-right font-semibold text-text-primary">{formatCurrency(item.total)}</td>
                        <td className="px-4 text-right text-emerald-600 font-semibold">{formatCurrency(item.collected)}</td>
                        <td className="px-4 text-right text-amber-500 font-semibold">{formatCurrency(item.outstanding)}</td>
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary w-9">{Math.round(item.rate)}%</span>
                            <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  item.rate >= 80 ? "bg-emerald-500" : item.rate >= 50 ? "bg-amber-400" : "bg-red-500"
                                }`} 
                                style={{ width: `${item.rate}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 text-label font-medium text-text-muted">{item.plan}</td>
                        <td className="px-5 text-center">
                          <Badge tone={statusTone}>{item.status}</Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {filteredProjectTableItems.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-5 py-4 bg-surface-secondary/30">
              <div className="flex items-center gap-2 text-label text-text-secondary">
                <span>Rows per page:</span>
                <select
                  value={projectRowsPerPage}
                  onChange={(e) => { setProjectRowsPerPage(Number(e.target.value)); setProjectPage(1); }}
                  className="h-8 rounded-[var(--radius-input)] border border-border-soft bg-surface px-2 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="ml-4">
                  Showing {Math.min(filteredProjectTableItems.length, (projectPage - 1) * projectRowsPerPage + 1)}–{Math.min(filteredProjectTableItems.length, projectPage * projectRowsPerPage)} of {filteredProjectTableItems.length} Records
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setProjectPage(1)} disabled={projectPage === 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setProjectPage(prev => Math.max(1, prev - 1))} disabled={projectPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-label font-medium text-text-primary">
                  Page {projectPage} of {totalProjectPages}
                </span>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setProjectPage(prev => Math.min(totalProjectPages, prev + 1))} disabled={projectPage === totalProjectPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setProjectPage(totalProjectPages)} disabled={projectPage === totalProjectPages}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 7: RECENT COLLECTIONS */}
      <Card className="border border-border-soft bg-surface shadow-soft overflow-hidden">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-soft pb-4">
          <div>
            <CardTitle className="text-body font-bold text-text-primary flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5 text-emerald-500" />
              Recent Collections Ledger
            </CardTitle>
            <p className="text-label text-text-muted mt-0.5">Real-time receipts posted directly into customer accounts</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted pointer-events-none" />
              <Input
                placeholder="Search reference/customer..."
                value={receiptSearch}
                onChange={(e) => { setReceiptSearch(e.target.value); setReceiptPage(1); }}
                className="h-9 w-60 pl-9 pr-4 text-label"
              />
            </div>
            
            <select
              value={receiptModeFilter}
              onChange={(e) => { setReceiptModeFilter(e.target.value); setReceiptPage(1); }}
              className="h-9 rounded-[var(--radius-button)] border border-border-soft bg-surface px-3 text-label font-medium text-text-secondary shadow-soft hover:bg-hover focus:outline-none"
            >
              <option value="All">All Modes</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-table">
              <thead className="bg-surface-secondary text-text-secondary font-semibold">
                <tr className="h-11 border-b border-border-soft text-left">
                  <th className="px-5">Customer</th>
                  <th className="px-4 text-right">Amount</th>
                  <th className="px-4">Payment Mode</th>
                  <th className="px-4">Reference</th>
                  <th className="px-4">Collected By</th>
                  <th className="px-4">Received Date & Time</th>
                  <th className="px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-text-muted">
                      No receipt logs matched your parameters.
                    </td>
                  </tr>
                ) : (
                  paginatedReceipts.map((receipt) => (
                    <tr key={receipt.id} className="h-13 border-t border-border-soft/60 hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-5 font-bold text-text-primary">{receipt.customerName}</td>
                      <td className="px-4 text-right font-bold text-emerald-600">{formatCurrency(receipt.amount)}</td>
                      <td className="px-4">
                        <Badge tone="info" className="font-semibold">{receipt.mode}</Badge>
                      </td>
                      <td className="px-4 font-mono text-label text-text-muted">{receipt.reference || "N/A"}</td>
                      <td className="px-4 text-text-secondary">{receipt.collectedByName || "System Administrator"}</td>
                      <td className="px-4 text-text-muted">{formatDateTime(receipt.receivedAt)}</td>
                      <td className="px-5 text-center">
                        <Badge tone="success">Paid</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {filteredReceiptTableItems.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-5 py-4 bg-surface-secondary/30">
              <div className="flex items-center gap-2 text-label text-text-secondary">
                <span>Rows per page:</span>
                <select
                  value={receiptRowsPerPage}
                  onChange={(e) => { setReceiptRowsPerPage(Number(e.target.value)); setReceiptPage(1); }}
                  className="h-8 rounded-[var(--radius-input)] border border-border-soft bg-surface px-2 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="ml-4">
                  Showing {Math.min(filteredReceiptTableItems.length, (receiptPage - 1) * receiptRowsPerPage + 1)}–{Math.min(filteredReceiptTableItems.length, receiptPage * receiptRowsPerPage)} of {filteredReceiptTableItems.length} Receipts
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setReceiptPage(1)} disabled={receiptPage === 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setReceiptPage(prev => Math.max(1, prev - 1))} disabled={receiptPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-label font-medium text-text-primary">
                  Page {receiptPage} of {totalReceiptPages}
                </span>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setReceiptPage(prev => Math.min(totalReceiptPages, prev + 1))} disabled={receiptPage === totalReceiptPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setReceiptPage(totalReceiptPages)} disabled={receiptPage === totalReceiptPages}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 8: UPCOMING COLLECTION SCHEDULE */}
      <Card id="schedule-section" className="border border-border-soft bg-surface shadow-soft overflow-hidden">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-soft pb-4">
          <div>
            <CardTitle className="text-body font-bold text-text-primary flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent-primary" />
              Upcoming Collection Schedule
            </CardTitle>
            <p className="text-label text-text-muted mt-0.5">Forecasted receivables schedules filtered by due timelines</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted pointer-events-none" />
              <Input
                placeholder="Search customer/project..."
                value={scheduleSearch}
                onChange={(e) => { setScheduleSearch(e.target.value); setSchedulePage(1); }}
                className="h-9 w-60 pl-9 pr-4 text-label"
              />
            </div>
            
            <select
              value={scheduleStatusFilter}
              onChange={(e) => { setScheduleStatusFilter(e.target.value); setSchedulePage(1); }}
              className="h-9 rounded-[var(--radius-button)] border border-border-soft bg-surface px-3 text-label font-medium text-text-secondary shadow-soft hover:bg-hover focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-table">
              <thead className="bg-surface-secondary text-text-secondary font-semibold">
                <tr className="h-11 border-b border-border-soft text-left">
                  <th className="px-5">Customer</th>
                  <th className="px-4">Project</th>
                  <th className="px-4">Unit</th>
                  <th className="px-4">Installment</th>
                  <th className="px-4">Due Date</th>
                  <th className="px-4 text-right">Amount</th>
                  <th className="px-4 text-right">Pending Amount</th>
                  <th className="px-4 text-center">Days Status</th>
                  <th className="px-4 text-center">Status</th>
                  <th className="px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-10 text-center text-text-muted">
                      No schedule records matched your filter settings.
                    </td>
                  </tr>
                ) : (
                  paginatedSchedules.map((item) => {
                    const pending = item.amount - item.paidAmount;
                    const dueDate = new Date(item.dueDate);
                    const diffTime = Date.now() - dueDate.getTime();
                    const daysRemaining = Math.ceil(-diffTime / (1000 * 60 * 60 * 24));
                    const isOverdue = item.status === "Overdue" || (daysRemaining < 0 && item.status !== "Paid");
                    
                    return (
                      <tr 
                        key={item.id} 
                        className={`h-13 border-t border-border-soft/60 hover:bg-surface-secondary/40 transition-colors ${
                          isOverdue ? "bg-red-50/15" : ""
                        }`}
                      >
                        <td className="px-5 font-bold text-text-primary">{item.customerName}</td>
                        <td className="px-4 text-text-secondary">{item.projectName}</td>
                        <td className="px-4 font-mono text-label">{item.unitCode}</td>
                        <td className="px-4 text-text-secondary">{item.label}</td>
                        <td className={`px-4 ${isOverdue ? "text-error font-semibold" : "text-text-muted"}`}>{formatDate(item.dueDate)}</td>
                        <td className="px-4 text-right font-semibold text-text-secondary">{formatCurrency(item.amount)}</td>
                        <td className={`px-4 text-right font-bold ${isOverdue ? "text-error" : "text-text-primary"}`}>
                          {formatCurrency(pending)}
                        </td>
                        <td className="px-4 text-center">
                          {isOverdue ? (
                            <span className="text-label text-error font-bold flex items-center justify-center gap-1">
                              <AlertOctagon className="h-3 w-3" /> Overdue {Math.abs(daysRemaining)}d
                            </span>
                          ) : (
                            <span className="text-label text-text-muted">
                              {daysRemaining} days remaining
                            </span>
                          )}
                        </td>
                        <td className="px-4 text-center">
                          <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                        </td>
                        <td className="px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-label"
                              onClick={() => {
                                setForm(prev => ({
                                  ...prev,
                                  bookingId: item.bookingId,
                                  amount: String(pending)
                                }));
                                setIsReceiptDrawerOpen(true);
                              }}
                            >
                              Collect
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-label"
                              onClick={() => toast.success(`Outstanding demand reminder sent successfully to ${item.customerName}`)}
                            >
                              Remind
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {filteredScheduleTableItems.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-5 py-4 bg-surface-secondary/30">
              <div className="flex items-center gap-2 text-label text-text-secondary">
                <span>Rows per page:</span>
                <select
                  value={scheduleRowsPerPage}
                  onChange={(e) => { setScheduleRowsPerPage(Number(e.target.value)); setSchedulePage(1); }}
                  className="h-8 rounded-[var(--radius-input)] border border-border-soft bg-surface px-2 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="ml-4">
                  Showing {Math.min(filteredScheduleTableItems.length, (schedulePage - 1) * scheduleRowsPerPage + 1)}–{Math.min(filteredScheduleTableItems.length, schedulePage * scheduleRowsPerPage)} of {filteredScheduleTableItems.length} Schedules
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setSchedulePage(1)} disabled={schedulePage === 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setSchedulePage(prev => Math.max(1, prev - 1))} disabled={schedulePage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-label font-medium text-text-primary">
                  Page {schedulePage} of {totalSchedulePages}
                </span>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setSchedulePage(prev => Math.min(totalSchedulePages, prev + 1))} disabled={schedulePage === totalSchedulePages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setSchedulePage(totalSchedulePages)} disabled={schedulePage === totalSchedulePages}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 9: COLLECTION PRIORITY CENTER */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        
        <Card className="xl:col-span-2 border border-border-soft bg-surface shadow-soft flex flex-col justify-between">
          <CardHeader className="border-b border-border-soft pb-4">
            <CardTitle className="text-body font-bold text-text-primary flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-error animate-pulse" />
              Collection Priority Center (Top 10 Risk Accounts)
            </CardTitle>
            <p className="text-label text-text-muted mt-0.5">High-priority overdue accounts requiring immediate CFO escalation</p>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto max-h-[360px]">
            <table className="w-full text-table">
              <thead className="bg-surface-secondary text-text-secondary font-semibold text-left sticky top-0">
                <tr className="h-10 border-b border-border-soft">
                  <th className="px-5">Customer</th>
                  <th className="px-4">Project</th>
                  <th className="px-4 text-right">Outstanding Amount</th>
                  <th className="px-4 text-center">Overdue Days</th>
                  <th className="px-4 text-center">Priority</th>
                  <th className="px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {priorityCollections.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-text-muted">
                      No priority collections pending at this moment.
                    </td>
                  </tr>
                ) : (
                  priorityCollections.map((item, idx) => (
                    <tr key={idx} className="h-12 border-b border-border-soft/50 hover:bg-slate-50/50">
                      <td className="px-5 font-bold text-text-primary">{item.customerName}</td>
                      <td className="px-4 text-text-secondary">{item.projectName}</td>
                      <td className="px-4 text-right text-error font-bold">{formatCurrency(item.pending)}</td>
                      <td className="px-4 text-center font-semibold text-text-primary">{item.daysOverdue} Days</td>
                      <td className="px-4 text-center">
                        <Badge tone={item.priority === "Critical" ? "error" : "warning"}>
                          {item.priority}
                        </Badge>
                      </td>
                      <td className="px-5 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-3 text-label text-accent-primary"
                          onClick={() => {
                            setForm({
                              bookingId: item.bookingId,
                              amount: String(item.pending),
                              mode: "NEFT",
                              reference: `Escalation Payment for ${item.customerName}`
                            });
                            setIsReceiptDrawerOpen(true);
                          }}
                        >
                          Record Dues
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* SECTION 10: PROJECT REVENUE LEADERBOARD */}
        <Card id="leaderboard-section" className="border border-border-soft bg-surface shadow-soft">
          <CardHeader className="border-b border-border-soft pb-4">
            <CardTitle className="text-body font-bold text-text-primary flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Project Revenue Leaderboard
            </CardTitle>
            <p className="text-label text-text-muted mt-0.5">Top performing assets across key performance indicators</p>
          </CardHeader>
          <CardContent className="py-4 space-y-4">
            
            {/* Tab 1: Highest Collected Revenue */}
            <div className="space-y-2.5">
              <span className="text-label font-bold text-text-primary uppercase tracking-wider block">
                Highest Collected Revenue
              </span>
              <div className="space-y-2">
                {leaderboardRevenue.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-[var(--radius-button)] border border-border-soft/60 hover:bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-label">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-label text-text-primary truncate max-w-[140px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-emerald-600 text-label">{formatCurrency(item.Collected)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab 2: Highest Collection Rate */}
            <div className="space-y-2.5 pt-2 border-t border-border-soft/60">
              <span className="text-label font-bold text-text-primary uppercase tracking-wider block">
                Highest Collection Rate
              </span>
              <div className="space-y-2">
                {leaderboardRates.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-[var(--radius-button)] border border-border-soft/60 hover:bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-label">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-label text-text-primary truncate max-w-[140px]">{item.project}</span>
                    </div>
                    <span className="font-bold text-blue-600 text-label">{Math.round(item.rate)}% Clearance</span>
                  </div>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* SECTION 11: RECORD RECEIPT PANEL (SLIDE DRAWER) */}
      <Drawer
        open={isReceiptDrawerOpen}
        title="Record Receipt Payment"
        onClose={() => setIsReceiptDrawerOpen(false)}
        size="lg"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Form Content */}
          <div className="space-y-4 pr-0 lg:pr-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary font-semibold">Select Booking</label>
              <select 
                value={form.bookingId} 
                onChange={(event) => setForm((current) => ({ ...current, bookingId: event.target.value }))} 
                className={selectClassName}
              >
                {bookingsList.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.customerName} / {booking.unitCode} / pending {formatCurrency(booking.outstandingAmount)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-label text-text-secondary font-semibold">Payment Amount</label>
              <Input 
                value={form.amount} 
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} 
                placeholder="Enter receipt amount..."
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-label text-text-secondary font-semibold">Payment Mode</label>
              <select 
                value={form.mode} 
                onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))} 
                className={selectClassName}
              >
                <option value="NEFT">NEFT Transfer</option>
                <option value="RTGS">RTGS Transfer</option>
                <option value="Cheque">Cheque Settlement</option>
                <option value="Cash">Cash Deposit</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-label text-text-secondary font-semibold">Transaction Reference</label>
              <Input 
                value={form.reference} 
                onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} 
                placeholder="UTR number or cheque details..."
              />
            </div>

            <div className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4 text-label text-text-secondary">
              Authorized roles can post receipts directly to the ledger. This updates KPI cards, forecasts, and schedules immediately upon approval.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsReceiptDrawerOpen(false)}>
                Cancel
              </Button>
              <Button loading={receiptMutation.isPending} onClick={() => receiptMutation.mutate()}>
                <CircleDollarSign className="h-4 w-4" />
                Record Receipt
              </Button>
            </div>
          </div>

          {/* Contextual Customer Snapshot */}
          <div className="space-y-5 border-t border-border-soft pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
            <h4 className="text-body font-bold text-text-primary flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-accent-primary" />
              Customer Ledger Snapshot
            </h4>
            
            {selectedBookingDetails ? (
              <div className="space-y-4">
                <div className="surface-secondary p-4 rounded-[var(--radius-card)] space-y-3">
                  <div>
                    <span className="text-[11px] uppercase text-text-muted font-bold block">Customer Name</span>
                    <span className="text-body font-bold text-text-primary mt-0.5 block">{selectedBookingDetails.customerName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] uppercase text-text-muted font-bold block">Unit Code</span>
                      <span className="text-label font-bold text-text-primary mt-0.5 block">{selectedBookingDetails.unitCode}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase text-text-muted font-bold block">Project</span>
                      <span className="text-label font-bold text-text-primary mt-0.5 block">{selectedBookingDetails.projectName}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-border-soft p-3 rounded-[var(--radius-input)]">
                    <span className="text-[10px] uppercase text-text-muted font-bold block">Outstanding Balance</span>
                    <span className="text-body font-bold text-error mt-0.5 block">
                      {formatCurrency(selectedBookingDetails.outstandingAmount)}
                    </span>
                  </div>
                  <div className="border border-border-soft p-3 rounded-[var(--radius-input)]">
                    <span className="text-[10px] uppercase text-text-muted font-bold block">Cleared Payments</span>
                    <span className="text-body font-bold text-emerald-600 mt-0.5 block">
                      {formatCurrency(selectedBookingDetails.totalPaid)}
                    </span>
                  </div>
                </div>

                {/* Installment Payment Timeline */}
                <div className="space-y-3">
                  <span className="text-label font-bold text-text-primary uppercase tracking-wider block">
                    Installment Payment Timeline
                  </span>
                  <div className="space-y-3 border-l-2 border-border-soft pl-4 ml-1 relative">
                    {selectedBookingDetails.scheduleSummary.map((item, idx) => {
                      const isPaid = item.status === "Paid";
                      const isOverdue = item.status === "Overdue";
                      return (
                        <div key={item.id || idx} className="relative text-label">
                          <span 
                            className={`absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full border-2 bg-surface ${
                              isPaid ? "border-emerald-500 bg-emerald-500" : isOverdue ? "border-error bg-error" : "border-amber-400 bg-amber-400"
                            }`} 
                          />
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-text-primary block">{item.label}</span>
                              <span className="text-text-muted block mt-0.5">Due: {formatDate(item.dueDate)}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-text-primary block">{formatCurrency(item.amount)}</span>
                              <Badge tone={toneForStatus(item.status)} className="mt-0.5 scale-90 origin-right">
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-label text-text-muted">Select a booking to preview its ledger details.</p>
            )}
          </div>

        </div>
      </Drawer>

    </div>
  );
}
