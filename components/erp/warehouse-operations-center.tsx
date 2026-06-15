"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  ChevronRight,
  CircleAlert,
  Download,
  ExternalLink,
  Gauge,
  MapPinned,
  MoreHorizontal,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TableEmptyStateRow, TableToolbar, SectionHeader } from "@/components/erp/page-primitives";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/erp-api";
import { formatDate, formatDateTime } from "@/lib/erp-utils";
import type {
  Material,
  MaterialConsumption,
  MaterialConsumptionResponse,
  MaterialsResponse,
  MaterialTransfer,
  MaterialTransfersResponse,
  PropertySummaryResponse,
  Warehouse as WarehouseRecord,
} from "@/lib/erp-types";
import { useUiStore } from "@/store/ui-store";

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";
const textareaClassName =
  "min-h-[112px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

const chartPalette = {
  blue: "#2563eb",
  cyan: "#06b6d4",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  slate: "#64748b",
  indigo: "#6366f1",
  rose: "#f43f5e",
};

const linePalette = [
  chartPalette.blue,
  chartPalette.cyan,
  chartPalette.green,
  chartPalette.amber,
  chartPalette.indigo,
  chartPalette.rose,
  "#0f766e",
  "#9333ea",
  "#ea580c",
  "#334155",
];

const storageTypeOptions = ["Bulk", "Racked", "Palletized", "Outdoor", "Fast-Moving", "Secured", "Cold Storage"];
const statusOptions = ["Operational", "Under Setup", "Maintenance", "Inactive"];
const quickFilterOptions = ["All Warehouses", "Operational", "At Capacity", "Underutilized", "Has Alerts"] as const;

type Tone = "success" | "warning" | "error" | "info" | "neutral";
type QuickFilter = (typeof quickFilterOptions)[number];

type WarehouseFormState = {
  name: string;
  code: string;
  location: string;
  region: string;
  latitude: string;
  longitude: string;
  capacity: string;
  capacityUtilization: string;
  storageTypes: string[];
  operatingHours: string;
  supervisor: string;
  assignedProjects: string[];
  materialCategories: string[];
  status: string;
  notes: string;
};

type WarehouseInsightRow = WarehouseRecord & {
  code: string;
  region: string;
  capacity: number;
  storageTypes: string[];
  supervisor: string;
  materialCategories: string[];
  assignedProjects: string[];
  skuCount: number;
  healthySkuCount: number;
  lowStockCount: number;
  criticalStockCount: number;
  inventoryValue: number;
  projectIds: string[];
  projectNames: string[];
  totalOnHand: number;
  healthScore: number;
  healthLabel: string;
  healthTone: Tone;
  coverageScore: number;
  capacityUsed: number;
  capacityRemaining: number;
  utilizationTrend: number[];
  inventoryTrend: number[];
  valueShare: number;
  statusTone: Tone;
};

type WarehouseNetworkSummary = {
  healthScore: number;
  healthDelta: number;
  healthLabel: string;
  healthTone: Tone;
  totalWarehouses: number;
  operationalWarehouses: number;
  averageUtilization: number;
  totalSkus: number;
  lowStockSkus: number;
  criticalSkus: number;
  totalInventoryValue: number;
  coverageScore: number;
  coveredProjects: number;
  uncoveredProjects: number;
  atCapacityCount: number;
  underutilizedCount: number;
  highestUtilizationWarehouse?: WarehouseInsightRow;
  lowestUtilizationWarehouse?: WarehouseInsightRow;
  concentrationLeader?: WarehouseInsightRow;
  topCoverageWarehouse?: WarehouseInsightRow;
  sparkline: number[];
};

type RecommendationCardData = {
  title: string;
  description: string;
  action: string;
  tone: Tone;
};

