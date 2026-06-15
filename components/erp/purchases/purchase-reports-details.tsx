"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  IndianRupee,
  Layers,
  FileText,
  ShoppingBag,
  TrendingUp,
  User,
  MapPin,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Package,
} from "lucide-react";
import Link from "next/link";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatCurrency, formatDate, toneForStatus } from "@/lib/erp-utils";
import type {
  PurchaseRequest,
  PurchaseRequestsResponse,
  Quotation,
  QuotationsResponse,
  PurchaseOrder,
  PurchaseOrdersResponse,
  Vendor,
  VendorsResponse,
} from "@/lib/erp-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

const chartPalette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  slate: "#64748b",
};

const donutColors = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444"];

// ----------------------------------------------------
// 1. PROJECT REPORT DETAIL WORKSPACE
// ----------------------------------------------------
export function ProjectReportDetailWorkspace({ projectId }: { projectId: string }) {
  const role = useUiStore((state) => state.role);
  const router = useRouter();

  // Queries
  const requestsQuery = useQuery({
    queryKey: ["erp-purchase-requests", role],
    queryFn: async () => (await apiRequest<PurchaseRequestsResponse>("/api/procurement/requests", { role })).data,
  });
  const ordersQuery = useQuery({
    queryKey: ["erp-purchase-orders", role],
    queryFn: async () => (await apiRequest<PurchaseOrdersResponse>("/api/procurement/purchase-orders", { role })).data,
  });

  const isLoading = requestsQuery.isLoading || ordersQuery.isLoading;
  if (isLoading) return <EnterprisePageLoader title="Loading Project Procurement Profile" variant="dashboard" />;

  const allOrders = ordersQuery.data?.purchaseOrders || [];
  const allRequests = requestsQuery.data?.requests || [];

  // Find project details by filtering orders/requests for this project ID/Name
  const projectOrders = allOrders.filter((o) => o.projectId === projectId || o.projectName === projectId);
  const projectRequests = allRequests.filter((r) => r.projectId === projectId || r.projectName === projectId);

  const projectName = projectOrders[0]?.projectName || projectRequests[0]?.projectName || projectId;
  const totalSpend = projectOrders.reduce((sum, o) => sum + o.amount, 0);
  const activeVendors = new Set(projectOrders.map((o) => o.vendorId)).size;

  // Chart 1: Project Spend Trend
  const spendTrendData = projectOrders
    .map((o) => ({ date: formatDate(o.createdAt), amount: o.amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-6);

  // Request to Category lookup helper
  const requestCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    allRequests.forEach((r) => {
      if (r.materialCategory) {
        map[r.id] = r.materialCategory;
      }
    });
    return map;
  }, [allRequests]);

  // Chart 2: Category Mix
  const categoryMixData = useMemo(() => {
    return Object.entries(
      projectOrders.reduce<Record<string, number>>((acc, o) => {
        const reqCat = requestCategoryMap[o.requestId] || "Other";
        const cat = o.lineItems?.[0]?.category || reqCat;
        acc[cat] = (acc[cat] || 0) + o.amount;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }))
     .sort((a, b) => b.value - a.value);
  }, [projectOrders, requestCategoryMap]);

  return (
    <div className="space-y-6">
      <Link
        href="/purchases/purchase-reports"
        className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors select-none"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Command Center</span>
      </Link>

      <SectionHeader
        title={projectName}
        description="Detailed project procurement footprint, category spend distribution, order logs, and requisition pipeline."
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Project Spend</span>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Active Release POs</span>
            <p className="text-2xl font-bold text-text-primary">{projectOrders.length} Orders</p>
          </CardContent>
        </Card>
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Unique Vendors Engaged</span>
            <p className="text-2xl font-bold text-text-primary">{activeVendors} Suppliers</p>
          </CardContent>
        </Card>
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Pending Requisitions</span>
            <p className="text-2xl font-bold text-text-primary">
              {projectRequests.filter((r) => r.status === "Pending").length} Requisitions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Spend Growth Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {spendTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted text-xs">No historical spend logs</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                  <XAxis dataKey="date" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                  <YAxis fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  <Area type="monotone" dataKey="amount" stroke={chartPalette.blue} fill={chartPalette.blue} fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Category Spend Allocation</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-y-auto">
            {categoryMixData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-text-muted text-xs">No categories allocated yet</div>
            ) : (
              <>
                <div className="h-44 w-44 flex-shrink-0 mx-auto sm:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryMixData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryMixData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1 min-w-[200px] w-full overflow-y-auto max-h-[180px] pr-2">
                  {categoryMixData.map((p, idx) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="h-3 w-3 rounded-md flex-shrink-0" style={{ backgroundColor: donutColors[idx % donutColors.length] }} />
                        <span className="font-semibold text-text-secondary truncate max-w-[120px] sm:max-w-[150px]">{p.name}</span>
                      </div>
                      <span className="font-bold text-text-primary flex-shrink-0">{formatCurrency(p.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Related POs */}
      <Card className="border border-border-soft overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Project Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary text-text-muted font-bold border-b border-border-soft">
                <tr className="h-10">
                  <th className="px-5">PO ID</th>
                  <th className="px-4">Vendor</th>
                  <th className="px-4 text-right">Amount</th>
                  <th className="px-4 text-center">Status</th>
                  <th className="px-5 text-right">Expected Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {projectOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/purchases/purchase-reports/spend/${o.id}`)}
                    className="h-12 hover:bg-hover cursor-pointer border-t border-border-soft transition-colors"
                  >
                    <td className="px-5 font-semibold text-accent-primary">{o.id}</td>
                    <td className="px-4 font-semibold text-text-primary">{o.vendorName}</td>
                    <td className="px-4 text-right font-bold text-text-primary">{formatCurrency(o.amount)}</td>
                    <td className="px-4 text-center">
                      <Badge tone={toneForStatus(o.status)}>{o.status}</Badge>
                    </td>
                    <td className="px-5 text-right text-text-muted">{formatDate(o.expectedDelivery)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------
// 2. SPEND DETAIL WORKSPACE (PURCHASE ORDER)
// ----------------------------------------------------
export function SpendReportDetailWorkspace({ poId }: { poId: string }) {
  const role = useUiStore((state) => state.role);

  const orderQuery = useQuery({
    queryKey: ["erp-purchase-order", poId, role],
    queryFn: async () => (await apiRequest<PurchaseOrder>(`/api/procurement/purchase-orders/${poId}`, { role })).data,
  });

  if (orderQuery.isLoading) return <EnterprisePageLoader title="Loading Spend Details" variant="dashboard" />;
  if (orderQuery.error || !orderQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-border-soft rounded-2xl bg-surface">
        <p className="text-text-muted text-sm font-semibold">Spend details (PO: {poId}) could not be loaded.</p>
      </div>
    );
  }

  const order = orderQuery.data;

  // Mock line items if not defined
  const items = order.lineItems || [
    { item: "Grade 53 OPC Cement", category: "Cement", quantity: 500, unit: "Bags", rate: 420, tax: 37800, amount: 247800 },
    { item: "TMT Fe 550 Steel Rods (12mm)", category: "Steel", quantity: 5, unit: "Tons", rate: 65000, tax: 58500, amount: 383500 },
  ];

  const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxTotal = items.reduce((sum, item) => sum + (item.tax || 0), 0);

  return (
    <div className="space-y-6">
      <Link
        href="/purchases/purchase-reports"
        className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors select-none"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Command Center</span>
      </Link>

      <SectionHeader
        title={`Spend Audit: ${order.id}`}
        description={`Transaction analysis for purchase order released for project: ${order.projectName}.`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Value</span>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(order.amount)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Line Items</span>
            <p className="text-2xl font-bold text-text-primary">{items.length} Items</p>
          </CardContent>
        </Card>
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Delivery Phase</span>
            <p className="text-2xl font-bold text-text-primary">{order.status}</p>
          </CardContent>
        </Card>
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Release Date</span>
            <p className="text-2xl font-bold text-text-primary">{formatDate(order.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card className="border border-border-soft overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">PO Line Item Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary text-text-muted font-bold border-b border-border-soft">
                <tr className="h-10">
                  <th className="px-5">Item Details</th>
                  <th className="px-4">Category</th>
                  <th className="px-4 text-center">Qty / Unit</th>
                  <th className="px-4 text-right">Unit Rate</th>
                  <th className="px-4 text-right">Estimated Tax</th>
                  <th className="px-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft bg-surface">
                {items.map((it, idx) => (
                  <tr key={idx} className="h-14">
                    <td className="px-5 font-semibold text-text-primary">{it.item}</td>
                    <td className="px-4">
                      <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border-soft text-[10px] uppercase font-bold text-text-muted">
                        {it.category}
                      </span>
                    </td>
                    <td className="px-4 text-center">{it.quantity} {it.unit}</td>
                    <td className="px-4 text-right">{formatCurrency(it.rate)}</td>
                    <td className="px-4 text-right text-text-muted">{formatCurrency(it.tax || 0)}</td>
                    <td className="px-5 text-right font-bold text-text-primary">{formatCurrency(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-5 bg-surface-secondary border-t border-border-soft flex justify-end">
            <div className="w-72 space-y-2.5 text-xs text-text-secondary">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Integrated Tax:</span>
                <span className="font-semibold">{formatCurrency(taxTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-border-strong pt-2.5 text-sm font-bold text-text-primary">
                <span>Committed Value:</span>
                <span>{formatCurrency(order.amount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commercial Terms & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Commercial Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs leading-relaxed text-text-secondary">
            <div>
              <p className="font-bold text-text-muted uppercase tracking-wider">Payment Terms</p>
              <p className="mt-1 text-text-primary font-semibold">{order.paymentTerms || "30 Days Credit"}</p>
            </div>
            <div>
              <p className="font-bold text-text-muted uppercase tracking-wider">Delivery / Commercial Clauses</p>
              <p className="mt-1 text-text-primary font-semibold">
                {order.deliveryTerms || "FOB Destination. Vendor responsible for freight transit insurance."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Order Status Tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div className="text-xs">
                <p className="font-bold text-text-primary">Order Released</p>
                <p className="text-text-muted">{formatDate(order.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning" />
              <div className="text-xs">
                <p className="font-bold text-text-primary">Expected Delivery Phase</p>
                <p className="text-text-muted">{formatDate(order.expectedDelivery)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. VENDOR DETAIL WORKSPACE
// ----------------------------------------------------
export function VendorReportDetailWorkspace({ vendorId }: { vendorId: string }) {
  const role = useUiStore((state) => state.role);
  const router = useRouter();

  // Fetch all vendors
  const vendorsQuery = useQuery({
    queryKey: ["erp-vendors", role],
    queryFn: async () => (await apiRequest<VendorsResponse>("/api/procurement/vendors", { role })).data,
  });

  // Fetch purchase orders
  const ordersQuery = useQuery({
    queryKey: ["erp-purchase-orders", role],
    queryFn: async () => (await apiRequest<PurchaseOrdersResponse>("/api/procurement/purchase-orders", { role })).data,
  });

  const isLoading = vendorsQuery.isLoading || ordersQuery.isLoading;
  if (isLoading) return <EnterprisePageLoader title="Loading Vendor Scorecard" variant="dashboard" />;

  const vendor = vendorsQuery.data?.vendors.find((v) => v.id === vendorId);
  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-border-soft rounded-2xl bg-surface">
        <p className="text-text-muted text-sm font-semibold">Vendor scorecard ({vendorId}) could not be loaded.</p>
      </div>
    );
  }

  const vendorOrders = (ordersQuery.data?.purchaseOrders || []).filter((o) => o.vendorId === vendorId);
  const totalSpend = vendorOrders.reduce((sum, o) => sum + o.amount, 0);

  // Spend trend (last 6 transactions)
  const spendTrendData = vendorOrders
    .map((o) => ({ date: formatDate(o.createdAt), amount: o.amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-6);

  return (
    <div className="space-y-6">
      <Link
        href="/purchases/purchase-reports"
        className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors select-none"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Command Center</span>
      </Link>

      <SectionHeader
        title={vendor.name}
        description={`Vendor scorecard, category spend share, lead times, and reliability benchmarks.`}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Committed Spend</span>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Reliability Score</span>
            <p className="text-2xl font-bold text-success">{vendor.reliabilityScore}/100</p>
          </CardContent>
        </Card>
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Average Lead Time</span>
            <p className="text-2xl font-bold text-text-primary">{vendor.averageLeadTimeDays} Days</p>
          </CardContent>
        </Card>
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Orders Released</span>
            <p className="text-2xl font-bold text-text-primary">{vendorOrders.length} POs</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Spend Trajectory</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {spendTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted text-xs">No transaction history</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                  <XAxis dataKey="date" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                  <YAxis fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  <Area type="monotone" dataKey="amount" stroke={chartPalette.cyan} fill={chartPalette.cyan} fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Vendor profile cards */}
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Vendor Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-text-secondary leading-relaxed">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-text-muted">SUPPLIER CATEGORY</p>
                <p className="font-semibold text-text-primary">{vendor.category}</p>
              </div>
              <div>
                <p className="font-bold text-text-muted">GSTIN COMPLIANCE</p>
                <p className="font-semibold text-text-primary">{vendor.gstin || "Not provided"}</p>
              </div>
              <div>
                <p className="font-bold text-text-muted">OPERATIONAL CITY</p>
                <p className="font-semibold text-text-primary">{vendor.city}</p>
              </div>
              <div>
                <p className="font-bold text-text-muted">ACCOUNT STATUS</p>
                <Badge tone={toneForStatus(vendor.status)}>{vendor.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card className="border border-border-soft overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Released Orders log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary text-text-muted font-bold border-b border-border-soft">
                <tr className="h-10">
                  <th className="px-5">PO ID</th>
                  <th className="px-4">Project</th>
                  <th className="px-4 text-right">Amount</th>
                  <th className="px-4 text-center">Status</th>
                  <th className="px-5 text-right">Released Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {vendorOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/purchases/purchase-reports/spend/${o.id}`)}
                    className="h-12 hover:bg-hover cursor-pointer border-t border-border-soft transition-colors"
                  >
                    <td className="px-5 font-semibold text-accent-primary">{o.id}</td>
                    <td className="px-4 font-semibold text-text-primary">{o.projectName}</td>
                    <td className="px-4 text-right font-bold text-text-primary">{formatCurrency(o.amount)}</td>
                    <td className="px-4 text-center">
                      <Badge tone={toneForStatus(o.status)}>{o.status}</Badge>
                    </td>
                    <td className="px-5 text-right text-text-muted">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------
// 4. CATEGORY DETAIL WORKSPACE
// ----------------------------------------------------
export function CategoryReportDetailWorkspace({ category }: { category: string }) {
  const role = useUiStore((state) => state.role);
  const router = useRouter();

  // Fetch purchase orders
  const ordersQuery = useQuery({
    queryKey: ["erp-purchase-orders", role],
    queryFn: async () => (await apiRequest<PurchaseOrdersResponse>("/api/procurement/purchase-orders", { role })).data,
  });

  // Fetch verified vendors
  const vendorsQuery = useQuery({
    queryKey: ["erp-vendors", role],
    queryFn: async () => (await apiRequest<VendorsResponse>("/api/procurement/vendors", { role })).data,
  });

  // Fetch purchase requests to map category
  const requestsQuery = useQuery({
    queryKey: ["erp-purchase-requests", role],
    queryFn: async () => (await apiRequest<PurchaseRequestsResponse>("/api/procurement/requests", { role })).data,
  });

  const isLoading = ordersQuery.isLoading || vendorsQuery.isLoading || requestsQuery.isLoading;
  if (isLoading) return <EnterprisePageLoader title="Loading Category Performance" variant="dashboard" />;

  const allOrders = ordersQuery.data?.purchaseOrders || [];
  const allRequests = requestsQuery.data?.requests || [];
  const decodedCategory = decodeURIComponent(category);

  // Request to Category lookup helper
  const requestCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    allRequests.forEach((r) => {
      if (r.materialCategory) {
        map[r.id] = r.materialCategory;
      }
    });
    return map;
  }, [allRequests]);

  // Filter orders by category
  const categoryOrders = useMemo(() => {
    return allOrders.filter((o) => {
      const reqCat = requestCategoryMap[o.requestId] || "Other";
      const cat = o.lineItems?.[0]?.category || reqCat;
      return cat.toLowerCase() === decodedCategory.toLowerCase();
    });
  }, [allOrders, requestCategoryMap, decodedCategory]);

  const totalSpend = categoryOrders.reduce((sum, o) => sum + o.amount, 0);
  const activeVendors = new Set(categoryOrders.map((o) => o.vendorId)).size;

  // Chart 1: Price trend over time (Cement / Steel price trends)
  const priceTrendData = [
    { month: "Jan", price: 420 },
    { month: "Feb", price: 430 },
    { month: "Mar", price: 410 },
    { month: "Apr", price: 440 },
    { month: "May", price: 455 },
  ];

  // Chart 2: Vendor spend share in category
  const vendorShareData = useMemo(() => {
    return Object.entries(
      categoryOrders.reduce<Record<string, number>>((acc, o) => {
        acc[o.vendorName] = (acc[o.vendorName] || 0) + o.amount;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }))
     .sort((a, b) => b.value - a.value);
  }, [categoryOrders]);

  return (
    <div className="space-y-6">
      <Link
        href="/purchases/purchase-reports"
        className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors select-none"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Command Center</span>
      </Link>

      <SectionHeader
        title={`Category: ${decodedCategory}`}
        description={`Analytics overview, market price trajectory, and vendor spend allocation.`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Category Spend</span>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Purchase Orders</span>
            <p className="text-2xl font-bold text-text-primary">{categoryOrders.length} Orders</p>
          </CardContent>
        </Card>
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Engaged Suppliers</span>
            <p className="text-2xl font-bold text-text-primary">{activeVendors} Vendors</p>
          </CardContent>
        </Card>
        <Card className="border border-border-soft">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Current Market Trend</span>
            <p className="text-2xl font-bold text-error">Upwards (+6%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Unit Rate Trajectory (INR / Bag)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
                <XAxis dataKey="month" fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <YAxis fontSize={10} stroke="var(--color-text-muted)" tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke={chartPalette.red} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Vendor Share Allocation</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-y-auto">
            {vendorShareData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-text-muted text-xs">No vendor splits recorded</div>
            ) : (
              <>
                <div className="h-44 w-44 flex-shrink-0 mx-auto sm:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vendorShareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {vendorShareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1 min-w-[200px] w-full overflow-y-auto max-h-[180px] pr-2">
                  {vendorShareData.map((p, idx) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="h-3 w-3 rounded-md flex-shrink-0" style={{ backgroundColor: donutColors[idx % donutColors.length] }} />
                        <span className="font-semibold text-text-secondary truncate max-w-[120px] sm:max-w-[150px]">{p.name}</span>
                      </div>
                      <span className="font-bold text-text-primary flex-shrink-0">{formatCurrency(p.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card className="border border-border-soft overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-muted">Category Orders register</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary text-text-muted font-bold border-b border-border-soft">
                <tr className="h-10">
                  <th className="px-5">PO ID</th>
                  <th className="px-4">Project</th>
                  <th className="px-4">Vendor</th>
                  <th className="px-4 text-right">Amount</th>
                  <th className="px-4 text-center">Status</th>
                  <th className="px-5 text-right">Release Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {categoryOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/purchases/purchase-reports/spend/${o.id}`)}
                    className="h-12 hover:bg-hover cursor-pointer border-t border-border-soft transition-colors"
                  >
                    <td className="px-5 font-semibold text-accent-primary">{o.id}</td>
                    <td className="px-4 font-semibold text-text-primary">{o.projectName}</td>
                    <td className="px-4">{o.vendorName}</td>
                    <td className="px-4 text-right font-bold text-text-primary">{formatCurrency(o.amount)}</td>
                    <td className="px-4 text-center">
                      <Badge tone={toneForStatus(o.status)}>{o.status}</Badge>
                    </td>
                    <td className="px-5 text-right text-text-muted">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
