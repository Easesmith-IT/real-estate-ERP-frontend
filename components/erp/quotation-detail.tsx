"use client";

import { useState, useMemo } from "react";
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
  SlidersHorizontal,
  ChevronLeft,
  Search,
  Upload,
  X,
  FileCheck,
  Building,
  Calendar,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Printer,
  Download,
  Activity,
  User,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  Info,
  Check,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatCurrency, formatDate, toneForStatus } from "@/lib/erp-utils";
import type {
  QuotationsResponse,
  PurchaseRequestsResponse,
  VendorsResponse,
} from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { SectionHeader } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from "recharts";

export function QuotationDetailWorkspace({ quotationId }: { quotationId: string }) {
  const role = useUiStore((state) => state.role);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"overview" | "comparison" | "pdf">("overview");

  // PDF Viewer Zoom State
  const [zoomScale, setZoomScale] = useState(100);

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

  // Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) =>
      apiRequest(`/api/procurement/quotations/${quotationId}`, {
        role,
        method: "PATCH",
        body: { status: newStatus },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-quotations"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
      ]);
    },
  });

  // Compute Active Quotation Data
  const quotations = query.data?.quotations || [];
  const quotation = useMemo(() => {
    return quotations.find((q) => q.id === quotationId);
  }, [quotations, quotationId]);

  const vendor = useMemo(() => {
    if (!quotation || !vendorsQuery.data) return null;
    return vendorsQuery.data.vendors.find((v) => v.id === quotation.vendorId);
  }, [quotation, vendorsQuery.data]);

  const request = useMemo(() => {
    if (!quotation || !requestsQuery.data) return null;
    return requestsQuery.data.requests.find((r) => r.id === quotation.requestId);
  }, [quotation, requestsQuery.data]);

  // Competitive quotes (bids submitted for the same purchase request)
  const competitiveQuotes = useMemo(() => {
    if (!quotation) return [];
    return quotations.filter((q) => q.requestId === quotation.requestId);
  }, [quotations, quotation]);

  // Sourcing highlights
  const highlights = useMemo(() => {
    if (!competitiveQuotes.length) return null;

    let lowestPrice = competitiveQuotes[0];
    let highestQuality = competitiveQuotes[0];
    let fastestDelivery = competitiveQuotes[0];

    competitiveQuotes.forEach((q) => {
      if (q.totalAmount < lowestPrice.totalAmount) lowestPrice = q;
      if (q.qualityScore > highestQuality.qualityScore) highestQuality = q;
      if (q.deliveryDays < fastestDelivery.deliveryDays) fastestDelivery = q;
    });

    // Simple value score: quality score / total amount ratio
    let recommended = competitiveQuotes.find(q => q.status === "Recommended");
    if (!recommended) {
      let bestScore = -1;
      competitiveQuotes.forEach((q) => {
        const score = (q.qualityScore * 1000000) / q.totalAmount;
        if (score > bestScore) {
          bestScore = score;
          recommended = q;
        }
      });
    }

    return {
      lowestPrice,
      highestQuality,
      fastestDelivery,
      recommended: recommended || lowestPrice,
    };
  }, [competitiveQuotes]);

  // Delivery comparison data for Recharts
  const chartData = useMemo(() => {
    return competitiveQuotes.map((q) => ({
      name: q.vendorName || "Unknown",
      amount: q.totalAmount,
      days: q.deliveryDays,
      quality: q.qualityScore,
    })).sort((a, b) => a.amount - b.amount);
  }, [competitiveQuotes]);

  // Handle Loading & Error States
  if (query.isLoading || requestsQuery.isLoading || vendorsQuery.isLoading) {
    return <LoadingStateCard title={`Loading Quotation Sourcing analysis`} />;
  }

  if (query.error || !query.data || !quotation) {
    return <ErrorStateCard message={`Quotation ID "${quotationId}" was not found or is unavailable.`} />;
  }

  return (
    <section className="space-y-6 pb-12">
      {/* Back to Ledger button */}
      <div className="flex items-center justify-between">
        <Link
          href="/purchases/quotations"
          className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors bg-surface-secondary/40 border border-border-soft px-3 py-1.5 rounded-lg"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Quotations Center
        </Link>

        {/* Current status display */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-medium">Sourcing Status:</span>
          <Badge tone={toneForStatus(quotation.status)} className="font-bold uppercase tracking-wider text-[10px]">
            {quotation.status}
          </Badge>
        </div>
      </div>

      {/* Title block */}
      <div className="border-b border-border-soft pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-text-primary flex items-center gap-2">
              Quotation Analysis: {quotation.id}
            </h1>
            <p className="text-sm text-text-secondary">
              Reviewing commercial terms from <span className="font-semibold text-text-primary">{quotation.vendorName}</span> for <span className="font-semibold text-text-primary">{quotation.requestTitle}</span>.
            </p>
          </div>

          {/* Quick print actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs hover:bg-hover border-border-soft"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" />
              Print Review
            </Button>
            {quotation.documentUrl && (
              <a
                href={quotation.documentUrl}
                download={quotation.documentName || "quotation.pdf"}
                className="inline-flex h-9 items-center justify-center gap-1.5 text-xs font-bold bg-accent-primary text-white hover:bg-accent-primary-hover px-4 rounded-md shadow"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-soft">
        {[
          { id: "overview", label: "Quotation Overview", icon: FileText },
          { id: "comparison", label: "Competitive Comparison Matrix", icon: SlidersHorizontal },
          { id: "pdf", label: "Attached PDF Document", icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors -mb-[2px] ${
                active
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6">
          <div className="space-y-6">
            {/* Section A: Commercial Overview Card */}
            <Card className="border-border-soft shadow-sm bg-gradient-to-br from-surface to-surface-secondary/10">
              <CardHeader className="pb-3 border-b border-border-soft">
                <CardTitle className="text-base font-bold text-text-primary">Commercial Terms & Scope</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Gross Quote Amount</span>
                    <h3 className="text-2xl font-extrabold text-accent-primary mt-1">
                      {formatCurrency(quotation.totalAmount)}
                    </h3>
                    {highlights?.lowestPrice.id === quotation.id && (
                      <span className="inline-flex mt-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        ★ Lowest Price
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Delivery Lead Time</span>
                    <h3 className="text-xl font-bold text-text-primary mt-1">
                      {quotation.deliveryDays} Days
                    </h3>
                    {highlights?.fastestDelivery.id === quotation.id && (
                      <span className="inline-flex mt-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        ⚡ Fastest Delivery
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Quality Score Rating</span>
                    <h3 className="text-xl font-bold text-text-primary mt-1">
                      {quotation.qualityScore}%
                    </h3>
                    {highlights?.highestQuality.id === quotation.id && (
                      <span className="inline-flex mt-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        ✦ Quality Leader
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border-soft/60">
                  <div className="space-y-1.5 text-sm">
                    <p className="flex justify-between">
                      <span className="text-text-secondary">Commercial Terms:</span>
                      <span className="font-semibold text-text-primary">{quotation.paymentTerms || "Not Specified"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-text-secondary">Submitted At:</span>
                      <span className="font-semibold text-text-primary">{formatDate((quotation.submittedAt || (quotation as any).createdAt || "") as string)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-text-secondary">Purchase Request ID:</span>
                      <span className="font-semibold text-text-primary font-mono">{quotation.requestId}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-surface border border-border-soft text-xs text-text-secondary space-y-1">
                    <span className="font-bold text-text-primary uppercase tracking-wide">Procurement Notes:</span>
                    <p className="leading-relaxed">
                      {quotation.notes || "No additional sourcing conditions or audit remarks were attached to this quotation record."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section B: Vendor Evaluation Card */}
            <Card className="border-border-soft shadow-sm">
              <CardHeader className="pb-3 border-b border-border-soft">
                <CardTitle className="text-base font-bold text-text-primary">Supplier Intelligence Scorecard</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {vendor ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="p-3 bg-accent-primary/10 text-accent-primary rounded-xl">
                        <Building className="h-6 w-6" />
                      </span>
                      <div>
                        <h4 className="text-lg font-bold text-text-primary">{vendor.name}</h4>
                        <p className="text-xs text-text-secondary">Category: {vendor.category} &bull; Sourcing Partner ID: {vendor.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-border-soft py-4">
                      <div className="text-center sm:text-left">
                        <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Reliability Rating</span>
                        <p className="text-lg font-bold text-text-primary mt-1">{(vendor.reliabilityScore || 90)}%</p>
                      </div>
                      <div className="text-center sm:text-left border-y sm:border-y-0 sm:border-x border-border-soft py-2 sm:py-0 sm:px-4">
                        <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Avg Lead Time</span>
                        <p className="text-lg font-bold text-text-primary mt-1">{(vendor.averageLeadTimeDays || 4.2)} Days</p>
                      </div>
                      <div className="text-center sm:text-left sm:pl-4">
                        <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Status Code</span>
                        <div className="mt-1">
                          <Badge tone={vendor.status === "Active" ? "success" : "warning"} className="font-bold text-[10px]">
                            {vendor.status || "Active"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Quality comparison chart */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-text-primary">Reliability Level Compared to Category Median</span>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs text-text-secondary">
                          <span>Vendor Reliability</span>
                          <span className="font-bold text-text-primary">{(vendor.reliabilityScore || 90)}%</span>
                        </div>
                        <div className="h-3 w-full bg-hover rounded-full overflow-hidden">
                          <div className="bg-accent-primary h-full rounded-full" style={{ width: `${vendor.reliabilityScore || 90}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs text-text-secondary">
                          <span>Category Median</span>
                          <span className="font-semibold text-text-primary">82%</span>
                        </div>
                        <div className="h-3 w-full bg-hover rounded-full overflow-hidden">
                          <div className="bg-indigo-400 h-full rounded-full" style={{ width: "82%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary">Vendor details are not available.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Section E: Decision Center */}
            <Card className="border-accent-primary/20 bg-gradient-to-br from-surface to-accent-primary/[0.02] shadow-sm relative overflow-hidden">
              <CardHeader className="pb-3 border-b border-border-soft">
                <CardTitle className="text-base font-bold text-text-primary flex items-center gap-1.5">
                  <Award className="h-5 w-5 text-accent-primary" />
                  Sourcing Decision Center
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Evaluate commercial terms against alternative subcontractor bids. Activating or accepting generates committed spend allocations.
                </p>

                <div className="space-y-2.5">
                  <Button
                    onClick={() => updateStatusMutation.mutate("Shortlisted")}
                    disabled={updateStatusMutation.isPending || quotation.status === "Shortlisted"}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold py-2.5 text-xs"
                  >
                    Shortlist Sourcing Option
                  </Button>
                  <Button
                    onClick={() => updateStatusMutation.mutate("Recommended")}
                    disabled={updateStatusMutation.isPending || quotation.status === "Recommended"}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 border-blue-500/30 text-blue-500 hover:bg-blue-500/10 font-bold py-2.5 text-xs"
                  >
                    Recommend Sourcing Option
                  </Button>
                  <Button
                    onClick={() => updateStatusMutation.mutate("Accepted")}
                    disabled={updateStatusMutation.isPending || quotation.status === "Accepted"}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-xs shadow-md"
                  >
                    <Check className="h-4 w-4" /> Accept Quote & Commit PO
                  </Button>
                  <Button
                    onClick={() => updateStatusMutation.mutate("Rejected")}
                    disabled={updateStatusMutation.isPending || quotation.status === "Rejected"}
                    variant="ghost"
                    className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 font-bold py-2 text-xs"
                  >
                    Reject Sourcing Option
                  </Button>
                </div>

                {updateStatusMutation.isPending && (
                  <p className="text-[10px] text-text-secondary text-center animate-pulse">
                    Saving procurement choice...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Section F: Activity Timeline */}
            <Card className="border-border-soft shadow-sm">
              <CardHeader className="pb-3 border-b border-border-soft">
                <CardTitle className="text-base font-bold text-text-primary flex items-center gap-1.5">
                  <Activity className="h-5 w-5 text-accent-primary" />
                  Sourcing Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6 pl-4 border-l-2 border-border-soft relative">
                  {/* Timeline point 1 */}
                  <div className="relative space-y-1">
                    <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface" />
                    <p className="text-xs font-bold text-text-primary">Quotation Registered</p>
                    <p className="text-[10px] text-text-secondary">{formatDate(quotation.createdAt || quotation.submittedAt || "")} &bull; By Sourcing Officer</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Supplier commercial quote uploaded and parsed successfully.</p>
                  </div>

                  {/* Timeline point 2 */}
                  <div className="relative space-y-1">
                    <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-surface" />
                    <p className="text-xs font-bold text-text-primary">Quality Index Verified</p>
                    <p className="text-[10px] text-text-secondary">{formatDate(quotation.createdAt || quotation.submittedAt || "")} &bull; Automated Sourcing Analysis</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Quality audit score verified at {quotation.qualityScore}% index.</p>
                  </div>

                  {/* Timeline point 3 */}
                  <div className="relative space-y-1">
                    <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-surface animate-pulse" />
                    <p className="text-xs font-bold text-text-primary">Pending Sourcing Decision</p>
                    <p className="text-[10px] text-text-secondary">Current State &bull; Awaiting Executive Settle</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Awaiting shortlisting or purchase order generation from buying panel.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT: COMPETITIVE COMPARISON */}
      {activeTab === "comparison" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bid Summary Indicators */}
            <Card className="border-border-soft p-4 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Lowest Bid Price</span>
                <h4 className="text-lg font-bold text-text-primary mt-1">{highlights?.lowestPrice.vendorName}</h4>
                <p className="text-xl font-extrabold text-emerald-500 mt-0.5">{formatCurrency(highlights?.lowestPrice.totalAmount || 0)}</p>
              </div>
              <p className="text-xs text-text-secondary">
                Commercial discount represents {Math.round((1 - (highlights?.lowestPrice.totalAmount || 0) / (highlights?.highestQuality.totalAmount || 1)) * 100)}% margins from high bids.
              </p>
            </Card>

            <Card className="border-border-soft p-4 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Fastest Delivery Lead</span>
                <h4 className="text-lg font-bold text-text-primary mt-1">{highlights?.fastestDelivery.vendorName}</h4>
                <p className="text-xl font-extrabold text-blue-500 mt-0.5">{highlights?.fastestDelivery.deliveryDays} Days</p>
              </div>
              <p className="text-xs text-text-secondary">
                Immediate delivery speeds up scheduling by {Math.abs((highlights?.highestQuality.deliveryDays || 0) - (highlights?.fastestDelivery.deliveryDays || 0))} days.
              </p>
            </Card>

            <Card className="border-accent-primary bg-accent-primary/[0.01] p-4 flex flex-col justify-between space-y-4 relative overflow-hidden">
              <span className="absolute top-0 right-0 p-1 bg-accent-primary text-white rounded-bl text-[8px] font-bold uppercase tracking-wide">
                AI Match
              </span>
              <div>
                <span className="text-[10px] text-accent-primary uppercase font-bold tracking-wider">Recommended Sourcing Choice</span>
                <h4 className="text-lg font-bold text-text-primary mt-1">{highlights?.recommended.vendorName}</h4>
                <p className="text-xs text-text-secondary mt-0.5">Balanced cost/lead terms recommendation</p>
              </div>
              <p className="text-xs text-text-secondary">
                Optimal procurement value based on reliability rating and commercial bid details.
              </p>
            </Card>
          </div>

          {/* Sourcing Matrix comparison grid */}
          <Card className="border-border-soft shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border-soft">
              <CardTitle className="text-base font-bold text-text-primary">Comparative Bid Grid</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <table className="w-full text-left text-table">
                <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft">
                  <tr className="h-11 text-xs font-bold uppercase">
                    <th className="px-4">Supplier</th>
                    <th className="px-4 text-right">Quote Amount</th>
                    <th className="px-4 text-center">Delivery Days</th>
                    <th className="px-4 text-center">Quality score</th>
                    <th className="px-4">Status</th>
                    <th className="px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {competitiveQuotes.map((q) => {
                    const isLowest = highlights?.lowestPrice.id === q.id;
                    const isFastest = highlights?.fastestDelivery.id === q.id;
                    const isHighest = highlights?.highestQuality.id === q.id;
                    const isRecommended = highlights?.recommended.id === q.id;

                    return (
                      <tr key={q.id} className={`border-b border-border-soft h-14 hover:bg-hover/20 ${q.id === quotationId ? "bg-accent-primary/[0.02] border-l-2 border-l-accent-primary" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-text-primary text-sm">{q.vendorName}</div>
                          <div className="text-[10px] text-text-secondary mt-0.5">Quote ID: {q.id}</div>
                        </td>
                        <td className={`px-4 py-3 text-right font-bold text-sm ${isLowest ? "text-emerald-500" : "text-text-primary"}`}>
                          {formatCurrency(q.totalAmount)}
                          {isLowest && <span className="block text-[8px] text-emerald-500 font-extrabold uppercase">★ Best Price</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${isFastest ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-surface border border-border-soft text-text-primary"}`}>
                            {q.deliveryDays} Days
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-extrabold ${isHighest ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-surface border border-border-soft text-text-secondary"}`}>
                            {q.qualityScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={toneForStatus(q.status)} className="font-bold text-[9px] uppercase tracking-wide">
                            {q.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {q.id !== quotationId ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs font-bold text-accent-primary hover:bg-accent-primary/10"
                              onClick={() => router.push(`/purchases/quotations/${q.id}`)}
                            >
                              Analyze
                            </Button>
                          ) : (
                            <span className="text-xs font-bold text-text-muted px-2 italic">Active View</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Delivery & cost trend visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border-soft p-4 bg-gradient-to-br from-surface to-surface-secondary/40">
              <CardHeader className="p-0 pb-3 border-b border-border-soft">
                <CardTitle className="text-sm font-bold text-text-primary">Commercial Cost Distribution</CardTitle>
              </CardHeader>
              <div className="h-[220px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      style={{ fontSize: 9 }}
                      tickFormatter={(name) => name.length > 10 ? `${name.slice(0, 10)}...` : name}
                    />
                    <YAxis stroke="#94a3b8" style={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: any) => [formatCurrency(value), "Commercial Quote"]} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16}>
                      {chartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.name === quotation.vendorName ? "#10b981" : "#3b82f6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="border-border-soft p-4 bg-gradient-to-br from-surface to-surface-secondary/40">
              <CardHeader className="p-0 pb-3 border-b border-border-soft">
                <CardTitle className="text-sm font-bold text-text-primary">Quality Index Score Comparison</CardTitle>
              </CardHeader>
              <div className="h-[220px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      style={{ fontSize: 9 }}
                      tickFormatter={(name) => name.length > 10 ? `${name.slice(0, 10)}...` : name}
                    />
                    <YAxis stroke="#94a3b8" style={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: any) => [`${value}%`, "Quality Score"]} />
                    <Bar dataKey="quality" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16}>
                      {chartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.name === quotation.vendorName ? "#10b981" : "#f59e0b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PDF PREVIEW */}
      {activeTab === "pdf" && (
        <Card className="border-border-soft overflow-hidden shadow-sm">
          <CardHeader className="pb-3 border-b border-border-soft bg-surface-secondary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">Parsed PDF Document Attachment</CardTitle>
              <p className="text-xs text-text-secondary">Original supplier proposal & pricing catalog verification sheet</p>
            </div>
            {quotation.documentUrl && (
              <div className="flex items-center gap-1.5 bg-surface border border-border-soft px-2.5 py-1 rounded-lg">
                <Button variant="ghost" size="sm" className="p-1 h-7 w-7 text-text-secondary" onClick={() => setZoomScale(Math.max(50, zoomScale - 25))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold text-text-primary px-2">{zoomScale}%</span>
                <Button variant="ghost" size="sm" className="p-1 h-7 w-7 text-text-secondary" onClick={() => setZoomScale(Math.min(200, zoomScale + 25))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6 bg-surface-secondary/40 flex justify-center">
            {quotation.documentUrl ? (
              <div className="w-full max-w-4xl space-y-4">
                {/* PDF Metadata Bar */}
                <div className="flex items-center justify-between p-3.5 bg-surface border border-border-soft rounded-lg text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded bg-accent-primary/10 text-accent-primary">
                      <FileCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-text-primary">{quotation.documentName || `${quotation.id}_proposal.pdf`}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        Size: {quotation.documentSize ? `${(quotation.documentSize / 1024).toFixed(1)} KB` : "1.2 MB"} &bull; Upload Date: {formatDate(quotation.createdAt || quotation.submittedAt || "")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs hover:bg-hover" onClick={() => window.print()}>
                      Print
                    </Button>
                    <a
                      href={quotation.documentUrl}
                      download={quotation.documentName || "proposal.pdf"}
                      className="inline-flex h-8 items-center justify-center text-xs bg-accent-primary text-white hover:bg-accent-primary-hover px-3 rounded shadow"
                    >
                      Download
                    </a>
                  </div>
                </div>

                {/* PDF Viewer Frame */}
                <div className="border border-border-soft bg-surface rounded-xl p-8 flex flex-col items-center shadow-inner overflow-auto min-h-[480px]">
                  <div
                    className="w-full max-w-[680px] bg-white border border-border-soft p-10 space-y-8 text-black transition-all duration-300 origin-top shadow-lg"
                    style={{ transform: `scale(${zoomScale / 100})` }}
                  >
                    {/* Simulated Professional Invoice/Quotation header */}
                    <div className="flex justify-between border-b-2 border-slate-900 pb-5">
                      <div>
                        <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-800">{quotation.vendorName}</h2>
                        <p className="text-xs text-slate-500 mt-1">GSTIN: {vendor?.gstin || "27ABCDE1234F1Z5"}</p>
                        <p className="text-xs text-slate-500">{vendor?.city || "Mumbai"}, India</p>
                      </div>
                      <div className="text-right">
                        <h3 className="text-lg font-bold text-slate-700">COMMERCIAL BID</h3>
                        <p className="text-xs text-slate-500 mt-1">Reference: {quotation.id}</p>
                        <p className="text-xs text-slate-500">Date: {formatDate(quotation.submittedAt || quotation.createdAt || "")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 text-xs text-slate-700">
                      <div>
                        <p className="font-bold text-slate-800 uppercase tracking-wide">Client / Buyer:</p>
                        <p className="mt-1 font-semibold text-slate-900">EaseSmith Construction ERP</p>
                        <p className="text-slate-500 mt-0.5">Project Sourcing Division</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 uppercase tracking-wide">Purchase Scope:</p>
                        <p className="mt-1 font-semibold text-slate-900">{quotation.requestTitle}</p>
                        <p className="text-slate-500 mt-0.5">Request Ref: {quotation.requestId}</p>
                      </div>
                    </div>

                    {/* Table of quote details */}
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-y border-slate-300 h-8 text-slate-800 font-bold uppercase">
                          <th>Line Item description</th>
                          <th className="text-center">Qty</th>
                          <th className="text-right">Unit Rate</th>
                          <th className="text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200 h-10 text-slate-700">
                          <td className="font-medium">
                            {quotation.requestTitle} &bull; Sourcing Deliverables
                          </td>
                          <td className="text-center">1.0 L.S</td>
                          <td className="text-right">{formatCurrency(quotation.totalAmount)}</td>
                          <td className="text-right font-bold text-slate-800">{formatCurrency(quotation.totalAmount)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Terms summary */}
                    <div className="grid grid-cols-2 gap-6 text-xs text-slate-700 border-t border-slate-300 pt-6">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 uppercase tracking-wide">Commercial Conditions:</p>
                        <p className="mt-1"><span className="font-semibold">Payment terms:</span> {quotation.paymentTerms || "30 days credit"}</p>
                        <p><span className="font-semibold">Delivery lead:</span> {quotation.deliveryDays} Days from order placement</p>
                        <p><span className="font-semibold">Quality Index:</span> {quotation.qualityScore}% compliance verified</p>
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="flex justify-between font-semibold border-b border-slate-200 pb-1.5">
                          <span>Subtotal Amount:</span>
                          <span>{formatCurrency(quotation.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base text-slate-850">
                          <span>Committed Grand Total:</span>
                          <span>{formatCurrency(quotation.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center border-t border-slate-200 pt-5 text-[10px] text-slate-400">
                      Thank you for your business. Generated securely via Nimbus Sourcing Network.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-lg p-10 border border-dashed border-border-soft rounded-2xl bg-surface flex flex-col items-center justify-center text-center">
                <div className="p-3.5 bg-hover text-text-muted rounded-full mb-4">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-sm text-text-primary">No PDF Document Attached</h4>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  This quotation was created manually in the ERP database without an attached supplier PDF document. You can attach a proposal document by editing or recreating this quotation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
