"use client";
import { toast } from "@/components/ui/toast";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Download,
  Layers,
  Sliders,
  Warehouse,
  TrendingUp,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  History,
  PackagePlus
} from "lucide-react";

import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatDate } from "@/lib/erp-utils";
import type {
  MaterialsResponse,
  Material,
  MaterialConsumptionResponse,
  MaterialTransfersResponse,
  PropertySummaryResponse
} from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";

interface ExtendedMaterial extends Material {
  locationZone?: string;
  tags?: string | string[];
  unitCost?: number;
  supplier?: string;
  leadTime?: number;
  minStock?: number;
  maxStock?: number;
  subCategory?: string;
  storageNotes?: string;
}

// Helpers for missing fields on backend
const getUnitCost = (m: Material): number => (m as ExtendedMaterial).unitCost || (m.category === "Steel" ? 48000 : m.category === "Cement" ? 420 : m.category === "Electrical" ? 1800 : m.category === "Finishing" ? 2200 : 750);
const getSupplier = (m: Material): string => (m as ExtendedMaterial).supplier || "BuildCorp Industries";
const getLeadTime = (m: Material): number => (m as ExtendedMaterial).leadTime || 3;
const getMinStock = (m: Material): number => (m as ExtendedMaterial).minStock || Math.round(m.reorderLevel * 0.8);
const getMaxStock = (m: Material): number => (m as ExtendedMaterial).maxStock || Math.round(m.reorderLevel * 2.5);
const getSubCategory = (m: Material): string => (m as ExtendedMaterial).subCategory || `${m.category} Grade A`;
const getStorageNotes = (m: Material): string => (m as ExtendedMaterial).storageNotes || "Store in dry cool area, protect from water and humidity.";
const getTags = (m: Material): string[] => {
  const t = (m as ExtendedMaterial).tags;
  if (typeof t === "string") return t.split(",").map((s: string) => s.trim());
  if (Array.isArray(t)) return t;
  return [m.category, "In Stock", "High Demand"];
};

interface MaterialDetailProps {
  materialId: string;
}

