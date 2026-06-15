"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Calendar,
  Layers,
  Building2,
  AlertTriangle,
  History,
  CheckCircle2
} from "lucide-react";
import type { Material, MaterialConsumption, Warehouse } from "@/lib/erp-types";

// Helper for missing fields on backend
const getUnitCost = (m: Material): number => {
  if (m.category === "Steel") return 48000;
  if (m.category === "Cement") return 420;
  if (m.category === "Electrical") return 1800;
  if (m.category === "Finishing") return 2200;
  return 750;
};

interface ReportingHubProps {
  materials: Material[];
  consumptions: MaterialConsumption[];
  warehouses: Warehouse[];
  projects: any[];
}

export function ReportingHub({
  materials,
  consumptions,
  warehouses,
  projects,
}: ReportingHubProps) {
  
  // Date/Time when reports were "generated"
  const [lastGeneratedTimes, setLastGeneratedTimes] = useState<Record<string, string>>({
    summary: "Today, 10:15 AM",
    consumption: "Today, 10:15 AM",
    warehouse: "Today, 10:15 AM",
    project: "Today, 09:40 AM",
    critical: "Today, 11:05 AM"
  });

  const [downloading, setDownloading] = useState<string | null>(null);

  // Helper to trigger in-browser CSV download
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (reportId: string, format: "pdf" | "xlsx" | "csv") => {
    const key = `${reportId}-${format}`;
    setDownloading(key);
    
    // Simulate generation delay
    setTimeout(() => {
      setDownloading(null);
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
      const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      setLastGeneratedTimes(prev => ({
        ...prev,
        [reportId]: `Just now (${dateStr}, ${timeStr})`
      }));

      // Generate actual tabular dataset based on selected report
      if (reportId === "summary") {
        const headers = ["SKU", "Material", "Category", "Warehouse", "Project", "On Hand", "Reorder Level", "Unit", "Status"];
        const rows = materials.map(m => [
          m.sku, m.name, m.category, m.warehouseName, m.projectName, 
          String(m.onHand), String(m.reorderLevel), m.unit, m.status
        ]);
        downloadCSV(`material_inventory_summary_${format}.csv`, headers, rows);
      } 
      else if (reportId === "consumption") {
        const headers = ["Material Name", "Project", "Quantity Consumed", "Unit", "Consumed On", "Recorded By", "Purpose"];
        const rows = consumptions.map(c => [
          c.materialName, c.projectName, String(c.quantity), c.unit, 
          c.consumedOn, c.recordedByName, c.purpose
        ]);
        downloadCSV(`material_consumption_analysis_${format}.csv`, headers, rows);
      } 
      else if (reportId === "warehouse") {
        const headers = ["Warehouse Name", "Location", "Materials Stored Count", "Capacity Utilization (%)", "Status"];
        const rows = warehouses.map(w => {
          const count = materials.filter(m => m.warehouseId === w.id).length;
          return [w.name, w.location, String(count), String(w.capacityUtilization), w.status];
        });
        downloadCSV(`warehouse_inventory_health_${format}.csv`, headers, rows);
      } 
      else if (reportId === "project") {
        const headers = ["Project Name", "SKUs Allocated", "Inventory Value (₹)", "Coverage Days runway"];
        const rows = projects.map(p => {
          const projMaterials = materials.filter(m => m.projectId === p.id);
          const val = projMaterials.reduce((sum, m) => sum + m.onHand * getUnitCost(m), 0);
          const totalStock = projMaterials.reduce((sum, m) => sum + m.onHand, 0);
          const totalCons = projMaterials.reduce((sum, m) => sum + (m.averageConsumption || 0), 0);
          const coverage = totalCons > 0 ? Math.round(totalStock / totalCons) : 0;
          return [p.name, String(projMaterials.length), String(val), String(coverage)];
        });
        downloadCSV(`project_material_allocations_${format}.csv`, headers, rows);
      } 
      else if (reportId === "critical") {
        const headers = ["SKU", "Material", "Category", "Warehouse", "Project", "On Hand", "Reorder Level", "Unit", "Deficit"];
        const criticalList = materials.filter(m => m.onHand <= m.reorderLevel);
        const rows = criticalList.map(m => [
          m.sku, m.name, m.category, m.warehouseName, m.projectName, 
          String(m.onHand), String(m.reorderLevel), m.unit, String(m.reorderLevel - m.onHand)
        ]);
        downloadCSV(`critical_materials_sourcing_${format}.csv`, headers, rows);
      }

    }, 800);
  };

  const reports = [
    {
      id: "summary",
      title: "Inventory Summary Report",
      description: "Aggregate index of on-hand levels, warehouse storage locations, supplier mappings, and catalog listings.",
      icon: FileText,
      tone: "info"
    },
    {
      id: "consumption",
      title: "Consumption Analysis Report",
      description: "Detailed breakdown of issued stock, construction site burn rates, purpose mappings, and date logs.",
      icon: FileSpreadsheet,
      tone: "success"
    },
    {
      id: "warehouse",
      title: "Warehouse Health Report",
      description: "Capacity utilization telemetry, supervisor assignments, safety levels, and specific warehouse inventory value ratios.",
      icon: Building2,
      tone: "info"
    },
    {
      id: "project",
      title: "Project Inventory Report",
      description: "Asset valuations holding at project sites, low-stock warnings exposure, and project materials velocity.",
      icon: Layers,
      tone: "neutral"
    },
    {
      id: "critical",
      title: "Critical Material Report",
      description: "Immediate action report displaying materials below reorder threshold, deficits list, and urgent reorders.",
      icon: AlertTriangle,
      tone: "error"
    }
  ];

  return (
    <Card className="surface border border-border-soft shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold font-secondary flex items-center gap-2">
              <Download className="h-5 w-5 text-accent-primary" />
              Intelligence Reporting Hub
            </CardTitle>
            <p className="text-xs text-text-secondary mt-0.5">
              Export generated analytics, site registers, and critical threshold lists to PDF, Excel, or CSV spreadsheets.
            </p>
          </div>
          <Badge tone="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Reporting Systems Operational
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 border-t border-border-soft/60">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((rep) => {
            const Icon = rep.icon;
            let themeClass = "border-l-accent-primary";
            if (rep.id === "critical") themeClass = "border-l-error";
            if (rep.id === "consumption") themeClass = "border-l-success";

            return (
              <Card key={rep.id} className={`surface border border-border-soft border-l-4 ${themeClass} flex flex-col justify-between hover:shadow-md transition-shadow`}>
                <CardContent className="p-4 space-y-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-surface-secondary flex items-center justify-center">
                          <Icon className="h-4 w-4 text-text-primary" />
                        </div>
                        <h4 className="font-bold text-xs text-text-primary">{rep.title}</h4>
                      </div>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-normal">
                      {rep.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Timestamp log */}
                    <div className="flex items-center justify-between text-[10px] text-text-secondary font-mono bg-surface-secondary/70 p-1.5 rounded-md">
                      <span className="flex items-center gap-1">
                        <History className="h-3 w-3" />
                        Last generated:
                      </span>
                      <span className="font-semibold">{lastGeneratedTimes[rep.id]}</span>
                    </div>

                    {/* Export Action Buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] py-1 border-border-soft hover:bg-white font-semibold"
                        onClick={() => handleExport(rep.id, "pdf")}
                        disabled={downloading !== null}
                      >
                        {downloading === `${rep.id}-pdf` ? "..." : "PDF"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] py-1 border-border-soft hover:bg-white font-semibold"
                        onClick={() => handleExport(rep.id, "xlsx")}
                        disabled={downloading !== null}
                      >
                        {downloading === `${rep.id}-xlsx` ? "..." : "Excel"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] py-1 border-border-soft hover:bg-white font-semibold"
                        onClick={() => handleExport(rep.id, "csv")}
                        disabled={downloading !== null}
                      >
                        {downloading === `${rep.id}-csv` ? "..." : "CSV"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
