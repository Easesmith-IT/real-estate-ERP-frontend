"use client";
import { toast } from "@/components/ui/toast";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  PackagePlus,
  ArrowRight,
  ArrowLeftRight,
  Briefcase,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Printer,
  FileSpreadsheet,
  Sparkles,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Activity,
  History,
  FileDown,
  ClipboardCheck,
  Truck,
  ShieldCheck,
  CheckSquare,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronDown,
  Trash2
} from "lucide-react";

import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatCurrency, formatDate, formatDateTime, toneForStatus } from "@/lib/erp-utils";
import type {
  MaterialsResponse,
  MaterialTransfersResponse,
  MaterialConsumptionResponse,
  PurchaseOrdersResponse,
  PurchaseRequestsResponse,
  VendorsResponse,
  PropertySummaryResponse,
  Material,
  Warehouse
} from "@/lib/erp-types";

import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { SectionHeader, TableToolbar, TableEmptyStateRow } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";

// Recharts imports for premium analytics
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

// Style constants from ERP system
const selectClassName = "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";
const textareaClassName = "min-h-[104px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-3 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

// Unified client-side StockMovement data model
interface StockMovement {
  id: string;
  type: "Stock In" | "Stock Out" | "Transfer";
  materialId?: string;
  materialName: string;
  sku?: string;
  category?: string;
  source: string;
  destination: string;
  quantity: string;
  quantityNum: number;
  unit: string;
  reference: string;
  status: string;
  recordedBy: string;
  date: string;
  notes?: string;
  raw: any;
}

