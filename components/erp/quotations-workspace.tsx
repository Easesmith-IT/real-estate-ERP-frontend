"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Zap,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  RefreshCcw,
  SlidersHorizontal,
  ChevronDown,
  Search,
  Upload,
  X,
  FileCheck,
  ChevronUp,
  FileSpreadsheet,
  Building,
  Calendar,
  AlertTriangle,
  Bookmark
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/ui-store";
import { apiRequest, uploadDocument } from "@/lib/erp-api";
import { formatCurrency, formatDate, toneForStatus } from "@/lib/erp-utils";
import type {
  QuotationsResponse,
  PurchaseRequestsResponse,
  VendorsResponse,
} from "@/lib/erp-types";
import { ErrorStateCard } from "@/components/erp/live-state";
import { EnterprisePageLoader } from "@/components/ui/loaders";
import { SectionHeader } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

// Simulated Sparkline Component
function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const width = 120;
  const height = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const color = positive ? "#10b981" : "#ef4444";
  return (
    <svg className="overflow-visible" width={width} height={height}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function QuotationsWorkspace() {
  const role = useUiStore((state) => state.role);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Queries
  const requestsQuery = useQuery({
    queryKey: ["erp-purchase-requests", role],
    queryFn: async () => (await apiRequest<PurchaseRequestsResponse>("/api/procurement/requests", { role })).data,
  });

  const vendorsQuery = useQuery({
    queryKey: ["erp-vendors", role],
    queryFn: async () => (await apiRequest<VendorsResponse>("/api/procurement/vendors", { role })).data,
  });

  const query = useQuery({
    queryKey: ["erp-quotations", role],
    queryFn: async () => (await apiRequest<QuotationsResponse>("/api/procurement/quotations", { role })).data,
  });

  // State UI Controls
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [requestFilter, setRequestFilter] = useState("All");
  const [qualityFilter, setQualityFilter] = useState("All"); // All, 90+, 75-89, <75
  const [deliveryFilter, setDeliveryFilter] = useState("All"); // All, <3d, <7d, 7d+
  const [amountFilter, setAmountFilter] = useState("All"); // All, <5L, 5L-10L, 10L+
  const [selectedQuickChip, setSelectedQuickChip] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<string>("submittedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    vendor: true,
    request: true,
    amount: true,
    delivery: true,
    quality: true,
    payment: true,
    date: true,
    status: true,
    document: true,
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Side-by-side comparison selection
  const [compareRequestId, setCompareRequestId] = useState<string>("");

  // Drawer Form State
  const [form, setForm] = useState({
    requestId: "",
    vendorId: "",
    totalAmount: "",
    deliveryDays: "",
    paymentTerms: "30% advance, balance on delivery",
    qualityScore: "85",
    status: "Received",
    notes: "",
  });

  // PDF upload simulation state
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mutations
  const mutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/procurement/quotations", {
        role,
        method: "POST",
        body: {
          ...form,
          totalAmount: Number(form.totalAmount),
          deliveryDays: Number(form.deliveryDays),
          qualityScore: Number(form.qualityScore),
          documentName: uploadedFile?.name || null,
          documentSize: uploadedFile?.size || null,
          documentUrl: uploadedFile?.url || null,
        },
      }),
    onSuccess: async () => {
      setForm({
        requestId: requestsQuery.data?.requests[0]?.id || "",
        vendorId: vendorsQuery.data?.vendors[0]?.id || "",
        totalAmount: "",
        deliveryDays: "",
        paymentTerms: "30% advance, balance on delivery",
        qualityScore: "85",
        status: "Received",
        notes: "",
      });
      setUploadedFile(null);
      setDrawerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-quotations"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
      ]);
    },
  });

  // Set default Request & Vendor IDs in the form when data loads
  useEffect(() => {
    if (!form.requestId && requestsQuery.data?.requests[0]?.id) {
      setForm((c) => ({ ...c, requestId: requestsQuery.data.requests[0].id }));
    }
    if (requestsQuery.data?.requests[0]?.id && !compareRequestId) {
      setCompareRequestId(requestsQuery.data.requests[0].id);
    }
  }, [requestsQuery.data?.requests, form.requestId, compareRequestId]);

  useEffect(() => {
    if (!form.vendorId && vendorsQuery.data?.vendors[0]?.id) {
      setForm((c) => ({ ...c, vendorId: vendorsQuery.data.vendors[0].id }));
    }
  }, [vendorsQuery.data?.vendors, form.vendorId]);

  // Handle Simulated PDF Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUploadedFile({
            name: file.name,
            size: file.size,
            // Create a fake object URL to look realistic, or try actual upload if desired
            url: URL.createObjectURL(file),
          });
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
  };

  // Calculations & Analytics
  const quotations = query.data?.quotations || [];

  const stats = useMemo(() => {
    if (!quotations.length) {
      return {
        total: 0,
        received: 0,
        shortlisted: 0,
        accepted: 0,
        rejected: 0,
        avgAmount: 0,
        avgQuality: 0,
        avgDelivery: 0,
      };
    }

    const total = quotations.length;
    const received = quotations.filter((q) => q.status === "Received").length;
    const shortlisted = quotations.filter((q) => q.status === "Shortlisted" || q.status === "Recommended").length;
    const accepted = quotations.filter((q) => q.status === "Accepted").length;
    const rejected = quotations.filter((q) => q.status === "Rejected").length;

    const avgAmount = quotations.reduce((acc, q) => acc + q.totalAmount, 0) / total;
    const avgQuality = quotations.reduce((acc, q) => acc + q.qualityScore, 0) / total;
    const avgDelivery = quotations.reduce((acc, q) => acc + q.deliveryDays, 0) / total;

    return {
      total,
      received,
      shortlisted,
      accepted,
      rejected,
      avgAmount,
      avgQuality,
      avgDelivery,
    };
  }, [quotations]);

  // 1. HORIZONTAL BAR CHART - Price comparison sorted lowest to highest
  const priceComparisonData = useMemo(() => {
    // Group and find average or individual quote amounts for current request context or overall
    const dataMap: Record<string, { name: string; amount: number }> = {};
    quotations.forEach((q) => {
      const vendorName = q.vendorName || "Unknown";
      if (!dataMap[q.vendorId]) {
        dataMap[q.vendorId] = { name: vendorName, amount: q.totalAmount };
      } else {
        // use minimum amount for comparison
        dataMap[q.vendorId].amount = Math.min(dataMap[q.vendorId].amount, q.totalAmount);
      }
    });

    return Object.values(dataMap).sort((a, b) => a.amount - b.amount).slice(0, 10);
  }, [quotations]);

  // 2. DONUT CHART - Quality Distribution
  const qualityDistributionData = useMemo(() => {
    let excellent = 0; // 90+
    let good = 0;      // 75-89
    let average = 0;   // 50-74
    let risk = 0;      // <50

    quotations.forEach((q) => {
      if (q.qualityScore >= 90) excellent++;
      else if (q.qualityScore >= 75) good++;
      else if (q.qualityScore >= 50) average++;
      else risk++;
    });

    return [
      { name: "Excellent (90+)", value: excellent, color: "#10b981" },
      { name: "Good (75-89)", value: good, color: "#3b82f6" },
      { name: "Average (50-74)", value: average, color: "#f59e0b" },
      { name: "Risk (<50)", value: risk, color: "#ef4444" },
    ].filter((s) => s.value > 0);
  }, [quotations]);

  // 3. BAR CHART - Delivery Performance
  const deliveryPerformanceData = useMemo(() => {
    const dataMap: Record<string, { name: string; days: number }> = {};
    quotations.forEach((q) => {
      const vendorName = q.vendorName || "Unknown";
      if (!dataMap[q.vendorId]) {
        dataMap[q.vendorId] = { name: vendorName, days: q.deliveryDays };
      } else {
        // Average delivery days
        dataMap[q.vendorId].days = Math.min(dataMap[q.vendorId].days, q.deliveryDays);
      }
    });

    return Object.values(dataMap).sort((a, b) => a.days - b.days).slice(0, 10);
  }, [quotations]);

  // 4. FUNNEL VISUALIZATION STAGES
  const funnelStages = useMemo(() => {
    const received = quotations.length;
    const shortlisted = quotations.filter((q) => ["Shortlisted", "Recommended", "Accepted"].includes(q.status)).length;
    const accepted = quotations.filter((q) => q.status === "Accepted").length;
    const rejected = quotations.filter((q) => q.status === "Rejected").length;

    const shortListRate = received ? Math.round((shortlisted / received) * 100) : 0;
    const acceptRate = shortlisted ? Math.round((accepted / shortlisted) * 100) : 0;

    return [
      { name: "Received", count: received, percentage: 100, color: "bg-blue-500/10 border-blue-500 text-blue-400" },
      { name: "Shortlisted", count: shortlisted, percentage: shortListRate, color: "bg-amber-500/10 border-amber-500 text-amber-400" },
      { name: "Accepted", count: accepted, percentage: acceptRate, color: "bg-emerald-500/10 border-emerald-500 text-emerald-400" },
      { name: "Rejected", count: rejected, percentage: received ? Math.round((rejected / received) * 100) : 0, color: "bg-red-500/10 border-red-500 text-red-400" },
    ];
  }, [quotations]);

  // Side-by-side comparison selection data
  const compareQuotations = useMemo(() => {
    if (!compareRequestId) return [];
    return quotations.filter((q) => q.requestId === compareRequestId);
  }, [quotations, compareRequestId]);

  const comparisonStats = useMemo(() => {
    if (!compareQuotations.length) return null;

    let bestPriceQuote = compareQuotations[0];
    let fastestDeliveryQuote = compareQuotations[0];
    let highestQualityQuote = compareQuotations[0];

    compareQuotations.forEach((q) => {
      if (q.totalAmount < bestPriceQuote.totalAmount) bestPriceQuote = q;
      if (q.deliveryDays < fastestDeliveryQuote.deliveryDays) fastestDeliveryQuote = q;
      if (q.qualityScore > highestQualityQuote.qualityScore) highestQualityQuote = q;
    });

    // Recommended Supplier Logic: Highest quality-to-cost ratio, or status recommended
    let recommendedQuote = compareQuotations.find(q => q.status === "Recommended");
    if (!recommendedQuote) {
      // Calculate a value score: (QualityScore * 1000000) / TotalAmount (higher is better)
      let bestScore = -1;
      compareQuotations.forEach((q) => {
        const score = (q.qualityScore * 1000000) / q.totalAmount;
        if (score > bestScore) {
          bestScore = score;
          recommendedQuote = q;
        }
      });
    }

    return {
      bestPrice: bestPriceQuote,
      fastest: fastestDeliveryQuote,
      highestQuality: highestQualityQuote,
      recommended: recommendedQuote || bestPriceQuote,
    };
  }, [compareQuotations]);

  // Filters & Searching
  const filteredQuotations = useMemo(() => {
    let result = [...quotations];

    // Search term
    if (searchTerm.trim()) {
      const needle = searchTerm.toLowerCase();
      result = result.filter(
        (q) =>
          q.vendorName?.toLowerCase().includes(needle) ||
          q.requestTitle?.toLowerCase().includes(needle) ||
          q.paymentTerms?.toLowerCase().includes(needle) ||
          q.id.toLowerCase().includes(needle)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter((q) => q.status === statusFilter);
    }

    // Vendor filter
    if (vendorFilter !== "All") {
      result = result.filter((q) => q.vendorId === vendorFilter);
    }

    // Request filter
    if (requestFilter !== "All") {
      result = result.filter((q) => q.requestId === requestFilter);
    }

    // Quality Score filter
    if (qualityFilter !== "All") {
      if (qualityFilter === "90+") result = result.filter((q) => q.qualityScore >= 90);
      else if (qualityFilter === "75-89") result = result.filter((q) => q.qualityScore >= 75 && q.qualityScore <= 89);
      else if (qualityFilter === "<75") result = result.filter((q) => q.qualityScore < 75);
    }

    // Delivery days filter
    if (deliveryFilter !== "All") {
      if (deliveryFilter === "<3 days") result = result.filter((q) => q.deliveryDays <= 3);
      else if (deliveryFilter === "<7 days") result = result.filter((q) => q.deliveryDays <= 7);
      else if (deliveryFilter === "7+ days") result = result.filter((q) => q.deliveryDays > 7);
    }

    // Amount Filter
    if (amountFilter !== "All") {
      if (amountFilter === "<5L") result = result.filter((q) => q.totalAmount < 500000);
      else if (amountFilter === "5L - 10L") result = result.filter((q) => q.totalAmount >= 500000 && q.totalAmount <= 1000000);
      else if (amountFilter === "10L+") result = result.filter((q) => q.totalAmount > 1000000);
    }

    // Quick Chips Filter logic
    if (selectedQuickChip) {
      if (selectedQuickChip === "Lowest Cost") {
        // Filter by lowest cost for each unique request
        const requestLowestCosts: Record<string, number> = {};
        quotations.forEach(q => {
          if (!requestLowestCosts[q.requestId] || q.totalAmount < requestLowestCosts[q.requestId]) {
            requestLowestCosts[q.requestId] = q.totalAmount;
          }
        });
        result = result.filter(q => q.totalAmount === requestLowestCosts[q.requestId]);
      } else if (selectedQuickChip === "High Quality") {
        result = result.filter(q => q.qualityScore >= 90);
      } else if (selectedQuickChip === "Fast Delivery") {
        result = result.filter(q => q.deliveryDays <= 3);
      } else if (selectedQuickChip === "Awaiting Review") {
        result = result.filter(q => q.status === "Received");
      } else if (selectedQuickChip === "Shortlisted") {
        result = result.filter(q => ["Shortlisted", "Recommended"].includes(q.status));
      }
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortField as keyof typeof a];
      let bVal = b[sortField as keyof typeof b];

      // fallback checks
      if (sortField === "vendor") {
        aVal = a.vendorName || "";
        bVal = b.vendorName || "";
      } else if (sortField === "request") {
        aVal = a.requestTitle || "";
        bVal = b.requestTitle || "";
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      if (typeof aVal === "number") {
        return sortDirection === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }

      return 0;
    });

    return result;
  }, [
    quotations,
    searchTerm,
    statusFilter,
    vendorFilter,
    requestFilter,
    qualityFilter,
    deliveryFilter,
    amountFilter,
    selectedQuickChip,
    sortField,
    sortDirection,
  ]);

  // Export to CSV helper
  const handleExportCSV = () => {
    if (!filteredQuotations.length) return;
    const headers = ["Quote ID", "Vendor", "Request", "Amount", "Delivery Days", "Quality Score", "Payment Terms", "Submitted Date", "Status"];
    const rows = filteredQuotations.map((q) => [
      q.id,
      q.vendorName || "",
      q.requestTitle || "",
      q.totalAmount,
      q.deliveryDays,
      q.qualityScore,
      q.paymentTerms,
      q.submittedAt || q.createdAt,
      q.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quotation_intelligence_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setVendorFilter("All");
    setRequestFilter("All");
    setQualityFilter("All");
    setDeliveryFilter("All");
    setAmountFilter("All");
    setSelectedQuickChip(null);
  };

  // Lowest amount in currently filtered view
  const minAmountForFiltered = useMemo(() => {
    if (!filteredQuotations.length) return null;
    return Math.min(...filteredQuotations.map(q => q.totalAmount));
  }, [filteredQuotations]);

  // Highest quality in currently filtered view
  const maxQualityForFiltered = useMemo(() => {
    if (!filteredQuotations.length) return null;
    return Math.max(...filteredQuotations.map(q => q.qualityScore));
  }, [filteredQuotations]);

  // Fastest delivery in currently filtered view
  const minDeliveryForFiltered = useMemo(() => {
    if (!filteredQuotations.length) return null;
    return Math.min(...filteredQuotations.map(q => q.deliveryDays));
  }, [filteredQuotations]);

  // Paginated data
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuotations.slice(start, start + pageSize);
  }, [filteredQuotations, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredQuotations.length / pageSize) || 1;

  if (query.isLoading || requestsQuery.isLoading || vendorsQuery.isLoading) {
    return <EnterprisePageLoader title="Quotation Intelligence Center" variant="table" />;
  }

  if (query.error || requestsQuery.error || vendorsQuery.error || !query.data || !requestsQuery.data || !vendorsQuery.data) {
    return <ErrorStateCard message="Quotation Intelligence data could not be fetched." />;
  }

  return (
    <section className="space-y-8 pb-12">
      {/* 1. EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-soft pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
              <Building className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              Quotation Intelligence Center
            </h1>
          </div>
          <p className="text-body text-text-secondary max-w-3xl">
            Analyze supplier quotations, compare commercial terms, evaluate vendor performance, and identify optimal procurement decisions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-border-soft hover:bg-hover"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["erp-quotations"] })}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 border-border-soft hover:bg-hover"
            onClick={handleExportCSV}
            disabled={!filteredQuotations.length}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 border-accent-primary text-accent-primary hover:bg-accent-primary/10"
            onClick={() => {
              const element = document.getElementById("comparison-center");
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Compare Vendors
          </Button>
          <Button
            className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary-hover text-white shadow-lg"
            onClick={() => setDrawerOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Quotations */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-br from-surface to-surface-secondary/40 border-border-soft">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Quotations</p>
                <h3 className="text-3xl font-bold mt-1 text-text-primary">{stats.total}</h3>
              </div>
              <span className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                <FileText className="h-5 w-5" />
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                <span className="text-emerald-500 font-bold flex items-center">
                  <ArrowUpRight className="h-3 w-3 inline" /> +12%
                </span>
                from last month
              </span>
              <Sparkline data={[12, 14, 15, 18, 16, 21, 23, 20, 24, 25, 27]} positive={true} />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Received */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-br from-surface to-surface-secondary/40 border-border-soft">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Received Quotes</p>
                <h3 className="text-3xl font-bold mt-1 text-text-primary">{stats.received}</h3>
              </div>
              <span className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500">
                <Clock className="h-5 w-5" />
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                <span className="text-emerald-500 font-bold flex items-center">
                  <ArrowUpRight className="h-3 w-3" /> +5%
                </span>
                pending review
              </span>
              <Sparkline data={[8, 10, 11, 9, 12, 15, 14, 16, 15]} positive={true} />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Shortlisted */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-br from-surface to-surface-secondary/40 border-border-soft">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Shortlisted Quotes</p>
                <h3 className="text-3xl font-bold mt-1 text-text-primary">{stats.shortlisted}</h3>
              </div>
              <span className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Award className="h-5 w-5" />
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                <span className="text-emerald-500 font-bold flex items-center">
                  <ArrowUpRight className="h-3 w-3" /> +18%
                </span>
                conversion rate
              </span>
              <Sparkline data={[3, 5, 4, 7, 6, 8, 9, 10, 12, 11, 14]} positive={true} />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Accepted */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-br from-surface to-surface-secondary/40 border-border-soft">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Accepted Quotes</p>
                <h3 className="text-3xl font-bold mt-1 text-text-primary">{stats.accepted}</h3>
              </div>
              <span className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                <span className="text-emerald-500 font-bold flex items-center">
                  <ArrowUpRight className="h-3 w-3" /> +8%
                </span>
                PO generation ready
              </span>
              <Sparkline data={[2, 3, 2, 4, 5, 6, 5, 8]} positive={true} />
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Rejected */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-br from-surface to-surface-secondary/40 border-border-soft">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Rejected Quotes</p>
                <h3 className="text-3xl font-bold mt-1 text-text-primary">{stats.rejected}</h3>
              </div>
              <span className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
                <XCircle className="h-5 w-5" />
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                <span className="text-red-500 font-bold flex items-center">
                  <ArrowDownRight className="h-3 w-3" /> -4%
                </span>
                declined submittals
              </span>
              <Sparkline data={[5, 4, 3, 4, 2, 3, 2]} positive={false} />
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Average Quote Value */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-br from-surface to-surface-secondary/40 border-border-soft">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Avg Quote Value</p>
                <h3 className="text-2xl font-bold mt-1 text-text-primary">{formatCurrency(stats.avgAmount)}</h3>
              </div>
              <span className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                <IndianRupee className="h-5 w-5" />
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                <span className="text-emerald-500 font-bold flex items-center text-xs">
                  savings from budget
                </span>
              </span>
              <Sparkline data={[420, 390, 410, 380, 370, 390, 360, 350]} positive={true} />
            </div>
          </CardContent>
        </Card>

        {/* Card 7: Average Quality Score */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-br from-surface to-surface-secondary/40 border-border-soft">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Avg Quality Score</p>
                <h3 className="text-3xl font-bold mt-1 text-text-primary">{stats.avgQuality.toFixed(1)}%</h3>
              </div>
              <span className="p-2.5 rounded-lg bg-teal-500/10 text-teal-500">
                <Award className="h-5 w-5" />
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                <span className="text-emerald-500 font-bold flex items-center text-xs">
                  High quality standards
                </span>
              </span>
              <Sparkline data={[78, 80, 81, 83, 82, 85, 84, 86]} positive={true} />
            </div>
          </CardContent>
        </Card>

        {/* Card 8: Average Delivery Time */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-br from-surface to-surface-secondary/40 border-border-soft">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Avg Delivery Time</p>
                <h3 className="text-3xl font-bold mt-1 text-text-primary">{stats.avgDelivery.toFixed(1)} Days</h3>
              </div>
              <span className="p-2.5 rounded-lg bg-violet-500/10 text-violet-500">
                <Zap className="h-5 w-5" />
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
                <span className="text-emerald-500 font-bold flex items-center text-xs">
                  Faster than average
                </span>
              </span>
              <Sparkline data={[6.2, 5.8, 5.5, 4.9, 5.1, 4.6, 4.2]} positive={true} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. PROCUREMENT ANALYTICS DASHBOARD (2x2 Chart Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: Vendor Price Comparison (Horizontal Bar Chart) */}
        <Card className="border-border-soft shadow-sm bg-gradient-to-b from-surface to-surface-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-text-primary">Vendor Price Comparison</CardTitle>
              <p className="text-xs text-text-secondary">Lowest to highest commercial quote comparison</p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-accent-primary/10 text-accent-primary font-semibold rounded-full">
              Minimum Quote
            </span>
          </CardHeader>
          <CardContent className="h-[280px]">
            {priceComparisonData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priceComparisonData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" tickFormatter={(val) => `₹${val / 1000}k`} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#94a3b8"
                    width={90}
                    style={{ fontSize: 10 }}
                    tickFormatter={(name) => name.length > 12 ? `${name.slice(0, 12)}...` : name}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value), "Commercial Quote"]}
                    contentStyle={{ borderRadius: "var(--radius-input)", border: "1px solid var(--border-soft)", background: "rgba(255,255,255,0.95)" }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14}>
                    {priceComparisonData.map((entry, index) => {
                      // Highlight lowest and highest
                      const isLowest = index === 0;
                      const isHighest = index === priceComparisonData.length - 1;
                      let color = "#3b82f6"; // standard blue
                      if (isLowest) color = "#10b981"; // success green
                      else if (isHighest) color = "#ef4444"; // danger red
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary text-sm">
                No vendor data found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* CARD 2: Quality Score Distribution (Donut Chart) */}
        <Card className="border-border-soft shadow-sm bg-gradient-to-b from-surface to-surface-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-text-primary">Quality Score Distribution</CardTitle>
              <p className="text-xs text-text-secondary">Supplier reliability categorizations</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-teal-500/10 text-teal-600 rounded-full">
              Avg Quality: {stats.avgQuality.toFixed(0)}%
            </span>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center relative">
            {qualityDistributionData.length ? (
              <div className="w-full flex flex-col sm:flex-row items-center justify-around">
                <div className="w-[180px] h-[180px] relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={qualityDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {qualityDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Quality KPI */}
                  <div className="absolute text-center flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-text-primary">
                      {stats.avgQuality.toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                      Avg Score
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 min-w-[150px] mt-4 sm:mt-0">
                  {qualityDistributionData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-text-secondary font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-text-primary">{item.value} quotes</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm">
                No quality data available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* CARD 3: Delivery Performance Analysis (Bar Chart) */}
        <Card className="border-border-soft shadow-sm bg-gradient-to-b from-surface to-surface-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-text-primary">Delivery Lead Times (Days)</CardTitle>
              <p className="text-xs text-text-secondary">Vendor compared to speed metrics</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-violet-500/10 text-violet-600 rounded-full">
              Avg Days: {stats.avgDelivery.toFixed(1)}d
            </span>
          </CardHeader>
          <CardContent className="h-[280px]">
            {deliveryPerformanceData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deliveryPerformanceData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    style={{ fontSize: 9 }}
                    tickFormatter={(name) => name.length > 10 ? `${name.slice(0, 10)}...` : name}
                  />
                  <YAxis stroke="#94a3b8" label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#94a3b8' } }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} Days`, "Lead Time"]}
                    contentStyle={{ borderRadius: "var(--radius-input)", border: "1px solid var(--border-soft)", background: "rgba(255,255,255,0.95)" }}
                  />
                  <Bar dataKey="days" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20}>
                    {deliveryPerformanceData.map((entry, index) => {
                      const isFastest = index === 0;
                      const isSlowest = index === deliveryPerformanceData.length - 1;
                      let color = "#8b5cf6";
                      if (isFastest) color = "#10b981"; // Fastest (Green)
                      else if (isSlowest) color = "#ef4444"; // Slowest (Red)
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary text-sm">
                No delivery details available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* CARD 4: Quotation Status Funnel */}
        <Card className="border-border-soft shadow-sm bg-gradient-to-b from-surface to-surface-secondary/20">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-text-primary">Quotation Conversion Funnel</CardTitle>
            <p className="text-xs text-text-secondary">Progress flow of supplier quotations</p>
          </CardHeader>
          <CardContent className="h-[280px] flex flex-col justify-center space-y-4">
            <div className="space-y-3 px-2">
              {funnelStages.map((stage, index) => {
                // Determine width based on percentage
                const widthStyle = `${Math.max(25, stage.percentage)}%`;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-text-primary flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                        {stage.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary font-medium">{stage.count} quotes</span>
                        <span className="font-bold text-text-primary">({stage.percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-7 w-full bg-hover/30 rounded-md overflow-hidden flex items-center px-3 border border-dashed border-border-soft relative">
                      <div
                        className={`absolute left-0 top-0 bottom-0 rounded-r-md border-r-2 transition-all duration-500 ${stage.color}`}
                        style={{ width: widthStyle }}
                      />
                      <span className="relative z-10 text-[10px] font-bold text-text-primary uppercase tracking-wider">
                        {stage.name === "Received" ? "Inbound submissions" : `Conversion: ${stage.percentage}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. PROCUREMENT INSIGHTS ENGINE */}
      <Card className="border-accent-primary/20 bg-gradient-to-br from-surface to-accent-primary/[0.02] shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="pb-3 border-b border-border-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-lg font-bold text-text-primary">Sourcing Intelligence Center</CardTitle>
                <p className="text-xs text-text-secondary">AI-generated recommendations and purchasing insights</p>
              </div>
            </div>
            <Badge tone="success" className="px-3 py-1 font-bold">
              6 Active Insights
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Recommendation 1 */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Quality Alert
                  </Badge>
                  <span className="text-[10px] text-text-secondary font-medium">Updated just now</span>
                </div>
                <h4 className="font-bold text-sm text-text-primary">ABC Traders outperforms on quality</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Vendor rating stands at 93% average. Recommended for high-specification deliverables on Tower A and Tower B.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/5 justify-start text-xs font-semibold p-0 w-max"
                onClick={() => setSearchTerm("ABC Traders")}
              >
                View ABC Traders Quotes &rarr;
              </Button>
            </div>

            {/* Recommendation 2 */}
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.02] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-500/10 text-blue-500 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Savings Opportunity
                  </Badge>
                  <span className="text-[10px] text-text-secondary font-medium">Commercial</span>
                </div>
                <h4 className="font-bold text-sm text-text-primary">Metro Steel offers lowest cost</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Metro Steel quotations are consistently 8-10% below average market indices. Saving potential identified.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/5 justify-start text-xs font-semibold p-0 w-max"
                onClick={() => setSearchTerm("Metro Steel")}
              >
                Verify Metro Steel commercial value &rarr;
              </Button>
            </div>

            {/* Recommendation 3 */}
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-500/10 text-amber-500 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Market Alert
                  </Badge>
                  <span className="text-[10px] text-text-secondary font-medium">Commodity Trend</span>
                </div>
                <h4 className="font-bold text-sm text-text-primary">Steel category quotes rise 24%</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Global iron ore cost spikes have affected subcontractor bid rates. Secure commitments quickly before rates roll.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/5 justify-start text-xs font-semibold p-0 w-max"
                onClick={() => {
                  setSearchTerm("Steel");
                  const tableEl = document.getElementById("quotation-table");
                  if (tableEl) tableEl.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Review all Steel quotes &rarr;
              </Button>
            </div>

            {/* Recommendation 4 */}
            <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.02] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge className="bg-violet-500/10 text-violet-500 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Attention Required
                  </Badge>
                  <span className="text-[10px] text-text-secondary font-medium">3 Pending</span>
                </div>
                <h4 className="font-bold text-sm text-text-primary">3 quotes require immediate review</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Quotations from SteelCo and cement suppliers remain inReceived state beyond target review duration.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-violet-500 hover:text-violet-600 hover:bg-violet-500/5 justify-start text-xs font-semibold p-0 w-max"
                onClick={() => {
                  setStatusFilter("Received");
                  const tableEl = document.getElementById("quotation-table");
                  if (tableEl) tableEl.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Filter Awaiting Review &rarr;
              </Button>
            </div>

            {/* Recommendation 5 */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Savings Identified
                  </Badge>
                  <span className="text-[10px] text-text-secondary font-medium">CFO Dashboard</span>
                </div>
                <h4 className="font-bold text-sm text-text-primary">₹12.4L Potential Savings Found</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Comparing current active quotations against budget items reveals an opportunity to re-negotiate high-margin items.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/5 justify-start text-xs font-semibold p-0 w-max"
                onClick={() => setSelectedQuickChip("Lowest Cost")}
              >
                Analyze Lowest Costs &rarr;
              </Button>
            </div>

            {/* Recommendation 6 */}
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.02] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge className="bg-indigo-500/10 text-indigo-500 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Supplier Index
                  </Badge>
                  <span className="text-[10px] text-text-secondary font-medium">Analytics</span>
                </div>
                <h4 className="font-bold text-sm text-text-primary">2 vendors outperform market average</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  ABC Traders and cement supplies record reliability score &gt;90% and lead times 2 days lower than category median.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/5 justify-start text-xs font-semibold p-0 w-max"
                onClick={() => setSearchTerm("ABC Traders")}
              >
                Compare Top Performers &rarr;
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. VENDOR COMPARISON CENTER */}
      <Card id="comparison-center" className="border-border-soft shadow-sm bg-gradient-to-br from-surface to-surface-secondary/10">
        <CardHeader className="pb-3 border-b border-border-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-accent-primary" />
              Side-by-Side Sourcing Matrix
            </CardTitle>
            <p className="text-xs text-text-secondary">Select an active purchase request to compare bids across critical scoring categories</p>
          </div>
          <div className="w-full sm:w-[280px]">
            <select
              value={compareRequestId}
              onChange={(e) => setCompareRequestId(e.target.value)}
              className={selectClassName}
            >
              <option value="" disabled>Select a purchase request...</option>
              {requestsQuery.data.requests.map((req) => (
                <option key={req.id} value={req.id}>{req.title}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {compareRequestId ? (
            compareQuotations.length ? (
              <div className="space-y-6">
                {/* Visual side-by-side grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card A: Best Price */}
                  <Card className="border-emerald-500/20 bg-emerald-500/[0.01]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-secondary uppercase">Best Price Bid</span>
                        <Badge className="bg-emerald-500 text-white font-bold px-2 py-0.5 text-[9px] uppercase">Lowest Cost</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="text-base font-bold text-text-primary">{comparisonStats?.bestPrice.vendorName}</h4>
                        <p className="text-2xl font-extrabold text-emerald-500 mt-1">
                          {formatCurrency(comparisonStats?.bestPrice.totalAmount || 0)}
                        </p>
                      </div>
                      <div className="text-xs space-y-1.5 border-t border-border-soft pt-2 text-text-secondary">
                        <p className="flex justify-between"><span>Lead Time:</span> <span className="font-semibold text-text-primary">{comparisonStats?.bestPrice.deliveryDays} Days</span></p>
                        <p className="flex justify-between"><span>Quality Score:</span> <span className="font-semibold text-text-primary">{comparisonStats?.bestPrice.qualityScore}%</span></p>
                        <p className="flex justify-between"><span>Terms:</span> <span className="font-semibold text-text-primary truncate max-w-[120px]" title={comparisonStats?.bestPrice.paymentTerms}>{comparisonStats?.bestPrice.paymentTerms}</span></p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => router.push(`/purchases/quotations/${comparisonStats?.bestPrice.id}`)}
                      >
                        Analyze Bid
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Card B: Fastest Delivery */}
                  <Card className="border-blue-500/20 bg-blue-500/[0.01]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-secondary uppercase">Fastest Delivery</span>
                        <Badge className="bg-blue-500 text-white font-bold px-2 py-0.5 text-[9px] uppercase">Speed Lead</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="text-base font-bold text-text-primary">{comparisonStats?.fastest.vendorName}</h4>
                        <p className="text-2xl font-extrabold text-blue-500 mt-1">
                          {comparisonStats?.fastest.deliveryDays} Days
                        </p>
                      </div>
                      <div className="text-xs space-y-1.5 border-t border-border-soft pt-2 text-text-secondary">
                        <p className="flex justify-between"><span>Quote Amount:</span> <span className="font-semibold text-text-primary">{formatCurrency(comparisonStats?.fastest.totalAmount || 0)}</span></p>
                        <p className="flex justify-between"><span>Quality Score:</span> <span className="font-semibold text-text-primary">{comparisonStats?.fastest.qualityScore}%</span></p>
                        <p className="flex justify-between"><span>Terms:</span> <span className="font-semibold text-text-primary truncate max-w-[120px]" title={comparisonStats?.fastest.paymentTerms}>{comparisonStats?.fastest.paymentTerms}</span></p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => router.push(`/purchases/quotations/${comparisonStats?.fastest.id}`)}
                      >
                        Analyze Bid
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Card C: Highest Quality */}
                  <Card className="border-amber-500/20 bg-amber-500/[0.01]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-secondary uppercase">Highest Quality</span>
                        <Badge className="bg-amber-500 text-white font-bold px-2 py-0.5 text-[9px] uppercase">Quality Leader</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="text-base font-bold text-text-primary">{comparisonStats?.highestQuality.vendorName}</h4>
                        <p className="text-2xl font-extrabold text-amber-500 mt-1">
                          {comparisonStats?.highestQuality.qualityScore}%
                        </p>
                      </div>
                      <div className="text-xs space-y-1.5 border-t border-border-soft pt-2 text-text-secondary">
                        <p className="flex justify-between"><span>Quote Amount:</span> <span className="font-semibold text-text-primary">{formatCurrency(comparisonStats?.highestQuality.totalAmount || 0)}</span></p>
                        <p className="flex justify-between"><span>Lead Time:</span> <span className="font-semibold text-text-primary">{comparisonStats?.highestQuality.deliveryDays} Days</span></p>
                        <p className="flex justify-between"><span>Terms:</span> <span className="font-semibold text-text-primary truncate max-w-[120px]" title={comparisonStats?.highestQuality.paymentTerms}>{comparisonStats?.highestQuality.paymentTerms}</span></p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => router.push(`/purchases/quotations/${comparisonStats?.highestQuality.id}`)}
                      >
                        Analyze Bid
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Card D: Recommended Sourcing Option */}
                  <Card className="border-accent-primary bg-accent-primary/[0.02] shadow-sm relative">
                    <div className="absolute top-0 right-0 p-1.5">
                      <Bookmark className="h-5 w-5 text-accent-primary fill-accent-primary" />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-accent-primary uppercase tracking-wider">Recommended Sourcing Option</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="text-base font-bold text-text-primary">{comparisonStats?.recommended.vendorName}</h4>
                        <p className="text-xs text-text-secondary mt-0.5">Optimal quality-to-cost sourcing recommendation</p>
                      </div>
                      <div className="text-xs space-y-1.5 border-t border-border-soft pt-2 text-text-secondary">
                        <p className="flex justify-between"><span>Quote Cost:</span> <span className="font-bold text-text-primary">{formatCurrency(comparisonStats?.recommended.totalAmount || 0)}</span></p>
                        <p className="flex justify-between"><span>Lead Time:</span> <span className="font-semibold text-text-primary">{comparisonStats?.recommended.deliveryDays} Days</span></p>
                        <p className="flex justify-between"><span>Quality Score:</span> <span className="font-semibold text-text-primary">{comparisonStats?.recommended.qualityScore}%</span></p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full text-xs bg-accent-primary text-white hover:bg-accent-primary-hover"
                        onClick={() => router.push(`/purchases/quotations/${comparisonStats?.recommended.id}`)}
                      >
                        Approve & Settle Bid
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Sourcing Summary Card */}
                <div className="p-4 rounded-lg bg-surface border border-border-soft flex items-center justify-between flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-full bg-accent-primary/10 text-accent-primary">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-text-primary">Procurement Recommendation Summary</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        We recommend shortlisting <span className="font-semibold text-text-primary">{comparisonStats?.recommended.vendorName}</span> for this request.
                        They represent a {comparisonStats?.recommended.qualityScore}% quality index at {comparisonStats?.recommended.deliveryDays} days delivery,
                        saving you {formatCurrency(Math.max(0, (comparisonStats?.bestPrice.totalAmount || 0) * 1.15 - (comparisonStats?.recommended.totalAmount || 0)))} compared to worst-case commercial estimates.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-accent-primary font-bold hover:bg-accent-primary/10"
                    onClick={() => router.push(`/purchases/quotations/${comparisonStats?.recommended.id}`)}
                  >
                    View Details &rarr;
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-text-secondary text-sm">
                No quotations have been received for this purchase request. Create one using the &quot;New Quotation&quot; action.
              </div>
            )
          ) : (
            <div className="py-8 text-center text-text-secondary text-sm">
              Please select a purchase request to generate comparison data.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. QUOTATION MANAGEMENT TABLE */}
      <Card id="quotation-table" className="border-border-soft shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border-soft">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-text-primary">Quotations Sourcing Ledger</CardTitle>
              <p className="text-xs text-text-secondary">
                Detailed registry of supplier quotations. Filter, search, and sort across all active procurement terms.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Column Visibility Selector */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 border-border-soft hover:bg-hover text-xs"
                  onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Columns
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {showColumnDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg border border-border shadow-lg z-50 p-2 space-y-1">
                    <p className="text-[10px] font-bold text-text-secondary uppercase px-2 py-1">Toggle Columns</p>
                    {Object.keys(visibleColumns).map((col) => (
                      <label key={col} className="flex items-center gap-2 px-2 py-1.5 hover:bg-hover rounded-md text-xs cursor-pointer text-text-primary font-medium">
                        <input
                          type="checkbox"
                          checked={visibleColumns[col as keyof typeof visibleColumns]}
                          onChange={(e) =>
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [col]: e.target.checked,
                            }))
                          }
                          className="rounded border-border-soft text-accent-primary focus:ring-accent-primary"
                        />
                        {col.charAt(0).toUpperCase() + col.slice(1)}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold hover:bg-hover flex items-center gap-1.5 text-text-secondary"
                onClick={handleClearFilters}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Toolbar controls */}
        <div className="p-4 border-b border-border-soft bg-surface-secondary/40 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search vendor, terms, request..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-surface"
              />
            </div>

            {/* Request Filter */}
            <select
              value={requestFilter}
              onChange={(e) => setRequestFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="All">All Requests</option>
              {requestsQuery.data.requests.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>

            {/* Vendor Filter */}
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="All">All Vendors</option>
              {vendorsQuery.data.vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="All">All Statuses</option>
              <option value="Received">Received</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Recommended">Recommended</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Quality Score Range */}
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase px-1">Quality Index</label>
              <select
                value={qualityFilter}
                onChange={(e) => setQualityFilter(e.target.value)}
                className="h-10 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-xs text-text-primary mt-1 focus-visible:outline-none"
              >
                <option value="All">All Scores</option>
                <option value="90+">Excellent (90+)</option>
                <option value="75-89">Good (75-89)</option>
                <option value="<75">Underperforming (&lt;75)</option>
              </select>
            </div>

            {/* Lead Time Range */}
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase px-1">Lead Time Range</label>
              <select
                value={deliveryFilter}
                onChange={(e) => setDeliveryFilter(e.target.value)}
                className="h-10 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-xs text-text-primary mt-1 focus-visible:outline-none"
              >
                <option value="All">All Timelines</option>
                <option value="<3 days">Immediate (&le; 3 Days)</option>
                <option value="<7 days">Fast (&le; 7 Days)</option>
                <option value="7+ days">Extended (&gt; 7 Days)</option>
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase px-1">Amount Range</label>
              <select
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value)}
                className="h-10 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 text-xs text-text-primary mt-1 focus-visible:outline-none"
              >
                <option value="All">All Values</option>
                <option value="<5L">Under ₹5.0L</option>
                <option value="5L - 10L">₹5.0L - ₹10.0L</option>
                <option value="10L+">Over ₹10.0L</option>
              </select>
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-soft/40">
            <span className="text-[11px] font-bold text-text-secondary uppercase mr-1">Quick Filters:</span>
            {[
              { label: "Lowest Cost", chip: "Lowest Cost" },
              { label: "High Quality (90+)", chip: "High Quality" },
              { label: "Fast Delivery (≤3d)", chip: "Fast Delivery" },
              { label: "Awaiting Review", chip: "Awaiting Review" },
              { label: "Shortlisted/Recommended", chip: "Shortlisted" },
            ].map((chip) => {
              const active = selectedQuickChip === chip.chip;
              return (
                <button
                  key={chip.chip}
                  onClick={() => setSelectedQuickChip(active ? null : chip.chip)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? "bg-accent-primary/10 border-accent-primary text-accent-primary shadow-soft"
                      : "bg-surface border-border-soft text-text-secondary hover:bg-hover"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-table border-collapse">
            <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft sticky top-0 z-10">
              <tr className="h-12 text-xs font-bold uppercase tracking-wider">
                {visibleColumns.id && (
                  <th
                    className="px-4 text-left cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => {
                      setSortField("id");
                      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    }}
                  >
                    Quote ID {sortField === "id" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                  </th>
                )}
                {visibleColumns.vendor && (
                  <th
                    className="px-4 text-left cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => {
                      setSortField("vendor");
                      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    }}
                  >
                    Vendor {sortField === "vendor" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                  </th>
                )}
                {visibleColumns.request && (
                  <th
                    className="px-4 text-left cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => {
                      setSortField("request");
                      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    }}
                  >
                    Request {sortField === "request" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                  </th>
                )}
                {visibleColumns.amount && (
                  <th
                    className="px-4 text-right cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => {
                      setSortField("totalAmount");
                      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    }}
                  >
                    Amount {sortField === "totalAmount" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                  </th>
                )}
                {visibleColumns.delivery && (
                  <th
                    className="px-4 text-center cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => {
                      setSortField("deliveryDays");
                      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    }}
                  >
                    Delivery {sortField === "deliveryDays" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                  </th>
                )}
                {visibleColumns.quality && (
                  <th
                    className="px-4 text-center cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => {
                      setSortField("qualityScore");
                      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    }}
                  >
                    Quality {sortField === "qualityScore" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                  </th>
                )}
                {visibleColumns.payment && <th className="px-4 text-left">Payment Terms</th>}
                {visibleColumns.date && (
                  <th
                    className="px-4 text-left cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => {
                      setSortField("submittedAt");
                      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    }}
                  >
                    Submitted {sortField === "submittedAt" && (sortDirection === "asc" ? <ChevronUp className="inline h-3.5 w-3.5" /> : <ChevronDown className="inline h-3.5 w-3.5" />)}
                  </th>
                )}
                {visibleColumns.status && <th className="px-4 text-left">Status</th>}
                {visibleColumns.document && <th className="px-4 text-center">Docs</th>}
                <th className="px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQuotations.length ? (
                paginatedQuotations.map((quotation) => {
                  const isLowestCost = minAmountForFiltered !== null && quotation.totalAmount === minAmountForFiltered;
                  const isHighestQuality = maxQualityForFiltered !== null && quotation.qualityScore === maxQualityForFiltered;
                  const isFastestDelivery = minDeliveryForFiltered !== null && quotation.deliveryDays === minDeliveryForFiltered;

                  return (
                    <tr
                      key={quotation.id}
                      className="border-b border-border-soft hover:bg-hover/40 transition-colors cursor-pointer group h-14"
                      onClick={() => router.push(`/purchases/quotations/${quotation.id}`)}
                    >
                      {visibleColumns.id && (
                        <td className="px-4 py-3 font-semibold text-text-primary text-xs font-mono">
                          {quotation.id}
                        </td>
                      )}
                      {visibleColumns.vendor && (
                        <td className="px-4 py-3">
                          <div className="font-semibold text-text-primary text-sm">{quotation.vendorName}</div>
                          <div className="text-[10px] text-text-secondary mt-0.5">ID: {quotation.vendorId}</div>
                        </td>
                      )}
                      {visibleColumns.request && (
                        <td className="px-4 py-3 text-text-primary text-sm">
                          {quotation.requestTitle}
                        </td>
                      )}
                      {visibleColumns.amount && (
                        <td className={`px-4 py-3 text-right font-bold text-sm ${isLowestCost ? "text-emerald-500 bg-emerald-500/[0.02]" : "text-text-primary"}`}>
                          {formatCurrency(quotation.totalAmount)}
                          {isLowestCost && (
                            <span className="block text-[9px] text-emerald-500 font-bold tracking-tight mt-0.5">
                              ★ Lowest Price
                            </span>
                          )}
                        </td>
                      )}
                      {visibleColumns.delivery && (
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${isFastestDelivery ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-surface border border-border-soft text-text-primary"}`}>
                            {quotation.deliveryDays} Days
                          </span>
                        </td>
                      )}
                      {visibleColumns.quality && (
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-extrabold ${isHighestQuality ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-soft" : "bg-surface border border-border-soft text-text-secondary"}`}>
                            {quotation.qualityScore}%
                          </span>
                        </td>
                      )}
                      {visibleColumns.payment && (
                        <td className="px-4 py-3 text-xs text-text-secondary max-w-[150px] truncate" title={quotation.paymentTerms}>
                          {quotation.paymentTerms}
                        </td>
                      )}
                      {visibleColumns.date && (
                        <td className="px-4 py-3 text-xs text-text-secondary">
                          {formatDate(quotation.submittedAt || quotation.createdAt || "")}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="px-4 py-3">
                          <Badge tone={toneForStatus(quotation.status)} className="font-bold text-[10px] tracking-wide uppercase">
                            {quotation.status}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.document && (
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {quotation.documentUrl ? (
                            <a
                              href={quotation.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex p-1.5 rounded-lg bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20"
                              title={quotation.documentName || "View Document"}
                            >
                              <FileCheck className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-text-muted text-xs font-bold">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs font-bold text-accent-primary hover:bg-accent-primary/10 px-2 py-1 rounded"
                          onClick={() => router.push(`/purchases/quotations/${quotation.id}`)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-text-secondary text-sm font-medium">
                    No matching quotations found. Try adjusting your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border-soft flex items-center justify-between flex-wrap gap-4 bg-surface-secondary/20">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 rounded border border-border-soft bg-surface px-2 focus:outline-none"
            >
              <option value="10">10 Rows</option>
              <option value="20">20 Rows</option>
              <option value="50">50 Rows</option>
              <option value="100">100 Rows</option>
            </select>
            <span>of <span className="font-bold text-text-primary">{filteredQuotations.length}</span> results</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="border-border-soft h-8 text-xs font-semibold px-3"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "primary" : "outline"}
                size="sm"
                className={`h-8 w-8 text-xs font-bold p-0 ${
                  currentPage === page ? "bg-accent-primary text-white" : "border-border-soft hover:bg-hover"
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="border-border-soft h-8 text-xs font-semibold px-3"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* 8. ADD QUOTATION DRAWER */}
      <Drawer
        open={drawerOpen}
        title="Register Supplier Quotation"
        size="lg"
        onClose={() => setDrawerOpen(false)}
      >
        <div className="space-y-6 pb-24 pr-1">
          <p className="text-xs text-text-secondary border-b border-border-soft pb-3">
            Add supplier quote parameters to enable comparison indices, analytics distributions, and AI scoring recommendations.
          </p>

          {/* Section A: Vendor & Request */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
              Sourcing Context
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Select Purchase Request</label>
                <select
                  value={form.requestId}
                  onChange={(e) => setForm((c) => ({ ...c, requestId: e.target.value }))}
                  className={selectClassName}
                >
                  {requestsQuery.data.requests.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Select Vendor / Supplier</label>
                <select
                  value={form.vendorId}
                  onChange={(e) => setForm((c) => ({ ...c, vendorId: e.target.value }))}
                  className={selectClassName}
                >
                  {vendorsQuery.data.vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section B: Commercial Terms */}
          <div className="space-y-4 pt-4 border-t border-border-soft/60">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
              Commercial & Lead Terms
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Total Quote Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-text-muted font-bold text-sm">₹</span>
                  <Input
                    placeholder="Enter total gross quotation amount"
                    value={form.totalAmount}
                    onChange={(e) => setForm((c) => ({ ...c, totalAmount: e.target.value }))}
                    className="pl-7"
                    type="number"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Expected Delivery Days</label>
                <Input
                  placeholder="Enter expected delivery lead time in days"
                  value={form.deliveryDays}
                  onChange={(e) => setForm((c) => ({ ...c, deliveryDays: e.target.value }))}
                  type="number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Quality Rating Score (50 - 100)</label>
                <Input
                  placeholder="Audit inspection score (e.g. 85)"
                  value={form.qualityScore}
                  onChange={(e) => setForm((c) => ({ ...c, qualityScore: e.target.value }))}
                  type="number"
                  min="50"
                  max="100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-label text-text-secondary">Commercial Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
                  className={selectClassName}
                >
                  <option value="Received">Received</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Recommended">Recommended</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-label text-text-secondary">Commercial Payment Terms</label>
              <Input
                placeholder="e.g. 30% advance, balance on delivery"
                value={form.paymentTerms}
                onChange={(e) => setForm((c) => ({ ...c, paymentTerms: e.target.value }))}
              />
            </div>
          </div>

          {/* Section C: Document Upload & Notes */}
          <div className="space-y-4 pt-4 border-t border-border-soft/60">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
              Document Attachments & Notes
            </h4>

            {/* Drag and Drop Document Area */}
            <div className="space-y-2">
              <label className="text-label text-text-secondary">Upload Supplier PDF Quotation</label>
              <div className="border-2 border-dashed border-border-soft rounded-xl p-6 hover:bg-hover/20 transition-colors relative flex flex-col items-center justify-center text-center">
                <input
                  type="file"
                  accept=".pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <div className="p-3 bg-accent-primary/10 text-accent-primary rounded-full mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-text-primary">Drag & drop quotation PDF here, or click to browse</p>
                <p className="text-xs text-text-secondary mt-1">Accepts PDF format (Max size: 10MB)</p>
              </div>

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="p-3 bg-surface border border-border-soft rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary font-medium">Uploading supplier document...</span>
                    <span className="font-bold text-accent-primary">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-hover h-2 rounded-full overflow-hidden">
                    <div className="bg-accent-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Uploaded File Chip */}
              {uploadedFile && (
                <div className="p-3 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded bg-emerald-500/10 text-emerald-500">
                      <FileCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-text-primary truncate max-w-[200px]">{uploadedFile.name}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">{(uploadedFile.size / 1024).toFixed(1)} KB &bull; Uploaded Successfully</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 text-text-muted hover:text-red-500 h-max w-max"
                    onClick={removeUploadedFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-label text-text-secondary">Sourcing Notes / Remarks</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
                className="w-full h-24 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary focus-visible:outline-none"
                placeholder="Add special notes, delivery remarks, audit conditions, etc."
              />
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border-soft bg-surface sticky bottom-0 z-10">
            <Button
              variant="ghost"
              className="border-border-soft hover:bg-hover font-semibold"
              onClick={() => setDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="bg-accent-primary text-white hover:bg-accent-primary-hover px-5 font-bold shadow-md"
            >
              Save Quotation
            </Button>
          </div>
        </div>
      </Drawer>
    </section>
  );
}
