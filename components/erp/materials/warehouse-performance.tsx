"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { Building2, AlertTriangle, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import type { Material, MaterialConsumption, Warehouse } from "@/lib/erp-types";

// Helper for missing fields on backend
const getUnitCost = (m: Material): number => {
  if (m.category === "Steel") return 48000;
  if (m.category === "Cement") return 420;
  if (m.category === "Electrical") return 1800;
  if (m.category === "Finishing") return 2200;
  return 750;
};

// Mini Sparkline component
function MiniWarehouseSparkline({ values, color = "#2563eb" }: { values: number[]; color?: string }) {
  const data = values.map((val, idx) => ({ idx, val }));
  const sparkId = React.useId().replace(/:/g, "");
  return (
    <div className="h-6 w-14">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Area
            type="monotone"
            dataKey="val"
            stroke={color}
            strokeWidth={1}
            dot={false}
            fill={color}
            fillOpacity={0.05}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface WarehousePerformanceProps {
  warehouses: Warehouse[];
  materials: Material[];
  consumptions: MaterialConsumption[];
  selectedWarehouseId: string | null;
  onSelectWarehouse: (id: string | null) => void;
}

export function WarehousePerformance({
  warehouses,
  materials,
  consumptions,
  selectedWarehouseId,
  onSelectWarehouse,
}: WarehousePerformanceProps) {

  const warehouseStats = useMemo(() => {
    return warehouses.map((wh, index) => {
      const whMaterials = materials.filter(m => m.warehouseId === wh.id && m.status !== "Archived");
      
      const totalValue = whMaterials.reduce((sum, m) => sum + m.onHand * getUnitCost(m), 0);
      const materialsCount = whMaterials.length;
      
      const criticalCount = whMaterials.filter(m => m.onHand <= m.reorderLevel * 0.25 || m.onHand === 0).length;
      const lowStockCount = whMaterials.filter(m => m.status === "Low Stock" && m.onHand > m.reorderLevel * 0.25).length;
      const totalAlerts = criticalCount + lowStockCount;

      const healthScore = Math.max(0, Math.min(100, Math.round(100 - (totalAlerts / (materialsCount || 1)) * 100)));
      
      // Calculate consumption velocity (sum of quantities consumed in this warehouse)
      const whConsumptions = consumptions.filter(c => 
        whMaterials.some(m => m.id === c.materialId)
      );
      const consumptionVelocity = whConsumptions.reduce((sum, c) => sum + c.quantity, 0);

      // Generate sparklines based on deterministic seed
      const seedVal = (index * 13 + 5) % 11;
      const sparkValues = [15 + seedVal, 18 + seedVal, 16 + seedVal, 20 + seedVal, 22 + seedVal, 21 + seedVal, Math.min(30, 15 + (consumptionVelocity % 15))];

      return {
        ...wh,
        totalValue,
        materialsCount,
        criticalCount,
        lowStockCount,
        healthScore,
        consumptionVelocity,
        sparkValues
      };
    });
  }, [warehouses, materials, consumptions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-secondary text-text-primary">Warehouse Performance Center</h2>
          <p className="text-xs text-text-secondary">Track capacity utilization, inventory values, and critical thresholds across distribution centers.</p>
        </div>
        {selectedWarehouseId && (
          <Badge 
            tone="info" 
            className="cursor-pointer hover:bg-hover transition-colors"
            onClick={() => onSelectWarehouse(null)}
          >
            Clear Filter ✕
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouseStats.map((wh) => {
          const isSelected = selectedWarehouseId === wh.id;
          const isCrit = wh.healthScore < 80;
          const tone = isCrit ? "error" : wh.healthScore < 92 ? "warning" : "success";
          const sparkColor = isCrit ? "#ef4444" : wh.healthScore < 92 ? "#f59e0b" : "#22c55e";

          return (
            <Card 
              key={wh.id}
              onClick={() => onSelectWarehouse(isSelected ? null : wh.id)}
              className={`surface cursor-pointer border hover:shadow-md transition-all duration-200 ${
                isSelected 
                  ? "border-accent-primary ring-2 ring-accent-primary/20 scale-[1.02]" 
                  : "border-border-soft"
              }`}
            >
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-text-secondary font-mono uppercase tracking-wider">{wh.code || "WH-LOC"}</span>
                  <CardTitle className="text-sm font-bold font-secondary text-text-primary truncate max-w-[150px]">{wh.name}</CardTitle>
                </div>
                <Badge tone={tone} className="text-[10px] font-mono">{wh.healthScore}% Health</Badge>
              </CardHeader>
              
              <CardContent className="space-y-3 pt-0">
                {/* Inventory Value & Sparkline */}
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase">Valuation</span>
                    <p className="text-base font-extrabold text-text-primary">
                      ₹{(wh.totalValue / 100000).toFixed(1)} Lakhs
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] text-text-secondary">Consumption Vol</span>
                    <MiniWarehouseSparkline values={wh.sparkValues} color={sparkColor} />
                  </div>
                </div>

                {/* Materials Count & Alerts count */}
                <div className="grid grid-cols-2 gap-2 border-t border-border-soft/60 pt-2 text-xs">
                  <div>
                    <span className="text-text-secondary">SKUs Stored:</span>
                    <p className="font-semibold text-text-primary">{wh.materialsCount}</p>
                  </div>
                  <div>
                    <span className="text-text-secondary">Alerts:</span>
                    <p className="font-semibold flex items-center gap-1.5">
                      {wh.criticalCount > 0 ? (
                        <span className="text-error font-bold flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          {wh.criticalCount} Crit
                        </span>
                      ) : wh.lowStockCount > 0 ? (
                        <span className="text-warning font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {wh.lowStockCount} Low
                        </span>
                      ) : (
                        <span className="text-success font-semibold">Healthy</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Capacity Utilization Progress */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-text-secondary">
                    <span>Capacity Utilization:</span>
                    <span className="font-semibold text-text-primary">{wh.capacityUtilization}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-hover rounded-full overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${
                        wh.capacityUtilization > 90 
                          ? "bg-error animate-pulse" 
                          : wh.capacityUtilization > 75 
                          ? "bg-warning" 
                          : "bg-success"
                      }`} 
                      style={{ width: `${wh.capacityUtilization}%` }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
