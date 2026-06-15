"use client";

import { useState } from "react";
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
  ChevronLeft,
  Upload,
  X,
  FileCheck,
  Calendar,
  AlertTriangle,
  Printer,
  Download,
  Activity,
  User,
  ShieldCheck,
  Building,
  ExternalLink,
  Plus,
  Trash2,
  Info,
  BadgeAlert,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/ui-store";
import { apiRequest, uploadDocument } from "@/lib/erp-api";
import { formatCurrency, formatDate, toneForStatus } from "@/lib/erp-utils";
import type { PurchaseOrder, LineItem, TimelineEvent } from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";
import { FileUpload } from "@/components/ui/file-upload";
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
  Cell
} from "recharts";

type TabType = "overview" | "items" | "documents" | "timeline" | "vendor";

export function PurchaseOrderDetailWorkspace({ purchaseOrderId }: { purchaseOrderId: string }) {
  const role = useUiStore((state) => state.role);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Queries
  const { data: po, isLoading, error } = useQuery<PurchaseOrder>({
    queryKey: ["erp-purchase-order", purchaseOrderId, role],
    queryFn: async () => (await apiRequest<PurchaseOrder>(`/api/procurement/purchase-orders/${purchaseOrderId}`, { role })).data,
  });

  // Edit Form State
  const [editForm, setEditForm] = useState<{
    expectedDelivery: string;
    status: string;
    paymentTerms: string;
    deliveryTerms: string;
    notes: string;
    lineItems: LineItem[];
  }>({
    expectedDelivery: "",
    status: "Draft",
    paymentTerms: "",
    deliveryTerms: "",
    notes: "",
    lineItems: [],
  });

  // Open Drawer Prefilled
  const openEditDrawer = () => {
    if (po) {
      setEditForm({
        expectedDelivery: po.expectedDelivery ? po.expectedDelivery.split("T")[0] : "",
        status: po.status,
        paymentTerms: po.paymentTerms || "",
        deliveryTerms: po.deliveryTerms || "",
        notes: po.notes || "",
        lineItems: po.lineItems ? [...po.lineItems] : [],
      });
      setDrawerOpen(true);
    }
  };

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiRequest(`/api/procurement/purchase-orders/${purchaseOrderId}`, {
        role,
        method: "PATCH",
        body: payload,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-purchase-order", purchaseOrderId] }),
        queryClient.invalidateQueries({ queryKey: ["erp-purchase-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
      ]);
      setDrawerOpen(false);
    },
  });

  // Upload Document Mutation
  const uploadDocMutation = useMutation({
    mutationFn: async (file: File) => {
      const uploadRes = await uploadDocument(role, file, {
        title: `PO ${purchaseOrderId} Signed Document`,
        category: "Purchase Order",
        module: "Procurement",
        relatedEntityId: purchaseOrderId,
      });
      await apiRequest(`/api/procurement/purchase-orders/${purchaseOrderId}`, {
        role,
        method: "PATCH",
        body: { documentUrl: uploadRes.data.fileUrl },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["erp-purchase-order", purchaseOrderId] });
    },
  });

  if (isLoading) return <LoadingStateCard title="Loading purchase order details..." variant="generic" />;
  if (error || !po) return <ErrorStateCard message="Purchase order details are unavailable." />;

  const subtotal = po.lineItems?.reduce((sum, item) => sum + (item.rate * item.quantity), 0) || 0;
  const totalTax = po.lineItems?.reduce((sum, item) => sum + (item.tax || 0), 0) || 0;
  const grandTotal = po.amount;

  // Add/Remove Line Item Rows
  const addLineItemRow = () => {
    setEditForm((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { item: "", category: "Materials", quantity: 1, unit: "units", rate: 0, tax: 0, amount: 0 },
      ],
    }));
  };

  const removeLineItemRow = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    setEditForm((prev) => {
      const items = [...prev.lineItems];
      const updatedItem = { ...items[index], [field]: value };
      
      // Auto calculate subtotal and tax
      if (field === "rate" || field === "quantity") {
        const qty = Number(field === "quantity" ? value : updatedItem.quantity) || 0;
        const rate = Number(field === "rate" ? value : updatedItem.rate) || 0;
        updatedItem.amount = qty * rate;
        updatedItem.tax = Math.round(updatedItem.amount * 0.18); // 18% standard GST
      }
      
      items[index] = updatedItem;
      return { ...prev, lineItems: items };
    });
  };

  const handleSaveOrder = () => {
    const calculatedAmount = editForm.lineItems.reduce((sum, item) => sum + item.quantity * item.rate + (item.tax || 0), 0);
    editMutation.mutate({
      ...editForm,
      amount: calculatedAmount || po.amount,
    });
  };

  // Vendor rating metrics
  const reliabilityScore = po.vendorDetails?.reliabilityScore || 85;
  const leadTime = po.vendorDetails?.averageLeadTimeDays || 12;

  return (
    <div className="space-y-6">
      {/* Printable Area Specific styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #po-printable-sheet, #po-printable-sheet * {
            visibility: visible;
          }
          #po-printable-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
            padding: 20px;
          }
        }
      `}} />

      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between border-b border-border-soft pb-4">
        <Link
          href="/purchases/purchase-orders"
          className="flex items-center gap-2 text-body font-medium text-text-secondary hover:text-accent-primary"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Purchase Orders
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
          {po.documentUrl ? (
            <a href={po.documentUrl} download target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-2">
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </a>
          ) : (
            <Button variant="ghost" size="sm" className="gap-2" disabled>
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          )}
          <Button onClick={openEditDrawer} variant="primary" size="sm">
            Edit Order
          </Button>
        </div>
      </div>

      {/* SECTION 1: PO Header */}
      <div className="surface-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-page-title font-bold text-text-primary uppercase">{po.id}</h1>
            <Badge tone={toneForStatus(po.status)}>{po.status}</Badge>
          </div>
          <p className="text-body text-text-secondary">
            Linked to: <span className="font-semibold">{po.requestTitle}</span> · Created on {formatDate(po.createdAt)}
          </p>
        </div>
        <div className="flex flex-col md:text-right">
          <span className="text-label text-text-muted">Total Order Value</span>
          <span className="text-kpi-value text-accent-primary mt-1">{formatCurrency(po.amount)}</span>
          <span className="text-label text-text-secondary mt-1">Expected Delivery: {formatDate(po.expectedDelivery)}</span>
        </div>
      </div>

      {/* SECTION 2: Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="surface-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-secondary">Committed Value</span>
              <div className="p-2 rounded-lg bg-active-soft text-accent-primary">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-text-primary">{formatCurrency(po.amount)}</span>
              <p className="text-label text-text-muted mt-1">100% committed exposure</p>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-secondary">Vendor Reliability</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-emerald-600">{reliabilityScore}%</span>
              <p className="text-label text-text-muted mt-1">Based on lead time & quality</p>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-secondary">Delivery Progress</span>
              <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-text-primary">
                {po.status === "Delivered" || po.status === "Closed" ? "100%" : po.status === "In Transit" ? "65%" : "0%"}
              </span>
              <div className="w-full bg-border-soft h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-accent-primary h-full transition-all duration-300"
                  style={{ width: po.status === "Delivered" || po.status === "Closed" ? "100%" : po.status === "In Transit" ? "65%" : "0%" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-kpi-label text-text-secondary">Payment Terms Status</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-text-primary">Approved</span>
              <p className="text-label text-amber-600 font-medium mt-1">Credit window active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: Tabbed Interface & Tab Contents */}
      <div className="grid grid-cols-1 gap-6">
        <div className="border-b border-border-soft flex flex-wrap gap-2">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "items", label: "Line Items" },
              { id: "documents", label: "Documents" },
              { id: "timeline", label: "Timeline" },
              { id: "vendor", label: "Vendor Intelligence" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-body font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="surface-card lg:col-span-2 space-y-6">
              <CardHeader className="border-b border-border-soft pb-4">
                <CardTitle className="text-section-title">Procurement Context</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-1">
                  <span className="text-label text-text-muted">Vendor Name</span>
                  <p className="text-body font-semibold text-text-primary">{po.vendorName}</p>
                  <p className="text-label text-text-secondary">GSTIN: {po.vendorDetails?.gstin || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-label text-text-muted">Project Name</span>
                  <p className="text-body font-semibold text-text-primary">{po.projectName}</p>
                  <p className="text-label text-text-secondary">Location: {po.projectDetails?.location || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-label text-text-muted">Delivery Address</span>
                  <p className="text-body text-text-primary">{po.projectDetails?.location || "Project Site Address"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-label text-text-muted">Payment Terms</span>
                  <p className="text-body text-text-primary">{po.paymentTerms || "Net 30 days credit"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-label text-text-muted">Delivery Terms</span>
                  <p className="text-body text-text-primary">{po.deliveryTerms || "FOB Destination"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-label text-text-muted">Commercial Notes</span>
                  <p className="text-body text-text-primary italic">{po.notes || "No extra commercial conditions."}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-card space-y-6">
              <CardHeader className="border-b border-border-soft pb-4">
                <CardTitle className="text-section-title">Execution Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-primary">Order Form Released</p>
                    <p className="text-label text-text-muted">Sent to vendor inbox</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded ${po.documentUrl ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                    {po.documentUrl ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-primary">Countersigned Copy</p>
                    <p className="text-label text-text-muted">{po.documentUrl ? "Uploaded successfully" : "Awaiting vendor copy"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded ${po.status === "Delivered" || po.status === "Closed" ? "bg-emerald-100 text-emerald-600" : "bg-neutral-100 text-text-muted"}`}>
                    {(po.status === "Delivered" || po.status === "Closed") ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-primary">Material Receipt Note</p>
                    <p className="text-label text-text-muted">Verification on delivery</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Line Items */}
        {activeTab === "items" && (
          <Card className="surface-card">
            <CardHeader className="border-b border-border-soft pb-4">
              <CardTitle className="text-section-title">Item Breakdown Register</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-table">
                  <thead className="bg-surface-secondary text-text-secondary border-b border-border-soft">
                    <tr className="h-12">
                      <th className="px-6 text-left">Item Description</th>
                      <th className="px-6 text-left">Category</th>
                      <th className="px-6 text-right">Quantity</th>
                      <th className="px-6 text-left">Unit</th>
                      <th className="px-6 text-right">Rate</th>
                      <th className="px-6 text-right">Tax (18% GST)</th>
                      <th className="px-6 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.lineItems && po.lineItems.length > 0 ? (
                      po.lineItems.map((item, idx) => (
                        <tr key={idx} className="border-t border-border-soft h-14 hover:bg-hover/40">
                          <td className="px-6 font-semibold text-text-primary">{item.item}</td>
                          <td className="px-6 text-text-secondary">{item.category}</td>
                          <td className="px-6 text-right font-medium text-text-primary">{item.quantity}</td>
                          <td className="px-6 text-text-secondary">{item.unit}</td>
                          <td className="px-6 text-right text-text-primary">{formatCurrency(item.rate)}</td>
                          <td className="px-6 text-right text-text-secondary">{formatCurrency(item.tax || Math.round(item.amount * 0.18))}</td>
                          <td className="px-6 text-right font-bold text-text-primary">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                          No line items found. Edit the order to add line items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="border-t border-border-soft p-6 bg-surface-secondary/50 flex justify-end">
                <div className="w-full max-w-md space-y-3">
                  <div className="flex justify-between text-body text-text-secondary">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-body text-text-secondary">
                    <span>Tax (18% GST)</span>
                    <span>{formatCurrency(totalTax)}</span>
                  </div>
                  <div className="flex justify-between text-section-title font-bold text-text-primary border-t border-border-soft pt-3">
                    <span>Grand Total</span>
                    <span className="text-accent-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Documents */}
        {activeTab === "documents" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="surface-card lg:col-span-2">
              <CardHeader className="border-b border-border-soft pb-4">
                <CardTitle className="text-section-title">PO Document Viewer</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 h-[550px] flex items-center justify-center bg-hover/20 rounded-b-[var(--radius-card)]">
                {po.documentUrl ? (
                  <iframe
                    src={po.documentUrl}
                    className="w-full h-full rounded-lg border border-border-soft shadow-inner"
                    title="Signed Purchase Order Preview"
                  />
                ) : (
                  <div className="text-center space-y-3">
                    <FileText className="h-16 w-16 text-text-muted mx-auto" />
                    <p className="text-body font-semibold text-text-primary">No signed document uploaded yet</p>
                    <p className="text-label text-text-muted">Upload the vendor-signed PDF below to save inside register</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="surface-card h-fit">
              <CardHeader className="border-b border-border-soft pb-4">
                <CardTitle className="text-section-title">Upload / Replace PO Document</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-label text-text-secondary leading-relaxed">
                  Drop the final signed Purchase Order agreement in PDF or image format to store in compliance vault.
                </p>
                <FileUpload
                  accept=".pdf,.png,.jpg,.jpeg"
                  onFileSelect={(file) => {
                    if (file) {
                      uploadDocMutation.mutate(file);
                    }
                  }}
                />
                {uploadDocMutation.isPending && (
                  <p className="text-label text-accent-primary animate-pulse font-medium">Uploading and securing document...</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 4: Timeline */}
        {activeTab === "timeline" && (
          <Card className="surface-card">
            <CardHeader className="border-b border-border-soft pb-4">
              <CardTitle className="text-section-title">Fulfillment Activity Trail</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative pl-8 border-l-2 border-border-soft space-y-8 ml-4 py-2">
                {po.timeline?.map((event, index) => {
                  const isActive = event.status === po.status;
                  return (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[41px] top-1 p-1.5 rounded-full border-2 ${
                        isActive ? "bg-accent-primary border-accent-primary text-white" : "bg-surface border-border-soft text-text-muted"
                      }`}>
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <p className="text-body font-bold text-text-primary">{event.title}</p>
                          <Badge tone={toneForStatus(event.status)}>{event.status}</Badge>
                        </div>
                        <p className="text-label text-text-secondary">
                          Handled by: <span className="font-semibold">{event.actorName}</span> · {formatDate(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 5: Vendor Intelligence */}
        {activeTab === "vendor" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="surface-card">
              <CardHeader className="border-b border-border-soft pb-4">
                <CardTitle className="text-section-title">Delivery Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-2 gap-6">
                <div className="surface-secondary p-4 flex flex-col justify-between">
                  <span className="text-label text-text-muted">On-Time Delivery Rate</span>
                  <span className="text-3xl font-extrabold text-emerald-600 mt-2">{reliabilityScore}%</span>
                  <p className="text-label text-text-secondary mt-1">Excellent tier vendor status</p>
                </div>
                <div className="surface-secondary p-4 flex flex-col justify-between">
                  <span className="text-label text-text-muted">Average Lead Time</span>
                  <span className="text-3xl font-extrabold text-text-primary mt-2">{leadTime} days</span>
                  <p className="text-label text-text-secondary mt-1">Expected vs SLA fulfillment</p>
                </div>
                <div className="surface-secondary p-4 flex flex-col justify-between">
                  <span className="text-label text-text-muted">Reliability Rank</span>
                  <span className="text-3xl font-extrabold text-cyan-600 mt-2">Class A</span>
                  <p className="text-label text-text-secondary mt-1">Low delivery risk threshold</p>
                </div>
                <div className="surface-secondary p-4 flex flex-col justify-between">
                  <span className="text-label text-text-muted">Historical Shortages</span>
                  <span className="text-3xl font-extrabold text-amber-600 mt-2">2 incidents</span>
                  <p className="text-label text-text-secondary mt-1">Resolved in last 12 months</p>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-card flex flex-col justify-between">
              <CardHeader className="border-b border-border-soft pb-2">
                <CardTitle className="text-section-title">Vendor Rating Profile</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "SLA Lead Time", days: leadTime },
                    { name: "Peer Avg Lead Time", days: 16 },
                    { name: "Target Lead Time", days: 10 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                    <YAxis fontSize={11} stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="days" fill="#2563eb" radius={[4, 4, 0, 0]}>
                      <Cell fill="#2563eb" />
                      <Cell fill="#94a3b8" />
                      <Cell fill="#10b981" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* EDIT DRAWER */}
      <Drawer
        open={drawerOpen}
        title="Edit Purchase Order"
        size="xl"
        onClose={() => setDrawerOpen(false)}
      >
        <div className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-body font-bold text-text-primary border-b pb-2">1. Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Expected Delivery Date</label>
                <Input
                  type="date"
                  value={editForm.expectedDelivery}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, expectedDelivery: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">PO Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary focus-visible:outline-none"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Closed">Closed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-body font-bold text-text-primary">2. Line Items Breakdown</h3>
              <Button size="sm" onClick={addLineItemRow} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-table border-collapse">
                <thead className="text-text-secondary bg-surface-secondary">
                  <tr>
                    <th className="p-2 text-left min-w-[200px]">Description</th>
                    <th className="p-2 text-left min-w-[120px]">Category</th>
                    <th className="p-2 text-right w-[100px]">Qty</th>
                    <th className="p-2 text-left w-[100px]">Unit</th>
                    <th className="p-2 text-right min-w-[120px]">Rate (INR)</th>
                    <th className="p-2 text-right min-w-[120px]">Tax</th>
                    <th className="p-2 text-right min-w-[120px]">Total</th>
                    <th className="p-2 text-center w-[50px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {editForm.lineItems.map((item, index) => (
                    <tr key={index} className="border-t border-border-soft">
                      <td className="p-1">
                        <Input
                          value={item.item}
                          placeholder="e.g. TMT Steel Bars"
                          onChange={(e) => updateLineItem(index, "item", e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <select
                          value={item.category}
                          onChange={(e) => updateLineItem(index, "category", e.target.value)}
                          className="h-10 w-full rounded-lg border border-border-soft bg-surface px-2 text-body"
                        >
                          <option value="Steel">Steel</option>
                          <option value="Cement">Cement</option>
                          <option value="Electrical">Electrical</option>
                          <option value="Plumbing">Plumbing</option>
                          <option value="Finishing">Finishing</option>
                          <option value="Materials">Other Materials</option>
                        </select>
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={item.quantity}
                          className="text-right"
                          onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          value={item.unit}
                          placeholder="bags/tons"
                          onChange={(e) => updateLineItem(index, "unit", e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          type="number"
                          value={item.rate}
                          className="text-right"
                          onChange={(e) => updateLineItem(index, "rate", Number(e.target.value))}
                        />
                      </td>
                      <td className="p-1 text-right text-text-secondary p-2">
                        {formatCurrency(item.tax || Math.round(item.amount * 0.18))}
                      </td>
                      <td className="p-1 text-right font-semibold p-2">
                        {formatCurrency(item.amount + (item.tax || 0))}
                      </td>
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItemRow(index)}
                          className="p-1 hover:text-error rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Commercial Terms */}
          <div className="space-y-4">
            <h3 className="text-body font-bold text-text-primary border-b pb-2">3. Commercial Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Payment Terms</label>
                <Input
                  value={editForm.paymentTerms}
                  placeholder="e.g. Net 30 days upon invoice"
                  onChange={(e) => setEditForm((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Delivery Terms</label>
                <Input
                  value={editForm.deliveryTerms}
                  placeholder="e.g. FOB Destination"
                  onChange={(e) => setEditForm((prev) => ({ ...prev, deliveryTerms: e.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-label text-text-secondary">Special Notes</label>
                <textarea
                  value={editForm.notes}
                  placeholder="Extra commercial terms, guidelines..."
                  onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[80px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body"
                />
              </div>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border-soft">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOrder} loading={editMutation.isPending} variant="primary">
              Save Changes
            </Button>
          </div>
        </div>
      </Drawer>

      {/* PRINT SHEET ONLY (invisible on screen, visible during printing) */}
      <div id="po-printable-sheet" className="hidden">
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #ccc", paddingBottom: "20px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px" }}>PURCHASE ORDER</h1>
            <p style={{ margin: "5px 0 0 0", color: "#666" }}>Order ID: {po.id.toUpperCase()}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontWeight: "bold" }}>NIMBUS PROCUREMENT</p>
            <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>Enterprise ERP System</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
          <div>
            <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: "5px" }}>Vendor Details</h3>
            <p style={{ margin: "5px 0" }}><strong>{po.vendorName}</strong></p>
            <p style={{ margin: "5px 0" }}>GSTIN: {po.vendorDetails?.gstin || "N/A"}</p>
            <p style={{ margin: "5px 0" }}>City: {po.vendorDetails?.city || "N/A"}</p>
          </div>
          <div>
            <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: "5px" }}>Delivery Location</h3>
            <p style={{ margin: "5px 0" }}><strong>{po.projectName}</strong></p>
            <p style={{ margin: "5px 0" }}>Address: {po.projectDetails?.location || "Project Site"}</p>
            <p style={{ margin: "5px 0" }}>Expected Delivery: {formatDate(po.expectedDelivery)}</p>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "30px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f4f4f4", height: "40px", borderBottom: "2px solid #ccc" }}>
              <th style={{ textAlign: "left", padding: "8px" }}>Item Description</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Category</th>
              <th style={{ textAlign: "right", padding: "8px" }}>Quantity</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Unit</th>
              <th style={{ textAlign: "right", padding: "8px" }}>Rate</th>
              <th style={{ textAlign: "right", padding: "8px" }}>Tax</th>
              <th style={{ textAlign: "right", padding: "8px" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {po.lineItems?.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #eee", height: "40px" }}>
                <td style={{ padding: "8px", fontWeight: "bold" }}>{item.item}</td>
                <td style={{ padding: "8px" }}>{item.category}</td>
                <td style={{ padding: "8px", textAlign: "right" }}>{item.quantity}</td>
                <td style={{ padding: "8px" }}>{item.unit}</td>
                <td style={{ padding: "8px", textAlign: "right" }}>{formatCurrency(item.rate)}</td>
                <td style={{ padding: "8px", textAlign: "right" }}>{formatCurrency(item.tax || Math.round(item.amount * 0.18))}</td>
                <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "30px" }}>
          <div style={{ width: "300px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
              <span>Tax (GST 18%):</span>
              <span>{formatCurrency(totalTax)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "2px solid #ccc", fontWeight: "bold", fontSize: "16px" }}>
              <span>Grand Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "40px", borderTop: "1px dashed #ccc", paddingTop: "20px" }}>
          <div>
            <p><strong>Payment Terms:</strong> {po.paymentTerms || "Net 30 days"}</p>
            <p><strong>Delivery Terms:</strong> {po.deliveryTerms || "FOB Destination"}</p>
            <p><strong>Notes:</strong> {po.notes || "Quality inspection required on delivery."}</p>
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "100px" }}>
            <div style={{ textAlign: "center", borderTop: "1px solid #aaa", width: "150px" }}>
              <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>Prepared By</p>
            </div>
            <div style={{ textAlign: "center", borderTop: "1px solid #aaa", width: "150px" }}>
              <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
