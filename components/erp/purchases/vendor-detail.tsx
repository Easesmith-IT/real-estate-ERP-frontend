"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  IndianRupee,
  Info,
  Layers,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  User,
  PackagePlus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatCurrency, formatDate, toneForStatus } from "@/lib/erp-utils";
import type {
  PurchaseOrdersResponse,
  VendorsResponse,
  Vendor,
} from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
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

const selectClassName =
  "w-full rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary px-3 py-2 text-body font-medium text-text-primary outline-none transition-all focus:border-accent-primary focus:bg-surface";

// Deterministic helper to get mock details for any vendor id/hash
export function getExtendedVendorDetails(vendor: Vendor) {
  const hash = vendor.id ? vendor.id.split("-").pop() || "1001" : "1001";
  const num = parseInt(hash, 10) || 1001;

  const contacts = [
    { name: "Rajesh Kumar", email: "rajesh@sktcement.in", phone: "+91 98765 43210", address: "G-42, Sector 63, Noida, UP, 201301", terms: "30 Days Credit" },
    { name: "Amit Sharma", email: "amit.sharma@metrosteel.com", phone: "+91 87654 32109", address: "Plot 12, Industrial Area Phase II, Faridabad, Haryana, 121001", terms: "15 Days Credit" },
    { name: "Vikram Malhotra", email: "v.malhotra@brightvolt.com", phone: "+91 76543 21098", address: "Building 5B, Cyber City Phase 3, Gurugram, Haryana, 122002", terms: "30% Advance, 70% on Delivery" },
    { name: "Sanjay Patel", email: "sanjay@plumbwell.co.in", phone: "+91 95554 32109", address: "201, Sunrise Chambers, Gokhale Road, Pune, Maharashtra, 411005", terms: "45 Days Credit" },
    { name: "Priya Nair", email: "priya.nair@finishingdecor.com", phone: "+91 91112 33445", address: "Industrial Zone, Guindy, Chennai, Tamil Nadu, 600032", terms: "Letter of Credit" },
  ];

  const contact = contacts[num % contacts.length];

  return {
    contactPerson: contact.name,
    email: contact.email,
    phone: contact.phone,
    address: contact.address,
    paymentTerms: contact.terms,
    onTimeDeliveryRate: 88 + (num % 10), // 88% to 97%
    qualityRating: 90 + (num % 9), // 90% to 98%
    ordersThisYear: 14 + (num % 18),
    totalSpend: 1850000 + (num % 30) * 165000,
  };
}

