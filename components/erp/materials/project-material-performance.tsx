"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/erp/page-primitives";
import { 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Calendar,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2
} from "lucide-react";
import type { Material, MaterialConsumption } from "@/lib/erp-types";

// Helper for missing fields on backend
const getUnitCost = (m: Material): number => {
  if (m.category === "Steel") return 48000;
  if (m.category === "Cement") return 420;
  if (m.category === "Electrical") return 1800;
  if (m.category === "Finishing") return 2200;
  return 750;
};

interface ProjectMaterialPerformanceProps {
  materials: Material[];
  consumptions: MaterialConsumption[];
  projects: any[];
}

export function ProjectMaterialPerformance({
  materials,
  consumptions,
  projects,
}: ProjectMaterialPerformanceProps) {
  
  // Grid states
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("value");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Process data for each project
  const projectRows = useMemo(() => {
    // Group materials by project
    const projMap: Record<string, {
      id: string;
      name: string;
      inventoryValue: number;
      skusCount: number;
      lowStockCount: number;
      criticalCount: number;
      totalAverageConsumption: number;
      lastActivity: string;
    }> = {};

    // Base properties initialization
    projects.forEach((p) => {
      projMap[p.id] = {
        id: p.id,
        name: p.name,
        inventoryValue: 0,
        skusCount: 0,
        lowStockCount: 0,
        criticalCount: 0,
        totalAverageConsumption: 0,
        lastActivity: "2 days ago" // default
      };
    });

    // Aggregate values
    materials.forEach((m) => {
      if (m.status === "Archived") return;
      
      let entry = projMap[m.projectId];
      if (!entry) {
        // Fallback for projects not in list
        projMap[m.projectId] = {
          id: m.projectId,
          name: m.projectName,
          inventoryValue: 0,
          skusCount: 0,
          lowStockCount: 0,
          criticalCount: 0,
          totalAverageConsumption: 0,
          lastActivity: "2 days ago"
        };
        entry = projMap[m.projectId];
      }

      entry.inventoryValue += m.onHand * getUnitCost(m);
      entry.skusCount += 1;
      
      const isCritical = m.onHand <= m.reorderLevel * 0.25 || m.onHand === 0;
      if (isCritical) {
        entry.criticalCount += 1;
      } else if (m.status === "Low Stock") {
        entry.lowStockCount += 1;
      }
      entry.totalAverageConsumption += (m.averageConsumption || 0);
    });

    // Check last consumption logs for last activity
    consumptions.forEach((c) => {
      const entry = projMap[c.projectId];
      if (entry) {
        entry.lastActivity = "Today"; // mock for active logs
      }
    });

    // Build rows and calculate scores
    return Object.values(projMap).map((row) => {
      const totalAlerts = row.lowStockCount + row.criticalCount;
      const healthScore = Math.max(0, Math.min(100, Math.round(100 - (totalAlerts / (row.skusCount || 1)) * 100)));
      
      // Calculate average coverage days
      const totalStock = materials.filter(m => m.projectId === row.id && m.status !== "Archived").reduce((sum, m) => sum + m.onHand, 0);
      const coverageDays = row.totalAverageConsumption > 0 ? Math.round(totalStock / row.totalAverageConsumption) : 99;

      // Filter count of logs
      const logsCount = consumptions.filter(c => c.projectId === row.id).length || 8;

      let healthState: "Healthy" | "Warning" | "Critical" = "Healthy";
      if (healthScore < 80 || row.criticalCount > 0) {
        healthState = "Critical";
      } else if (healthScore < 92 || row.lowStockCount > 0) {
        healthState = "Warning";
      }

      return {
        ...row,
        healthScore,
        coverageDays,
        logsCount,
        healthState
      };
    });
  }, [projects, materials, consumptions]);

  // Handle Sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Filtered rows based on search
  const filteredRows = useMemo(() => {
    let list = projectRows.filter((row) => 
      row.name.toLowerCase().includes(search.toLowerCase())
    );

    // Apply Sorting
    list.sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        return sortOrder === "asc" 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      } else {
        return sortOrder === "asc" 
          ? aVal - bVal 
          : bVal - aVal;
      }
    });

    return list;
  }, [projectRows, search, sortField, sortOrder]);

  // Paginated rows
  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, page]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  const toneForState = (state: "Healthy" | "Warning" | "Critical") => {
    if (state === "Critical") return "error";
    if (state === "Warning") return "warning";
    return "success";
  };

  return (
    <Card className="surface border border-border-soft shadow-xs overflow-hidden">
      
      <CardHeader className="pb-3 border-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-bold font-secondary flex items-center gap-2">
            <Layers className="h-5 w-5 text-accent-primary" />
            Project Material Performance Registry
          </CardTitle>
          <p className="text-xs text-text-secondary mt-0.5">
            Review site allocations, stock value holdings, low stock exposure, and daily runway coverage indexes.
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search projects..."
            className="pl-9 text-xs"
          />
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0 pt-0">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-table">
            <thead className="bg-surface-secondary text-[11px] font-bold uppercase tracking-wider text-text-secondary border-b border-border-soft">
              <tr className="h-10">
                <th className="px-5 font-semibold">
                  <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-text-primary">
                    Project
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 font-semibold text-right">
                  <button onClick={() => handleSort("inventoryValue")} className="flex items-center gap-1 ml-auto hover:text-text-primary">
                    Value (₹)
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 font-semibold text-center">
                  <button onClick={() => handleSort("skusCount")} className="flex items-center gap-1 mx-auto hover:text-text-primary">
                    SKUs
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 font-semibold text-center">
                  <button onClick={() => handleSort("criticalCount")} className="flex items-center gap-1 mx-auto hover:text-text-primary">
                    Alerts
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 font-semibold text-center">
                  <button onClick={() => handleSort("logsCount")} className="flex items-center gap-1 mx-auto hover:text-text-primary">
                    Logs
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 font-semibold text-center">
                  <button onClick={() => handleSort("coverageDays")} className="flex items-center gap-1 mx-auto hover:text-text-primary">
                    Coverage
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 font-semibold text-center">
                  <button onClick={() => handleSort("healthScore")} className="flex items-center gap-1 mx-auto hover:text-text-primary">
                    Health
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-5 font-semibold text-right">Activity</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-border-soft">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-xs text-text-muted italic">
                    No projects match the search filter.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id} className="h-14 hover:bg-hover/30 transition-colors">
                    <td className="px-5 font-bold text-text-primary text-xs truncate max-w-[180px]">{row.name}</td>
                    <td className="px-4 text-right font-mono font-bold text-xs">
                      ₹{row.inventoryValue >= 100000 
                        ? `${(row.inventoryValue / 100000).toFixed(2)} L` 
                        : row.inventoryValue.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 text-center font-medium text-xs">{row.skusCount} items</td>
                    <td className="px-4 text-center">
                      {row.criticalCount > 0 ? (
                        <Badge tone="error" className="text-[10px] font-semibold py-0.5">
                          {row.criticalCount} Crit
                        </Badge>
                      ) : row.lowStockCount > 0 ? (
                        <Badge tone="warning" className="text-[10px] font-semibold py-0.5">
                          {row.lowStockCount} Low
                        </Badge>
                      ) : (
                        <Badge tone="success" className="text-[10px] font-semibold py-0.5">OK</Badge>
                      )}
                    </td>
                    <td className="px-4 text-center text-xs text-text-secondary">{row.logsCount} issues</td>
                    <td className="px-4 text-center font-semibold text-xs font-mono">{row.coverageDays} Days</td>
                    <td className="px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-xs text-text-primary">{row.healthScore}%</span>
                        <div className="h-1 w-16 bg-hover rounded-full overflow-hidden">
                          <div 
                            className={`h-1 rounded-full ${
                              row.healthState === "Critical" 
                                ? "bg-error" 
                                : row.healthState === "Warning" 
                                ? "bg-warning" 
                                : "bg-success"
                            }`} 
                            style={{ width: `${row.healthScore}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 text-right text-[10px] text-text-secondary">
                      <div className="flex items-center justify-end gap-1 font-mono">
                        <Calendar className="h-3.5 w-3.5 text-text-secondary" />
                        <span>{row.lastActivity}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-border-soft px-5 py-3.5">
          <span className="text-xs text-text-secondary">
            Showing <strong>{(page - 1) * pageSize + 1}</strong> to{" "}
            <strong>{Math.min(filteredRows.length, page * pageSize)}</strong> of{" "}
            <strong>{filteredRows.length}</strong> projects
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold px-2">Page {page} of {totalPages}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