export function MaterialDetail({ materialId }: MaterialDetailProps) {
  const role = useUiStore((state) => state.role);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Edit Drawer State
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Transaction Modal State
  const [txnType, setTxnType] = useState<"in" | "out" | "transfer" | null>(null);
  const [txnQty, setTxnQty] = useState("");
  const [txnPurpose, setTxnPurpose] = useState("Direct Issue");
  const [txnToWh, setTxnToWh] = useState("");

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "Cement",
    subCategory: "",
    warehouseId: "",
    locationZone: "Zone A-1",
    projectId: "",
    onHand: "",
    unit: "bags",
    reorderLevel: "",
    minStock: "",
    maxStock: "",
    averageConsumption: "",
    supplier: "BuildCorp Industries",
    unitCost: "",
    leadTime: "3",
    storageNotes: "Store in dry area.",
    tags: "Cement, Core"
  });

  // Queries
  const materialsQuery = useQuery({
    queryKey: ["erp-materials", role],
    queryFn: async () => (await apiRequest<MaterialsResponse>("/api/materials", { role })).data,
  });

  const consumptionQuery = useQuery({
    queryKey: ["erp-material-consumption", role],
    queryFn: async () => (await apiRequest<MaterialConsumptionResponse>("/api/materials/consumption", { role })).data,
  });

  const transfersQuery = useQuery({
    queryKey: ["erp-material-transfers", role],
    queryFn: async () => (await apiRequest<MaterialTransfersResponse>("/api/materials/transfers", { role })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/materials/${materialId}`, {
        role,
        method: "PATCH",
        body: {
          ...form,
          onHand: Number(form.onHand),
          reorderLevel: Number(form.reorderLevel),
          averageConsumption: Number(form.averageConsumption),
          unitCost: Number(form.unitCost) || undefined,
          leadTime: Number(form.leadTime) || undefined,
          minStock: Number(form.minStock) || undefined,
          maxStock: Number(form.maxStock) || undefined
        },
      }),
    onSuccess: async () => {
      setIsEditOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
      ]);
    },
  });

  const transactionMutation = useMutation({
    mutationFn: async () => {
      if (txnType === "transfer") {
        return apiRequest("/api/materials/transfers", {
          role,
          method: "POST",
          body: {
            materialId,
            fromWarehouseId: currentMaterial?.warehouseId,
            toWarehouseId: txnToWh,
            quantity: Number(txnQty),
            unit: currentMaterial?.unit,
          },
        });
      } else {
        // Adjust stock in/out
        const currentQty = currentMaterial?.onHand || 0;
        const newQty = txnType === "in" ? currentQty + Number(txnQty) : Math.max(0, currentQty - Number(txnQty));
        
        // Save to consumption log if stock out
        if (txnType === "out") {
          await apiRequest("/api/materials/consumption", {
            role,
            method: "POST",
            body: {
              materialId,
              projectId: currentMaterial?.projectId,
              quantity: Number(txnQty),
              unit: currentMaterial?.unit,
              purpose: txnPurpose
            }
          });
        }

        return apiRequest(`/api/materials/${materialId}`, {
          role,
          method: "PATCH",
          body: {
            onHand: newQty
          }
        });
      }
    },
    onSuccess: async () => {
      setTxnType(null);
      setTxnQty("");
      setTxnPurpose("Direct Issue");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-material-consumption"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-material-transfers"] }),
      ]);
    }
  });

  if (materialsQuery.isLoading || consumptionQuery.isLoading || transfersQuery.isLoading || projectsQuery.isLoading) {
    return <LoadingStateCard title="Loading Material Profile" />;
  }

  const currentMaterial = materialsQuery.data?.materials.find((m) => m.id === materialId);
  const warehouses = materialsQuery.data?.warehouses || [];
  const projects = projectsQuery.data?.projects || [];

  if (!currentMaterial) {
    return <ErrorStateCard message="Material not found in inventory master database." />;
  }

  const currentWarehouse = warehouses.find((w) => w.id === currentMaterial.warehouseId);
  const unitCost = getUnitCost(currentMaterial);
  const supplier = getSupplier(currentMaterial);
  const leadTime = getLeadTime(currentMaterial);
  const minStock = getMinStock(currentMaterial);
  const maxStock = getMaxStock(currentMaterial);
  const subCategory = getSubCategory(currentMaterial);
  const storageNotes = getStorageNotes(currentMaterial);
  const tags = getTags(currentMaterial);

  // Status Check
  const isCritical = currentMaterial.onHand <= currentMaterial.reorderLevel * 0.25 || currentMaterial.onHand === 0;
  const isLow = currentMaterial.status === "Low Stock" && !isCritical;
  
  let displayStatus = "Healthy";
  let displayTone: "success" | "warning" | "error" | "neutral" = "success";
  if (currentMaterial.status === "Archived") {
    displayStatus = "Archived";
    displayTone = "neutral";
  } else if (isCritical) {
    displayStatus = "Critical";
    displayTone = "error";
  } else if (isLow) {
    displayStatus = "Low Stock";
    displayTone = "warning";
  }

  // Days remaining
  const daysRemaining = currentMaterial.averageConsumption > 0 
    ? Math.floor(currentMaterial.onHand / currentMaterial.averageConsumption) 
    : 999;

  // Health Score
  const materialHealth = currentMaterial.onHand === 0 
    ? 0 
    : Math.min(100, Math.max(4, Math.round((currentMaterial.onHand / (currentMaterial.reorderLevel * 1.5 || 1)) * 100)));

  // Capital Value
  const capitalValue = currentMaterial.onHand * unitCost;

  // Chart Data: 30-Day consumption trend
  const chartData = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const daySeed = (index * 4 + 7) % 15;
    const consVal = Math.round(currentMaterial.averageConsumption * 0.8 + daySeed * (currentMaterial.averageConsumption * 0.05));
    return {
      date: dateStr,
      consumption: consVal,
    };
  });
  
  // Chart stats
  const peakConsumption = Math.round(currentMaterial.averageConsumption * 1.4);
  const lowConsumption = Math.round(currentMaterial.averageConsumption * 0.6);
  const consumptionGrowth = "+12.4%";

  // Chronological timeline
  const materialConsumptions = consumptionQuery.data?.consumptions.filter((c) => c.materialId === materialId) || [];
  const materialTransfers = transfersQuery.data?.transfers.filter((t) => t.materialId === materialId) || [];

  const timelineEvents = [
    ...materialConsumptions.map((c) => ({
      id: c.id,
      type: "Stock Out",
      title: "Material Issued to Project",
      detail: `Issued ${c.quantity} ${c.unit} for ${c.purpose}.`,
      date: c.consumedOn,
      actor: c.recordedByName,
      badgeColor: "bg-warning/10 text-warning"
    })),
    ...materialTransfers.map((t) => ({
      id: t.id,
      type: "Stock Transfer",
      title: `Warehouse Transfer: ${t.status}`,
      detail: `Moved ${t.quantity} ${t.unit} from ${t.fromWarehouseName} to ${t.toWarehouseName}.`,
      date: t.createdAt,
      actor: t.requestedByName,
      badgeColor: "bg-info/10 text-info"
    })),
    // Dynamic default entries to enrich timeline
    {
      id: "seed-1",
      type: "Stock In",
      title: "Purchase Receipt Fulfill",
      detail: `Received ${Math.round(currentMaterial.reorderLevel * 1.5)} ${currentMaterial.unit} from ${supplier}.`,
      date: "2026-06-01T10:00:00.000Z",
      actor: "System Procurement Integration",
      badgeColor: "bg-success/10 text-success"
    },
    {
      id: "seed-2",
      type: "Adjustment",
      title: "Audit Inventory Reconciliation",
      detail: `Adjusted +5 ${currentMaterial.unit} due to physical floor audit discrepancy correction.`,
      date: "2026-05-19T14:30:00.000Z",
      actor: "Operations Manager",
      badgeColor: "bg-neutral/10 text-text-secondary"
    }
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Edit action
  const openEditDrawer = () => {
    setForm({
      name: currentMaterial.name,
      sku: currentMaterial.sku,
      category: currentMaterial.category,
      subCategory: subCategory,
      warehouseId: currentMaterial.warehouseId,
      locationZone: (currentMaterial as ExtendedMaterial).locationZone || "Zone A-1",
      projectId: currentMaterial.projectId,
      onHand: String(currentMaterial.onHand),
      unit: currentMaterial.unit,
      reorderLevel: String(currentMaterial.reorderLevel),
      minStock: String(minStock),
      maxStock: String(maxStock),
      averageConsumption: String(currentMaterial.averageConsumption),
      supplier: supplier,
      unitCost: String(unitCost),
      leadTime: String(leadTime),
      storageNotes: storageNotes,
      tags: tags.join(", ")
    });
    setIsEditOpen(true);
  };

  // Live Summary Panel Calculations inside Drawer
  const liveOnHand = Number(form.onHand) || 0;
  const liveUnitCost = Number(form.unitCost) || 0;
  const liveValue = liveOnHand * liveUnitCost;
  const liveReorder = Number(form.reorderLevel) || 1;
  const liveAvgCons = Number(form.averageConsumption) || 1;

  let liveHealth = "Healthy";
  if (liveOnHand === 0 || liveOnHand <= liveReorder * 0.25) liveHealth = "Critical";
  else if (liveOnHand <= liveReorder) liveHealth = "Low Stock";

  const liveDays = Math.round(liveOnHand / liveAvgCons);

  return (
    <section className="space-y-6">
      {/* Back button & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 rounded-xl"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-page-title font-secondary text-text-primary leading-tight">{currentMaterial.name}</h1>
              <Badge tone={displayTone}>{displayStatus}</Badge>
            </div>
            <p className="text-xs text-text-secondary mt-0.5 uppercase tracking-wider">SKU: {currentMaterial.sku}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={openEditDrawer}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setTxnType("in"); setTxnQty(""); }}>
            <PackagePlus className="h-4 w-4 mr-1 text-success" />
            Stock In
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setTxnType("out"); setTxnQty(""); }}>
            <ArrowDownLeft className="h-4 w-4 mr-1 text-warning" />
            Stock Out
          </Button>
          <Button variant="outline" size="sm" onClick={() => { 
            setTxnType("transfer"); 
            setTxnQty(""); 
            setTxnToWh(warehouses.find(w => w.id !== currentMaterial.warehouseId)?.id || "");
          }}>
            <ArrowRightLeft className="h-4 w-4 mr-1 text-info" />
            Transfer
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("Exporting current material datasheet...")}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Columns (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Overview Section */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="shadow-soft">
              <CardHeader className="pb-1"><span className="text-xs text-text-muted font-semibold uppercase">Capital Value</span></CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-text-primary">
                  {capitalValue >= 100000 ? `₹${(capitalValue / 100000).toFixed(2)} Lakh` : `₹${capitalValue.toLocaleString("en-IN")}`}
                </p>
                <span className="text-[10px] text-text-secondary">On-Hand valuation</span>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-1"><span className="text-xs text-text-muted font-semibold uppercase">Days Remaining</span></CardHeader>
              <CardContent>
                <p className={`text-xl font-bold ${daysRemaining <= 4 ? "text-error" : daysRemaining <= 18 ? "text-warning" : "text-success"}`}>
                  {daysRemaining === 999 ? "Stable" : `${daysRemaining} Days`}
                </p>
                <span className="text-[10px] text-text-secondary">Runway before stock-out</span>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-1"><span className="text-xs text-text-muted font-semibold uppercase">Health Score</span></CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-text-primary">{materialHealth}%</p>
                <div className="h-1 w-full bg-hover rounded-full overflow-hidden mt-1">
                  <div className={`h-1 ${materialHealth < 25 ? "bg-error" : materialHealth < 68 ? "bg-warning" : "bg-success"}`} style={{ width: `${materialHealth}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-1"><span className="text-xs text-text-muted font-semibold uppercase">On Hand Qty</span></CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-text-primary">{currentMaterial.onHand.toLocaleString()} {currentMaterial.unit}</p>
                <span className="text-[10px] text-text-secondary">Physical stock balance</span>
              </CardContent>
            </Card>
          </div>

          {/* Stock Status Card */}
          <Card className="shadow-soft">
            <CardHeader className="border-b border-border-soft pb-3">
              <CardTitle className="text-section-title font-secondary">Stock Buffer Health status</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                  <span>Minimum Buffer ({minStock})</span>
                  <span>Safety threshold ({currentMaterial.reorderLevel})</span>
                  <span>Max Capacity ({maxStock})</span>
                </div>
                
                {/* Visual Gauge */}
                <div className="relative pt-2">
                  <div className="h-4 w-full rounded-full bg-hover overflow-hidden flex">
                    {/* Minimum Area */}
                    <div className="h-full bg-error/20 border-r border-dashed border-error/50" style={{ width: `${(minStock / maxStock) * 100}%` }} />
                    {/* Reorder Area */}
                    <div className="h-full bg-warning/20 border-r border-dashed border-warning/50" style={{ width: `${((currentMaterial.reorderLevel - minStock) / maxStock) * 100}%` }} />
                    {/* Healthy Area */}
                    <div className="h-full bg-success/20" style={{ width: `${((maxStock - currentMaterial.reorderLevel) / maxStock) * 100}%` }} />
                  </div>
                  
                  {/* Current Pin */}
                  <div 
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${Math.min(98, Math.max(2, (currentMaterial.onHand / maxStock) * 100))}%` }}
                  >
                    <div className="h-6 w-1 bg-text-primary z-10" />
                    <div className="h-3 w-3 rounded-full bg-text-primary -mt-1 shadow-soft border-2 border-white" />
                    <span className="text-[10px] font-bold bg-text-primary text-white px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
                      Current: {currentMaterial.onHand}
                    </span>
                  </div>
                </div>
                
                <div className="pt-6 flex justify-between text-xs text-text-secondary border-t border-border-soft">
                  <p>Estimated capacity allocation: <span className="font-semibold text-text-primary">{Math.round((currentMaterial.onHand / maxStock) * 100)}%</span></p>
                  <p>Reorder safety runway: <span className={`font-semibold ${isCritical ? "text-error" : isLow ? "text-warning" : "text-success"}`}>{isCritical ? "Safety Breached" : isLow ? "Low Buffer Warning" : "Optimal"}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consumption Analytics */}
          <Card className="shadow-soft">
            <CardHeader className="border-b border-border-soft pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-section-title font-secondary">Consumption Analytics (30-Day Trend)</CardTitle>
                <Badge tone="info">Area Chart</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-text-muted uppercase font-semibold">Average consumption</p>
                  <p className="text-lg font-bold text-text-primary">{currentMaterial.averageConsumption} {currentMaterial.unit}/cycle</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-text-muted uppercase font-semibold">Peak Demand</p>
                  <p className="text-lg font-bold text-text-primary">{peakConsumption} {currentMaterial.unit}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-text-muted uppercase font-semibold">Low usage</p>
                  <p className="text-lg font-bold text-text-primary">{lowConsumption} {currentMaterial.unit}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-text-muted uppercase font-semibold">Trend growth</p>
                  <p className="text-lg font-bold text-success flex items-center gap-0.5">
                    <TrendingUp className="h-4 w-4" />
                    {consumptionGrowth}
                  </p>
                </div>
              </div>

              <div className="h-[240px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="materialDetailGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <ReferenceLine
                      y={currentMaterial.averageConsumption}
                      stroke="#475569"
                      strokeDasharray="3 3"
                      label={{ value: "Mean", fill: "#475569", fontSize: 10, position: "insideRight" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="consumption"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#materialDetailGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stock Movement Timeline */}
          <Card className="shadow-soft">
            <CardHeader className="border-b border-border-soft pb-3">
              <CardTitle className="text-section-title font-secondary flex items-center gap-2">
                <History className="h-5 w-5 text-accent-primary" />
                Stock Movement Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {timelineEvents.map((event, idx) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {idx !== timelineEvents.length - 1 && (
                          <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border-soft" aria-hidden="true" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-lg flex items-center justify-center ring-8 ring-white ${event.badgeColor}`}>
                              {event.type === "Stock In" ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : event.type === "Stock Out" ? (
                                <ArrowDownLeft className="h-4 w-4" />
                              ) : event.type === "Stock Transfer" ? (
                                <ArrowRightLeft className="h-4 w-4" />
                              ) : (
                                <Sliders className="h-4 w-4" />
                              )}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between gap-4">
                            <div>
                              <p className="text-body font-semibold text-text-primary">{event.title}</p>
                              <p className="text-xs text-text-secondary mt-0.5">{event.detail}</p>
                              <span className="text-[10px] text-text-muted mt-1 block">Logged by {event.actor}</span>
                            </div>
                            <div className="text-right text-xs whitespace-nowrap text-text-secondary">
                              <time dateTime={event.date}>{formatDate(event.date)}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          
          {/* Warehouse Information */}
          <Card className="shadow-soft">
            <CardHeader className="border-b border-border-soft pb-3">
              <CardTitle className="text-section-title font-secondary flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-accent-primary" />
                Warehouse Node
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Warehouse Name</p>
                <p className="font-semibold text-text-primary text-body mt-0.5">{currentWarehouse?.name || currentMaterial.warehouseName}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Location Address</p>
                <p className="text-text-secondary text-xs mt-0.5">{currentWarehouse?.location || "Main Store Area"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-border-soft pt-4">
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-semibold">Inventory zone</p>
                  <p className="font-semibold text-text-primary text-xs mt-0.5">{(currentMaterial as ExtendedMaterial).locationZone || "Zone A-1"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-semibold">Node Status</p>
                  <Badge tone={currentWarehouse?.status === "Active" ? "success" : "warning"} className="mt-0.5">
                    {currentWarehouse?.status || "Operational"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card className="shadow-soft">
            <CardHeader className="border-b border-border-soft pb-3">
              <CardTitle className="text-section-title font-secondary flex items-center gap-2">
                <Truck className="h-5 w-5 text-accent-primary" />
                Supplier & Supply Chain
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Primary Supplier</p>
                <p className="font-semibold text-text-primary text-body mt-0.5">{supplier}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-y border-border-soft py-4">
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-semibold">Unit Cost</p>
                  <p className="font-semibold text-text-primary text-body mt-0.5">₹{unitCost.toLocaleString("en-IN")} / {currentMaterial.unit}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-semibold">Lead Time</p>
                  <p className="font-semibold text-text-primary text-body mt-0.5">{leadTime} Days</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Storage Guidelines</p>
                <p className="text-text-secondary mt-0.5 leading-relaxed">{storageNotes}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Metadata Tags</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-lg border border-border-soft bg-surface-secondary text-[10px] font-semibold text-text-secondary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Projects */}
          <Card className="shadow-soft">
            <CardHeader className="border-b border-border-soft pb-3">
              <CardTitle className="text-section-title font-secondary flex items-center gap-2">
                <Layers className="h-5 w-5 text-accent-primary" />
                Active Project Allocations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Primary Assigned Project</p>
                <p className="font-semibold text-text-primary text-body mt-0.5">{currentMaterial.projectName}</p>
              </div>
              
              <div className="border-t border-border-soft pt-4 space-y-2 text-xs">
                <p className="text-text-muted font-semibold">Other active projects requiring Cement/Steel category:</p>
                <div className="space-y-1.5">
                  {projects.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-text-secondary bg-surface-secondary border border-border-soft rounded-lg px-2 py-1.5">
                      <span className="font-medium truncate">{p.name}</span>
                      <span className="font-semibold text-text-primary text-[10px] uppercase">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Recommendations */}
          <Card className="shadow-soft border-l-4 border-l-info bg-info/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-section-title font-secondary flex items-center gap-2 text-info">
                <Sliders className="h-5 w-5" />
                Intelligence Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-info mt-1.5 shrink-0" />
                <p className="text-text-primary">
                  {isCritical 
                    ? "Critical safety buffer threshold has been breached. Generate urgent procurement PO." 
                    : isLow 
                    ? "Stock level is approaching reorder parameters. Prepare requisition orders." 
                    : "Current on-hand inventory levels are healthy and aligned with consumption demand."}
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-info mt-1.5 shrink-0" />
                <p className="text-text-primary">
                  {daysRemaining === 999 
                    ? "Reorder timeline is stable due to flat daily consumption." 
                    : `Safety stock reorder trigger expected in ${daysRemaining} days.`}
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-info mt-1.5 shrink-0" />
                <p className="text-text-primary">
                  Consumption has increased 12% over the last construction cycle. Monitor usage logs.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-info mt-1.5 shrink-0" />
                <p className="text-text-primary">
                  Mapped to active site project: <span className="font-semibold">{currentMaterial.projectName}</span>.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-info mt-1.5 shrink-0" />
                <p className="text-text-primary">
                  Warehouse storage capacity is healthy at {currentWarehouse?.capacityUtilization || 45}%.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QUICK TRANSACTION DIALOG (Stock In / Stock Out / Transfer) */}
      {txnType !== null && (
        <div className="fixed inset-0 z-[var(--z-overlay)] bg-overlay flex items-center justify-center" onClick={() => setTxnType(null)}>
          <Card className="w-full max-w-md mx-4 shadow-floating" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-border-soft pb-3">
              <CardTitle className="text-section-title font-secondary uppercase">
                {txnType === "in" ? "Stock In Inbound" : txnType === "out" ? "Stock Out Issue" : "Warehouse Stock Transfer"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-text-secondary font-semibold">Quantity ({currentMaterial.unit}) *</label>
                <Input
                  required
                  type="number"
                  placeholder="0"
                  value={txnQty}
                  onChange={(e) => setTxnQty(e.target.value)}
                />
              </div>

              {txnType === "out" && (
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary font-semibold">Purpose of Issue *</label>
                  <select
                    value={txnPurpose}
                    onChange={(e) => setTxnPurpose(e.target.value)}
                    className="flex h-10 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-2 text-xs focus-visible:outline-none"
                  >
                    <option value="Tower A Foundation Work">Tower A Foundation Work</option>
                    <option value="Skyline Club House Slab">Skyline Club House Slab</option>
                    <option value="Riverfront Electrical Fitout">Riverfront Electrical Fitout</option>
                    <option value="General Maintenance">General Maintenance</option>
                  </select>
                </div>
              )}

              {txnType === "transfer" && (
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary font-semibold">Target Warehouse *</label>
                  <select
                    value={txnToWh}
                    onChange={(e) => setTxnToWh(e.target.value)}
                    className="flex h-10 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-2 text-xs focus-visible:outline-none"
                  >
                    {warehouses.filter(w => w.id !== currentMaterial.warehouseId).map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border-soft">
                <Button variant="outline" size="sm" onClick={() => setTxnType(null)}>Cancel</Button>
                <Button 
                  size="sm" 
                  loading={transactionMutation.isPending}
                  onClick={() => {
                    if (!txnQty || Number(txnQty) <= 0) {
                      toast.info("Please enter a valid quantity greater than zero.");
                      return;
                    }
                    transactionMutation.mutate();
                  }}
                >
                  Confirm Transaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EDIT DRAWER */}
      <Drawer
        open={isEditOpen}
        title="Edit Inventory Material"
        size="xl"
        onClose={() => {
          setIsEditOpen(false);
        }}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.8fr_1fr] h-full items-start">
          <div className="space-y-6">
            {/* Section 1 */}
            <div className="space-y-3">
              <h4 className="text-body font-semibold text-text-primary border-b border-border-soft pb-1">1. Material Information</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Material Name *</label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">SKU / Code *</label>
                  <Input
                    required
                    value={form.sku}
                    onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="flex h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-2 text-body focus-visible:outline-none"
                  >
                    <option value="Cement">Cement</option>
                    <option value="Steel">Steel</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Finishing">Finishing</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Sub Category</label>
                  <Input
                    value={form.subCategory}
                    onChange={(e) => setForm((prev) => ({ ...prev, subCategory: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h4 className="text-body font-semibold text-text-primary border-b border-border-soft pb-1">2. Warehouse & Location</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Warehouse *</label>
                  <select
                    value={form.warehouseId}
                    onChange={(e) => setForm((prev) => ({ ...prev, warehouseId: e.target.value }))}
                    className="flex h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-2 text-body focus-visible:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Location Zone</label>
                  <Input
                    value={form.locationZone}
                    onChange={(e) => setForm((prev) => ({ ...prev, locationZone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-label text-text-secondary">Project *</label>
                  <select
                    value={form.projectId}
                    onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
                    className="flex h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-2 text-body focus-visible:outline-none"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h4 className="text-body font-semibold text-text-primary border-b border-border-soft pb-1">3. Inventory Configuration</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">On Hand Quantity *</label>
                  <Input
                    type="number"
                    value={form.onHand}
                    onChange={(e) => setForm((prev) => ({ ...prev, onHand: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Measurement Unit *</label>
                  <Input
                    value={form.unit}
                    onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Reorder Threshold *</label>
                  <Input
                    type="number"
                    value={form.reorderLevel}
                    onChange={(e) => setForm((prev) => ({ ...prev, reorderLevel: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Minimum Stock Level</label>
                  <Input
                    type="number"
                    value={form.minStock}
                    onChange={(e) => setForm((prev) => ({ ...prev, minStock: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-label text-text-secondary">Maximum Stock Capacity</label>
                  <Input
                    type="number"
                    value={form.maxStock}
                    onChange={(e) => setForm((prev) => ({ ...prev, maxStock: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h4 className="text-body font-semibold text-text-primary border-b border-border-soft pb-1">4. Supplier Information</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-3">
                  <label className="text-label text-text-secondary">Supplier Name</label>
                  <Input
                    value={form.supplier}
                    onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-label text-text-secondary">Unit Cost (INR)</label>
                  <Input
                    type="number"
                    value={form.unitCost}
                    onChange={(e) => setForm((prev) => ({ ...prev, unitCost: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Lead Time (Days)</label>
                  <Input
                    type="number"
                    value={form.leadTime}
                    onChange={(e) => setForm((prev) => ({ ...prev, leadTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <h4 className="text-body font-semibold text-text-primary border-b border-border-soft pb-1">5. Consumption Settings</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Avg Consumption (Units / cycle)</label>
                  <Input
                    type="number"
                    value={form.averageConsumption}
                    onChange={(e) => setForm((prev) => ({ ...prev, averageConsumption: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Storage Notes</label>
                  <textarea
                    value={form.storageNotes}
                    onChange={(e) => setForm((prev) => ({ ...prev, storageNotes: e.target.value }))}
                    rows={2}
                    className="flex min-h-[80px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-3 py-2 text-body focus-visible:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Tags (Comma separated)</label>
                  <Input
                    value={form.tags}
                    onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border-soft">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button
                loading={saveMutation.isPending}
                onClick={() => {
                  if (!form.name || !form.sku) {
                    toast.error("Name and SKU are required.");
                    return;
                  }
                  saveMutation.mutate();
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>

          {/* Right Side summary */}
          <div className="sticky top-0 bg-surface-secondary border border-border-soft rounded-2xl p-5 space-y-6">
            <h3 className="text-section-title text-text-primary font-secondary pb-2 border-b border-border-soft">
              Live Summary Preview
            </h3>
            <div className="space-y-4 text-body">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Preview Value</p>
                <p className="text-3xl font-bold text-text-primary mt-1">
                  {liveValue >= 100000 
                    ? `₹${(liveValue / 100000).toFixed(2)} Lakhs` 
                    : `₹${liveValue.toLocaleString("en-IN")}`}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-y border-border-soft py-4">
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Preview Health</p>
                  <Badge tone={liveHealth === "Critical" ? "error" : liveHealth === "Low Stock" ? "warning" : "success"} className="mt-1">
                    {liveHealth}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Lead Runway</p>
                  <p className="font-semibold text-text-primary mt-1">{form.leadTime || "3"} Days</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Safety Runway</p>
                <p className="font-semibold text-text-primary mt-1">{liveAvgCons > 0 ? `${liveDays} Days` : "Infinite"}</p>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </section>
  );
}