export function VendorDetailWorkspace({ vendorId }: { vendorId: string }) {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "payments" | "materials" | "timeline">("profile");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  // Fetch payments
  const paymentsQuery = useQuery({
    queryKey: ["erp-payments", role],
    queryFn: async () => (await apiRequest<any>("/api/procurement/payments", { role })).data,
  });

  const vendor = useMemo(() => {
    return vendorsQuery.data?.vendors.find((v) => v.id === vendorId);
  }, [vendorsQuery.data, vendorId]);

  const [form, setForm] = useState({
    name: "",
    category: "Cement",
    city: "",
    gstin: "",
    averageLeadTimeDays: "",
    reliabilityScore: "",
    status: "Active",
  });

  // Pre-populate form when vendor is found
  useMemo(() => {
    if (vendor) {
      setForm({
        name: vendor.name,
        category: vendor.category,
        city: vendor.city,
        gstin: vendor.gstin,
        averageLeadTimeDays: `${vendor.averageLeadTimeDays}`,
        reliabilityScore: `${vendor.reliabilityScore}`,
        status: vendor.status,
      });
    }
  }, [vendor]);

  const updateMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/procurement/vendors/${vendorId}`, {
        role,
        method: "PATCH",
        body: {
          ...form,
          averageLeadTimeDays: Number(form.averageLeadTimeDays),
          reliabilityScore: Number(form.reliabilityScore),
        },
      }),
    onSuccess: async () => {
      setIsDrawerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-vendors"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
      ]);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/procurement/vendors/${vendorId}/archive`, {
        role,
        method: "PATCH",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-vendors"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
      ]);
    },
  });

  if (vendorsQuery.isLoading || ordersQuery.isLoading || paymentsQuery.isLoading) {
    return <LoadingStateCard title="Loading vendor details" />;
  }

  if (vendorsQuery.error || !vendor) {
    return <ErrorStateCard message="Vendor information is unavailable." />;
  }

  // Calculate detailed parameters
  const details = getExtendedVendorDetails(vendor);

  // Filter purchase orders
  const vendorOrders = ordersQuery.data?.purchaseOrders.filter((po) => po.vendorId === vendorId) || [];
  const totalSpend = vendorOrders.reduce((sum, po) => sum + po.amount, 0) || details.totalSpend;
  const totalOrders = vendorOrders.length || details.ordersThisYear;

  // Filter payments
  const vendorPayments = paymentsQuery.data?.vendorPayments.filter((vp: any) => vp.vendorId === vendorId) || [];
  const totalPaid = vendorPayments.reduce((sum: number, vp: any) => sum + vp.amount, 0);
  const outstandingBalance = Math.max(0, totalSpend - totalPaid);

  // Generate mock trend data based on vendor metrics
  const reliabilityTrendData = [
    { month: "Jan", score: Math.max(50, vendor.reliabilityScore - 8) },
    { month: "Feb", score: Math.max(50, vendor.reliabilityScore - 4) },
    { month: "Mar", score: Math.max(50, vendor.reliabilityScore - 5) },
    { month: "Apr", score: Math.max(50, vendor.reliabilityScore + 2) },
    { month: "May", score: Math.max(50, vendor.reliabilityScore - 2) },
    { month: "Jun", score: vendor.reliabilityScore },
  ];

  const orderVolumeTrendData = [
    { month: "Jan", volume: Math.ceil(totalOrders * 0.1) },
    { month: "Feb", volume: Math.ceil(totalOrders * 0.15) },
    { month: "Mar", volume: Math.ceil(totalOrders * 0.12) },
    { month: "Apr", volume: Math.ceil(totalOrders * 0.22) },
    { month: "May", volume: Math.ceil(totalOrders * 0.18) },
    { month: "Jun", volume: Math.ceil(totalOrders * 0.23) },
  ];

  const spendTrendData = [
    { month: "Jan", spend: Math.ceil(totalSpend * 0.08) },
    { month: "Feb", spend: Math.ceil(totalSpend * 0.14) },
    { month: "Mar", spend: Math.ceil(totalSpend * 0.11) },
    { month: "Apr", spend: Math.ceil(totalSpend * 0.25) },
    { month: "May", spend: Math.ceil(totalSpend * 0.17) },
    { month: "Jun", spend: Math.ceil(totalSpend * 0.25) },
  ];

  // Materials supplied summary
  const materialsSupplied = [
    { name: `${vendor.category} Standard Grade`, volume: "1,200 Tons", impact: "High", usage: "Structural concrete framework and foundation works." },
    { name: `${vendor.category} Premium Pack`, volume: "450 Bags", impact: "Medium", usage: "Internal plastering, wet styling, finishing steps." },
  ];

  // Activities timeline
  const activities = [
    { id: 1, title: "Order Placed", detail: `Purchase Order PO-#${1000 + totalOrders} raised for amount ${formatCurrency(totalSpend / 4)}`, date: "2026-06-10T11:30:00Z", icon: <ShoppingBag className="h-4 w-4" /> },
    { id: 2, title: "Payment Recorded", detail: `NEFT transfer of ${formatCurrency(totalSpend / 5)} completed`, date: "2026-06-08T14:15:00Z", icon: <IndianRupee className="h-4 w-4" /> },
    { id: 3, title: "Vendor Status Updated", detail: "Vendor profile changed to Active", date: "2026-05-20T09:00:00Z", icon: <CheckCircle2 className="h-4 w-4" /> },
    { id: 4, title: "Agreement Renewed", detail: `Annual procurement contract signed for category ${vendor.category}`, date: "2026-04-12T10:00:00Z", icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <section className="space-y-6">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Link href="/purchases/vendors">
          <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to Vendors
          </Button>
        </Link>
        <span className="text-label text-text-muted">/</span>
        <span className="text-label font-medium text-text-muted">Vendor Detail</span>
        <span className="text-label text-text-muted">/</span>
        <span className="text-label font-semibold text-text-primary">{vendor.name}</span>
      </div>

      {/* SECTION 1: Vendor Profile Hero */}
      <Card className="overflow-hidden border border-border-soft shadow-soft">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">{vendor.name}</h1>
                <Badge tone="info" className="px-2.5 py-0.5 text-xs font-semibold">{vendor.category}</Badge>
                <Badge tone={toneForStatus(vendor.status)} className="px-2.5 py-0.5 text-xs font-semibold">
                  {vendor.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-3 gap-x-6 text-body text-text-secondary">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-text-muted shrink-0" />
                  <span>{details.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-text-muted shrink-0" />
                  <a href={`mailto:${details.email}`} className="hover:text-accent-primary transition-colors">{details.email}</a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-text-muted shrink-0" />
                  <a href={`tel:${details.phone}`} className="hover:text-accent-primary transition-colors">{details.phone}</a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-text-muted shrink-0" />
                  <span>{vendor.city}</span>
                </div>
              </div>

              <p className="text-label text-text-muted font-medium">GSTIN: <span className="font-mono text-text-primary">{vendor.gstin || "N/A"}</span></p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
              <Button variant="secondary" onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2">
                <Edit className="h-4 w-4" /> Edit Profile
              </Button>
              {vendor.status !== "Inactive" && (
                <Button
                  variant="ghost"
                  loading={archiveMutation.isPending}
                  onClick={() => archiveMutation.mutate()}
                  className="flex items-center gap-2 text-text-error hover:bg-error-soft/10"
                >
                  <Trash2 className="h-4 w-4" /> Archive Vendor
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Performance KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Avg Lead Time</p>
            <p className="text-2xl font-bold text-text-primary">{vendor.averageLeadTimeDays} Days</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-success">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Optimal speed</span>
            </div>
          </div>
        </Card>
        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Reliability Score</p>
            <p className="text-2xl font-bold text-text-primary">{vendor.reliabilityScore}%</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Highly dependable</span>
            </div>
          </div>
        </Card>
        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Orders This Year</p>
            <p className="text-2xl font-bold text-text-primary">{totalOrders}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-text-secondary">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Active flow</span>
            </div>
          </div>
        </Card>
        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Spend</p>
            <p className="text-xl font-bold text-text-primary truncate">{formatCurrency(totalSpend)}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-accent-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Procurement leader</span>
            </div>
          </div>
        </Card>
        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">On-Time Delivery</p>
            <p className="text-2xl font-bold text-text-primary">{details.onTimeDeliveryRate}%</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-success">
              <Clock className="h-3.5 w-3.5" />
              <span>Above avg (85%)</span>
            </div>
          </div>
        </Card>
        <Card className="border border-border-soft p-4 shadow-soft">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Quality Rating</p>
            <p className="text-2xl font-bold text-text-primary">{details.qualityRating}%</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-success">
              <Layers className="h-3.5 w-3.5" />
              <span>Defect free</span>
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION 3: PERFORMANCE ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reliability Trend */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-text-primary uppercase tracking-wider">Reliability Score Trend</CardTitle>
            <p className="text-xs text-text-muted">Monthly performance rating history</p>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reliabilityTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartPalette.blue} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartPalette.blue} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <YAxis domain={[50, 100]} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                <Area type="monotone" dataKey="score" stroke={chartPalette.blue} strokeWidth={2} fillOpacity={1} fill="url(#colorRel)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Volume Trend */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-text-primary uppercase tracking-wider">Order Volume Trend</CardTitle>
            <p className="text-xs text-text-muted">Number of purchase orders executed monthly</p>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderVolumeTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                <Bar dataKey="volume" fill={chartPalette.cyan} radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spend Trend */}
        <Card className="border border-border-soft shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-text-primary uppercase tracking-wider">Monthly Spend Trend</CardTitle>
            <p className="text-xs text-text-muted">Procurement expenditure trend (INR)</p>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spendTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.06)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Spend"]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", fontSize: 11 }} />
                <Line type="monotone" dataKey="spend" stroke={chartPalette.green} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4: TABBED EXPERIENCE */}
      <div className="space-y-4">
        {/* Tab Header Controls */}
        <div className="flex border-b border-border-soft">
          {(["profile", "orders", "payments", "materials", "timeline"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-[2px] ${
                activeTab === tab
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-soft"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="py-2">
          {activeTab === "profile" && (
            <Card className="border border-border-soft shadow-soft">
              <CardHeader><CardTitle>Vendor Profile & Sourcing Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Business Name</p>
                    <p className="text-body font-medium text-text-primary mt-1">{vendor.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Material Specialization</p>
                    <p className="text-body font-medium text-text-primary mt-1">{vendor.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Corporate Address</p>
                    <p className="text-body font-medium text-text-primary mt-1">{details.address}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Lead Time Profile</p>
                    <p className="text-body font-medium text-text-primary mt-1">{vendor.averageLeadTimeDays} Days average (Standard delivery)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">GSTIN / Tax Registration</p>
                    <p className="font-mono text-body font-medium text-text-primary mt-1">{vendor.gstin || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Commercial Payment Terms</p>
                    <p className="text-body font-medium text-text-primary mt-1">{details.paymentTerms}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Primary Sourcing Contact</p>
                    <p className="text-body font-medium text-text-primary mt-1">{details.contactPerson} ({details.phone})</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Risk Level Rating</p>
                    <p className="text-body font-semibold mt-1 flex items-center gap-1.5">
                      {vendor.reliabilityScore < 85 ? (
                        <>
                          <ShieldAlert className="h-4 w-4 text-error" />
                          <span className="text-error">High Risk / On Watch</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="text-success">Low Risk / Preferred Supplier</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "orders" && (
            <Card className="border border-border-soft shadow-soft overflow-hidden">
              <CardHeader><CardTitle>Purchase Orders History</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-table">
                    <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft">
                      <tr className="h-10 text-left">
                        <th className="px-5">Order ID</th>
                        <th className="px-5">Description</th>
                        <th className="px-5">Project Allocation</th>
                        <th className="px-5">Total Cost</th>
                        <th className="px-5">Delivery Deadline</th>
                        <th className="px-5">Execution Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorOrders.length > 0 ? (
                        vendorOrders.map((order) => (
                          <tr key={order.id} className="border-b border-border-soft hover:bg-surface-secondary/30 transition-colors">
                            <td className="px-5 py-4 font-mono font-semibold text-text-primary">{order.id}</td>
                            <td className="px-5 py-4 text-text-primary">{order.requestTitle}</td>
                            <td className="px-5 py-4 text-text-secondary">{order.projectName}</td>
                            <td className="px-5 py-4 font-semibold text-text-primary">{formatCurrency(order.amount)}</td>
                            <td className="px-5 py-4 text-text-secondary">{formatDate(order.expectedDelivery)}</td>
                            <td className="px-5 py-4">
                              <Badge tone={toneForStatus(order.status)}>{order.status}</Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="h-32 text-center text-text-muted">
                          <td colSpan={6} className="px-5 py-4">
                            <div className="space-y-1">
                              <Info className="h-6 w-6 mx-auto text-text-muted" />
                              <p className="text-body font-medium">No order history available</p>
                              <p className="text-xs">Any purchase orders generated for this vendor will display here.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "payments" && (
            <div className="space-y-4">
              {/* Payment Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-border-soft p-5 bg-success/5">
                  <p className="text-xs font-semibold text-success uppercase tracking-wider">Total Paid Amount</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">{formatCurrency(totalPaid)}</p>
                </Card>
                <Card className="border border-border-soft p-5 bg-warning/5">
                  <p className="text-xs font-semibold text-warning uppercase tracking-wider">Outstanding Balance</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">{formatCurrency(outstandingBalance)}</p>
                </Card>
                <Card className="border border-border-soft p-5">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Payment Term Model</p>
                  <p className="text-lg font-bold text-text-primary mt-1.5">{details.paymentTerms}</p>
                </Card>
              </div>

              {/* Payments Ledger Table */}
              <Card className="border border-border-soft shadow-soft overflow-hidden">
                <CardHeader><CardTitle>Vendor Payment Register</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-table">
                      <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft">
                        <tr className="h-10 text-left">
                          <th className="px-5">Payment Ref</th>
                          <th className="px-5">Associated PO</th>
                          <th className="px-5">Paid Amount</th>
                          <th className="px-5">Transaction Date</th>
                          <th className="px-5">Payment Mode</th>
                          <th className="px-5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorPayments.length > 0 ? (
                          vendorPayments.map((payment: any) => (
                            <tr key={payment.id} className="border-b border-border-soft hover:bg-surface-secondary/30 transition-colors">
                              <td className="px-5 py-4 font-mono font-semibold text-text-primary">{payment.reference}</td>
                              <td className="px-5 py-4 font-mono text-text-secondary">{payment.poRef || "N/A"}</td>
                              <td className="px-5 py-4 font-bold text-text-primary">{formatCurrency(payment.amount)}</td>
                              <td className="px-5 py-4 text-text-secondary">{formatDate(payment.paidDate)}</td>
                              <td className="px-5 py-4 font-medium text-text-primary">{payment.mode || "Online"}</td>
                              <td className="px-5 py-4">
                                <Badge tone="success">Paid</Badge>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="h-32 text-center text-text-muted">
                            <td colSpan={6} className="px-5 py-4">
                              <div className="space-y-1">
                                <Info className="h-6 w-6 mx-auto text-text-muted" />
                                <p className="text-body font-medium">No recorded transactions</p>
                                <p className="text-xs">Completed or pending disbursements are listed here.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "materials" && (
            <Card className="border border-border-soft shadow-soft overflow-hidden">
              <CardHeader><CardTitle>Supplied Material Inventory</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-table">
                    <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft">
                      <tr className="h-10 text-left">
                        <th className="px-5">Item Classification</th>
                        <th className="px-5">Delivered Volumes (YTD)</th>
                        <th className="px-5">Project Consumption Impact</th>
                        <th className="px-5">Typical Application Area</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materialsSupplied.map((material, idx) => (
                        <tr key={idx} className="border-b border-border-soft">
                          <td className="px-5 py-4 font-semibold text-text-primary">{material.name}</td>
                          <td className="px-5 py-4 text-text-primary font-medium">{material.volume}</td>
                          <td className="px-5 py-4">
                            <Badge tone={material.impact === "High" ? "error" : "warning"}>{material.impact}</Badge>
                          </td>
                          <td className="px-5 py-4 text-text-secondary">{material.usage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "timeline" && (
            <Card className="border border-border-soft shadow-soft">
              <CardHeader><CardTitle>Vendor Sourcing Activity Timeline</CardTitle></CardHeader>
              <CardContent className="relative pl-8 pr-4 py-4 space-y-8 before:absolute before:left-4 before:top-4 before:bottom-4 before:w-[1px] before:bg-border-soft">
                {activities.map((act) => (
                  <div key={act.id} className="relative space-y-1">
                    {/* Icon circle */}
                    <div className="absolute -left-[30px] top-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-border-soft bg-surface text-accent-primary shadow-soft">
                      {act.icon}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-body font-semibold text-text-primary">{act.title}</p>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(act.date)}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{act.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Drawer */}
      <Drawer
        open={isDrawerOpen}
        title="Edit Vendor Sourcing Details"
        size="md"
        onClose={() => setIsDrawerOpen(false)}
      >
        <div className="space-y-4 pb-12">
          <div className="space-y-1">
            <label className="text-label text-text-secondary">Vendor Name</label>
            <Input value={form.name} onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Category</label>
              <select value={form.category} onChange={(event) => setForm((c) => ({ ...c, category: event.target.value }))} className={selectClassName}>
                <option value="Cement">Cement</option>
                <option value="Steel">Steel</option>
                <option value="Electrical">Electrical</option>
                <option value="Finishing">Finishing</option>
                <option value="Plumbing">Plumbing</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Status</label>
              <select value={form.status} onChange={(event) => setForm((c) => ({ ...c, status: event.target.value }))} className={selectClassName}>
                <option value="Active">Active</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-label text-text-secondary">City</label>
            <Input value={form.city} onChange={(event) => setForm((c) => ({ ...c, city: event.target.value }))} />
          </div>

          <div className="space-y-1">
            <label className="text-label text-text-secondary">GSTIN</label>
            <Input value={form.gstin} onChange={(event) => setForm((c) => ({ ...c, gstin: event.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Lead Time (days)</label>
              <Input value={form.averageLeadTimeDays} onChange={(event) => setForm((c) => ({ ...c, averageLeadTimeDays: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Reliability Score (%)</label>
              <Input value={form.reliabilityScore} onChange={(event) => setForm((c) => ({ ...c, reliabilityScore: event.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border-soft sticky bottom-0 bg-surface">
            <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
              <PackagePlus className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </div>
      </Drawer>
    </section>
  );
}