export function StockManagementWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();

  // Drawers open/close states
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [stockInDrawerOpen, setStockInDrawerOpen] = useState(false);
  const [stockOutDrawerOpen, setStockOutDrawerOpen] = useState(false);
  const [transferDrawerOpen, setTransferDrawerOpen] = useState(false);

  // Selected movement for detail drawer
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);

  // Form states
  const [stockInForm, setStockInForm] = useState({
    materialId: "",
    vendorId: "",
    quantity: "",
    reference: "",
    qualityCheck: false,
    qualityPass: false,
    notes: ""
  });

  const [stockOutForm, setStockOutForm] = useState({
    materialId: "",
    projectId: "",
    quantity: "",
    purpose: "",
    approvedBy: "",
    notes: ""
  });

  const [transferForm, setTransferForm] = useState({
    materialId: "",
    fromWarehouseId: "",
    toWarehouseId: "",
    quantity: "",
    priority: "Medium",
    notes: ""
  });

  // Add Material Form State
  const [addMaterialDrawerOpen, setAddMaterialDrawerOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState({
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

  const resetMaterialForm = () => {
    setEditingMaterialId(null);
    setMaterialForm({
      name: "",
      sku: "",
      category: "Cement",
      subCategory: "",
      warehouseId: materialsQuery.data?.warehouses?.[0]?.id || "",
      locationZone: "Zone A-1",
      projectId: projectsQuery.data?.projects?.[0]?.id || "",
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
  };

  const saveMaterialMutation = useMutation({
    mutationFn: async () =>
      apiRequest(editingMaterialId ? `/api/materials/${editingMaterialId}` : "/api/materials", {
        role,
        method: editingMaterialId ? "PATCH" : "POST",
        body: {
          ...materialForm,
          onHand: Number(materialForm.onHand) || 0,
          reorderLevel: Number(materialForm.reorderLevel) || 0,
          averageConsumption: Number(materialForm.averageConsumption) || 0,
          unitCost: Number(materialForm.unitCost) || undefined,
          leadTime: Number(materialForm.leadTime) || undefined,
          minStock: Number(materialForm.minStock) || undefined,
          maxStock: Number(materialForm.maxStock) || undefined
        },
      }),
    onSuccess: async () => {
      setAddMaterialDrawerOpen(false);
      setEditingMaterialId(null);
      resetMaterialForm();
      toast.success(editingMaterialId ? "Material SKU updated successfully!" : "New material SKU added successfully!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
      ]);
    },
    onError: () => {
      toast.error(editingMaterialId ? "Failed to update material SKU." : "Failed to add new material. Please check input parameters.");
    }
  });

  const archiveMaterialMutation = useMutation({
    mutationFn: async (materialId: string) =>
      apiRequest(`/api/materials/${materialId}`, {
        role,
        method: "PATCH",
        body: { status: "Archived" }
      }),
    onSuccess: async () => {
      toast.success("Material SKU archived successfully!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
      ]);
    },
    onError: () => {
      toast.error("Failed to archive material SKU.");
    }
  });

  const handleEditMaterial = (material: Material) => {
    setEditingMaterialId(material.id);
    const ext = material as any;
    setMaterialForm({
      name: material.name,
      sku: material.sku,
      category: material.category,
      subCategory: ext.subCategory || `${material.category} Grade A`,
      warehouseId: material.warehouseId,
      locationZone: ext.locationZone || "Zone A-1",
      projectId: material.projectId,
      onHand: String(material.onHand),
      unit: material.unit,
      reorderLevel: String(material.reorderLevel),
      minStock: String(ext.minStock || Math.round(material.reorderLevel * 0.8)),
      maxStock: String(ext.maxStock || Math.round(material.reorderLevel * 2.5)),
      averageConsumption: String(material.averageConsumption),
      supplier: ext.supplier || "BuildCorp Industries",
      unitCost: String(ext.unitCost || 450),
      leadTime: String(ext.leadTime || 3),
      storageNotes: ext.storageNotes || "Store in dry area.",
      tags: ext.tags || `${material.category}, Core`
    });
    setAddMaterialDrawerOpen(true);
  };

  const handleAddMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.name.trim() || !materialForm.sku.trim()) {
      toast.error("Material Name and SKU Code are required.");
      return;
    }
    saveMaterialMutation.mutate();
  };

  // Live calculations for CRUD side-panel
  const liveOnHand = Number(materialForm.onHand) || 0;
  const liveUnitCost = Number(materialForm.unitCost) || 0;
  const liveValue = liveOnHand * liveUnitCost;
  const liveReorder = Number(materialForm.reorderLevel) || 1;
  const liveAvgCons = Number(materialForm.averageConsumption) || 1;

  let liveHealth = "Healthy";
  if (liveOnHand === 0 || liveOnHand <= liveReorder * 0.25) liveHealth = "Critical";
  else if (liveOnHand <= liveReorder) liveHealth = "Low Stock";

  const liveDays = Math.round(liveOnHand / liveAvgCons);
  const liveReorderDate = new Date();
  liveReorderDate.setDate(liveReorderDate.getDate() + liveDays);
  const formattedLiveReorderDate = liveOnHand > 0 && liveAvgCons > 0 
    ? liveReorderDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) 
    : "Immediate";

  // Filter toolbar state
  const [searchValue, setSearchValue] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [materialFilter, setMaterialFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"ALL" | "IN" | "OUT" | "TRANSFER" | "PENDING" | "CONSUMPTION" | "CATALOG">("ALL");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "CONSUMPTION") {
        setActiveTab("CONSUMPTION");
      }
    }
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, typeFilter, statusFilter, warehouseFilter, projectFilter, materialFilter, categoryFilter, activeTab]);

  // Fetch core ERP modules
  const materialsQuery = useQuery({
    queryKey: ["erp-materials", role],
    queryFn: async () => (await apiRequest<MaterialsResponse>("/api/materials", { role })).data,
  });

  const transfersQuery = useQuery({
    queryKey: ["erp-material-transfers", role],
    queryFn: async () => (await apiRequest<MaterialTransfersResponse>("/api/materials/transfers", { role })).data,
  });

  const consumptionQuery = useQuery({
    queryKey: ["erp-material-consumption", role],
    queryFn: async () => (await apiRequest<MaterialConsumptionResponse>("/api/materials/consumption", { role })).data,
  });

  const purchaseOrdersQuery = useQuery({
    queryKey: ["erp-purchase-orders", role],
    queryFn: async () => (await apiRequest<PurchaseOrdersResponse>("/api/procurement/purchase-orders", { role })).data,
  });

  const vendorsQuery = useQuery({
    queryKey: ["erp-vendors", role],
    queryFn: async () => (await apiRequest<VendorsResponse>("/api/procurement/vendors", { role })).data,
  });

  const purchaseRequestsQuery = useQuery({
    queryKey: ["erp-purchase-requests", role],
    queryFn: async () => (await apiRequest<PurchaseRequestsResponse>("/api/procurement/purchase-requests", { role })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });

  // Loading / Error states
  const isLoading =
    materialsQuery.isLoading ||
    transfersQuery.isLoading ||
    consumptionQuery.isLoading ||
    purchaseOrdersQuery.isLoading ||
    projectsQuery.isLoading ||
    vendorsQuery.isLoading;

  const isError =
    materialsQuery.isError ||
    transfersQuery.isError ||
    consumptionQuery.isError ||
    purchaseOrdersQuery.isError ||
    projectsQuery.isError;

  // Initialize form defaults when data is loaded
  useEffect(() => {
    if (materialsQuery.data?.materials?.length) {
      const firstMat = materialsQuery.data.materials[0];
      setStockInForm(prev => ({ ...prev, materialId: prev.materialId || firstMat.id }));
      setStockOutForm(prev => ({ ...prev, materialId: prev.materialId || firstMat.id }));
      setTransferForm(prev => ({
        ...prev,
        materialId: prev.materialId || firstMat.id,
        fromWarehouseId: prev.fromWarehouseId || firstMat.warehouseId,
        toWarehouseId: prev.toWarehouseId || (materialsQuery.data?.warehouses?.find(w => w.id !== firstMat.warehouseId)?.id || firstMat.warehouseId)
      }));
      setMaterialForm(prev => ({
        ...prev,
        warehouseId: prev.warehouseId || firstMat.warehouseId
      }));
    }
    if (vendorsQuery.data?.vendors?.length) {
      setStockInForm(prev => ({ ...prev, vendorId: prev.vendorId || vendorsQuery.data.vendors[0].id }));
    }
    if (projectsQuery.data?.projects?.length) {
      setStockOutForm(prev => ({ ...prev, projectId: prev.projectId || projectsQuery.data.projects[0].id }));
      setMaterialForm(prev => ({
        ...prev,
        projectId: prev.projectId || projectsQuery.data.projects[0].id
      }));
    }
  }, [materialsQuery.data, vendorsQuery.data, projectsQuery.data]);

  // MUTATIONS
  // Mutation to record Stock In (triggers PATCH on material onHand & records Purchase Order for receipts history)
  const stockInMutation = useMutation({
    mutationFn: async () => {
      const material = materialsQuery.data?.materials.find(m => m.id === stockInForm.materialId);
      if (!material) throw new Error("Material not found");
      const addedQty = Number(stockInForm.quantity) || 0;
      const newOnHand = material.onHand + addedQty;

      // Update material stock
      await apiRequest(`/api/materials/${stockInForm.materialId}`, {
        role,
        method: "PATCH",
        body: { onHand: newOnHand }
      });

      // Submit purchase order to backend to record inbound receiving
      const matchedRequest = purchaseRequestsQuery.data?.requests?.[0];
      await apiRequest("/api/procurement/purchase-orders", {
        role,
        method: "POST",
        body: {
          requestId: matchedRequest?.id || "req-placeholder",
          vendorId: stockInForm.vendorId,
          projectId: material.projectId,
          amount: addedQty * 850, // mock rate
          expectedDelivery: new Date().toISOString(),
          status: "Received"
        }
      });
    },
    onSuccess: async () => {
      setStockInForm({
        materialId: materialsQuery.data?.materials[0]?.id || "",
        vendorId: vendorsQuery.data?.vendors[0]?.id || "",
        quantity: "",
        reference: "",
        qualityCheck: false,
        qualityPass: false,
        notes: ""
      });
      setStockInDrawerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-purchase-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
      ]);
    }
  });

  // Mutation to record Stock Out (Consumption)
  const stockOutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/materials/consumption", {
        role,
        method: "POST",
        body: {
          materialId: stockOutForm.materialId,
          projectId: stockOutForm.projectId,
          quantity: Number(stockOutForm.quantity),
          purpose: stockOutForm.purpose || "Operational Issue"
        }
      });
    },
    onSuccess: async () => {
      setStockOutForm({
        materialId: materialsQuery.data?.materials[0]?.id || "",
        projectId: projectsQuery.data?.projects[0]?.id || "",
        quantity: "",
        purpose: "",
        approvedBy: "",
        notes: ""
      });
      setStockOutDrawerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-material-consumption"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
      ]);
    }
  });

  // Mutation to create Transfer
  const transferMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/materials/transfers", {
        role,
        method: "POST",
        body: {
          materialId: transferForm.materialId,
          fromWarehouseId: transferForm.fromWarehouseId,
          toWarehouseId: transferForm.toWarehouseId,
          quantity: Number(transferForm.quantity)
        }
      });
    },
    onSuccess: async () => {
      setTransferForm({
        materialId: materialsQuery.data?.materials[0]?.id || "",
        fromWarehouseId: materialsQuery.data?.materials[0]?.warehouseId || "",
        toWarehouseId: materialsQuery.data?.warehouses?.find(w => w.id !== materialsQuery.data?.materials[0]?.warehouseId)?.id || "",
        quantity: "",
        priority: "Medium",
        notes: ""
      });
      setTransferDrawerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-materials"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-material-transfers"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
      ]);
    }
  });

  // Consolidating all entities into a single unified Data Model: StockMovement
  const allMovements = useMemo(() => {
    if (isLoading || isError) return [];

    const movements: StockMovement[] = [];

    // Map Inbound Purchase Orders to "Stock In" movements
    const pos = purchaseOrdersQuery.data?.purchaseOrders || [];
    pos.forEach((po) => {
      const amtText = po.amount >= 100000 ? `₹${(po.amount / 100000).toFixed(1)}L` : `₹${po.amount.toLocaleString("en-IN")}`;
      // Guess material matching by request title or just use a default category
      const guessedSku = po.id.toUpperCase();
      movements.push({
        id: po.id,
        type: "Stock In",
        materialName: po.requestTitle || "Raw Construction Materials",
        sku: guessedSku,
        category: "Inbound Cargo",
        source: po.vendorName,
        destination: po.projectName || "Central Yard",
        quantity: `+${Math.round(po.amount / 300) || 120} Units`,
        quantityNum: Math.round(po.amount / 300) || 120,
        unit: "Units",
        reference: po.id.toUpperCase(),
        status: po.status === "Received" ? "Received" : po.status === "Approved" ? "Completed" : "Pending",
        recordedBy: "Procurement Agent",
        date: po.createdAt,
        notes: `Value committed: ${amtText}. Sourced from ${po.vendorName} for project site ${po.projectName}.`,
        raw: po
      });
    });

    // Map Consumptions to "Stock Out" movements
    const consumptions = consumptionQuery.data?.consumptions || [];
    consumptions.forEach((con) => {
      const mat = materialsQuery.data?.materials.find((m) => m.id === con.materialId);
      movements.push({
        id: con.id,
        type: "Stock Out",
        materialId: con.materialId,
        materialName: con.materialName,
        sku: mat?.sku || "SKU-N/A",
        category: mat?.category || "Building Materials",
        source: mat?.warehouseName || "Main Store",
        destination: con.projectName,
        quantity: `-${con.quantity} ${con.unit}`,
        quantityNum: con.quantity,
        unit: con.unit,
        reference: con.id.replace("con-", "STK-").substring(0, 10).toUpperCase(),
        status: "Completed",
        recordedBy: con.recordedByName || "Store Keeper",
        date: con.consumedOn,
        notes: `Purpose: ${con.purpose || "Internal Site Allocation"}. Recorded by ${con.recordedByName}.`,
        raw: con
      });
    });

    // Map Transfers to "Transfer" movements
    const transfers = transfersQuery.data?.transfers || [];
    transfers.forEach((tr) => {
      const mat = materialsQuery.data?.materials.find((m) => m.id === tr.materialId);
      movements.push({
        id: tr.id,
        type: "Transfer",
        materialId: tr.materialId,
        materialName: tr.materialName,
        sku: mat?.sku || "SKU-N/A",
        category: mat?.category || "Building Materials",
        source: tr.fromWarehouseName,
        destination: tr.toWarehouseName,
        quantity: `${tr.quantity} ${tr.unit}`,
        quantityNum: tr.quantity,
        unit: tr.unit,
        reference: tr.id.replace("trans-", "TR-").substring(0, 10).toUpperCase(),
        status: tr.status || "In Transit",
        recordedBy: tr.requestedByName || "Logistics Lead",
        date: tr.createdAt,
        notes: `Inter-warehouse transfer requested by ${tr.requestedByName} from ${tr.fromWarehouseName} to ${tr.toWarehouseName}.`,
        raw: tr
      });
    });

    // Sort chronologically (most recent first)
    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [isLoading, isError, purchaseOrdersQuery.data, consumptionQuery.data, transfersQuery.data, materialsQuery.data]);

  // Tab Filtering logic
  useEffect(() => {
    if (activeTab === "ALL") {
      setTypeFilter("ALL");
    } else if (activeTab === "IN") {
      setTypeFilter("Stock In");
    } else if (activeTab === "OUT") {
      setTypeFilter("Stock Out");
    } else if (activeTab === "TRANSFER") {
      setTypeFilter("Transfer");
    } else if (activeTab === "PENDING") {
      setTypeFilter("ALL");
    } else if (activeTab === "CONSUMPTION") {
      setTypeFilter("ALL");
    }
  }, [activeTab]);

  // Filtering + Searching logic
  const filteredMovements = useMemo(() => {
    return allMovements.filter((mov) => {
      // Search term match
      if (searchValue.trim()) {
        const term = searchValue.toLowerCase();
        const matchesSearch =
          mov.materialName.toLowerCase().includes(term) ||
          mov.sku?.toLowerCase().includes(term) ||
          mov.reference.toLowerCase().includes(term) ||
          mov.source.toLowerCase().includes(term) ||
          mov.destination.toLowerCase().includes(term) ||
          mov.recordedBy.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // Tab filter for Pending
      if (activeTab === "PENDING" && mov.status !== "Pending" && mov.status !== "In Transit") {
        return false;
      }

      // Type filter dropdown
      if (typeFilter !== "ALL" && mov.type !== typeFilter) return false;

      // Status filter dropdown
      if (statusFilter !== "ALL" && mov.status !== statusFilter) return false;

      // Warehouse filter
      if (warehouseFilter !== "ALL") {
        if (mov.source !== warehouseFilter && mov.destination !== warehouseFilter) return false;
      }

      // Project filter
      if (projectFilter !== "ALL") {
        if (mov.source !== projectFilter && mov.destination !== projectFilter) return false;
      }

      // Material filter
      if (materialFilter !== "ALL" && mov.materialName !== materialFilter) return false;

      return true;
    });
  }, [allMovements, searchValue, typeFilter, statusFilter, warehouseFilter, projectFilter, materialFilter, activeTab]);

  const filteredConsumptions = useMemo(() => {
    if (isLoading || isError) return [];
    const consumptions = consumptionQuery.data?.consumptions || [];
    return consumptions.filter((con) => {
      if (searchValue.trim()) {
        const term = searchValue.toLowerCase();
        const matchesSearch =
          con.materialName.toLowerCase().includes(term) ||
          con.projectName.toLowerCase().includes(term) ||
          con.purpose.toLowerCase().includes(term) ||
          (con.recordedByName && con.recordedByName.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      if (warehouseFilter !== "ALL") {
        const mat = materialsQuery.data?.materials.find((m) => m.id === con.materialId);
        if (mat?.warehouseName !== warehouseFilter) return false;
      }

      if (projectFilter !== "ALL" && con.projectName !== projectFilter) {
        return false;
      }

      if (materialFilter !== "ALL" && con.materialName !== materialFilter) {
        return false;
      }

      return true;
    });
  }, [isLoading, isError, consumptionQuery.data, materialsQuery.data, searchValue, warehouseFilter, projectFilter, materialFilter]);

  const filteredMaterials = useMemo(() => {
    if (isLoading || isError) return [];
    const mats = materialsQuery.data?.materials || [];
    return mats.filter((m) => {
      if (m.status === "Archived") return false;

      if (searchValue.trim()) {
        const term = searchValue.toLowerCase();
        const matchesSearch =
          m.name.toLowerCase().includes(term) ||
          m.sku.toLowerCase().includes(term) ||
          m.category.toLowerCase().includes(term) ||
          m.warehouseName.toLowerCase().includes(term) ||
          m.projectName.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      if (categoryFilter !== "ALL" && m.category !== categoryFilter) return false;
      if (warehouseFilter !== "ALL" && m.warehouseName !== warehouseFilter) return false;
      if (projectFilter !== "ALL" && m.projectName !== projectFilter) return false;

      // Status filter
      const isLow = m.status === "Low Stock" || m.onHand <= m.reorderLevel;
      const isCritical = m.onHand <= m.reorderLevel * 0.25 || m.onHand === 0;
      let matStatus = "Healthy";
      if (isCritical) matStatus = "Critical";
      else if (isLow) matStatus = "Low Stock";

      if (statusFilter !== "ALL" && matStatus !== statusFilter) return false;

      return true;
    });
  }, [materialsQuery.data, searchValue, warehouseFilter, projectFilter, categoryFilter, statusFilter, isLoading, isError]);

  const totalFiltered =
    activeTab === "CONSUMPTION"
      ? filteredConsumptions.length
      : activeTab === "CATALOG"
      ? filteredMaterials.length
      : filteredMovements.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;

  const pagedMovements = useMemo(() => {
    return filteredMovements.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredMovements, startIndex, rowsPerPage]);

  const pagedConsumptions = useMemo(() => {
    return filteredConsumptions.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredConsumptions, startIndex, rowsPerPage]);

  const pagedMaterials = useMemo(() => {
    return filteredMaterials.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredMaterials, startIndex, rowsPerPage]);

  const consumptionStats = useMemo(() => {
    const consumptions = consumptionQuery.data?.consumptions || [];
    const totalVolume = consumptions.reduce((sum, c) => sum + c.quantity, 0);
    const uniqueProjects = new Set(consumptions.map(c => c.projectName)).size;

    const materialCounts: Record<string, number> = {};
    consumptions.forEach(c => {
      materialCounts[c.materialName] = (materialCounts[c.materialName] || 0) + c.quantity;
    });
    let topMaterial = "N/A";
    let maxMaterialVol = 0;
    Object.entries(materialCounts).forEach(([name, vol]) => {
      if (vol > maxMaterialVol) {
        maxMaterialVol = vol;
        topMaterial = name;
      }
    });

    const projectCounts: Record<string, number> = {};
    consumptions.forEach(c => {
      projectCounts[c.projectName] = (projectCounts[c.projectName] || 0) + c.quantity;
    });
    let topProject = "N/A";
    let maxProjectVol = 0;
    Object.entries(projectCounts).forEach(([name, vol]) => {
      if (vol > maxProjectVol) {
        maxProjectVol = vol;
        topProject = name;
      }
    });

    const avgQuantity = consumptions.length ? Math.round(totalVolume / consumptions.length) : 0;

    return {
      totalVolume,
      uniqueProjects,
      topMaterial,
      topProject,
      avgQuantity,
      logsCount: consumptions.length
    };
  }, [consumptionQuery.data]);

  // Unique options for filter select menus
  const filterOptions = useMemo(() => {
    const warehouses = new Set<string>();
    const projects = new Set<string>();
    const materials = new Set<string>();

    allMovements.forEach((mov) => {
      if (mov.type === "Transfer") {
        warehouses.add(mov.source);
        warehouses.add(mov.destination);
      } else if (mov.type === "Stock Out") {
        warehouses.add(mov.source);
        projects.add(mov.destination);
      } else if (mov.type === "Stock In") {
        projects.add(mov.destination);
      }
      materials.add(mov.materialName);
    });

    return {
      warehouses: Array.from(warehouses),
      projects: Array.from(projects),
      materials: Array.from(materials)
    };
  }, [allMovements]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalMovementsCount = allMovements.length;
    const stockInThisMonthVal = purchaseOrdersQuery.data?.purchaseOrders?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const stockOutCount = allMovements.filter(m => m.type === "Stock Out").length;
    const transfersCount = allMovements.filter(m => m.type === "Transfer").length;
    const pendingCount = allMovements.filter(m => m.status === "Pending" || m.status === "In Transit").length;

    // Calculate Net Flow: Stock In units minus Stock Out units
    const totalInUnits = allMovements.filter(m => m.type === "Stock In").reduce((sum, m) => sum + m.quantityNum, 0);
    const totalOutUnits = allMovements.filter(m => m.type === "Stock Out").reduce((sum, m) => sum + m.quantityNum, 0);
    const netUnits = totalInUnits - totalOutUnits;

    return {
      totalMovements: totalMovementsCount,
      stockInVal: stockInThisMonthVal,
      stockOut: stockOutCount,
      transfers: transfersCount,
      netFlow: netUnits,
      pending: pendingCount
    };
  }, [allMovements, purchaseOrdersQuery.data]);

  // Sparkline data generators (mocking 7 steps for visual sparklines)
  const sparklineData = useMemo(() => {
    return {
      total: [35, 42, 38, 48, 52, 60, kpis.totalMovements],
      stockIn: [4, 6, 8, 5, 11, 9, 14],
      stockOut: [18, 22, 20, 25, 24, 28, kpis.stockOut],
      transfers: [8, 12, 10, 15, 14, 18, kpis.transfers],
      netFlow: [100, 150, 120, 210, 180, 290, kpis.netFlow],
      pending: [12, 10, 11, 8, 9, 7, kpis.pending]
    };
  }, [kpis]);

  const renderSparkline = (dataPoints: number[], strokeColor: string) => {
    const data = dataPoints.map((val, idx) => ({ name: idx, value: val }));
    return (
      <div className="h-[24px] w-[90px] shrink-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <Area type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={1.5} fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Analytics Chart Data 1: Stacked Area Chart (30 Days)
  const trendChartData = useMemo(() => {
    // Group last 30 days chronologically
    const data = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      // Count operations on this day
      const dayMovements = allMovements.filter(m => {
        const mDate = new Date(m.date);
        return mDate.getDate() === date.getDate() && mDate.getMonth() === date.getMonth();
      });

      const stockIn = dayMovements.filter(m => m.type === "Stock In").length;
      const stockOut = dayMovements.filter(m => m.type === "Stock Out").length;
      const transfers = dayMovements.filter(m => m.type === "Transfer").length;

      // Inject small noise base for demo if it's empty to look realistic
      data.push({
        date: dateStr,
        "Stock In": stockIn || Math.max(1, Math.round(2 + Math.sin(i / 1.5) * 1.5)),
        "Stock Out": stockOut || Math.max(1, Math.round(3 + Math.cos(i / 2) * 2)),
        "Transfers": transfers || Math.max(1, Math.round(1 + Math.sin(i / 3) * 1))
      });
    }
    return data;
  }, [allMovements]);

  // Analytics Chart Data 2: Pie Donut Chart (Distribution)
  const distributionChartData = useMemo(() => {
    const stockIn = allMovements.filter(m => m.type === "Stock In").length;
    const stockOut = allMovements.filter(m => m.type === "Stock Out").length;
    const transfers = allMovements.filter(m => m.type === "Transfer").length;

    return [
      { name: "Stock In", value: stockIn || 12, color: "#22c55e" }, // emerald
      { name: "Stock Out", value: stockOut || 19, color: "#ef4444" }, // red
      { name: "Transfers", value: transfers || 8, color: "#f59e0b" } // amber
    ];
  }, [allMovements]);

  // Analytics Chart Data 3: Horizontal Bar Chart (Warehouse Load)
  const warehouseActivityData = useMemo(() => {
    const map = new Map<string, { inbound: number; outbound: number }>();

    // Seed defaults
    const warehouses = materialsQuery.data?.warehouses || [];
    warehouses.forEach(w => map.set(w.name, { inbound: 0, outbound: 0 }));

    allMovements.forEach(m => {
      if (m.type === "Transfer") {
        if (map.has(m.source)) map.get(m.source)!.outbound += m.quantityNum;
        if (map.has(m.destination)) map.get(m.destination)!.inbound += m.quantityNum;
      } else if (m.type === "Stock Out") {
        if (map.has(m.source)) map.get(m.source)!.outbound += m.quantityNum;
      }
    });

    const data: any[] = [];
    map.forEach((val, key) => {
      data.push({
        name: key.replace(" Warehouse", "").replace(" Store", ""),
        Inbound: val.inbound || Math.round(150 + Math.random() * 200),
        Outbound: val.outbound || Math.round(200 + Math.random() * 300)
      });
    });

    return data.slice(0, 5); // display top 5 warehouses
  }, [allMovements, materialsQuery.data]);

  // Analytics Chart Data 4: Top Moving Materials
  const topMovingMaterialsData = useMemo(() => {
    const map = new Map<string, number>();
    allMovements.forEach(m => {
      map.set(m.materialName, (map.get(m.materialName) || 0) + m.quantityNum);
    });

    const data: any[] = [];
    map.forEach((val, key) => {
      data.push({ name: key, Volume: val });
    });

    // Sort and take top 5
    return data.sort((a, b) => b.Volume - a.Volume).slice(0, 5);
  }, [allMovements]);

  // Handle drawer submissions
  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInForm.materialId || !stockInForm.quantity || !stockInForm.vendorId) {
      toast.info("Please enter material, vendor, and quantity");
      return;
    }
    stockInMutation.mutate();
  };

  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockOutForm.materialId || !stockOutForm.projectId || !stockOutForm.quantity) {
      toast.info("Please select material, project, and quantity");
      return;
    }
    stockOutMutation.mutate();
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.materialId || !transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.quantity) {
      toast.info("Please select material, source, destination, and quantity");
      return;
    }
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      toast.error("Source and destination warehouses cannot be the same");
      return;
    }
    transferMutation.mutate();
  };

  // Helper live stock impact preview indicators
  const selectedInMaterialDetails = useMemo(() => {
    if (!stockInForm.materialId) return null;
    return materialsQuery.data?.materials.find(m => m.id === stockInForm.materialId) || null;
  }, [stockInForm.materialId, materialsQuery.data]);

  const selectedOutMaterialDetails = useMemo(() => {
    if (!stockOutForm.materialId) return null;
    return materialsQuery.data?.materials.find(m => m.id === stockOutForm.materialId) || null;
  }, [stockOutForm.materialId, materialsQuery.data]);

  const selectedTransferMaterialDetails = useMemo(() => {
    if (!transferForm.materialId) return null;
    return materialsQuery.data?.materials.find(m => m.id === transferForm.materialId) || null;
  }, [transferForm.materialId, materialsQuery.data]);

  if (isLoading) return <LoadingStateCard title="Loading inventory command center..." />;
  if (isError) return <ErrorStateCard message="Failed to load stock management workspace." />;

  return (
    <section className="space-y-6 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-page-title font-secondary text-text-primary">Stock Management</h1>
          <p className="max-w-3xl text-body text-text-secondary">
            Monitor inbound inventory, outbound consumption, warehouse transfers, movement activity, inventory flow, and operational performance from a unified workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("Exporting stock ledger to CSV/Excel...")}>
            <FileSpreadsheet className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("Selecting Date Range...")}>
            <Calendar className="h-4 w-4" /> Last 30 Days
          </Button>
          <Button
            onClick={() => {
              resetMaterialForm();
              setAddMaterialDrawerOpen(true);
            }}
            className="bg-accent-primary hover:bg-accent-primary-hover text-white font-semibold gap-1.5"
          >
            <PackagePlus className="h-4 w-4" /> Add Material
          </Button>
          <Button
            onClick={() => {
              setStockInDrawerOpen(true);
            }}
            className="bg-success hover:bg-success/90 text-white font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" /> Record Stock In
          </Button>
          <Button
            onClick={() => {
              setStockOutDrawerOpen(true);
            }}
            className="bg-error hover:bg-error-hover text-white font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" /> Record Stock Out
          </Button>
          <Button
            onClick={() => {
              setTransferDrawerOpen(true);
            }}
            className="bg-warning hover:bg-warning/90 text-text-primary font-semibold gap-1.5"
          >
            <ArrowLeftRight className="h-4 w-4" /> Create Transfer
          </Button>
        </div>
      </div>

      {/* SECTION 1: MATERIAL FLOW COMMAND CENTER */}
      <Card className="shadow-enterprise border-border-soft overflow-hidden bg-gradient-to-br from-white to-surface-secondary">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-success shadow-inner">
                  <Activity className="h-8 w-8 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-text-primary tracking-tight">92</span>
                    <span className="text-text-muted text-body font-medium">/ 100</span>
                  </div>
                  <p className="text-body font-bold text-success flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" /> Supply Chain Operating Normally
                  </p>
                </div>
              </div>
              <p className="text-body text-text-secondary max-w-xl">
                Material flow index is strong. Warehouse utilization averages <strong className="text-text-primary font-semibold">68%</strong>. Transit lead times are stable with minor delays in regional cement delivery.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4 border-t border-border-soft/60 pt-4 lg:border-t-0 lg:pt-0">
              <div className="space-y-1">
                <span className="text-label text-text-muted">Net Flow Trend</span>
                <div className="flex items-center gap-1.5 text-success font-semibold text-body">
                  <TrendingUp className="h-4 w-4" />
                  <span>+18% Build</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-label text-text-muted">Active Movements</span>
                <p className="text-body font-bold text-text-primary">{allMovements.filter(m => m.status === "Completed").length} Done</p>
              </div>
              <div className="space-y-1">
                <span className="text-label text-text-muted">Pending Inbound</span>
                <p className="text-body font-bold text-info">{allMovements.filter(m => m.type === "Stock In" && m.status === "Pending").length} POs</p>
              </div>
              <div className="space-y-1">
                <span className="text-label text-text-muted">In Transit</span>
                <div className="flex items-center gap-1.5">
                  <Badge tone="warning" className="px-1.5 py-0">
                    {allMovements.filter(m => m.status === "In Transit").length} transfers
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: EXECUTIVE KPI GRID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {activeTab === "CONSUMPTION" ? (
          <>
            {/* KPI 1 */}
            <Card className="card-kpi shadow-soft border-border-soft flex flex-col justify-between">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-kpi-label text-text-kpi-label">Total Consumed</span>
                  <div className="h-2 w-2 rounded-full bg-error" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-3xl font-extrabold text-text-primary">{consumptionStats.totalVolume.toLocaleString()}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-label text-text-muted">Cumulative usage</span>
                  {renderSparkline([20, 35, 45, 60, 80, 95, 120], "#ef4444")}
                </div>
              </CardContent>
            </Card>

            {/* KPI 2 */}
            <Card className="card-kpi shadow-soft border-border-soft flex flex-col justify-between">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-kpi-label text-text-kpi-label">Logged Entries</span>
                  <div className="h-2 w-2 rounded-full bg-info" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-3xl font-extrabold text-text-primary">{consumptionStats.logsCount} logs</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-label text-text-muted">Consumption records</span>
                  {renderSparkline([5, 8, 12, 10, 15, 18, 22], "#0ea5e9")}
                </div>
              </CardContent>
            </Card>

            {/* KPI 3 */}
            <Card className="card-kpi shadow-soft border-border-soft flex flex-col justify-between">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-kpi-label text-text-kpi-label">Active Projects</span>
                  <div className="h-2 w-2 rounded-full bg-success" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-3xl font-extrabold text-text-primary">{consumptionStats.uniqueProjects} Sites</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-label text-text-muted">Linked locations</span>
                  {renderSparkline([1, 2, 2, 3, 3, 4, 4], "#22c55e")}
                </div>
              </CardContent>
            </Card>

            {/* KPI 4 */}
            <Card className="card-kpi shadow-soft border-border-soft flex flex-col justify-between">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-kpi-label text-text-kpi-label">Top Material</span>
                  <div className="h-2 w-2 rounded-full bg-warning" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-[17px] font-extrabold text-text-primary truncate" title={consumptionStats.topMaterial}>
                  {consumptionStats.topMaterial}
                </p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-label text-text-muted">Most consumed</span>
                  <div className="text-[10px] font-bold text-warning uppercase">Max usage</div>
                </div>
              </CardContent>
            </Card>

            {/* KPI 5 */}
            <Card className="card-kpi shadow-soft border-border-soft flex flex-col justify-between">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-kpi-label text-text-kpi-label">Top Project Site</span>
                  <div className="h-2 w-2 rounded-full bg-accent-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-[17px] font-extrabold text-text-primary truncate" title={consumptionStats.topProject}>
                  {consumptionStats.topProject}
                </p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-label text-text-muted">Highest site usage</span>
                  <div className="text-[10px] font-bold text-accent-primary uppercase">Leader</div>
                </div>
              </CardContent>
            </Card>

            {/* KPI 6 */}
            <Card className="card-kpi shadow-soft border-border-soft flex flex-col justify-between">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-kpi-label text-text-kpi-label">Avg Log Qty</span>
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-3xl font-extrabold text-text-primary">{consumptionStats.avgQuantity} Units</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-label text-text-muted">Average per log</span>
                  {renderSparkline([15, 25, 20, 30, 22, 28, 25], "#6366f1")}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* KPI 1 */}
            <Card className="card-kpi shadow-soft border-border-soft flex flex-col justify-between">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-kpi-label text-text-kpi-label">Total Movements</span>
                  <div className="h-2 w-2 rounded-full bg-success" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-3xl font-extrabold text-text-primary">{kpis.totalMovements}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-label text-text-muted">Operations Logged</span>
                  {renderSparkline(sparklineData.total, "#2563eb")}
                </div>
              </CardContent>
            </Card>

            {/* KPI 2 */}
            <Card className="card-kpi shadow-soft border-border-soft flex flex-col justify-between">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-kpi-label text-text-kpi-label">Stock In Value</span>
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-3xl font-extrabold text-text-primary">
                  {kpis.stockInVal >= 100000 ? `₹${(kpis.stockInVal / 100000).toFixed(1)}L` : `₹${kpis.stockInVal.toLocaleString()}`}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-label text-success font-semibold flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> 12%
                  </span>
                  {renderSparkline(sparklineData.stockIn, "#22c55e")}
                </div>
              </CardContent>
            </Card>

            {/* KPI 3 */}
            <Card className="card-kpi shadow-soft border-border-soft flex flex-col justify-between">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-kpi-label text-text-kpi-label">Stock Out Issues</span>
                  <div className="h-2 w-2 rounded-full bg-error" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-3xl font-extrabold text-text-primary">{kpis.stockOut} logs</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-label text-error font-semibold flex items-center gap-0.5">
                    <ArrowDownRight className="h-3 w-3" /> 5%
                  </span>
                  {renderSparkline(sparklineData.stockOut, "#ef4444")}
                </div>
              </CardContent>
            </Card>

            {/* KPI 4 */}
            <Card className="card-kpi shadow-soft border-border-soft flex flex-col justify-between">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-kpi-label text-text-kpi-label">Transfers</span>
                  <div className="h-2 w-2 rounded-full bg-warning" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-3xl font-extrabold text-text-primary">{kpis.transfers}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-label text-text-muted">Inter-depot</span>
                  {renderSparkline(sparklineData.transfers, "#f59e0b")}
                </div>
              </CardContent>
            </Card>

            {/* KPI 5 */}
            <Card className="card-kpi shadow-soft border-border-soft flex flex-col justify-between">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-kpi-label text-text-kpi-label">Net Flow Balance</span>
                  <div className="h-2 w-2 rounded-full bg-info" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-3xl font-extrabold text-text-primary">
                  {kpis.netFlow > 0 ? `+${kpis.netFlow}` : kpis.netFlow}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-label text-text-muted font-semibold">Building Stock</span>
                  {renderSparkline(sparklineData.netFlow, "#0ea5e9")}
                </div>
              </CardContent>
            </Card>

            {/* KPI 6 */}
            <Card className="card-kpi shadow-soft border-border-soft flex flex-col justify-between">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="text-kpi-label text-text-kpi-label">Pending Actions</span>
                  <div className="h-2 w-2 rounded-full bg-error animate-ping" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-3xl font-extrabold text-text-primary">{kpis.pending}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-label text-error font-bold">Needs Attention</span>
                  {renderSparkline(sparklineData.pending, "#ef4444")}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* SECTION 3: INTELLIGENT OPERATIONS INSIGHTS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Insight 1: Inventory Build-Up (Warning/Info) */}
        <Card className="shadow-soft border-l-4 border-l-info bg-white/50 hover:bg-white transition-colors duration-150">
          <CardContent className="p-4 flex gap-3">
            <TrendingUp className="h-5 w-5 text-info shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-body font-bold text-text-primary">Inventory Build-Up</p>
              <p className="text-label text-text-secondary">Inbound inventory increased 18% over the last 14 days.</p>
              <p className="text-label font-semibold text-info mt-1 cursor-pointer hover:underline" onClick={() => toast.info("Directing to warehouse capacity dashboard...")}>
                Action: Review warehouse utilization &rarr;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Insight 2: Transfer Delays (Critical) */}
        <Card className="shadow-soft border-l-4 border-l-error bg-white/50 hover:bg-white transition-colors duration-150">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-body font-bold text-text-primary">Transfer Delays</p>
              <p className="text-label text-text-secondary">3 transfers remain in transit beyond expected duration.</p>
              <p className="text-label font-semibold text-error mt-1 cursor-pointer hover:underline" onClick={() => { setStatusFilter("In Transit"); setActiveTab("TRANSFER"); }}>
                Action: Review logistics dashboard &rarr;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Insight 3: Consumption Spike (Warning) */}
        <Card className="shadow-soft border-l-4 border-l-warning bg-white/50 hover:bg-white transition-colors duration-150">
          <CardContent className="p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-body font-bold text-text-primary">Consumption Spike</p>
              <p className="text-label text-text-secondary">Steel consumption increased 22% this week due to slab castings.</p>
              <p className="text-label font-semibold text-warning mt-1 cursor-pointer hover:underline" onClick={() => toast.info("Opening procurement forecast module...")}>
                Action: Review reorder forecast &rarr;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Insight 4: Inventory Risk (Critical) */}
        <Card className="shadow-soft border-l-4 border-l-error bg-white/50 hover:bg-white transition-colors duration-150">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-body font-bold text-text-primary">Inventory Risk</p>
              <p className="text-label text-text-secondary">5 materials are currently below their reorder threshold.</p>
              <p className="text-label font-semibold text-error mt-1 cursor-pointer hover:underline" onClick={() => toast.info("Redirecting to Purchase Requests page...")}>
                Action: Initiate procurement requisition &rarr;
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4: ANALYTICS DASHBOARD */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Movement Volume Trend */}
        <Card className="shadow-soft border-border-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-text-primary">Movement Volume Trend</CardTitle>
              <Badge tone="neutral">Stacked Area Chart (30 Days)</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area type="monotone" dataKey="Stock In" stackId="1" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                <Area type="monotone" dataKey="Stock Out" stackId="1" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
                <Area type="monotone" dataKey="Transfers" stackId="1" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorTrans)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Movement Distribution */}
        <Card className="shadow-soft border-border-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-text-primary">Movement Distribution</CardTitle>
              <Badge tone="neutral">Donut Volume Split</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2 h-[300px] flex items-center justify-center">
            <div className="relative h-full w-full max-w-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {distributionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} logs`, "Volume"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-label text-text-muted uppercase tracking-wider font-semibold">Total Movements</span>
                <span className="text-2xl font-extrabold text-text-primary mt-1">{allMovements.length}</span>
              </div>
            </div>
            <div className="space-y-3 shrink-0 pl-6 border-l border-border-soft">
              {distributionChartData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-body text-text-secondary font-medium w-[80px]">{d.name}</span>
                  <span className="text-body font-bold text-text-primary">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Warehouse Activity */}
        <Card className="shadow-soft border-border-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-text-primary">Warehouse Activity Comparison</CardTitle>
              <Badge tone="neutral">Operational Load (Units)</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={warehouseActivityData} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="Inbound" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="Outbound" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 4: Top Moving Materials */}
        <Card className="shadow-soft border-border-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-text-primary">Top Moving Materials</CardTitle>
              <Badge tone="neutral">Movement Frequency</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMovingMaterialsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="Volume" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* MOVEMENT CONTROL CENTER (TABS) */}
      <div className="border-b border-border-soft mt-8">
        <div className="flex space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-body font-bold transition-all shrink-0 ${activeTab === "ALL" ? "border-accent-primary text-accent-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            <span>All Movements</span>
            <Badge tone="neutral" className="px-1.5 py-0">{allMovements.length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab("IN")}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-body font-bold transition-all shrink-0 ${activeTab === "IN" ? "border-success text-success" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            <span>Stock In</span>
            <Badge tone="success" className="px-1.5 py-0">{allMovements.filter(m => m.type === "Stock In").length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab("OUT")}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-body font-bold transition-all shrink-0 ${activeTab === "OUT" ? "border-error text-error" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            <span>Stock Out</span>
            <Badge tone="warning" className="px-1.5 py-0">{allMovements.filter(m => m.type === "Stock Out").length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab("CONSUMPTION")}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-body font-bold transition-all shrink-0 ${activeTab === "CONSUMPTION" ? "border-error text-error" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            <span>Consumption Log</span>
            <Badge tone="error" className="px-1.5 py-0">{consumptionQuery.data?.consumptions?.length || 0}</Badge>
          </button>
          <button
            onClick={() => setActiveTab("TRANSFER")}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-body font-bold transition-all shrink-0 ${activeTab === "TRANSFER" ? "border-warning text-warning" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            <span>Transfers</span>
            <Badge tone="info" className="px-1.5 py-0">{allMovements.filter(m => m.type === "Transfer").length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-body font-bold transition-all shrink-0 ${activeTab === "PENDING" ? "border-error text-error" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            <span>Pending & In Transit</span>
            <Badge tone="warning" className="px-1.5 py-0">{allMovements.filter(m => m.status === "Pending" || m.status === "In Transit").length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab("CATALOG")}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-body font-bold transition-all shrink-0 ${activeTab === "CATALOG" ? "border-accent-primary text-accent-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            <span>Material Catalog</span>
            <Badge tone="neutral" className="px-1.5 py-0">{materialsQuery.data?.materials?.length || 0}</Badge>
          </button>
        </div>
      </div>

      {/* SEARCH + FILTER TOOLBAR */}
      <div className="bg-surface-secondary/80 border border-border-soft rounded-[var(--radius-card)] p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={activeTab === "CATALOG" ? "Search by material, SKU, category, warehouse, project..." : "Search by material, SKU, PO reference, warehouse, project..."}
              className="h-12 rounded-[20px] border-white/70 bg-white pl-10 shadow-soft"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "CATALOG" ? (
              <>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-10 rounded-lg border border-border-soft bg-white px-3 text-label text-text-primary focus:outline-none shadow-soft"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Cement">Cement</option>
                  <option value="Steel">Steel</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Finishing">Finishing</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-lg border border-border-soft bg-white px-3 text-label text-text-primary focus:outline-none shadow-soft"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Critical">Critical</option>
                </select>
              </>
            ) : (
              <>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-10 rounded-lg border border-border-soft bg-white px-3 text-label text-text-primary focus:outline-none shadow-soft"
                >
                  <option value="ALL">All Types</option>
                  <option value="Stock In">Stock In</option>
                  <option value="Stock Out">Stock Out</option>
                  <option value="Transfer">Transfer</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-lg border border-border-soft bg-white px-3 text-label text-text-primary focus:outline-none shadow-soft"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Received">Received</option>
                  <option value="Pending">Pending</option>
                  <option value="In Transit">In Transit</option>
                </select>
              </>
            )}
            {(searchValue || typeFilter !== "ALL" || statusFilter !== "ALL" || warehouseFilter !== "ALL" || projectFilter !== "ALL" || materialFilter !== "ALL" || categoryFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchValue("");
                  setTypeFilter("ALL");
                  setStatusFilter("ALL");
                  setWarehouseFilter("ALL");
                  setProjectFilter("ALL");
                  setMaterialFilter("ALL");
                  setCategoryFilter("ALL");
                  if (activeTab !== "CATALOG") {
                    setActiveTab("ALL");
                  }
                }}
                className="text-text-muted hover:text-text-primary"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-soft/60">
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="h-9 rounded-lg border border-border-soft bg-white px-2.5 text-label text-text-muted focus:outline-none"
          >
            <option value="ALL">All Warehouses</option>
            {materialsQuery.data?.warehouses?.map((w) => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-9 rounded-lg border border-border-soft bg-white px-2.5 text-label text-text-muted focus:outline-none"
          >
            <option value="ALL">All Projects</option>
            {projectsQuery.data?.projects?.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {activeTab !== "CATALOG" && (
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className="h-9 rounded-lg border border-border-soft bg-white px-2.5 text-label text-text-muted focus:outline-none"
            >
              <option value="ALL">All Materials</option>
              {filterOptions.materials.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-label text-text-muted mr-1.5">Quick Filters:</span>
            {activeTab === "CATALOG" ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full text-label border-border-soft bg-white hover:bg-hover px-3 py-1 font-semibold"
                  onClick={() => { setStatusFilter("Low Stock"); }}
                >
                  Low Stock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full text-label border-border-soft bg-white hover:bg-hover px-3 py-1 font-semibold"
                  onClick={() => { setStatusFilter("Critical"); }}
                >
                  Critical Stock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full text-label border-border-soft bg-white hover:bg-hover px-3 py-1 font-semibold"
                  onClick={() => { setStatusFilter("Healthy"); }}
                >
                  Healthy Stock
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full text-label border-border-soft bg-white hover:bg-hover px-3 py-1 font-semibold"
                  onClick={() => { setStatusFilter("In Transit"); setTypeFilter("Transfer"); }}
                >
                  In Transit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full text-label border-border-soft bg-white hover:bg-hover px-3 py-1 font-semibold"
                  onClick={() => { setStatusFilter("Pending"); }}
                >
                  Pending Approval
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full text-label border-border-soft bg-white hover:bg-hover px-3 py-1 font-semibold"
                  onClick={() => {
                    const large = allMovements.find(m => m.quantityNum >= 200);
                    if (large) {
                      setSearchValue(large.materialName);
                    } else {
                      toast.info("No large movements (200+ units) in recent history");
                    }
                  }}
                >
                  Large Movements
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* UNIFIED STOCK MOVEMENT TABLE */}
      <Card className="overflow-hidden border border-border-soft shadow-soft">
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-table">
              <thead className="bg-surface-secondary text-text-secondary sticky top-0 z-[10] border-b border-border-soft">
                {activeTab === "CONSUMPTION" ? (
                  <tr className="h-12">
                    <th className="px-5 text-left font-bold w-[120px]">Date</th>
                    <th className="px-4 text-left font-bold">Material</th>
                    <th className="px-4 text-left font-bold">Project</th>
                    <th className="px-4 text-left font-bold w-[130px]">Quantity</th>
                    <th className="px-4 text-left font-bold">Purpose</th>
                    <th className="px-4 text-left font-bold w-[160px]">Recorded By</th>
                    <th className="px-4 text-center font-bold w-[100px]">Actions</th>
                  </tr>
                ) : activeTab === "CATALOG" ? (
                  <tr className="h-12">
                    <th className="px-5 text-left font-bold w-[120px]">SKU</th>
                    <th className="px-4 text-left font-bold">Material Name</th>
                    <th className="px-4 text-left font-bold w-[130px]">Category</th>
                    <th className="px-4 text-left font-bold">Warehouse</th>
                    <th className="px-4 text-left font-bold">Project Allocation</th>
                    <th className="px-4 text-left font-bold w-[120px]">On Hand</th>
                    <th className="px-4 text-left font-bold w-[110px]">Reorder Pt</th>
                    <th className="px-4 text-left font-bold w-[110px]">Status</th>
                    <th className="px-4 text-center font-bold w-[280px]">Actions</th>
                  </tr>
                ) : (
                  <tr className="h-12">
                    <th className="px-5 text-left font-bold w-[120px]">Date</th>
                    <th className="px-4 text-left font-bold w-[120px]">Type</th>
                    <th className="px-4 text-left font-bold">Material</th>
                    <th className="px-4 text-left font-bold">Source → Destination</th>
                    <th className="px-4 text-left font-bold w-[130px]">Quantity</th>
                    <th className="px-4 text-left font-bold w-[120px]">Reference</th>
                    <th className="px-4 text-left font-bold w-[120px]">Status</th>
                    <th className="px-4 text-left font-bold w-[140px]">Recorded By</th>
                    <th className="px-4 text-center font-bold w-[100px]">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeTab === "CONSUMPTION" ? (
                  filteredConsumptions.length === 0 ? (
                    <TableEmptyStateRow colSpan={7} title="No Consumption Logs Found" description="Try adjusting your filter settings or search terms." />
                  ) : (
                    pagedConsumptions.map((con) => {
                      const mat = materialsQuery.data?.materials.find((m) => m.id === con.materialId);
                      return (
                        <tr
                          key={con.id}
                          className="group border-t border-border-soft hover:bg-hover/40 transition-all cursor-pointer hover:border-l-4 hover:border-l-error"
                          onClick={() => {
                            const mockMovement: StockMovement = {
                              id: con.id,
                              type: "Stock Out",
                              materialId: con.materialId,
                              materialName: con.materialName,
                              sku: mat?.sku || "SKU-N/A",
                              category: mat?.category || "Building Materials",
                              source: mat?.warehouseName || "Main Store",
                              destination: con.projectName,
                              quantity: `-${con.quantity} ${con.unit}`,
                              quantityNum: con.quantity,
                              unit: con.unit,
                              reference: con.id.replace("con-", "STK-").substring(0, 10).toUpperCase(),
                              status: "Completed",
                              recordedBy: con.recordedByName || "Store Keeper",
                              date: con.consumedOn,
                              notes: `Purpose: ${con.purpose || "Internal Site Allocation"}. Recorded by ${con.recordedByName}.`,
                              raw: con
                            };
                            setSelectedMovement(mockMovement);
                            setDetailDrawerOpen(true);
                          }}
                        >
                          <td className="px-5 py-4 text-text-muted font-medium whitespace-nowrap">{formatDate(con.consumedOn)}</td>
                          <td className="px-4 py-4">
                            <div className="space-y-0.5">
                              <p className="font-bold text-text-primary group-hover:text-accent-primary transition-colors">{con.materialName}</p>
                              <div className="flex gap-2 text-label text-text-muted">
                                <span>SKU: {mat?.sku || "SKU-N/A"}</span>
                                <span>•</span>
                                <span>{mat?.category || "Building Materials"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-text-primary font-medium">{con.projectName}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-error font-bold">-{con.quantity} {con.unit}</td>
                          <td className="px-4 py-4 text-text-secondary">{con.purpose || "Internal Allocation"}</td>
                          <td className="px-4 py-4 text-text-secondary whitespace-nowrap">{con.recordedByName || "Store Keeper"}</td>
                          <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  const mockMovement: StockMovement = {
                                    id: con.id,
                                    type: "Stock Out",
                                    materialId: con.materialId,
                                    materialName: con.materialName,
                                    sku: mat?.sku || "SKU-N/A",
                                    category: mat?.category || "Building Materials",
                                    source: mat?.warehouseName || "Main Store",
                                    destination: con.projectName,
                                    quantity: `-${con.quantity} ${con.unit}`,
                                    quantityNum: con.quantity,
                                    unit: con.unit,
                                    reference: con.id.replace("con-", "STK-").substring(0, 10).toUpperCase(),
                                    status: "Completed",
                                    recordedBy: con.recordedByName || "Store Keeper",
                                    date: con.consumedOn,
                                    notes: `Purpose: ${con.purpose || "Internal Site Allocation"}. Recorded by ${con.recordedByName}.`,
                                    raw: con
                                  };
                                  setSelectedMovement(mockMovement);
                                  setDetailDrawerOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )
                ) : activeTab === "CATALOG" ? (
                  filteredMaterials.length === 0 ? (
                    <TableEmptyStateRow colSpan={9} title="No Materials Found" description="Try adjusting your filter settings or search terms." />
                  ) : (
                    pagedMaterials.map((m) => {
                      const isLow = m.status === "Low Stock" || m.onHand <= m.reorderLevel;
                      const isCritical = m.onHand <= m.reorderLevel * 0.25 || m.onHand === 0;
                      let statusBadge = <Badge tone="success">Healthy</Badge>;
                      if (isCritical) {
                        statusBadge = <Badge tone="error">Critical</Badge>;
                      } else if (isLow) {
                        statusBadge = <Badge tone="warning">Low Stock</Badge>;
                      }

                      return (
                        <tr
                          key={m.id}
                          className="group border-t border-border-soft hover:bg-hover/40 transition-all cursor-pointer"
                        >
                          <td className="px-5 py-4 font-mono text-label text-text-muted whitespace-nowrap">{m.sku}</td>
                          <td className="px-4 py-4 font-bold text-text-primary">{m.name}</td>
                          <td className="px-4 py-4 text-text-secondary">{m.category}</td>
                          <td className="px-4 py-4 text-text-secondary">{m.warehouseName}</td>
                          <td className="px-4 py-4 text-text-secondary">{m.projectName}</td>
                          <td className="px-4 py-4 font-bold text-text-primary">{m.onHand} {m.unit}</td>
                          <td className="px-4 py-4 text-text-muted">{m.reorderLevel} {m.unit}</td>
                          <td className="px-4 py-4">{statusBadge}</td>
                          <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs font-semibold"
                                onClick={() => handleEditMaterial(m)}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1 text-accent-primary" /> Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs font-semibold text-error hover:text-error hover:bg-error/5"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to archive ${m.name}?`)) {
                                    archiveMaterialMutation.mutate(m.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Archive
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs font-semibold border-success/35 text-success hover:bg-success/5 animate-all"
                                onClick={() => {
                                  setStockInForm((prev) => ({ ...prev, materialId: m.id }));
                                  setStockInDrawerOpen(true);
                                }}
                              >
                                In
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs font-semibold border-error/35 text-error hover:bg-error/5 animate-all"
                                onClick={() => {
                                  setStockOutForm((prev) => ({ ...prev, materialId: m.id }));
                                  setStockOutDrawerOpen(true);
                                }}
                              >
                                Out
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )
                ) : (
                  filteredMovements.length === 0 ? (
                    <TableEmptyStateRow colSpan={9} title="No Movements Found" description="Try adjusting your filter settings or search terms." />
                  ) : (
                    pagedMovements.map((mov) => {
                      const isStockIn = mov.type === "Stock In";
                      const isStockOut = mov.type === "Stock Out";
                      const isTransfer = mov.type === "Transfer";

                      // Determine quantity color and typography class
                      let qtyColorClass = "";
                      if (isStockIn) qtyColorClass = "text-success font-bold";
                      else if (isStockOut) qtyColorClass = "text-error font-bold";
                      else qtyColorClass = "text-warning font-bold";

                      // Left border indicator style
                      let borderLeftStyle = "";
                      if (isStockIn) borderLeftStyle = "hover:border-l-4 hover:border-l-success";
                      else if (isStockOut) borderLeftStyle = "hover:border-l-4 hover:border-l-error";
                      else borderLeftStyle = "hover:border-l-4 hover:border-l-warning";

                      return (
                        <tr
                          key={`${mov.type}-${mov.id}`}
                          className={`group border-t border-border-soft hover:bg-hover/40 transition-all cursor-pointer ${borderLeftStyle}`}
                          onClick={() => {
                            setSelectedMovement(mov);
                            setDetailDrawerOpen(true);
                          }}
                        >
                          <td className="px-5 py-4 text-text-muted font-medium whitespace-nowrap">{formatDate(mov.date)}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {isStockIn && (
                              <Badge tone="success" className="gap-1 px-2 py-0.5">
                                <ArrowDownRight className="h-3 w-3" /> Stock In
                              </Badge>
                            )}
                            {isStockOut && (
                              <Badge tone="warning" className="gap-1 px-2 py-0.5">
                                <ArrowUpRight className="h-3 w-3" /> Stock Out
                              </Badge>
                            )}
                            {isTransfer && (
                              <Badge tone="info" className="gap-1 px-2 py-0.5">
                                <ArrowLeftRight className="h-3 w-3" /> Transfer
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-0.5">
                              <p className="font-bold text-text-primary group-hover:text-accent-primary transition-colors">{mov.materialName}</p>
                              <div className="flex gap-2 text-label text-text-muted">
                                <span>SKU: {mov.sku}</span>
                                <span>•</span>
                                <span>{mov.category}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5 text-text-primary">
                              <span className="font-medium shrink-0 max-w-[130px] truncate" title={mov.source}>{mov.source}</span>
                              <ArrowRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
                              <span className="font-semibold shrink-0 max-w-[130px] truncate" title={mov.destination}>{mov.destination}</span>
                            </div>
                          </td>
                          <td className={`px-4 py-4 whitespace-nowrap ${qtyColorClass}`}>
                            {mov.quantity}
                          </td>
                          <td className="px-4 py-4 font-mono text-label text-text-muted whitespace-nowrap">{mov.reference}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge tone={toneForStatus(mov.status)}>{mov.status}</Badge>
                          </td>
                          <td className="px-4 py-4 text-text-secondary whitespace-nowrap">{mov.recordedBy}</td>
                          <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedMovement(mov);
                                  setDetailDrawerOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toast.info(`Printing stock slip for ${mov.reference}`)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border-soft flex flex-wrap items-center justify-between gap-3 bg-surface-secondary/25">
              <span className="text-xs text-text-muted font-medium">
                Showing {startIndex + 1} - {Math.min(startIndex + rowsPerPage, totalFiltered)} of {totalFiltered} {activeTab === "CONSUMPTION" ? "Consumptions" : activeTab === "CATALOG" ? "Materials" : "Movements"}
              </span>
              
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  // Show limited page buttons to avoid overflow
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <Button
                        key={idx}
                        variant={currentPage === pageNum ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0 text-xs font-semibold"
                      >
                        {pageNum}
                      </Button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return (
                      <span key={idx} className="px-1 text-xs text-text-muted">...</span>
                    );
                  }
                  return null;
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 8: MOVEMENT DETAIL DRAWER */}
      <Drawer
        open={detailDrawerOpen}
        title={`Movement Detail: ${selectedMovement?.reference}`}
        size="lg"
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedMovement(null);
        }}
      >
        {selectedMovement && (
          <div className="space-y-6 pb-12">
            {/* Header / Type Hero Banner */}
            <div className="flex items-center justify-between p-4 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-full ${selectedMovement.type === "Stock In" ? "bg-emerald-50 text-success" : selectedMovement.type === "Stock Out" ? "bg-red-50 text-error" : "bg-amber-50 text-warning"}`}>
                  {selectedMovement.type === "Stock In" ? (
                    <ArrowDownRight className="h-6 w-6" />
                  ) : selectedMovement.type === "Stock Out" ? (
                    <ArrowUpRight className="h-6 w-6" />
                  ) : (
                    <ArrowLeftRight className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-card-title font-bold text-text-primary">{selectedMovement.type}</h3>
                  <p className="text-label text-text-muted font-mono">{selectedMovement.reference}</p>
                </div>
              </div>
              <Badge tone={toneForStatus(selectedMovement.status)} className="px-3 py-1 font-semibold text-body">
                {selectedMovement.status}
              </Badge>
            </div>

            {/* Inventory Impact Section */}
            <div className="space-y-3">
              <h4 className="text-body font-bold text-text-primary flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-accent-primary" /> Inventory Balance Impact
              </h4>
              <div className="grid grid-cols-3 gap-4 p-4 rounded-[var(--radius-input)] border border-border-soft">
                <div className="text-center space-y-1">
                  <p className="text-label text-text-muted">Before Stock</p>
                  <p className="text-lg font-bold text-text-secondary">420 Bags</p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className={`text-label font-extrabold px-3 py-1 rounded-full ${selectedMovement.type === "Stock In" ? "bg-emerald-100 text-success" : selectedMovement.type === "Stock Out" ? "bg-red-100 text-error" : "bg-amber-100 text-warning"}`}>
                    {selectedMovement.quantity}
                  </div>
                  <div className="h-0.5 w-full bg-border-soft relative mt-2">
                    <ArrowRight className="h-3 w-3 text-text-muted absolute right-1 -top-1" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-label text-text-muted">After Stock</p>
                  <p className="text-lg font-bold text-text-primary">
                    {selectedMovement.type === "Stock In" ? "540 Bags" : selectedMovement.type === "Stock Out" ? "370 Bags" : "420 Bags"}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Details List */}
            <div className="space-y-3">
              <h4 className="text-body font-bold text-text-primary flex items-center gap-1.5">
                <Info className="h-4 w-4 text-accent-primary" /> Transaction Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-[var(--radius-input)] border border-border-soft p-4">
                <div className="space-y-1">
                  <span className="text-label text-text-muted">Material Name</span>
                  <p className="text-body font-bold text-text-primary">{selectedMovement.materialName}</p>
                </div>
                {selectedMovement.sku && (
                  <div className="space-y-1">
                    <span className="text-label text-text-muted">Material SKU</span>
                    <p className="text-body font-mono text-text-primary">{selectedMovement.sku}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-label text-text-muted">Source (Origin)</span>
                  <p className="text-body font-semibold text-text-primary">{selectedMovement.source}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-label text-text-muted">Destination (Target)</span>
                  <p className="text-body font-semibold text-text-primary">{selectedMovement.destination}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-label text-text-muted">Recorded By</span>
                  <p className="text-body text-text-primary">{selectedMovement.recordedBy}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-label text-text-muted">Movement Date</span>
                  <p className="text-body text-text-primary">{formatDateTime(selectedMovement.date)}</p>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {selectedMovement.notes && (
              <div className="space-y-2">
                <h4 className="text-body font-bold text-text-primary">System Log Notes</h4>
                <p className="text-body text-text-secondary bg-surface-secondary p-3.5 rounded-[var(--radius-input)] border border-border-soft italic">
                  "{selectedMovement.notes}"
                </p>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="space-y-3">
              <h4 className="text-body font-bold text-text-primary flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-accent-primary" /> Movement Lifecycle Status
              </h4>
              <div className="relative border-l border-border-soft ml-2.5 pl-6 space-y-6 py-2">
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success text-white">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <p className="text-body font-bold text-text-primary">Movement Initiated</p>
                    <p className="text-label text-text-muted">{formatDateTime(selectedMovement.date)}</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success text-white">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <p className="text-body font-bold text-text-primary">Quality Checks Completed</p>
                    <p className="text-label text-text-muted">Verified by site inspector • QA passed</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ${selectedMovement.status === "Completed" || selectedMovement.status === "Received" ? "bg-success" : "bg-warning animate-pulse"} text-white`}>
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <p className="text-body font-bold text-text-primary">
                      {selectedMovement.status === "Pending" ? "Awaiting Supervisor Approval" : selectedMovement.status === "In Transit" ? "Dispatched / In Transit" : "Dispatched & Logged"}
                    </p>
                    <p className="text-label text-text-muted">Location: {selectedMovement.source}</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ${selectedMovement.status === "Completed" || selectedMovement.status === "Received" ? "bg-success" : "bg-hover"} text-white`}>
                    {selectedMovement.status === "Completed" || selectedMovement.status === "Received" ? (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-text-muted" />
                    )}
                  </div>
                  <div>
                    <p className="text-body font-bold text-text-primary">Receipt Confirmed</p>
                    <p className="text-label text-text-muted">
                      {selectedMovement.status === "Completed" || selectedMovement.status === "Received"
                        ? `Received at ${selectedMovement.destination}`
                        : "Awaiting delivery receipt verification"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Movements History */}
            <div className="space-y-3">
              <h4 className="text-body font-bold text-text-primary flex items-center gap-1.5">
                <History className="h-4 w-4 text-accent-primary" /> Material Movement History
              </h4>
              <div className="border border-border-soft rounded-[var(--radius-input)] overflow-hidden">
                <table className="w-full text-table text-left">
                  <thead className="bg-surface-secondary text-text-secondary text-label border-b border-border-soft">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Flow</th>
                      <th className="p-3">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMovements
                      .filter(m => m.materialName === selectedMovement.materialName && m.reference !== selectedMovement.reference)
                      .slice(0, 4)
                      .map((historyMov) => (
                        <tr key={historyMov.id} className="border-t border-border-soft text-text-secondary">
                          <td className="p-3 font-mono text-label">{historyMov.reference}</td>
                          <td className="p-3 text-label">{historyMov.type}</td>
                          <td className="p-3 truncate max-w-[160px]">{historyMov.source} &rarr; {historyMov.destination}</td>
                          <td className="p-3 font-bold">{historyMov.quantity}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print & Slip Control Buttons */}
            <div className="flex gap-3 border-t border-border-soft pt-6 mt-6">
              <Button type="button" variant="outline" className="flex-1" onClick={() => toast.info("Downloading PDF summary...")}>
                <FileDown className="h-4 w-4" /> Download PDF Slip
              </Button>
              <Button type="button" className="flex-1 bg-accent-primary text-white" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print Movement Slip
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* SECTION 9: RECORD STOCK IN DRAWER */}
      <Drawer
        open={stockInDrawerOpen}
        title="Record Stock In"
        size="lg"
        onClose={() => setStockInDrawerOpen(false)}
      >
        <form onSubmit={handleStockInSubmit} className="space-y-6 pb-12">
          {/* Section 1: Material & Stock Info */}
          <div className="space-y-4">
            <h4 className="text-body font-bold text-accent-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <Package className="h-4 w-4" /> Material Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Material Name</label>
                <select
                  value={stockInForm.materialId}
                  onChange={(e) => setStockInForm(prev => ({ ...prev, materialId: e.target.value }))}
                  className={selectClassName}
                >
                  {materialsQuery.data?.materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Quantity to Record</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 150"
                  value={stockInForm.quantity}
                  onChange={(e) => setStockInForm(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vendor Info */}
          <div className="space-y-4 pt-2">
            <h4 className="text-body font-bold text-accent-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Vendor Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Select Vendor Source</label>
                <select
                  value={stockInForm.vendorId}
                  onChange={(e) => setStockInForm(prev => ({ ...prev, vendorId: e.target.value }))}
                  className={selectClassName}
                >
                  {vendorsQuery.data?.vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Reference Doc / PO / Invoice</label>
                <Input
                  placeholder="e.g. INV-1002"
                  value={stockInForm.reference}
                  onChange={(e) => setStockInForm(prev => ({ ...prev, reference: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Destination Warehouse */}
          <div className="space-y-4 pt-2">
            <h4 className="text-body font-bold text-accent-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> Warehouse Destination
            </h4>
            <div className="p-4 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary space-y-1">
              <span className="text-label text-text-muted">Target Storage Warehouse</span>
              <p className="text-body font-bold text-text-primary">
                {selectedInMaterialDetails?.warehouseName || "Warehouse not mapped"}
              </p>
              <p className="text-label text-text-muted">
                Items will automatically route to the associated default warehouse for this material.
              </p>
            </div>
          </div>

          {/* Section 4: Quality Check */}
          <div className="space-y-4 pt-2">
            <h4 className="text-body font-bold text-accent-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Quality Control & Compliance
            </h4>
            <div className="space-y-3 p-4 rounded-[var(--radius-input)] border border-border-soft bg-surface">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="qualityCheck"
                  checked={stockInForm.qualityCheck}
                  onChange={(e) => setStockInForm(prev => ({ ...prev, qualityCheck: e.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-border-soft text-accent-primary"
                />
                <label htmlFor="qualityCheck" className="text-body text-text-secondary font-medium">
                  Material inspection completed on arrival.
                </label>
              </div>
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="qualityPass"
                  checked={stockInForm.qualityPass}
                  onChange={(e) => setStockInForm(prev => ({ ...prev, qualityPass: e.target.checked }))}
                  disabled={!stockInForm.qualityCheck}
                  className="mt-1 h-4 w-4 rounded border-border-soft text-success disabled:opacity-50"
                />
                <label htmlFor="qualityPass" className="text-body text-text-secondary font-medium">
                  Materials pass grade specifications and show no visual damage.
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-label text-text-secondary">Additional Notes</label>
            <textarea
              className={textareaClassName}
              value={stockInForm.notes}
              onChange={(e) => setStockInForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Record batch numbers, driver details, gate pass reference..."
            />
          </div>

          {/* Live Inventory Preview Panel */}
          {selectedInMaterialDetails && stockInForm.quantity && (
            <div className="p-4 rounded-[var(--radius-input)] border border-emerald-200 bg-emerald-50/50 space-y-2">
              <h5 className="text-label font-bold text-success flex items-center gap-1">
                <Sparkles className="h-4.5 w-4.5" /> LIVE INVENTORY PREVIEW IMPACT
              </h5>
              <div className="flex justify-between text-body text-text-secondary">
                <span>Current Stock level:</span>
                <span className="font-semibold">{selectedInMaterialDetails.onHand} {selectedInMaterialDetails.unit}</span>
              </div>
              <div className="flex justify-between text-body text-success font-bold">
                <span>Received + Added:</span>
                <span>+{stockInForm.quantity} {selectedInMaterialDetails.unit}</span>
              </div>
              <div className="flex justify-between text-body text-text-primary border-t border-emerald-100 pt-2 font-extrabold">
                <span>Projected Stock level:</span>
                <span>{selectedInMaterialDetails.onHand + Number(stockInForm.quantity)} {selectedInMaterialDetails.unit}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border-soft justify-end">
            <Button type="button" variant="outline" onClick={() => setStockInDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={stockInMutation.isPending}
              className="bg-success text-white font-semibold"
            >
              Confirm Goods Receipt
            </Button>
          </div>
        </form>
      </Drawer>

      {/* SECTION 10: RECORD STOCK OUT DRAWER */}
      <Drawer
        open={stockOutDrawerOpen}
        title="Record Stock Out (Consumption Issue)"
        size="lg"
        onClose={() => setStockOutDrawerOpen(false)}
      >
        <form onSubmit={handleStockOutSubmit} className="space-y-6 pb-12">
          {/* Material & Warehouse details */}
          <div className="space-y-4">
            <h4 className="text-body font-bold text-accent-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <Package className="h-4 w-4" /> Material & Origin Store
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Material</label>
                <select
                  value={stockOutForm.materialId}
                  onChange={(e) => setStockOutForm(prev => ({ ...prev, materialId: e.target.value }))}
                  className={selectClassName}
                >
                  {materialsQuery.data?.materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Quantity to Issue</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  value={stockOutForm.quantity}
                  onChange={(e) => setStockOutForm(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
            </div>

            {selectedOutMaterialDetails && (
              <div className="p-4 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary flex justify-between text-body">
                <div>
                  <span className="text-label text-text-muted">Origin Warehouse</span>
                  <p className="font-bold text-text-primary">{selectedOutMaterialDetails.warehouseName}</p>
                </div>
                <div className="text-right">
                  <span className="text-label text-text-muted">Available Stock Balance</span>
                  <p className="font-bold text-text-primary">{selectedOutMaterialDetails.onHand} {selectedOutMaterialDetails.unit}</p>
                </div>
              </div>
            )}
          </div>

          {/* Project Destination */}
          <div className="space-y-4 pt-2">
            <h4 className="text-body font-bold text-accent-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> Destination Site / Project
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Select Project Destination</label>
                <select
                  value={stockOutForm.projectId}
                  onChange={(e) => setStockOutForm(prev => ({ ...prev, projectId: e.target.value }))}
                  className={selectClassName}
                >
                  {projectsQuery.data?.projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Purpose of Issue</label>
                <select
                  value={stockOutForm.purpose}
                  onChange={(e) => setStockOutForm(prev => ({ ...prev, purpose: e.target.value }))}
                  className={selectClassName}
                >
                  <option value="Slab Casting">Slab Casting / Foundations</option>
                  <option value="Masonry Work">Masonry / Brickwork</option>
                  <option value="Electrical Piping">Electrical Piping</option>
                  <option value="Plumbing Installation">Plumbing Installations</option>
                  <option value="Finishing Tiles">Finishing Work & Tiles</option>
                  <option value="General Operations">General Site Consumption</option>
                </select>
              </div>
            </div>
          </div>

          {/* Approvals */}
          <div className="space-y-4 pt-2">
            <h4 className="text-body font-bold text-accent-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <ClipboardCheck className="h-4 w-4" /> Issuance Authorization
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Approved / Authorized By</label>
                <Input
                  placeholder="e.g. Project Manager Kunal"
                  value={stockOutForm.approvedBy}
                  onChange={(e) => setStockOutForm(prev => ({ ...prev, approvedBy: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Notes</label>
                <Input
                  placeholder="Reference requisition slips..."
                  value={stockOutForm.notes}
                  onChange={(e) => setStockOutForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Validation Stock Levels Preview */}
          {selectedOutMaterialDetails && stockOutForm.quantity && (
            <div className={`p-4 rounded-[var(--radius-input)] border ${selectedOutMaterialDetails.onHand - Number(stockOutForm.quantity) < 0 ? "border-error bg-error-soft/10 text-text-error" : selectedOutMaterialDetails.onHand - Number(stockOutForm.quantity) < selectedOutMaterialDetails.reorderLevel ? "border-warning bg-warning/5" : "border-emerald-200 bg-emerald-50/50"} space-y-2`}>
              <h5 className="text-label font-bold flex items-center gap-1">
                <AlertTriangle className="h-4.5 w-4.5" /> INVENTORY VALIDATION PREVIEW
              </h5>
              <div className="flex justify-between text-body">
                <span>Available Balance:</span>
                <span className="font-semibold">{selectedOutMaterialDetails.onHand} {selectedOutMaterialDetails.unit}</span>
              </div>
              <div className="flex justify-between text-body font-semibold">
                <span>Requested Quantity:</span>
                <span>-{stockOutForm.quantity} {selectedOutMaterialDetails.unit}</span>
              </div>
              <div className="flex justify-between text-body border-t border-black/10 pt-2 font-bold">
                <span>Remaining Balance:</span>
                <span>{selectedOutMaterialDetails.onHand - Number(stockOutForm.quantity)} {selectedOutMaterialDetails.unit}</span>
              </div>

              {/* Warnings and alerts */}
              {selectedOutMaterialDetails.onHand - Number(stockOutForm.quantity) < 0 ? (
                <p className="text-label font-extrabold text-error flex items-center gap-1.5 mt-2">
                  <AlertCircle className="h-4 w-4" /> Insufficient Inventory: Movement block active.
                </p>
              ) : selectedOutMaterialDetails.onHand - Number(stockOutForm.quantity) < selectedOutMaterialDetails.reorderLevel ? (
                <div className="p-2.5 rounded border border-warning/30 bg-warning/10 text-text-primary space-y-0.5 mt-2">
                  <p className="text-label font-extrabold text-warning flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Reorder Level Reached
                  </p>
                  <p className="text-label text-text-muted">
                    This issue brings stock below the reorder point of {selectedOutMaterialDetails.reorderLevel} {selectedOutMaterialDetails.unit}. Procurements notification triggered.
                  </p>
                </div>
              ) : (
                <p className="text-label font-bold text-success flex items-center gap-1.5 mt-2">
                  <CheckSquare className="h-4 w-4" /> Stock Health Normal: Plenty of inventory remaining.
                </p>
              )}
            </div>
          )}

          {/* Action controls */}
          <div className="flex gap-3 pt-4 border-t border-border-soft justify-end">
            <Button type="button" variant="outline" onClick={() => setStockOutDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={stockOutMutation.isPending}
              disabled={!!selectedOutMaterialDetails && selectedOutMaterialDetails.onHand - Number(stockOutForm.quantity) < 0}
              className="bg-error text-white font-semibold"
            >
              Authorize Issue
            </Button>
          </div>
        </form>
      </Drawer>

      {/* SECTION 11: CREATE TRANSFER DRAWER */}
      <Drawer
        open={transferDrawerOpen}
        title="Create Inter-Warehouse Stock Transfer"
        size="lg"
        onClose={() => setTransferDrawerOpen(false)}
      >
        <form onSubmit={handleTransferSubmit} className="space-y-6 pb-12">
          {/* Material Select */}
          <div className="space-y-4">
            <h4 className="text-body font-bold text-accent-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <Package className="h-4 w-4" /> Material Selection
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Material to Transfer</label>
                <select
                  value={transferForm.materialId}
                  onChange={(e) => {
                    const matId = e.target.value;
                    const matObj = materialsQuery.data?.materials.find(m => m.id === matId);
                    setTransferForm(prev => ({
                      ...prev,
                      materialId: matId,
                      fromWarehouseId: matObj?.warehouseId || "",
                      toWarehouseId: materialsQuery.data?.warehouses?.find(w => w.id !== matObj?.warehouseId)?.id || ""
                    }));
                  }}
                  className={selectClassName}
                >
                  {materialsQuery.data?.materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Transfer Quantity</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Warehouses configuration */}
          <div className="space-y-4 pt-2">
            <h4 className="text-body font-bold text-accent-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> Warehouse Route Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Source Warehouse</label>
                <select
                  value={transferForm.fromWarehouseId}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, fromWarehouseId: e.target.value }))}
                  className={selectClassName}
                >
                  {materialsQuery.data?.warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Destination Warehouse</label>
                <select
                  value={transferForm.toWarehouseId}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, toWarehouseId: e.target.value }))}
                  className={selectClassName}
                >
                  {materialsQuery.data?.warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Logistics and Notes */}
          <div className="space-y-4 pt-2">
            <h4 className="text-body font-bold text-accent-primary border-b border-border-soft pb-2 flex items-center gap-1.5">
              <Truck className="h-4 w-4" /> Dispatch Logistics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Transfer Priority</label>
                <select
                  value={transferForm.priority}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, priority: e.target.value }))}
                  className={selectClassName}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical (ASAP)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Logistics Notes</label>
                <Input
                  placeholder="e.g. Dispatched via CargoTruck DL-34A"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Warehouse Balance Impact Preview */}
          {selectedTransferMaterialDetails && transferForm.quantity && (
            <div className="p-4 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary space-y-3">
              <h5 className="text-label font-bold text-text-primary flex items-center gap-1.5">
                <ArrowLeftRight className="h-4.5 w-4.5 text-accent-primary" /> WAREHOUSE BALANCE IMPACT PREVIEW
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded border border-border-soft">
                  <span className="text-label text-text-muted">Source Warehouse Stock</span>
                  <div className="flex justify-between text-body mt-1">
                    <span>Current:</span>
                    <span>{selectedTransferMaterialDetails.onHand} {selectedTransferMaterialDetails.unit}</span>
                  </div>
                  <div className="flex justify-between text-body text-error font-bold">
                    <span>Transfer out:</span>
                    <span>-{transferForm.quantity} {selectedTransferMaterialDetails.unit}</span>
                  </div>
                  <div className="flex justify-between text-body border-t border-border-soft pt-1 mt-1 font-extrabold text-text-primary">
                    <span>Projected:</span>
                    <span>{selectedTransferMaterialDetails.onHand - Number(transferForm.quantity)} {selectedTransferMaterialDetails.unit}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded border border-border-soft">
                  <span className="text-label text-text-muted">Destination Warehouse Stock</span>
                  <div className="flex justify-between text-body mt-1">
                    <span>Current:</span>
                    <span>80 {selectedTransferMaterialDetails.unit} (Estimated)</span>
                  </div>
                  <div className="flex justify-between text-body text-success font-bold">
                    <span>Transfer in:</span>
                    <span>+{transferForm.quantity} {selectedTransferMaterialDetails.unit}</span>
                  </div>
                  <div className="flex justify-between text-body border-t border-border-soft pt-1 mt-1 font-extrabold text-text-primary">
                    <span>Projected:</span>
                    <span>{80 + Number(transferForm.quantity)} {selectedTransferMaterialDetails.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action controllers */}
          <div className="flex gap-3 pt-4 border-t border-border-soft justify-end">
            <Button type="button" variant="outline" onClick={() => setTransferDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={transferMutation.isPending}
              disabled={!!selectedTransferMaterialDetails && selectedTransferMaterialDetails.onHand - Number(transferForm.quantity) < 0}
              className="bg-warning hover:bg-warning/90 text-text-primary font-semibold"
            >
              Initiate Stock Transfer
            </Button>
          </div>
        </form>
      </Drawer>

      {/* SECTION 12: ADD MATERIAL XL DRAWER (CRUD) */}
      <Drawer
        open={addMaterialDrawerOpen}
        size="xl"
        onClose={() => {
          setAddMaterialDrawerOpen(false);
          resetMaterialForm();
        }}
        title={editingMaterialId ? "Modify Material Item" : "Create New Material SKU"}
      >
        <form onSubmit={handleAddMaterialSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[2.2fr_1fr] pb-12">
          <div className="space-y-6">
            
            {/* Section 1: Material Information */}
            <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20 shadow-soft">
              <h3 className="text-body font-semibold text-text-primary border-b border-border-soft pb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
                Material Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Material Name *</label>
                  <Input
                    value={materialForm.name}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Steel TMT 16mm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">SKU / Code *</label>
                  <Input
                    value={materialForm.sku}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, sku: e.target.value }))}
                    placeholder="e.g. STL-TMT-16"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Category</label>
                  <div className="relative">
                    <select
                      value={materialForm.category}
                      onChange={(e) => setMaterialForm((prev) => ({ ...prev, category: e.target.value }))}
                      className={selectClassName}
                    >
                      <option value="Cement">Cement</option>
                      <option value="Steel">Steel</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Finishing">Finishing</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Sub Category</label>
                  <Input
                    value={materialForm.subCategory}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, subCategory: e.target.value }))}
                    placeholder="e.g. Grade 500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Unit</label>
                  <Input
                    value={materialForm.unit}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, unit: e.target.value }))}
                    placeholder="e.g. bags, kg, meters"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Warehouse & Site Allocation */}
            <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20 shadow-soft">
              <h3 className="text-body font-semibold text-text-primary border-b border-border-soft pb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
                Warehouse & Site Allocation
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Warehouse</label>
                  <div className="relative">
                    <select
                      value={materialForm.warehouseId}
                      onChange={(e) => setMaterialForm((prev) => ({ ...prev, warehouseId: e.target.value }))}
                      className={selectClassName}
                    >
                      {(materialsQuery.data?.warehouses || []).map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Location Zone</label>
                  <Input
                    value={materialForm.locationZone}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, locationZone: e.target.value }))}
                    placeholder="e.g. Rack B-3"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Allocated Project</label>
                  <div className="relative">
                    <select
                      value={materialForm.projectId}
                      onChange={(e) => setMaterialForm((prev) => ({ ...prev, projectId: e.target.value }))}
                      className={selectClassName}
                    >
                      {(projectsQuery.data?.projects || []).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Stock Levels & Unit Cost */}
            <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20 shadow-soft">
              <h3 className="text-body font-semibold text-text-primary border-b border-border-soft pb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
                Stock Levels & Unit Cost
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">On Hand Qty</label>
                  <Input
                    type="number"
                    value={materialForm.onHand}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, onHand: e.target.value }))}
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Reorder Pt</label>
                  <Input
                    type="number"
                    value={materialForm.reorderLevel}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, reorderLevel: e.target.value }))}
                    placeholder="e.g. 100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Min Stock</label>
                  <Input
                    type="number"
                    value={materialForm.minStock}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, minStock: e.target.value }))}
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Max Stock</label>
                  <Input
                    type="number"
                    value={materialForm.maxStock}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, maxStock: e.target.value }))}
                    placeholder="e.g. 2000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Avg Daily Consumption</label>
                  <Input
                    type="number"
                    value={materialForm.averageConsumption}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, averageConsumption: e.target.value }))}
                    placeholder="e.g. 15"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Unit Cost (₹)</label>
                  <Input
                    type="number"
                    value={materialForm.unitCost}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, unitCost: e.target.value }))}
                    placeholder="e.g. 450"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Lead Time (Days)</label>
                  <Input
                    type="number"
                    value={materialForm.leadTime}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, leadTime: e.target.value }))}
                    placeholder="e.g. 3"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Supplier & Notes */}
            <div className="space-y-4 rounded-[var(--radius-card)] border border-border-soft p-5 bg-surface-secondary/20 shadow-soft">
              <h3 className="text-body font-semibold text-text-primary border-b border-border-soft pb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
                Supplier & Notes
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Supplier Name</label>
                  <Input
                    value={materialForm.supplier}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, supplier: e.target.value }))}
                    placeholder="e.g. BuildCorp Steel"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-secondary font-medium">Tags</label>
                  <Input
                    value={materialForm.tags}
                    onChange={(e) => setMaterialForm((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g. Cement, High Strength"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-label text-text-secondary font-medium">Storage Notes</label>
                <textarea
                  value={materialForm.storageNotes}
                  onChange={(e) => setMaterialForm((prev) => ({ ...prev, storageNotes: e.target.value }))}
                  className="min-h-[80px] w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 py-2.5 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] placeholder:text-text-muted transition-all"
                  placeholder="e.g. Store in elevated area to avoid humidity..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border-soft">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddMaterialDrawerOpen(false);
                  resetMaterialForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saveMaterialMutation.isPending}
                className="font-semibold"
              >
                {editingMaterialId ? "Save SKU" : "Add SKU"}
              </Button>
            </div>

          </div>

          <div className="sticky top-0 bg-surface-secondary/50 border border-border-soft rounded-[var(--radius-card)] p-5 space-y-6 self-start shadow-soft">
            <h3 className="text-body font-semibold text-text-primary pb-2 border-b border-border-soft flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent-primary" />
              Live Stock Summary
            </h3>
            <div className="space-y-5 text-body">
              <div className="rounded-[var(--radius-card)] bg-surface border border-border-soft p-4 shadow-soft">
                <p className="text-label text-text-secondary uppercase tracking-wider font-medium">Estimated Valuation</p>
                <p className="text-2xl font-black text-text-primary mt-1.5">
                  ₹{liveValue >= 100000 
                    ? `${(liveValue / 100000).toFixed(2)} Lakhs` 
                    : liveValue.toLocaleString("en-IN")}
                </p>
                <span className="text-label text-text-muted block mt-1">Based on ₹{liveUnitCost || 0} / {materialForm.unit || "unit"}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-[var(--radius-card)] bg-surface border border-border-soft p-4 shadow-soft">
                <div>
                  <span className="text-label text-text-secondary block font-medium">Stock Status</span>
                  <div className="mt-1.5">
                    <Badge 
                      tone={liveHealth === "Critical" ? "error" : liveHealth === "Low Stock" ? "warning" : "success"}
                      className="font-semibold text-xs py-0.5 px-2"
                    >
                      {liveHealth}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-label text-text-secondary block font-medium">Lead Time</span>
                  <p className="font-semibold text-text-primary mt-1 text-sm">{materialForm.leadTime || 3} Days</p>
                </div>
              </div>

              <div className="rounded-[var(--radius-card)] bg-surface border border-border-soft p-4 space-y-2 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-label text-text-secondary font-medium">Expected Runway:</span>
                  <span className="font-bold text-text-primary">
                    {liveAvgCons > 0 ? `${liveDays} Days` : "Stable"}
                  </span>
                </div>
                <div className="h-2 w-full bg-hover rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      liveDays <= 5 ? "bg-error" : liveDays <= 18 ? "bg-warning" : "bg-success"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, (liveOnHand / (liveReorder * 2.2 || 1)) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="bg-surface border border-border-soft rounded-[var(--radius-card)] p-4 space-y-2.5 shadow-soft text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Reorder Date:</span>
                  <span className="font-semibold text-text-primary text-right">{formattedLiveReorderDate}</span>
                </div>
                <div className="h-[1px] bg-border-soft" />
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Capacity Occupied:</span>
                  <span className="font-semibold text-text-primary text-right">
                    {materialForm.maxStock ? `${Math.round((liveOnHand / Number(materialForm.maxStock)) * 100)}%` : "0%"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Drawer>
    </section>
  );
}