type WarehouseActivityEntry = {
  id: string;
  type: string;
  tone: Tone;
  title: string;
  detail: string;
  timestamp: string;
};

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function buildWarehouseCode(name: string, fallbackId: string) {
  const code = `${name || fallbackId}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return code.slice(0, 16) || fallbackId.toUpperCase();
}

function inferRegion(location: string) {
  const value = location.toLowerCase();
  if (value.includes("mumbai") || value.includes("pune") || value.includes("surat")) return "West";
  if (value.includes("bengaluru") || value.includes("hyderabad") || value.includes("chennai")) return "South";
  if (value.includes("kolkata") || value.includes("bhubaneswar") || value.includes("yamuna")) return "East";
  return "North";
}

function warehouseStatusTone(status: string): Tone {
  const value = status.toLowerCase();
  if (value.includes("operational")) return "success";
  if (value.includes("under setup")) return "info";
  if (value.includes("maintenance")) return "warning";
  if (value.includes("inactive")) return "neutral";
  return "neutral";
}

function healthState(score: number): { label: string; tone: Tone } {
  if (score >= 92) return { label: "Excellent", tone: "success" };
  if (score >= 84) return { label: "Healthy", tone: "success" };
  if (score >= 72) return { label: "Watch", tone: "warning" };
  return { label: "Critical", tone: "error" };
}

function capacityTone(utilization: number): Tone {
  if (utilization >= 90) return "error";
  if (utilization >= 76) return "warning";
  if (utilization >= 45) return "success";
  return "info";
}

function utilizationColor(utilization: number) {
  if (utilization >= 90) return chartPalette.red;
  if (utilization >= 76) return chartPalette.amber;
  return chartPalette.green;
}

function formatCompactCurrency(value: number) {
  if (value >= 10_000_000) return `INR ${(value / 10_000_000).toFixed(1)} Cr`;
  if (value >= 100_000) return `INR ${(value / 100_000).toFixed(1)} L`;
  if (value >= 1_000) return `INR ${(value / 1_000).toFixed(0)}k`;
  return `INR ${Math.round(value)}`;
}

function formatCompactNumber(value: number) {
  if (value >= 1000) return value.toLocaleString("en-IN");
  return `${value}`;
}

function estimateMaterialValue(material: Material) {
  const categoryRate: Record<string, number> = {
    Cement: 420,
    Steel: 62_000,
    Electrical: 8_500,
    Finishing: 3_200,
    Plumbing: 4_100,
    Hardware: 1_600,
  };
  const fallbackRate = material.unit === "tons" ? 55_000 : material.unit === "sets" ? 7_500 : 2_000;
  return material.onHand * (categoryRate[material.category] || fallbackRate);
}

function hashSeed(value: string) {
  return value.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

function buildSparkline(seed: number, base: number, length = 7) {
  return Array.from({ length }, (_, index) => {
    const swing = Math.sin((seed + index) / 3.2) * 4 + Math.cos((seed + index) / 4.7) * 2;
    return Math.max(0, Math.round(base + swing + index * 0.6));
  });
}

function buildTrendSeries(seed: number, base: number, length = 30) {
  return Array.from({ length }, (_, index) => {
    const swing = Math.sin((seed + index) / 4.5) * 5 + Math.cos((seed + index) / 7.2) * 3;
    return Math.max(0, Math.round(base + swing + index * 0.35));
  });
}

function createEmptyWarehouseForm(projectIds: string[] = []) {
  return {
    name: "",
    code: "",
    location: "",
    region: "North",
    latitude: "",
    longitude: "",
    capacity: "1200",
    capacityUtilization: "0",
    storageTypes: ["Racked", "Palletized"],
    operatingHours: "08:00 - 18:00",
    supervisor: "",
    assignedProjects: projectIds.slice(0, 1),
    materialCategories: [],
    status: "Operational",
    notes: "",
  } satisfies WarehouseFormState;
}

function normalizeWarehouse(warehouse: WarehouseRecord, materials: Material[]) {
  return {
    ...warehouse,
    code: warehouse.code || buildWarehouseCode(warehouse.name, warehouse.id),
    region: warehouse.region || inferRegion(warehouse.location),
    capacity: warehouse.capacity || 1200,
    storageTypes: warehouse.storageTypes?.length ? warehouse.storageTypes : ["Racked", "Palletized"],
    supervisor: warehouse.supervisor || "Warehouse Operations Desk",
    materialCategories:
      warehouse.materialCategories?.length
        ? warehouse.materialCategories
        : unique(materials.map((item) => item.category)),
    assignedProjects: warehouse.assignedProjects?.length ? warehouse.assignedProjects : unique(materials.map((item) => item.projectId)),
    notes: warehouse.notes || "",
    operatingHours: warehouse.operatingHours || "08:00 - 18:00",
    coordinates: warehouse.coordinates || { lat: "", lng: "" },
  };
}

function buildWarehouseInsights(
  warehouses: WarehouseRecord[],
  materials: Material[],
  projectIndex: Map<string, string>,
  totalProjectCount: number,
) {
  const rows = warehouses.map((warehouse) => {
    const warehouseMaterials = materials.filter((item) => item.warehouseId === warehouse.id);
    const normalizedWarehouse = normalizeWarehouse(warehouse, warehouseMaterials);
    const projectIds = unique([...normalizedWarehouse.assignedProjects, ...warehouseMaterials.map((item) => item.projectId)]);
    const projectNames = projectIds.map((projectId) => projectIndex.get(projectId) || projectId);
    const healthySkuCount = warehouseMaterials.filter((item) => item.onHand > item.reorderLevel).length;
    const lowStockCount = warehouseMaterials.filter(
      (item) => item.status === "Low Stock" || item.onHand <= item.reorderLevel,
    ).length;
    const criticalStockCount = warehouseMaterials.filter((item) => item.onHand <= item.reorderLevel * 0.6).length;
    const totalOnHand = warehouseMaterials.reduce((sum, item) => sum + item.onHand, 0);
    const inventoryValue = warehouseMaterials.reduce((sum, item) => sum + estimateMaterialValue(item), 0);
    const capacity = normalizedWarehouse.capacity || 1200;
    const capacityUsed = Math.round((capacity * normalizedWarehouse.capacityUtilization) / 100);
    const capacityRemaining = Math.max(0, capacity - capacityUsed);
    const coverageScore = totalProjectCount ? Math.round((projectIds.length / totalProjectCount) * 100) : 100;
    const utilizationScore =
      normalizedWarehouse.capacityUtilization > 95
        ? 58
        : clamp(100 - Math.abs(normalizedWarehouse.capacityUtilization - 72) * 1.4, 55, 100);
    const stockScore = warehouseMaterials.length
      ? clamp(
          100 -
            (lowStockCount / warehouseMaterials.length) * 28 -
            (criticalStockCount / warehouseMaterials.length) * 32,
          45,
          100,
        )
      : 82;
    const statusPenalty = normalizedWarehouse.status === "Operational" ? 0 : normalizedWarehouse.status === "Under Setup" ? 10 : normalizedWarehouse.status === "Maintenance" ? 15 : 25;
    const healthScore = clamp(
      Math.round(utilizationScore * 0.35 + stockScore * 0.4 + coverageScore * 0.25 - statusPenalty),
      32,
      99,
    );
    const state = healthState(healthScore);
    const seed = hashSeed(warehouse.id);

    return {
      ...normalizedWarehouse,
      projectIds,
      projectNames,
      skuCount: warehouseMaterials.length,
      healthySkuCount,
      lowStockCount,
      criticalStockCount,
      totalOnHand,
      inventoryValue,
      healthScore,
      healthLabel: state.label,
      healthTone: state.tone,
      coverageScore,
      capacityUsed,
      capacityRemaining,
      utilizationTrend: buildSparkline(seed, normalizedWarehouse.capacityUtilization),
      inventoryTrend: buildSparkline(seed + 18, Math.max(6, inventoryValue / 100_000)),
      valueShare: 0,
      statusTone: warehouseStatusTone(normalizedWarehouse.status),
    } satisfies WarehouseInsightRow;
  });

  const totalInventoryValue = rows.reduce((sum, row) => sum + row.inventoryValue, 0);

  return rows.map((row) => ({
    ...row,
    valueShare: totalInventoryValue ? Math.round((row.inventoryValue / totalInventoryValue) * 100) : 0,
  }));
}

function buildNetworkSummary(rows: WarehouseInsightRow[], totalProjectCount: number) {
  const healthScore = Math.round(average(rows.map((row) => row.healthScore)));
  const sparkline = Array.from({ length: 7 }, (_, index) =>
    Math.round(average(rows.map((row) => row.utilizationTrend[index] || row.capacityUtilization))),
  );
  const healthDelta = Number((((sparkline[sparkline.length - 1] || healthScore) - (sparkline[0] || healthScore)) / 2.5).toFixed(1));
  const coveredProjects = unique(rows.flatMap((row) => row.projectIds)).length;
  const state = healthState(healthScore);
  const sortedByValue = [...rows].sort((left, right) => right.inventoryValue - left.inventoryValue);
  const sortedByCoverage = [...rows].sort((left, right) => right.coverageScore - left.coverageScore);

  return {
    healthScore,
    healthDelta,
    healthLabel: healthScore >= 88 ? "Storage Network Healthy" : healthScore >= 76 ? "Warehouse Network Stable" : "Warehouse Network Requires Attention",
    healthTone: state.tone,
    totalWarehouses: rows.length,
    operationalWarehouses: rows.filter((row) => row.status === "Operational").length,
    averageUtilization: Math.round(average(rows.map((row) => row.capacityUtilization))),
    totalSkus: rows.reduce((sum, row) => sum + row.skuCount, 0),
    lowStockSkus: rows.reduce((sum, row) => sum + row.lowStockCount, 0),
    criticalSkus: rows.reduce((sum, row) => sum + row.criticalStockCount, 0),
    totalInventoryValue: rows.reduce((sum, row) => sum + row.inventoryValue, 0),
    coverageScore: totalProjectCount ? Math.round((coveredProjects / totalProjectCount) * 100) : 100,
    coveredProjects,
    uncoveredProjects: Math.max(0, totalProjectCount - coveredProjects),
    atCapacityCount: rows.filter((row) => row.capacityUtilization >= 90).length,
    underutilizedCount: rows.filter((row) => row.capacityUtilization <= 40).length,
    highestUtilizationWarehouse: [...rows].sort((left, right) => right.capacityUtilization - left.capacityUtilization)[0],
    lowestUtilizationWarehouse: [...rows].sort((left, right) => left.capacityUtilization - right.capacityUtilization)[0],
    concentrationLeader: sortedByValue[0],
    topCoverageWarehouse: sortedByCoverage[0],
    sparkline,
  } satisfies WarehouseNetworkSummary;
}

function buildRecommendations(summary: WarehouseNetworkSummary): RecommendationCardData[] {
  const recommendations: RecommendationCardData[] = [];

  if (summary.highestUtilizationWarehouse) {
    recommendations.push({
      title: "Capacity Alert",
      description: `${summary.highestUtilizationWarehouse.name} is operating at ${summary.highestUtilizationWarehouse.capacityUtilization}% utilization.`,
      action: "Review Expansion",
      tone: summary.highestUtilizationWarehouse.capacityUtilization >= 90 ? "error" : "warning",
    });
  }

  if (summary.lowStockSkus > 0) {
    recommendations.push({
      title: "Inventory Risk",
      description: `${summary.lowStockSkus} SKUs are below reorder threshold across the storage network.`,
      action: "View Risks",
      tone: summary.criticalSkus > 0 ? "error" : "warning",
    });
  }

  if (summary.lowestUtilizationWarehouse) {
    recommendations.push({
      title: "Underutilized Asset",
      description: `${summary.lowestUtilizationWarehouse.name} is operating at ${summary.lowestUtilizationWarehouse.capacityUtilization}% utilization.`,
      action: "Review Allocation",
      tone: summary.lowestUtilizationWarehouse.capacityUtilization <= 40 ? "info" : "neutral",
    });
  }

  if (summary.uncoveredProjects > 0) {
    recommendations.push({
      title: "Coverage Opportunity",
      description: `${summary.uncoveredProjects} active projects do not yet have warehouse support mapped into the network.`,
      action: "Review Coverage",
      tone: "info",
    });
  }

  if (summary.concentrationLeader) {
    recommendations.push({
      title: "Stock Imbalance",
      description: `${summary.concentrationLeader.name} currently holds ${summary.concentrationLeader.valueShare}% of network inventory value.`,
      action: "Optimize Distribution",
      tone: summary.concentrationLeader.valueShare >= 40 ? "warning" : "success",
    });
  }

  return recommendations;
}

function buildWarehouseMatrix(rows: WarehouseInsightRow[]) {
  return [...rows]
    .sort((left, right) => right.healthScore - left.healthScore)
    .map((row) => ({
      id: row.id,
      name: row.name,
      utilization: row.capacityUtilization,
      skus: row.skuCount,
      projects: row.projectIds.length,
      lowStock: row.lowStockCount,
      health: row.healthScore,
      tone: row.healthTone,
    }));
}

function buildStockTrendData(rows: WarehouseInsightRow[]) {
  const series = rows.map((row) => ({
    key: row.code,
    values: buildTrendSeries(hashSeed(row.id), Math.max(14, row.totalOnHand / 16)),
  }));

  return Array.from({ length: 30 }, (_, index) => {
    const point: Record<string, number | string> = {
      date: `D${index + 1}`,
    };

    series.forEach((entry) => {
      point[entry.key] = entry.values[index];
    });

    return point;
  });
}

function buildDrawerHealthScore(form: WarehouseFormState, totalProjects: number) {
  const utilization = Number(form.capacityUtilization) || 0;
  const projectCoverage = totalProjects ? Math.round((form.assignedProjects.length / totalProjects) * 100) : 100;
  const storageBonus = Math.min(12, form.storageTypes.length * 3);
  const statusPenalty = form.status === "Operational" ? 0 : form.status === "Under Setup" ? 8 : form.status === "Maintenance" ? 14 : 24;
  return clamp(Math.round(70 + projectCoverage * 0.18 + storageBonus - Math.abs(utilization - 72) * 0.5 - statusPenalty), 24, 98);
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildWarehouseCsv(rows: WarehouseInsightRow[]) {
  const headers = [
    "Warehouse",
    "Code",
    "Location",
    "Region",
    "Utilization",
    "Total SKUs",
    "Projects Covered",
    "Inventory Value",
    "Health Alerts",
    "Status",
  ];
  const lines = rows.map((row) => [
    row.name,
    row.code,
    row.location,
    row.region,
    `${row.capacityUtilization}%`,
    `${row.skuCount}`,
    `${row.projectIds.length}`,
    `${row.inventoryValue}`,
    `${row.lowStockCount + row.criticalStockCount}`,
    row.status,
  ]);
  return [headers, ...lines]
    .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function buildStorageReport(summary: WarehouseNetworkSummary, rows: WarehouseInsightRow[]) {
  return [
    "Warehouse Operations Center",
    "",
    `Network health score: ${summary.healthScore}/100`,
    `Operational warehouses: ${summary.operationalWarehouses}/${summary.totalWarehouses}`,
    `Average utilization: ${summary.averageUtilization}%`,
    `Inventory value: ${formatCompactCurrency(summary.totalInventoryValue)}`,
    `Project coverage: ${summary.coveredProjects} covered, ${summary.uncoveredProjects} uncovered`,
    `Low stock SKUs: ${summary.lowStockSkus}`,
    `Critical SKUs: ${summary.criticalSkus}`,
    "",
    "Top warehouses by health",
    ...rows
      .slice(0, 5)
      .map(
        (row, index) =>
          `${index + 1}. ${row.name} | Health ${row.healthScore} | Utilization ${row.capacityUtilization}% | Inventory ${formatCompactCurrency(row.inventoryValue)}`,
      ),
  ].join("\n");
}

function CircularProgress({ value, size = 126, strokeWidth = 12 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          strokeWidth={strokeWidth}
          stroke="rgba(15, 23, 42, 0.08)"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          strokeWidth={strokeWidth}
          stroke={chartPalette.blue}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-[34px] font-bold tracking-[-0.04em] text-text-primary">{value}</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Health</div>
      </div>
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const data = values.map((value, index) => ({ index, value }));
  const gradientId = `spark-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.28} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.75} dot={false} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function InsightMetricCard({
  label,
  value,
  trend,
  insight,
  status,
  tone,
  icon,
  sparkline,
}: {
  label: string;
  value: string;
  trend: string;
  insight: string;
  status: string;
  tone: Tone;
  icon: React.ReactNode;
  sparkline: number[];
}) {
  const color =
    tone === "success"
      ? chartPalette.green
      : tone === "warning"
        ? chartPalette.amber
        : tone === "error"
          ? chartPalette.red
          : chartPalette.blue;

  return (
    <Card className="overflow-hidden border border-border-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-secondary text-accent-primary shadow-soft">
            {icon}
          </div>
          <Badge tone={tone}>{status}</Badge>
        </div>
        <div>
          <p className="text-label uppercase tracking-[0.14em] text-text-muted">{label}</p>
          <p className="mt-2 text-[28px] font-bold tracking-[-0.04em] text-text-primary">{value}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-label font-semibold ${tone === "error" ? "text-error" : tone === "warning" ? "text-warning" : "text-success"}`}>{trend}</p>
            <p className="mt-1 text-body text-text-secondary">{insight}</p>
          </div>
          <div className="h-10 w-24">
            <Sparkline values={sparkline} color={color} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ item }: { item: RecommendationCardData }) {
  return (
    <Card className="border border-border-soft transition-all duration-200 hover:shadow-soft">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-card-title text-text-primary">{item.title}</p>
          <Badge tone={item.tone}>
            {item.tone === "error"
              ? "Critical"
              : item.tone === "warning"
                ? "Warning"
                : item.tone === "success"
                  ? "Success"
                  : item.tone === "info"
                    ? "Information"
                    : "Watch"}
          </Badge>
        </div>
        <p className="text-body text-text-secondary">{item.description}</p>
        <Button variant="ghost" size="sm" className="px-0 text-accent-primary hover:bg-transparent hover:text-accent-primary">
          {item.action}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function MiniProgressBar({ value, tone }: { value: number; tone: Tone }) {
  const barClass =
    tone === "error" ? "bg-error" : tone === "warning" ? "bg-warning" : tone === "success" ? "bg-success" : "bg-info";
  return (
    <div className="space-y-1.5">
      <div className="h-2 rounded-full bg-surface-secondary">
        <div className={`${barClass} h-2 rounded-full`} style={{ width: `${Math.min(100, Math.max(4, value))}%` }} />
      </div>
      <div className="flex items-center justify-between text-label text-text-secondary">
        <span>{value}%</span>
        <span>{value >= 90 ? "High load" : value <= 40 ? "Low load" : "Balanced"}</span>
      </div>
    </div>
  );
}

function DrawerSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border-soft bg-surface p-5">
      <div className="space-y-1">
        <h3 className="text-card-title text-text-primary">{title}</h3>
        <p className="text-body text-text-secondary">{description}</p>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={`${selectClassName} !h-10 !w-auto !py-0 !text-label`}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function WarehouseRowMenu({
  row,
  open,
  onToggle,
  onView,
  onEdit,
}: {
  row: WarehouseInsightRow;
  open: boolean;
  onToggle: () => void;
  onView: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open ? (
        <div
          className="absolute right-0 top-10 z-20 min-w-[180px] rounded-[20px] border border-border-soft bg-white p-2 shadow-floating"
          onClick={(event) => event.stopPropagation()}
        >
          {[
            { label: "View", action: onView },
            { label: "Edit", action: onEdit },
            { label: "View Materials", action: onView },
            { label: "Transfers", action: onView },
            { label: "Reports", action: onView },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.action()}
              className="flex w-full items-center justify-between rounded-[14px] px-3 py-2 text-left text-body text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function useWarehouseBaseData() {
  const role = useUiStore((state) => state.role);

  const materialsQuery = useQuery({
    queryKey: ["erp-materials", role],
    queryFn: async () => (await apiRequest<MaterialsResponse>("/api/materials", { role })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  return { role, materialsQuery, projectsQuery };
}

export function WarehousesWorkspace() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role, materialsQuery, projectsQuery } = useWarehouseBaseData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [utilizationFilter, setUtilizationFilter] = useState("All");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("All Warehouses");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<WarehouseFormState>(() => createEmptyWarehouseForm());

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, statusFilter, regionFilter, utilizationFilter, quickFilter, rowsPerPage]);

  const projectIds = useMemo(
    () => (projectsQuery.data?.projects || []).map((project) => project.id),
    [projectsQuery.data?.projects],
  );

  const projectIndex = useMemo(
    () =>
      new Map((projectsQuery.data?.projects || []).map((project) => [project.id, project.name])),
    [projectsQuery.data?.projects],
  );

  const categoryOptions = useMemo(
    () => unique((materialsQuery.data?.materials || []).map((item) => item.category)).sort(),
    [materialsQuery.data?.materials],
  );

  const warehouseRows = useMemo(() => {
    if (!materialsQuery.data) return [];
    return buildWarehouseInsights(
      materialsQuery.data.warehouses,
      materialsQuery.data.materials,
      projectIndex,
      (projectsQuery.data?.projects || []).length,
    );
  }, [materialsQuery.data, projectIndex, projectsQuery.data?.projects]);

  const summary = useMemo(
    () => buildNetworkSummary(warehouseRows, (projectsQuery.data?.projects || []).length),
    [warehouseRows, projectsQuery.data?.projects],
  );

  const recommendations = useMemo(() => buildRecommendations(summary), [summary]);

  const regionOptions = useMemo(
    () => ["All", ...unique(warehouseRows.map((row) => row.region)).sort()],
    [warehouseRows],
  );

  const filteredRows = useMemo(() => {
    return warehouseRows.filter((row) => {
      const query = searchValue.trim().toLowerCase();
      const matchesSearch =
        !query ||
        row.name.toLowerCase().includes(query) ||
        row.code.toLowerCase().includes(query) ||
        row.location.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesRegion = regionFilter === "All" || row.region === regionFilter;
      const matchesUtilization =
        utilizationFilter === "All" ||
        (utilizationFilter === "At Capacity" && row.capacityUtilization >= 90) ||
        (utilizationFilter === "Healthy" && row.capacityUtilization >= 55 && row.capacityUtilization < 90) ||
        (utilizationFilter === "Underutilized" && row.capacityUtilization <= 40);
      const matchesQuickFilter =
        quickFilter === "All Warehouses" ||
        (quickFilter === "Operational" && row.status === "Operational") ||
        (quickFilter === "At Capacity" && row.capacityUtilization >= 90) ||
        (quickFilter === "Underutilized" && row.capacityUtilization <= 40) ||
        (quickFilter === "Has Alerts" && row.lowStockCount + row.criticalStockCount > 0);

      return matchesSearch && matchesStatus && matchesRegion && matchesUtilization && matchesQuickFilter;
    });
  }, [warehouseRows, searchValue, statusFilter, regionFilter, utilizationFilter, quickFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = filteredRows.slice((safeCurrentPage - 1) * rowsPerPage, safeCurrentPage * rowsPerPage);
  const pageStart = filteredRows.length ? (safeCurrentPage - 1) * rowsPerPage + 1 : 0;
  const pageEnd = Math.min(filteredRows.length, safeCurrentPage * rowsPerPage);

  const matrixRows = useMemo(() => buildWarehouseMatrix(warehouseRows), [warehouseRows]);
  const stockTrendData = useMemo(() => buildStockTrendData(warehouseRows), [warehouseRows]);
  const healthToneData = healthState(summary.healthScore);

  const saveMutation = useMutation({
    mutationFn: async () =>
      apiRequest(editingWarehouseId ? `/api/materials/warehouses/${editingWarehouseId}` : "/api/materials/warehouses", {
        role,
        method: editingWarehouseId ? "PATCH" : "POST",
        body: {
          name: form.name,
          code: form.code || buildWarehouseCode(form.name, "warehouse"),
          location: form.location,
          region: form.region,
          coordinates: { lat: form.latitude, lng: form.longitude },
          capacity: Number(form.capacity) || 0,
          capacityUtilization: Number(form.capacityUtilization) || 0,
          storageTypes: form.storageTypes,
          operatingHours: form.operatingHours,
          supervisor: form.supervisor,
          assignedProjects: form.assignedProjects,
          materialCategories: form.materialCategories,
          status: form.status,
          notes: form.notes,
        },
      }),
    onSuccess: async () => {
      setDrawerOpen(false);
      setEditingWarehouseId(null);
      setForm(createEmptyWarehouseForm(projectIds));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-material-alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (warehouseId: string) =>
      apiRequest(`/api/materials/warehouses/${warehouseId}/archive`, {
        role,
        method: "PATCH",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-material-alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
      ]);
    },
  });

  if (materialsQuery.isLoading || projectsQuery.isLoading) {
    return <LoadingStateCard title="Loading Warehouse Operations Center" />;
  }

  if (materialsQuery.error || projectsQuery.error || !materialsQuery.data || !projectsQuery.data) {
    return <ErrorStateCard message="Warehouse operations intelligence is unavailable." />;
  }

  const utilizationChartRows = [...warehouseRows]
    .sort((left, right) => right.capacityUtilization - left.capacityUtilization)
    .slice(0, 8);
  const inventoryHealthRows = [...warehouseRows]
    .sort((left, right) => right.lowStockCount + right.criticalStockCount - (left.lowStockCount + left.criticalStockCount))
    .slice(0, 8);
  const rankedRows = [...warehouseRows].sort((left, right) => right.healthScore - left.healthScore);

  const activeFilters = [
    statusFilter !== "All" ? statusFilter : "",
    regionFilter !== "All" ? regionFilter : "",
    utilizationFilter !== "All" ? utilizationFilter : "",
    quickFilter !== "All Warehouses" ? quickFilter : "",
  ].filter(Boolean);

  const openCreateDrawer = () => {
    setEditingWarehouseId(null);
    setForm(createEmptyWarehouseForm(projectIds));
    setDrawerOpen(true);
  };

  const openEditDrawer = (row: WarehouseInsightRow) => {
    setEditingWarehouseId(row.id);
    setForm({
      name: row.name,
      code: row.code,
      location: row.location,
      region: row.region,
      latitude: row.coordinates?.lat || "",
      longitude: row.coordinates?.lng || "",
      capacity: `${row.capacity}`,
      capacityUtilization: `${row.capacityUtilization}`,
      storageTypes: row.storageTypes,
      operatingHours: row.operatingHours || "08:00 - 18:00",
      supervisor: row.supervisor,
      assignedProjects: row.assignedProjects,
      materialCategories: row.materialCategories,
      status: row.status,
      notes: row.notes || "",
    });
    setDrawerOpen(true);
  };

  const clearFilters = () => {
    setSearchValue("");
    setStatusFilter("All");
    setRegionFilter("All");
    setUtilizationFilter("All");
    setQuickFilter("All Warehouses");
  };

  const drawerHealthScore = buildDrawerHealthScore(form, projectsQuery.data.projects.length);
  const drawerHealth = healthState(drawerHealthScore);
  const drawerCapacity = Number(form.capacity) || 0;
  const drawerUtilization = Number(form.capacityUtilization) || 0;
  const drawerRemaining = Math.max(0, Math.round(drawerCapacity - (drawerCapacity * drawerUtilization) / 100));

  return (
    <section className="space-y-8 pb-12">
      <SectionHeader
        title="Warehouse Operations Center"
        description="Monitor storage utilization, inventory distribution, warehouse performance, stock health, and project coverage across the organization."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={openCreateDrawer}>
              <Plus className="h-4 w-4" />
              Add Warehouse
            </Button>
            <Button variant="secondary" onClick={() => downloadFile("warehouse-register.csv", buildWarehouseCsv(filteredRows), "text/csv;charset=utf-8;")}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById("warehouse-analytics-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <BarChart3 className="h-4 w-4" />
              Warehouse Analytics
            </Button>
            <Button variant="outline" onClick={() => downloadFile("storage-report.txt", buildStorageReport(summary, rankedRows), "text/plain;charset=utf-8;")}>
              <Sparkles className="h-4 w-4" />
              Storage Report
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="border border-border-soft bg-surface shadow-soft">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="rounded-[28px] bg-gradient-to-br from-accent-primary/6 via-surface-secondary to-accent-secondary/8 p-4 w-fit">
                  <CircularProgress value={summary.healthScore} />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={healthToneData.tone}>{summary.healthLabel}</Badge>
                    <Badge tone={summary.healthDelta >= 0 ? "success" : "warning"}>
                      {summary.healthDelta >= 0 ? "+" : ""}
                      {summary.healthDelta}% vs Last Month
                    </Badge>
                  </div>
                  <div>
                    <p className="text-label uppercase tracking-[0.16em] text-text-muted">Warehouse Health Score</p>
                    <p className="mt-2 text-[40px] font-bold tracking-[-0.05em] text-text-primary">
                      {summary.healthScore} <span className="text-xl text-text-muted">/ 100</span>
                    </p>
                  </div>
                  <p className="max-w-2xl text-body text-text-secondary">
                    Storage network health is being driven by {summary.operationalWarehouses} operational warehouses, average utilization of {summary.averageUtilization}%, and project coverage of {summary.coverageScore}%.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 pt-4 border-t border-border-soft">
                {[
                  { label: "Operational Warehouses", value: `${summary.operationalWarehouses}`, tone: "success" as Tone },
                  { label: "Capacity Utilization", value: `${summary.averageUtilization}%`, tone: capacityTone(summary.averageUtilization) },
                  { label: "Stock Value", value: formatCompactCurrency(summary.totalInventoryValue), tone: "info" as Tone },
                  { label: "Coverage Score", value: `${summary.coverageScore}%`, tone: summary.coverageScore >= 80 ? "success" : "warning" as Tone },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-border-soft bg-surface-secondary/70 p-4">
                    <p className="text-label text-text-secondary">{item.label}</p>
                    <p className="mt-2 text-[22px] font-bold tracking-[-0.03em] text-text-primary">{item.value}</p>
                    <Badge tone={item.tone} className="mt-3">
                      {item.tone === "success" ? "Healthy" : item.tone === "warning" ? "Watch" : "Active"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[22px] border border-border-soft bg-surface-secondary/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-label text-text-secondary">Network Watchlist</p>
                  <p className="mt-1 text-card-title text-text-primary">
                    {summary.atCapacityCount} at capacity, {summary.underutilizedCount} underutilized
                  </p>
                </div>
                <CircleAlert className="h-5 w-5 text-warning" />
              </div>
            </div>
            <div className="rounded-[22px] border border-border-soft bg-surface-secondary/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-label text-text-secondary">Inventory Concentration</p>
                  <p className="mt-1 text-card-title text-text-primary">
                    {summary.concentrationLeader?.name || "No leader"}
                  </p>
                  <p className="mt-1 text-body text-text-secondary">
                    {summary.concentrationLeader ? `${summary.concentrationLeader.valueShare}% of value concentrated in a single warehouse.` : "Distribution balanced across the network."}
                  </p>
                </div>
                <Boxes className="h-5 w-5 text-accent-primary" />
              </div>
            </div>
            <div className="rounded-[22px] border border-border-soft bg-surface-secondary/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-label text-text-secondary">Coverage Opportunity</p>
                  <p className="mt-1 text-card-title text-text-primary">{summary.uncoveredProjects} projects need nearby support</p>
                </div>
                <MapPinned className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InsightMetricCard
          label="Warehouses"
          value={`${summary.totalWarehouses}`}
          trend={`${summary.operationalWarehouses} operational`}
          insight="Storage nodes active across the organization."
          status="Network Footprint"
          tone="info"
          icon={<Warehouse className="h-5 w-5" />}
          sparkline={summary.sparkline}
        />
        <InsightMetricCard
          label="Average Utilization"
          value={`${summary.averageUtilization}%`}
          trend={`${summary.healthDelta >= 0 ? "▲" : "▼"} ${Math.abs(summary.healthDelta)}%`}
          insight="Healthy utilization across the storage network."
          status={summary.averageUtilization >= 90 ? "Needs Capacity" : "Balanced"}
          tone={capacityTone(summary.averageUtilization)}
          icon={<Gauge className="h-5 w-5" />}
          sparkline={summary.sparkline}
        />
        <InsightMetricCard
          label="Total SKUs Stored"
          value={formatCompactNumber(summary.totalSkus)}
          trend={`${summary.coveredProjects} projects supported`}
          insight="Inventory visibility across warehouse operations."
          status="SKU Coverage"
          tone="success"
          icon={<Boxes className="h-5 w-5" />}
          sparkline={buildSparkline(17, Math.max(12, summary.totalSkus / 10))}
        />
        <InsightMetricCard
          label="Low Stock SKUs"
          value={`${summary.lowStockSkus}`}
          trend={summary.criticalSkus > 0 ? `${summary.criticalSkus} critical` : "Requires attention"}
          insight="Reorder pressure currently visible in the network."
          status={summary.lowStockSkus > 0 ? "Attention" : "Stable"}
          tone={summary.lowStockSkus > 0 ? "warning" : "success"}
          icon={<AlertTriangle className="h-5 w-5" />}
          sparkline={buildSparkline(28, Math.max(3, summary.lowStockSkus))}
        />
        <InsightMetricCard
          label="Total Inventory Value"
          value={formatCompactCurrency(summary.totalInventoryValue)}
          trend={`${summary.concentrationLeader?.valueShare || 0}% in ${summary.concentrationLeader?.code || "top node"}`}
          insight="Across the warehouse network."
          status="Capital at Storage"
          tone="info"
          icon={<BarChart3 className="h-5 w-5" />}
          sparkline={buildSparkline(39, Math.max(6, summary.totalInventoryValue / 100_000))}
        />
        <InsightMetricCard
          label="Project Coverage"
          value={`${summary.coverageScore}%`}
          trend={`${summary.coveredProjects}/${summary.coveredProjects + summary.uncoveredProjects} projects`}
          insight="Warehouse support aligned to active projects."
          status={summary.coverageScore >= 80 ? "Covered" : "Expand Support"}
          tone={summary.coverageScore >= 80 ? "success" : "warning"}
          icon={<Building2 className="h-5 w-5" />}
          sparkline={buildSparkline(51, summary.coverageScore)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-5">
        {recommendations.map((item) => (
          <RecommendationCard key={item.title} item={item} />
        ))}
      </div>

      <div id="warehouse-analytics-section" className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Capacity Utilization by Warehouse</CardTitle>
            <Badge tone="neutral">Horizontal Bar Chart</Badge>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationChartRows} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.18)" />
                <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="code" width={88} tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <Tooltip formatter={(value) => [`${Number(value) || 0}%`, "Utilization"]} />
                <Bar dataKey="capacityUtilization" radius={[0, 4, 4, 0]} barSize={16}>
                  {utilizationChartRows.map((row) => (
                    <Cell key={row.id} fill={utilizationColor(row.capacityUtilization)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Inventory Health Distribution</CardTitle>
            <Badge tone="neutral">Healthy vs Low vs Critical</Badge>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryHealthRows} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.18)" />
                <XAxis dataKey="code" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="healthySkuCount" stackId="inventory" fill={chartPalette.green} radius={[4, 4, 0, 0]} />
                <Bar dataKey="lowStockCount" stackId="inventory" fill={chartPalette.amber} />
                <Bar dataKey="criticalStockCount" stackId="inventory" fill={chartPalette.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Warehouse Stock Trend</CardTitle>
            <Badge tone="neutral">Last 30 Days</Badge>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockTrendData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.18)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                <Tooltip />
                {warehouseRows.map((row, index) => (
                  <Line
                    key={row.id}
                    type="monotone"
                    dataKey={row.code}
                    stroke={linePalette[index % linePalette.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Warehouse Health Matrix</CardTitle>
            <Badge tone="neutral">Interactive Scorecard Grid</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {matrixRows.slice(0, 8).map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => router.push(`/materials/warehouses/${row.id}`)}
                className="flex w-full items-center justify-between rounded-[20px] border border-border-soft bg-surface-secondary/60 px-4 py-3 text-left transition-all duration-200 hover:border-accent-primary/20 hover:bg-surface-secondary"
              >
                <div>
                  <p className="text-card-title text-text-primary">{row.name}</p>
                  <p className="mt-1 text-body text-text-secondary">
                    Utilization {row.utilization}% | SKUs {row.skus} | Projects {row.projects}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={row.tone}>{row.health}</Badge>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-section-title font-secondary text-text-primary">Warehouse Network Overview</h2>
            <p className="mt-1 text-body text-text-secondary">
              Ranked warehouse cards showing utilization, inventory concentration, project coverage, and active health signals.
            </p>
          </div>
          <Badge tone="neutral">{rankedRows.length} ranked nodes</Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {rankedRows.slice(0, 6).map((row, index) => (
            <button
              key={row.id}
              type="button"
              onClick={() => router.push(`/materials/warehouses/${row.id}`)}
              className="rounded-[var(--radius-card)] border border-border-soft bg-surface text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium"
            >
              <div className="border-b border-border-soft px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-5 w-5 text-accent-primary" />
                      <p className="text-card-title text-text-primary">{row.name}</p>
                    </div>
                    <p className="mt-1 text-body text-text-secondary">
                      {row.location} | {row.region} | {row.code}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={row.healthTone}>Rank #{index + 1}</Badge>
                    <div className="mt-2">
                      <Badge tone={row.statusTone}>{row.status}</Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 px-6 py-5">
                <MiniProgressBar value={row.capacityUtilization} tone={capacityTone(row.capacityUtilization)} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-label text-text-secondary">Inventory Value</p>
                    <p className="mt-1 text-card-title text-text-primary">{formatCompactCurrency(row.inventoryValue)}</p>
                  </div>
                  <div>
                    <p className="text-label text-text-secondary">Projects Covered</p>
                    <p className="mt-1 text-card-title text-text-primary">{row.projectIds.length}</p>
                  </div>
                  <div>
                    <p className="text-label text-text-secondary">SKU Count</p>
                    <p className="mt-1 text-card-title text-text-primary">{row.skuCount}</p>
                  </div>
                  <div>
                    <p className="text-label text-text-secondary">Health Score</p>
                    <p className="mt-1 text-card-title text-text-primary">{row.healthScore}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-[18px] bg-surface-secondary/70 px-4 py-3">
                  <div>
                    <p className="text-label text-text-secondary">Trend</p>
                    <p className="mt-1 text-body font-semibold text-text-primary">
                      {row.capacityUtilization >= 90 ? "Capacity pressure" : row.capacityUtilization <= 40 ? "Idle potential" : "Healthy utilization"}
                    </p>
                  </div>
                  <Badge tone={row.healthTone}>{row.healthLabel}</Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden border border-border-soft">
        <CardHeader>
          <CardTitle>Warehouse Register</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <TableToolbar
            searchPlaceholder="Search warehouse, code, or location"
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            resultLabel={`${filteredRows.length} Warehouses`}
            summary={`Showing ${pageStart}-${pageEnd} of ${filteredRows.length} warehouses`}
            activeFilters={activeFilters}
            onClear={clearFilters}
            actions={
              <>
                <Button variant="secondary" size="sm" onClick={() => downloadFile("warehouse-register.csv", buildWarehouseCsv(filteredRows), "text/csv;charset=utf-8;")}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </>
            }
            filters={
              <>
                <FilterSelect value={statusFilter} onChange={setStatusFilter} options={["All", ...statusOptions]} />
                <FilterSelect value={regionFilter} onChange={setRegionFilter} options={regionOptions} />
                <FilterSelect value={utilizationFilter} onChange={setUtilizationFilter} options={["All", "At Capacity", "Healthy", "Underutilized"]} />
                <div className="mx-1 h-8 w-px bg-border-soft" />
                {quickFilterOptions.map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant={quickFilter === item ? "primary" : "ghost"}
                    onClick={() => setQuickFilter(item)}
                    className="whitespace-nowrap"
                  >
                    {item}
                  </Button>
                ))}
              </>
            }
          />

          <div className="overflow-auto">
            <table className="w-full min-w-[1340px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">Warehouse</th>
                  <th className="px-4 text-left">Location</th>
                  <th className="px-4 text-left">Region</th>
                  <th className="px-4 text-left">Utilization</th>
                  <th className="px-4 text-left">Total SKUs</th>
                  <th className="px-4 text-left">Projects Covered</th>
                  <th className="px-4 text-left">Inventory Value</th>
                  <th className="px-4 text-left">Health Alerts</th>
                  <th className="px-4 text-left">Status</th>
                  <th className="px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <TableEmptyStateRow
                    colSpan={10}
                    title="No warehouses match the active filters"
                    description="Reset filters or widen the warehouse search scope to view additional storage nodes."
                  />
                ) : (
                  pagedRows.map((row) => (
                    <tr
                      key={row.id}
                      className="group cursor-pointer border-t border-border-soft transition-colors hover:bg-surface-secondary/60"
                      onClick={() => router.push(`/materials/warehouses/${row.id}`)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-soft bg-surface shadow-soft group-hover:border-accent-primary/25">
                            <Warehouse className="h-4 w-4 text-accent-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{row.name}</p>
                            <p className="text-label text-text-secondary">{row.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">{row.location}</td>
                      <td className="px-4 py-4">{row.region}</td>
                      <td className="px-4 py-4">
                        <div className="max-w-[180px]">
                          <MiniProgressBar value={row.capacityUtilization} tone={capacityTone(row.capacityUtilization)} />
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-text-primary">{row.skuCount}</td>
                      <td className="px-4 py-4">{row.projectIds.length}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold text-text-primary">{formatCompactCurrency(row.inventoryValue)}</p>
                            <p className="text-label text-text-secondary">{row.valueShare}% of network</p>
                          </div>
                          <div className="h-10 w-20">
                            <Sparkline values={row.inventoryTrend} color={chartPalette.blue} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Badge tone={row.criticalStockCount > 0 ? "error" : row.lowStockCount > 0 ? "warning" : "success"}>
                            {row.lowStockCount + row.criticalStockCount}
                          </Badge>
                          {row.criticalStockCount > 0 ? <span className="text-label font-semibold text-error">Critical</span> : null}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={row.statusTone}>{row.status}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditDrawer(row);
                            }}
                          >
                            Edit
                          </Button>
                          {row.status !== "Inactive" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              loading={archiveMutation.isPending}
                              onClick={(event) => {
                                event.stopPropagation();
                                archiveMutation.mutate(row.id);
                              }}
                            >
                              Archive
                            </Button>
                          ) : null}
                          <WarehouseRowMenu
                            row={row}
                            open={openMenuId === row.id}
                            onToggle={() => setOpenMenuId((current) => (current === row.id ? null : row.id))}
                            onView={() => router.push(`/materials/warehouses/${row.id}`)}
                            onEdit={() => openEditDrawer(row)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="text-label text-text-secondary">Rows</span>
              <select
                value={rowsPerPage}
                onChange={(event) => setRowsPerPage(Number(event.target.value))}
                className={`${selectClassName} !h-9 !w-auto !py-0 !text-label`}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-label text-text-secondary">
                Showing {pageStart}-{pageEnd} of {filteredRows.length} Warehouses
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <Button
                  key={page}
                  size="sm"
                  variant={page === safeCurrentPage ? "primary" : "ghost"}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button size="sm" variant="ghost" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingWarehouseId(null);
        }}
        size="lg"
        title={editingWarehouseId ? "Edit Warehouse" : "Add Warehouse"}
      >
        <div className="space-y-5">
            <DrawerSection
              title="Identity & Location"
              description="Define the warehouse identity, location markers, and network classification."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Warehouse Name</label>
                  <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Warehouse Code</label>
                  <Input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="CWH-NOI" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Location</label>
                  <Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Region</label>
                  <select value={form.region} onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))} className={selectClassName}>
                    {["North", "South", "East", "West"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Latitude</label>
                  <Input value={form.latitude} onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))} placeholder="28.5355" />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Longitude</label>
                  <Input value={form.longitude} onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))} placeholder="77.3910" />
                </div>
              </div>
            </DrawerSection>

            <DrawerSection
              title="Capacity & Operations"
              description="Capture utilization, capacity, operating rhythm, and ownership."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Capacity</label>
                  <Input value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))} placeholder="1200" />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Utilization</label>
                  <Input value={form.capacityUtilization} onChange={(event) => setForm((current) => ({ ...current, capacityUtilization: event.target.value }))} placeholder="72" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Operating Hours</label>
                  <Input value={form.operatingHours} onChange={(event) => setForm((current) => ({ ...current, operatingHours: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-label text-text-secondary">Supervisor</label>
                  <Input value={form.supervisor} onChange={(event) => setForm((current) => ({ ...current, supervisor: event.target.value }))} />
                </div>
              </div>
            </DrawerSection>

            <DrawerSection
              title="Storage Configuration"
              description="Assign storage capabilities and warehouse material focus."
            >
              <div className="space-y-2">
                <label className="text-label text-text-secondary">Storage Types</label>
                <div className="flex flex-wrap gap-2">
                  {storageTypeOptions.map((option) => {
                    const active = form.storageTypes.includes(option);
                    return (
                      <Button
                        key={option}
                        type="button"
                        size="sm"
                        variant={active ? "primary" : "ghost"}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            storageTypes: active
                              ? current.storageTypes.filter((item) => item !== option)
                              : [...current.storageTypes, option],
                          }))
                        }
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-label text-text-secondary">Material Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((option) => {
                    const active = form.materialCategories.includes(option);
                    return (
                      <Button
                        key={option}
                        type="button"
                        size="sm"
                        variant={active ? "primary" : "ghost"}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            materialCategories: active
                              ? current.materialCategories.filter((item) => item !== option)
                              : [...current.materialCategories, option],
                          }))
                        }
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </DrawerSection>

            <DrawerSection
              title="Project Assignment"
              description="Map the warehouse to project coverage and network support."
            >
              <div className="flex flex-wrap gap-2">
                {projectsQuery.data.projects.map((project) => {
                  const active = form.assignedProjects.includes(project.id);
                  return (
                    <Button
                      key={project.id}
                      type="button"
                      size="sm"
                      variant={active ? "primary" : "ghost"}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          assignedProjects: active
                            ? current.assignedProjects.filter((item) => item !== project.id)
                            : [...current.assignedProjects, project.id],
                        }))
                      }
                    >
                      {project.name}
                    </Button>
                  );
                })}
              </div>
            </DrawerSection>

            <DrawerSection
              title="Status & Notes"
              description="Capture operational state and any storage intelligence notes."
            >
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Status</label>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={selectClassName}>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Notes</label>
                <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className={textareaClassName} />
              </div>
            </DrawerSection>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setDrawerOpen(false);
                  setEditingWarehouseId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                loading={saveMutation.isPending}
                disabled={!form.name.trim() || !form.location.trim()}
                onClick={() => saveMutation.mutate()}
              >
                <PackagePlus className="h-4 w-4" />
                {editingWarehouseId ? "Save Warehouse" : "Add Warehouse"}
              </Button>
            </div>
          </div>
      </Drawer>
    </section>
  );
}

export function WarehouseDetailWorkspace({ warehouseId }: { warehouseId: string }) {
  const router = useRouter();
  const { role, materialsQuery, projectsQuery } = useWarehouseBaseData();

  const transfersQuery = useQuery({
    queryKey: ["erp-material-transfers", role],
    queryFn: async () => (await apiRequest<MaterialTransfersResponse>("/api/materials/transfers", { role })).data,
  });

  const consumptionQuery = useQuery({
    queryKey: ["erp-material-consumption", role],
    queryFn: async () => (await apiRequest<MaterialConsumptionResponse>("/api/materials/consumption", { role })).data,
  });

  if (materialsQuery.isLoading || projectsQuery.isLoading || transfersQuery.isLoading || consumptionQuery.isLoading) {
    return <LoadingStateCard title="Loading Warehouse Intelligence Profile" />;
  }

  if (
    materialsQuery.error ||
    projectsQuery.error ||
    transfersQuery.error ||
    consumptionQuery.error ||
    !materialsQuery.data ||
    !projectsQuery.data ||
    !transfersQuery.data ||
    !consumptionQuery.data
  ) {
    return <ErrorStateCard message="Warehouse detail analytics are unavailable." />;
  }

  const projectIndex = new Map(projectsQuery.data.projects.map((project) => [project.id, project.name]));
  const rows = buildWarehouseInsights(
    materialsQuery.data.warehouses,
    materialsQuery.data.materials,
    projectIndex,
    projectsQuery.data.projects.length,
  );
  const warehouse = rows.find((row) => row.id === warehouseId);

  if (!warehouse) {
    return (
      <div className="space-y-4 py-12 text-center">
        <h2 className="text-xl font-bold text-text-primary">Warehouse Not Found</h2>
        <p className="text-text-secondary">The requested warehouse is not available in the ERP warehouse index.</p>
        <Button variant="outline" onClick={() => router.push("/materials/warehouses")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Warehouse Operations Center
        </Button>
      </div>
    );
  }

  const materials = materialsQuery.data.materials.filter((item) => item.warehouseId === warehouse.id);
  const inboundTransfers = transfersQuery.data.transfers.filter((item) => item.toWarehouseId === warehouse.id);
  const outboundTransfers = transfersQuery.data.transfers.filter((item) => item.fromWarehouseId === warehouse.id);
  const consumptions = consumptionQuery.data.consumptions.filter((item) =>
    materials.some((material) => material.id === item.materialId),
  );

  const totalInboundQuantity = inboundTransfers.reduce((sum, item) => sum + item.quantity, 0);
  const totalOutboundQuantity = outboundTransfers.reduce((sum, item) => sum + item.quantity, 0);
  const totalConsumptionQuantity = consumptions.reduce((sum, item) => sum + item.quantity, 0);
  const inventorySummary = {
    totalInventory: materials.reduce((sum, item) => sum + item.onHand, 0),
    inventoryValue: materials.reduce((sum, item) => sum + estimateMaterialValue(item), 0),
    healthySkus: materials.filter((item) => item.onHand > item.reorderLevel).length,
    lowStockSkus: materials.filter((item) => item.onHand <= item.reorderLevel).length,
    criticalSkus: materials.filter((item) => item.onHand <= item.reorderLevel * 0.6).length,
  };

  const categoryDistribution = unique(materials.map((item) => item.category)).map((category) => ({
    category,
    count: materials.filter((item) => item.category === category).length,
    value: materials
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + estimateMaterialValue(item), 0),
  }));

  const flowTrendData = Array.from({ length: 10 }, (_, index) => ({
    day: `D${index + 1}`,
    inbound: Math.max(4, Math.round(totalInboundQuantity / 6 + Math.sin(index / 2) * 8 + index)),
    outbound: Math.max(3, Math.round((totalOutboundQuantity + totalConsumptionQuantity) / 7 + Math.cos(index / 2.5) * 6 + index * 0.8)),
  }));

  const projectSupportRows = warehouse.projectIds.map((projectId) => {
    const warehouseProjectMaterials = materials.filter((item) => item.projectId === projectId);
    const projectConsumptions = consumptions.filter((item) => item.projectId === projectId);
    const latestSupplyDates = [
      ...projectConsumptions.map((item) => item.consumedOn),
      ...outboundTransfers
        .filter((item) => warehouseProjectMaterials.some((material) => material.id === item.materialId))
        .map((item) => item.createdAt),
    ]
      .filter(Boolean)
      .sort()
      .reverse();

    return {
      projectId,
      projectName: projectIndex.get(projectId) || projectId,
      skuSupplied: warehouseProjectMaterials.length,
      consumption: projectConsumptions.reduce((sum, item) => sum + item.quantity, 0),
      status: projectConsumptions.length > 0 ? "Active" : "Planned",
      lastSupplyDate: latestSupplyDates[0] || warehouse.updatedAt || warehouse.createdAt || new Date().toISOString(),
    };
  });

  const activityTimeline = [
    ...inboundTransfers.map((item) => ({
      id: `in-${item.id}`,
      type: "Stock In",
      tone: "success" as Tone,
      title: `${item.materialName} received`,
      detail: `${item.quantity} ${item.unit} moved from ${item.fromWarehouseName} into ${warehouse.name}.`,
      timestamp: item.createdAt,
    })),
    ...outboundTransfers.map((item) => ({
      id: `out-${item.id}`,
      type: item.status === "Completed" ? "Transfer" : "Transfer In Progress",
      tone: item.status === "Completed" ? "info" as Tone : "warning" as Tone,
      title: `${item.materialName} dispatched`,
      detail: `${item.quantity} ${item.unit} routed to ${item.toWarehouseName}.`,
      timestamp: item.createdAt,
    })),
    ...consumptions.map((item) => ({
      id: `cons-${item.id}`,
      type: "Stock Out",
      tone: "warning" as Tone,
      title: `${item.materialName} issued to ${item.projectName}`,
      detail: `${item.quantity} ${item.unit} consumed for ${item.purpose}.`,
      timestamp: item.consumedOn,
    })),
    ...(warehouse.lowStockCount + warehouse.criticalStockCount > 0
      ? [
          {
            id: `adjust-${warehouse.id}`,
            type: "Adjustment",
            tone: warehouse.criticalStockCount > 0 ? ("error" as Tone) : ("warning" as Tone),
            title: "Cycle count review recommended",
            detail: `${warehouse.lowStockCount + warehouse.criticalStockCount} SKUs require reconciliation or replenishment review.`,
            timestamp: warehouse.updatedAt || warehouse.createdAt || new Date().toISOString(),
          },
        ]
      : []),
  ].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());

  const recommendationCards: RecommendationCardData[] = [
    {
      title: "Near Capacity",
      description:
        warehouse.capacityUtilization >= 90
          ? `${warehouse.name} is approaching capacity and needs storage expansion or redistribution.`
          : `${warehouse.name} still has healthy room for controlled growth.`,
      action: "Review Capacity Plan",
      tone: warehouse.capacityUtilization >= 90 ? "error" : "success",
    },
    {
      title: "Underutilized",
      description:
        warehouse.capacityUtilization <= 40
          ? "This asset is underutilized and can absorb more project or material load."
          : "Utilization is within an efficient operating band.",
      action: "Review Allocation",
      tone: warehouse.capacityUtilization <= 40 ? "info" : "success",
    },
    {
      title: "Inventory Healthy",
      description: `${inventorySummary.healthySkus} SKUs are currently above reorder threshold.`,
      action: "View Inventory Mix",
      tone: inventorySummary.healthySkus >= inventorySummary.lowStockSkus ? "success" : "warning",
    },
    {
      title: "Reorder Required",
      description: `${inventorySummary.lowStockSkus} SKUs are below reorder threshold and ${inventorySummary.criticalSkus} are critical.`,
      action: "Review Reorders",
      tone: inventorySummary.criticalSkus > 0 ? "error" : "warning",
    },
    {
      title: "Coverage Opportunity",
      description: `${warehouse.projectIds.length} projects are already supported through this warehouse footprint.`,
      action: "Review Project Support",
      tone: warehouse.projectIds.length >= 3 ? "success" : "info",
    },
    {
      title: "Storage Optimization",
      description: `${warehouse.storageTypes.join(", ")} configuration can be optimized around top category demand.`,
      action: "Optimize Storage Layout",
      tone: "info",
    },
  ];

  return (
    <section className="space-y-8 pb-12">
      <div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-text-secondary hover:text-text-primary" onClick={() => router.push("/materials/warehouses")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Warehouse Operations Center
        </Button>
      </div>

      <Card className="border border-border-soft bg-gradient-to-r from-surface to-surface-secondary/20 shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Warehouse className="h-6 w-6 text-accent-primary" />
                <h1 className="text-[34px] font-bold tracking-[-0.04em] text-text-primary">{warehouse.name}</h1>
                <Badge tone={warehouse.statusTone}>{warehouse.status}</Badge>
                <Badge tone={warehouse.healthTone}>{warehouse.healthScore} Health</Badge>
              </div>
              <p className="text-body text-text-secondary">
                {warehouse.code} | {warehouse.location} | {warehouse.region} | Supervisor {warehouse.supervisor}
              </p>
              <p className="max-w-3xl text-body text-text-secondary">
                Premium warehouse intelligence profile showing utilization, storage usage, inventory health, project support, and recent stock movement across this location.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 xl:w-[360px]">
              {[
                { label: "Utilization", value: `${warehouse.capacityUtilization}%` },
                { label: "Inventory Value", value: formatCompactCurrency(inventorySummary.inventoryValue) },
                { label: "Projects Served", value: `${warehouse.projectIds.length}` },
                { label: "SKU Count", value: `${warehouse.skuCount}` },
              ].map((item) => (
                <div key={item.label} className="rounded-[20px] border border-border-soft bg-surface-secondary/70 p-4">
                  <p className="text-label text-text-secondary">{item.label}</p>
                  <p className="mt-2 text-card-title text-text-primary">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Warehouse Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-[180px_1fr]">
            <div className="flex justify-center rounded-[24px] bg-surface-secondary/70 p-4">
              <CircularProgress value={warehouse.healthScore} size={144} strokeWidth={14} />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: "Capacity", value: formatCompactNumber(warehouse.capacity) },
                  { label: "Capacity Used", value: formatCompactNumber(warehouse.capacityUsed) },
                  { label: "Remaining", value: formatCompactNumber(warehouse.capacityRemaining) },
                  { label: "Coverage Score", value: `${warehouse.coverageScore}%` },
                ].map((item) => (
                  <div key={item.label} className="rounded-[20px] border border-border-soft bg-surface-secondary/70 p-4">
                    <p className="text-label text-text-secondary">{item.label}</p>
                    <p className="mt-2 text-card-title text-text-primary">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-[20px] border border-border-soft bg-surface-secondary/70 p-4">
                <p className="text-label text-text-secondary">Storage Configuration</p>
                <p className="mt-2 text-body text-text-primary">{warehouse.storageTypes.join(", ")}</p>
                <p className="mt-2 text-body text-text-secondary">
                  Categories: {warehouse.materialCategories.join(", ") || "General storage"} | Operating hours {warehouse.operatingHours}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Utilization Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[20px] border border-border-soft bg-surface-secondary/70 p-4">
                <p className="text-label text-text-secondary">Storage Usage</p>
                <p className="mt-2 text-card-title text-text-primary">{warehouse.capacityUsed} / {warehouse.capacity}</p>
              </div>
              <div className="rounded-[20px] border border-border-soft bg-surface-secondary/70 p-4">
                <p className="text-label text-text-secondary">Daily Flow Metrics</p>
                <p className="mt-2 text-card-title text-text-primary">{totalInboundQuantity + totalOutboundQuantity + totalConsumptionQuantity}</p>
              </div>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowTrendData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="warehouse-inbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPalette.blue} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={chartPalette.blue} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="warehouse-outbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPalette.amber} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={chartPalette.amber} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.18)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="inbound" stroke={chartPalette.blue} fill="url(#warehouse-inbound)" strokeWidth={2} />
                  <Area type="monotone" dataKey="outbound" stroke={chartPalette.amber} fill="url(#warehouse-outbound)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Inventory Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[
                { label: "Total Inventory", value: formatCompactNumber(inventorySummary.totalInventory) },
                { label: "Inventory Value", value: formatCompactCurrency(inventorySummary.inventoryValue) },
                { label: "Healthy SKUs", value: `${inventorySummary.healthySkus}` },
                { label: "Low Stock", value: `${inventorySummary.lowStockSkus}` },
                { label: "Critical", value: `${inventorySummary.criticalSkus}` },
              ].map((item) => (
                <div key={item.label} className="rounded-[20px] border border-border-soft bg-surface-secondary/70 p-4">
                  <p className="text-label text-text-secondary">{item.label}</p>
                  <p className="mt-2 text-card-title text-text-primary">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryDistribution} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.18)" />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: chartPalette.slate, fontSize: 10 }} />
                  <Tooltip formatter={(value) => [formatCompactCurrency(Number(value) || 0), "Category Value"]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={chartPalette.cyan} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Health Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendationCards.map((item) => (
              <RecommendationCard key={item.title} item={item} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border border-border-soft">
        <CardHeader>
          <CardTitle>Materials Stored</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-4">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
              <Input className="pl-10" placeholder="Search SKU or material" />
            </div>
            <Link href="/materials/materials-list" className="inline-flex items-center gap-2 text-body font-medium text-accent-primary">
              View All Materials
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[860px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">SKU</th>
                  <th className="px-4 text-left">Material</th>
                  <th className="px-4 text-left">On Hand</th>
                  <th className="px-4 text-left">Reorder Level</th>
                  <th className="px-4 text-left">Consumption</th>
                  <th className="px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 ? (
                  <TableEmptyStateRow colSpan={6} title="No materials stored" description="This warehouse has not yet been linked to any stocked materials." />
                ) : (
                  materials.slice(0, 8).map((item) => (
                    <tr key={item.id} className="border-t border-border-soft">
                      <td className="px-4 py-4 font-medium text-text-primary">{item.sku}</td>
                      <td className="px-4 py-4">{item.name}</td>
                      <td className="px-4 py-4">{item.onHand} {item.unit}</td>
                      <td className="px-4 py-4">{item.reorderLevel} {item.unit}</td>
                      <td className="px-4 py-4">{item.averageConsumption} / cycle</td>
                      <td className="px-4 py-4">
                        <Badge tone={item.onHand <= item.reorderLevel * 0.6 ? "error" : item.onHand <= item.reorderLevel ? "warning" : "success"}>
                          {item.onHand <= item.reorderLevel * 0.6 ? "Critical" : item.onHand <= item.reorderLevel ? "Low Stock" : "Healthy"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityTimeline.slice(0, 8).map((item) => (
              <div key={item.id} className="flex gap-3 rounded-[20px] border border-border-soft bg-surface-secondary/60 p-4">
                <div className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.tone === "error" ? chartPalette.red : item.tone === "warning" ? chartPalette.amber : item.tone === "success" ? chartPalette.green : chartPalette.blue }} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-text-primary">{item.title}</p>
                    <Badge tone={item.tone}>{item.type}</Badge>
                  </div>
                  <p className="mt-1 text-body text-text-secondary">{item.detail}</p>
                  <p className="mt-2 text-label text-text-muted">{formatDateTime(item.timestamp)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border-soft">
          <CardHeader>
            <CardTitle>Projects Served</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectSupportRows.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-border-soft px-5 py-8 text-center">
                <p className="text-card-title text-text-primary">No project coverage mapped</p>
                <p className="mt-2 text-body text-text-secondary">Assign projects or move material through this warehouse to activate support visibility.</p>
              </div>
            ) : (
              projectSupportRows.map((item) => (
                <div key={item.projectId} className="rounded-[20px] border border-border-soft bg-surface-secondary/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-card-title text-text-primary">{item.projectName}</p>
                      <p className="mt-1 text-body text-text-secondary">
                        SKUs supplied {item.skuSupplied} | Consumption {item.consumption}
                      </p>
                    </div>
                    <Badge tone={item.status === "Active" ? "success" : "info"}>{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-label text-text-muted">Last supply date {formatDate(item.lastSupplyDate)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
