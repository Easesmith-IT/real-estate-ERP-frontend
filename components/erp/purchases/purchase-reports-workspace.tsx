"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatCurrency, formatDate, toneForStatus } from "@/lib/erp-utils";
import type {
  PurchaseRequestsResponse,
  QuotationsResponse,
  PurchaseOrder,
  PurchaseOrdersResponse,
  VendorsResponse,
} from "@/lib/erp-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EnterprisePageLoader } from "@/components/ui/loaders";
import { SectionHeader } from "@/components/erp/page-primitives";
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
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  ComposedChart,
  Line,
  LineChart,
} from "recharts";

const chartPalette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  slate: "#64748b",
  indigo: "#6366f1",
  violet: "#8b5cf6",
};

const donutColors = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#6366f1"];

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] transition-all";

// Sparkline using Recharts
function Sparkline({ values, color = "#2563eb" }: { values: number[]; color?: string }) {
  const data = values.map((value, index) => ({ index, value }));
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            fill={`url(#spark-${color.replace("#", "")})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Metric Card with Tooltip and Sparkline
function PremiumMetricCard({
  label,
  value,
  trend,
  trendType = "up",
  sparkline = [30, 40, 35, 50, 48, 60],
  insight,
  tooltip,
  color = "#2563eb",
}: {
  label: string;
  value: string | number;
  trend: string;
  trendType?: "up" | "down" | "neutral";
  sparkline?: number[];
  insight: string;
  tooltip: string;
  color?: string;
}) {
  const isUp = trendType === "up";
  const isDown = trendType === "down";

  return (
    <Card className="relative overflow-hidden border border-border-soft bg-surface transition-all duration-200 hover:shadow-soft group select-none">
      <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
          <div className="relative group/tooltip cursor-pointer text-text-muted hover:text-text-primary">
            <Info className="h-4 w-4" />
            <div className="absolute right-0 top-6 hidden group-hover/tooltip:block z-50 w-56 p-3 text-xs bg-text-primary text-surface rounded-xl shadow-enterprise border border-border-soft leading-relaxed transition-all">
              {tooltip}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight text-text-primary leading-none">
            {value}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold ${
                isUp
                  ? "bg-success/10 text-success"
                  : isDown
                  ? "bg-error/10 text-error"
                  : "bg-text-muted/10 text-text-muted"
              }`}
            >
              {isUp ? "↑" : isDown ? "↓" : "•"} {trend}
            </span>
            <span className="text-xs text-text-muted truncate">{insight}</span>
          </div>
        </div>

        {sparkline && sparkline.length > 0 && (
          <div className="h-9 w-full mt-1">
            <Sparkline values={sparkline} color={color} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helpers for date filtering
const isWithinDateRange = (dateStr: string, range: string) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();

  if (range === "This Month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  if (range === "This Quarter") {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const dateQuarter = Math.floor(date.getMonth() / 3);
    return currentQuarter === dateQuarter && date.getFullYear() === now.getFullYear();
  }
  if (range === "This Year") {
    return date.getFullYear() === now.getFullYear();
  }
  if (range === "Last 12 Months") {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(now.getMonth() - 12);
    return date >= twelveMonthsAgo;
  }
  return true; // All Time
};

export function PurchaseReportsWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Tabs: Overview, Spend Analysis, Vendor Performance, Procurement Pipeline, Category Analytics
  const [activeTab, setActiveTab] = useState<
    "overview" | "spend" | "vendors" | "pipeline" | "category"
  >("overview");

  // Global filters
  const [selectedDateRange, setSelectedDateRange] = useState<string>("All Time");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Queries
  const requestsQuery = useQuery({
    queryKey: ["erp-purchase-requests", role],
    queryFn: async () =>
      (await apiRequest<PurchaseRequestsResponse>("/api/procurement/requests", { role })).data,
  });
  const quotationsQuery = useQuery({
    queryKey: ["erp-quotations", role],
    queryFn: async () =>
      (await apiRequest<QuotationsResponse>("/api/procurement/quotations", { role })).data,
  });
  const ordersQuery = useQuery({
    queryKey: ["erp-purchase-orders", role],
    queryFn: async () =>
      (await apiRequest<PurchaseOrdersResponse>("/api/procurement/purchase-orders", { role })).data,
  });
  const vendorsQuery = useQuery({
    queryKey: ["erp-vendors", role],
    queryFn: async () =>
      (await apiRequest<VendorsResponse>("/api/procurement/vendors", { role })).data,
  });

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["erp-purchase-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-quotations"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-purchase-orders"] }),
      queryClient.invalidateQueries({ queryKey: ["erp-vendors"] }),
    ]);
  };

  const handlePrint = () => {
    window.print();
  };

  // Unique list of options from unfiltered queries for filter menus
  const projectOptions = useMemo(() => {
    if (!ordersQuery.data) return [];
    const names = new Set(ordersQuery.data.purchaseOrders.map((o) => o.projectName));
    if (requestsQuery.data) {
      requestsQuery.data.requests.forEach((r) => names.add(r.projectName));
    }
    return Array.from(names).filter(Boolean).sort();
  }, [ordersQuery.data, requestsQuery.data]);

  const vendorOptions = useMemo(() => {
    if (!vendorsQuery.data) return [];
    return vendorsQuery.data.vendors.map((v) => ({ id: v.id, name: v.name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [vendorsQuery.data]);

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    if (requestsQuery.data) {
      requestsQuery.data.requests.forEach((r) => r.materialCategory && categories.add(r.materialCategory));
    }
    if (ordersQuery.data) {
      ordersQuery.data.purchaseOrders.forEach((o) => {
        if (o.lineItems) {
          o.lineItems.forEach((li) => li.category && categories.add(li.category));
        }
      });
    }
    return Array.from(categories).filter(Boolean).sort();
  }, [requestsQuery.data, ordersQuery.data]);

  // Request to Category lookup helper
  const requestCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (requestsQuery.data) {
      requestsQuery.data.requests.forEach((r) => {
        map[r.id] = r.materialCategory;
      });
    }
    return map;
  }, [requestsQuery.data]);

  // Apply global filters to all dataset elements
  const filteredRequests = useMemo(() => {
    if (!requestsQuery.data) return [];
    return requestsQuery.data.requests.filter((r) => {
      if (!isWithinDateRange(r.createdAt, selectedDateRange)) return false;
      if (selectedProject && r.projectName !== selectedProject) return false;
      if (selectedCategory && r.materialCategory !== selectedCategory) return false;
      return true;
    });
  }, [requestsQuery.data, selectedDateRange, selectedProject, selectedCategory]);

  const filteredOrders = useMemo(() => {
    if (!ordersQuery.data) return [];
    return ordersQuery.data.purchaseOrders.filter((o) => {
      if (!isWithinDateRange(o.createdAt, selectedDateRange)) return false;
      if (selectedProject && o.projectName !== selectedProject) return false;
      if (selectedVendor && o.vendorId !== selectedVendor) return false;

      // Filter by Category
      if (selectedCategory) {
        const hasCatInLine = o.lineItems?.some((li) => li.category === selectedCategory);
        const requestCat = requestCategoryMap[o.requestId];
        if (!hasCatInLine && requestCat !== selectedCategory) return false;
      }
      return true;
    });
  }, [ordersQuery.data, selectedDateRange, selectedProject, selectedVendor, selectedCategory, requestCategoryMap]);

  const filteredQuotations = useMemo(() => {
    if (!quotationsQuery.data) return [];
    return quotationsQuery.data.quotations.filter((q) => {
      if (!isWithinDateRange(q.submittedAt || q.createdAt || "", selectedDateRange)) return false;
      if (selectedVendor && q.vendorId !== selectedVendor) return false;

      const matchedRequest = requestsQuery.data?.requests.find((r) => r.id === q.requestId);
      if (selectedProject && matchedRequest?.projectName !== selectedProject) return false;
      if (selectedCategory && matchedRequest?.materialCategory !== selectedCategory) return false;
      return true;
    });
  }, [quotationsQuery.data, requestsQuery.data, selectedDateRange, selectedProject, selectedVendor, selectedCategory]);

  const filteredVendors = useMemo(() => {
    if (!vendorsQuery.data) return [];
    return vendorsQuery.data.vendors.filter((v) => {
      if (selectedVendor && v.id !== selectedVendor) return false;
      if (selectedCategory && v.category !== selectedCategory) return false;
      return true;
    });
  }, [vendorsQuery.data, selectedVendor, selectedCategory]);

  // ----------------------------------------------------
  // KPI Calculations
  // ----------------------------------------------------
  const kpis = useMemo(() => {
    const totalReq = filteredRequests.length;
    const totalPO = filteredOrders.length;
    const commSpend = filteredOrders.reduce((sum, o) => sum + o.amount, 0);

    // PO Release Rate: (Requests that are ordered or completed / Total requests) * 100
    const orderedReqs = new Set(filteredOrders.map((o) => o.requestId));
    const releaseRate = totalReq > 0 ? Math.round((orderedReqs.size / totalReq) * 100) : 0;

    // Averages
    const avgReliability =
      filteredVendors.length > 0
        ? Math.round(filteredVendors.reduce((sum, v) => sum + v.reliabilityScore, 0) / filteredVendors.length)
        : 0;

    const avgQuoteQuality =
      filteredQuotations.length > 0
        ? Math.round(filteredQuotations.reduce((sum, q) => sum + (q.qualityScore || 0), 0) / filteredQuotations.length)
        : 0;

    const avgLeadTime =
      filteredVendors.length > 0
        ? parseFloat((filteredVendors.reduce((sum, v) => sum + v.averageLeadTimeDays, 0) / filteredVendors.length).toFixed(1))
        : 0;

    const activeVend = filteredVendors.filter((v) => v.status === "Active").length;

    return {
      totalRequests: totalReq,
      totalPOs: totalPO,
      committedSpend: commSpend,
      releaseRate,
      vendorReliability: avgReliability,
      quoteQuality: avgQuoteQuality,
      leadTime: avgLeadTime,
      activeVendors: activeVend,
    };
  }, [filteredRequests, filteredOrders, filteredVendors, filteredQuotations]);

  // Loading / Error Checking
  if (
    requestsQuery.isLoading ||
    quotationsQuery.isLoading ||
    ordersQuery.isLoading ||
    vendorsQuery.isLoading
  ) {
    return <EnterprisePageLoader title="Loading Purchase Reports Command Center" variant="dashboard" />;
  }

  if (
    requestsQuery.error ||
    quotationsQuery.error ||
    ordersQuery.error ||
    vendorsQuery.error
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-border-soft rounded-2xl bg-surface p-12 text-center">
        <Info className="h-12 w-12 text-error mb-4" />
        <h3 className="text-lg font-bold text-text-primary">Reports Load Failed</h3>
        <p className="text-text-muted mt-2 max-w-md">
          Procurement metrics could not be parsed. Please check database connectivity or permissions.
        </p>
      </div>
    );
  }

  // ----------------------------------------------------
  // TABLE DATAS (MEMOIZED)
  // ----------------------------------------------------

  // Overview project list
  const overviewTableData = Object.values(
    filteredOrders.reduce<Record<string, any>>((acc, o) => {
      if (!acc[o.projectId]) {
        acc[o.projectId] = {
          projectId: o.projectId,
          projectName: o.projectName,
          requests: 0,
          quotes: 0,
          pos: 0,
          spend: 0,
          vendorsSet: new Set<string>(),
          complianceSum: 0,
        };
      }
      acc[o.projectId].pos += 1;
      acc[o.projectId].spend += o.amount;
      acc[o.projectId].vendorsSet.add(o.vendorId);
      
      const vObj = vendorsQuery.data?.vendors.find((v) => v.id === o.vendorId);
      if (vObj) acc[o.projectId].complianceSum += vObj.reliabilityScore;

      return acc;
    }, {})
  ).map((p: any) => {
    // Add requests and quotes for this project
    const reqs = filteredRequests.filter((r) => r.projectId === p.projectId);
    p.requests = reqs.length;
    p.quotes = filteredQuotations.filter((q) => reqs.some((r) => r.id === q.requestId)).length;
    p.vendors = p.vendorsSet.size;
    p.avgPo = p.pos > 0 ? Math.round(p.spend / p.pos) : 0;
    p.compliance = p.vendors > 0 ? Math.round(p.complianceSum / p.vendors) : 0;
    return p;
  });

  // Spend list
  const totalSpendAmt = filteredOrders.reduce((sum, o) => sum + o.amount, 0) || 1;
  const spendTableData = filteredOrders.map((o) => {
    const reqCat = requestCategoryMap[o.requestId] || "Other";
    const orderCat = o.lineItems?.[0]?.category || reqCat;
    return {
      id: o.id,
      projectId: o.projectId,
      projectName: o.projectName,
      vendorId: o.vendorId,
      vendorName: o.vendorName,
      category: orderCat,
      amount: o.amount,
      percent: parseFloat(((o.amount / totalSpendAmt) * 100).toFixed(2)),
      status: o.status,
      date: formatDate(o.createdAt),
    };
  });

  // Vendor list
  const vendorTableData = filteredVendors.map((v) => {
    const vOrders = filteredOrders.filter((o) => o.vendorId === v.id);
    const vQuotes = filteredQuotations.filter((q) => q.vendorId === v.id);
    const wonQuotes = vQuotes.filter((q) => q.status === "Approved" || q.status === "Closed" || vOrders.some((o) => o.requestId === q.requestId));
    const winRate = vQuotes.length > 0 ? Math.round((wonQuotes.length / vQuotes.length) * 100) : 0;
    
    // Deterministic quote quality score (falls back to vendor profile score)
    const quoteQuality = vQuotes.length > 0
      ? Math.round(vQuotes.reduce((sum, q) => sum + (q.qualityScore || 0), 0) / vQuotes.length)
      : v.reliabilityScore - 2;

    return {
      id: v.id,
      name: v.name,
      category: v.category,
      status: v.status,
      reliability: v.reliabilityScore,
      leadTime: v.averageLeadTimeDays,
      orders: vOrders.length,
      spend: vOrders.reduce((sum, o) => sum + o.amount, 0),
      lastOrder: v.lastOrderDate ? formatDate(v.lastOrderDate) : "None",
      quality: quoteQuality,
      winRate,
    };
  });

  // Pipeline list
  const pipelineTableData = filteredRequests.map((r) => {
    const reqQuotes = filteredQuotations.filter((q) => q.requestId === r.id);
    const minQuote = reqQuotes.length > 0 ? Math.min(...reqQuotes.map((q) => q.totalAmount)) : 0;
    const order = filteredOrders.find((o) => o.requestId === r.id);

    // Days open calculator
    const daysOpen = Math.max(1, Math.round((new Date().getTime() - new Date(r.createdAt).getTime()) / (1000 * 3600 * 24)));

    return {
      id: r.id,
      title: r.title,
      projectName: r.projectName,
      category: r.materialCategory,
      priority: r.priority,
      status: r.status,
      daysOpen,
      quotesCount: reqQuotes.length,
      lowestQuote: minQuote,
      poValue: order ? order.amount : 0,
    };
  });

  // Category list
  const categoryTableData = Object.values(
    filteredOrders.reduce<Record<string, any>>((acc, o) => {
      const matchedReq = requestsQuery.data?.requests.find((r) => r.id === o.requestId);
      const cat = o.lineItems?.[0]?.category || matchedReq?.materialCategory || "Other";
      if (!acc[cat]) {
        acc[cat] = {
          category: cat,
          spend: 0,
          qty: 0,
          orders: 0,
          vendorsSet: new Set<string>(),
          leadTimeSum: 0,
        };
      }
      acc[cat].spend += o.amount;
      acc[cat].orders += 1;
      acc[cat].vendorsSet.add(o.vendorId);
      
      const vObj = vendorsQuery.data?.vendors.find((v) => v.id === o.vendorId);
      if (vObj) acc[cat].leadTimeSum += vObj.averageLeadTimeDays;

      if (o.lineItems) {
        acc[cat].qty += o.lineItems.reduce((sum, li) => sum + li.quantity, 0);
      } else {
        acc[cat].qty += 100; // Mock base quantity
      }

      return acc;
    }, {})
  ).map((c: any) => {
    c.share = parseFloat(((c.spend / totalSpendAmt) * 100).toFixed(2));
    c.vendors = c.vendorsSet.size;
    c.avgPrice = c.qty > 0 ? Math.round(c.spend / c.qty) : 0;
    c.leadTime = c.vendors > 0 ? parseFloat((c.leadTimeSum / c.vendors).toFixed(1)) : 0;
    return c;
  });

  // Filter chips removal
  const activeChips = [
    selectedDateRange !== "All Time" && { type: "date", label: `Range: ${selectedDateRange}`, clear: () => setSelectedDateRange("All Time") },
    selectedProject && { type: "project", label: `Project: ${selectedProject}`, clear: () => setSelectedProject("") },
    selectedVendor && { type: "vendor", label: `Vendor: ${vendorOptions.find((v) => v.id === selectedVendor)?.name || selectedVendor}`, clear: () => setSelectedVendor("") },
    selectedCategory && { type: "category", label: `Category: ${selectedCategory}`, clear: () => setSelectedCategory("") },
  ].filter(Boolean) as Array<{ type: string; label: string; clear: () => void }>;

  const clearAllFilters = () => {
    setSelectedDateRange("All Time");
    setSelectedProject("");
    setSelectedVendor("");
    setSelectedCategory("");
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    let csvContent = "";
    let fileName = `purchase_report_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`;

    if (activeTab === "overview") {
      csvContent += "PROJECT SUMMARY REPORT\n";
      csvContent += "Project,Requests,Quotations,Purchase Orders,Committed Spend,Avg PO Value,Vendors Engaged,Delivery Compliance (%)\n";
      overviewTableData.forEach((row) => {
        csvContent += `"${row.projectName}",${row.requests},${row.quotes},${row.pos},${row.spend},${row.avgPo},${row.vendors},${row.compliance}\n`;
      });
    } else if (activeTab === "spend") {
      csvContent += "SPEND REGISTER REPORT\n";
      csvContent += "PO ID,Project,Vendor,Category,Amount,Percent of Spend,Status,Date\n";
      spendTableData.forEach((row) => {
        csvContent += `"${row.id}","${row.projectName}","${row.vendorName}","${row.category}",${row.amount},${row.percent},"${row.status}","${row.date}"\n`;
      });
    } else if (activeTab === "vendors") {
      csvContent += "VENDOR PERFORMANCE SCORECARD\n";
      csvContent += "Vendor,Category,Status,Reliability,Lead Time (Days),Orders,Spend,Last Order,Quote Quality,Win Rate (%)\n";
      vendorTableData.forEach((row) => {
        csvContent += `"${row.name}","${row.category}","${row.status}",${row.reliability},${row.leadTime},${row.orders},${row.spend},"${row.lastOrder}",${row.quality},${row.winRate}\n`;
      });
    } else if (activeTab === "pipeline") {
      csvContent += "PROCUREMENT PIPELINE REPORT\n";
      csvContent += "Request ID,Request,Project,Category,Priority,Status,Days Open,Quotes,Lowest Quote,PO Value\n";
      pipelineTableData.forEach((row) => {
        csvContent += `"${row.id}","${row.title}","${row.projectName}","${row.category}","${row.priority}","${row.status}",${row.daysOpen},${row.quotesCount},${row.lowestQuote},${row.poValue}\n`;
      });
    } else if (activeTab === "category") {
      csvContent += "CATEGORY ANALYTICS REPORT\n";
      csvContent += "Category,Total Spend,Share of Spend,Quantity,Avg Unit Price,Vendors,Orders,Avg Lead Time (Days)\n";
      categoryTableData.forEach((row) => {
        csvContent += `"${row.category}",${row.spend},${row.share},${row.qty},${row.avgPrice},${row.vendors},${row.orders},${row.leadTime}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="space-y-6 pb-12">
      {/* SECTION 1: Executive Header */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          title="Purchase Reports Command Center"
          description="Analyze procurement demand, spend performance, vendor efficiency, purchase pipeline health, and category-level trends across the organization."
          actions={
            <div className="flex flex-wrap items-center gap-2 no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-2 border-border-strong hover:bg-hover text-text-primary"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2 border-border-strong hover:bg-hover text-text-primary"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2 border-border-strong hover:bg-hover text-text-primary"
              >
                <Printer className="h-4 w-4" />
                <span>Print Report</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* GLOBAL FILTER BAR */}
      <div className="p-5 rounded-2xl bg-surface border border-border-soft shadow-soft space-y-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted">Date Range</label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className={selectClassName}
            >
              <option value="All Time">All Time</option>
              <option value="This Month">This Month</option>
              <option value="This Quarter">This Quarter</option>
              <option value="This Year">This Year</option>
              <option value="Last 12 Months">Last 12 Months</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className={selectClassName}
            >
              <option value="">All Projects</option>
              {projectOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted">Vendor</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className={selectClassName}
            >
              <option value="">All Vendors</option>
              {vendorOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={selectClassName}
            >
              <option value="">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-soft">
            <span className="text-xs text-text-muted font-medium mr-1">Active Filters:</span>
            {activeChips.map((chip) => (
              <Badge
                key={chip.label}
                className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-border-strong text-xs font-medium bg-surface-secondary text-text-secondary cursor-pointer hover:bg-hover"
                onClick={chip.clear}
              >
                <span>{chip.label}</span>
                <X className="h-3 w-3 text-text-muted hover:text-text-primary" />
              </Badge>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs font-semibold hover:bg-error/10 hover:text-error border-dashed border-border-strong h-8"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* SECTION 2: Executive KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <PremiumMetricCard
          label="Total Requests"
          value={kpis.totalRequests}
          trend="+12%"
          insight="Procurement demand raised"
          tooltip="Total volume of purchase requisitions raised by project engineers during the filtered period."
          color={chartPalette.blue}
        />
        <PremiumMetricCard
          label="Total Purchase Orders"
          value={kpis.totalPOs}
          trend="+8%"
          insight="Released procurement supply"
          tooltip="Total volume of officially approved and released purchase orders."
          color={chartPalette.cyan}
        />
        <PremiumMetricCard
          label="Committed Spend"
          value={formatCurrency(kpis.committedSpend)}
          trend="+15%"
          insight="Committed release value"
          tooltip="Total monetary value of all released purchase orders."
          color={chartPalette.green}
        />
        <PremiumMetricCard
          label="PO Release Rate"
          value={`${kpis.releaseRate}%`}
          trend="+5%"
          insight="Requests to orders speed"
          tooltip="Percentage of purchase requests that successfully converted into final purchase orders."
          color={chartPalette.indigo}
        />
        <PremiumMetricCard
          label="Avg Vendor Reliability"
          value={`${kpis.vendorReliability}/100`}
          trend="Stable"
          insight="Partner scorecard index"
          tooltip="Average reliability score of engaged vendors based on delivery timelines and quality compliance."
          color={chartPalette.amber}
        />
        <PremiumMetricCard
          label="Avg Quote Quality"
          value={`${kpis.quoteQuality}/100`}
          trend="+2%"
          insight="Commercial comparison quality"
          tooltip="Evaluated rating of submitted vendor quotations based on cost precision and terms compliance."
          color={chartPalette.violet}
        />
        <PremiumMetricCard
          label="Avg Delivery Lead Time"
          value={`${kpis.leadTime} Days`}
          trend="-0.5d"
          trendType="down"
          insight="Pipeline efficiency standard"
          tooltip="Average lead time in days taken from purchase order release to item delivery."
          color={chartPalette.red}
        />
        <PremiumMetricCard
          label="Active Vendors"
          value={kpis.activeVendors}
          trend="Active"
          insight="Verified supply network"
          tooltip="Count of active, non-archived vendors matching category and filter choices."
          color={chartPalette.slate}
        />
      </div>

      {/* SECTION 3: Report Category Navigation */}
      <div className="border-b border-border-soft no-print">
        <div className="flex gap-6 overflow-x-auto">
          {(["overview", "spend", "vendors", "pipeline", "category"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3.5 text-sm font-semibold border-b-2 uppercase tracking-wider transition-all select-none whitespace-nowrap ${
                activeTab === tab
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab === "overview" && "Overview"}
              {tab === "spend" && "Spend Analysis"}
              {tab === "vendors" && "Vendor Performance"}
              {tab === "pipeline" && "Procurement Pipeline"}
              {tab === "category" && "Category Analytics"}
            </button>
          ))}
        </div>
      </div>

      {/* TAB REPORT WORKSPACES */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <OverviewWorkspace
            tableData={overviewTableData}
            orders={filteredOrders}
            requests={filteredRequests}
            vendors={filteredVendors}
            router={router}
          />
        )}
        {activeTab === "spend" && (
          <SpendWorkspace tableData={spendTableData} orders={filteredOrders} router={router} />
        )}
        {activeTab === "vendors" && (
          <VendorPerformanceWorkspace
            tableData={vendorTableData}
            quotations={filteredQuotations}
            router={router}
          />
        )}
        {activeTab === "pipeline" && (
          <PipelineWorkspace tableData={pipelineTableData} requests={filteredRequests} router={router} />
        )}
        {activeTab === "category" && (
          <CategoryWorkspace tableData={categoryTableData} orders={filteredOrders} router={router} />
        )}
      </div>
    </section>
  );
}

// ----------------------------------------------------
// TAB 1: OVERVIEW WORKSPACE
// ----------------------------------------------------
function OverviewWorkspace({
  tableData,
  orders,
  requests,
  vendors,
  router,
}: {
  tableData: any[];
  orders: PurchaseOrder[];
  requests: any[];
  vendors: any[];
  router: any;
}) {
  // Chart 1: Monthly Spend Trend (AreaChart)
  const monthlyTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const data: Record<string, { spend: number; count: number; name: string }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = months[d.getMonth()];
      const year = d.getFullYear();
      const key = `${year}-${d.getMonth()}`;
      data[key] = { spend: 0, count: 0, name: `${mLabel} ${year.toString().slice(-2)}` };
    }

    orders.forEach((o) => {
      const oDate = new Date(o.createdAt);
      const key = `${oDate.getFullYear()}-${oDate.getMonth()}`;
      if (data[key]) {
        data[key].spend += o.amount;
        data[key].count += 1;
      }
    });

    return Object.values(data);
  }, [orders]);

  // Chart 2: Procurement Funnel (Conversion Percentages)
  const funnelData = useMemo(() => {
    const totalRequests = requests.length;
    const quotes = new Set(requests.map((r) => r.id));
    const totalQuotes = quotes.size;
    const orderedReqs = new Set(orders.map((o) => o.requestId));
    const totalPOs = orderedReqs.size;
    const delivered = orders.filter((o) => o.status === "Delivered" || o.status === "Completed").length;

    return [
      { step: "Requests", count: totalRequests, pct: 100 },
      { step: "Quotations", count: totalQuotes, pct: totalRequests > 0 ? Math.round((totalQuotes / totalRequests) * 100) : 0 },
      { step: "Purchase Orders", count: totalPOs, pct: totalQuotes > 0 ? Math.round((totalPOs / totalQuotes) * 100) : 0 },
      { step: "Delivered", count: delivered, pct: totalPOs > 0 ? Math.round((delivered / totalPOs) * 100) : 0 },
    ];
  }, [requests, orders]);

  // Chart 3: Project Spend Distribution (Donut Chart)
  const projectSpendData = useMemo(() => {
    const projects: Record<string, number> = {};
    orders.forEach((o) => {
      projects[o.projectName] = (projects[o.projectName] || 0) + o.amount;
    });
    return Object.entries(projects)
      .map(([name, spend]) => ({ name, value: spend }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [orders]);

  const totalSpend = useMemo(() => {
    return projectSpendData.reduce((sum, p) => sum + p.value, 0);
  }, [projectSpendData]);

  // Chart 4: Vendor Health Distribution (Horizontal Bar Chart)
  const vendorHealthData = useMemo(() => {
    const health = { Healthy: 0, Watch: 0, Critical: 0 };
    vendors.forEach((v) => {
      if (v.reliabilityScore >= 85) health.Healthy += 1;
      else if (v.reliabilityScore >= 70) health.Watch += 1;
      else health.Critical += 1;
    });
    return [
      { status: "Healthy (>= 85)", count: health.Healthy, fill: chartPalette.green },
      { status: "Watch (70-84)", count: health.Watch, fill: chartPalette.amber },
      { status: "Critical (< 70)", count: health.Critical, fill: chartPalette.red },
    ];
  }, [vendors]);

  // Table sorting / search / pagination
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("spend");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedData = useMemo(() => {
    let result = [...tableData];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.projectName.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
    return result;
  }, [tableData, search, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* 2x2 Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Spend Trend */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Monthly Spend Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartPalette.blue} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartPalette.blue} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                <XAxis dataKey="name" fontSize={11} stroke="var(--color-text-muted)" tickLine={false} />
                <YAxis
                  fontSize={11}
                  stroke="var(--color-text-muted)"
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), "Spend"]}
                  contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border-soft)", borderRadius: "12px" }}
                />
                <Area type="monotone" dataKey="spend" stroke={chartPalette.blue} strokeWidth={2} fillOpacity={1} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Procurement Funnel */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Procurement Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-soft)" />
                <XAxis type="number" fontSize={11} stroke="var(--color-text-muted)" tickLine={false} />
                <YAxis dataKey="step" type="category" fontSize={11} stroke="var(--color-text-muted)" tickLine={false} />
                <Tooltip
                  formatter={(val: any, name: any, props: any) => [`${val} (${props.payload.pct}%)`, "Volume"]}
                  contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border-soft)", borderRadius: "12px" }}
                />
                <Bar dataKey="count" fill={chartPalette.cyan} radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 3: Project Spend Distribution */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Project Spend Share</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex flex-col md:flex-row items-center justify-around gap-6">
            <div className="relative h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectSpendData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {projectSpendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-text-muted uppercase font-semibold">Total Share</span>
                <span className="text-lg font-bold text-text-primary mt-0.5">₹{(totalSpend / 100000).toFixed(0)}L</span>
              </div>
            </div>
            <div className="space-y-2.5 flex-1 min-w-[200px]">
              {projectSpendData.map((p, idx) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-md" style={{ backgroundColor: donutColors[idx % donutColors.length] }} />
                    <span className="font-semibold text-text-secondary truncate max-w-[150px]">{p.name}</span>
                  </div>
                  <span className="font-bold text-text-primary">{formatCurrency(p.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Vendor Health Distribution */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Vendor Health Score</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorHealthData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                <XAxis dataKey="status" fontSize={11} stroke="var(--color-text-muted)" tickLine={false} />
                <YAxis fontSize={11} stroke="var(--color-text-muted)" tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border-soft)", borderRadius: "12px" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {vendorHealthData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project Summary Table */}
      <Card className="border border-border-soft overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-soft">
          <CardTitle className="text-base font-bold text-text-primary">Project Procurement Summary</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-text-muted" />
            <Input
              type="text"
              placeholder="Search project..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 pl-10 pr-4 rounded-xl border border-border-soft bg-surface text-xs focus-visible:ring-1 focus-visible:ring-accent-primary"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-xs border-collapse relative">
              <thead className="bg-surface-secondary text-text-muted font-bold sticky top-0 z-10 border-b border-border-soft">
                <tr className="h-11 shadow-[inset_0_-1px_0_0_rgba(15,23,42,0.06)]">
                  <th className="px-5 cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("projectName")}>
                    Project {sortField === "projectName" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("requests")}>
                    Requests {sortField === "requests" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("quotes")}>
                    Quotations {sortField === "quotes" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("pos")}>
                    Purchase Orders {sortField === "pos" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("spend")}>
                    Committed Spend {sortField === "spend" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("avgPo")}>
                    Average PO Value {sortField === "avgPo" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("vendors")}>
                    Vendors Engaged {sortField === "vendors" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-5 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("compliance")}>
                    Delivery Compliance {sortField === "compliance" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft bg-surface">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-text-muted">
                      No project metrics found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.projectId}
                      onClick={() => router.push(`/purchases/purchase-reports/project/${row.projectId}`)}
                      className="h-14 hover:bg-hover cursor-pointer border-t border-border-soft transition-colors"
                    >
                      <td className="px-5 font-semibold text-text-primary">{row.projectName}</td>
                      <td className="px-4 text-center">{row.requests}</td>
                      <td className="px-4 text-center">{row.quotes}</td>
                      <td className="px-4 text-center">{row.pos}</td>
                      <td className="px-4 text-right font-bold text-text-primary">{formatCurrency(row.spend)}</td>
                      <td className="px-4 text-right">{formatCurrency(row.avgPo)}</td>
                      <td className="px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-surface-secondary border border-border-soft">
                          {row.vendors} Vendors
                        </span>
                      </td>
                      <td className="px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-surface-secondary rounded-full h-1.5 overflow-hidden border border-border-soft">
                            <div
                              className={`h-full rounded-full ${
                                row.compliance >= 85 ? "bg-success" : row.compliance >= 70 ? "bg-warning" : "bg-error"
                              }`}
                              style={{ width: `${row.compliance}%` }}
                            />
                          </div>
                          <span className="font-bold text-text-primary">{row.compliance}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border-soft flex items-center justify-between gap-4 text-xs font-semibold text-text-secondary select-none bg-surface-secondary">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-border-soft bg-surface px-2 outline-none shadow-soft"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
              <span className="text-text-muted ml-3">
                Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                «
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((c) => Math.max(1, c - 1))} disabled={currentPage === 1}>
                ‹
              </Button>
              <div className="px-3 py-1 bg-surface border border-border-soft rounded-md">
                Page {currentPage} of {totalPages}
              </div>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages}>
                ›
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------
// TAB 2: SPEND ANALYSIS WORKSPACE
// ----------------------------------------------------
function SpendWorkspace({ tableData, orders, router }: { tableData: any[]; orders: PurchaseOrder[]; router: any }) {
  // Chart 1: Spend by Project (Horizontal Bar Chart)
  const spendByProjectData = useMemo(() => {
    const list: Record<string, number> = {};
    orders.forEach((o) => {
      list[o.projectName] = (list[o.projectName] || 0) + o.amount;
    });
    return Object.entries(list)
      .map(([name, spend]) => ({ name, spend }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 6);
  }, [orders]);

  // Chart 2: Spend by Material Category (Donut Chart)
  const spendByCategoryData = useMemo(() => {
    const list: Record<string, number> = {};
    orders.forEach((o) => {
      const cat = o.lineItems?.[0]?.category || "Other";
      list[cat] = (list[cat] || 0) + o.amount;
    });
    return Object.entries(list)
      .map(([name, spend]) => ({ name, value: spend }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  const totalCatSpend = useMemo(() => {
    return spendByCategoryData.reduce((sum, c) => sum + c.value, 0);
  }, [spendByCategoryData]);

  // Chart 3: Vendor Spend Share (Horizontal Ranked Bar Chart)
  const vendorSpendData = useMemo(() => {
    const list: Record<string, number> = {};
    orders.forEach((o) => {
      list[o.vendorName] = (list[o.vendorName] || 0) + o.amount;
    });
    return Object.entries(list)
      .map(([name, spend]) => ({ name, spend }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 6);
  }, [orders]);

  // Table sorting / search / pagination
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("amount");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedData = useMemo(() => {
    let result = [...tableData];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.projectName.toLowerCase().includes(q) ||
          r.vendorName.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
    return result;
  }, [tableData, search, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spend by Project */}
        <Card className="border border-border-soft col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Spend by Project</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByProjectData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-soft)" />
                <XAxis type="number" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`} />
                <YAxis dataKey="name" type="category" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} width={80} />
                <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                <Bar dataKey="spend" fill={chartPalette.blue} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spend by Category */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Spend by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex flex-col items-center justify-center relative">
            <div className="h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendByCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {spendByCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-text-muted uppercase font-bold">Categories</span>
                <span className="text-sm font-bold text-text-primary mt-0.5">₹{(totalCatSpend / 100000).toFixed(0)}L</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Spend Share */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Vendor Spend Share</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorSpendData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-soft)" />
                <XAxis type="number" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`} />
                <YAxis dataKey="name" type="category" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} width={80} />
                <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                <Bar dataKey="spend" fill={chartPalette.green} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Spend Register Table */}
      <Card className="border border-border-soft overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-soft">
          <CardTitle className="text-base font-bold text-text-primary">Spend Register</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-text-muted" />
            <Input
              type="text"
              placeholder="Search ID, project, category, vendor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 pl-10 pr-4 rounded-xl border border-border-soft bg-surface text-xs focus-visible:ring-1 focus-visible:ring-accent-primary"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs border-collapse relative">
              <thead className="bg-surface-secondary text-text-muted font-bold sticky top-0 z-10 border-b border-border-soft">
                <tr className="h-11 shadow-[inset_0_-1px_0_0_rgba(15,23,42,0.06)]">
                  <th className="px-5 cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("id")}>
                    PO ID {sortField === "id" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("projectName")}>
                    Project {sortField === "projectName" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("vendorName")}>
                    Vendor {sortField === "vendorName" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("category")}>
                    Category {sortField === "category" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("amount")}>
                    Amount {sortField === "amount" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("percent")}>
                    % of Spend {sortField === "percent" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("status")}>
                    Status {sortField === "status" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-5 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("date")}>
                    Release Date {sortField === "date" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft bg-surface">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-text-muted">
                      No transactions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/purchases/purchase-reports/spend/${row.id}`)}
                      className="h-14 hover:bg-hover cursor-pointer border-t border-border-soft transition-colors"
                    >
                      <td className="px-5 font-semibold text-accent-primary">{row.id}</td>
                      <td className="px-4 font-semibold text-text-primary">{row.projectName}</td>
                      <td className="px-4">{row.vendorName}</td>
                      <td className="px-4">
                        <span className="px-2 py-0.5 rounded-md bg-surface-secondary border border-border-soft text-[10px] uppercase font-bold text-text-muted">
                          {row.category}
                        </span>
                      </td>
                      <td className="px-4 text-right font-bold text-text-primary">{formatCurrency(row.amount)}</td>
                      <td className="px-4 text-center">{row.percent}%</td>
                      <td className="px-4 text-center">
                        <Badge tone={toneForStatus(row.status)}>{row.status}</Badge>
                      </td>
                      <td className="px-5 text-right text-text-muted">{row.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border-soft flex items-center justify-between gap-4 text-xs font-semibold text-text-secondary select-none bg-surface-secondary">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-border-soft bg-surface px-2 outline-none shadow-soft"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
              <span className="text-text-muted ml-3">
                Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                «
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((c) => Math.max(1, c - 1))} disabled={currentPage === 1}>
                ‹
              </Button>
              <div className="px-3 py-1 bg-surface border border-border-soft rounded-md">
                Page {currentPage} of {totalPages}
              </div>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages}>
                ›
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------
// TAB 3: VENDOR PERFORMANCE WORKSPACE
// ----------------------------------------------------
function VendorPerformanceWorkspace({
  tableData,
  quotations,
  router,
}: {
  tableData: any[];
  quotations: any[];
  router: any;
}) {
  // Chart 1: Vendor Reliability Ranking
  const reliabilityData = useMemo(() => {
    return [...tableData]
      .sort((a, b) => b.reliability - a.reliability)
      .slice(0, 6)
      .map((v) => ({ name: v.name, reliability: v.reliability }));
  }, [tableData]);

  // Chart 2: Average Lead Time
  const leadTimeData = useMemo(() => {
    return [...tableData]
      .sort((a, b) => a.leadTime - b.leadTime)
      .slice(0, 6)
      .map((v) => ({ name: v.name, leadTime: v.leadTime }));
  }, [tableData]);

  // Chart 3: Spend Share by Vendor
  const spendShareData = useMemo(() => {
    return [...tableData]
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5)
      .map((v) => ({ name: v.name, value: v.spend }));
  }, [tableData]);

  // Chart 4: Quote Win Rate (ComposedChart with a target reference line at 85)
  const winRateData = useMemo(() => {
    return [...tableData]
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 6)
      .map((v) => ({ name: v.name, winRate: v.winRate }));
  }, [tableData]);

  // Table sorting / search / pagination
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("reliability");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedData = useMemo(() => {
    let result = [...tableData];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
    return result;
  }, [tableData, search, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Reliability Ranking */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Vendor Reliability Score</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reliabilityData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                <XAxis dataKey="name" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <YAxis fontSize={10} stroke="var(--color-text-muted)" tickLine={false} domain={[0, 100]} />
                <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                <ReferenceLine y={85} stroke="var(--color-success)" strokeDasharray="3 3" label={{ value: "Target 85", position: "top", fontSize: 10, fill: "var(--color-success)" }} />
                <Bar dataKey="reliability" fill={chartPalette.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Lead Time */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Average Lead Time (Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadTimeData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                <XAxis dataKey="name" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <YAxis fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <Tooltip formatter={(val: any) => `${val} Days`} />
                <Bar dataKey="leadTime" fill={chartPalette.cyan} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spend Share by Vendor */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Spend Share by Vendor</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex flex-col md:flex-row items-center justify-around gap-6">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendShareData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {spendShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1 min-w-[200px]">
              {spendShareData.map((p, idx) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-md" style={{ backgroundColor: donutColors[idx % donutColors.length] }} />
                    <span className="font-semibold text-text-secondary truncate max-w-[150px]">{p.name}</span>
                  </div>
                  <span className="font-bold text-text-primary">{formatCurrency(p.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quote Win Rate */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Quote Win Rate (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={winRateData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                <XAxis dataKey="name" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <YAxis fontSize={10} stroke="var(--color-text-muted)" tickLine={false} domain={[0, 100]} />
                <Tooltip formatter={(val: any) => `${val}%`} />
                <Bar dataKey="winRate" fill={chartPalette.indigo} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="winRate" stroke={chartPalette.red} strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Scorecard Table */}
      <Card className="border border-border-soft overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-soft">
          <CardTitle className="text-base font-bold text-text-primary">Vendor Scorecard</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-text-muted" />
            <Input
              type="text"
              placeholder="Search vendor name, category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 pl-10 pr-4 rounded-xl border border-border-soft bg-surface text-xs focus-visible:ring-1 focus-visible:ring-accent-primary"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-xs border-collapse relative">
              <thead className="bg-surface-secondary text-text-muted font-bold sticky top-0 z-10 border-b border-border-soft">
                <tr className="h-11 shadow-[inset_0_-1px_0_0_rgba(15,23,42,0.06)]">
                  <th className="px-5 cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("name")}>
                    Vendor Name {sortField === "name" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("category")}>
                    Category {sortField === "category" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("status")}>
                    Status {sortField === "status" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("reliability")}>
                    Reliability Score {sortField === "reliability" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("leadTime")}>
                    Lead Time {sortField === "leadTime" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("orders")}>
                    Orders {sortField === "orders" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("spend")}>
                    Committed Spend {sortField === "spend" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("quality")}>
                    Quote Quality {sortField === "quality" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-5 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("winRate")}>
                    Win Rate {sortField === "winRate" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft bg-surface">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-text-muted">
                      No vendor scorecards found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/purchases/purchase-reports/vendor/${row.id}`)}
                      className="h-14 hover:bg-hover cursor-pointer border-t border-border-soft transition-colors"
                    >
                      <td className="px-5 font-semibold text-text-primary">{row.name}</td>
                      <td className="px-4 text-text-secondary">{row.category}</td>
                      <td className="px-4 text-center">
                        <Badge tone={toneForStatus(row.status)}>{row.status}</Badge>
                      </td>
                      <td className="px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-surface-secondary rounded-full h-1.5 overflow-hidden border border-border-soft">
                            <div
                              className={`h-full rounded-full ${
                                row.reliability >= 85 ? "bg-success" : row.reliability >= 70 ? "bg-warning" : "bg-error"
                              }`}
                              style={{ width: `${row.reliability}%` }}
                            />
                          </div>
                          <span className="font-bold text-text-primary">{row.reliability}</span>
                        </div>
                      </td>
                      <td className="px-4 text-center">{row.leadTime} Days</td>
                      <td className="px-4 text-center">{row.orders}</td>
                      <td className="px-4 text-right font-semibold text-text-primary">{formatCurrency(row.spend)}</td>
                      <td className="px-4 text-center font-semibold text-text-primary">{row.quality}/100</td>
                      <td className="px-5 text-right font-bold text-accent-primary">{row.winRate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border-soft flex items-center justify-between gap-4 text-xs font-semibold text-text-secondary select-none bg-surface-secondary">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-border-soft bg-surface px-2 outline-none shadow-soft"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
              <span className="text-text-muted ml-3">
                Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                «
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((c) => Math.max(1, c - 1))} disabled={currentPage === 1}>
                ‹
              </Button>
              <div className="px-3 py-1 bg-surface border border-border-soft rounded-md">
                Page {currentPage} of {totalPages}
              </div>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages}>
                ›
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------
// TAB 4: PROCUREMENT PIPELINE WORKSPACE
// ----------------------------------------------------
function PipelineWorkspace({
  tableData,
  requests,
  router,
}: {
  tableData: any[];
  requests: any[];
  router: any;
}) {
  // Chart 1: Funnel
  const funnelData = useMemo(() => {
    const totalRequests = requests.length;
    const pending = requests.filter((r) => r.status === "Pending").length;
    const approved = requests.filter((r) => r.status === "Approved" || r.status === "Ordered" || r.status === "Completed").length;

    return [
      { step: "Total Requests", count: totalRequests },
      { step: "Pending Review", count: pending },
      { step: "Approved & Sourced", count: approved },
    ];
  }, [requests]);

  // Chart 2: Cycle Time Analysis
  const cycleTimeData = [
    { phase: "Req → Quote", days: 3.5 },
    { phase: "Quote → PO", days: 4.2 },
    { phase: "PO → Delivery", days: 7.8 },
  ];

  // Chart 3: Priority Mix
  const priorityData = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    requests.forEach((r) => {
      if (r.priority === "High" || r.priority === "Urgent") counts.High += 1;
      else if (r.priority === "Medium") counts.Medium += 1;
      else counts.Low += 1;
    });
    return [
      { name: "High", value: counts.High, fill: chartPalette.red },
      { name: "Medium", value: counts.Medium, fill: chartPalette.amber },
      { name: "Low", value: counts.Low, fill: chartPalette.green },
    ];
  }, [requests]);

  // Chart 4: Pipeline Trend (Pending vs Delivered)
  const pipelineTrendData = [
    { month: "Jan", Pending: 15, Approved: 24, Delivered: 18 },
    { month: "Feb", Pending: 12, Approved: 28, Delivered: 22 },
    { month: "Mar", Pending: 18, Approved: 35, Delivered: 26 },
    { month: "Apr", Pending: 14, Approved: 32, Delivered: 30 },
    { month: "May", Pending: 10, Approved: 40, Delivered: 35 },
  ];

  // Table sorting / search / pagination
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("daysOpen");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedData = useMemo(() => {
    let result = [...tableData];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.projectName.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
    return result;
  }, [tableData, search, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cycle Time Analysis */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Procurement Cycle Time (Avg Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycleTimeData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                <XAxis dataKey="phase" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <YAxis fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <Tooltip formatter={(val: any) => `${val} Days`} />
                <Bar dataKey="days" fill={chartPalette.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Mix */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Pipeline Priority Mix</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex flex-col md:flex-row items-center justify-around gap-6">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `${val} Requests`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1 min-w-[200px]">
              {priorityData.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-md" style={{ backgroundColor: p.fill }} />
                    <span className="font-semibold text-text-secondary truncate">{p.name} Priority</span>
                  </div>
                  <span className="font-bold text-text-primary">{p.value} Requests</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Funnel */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Pipeline Volume Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                <XAxis dataKey="step" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <YAxis fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <Tooltip formatter={(val: any) => `${val} Requests`} />
                <Bar dataKey="count" fill={chartPalette.cyan} radius={[4, 4, 0, 0]}>
                  {funnelData.map((e, idx) => (
                    <Cell key={`cell-${idx}`} fill={donutColors[idx % donutColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Trend */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Procurement Flow Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pipelineTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                <XAxis dataKey="month" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <YAxis fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <Tooltip formatter={(val: any) => `${val} Requests`} />
                <Area type="monotone" dataKey="Pending" stackId="1" stroke={chartPalette.amber} fill={chartPalette.amber} fillOpacity={0.1} />
                <Area type="monotone" dataKey="Approved" stackId="1" stroke={chartPalette.blue} fill={chartPalette.blue} fillOpacity={0.1} />
                <Area type="monotone" dataKey="Delivered" stackId="1" stroke={chartPalette.green} fill={chartPalette.green} fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Table */}
      <Card className="border border-border-soft overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-soft">
          <CardTitle className="text-base font-bold text-text-primary">Procurement Pipeline Registers</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-text-muted" />
            <Input
              type="text"
              placeholder="Search request ID, project..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 pl-10 pr-4 rounded-xl border border-border-soft bg-surface text-xs focus-visible:ring-1 focus-visible:ring-accent-primary"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-xs border-collapse relative">
              <thead className="bg-surface-secondary text-text-muted font-bold sticky top-0 z-10 border-b border-border-soft">
                <tr className="h-11 shadow-[inset_0_-1px_0_0_rgba(15,23,42,0.06)]">
                  <th className="px-5 cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("id")}>
                    Request ID {sortField === "id" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("title")}>
                    Request {sortField === "title" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("projectName")}>
                    Project {sortField === "projectName" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("category")}>
                    Category {sortField === "category" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("priority")}>
                    Priority {sortField === "priority" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("status")}>
                    Status {sortField === "status" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("daysOpen")}>
                    Days Open {sortField === "daysOpen" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("quotesCount")}>
                    Quotes Recd {sortField === "quotesCount" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("lowestQuote")}>
                    Lowest Quote {sortField === "lowestQuote" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-5 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("poValue")}>
                    PO Value {sortField === "poValue" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft bg-surface">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-text-muted">
                      No requests found matching pipeline criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/purchases/requests/${row.id}`)}
                      className="h-14 hover:bg-hover cursor-pointer border-t border-border-soft transition-colors"
                    >
                      <td className="px-5 font-semibold text-accent-primary">{row.id}</td>
                      <td className="px-4 font-semibold text-text-primary truncate max-w-[150px]">{row.title}</td>
                      <td className="px-4">{row.projectName}</td>
                      <td className="px-4">{row.category}</td>
                      <td className="px-4 text-center">
                        <Badge tone={row.priority === "High" || row.priority === "Urgent" ? "error" : "warning"}>
                          {row.priority}
                        </Badge>
                      </td>
                      <td className="px-4 text-center">
                        <Badge tone={toneForStatus(row.status)}>{row.status}</Badge>
                      </td>
                      <td className="px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] ${
                            row.daysOpen >= 15
                              ? "bg-error/10 text-error"
                              : row.daysOpen >= 7
                              ? "bg-warning/10 text-warning"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          {row.daysOpen} Days
                        </span>
                      </td>
                      <td className="px-4 text-center">{row.quotesCount}</td>
                      <td className="px-4 text-right font-semibold text-text-primary">
                        {row.lowestQuote > 0 ? formatCurrency(row.lowestQuote) : "—"}
                      </td>
                      <td className="px-5 text-right font-bold text-text-primary">
                        {row.poValue > 0 ? formatCurrency(row.poValue) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border-soft flex items-center justify-between gap-4 text-xs font-semibold text-text-secondary select-none bg-surface-secondary">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-border-soft bg-surface px-2 outline-none shadow-soft"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
              <span className="text-text-muted ml-3">
                Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                «
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((c) => Math.max(1, c - 1))} disabled={currentPage === 1}>
                ‹
              </Button>
              <div className="px-3 py-1 bg-surface border border-border-soft rounded-md">
                Page {currentPage} of {totalPages}
              </div>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages}>
                ›
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------
// TAB 5: CATEGORY ANALYTICS WORKSPACE
// ----------------------------------------------------
function CategoryWorkspace({ tableData, orders, router }: { tableData: any[]; orders: PurchaseOrder[]; router: any }) {
  // Chart 1: Spend by Category
  const spendByCatData = useMemo(() => {
    return [...tableData].sort((a, b) => b.spend - a.spend).slice(0, 6);
  }, [tableData]);

  // Chart 2: Quantity Trend by Category (stacked AreaChart)
  const quantityTrendData = [
    { month: "Jan", Cement: 1200, Steel: 800, Electrical: 150 },
    { month: "Feb", Cement: 1400, Steel: 950, Electrical: 200 },
    { month: "Mar", Cement: 1100, Steel: 1100, Electrical: 180 },
    { month: "Apr", Cement: 1600, Steel: 1200, Electrical: 250 },
    { month: "May", Cement: 1800, Steel: 1400, Electrical: 300 },
  ];

  // Chart 3: Average Unit Price Trend (Line Chart)
  const priceTrendData = [
    { month: "Jan", Cement: 420, Steel: 65000, Electrical: 350 },
    { month: "Feb", Cement: 430, Steel: 66500, Electrical: 360 },
    { month: "Mar", Cement: 410, Steel: 64200, Electrical: 345 },
    { month: "Apr", Cement: 440, Steel: 67800, Electrical: 380 },
    { month: "May", Cement: 455, Steel: 69500, Electrical: 410 },
  ];

  // Chart 4: Category Share Distribution (Pie Chart)
  const catShareData = useMemo(() => {
    return [...tableData].map((c) => ({ name: c.category, value: c.spend }));
  }, [tableData]);

  // Table sorting / search / pagination
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("spend");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedData = useMemo(() => {
    let result = [...tableData];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.category.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
    return result;
  }, [tableData, search, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by Category */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Spend by Material Category</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByCatData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-soft)" />
                <XAxis type="number" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`} />
                <YAxis dataKey="category" type="category" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} width={80} />
                <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                <Bar dataKey="spend" fill={chartPalette.blue} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quantity Trend */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Material Quantity Consumption</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={quantityTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                <XAxis dataKey="month" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <YAxis fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <Tooltip formatter={(val: any) => `${val} Units`} />
                <Area type="monotone" dataKey="Cement" stackId="1" stroke={chartPalette.blue} fill={chartPalette.blue} fillOpacity={0.1} />
                <Area type="monotone" dataKey="Steel" stackId="1" stroke={chartPalette.cyan} fill={chartPalette.cyan} fillOpacity={0.1} />
                <Area type="monotone" dataKey="Electrical" stackId="1" stroke={chartPalette.amber} fill={chartPalette.amber} fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Price Trend */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Cement Cost Trend (INR / Bag)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                <XAxis dataKey="month" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <YAxis fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                <Line type="monotone" dataKey="Cement" stroke={chartPalette.red} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Share Distribution */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Category Volume Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center relative">
            <div className="h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catShareData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {catShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Table */}
      <Card className="border border-border-soft overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-soft">
          <CardTitle className="text-base font-bold text-text-primary">Material Category Scorecard</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-text-muted" />
            <Input
              type="text"
              placeholder="Search category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 pl-10 pr-4 rounded-xl border border-border-soft bg-surface text-xs focus-visible:ring-1 focus-visible:ring-accent-primary"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs border-collapse relative">
              <thead className="bg-surface-secondary text-text-muted font-bold sticky top-0 z-10 border-b border-border-soft">
                <tr className="h-11 shadow-[inset_0_-1px_0_0_rgba(15,23,42,0.06)]">
                  <th className="px-5 cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("category")}>
                    Category {sortField === "category" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("spend")}>
                    Total Spend {sortField === "spend" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("share")}>
                    Share of Spend {sortField === "share" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("qty")}>
                    Quantity {sortField === "qty" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("avgPrice")}>
                    Average Unit Price {sortField === "avgPrice" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("vendors")}>
                    Vendors engaged {sortField === "vendors" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 text-center cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("orders")}>
                    Orders released {sortField === "orders" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-5 text-right cursor-pointer select-none hover:text-text-primary" onClick={() => handleSort("leadTime")}>
                    Average Lead Time {sortField === "leadTime" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft bg-surface">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-text-muted">
                      No material categories found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.category}
                      onClick={() => router.push(`/purchases/purchase-reports/category/${row.category}`)}
                      className="h-14 hover:bg-hover cursor-pointer border-t border-border-soft transition-colors"
                    >
                      <td className="px-5 font-semibold text-text-primary uppercase tracking-wider">{row.category}</td>
                      <td className="px-4 text-right font-bold text-text-primary">{formatCurrency(row.spend)}</td>
                      <td className="px-4 text-center">{row.share}%</td>
                      <td className="px-4 text-center">{row.qty} Units</td>
                      <td className="px-4 text-right">{formatCurrency(row.avgPrice)}</td>
                      <td className="px-4 text-center">{row.vendors} Vendors</td>
                      <td className="px-4 text-center">{row.orders} Orders</td>
                      <td className="px-5 text-right font-semibold text-text-primary">{row.leadTime} Days</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border-soft flex items-center justify-between gap-4 text-xs font-semibold text-text-secondary select-none bg-surface-secondary">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-border-soft bg-surface px-2 outline-none shadow-soft"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
              <span className="text-text-muted ml-3">
                Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                «
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((c) => Math.max(1, c - 1))} disabled={currentPage === 1}>
                ‹
              </Button>
              <div className="px-3 py-1 bg-surface border border-border-soft rounded-md">
                Page {currentPage} of {totalPages}
              </div>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages}>
                ›
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
