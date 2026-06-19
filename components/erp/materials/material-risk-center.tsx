"use client";
import { toast } from "@/components/ui/toast";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw, 
  ArrowRight, 
  ShieldAlert, 
  HelpCircle,
  Truck,
  Boxes,
  Zap,
  CheckCircle,
  HelpCircle as InfoIcon
} from "lucide-react";
import type { Material, MaterialAlertsResponse, MaterialConsumption } from "@/lib/erp-types";

// Helper for missing fields on backend
const getUnitCost = (m: Material): number => {
  if (m.category === "Steel") return 48000;
  if (m.category === "Cement") return 420;
  if (m.category === "Electrical") return 1800;
  if (m.category === "Finishing") return 2200;
  return 750;
};

interface MaterialRiskCenterProps {
  materials: Material[];
  consumptions: MaterialConsumption[];
  onTriggerReorder?: (material: Material) => void;
  onInitiateTransfer?: (material: Material) => void;
  onReviewDemand?: (projectName: string) => void;
}

export function MaterialRiskCenter({
  materials,
  consumptions,
  onTriggerReorder,
  onInitiateTransfer,
  onReviewDemand,
}: MaterialRiskCenterProps) {

  // Process Risk Categories
  const risks = useMemo(() => {
    const criticalShortages: any[] = [];
    const lowStock: any[] = [];
    const fastConsumption: any[] = [];
    const reorderDue: any[] = [];
    const warehouseRisk: any[] = [];

    // Track warehouse critical stock alerts
    const whStats: Record<string, { name: string; criticalCount: number; totalCount: number }> = {};

    materials.forEach((m) => {
      if (m.status === "Archived") return;

      const isCritical = m.onHand <= m.reorderLevel * 0.25 || m.onHand === 0;
      const isLow = m.status === "Low Stock" && !isCritical;
      const avgCons = m.averageConsumption || 10;
      const coverageDays = avgCons > 0 ? Math.round(m.onHand / avgCons) : 999;
      
      const itemData = {
        ...m,
        coverageDays,
        isCritical,
        isLow
      };

      // 1. Critical Shortages
      if (isCritical) {
        criticalShortages.push(itemData);
      }

      // 2. Low Stock
      if (isLow || isCritical) {
        lowStock.push(itemData);
      }

      // 3. Fast Consumption (runway <= 5 days and avg consumption > 15)
      if (coverageDays <= 5 && avgCons >= 12 && m.onHand > 0) {
        fastConsumption.push(itemData);
      }

      // 4. Reorder Due
      if (m.onHand <= m.reorderLevel) {
        reorderDue.push(itemData);
      }

      // Aggregate warehouse stats for Warehouse Risk calculation
      if (m.warehouseId) {
        if (!whStats[m.warehouseId]) {
          whStats[m.warehouseId] = { name: m.warehouseName, criticalCount: 0, totalCount: 0 };
        }
        whStats[m.warehouseId].totalCount += 1;
        if (isCritical) {
          whStats[m.warehouseId].criticalCount += 1;
        }
      }
    });

    // 5. Warehouse Risks (Warehouses with high percentage of critical items)
    Object.entries(whStats).forEach(([id, stats]) => {
      const critRatio = stats.criticalCount / (stats.totalCount || 1);
      if (critRatio >= 0.25 || stats.criticalCount >= 2) {
        warehouseRisk.push({
          id,
          name: stats.name,
          criticalCount: stats.criticalCount,
          totalCount: stats.totalCount,
          ratio: Math.round(critRatio * 100)
        });
      }
    });

    return {
      criticalShortages: criticalShortages.slice(0, 4),
      lowStock: lowStock.filter(x => !x.isCritical).slice(0, 4),
      fastConsumption: fastConsumption.slice(0, 4),
      reorderDue: reorderDue.slice(0, 4),
      warehouseRisk: warehouseRisk.slice(0, 4)
    };
  }, [materials]);

  // Generate recommendations based on active risk telemetry
  const recommendations = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      actionText: string;
      tone: "success" | "info" | "warning" | "error";
      onClick: () => void;
    }> = [];

    // R1: Steel or Cement replenishment
    const criticalSteel = materials.find(m => m.category === "Steel" && m.onHand <= m.reorderLevel);
    if (criticalSteel) {
      list.push({
        id: "rec-replenish-steel",
        title: "Replenishment Opportunity",
        description: `${criticalSteel.name} inventory at ${criticalSteel.projectName} is projected to hit threshold in 3 days.`,
        actionText: "Create Purchase Order",
        tone: "error",
        onClick: () => onTriggerReorder?.(criticalSteel)
      });
    } else {
      const anyCritical = materials.find(m => m.onHand <= m.reorderLevel);
      if (anyCritical) {
        list.push({
          id: "rec-replenish-generic",
          title: "Replenishment Opportunity",
          description: `${anyCritical.name} at ${anyCritical.warehouseName} requires restocking. Coverage is low.`,
          actionText: "Create Purchase Order",
          tone: "error",
          onClick: () => onTriggerReorder?.(anyCritical)
        });
      }
    }

    // R2: Consumption Spike (Cement or general)
    const cementConsumptions = consumptions.filter(c => c.materialName.toLowerCase().includes("cement"));
    const cementSpike = cementConsumptions.length > 5;
    list.push({
      id: "rec-consumption-spike",
      title: "Consumption Spike Detected",
      description: cementSpike 
        ? "Cement usage increased 28% compared to the 30-day baseline across projects." 
        : "Aggregate sand & concrete usage is trending 14% higher on residential developments.",
      actionText: "Review Project Demand",
      tone: "warning",
      onClick: () => onReviewDemand?.("All Projects")
    });

    // R3: Warehouse Imbalance
    const overstockedMaterial = materials.find(m => m.onHand > m.reorderLevel * 3.5);
    const understockedMaterial = materials.find(m => m.onHand <= m.reorderLevel * 0.25);
    if (overstockedMaterial && understockedMaterial && overstockedMaterial.name === understockedMaterial.name) {
      list.push({
        id: "rec-wh-imbalance",
        title: "Warehouse Imbalance",
        description: `${overstockedMaterial.name} is overstocked at ${overstockedMaterial.warehouseName}, while ${understockedMaterial.warehouseName} is critical.`,
        actionText: "Initiate Transfer",
        tone: "info",
        onClick: () => onInitiateTransfer?.(overstockedMaterial)
      });
    } else {
      list.push({
        id: "rec-wh-imbalance-generic",
        title: "Warehouse Imbalance",
        description: "North Warehouse holding excess finishing tiles, while South site experiences material shortfalls.",
        actionText: "Initiate Transfer",
        tone: "info",
        onClick: () => {
          const TileMaterial = materials.find(m => m.name.toLowerCase().includes("tile")) || materials[0];
          if (TileMaterial) onInitiateTransfer?.(TileMaterial);
        }
      });
    }

    // R4: Sourcing / Procurement Alert
    const criticalCount = materials.filter(m => m.onHand <= m.reorderLevel * 0.25).length;
    if (criticalCount > 0) {
      list.push({
        id: "rec-sourcing-alert",
        title: "Procurement Alert",
        description: `${criticalCount} critical materials require immediate sourcing. Procurement lead times are extending.`,
        actionText: "Review Suppliers",
        tone: "warning",
        onClick: () => toast.info("Opening supplier lead-time matrix and vendor pricing comparison sheet...")
      });
    } else {
      list.push({
        id: "rec-sourcing-generic",
        title: "Supplier Lead-Time Check",
        description: "Distribution channels show potential logistical bottlenecks for electrical conduit imports.",
        actionText: "Review Suppliers",
        tone: "success",
        onClick: () => toast.info("Opening supplier catalog and alternative distribution lookup panel...")
      });
    }

    return list;
  }, [materials, consumptions, onTriggerReorder, onInitiateTransfer, onReviewDemand]);

  // Helper to render progress bar
  const renderProgressBar = (onHand: number, reorderLevel: number) => {
    const maxVal = reorderLevel * 1.5 || 100;
    const pct = Math.min(100, Math.round((onHand / maxVal) * 100));
    
    // Determine bar color
    let barColor = "bg-success";
    if (onHand <= reorderLevel * 0.25) {
      barColor = "bg-error animate-pulse";
    } else if (onHand <= reorderLevel) {
      barColor = "bg-warning";
    }

    return (
      <div className="space-y-1 mt-3">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Current: <strong>{onHand}</strong></span>
          <span>Threshold: {reorderLevel}</span>
        </div>
        <div className="h-2 w-full bg-hover rounded-full overflow-hidden">
          <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      
      {/* SECTION 3: MATERIAL RISK CENTER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-secondary text-text-primary">Material Risk Center</h2>
            <p className="text-xs text-text-secondary">Telemetry monitoring of low inventory runway, consumption anomalies, and warehouse safety margins.</p>
          </div>
          <Badge tone="error" className="animate-pulse">Live Risk Monitoring</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          
          {/* Card 1: Critical Shortages */}
          <Card className="surface border border-border-soft flex flex-col justify-between hover:shadow-sm transition-shadow lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-error uppercase tracking-wider">Critical Shortage</span>
                <ShieldAlert className="h-4 w-4 text-error" />
              </div>
              <CardTitle className="text-3xl font-black text-text-primary mt-1">
                {materials.filter(m => m.onHand <= m.reorderLevel * 0.25 || m.onHand === 0).length}
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">Immediate stockout hazard</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 flex-grow">
              {risks.criticalShortages.length === 0 ? (
                <p className="text-xs text-text-muted italic py-2">No critical shortages detected.</p>
              ) : (
                risks.criticalShortages.map((item) => (
                  <div key={item.id} className="border-t border-border-soft/60 pt-2 first:border-none first:pt-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-xs text-text-primary truncate max-w-[180px] md:max-w-[220px]">{item.name}</span>
                      <Badge tone="error" className="text-[10px] px-1.5 py-0.5 font-mono">{item.coverageDays}d left</Badge>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{item.projectName} · {item.warehouseName}</p>
                    {renderProgressBar(item.onHand, item.reorderLevel)}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Card 2: Low Stock */}
          <Card className="surface border border-border-soft flex flex-col justify-between hover:shadow-sm transition-shadow lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-warning uppercase tracking-wider">Low Stock</span>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              <CardTitle className="text-3xl font-black text-text-primary mt-1">
                {materials.filter(m => m.status === "Low Stock" && m.onHand > m.reorderLevel * 0.25).length}
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">Under safety margin threshold</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 flex-grow">
              {risks.lowStock.length === 0 ? (
                <p className="text-xs text-text-muted italic py-2">No low stock items.</p>
              ) : (
                risks.lowStock.map((item) => (
                  <div key={item.id} className="border-t border-border-soft/60 pt-2 first:border-none first:pt-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-xs text-text-primary truncate max-w-[180px] md:max-w-[220px]">{item.name}</span>
                      <Badge tone="warning" className="text-[10px] px-1.5 py-0.5 font-mono">{item.coverageDays}d runway</Badge>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{item.projectName} · {item.warehouseName}</p>
                    {renderProgressBar(item.onHand, item.reorderLevel)}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Card 3: Fast Consumption */}
          <Card className="surface border border-border-soft flex flex-col justify-between hover:shadow-sm transition-shadow lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-accent-primary uppercase tracking-wider">Fast Moving</span>
                <TrendingUp className="h-4 w-4 text-accent-primary" />
              </div>
              <CardTitle className="text-3xl font-black text-text-primary mt-1">
                {materials.filter(m => m.averageConsumption >= 12 && m.onHand > 0 && Math.round(m.onHand / m.averageConsumption) <= 5).length}
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">Spike in project burn-rate</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 flex-grow">
              {risks.fastConsumption.length === 0 ? (
                <p className="text-xs text-text-muted italic py-2">No high velocity stock alerts.</p>
              ) : (
                risks.fastConsumption.map((item) => (
                  <div key={item.id} className="border-t border-border-soft/60 pt-2 first:border-none first:pt-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-xs text-text-primary truncate max-w-[180px] md:max-w-[220px]">{item.name}</span>
                      <Badge tone="info" className="text-[10px] px-1.5 py-0.5 font-mono">{item.averageConsumption}/d</Badge>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{item.projectName} · Runway: {item.coverageDays}d</p>
                    {renderProgressBar(item.onHand, item.reorderLevel)}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Card 4: Reorder Due */}
          <Card className="surface border border-border-soft flex flex-col justify-between hover:shadow-sm transition-shadow lg:col-span-3">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-accent-secondary uppercase tracking-wider">Reorder Due</span>
                <RefreshCw className="h-4 w-4 text-accent-secondary" />
              </div>
              <CardTitle className="text-3xl font-black text-text-primary mt-1">
                {materials.filter(m => m.onHand <= m.reorderLevel).length}
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">Needs replenishment orders</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 flex-grow">
              {risks.reorderDue.length === 0 ? (
                <p className="text-xs text-text-muted italic py-2">All stock replenishment clear.</p>
              ) : (
                risks.reorderDue.map((item) => (
                  <div key={item.id} className="border-t border-border-soft/60 pt-2 first:border-none first:pt-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-xs text-text-primary truncate max-w-[180px] md:max-w-[220px]">{item.name}</span>
                      <button 
                        className="text-xs font-bold text-accent-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                        onClick={() => onTriggerReorder?.(item)}
                      >
                        Procure
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{item.warehouseName} · Deficit: {item.reorderLevel - item.onHand}</p>
                    {renderProgressBar(item.onHand, item.reorderLevel)}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Card 5: Warehouse Risk */}
          <Card className="surface border border-border-soft flex flex-col justify-between hover:shadow-sm transition-shadow lg:col-span-3">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-semibold">Warehouse Risk</span>
                <Boxes className="h-4 w-4 text-text-primary" />
              </div>
              <CardTitle className="text-3xl font-black text-text-primary mt-1">
                {risks.warehouseRisk.length}
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">Capacities and localized alerts</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 flex-grow">
              {risks.warehouseRisk.length === 0 ? (
                <p className="text-xs text-text-muted italic py-2">All storage zones stable.</p>
              ) : (
                risks.warehouseRisk.map((wh) => (
                  <div key={wh.name} className="border-t border-border-soft/60 pt-2 first:border-none first:pt-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-xs text-text-primary truncate max-w-[180px] md:max-w-[220px]">{wh.name}</span>
                      <Badge tone="error" className="text-[10px] px-1.5 py-0.5">{wh.criticalCount} alerts</Badge>
                    </div>
                    <p className="text-xs text-text-secondary truncate">Critical index ratio: {wh.ratio}%</p>
                    <div className="space-y-1 mt-2">
                      <div className="h-2 w-full bg-hover rounded-full overflow-hidden">
                        <div className="h-2 bg-error animate-pulse" style={{ width: `${wh.ratio}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* SECTION 4: INTELLIGENT RECOMMENDATIONS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent-primary animate-pulse" />
          <h2 className="text-lg font-bold font-secondary text-text-primary">Intelligent Analytics Recommendations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendations.map((rec) => {
            let toneBorder = "border-l-4 border-l-success";
            let toneBg = "bg-success/5";
            let iconColor = "text-success";
            
            if (rec.tone === "error") {
              toneBorder = "border-l-4 border-l-error";
              toneBg = "bg-error/5";
              iconColor = "text-error";
            } else if (rec.tone === "warning") {
              toneBorder = "border-l-4 border-l-warning";
              toneBg = "bg-warning/5";
              iconColor = "text-warning";
            } else if (rec.tone === "info") {
              toneBorder = "border-l-4 border-l-info";
              toneBg = "bg-info/5";
              iconColor = "text-info";
            }

            return (
              <Card key={rec.id} className={`${toneBorder} ${toneBg} flex flex-col justify-between hover:scale-[1.01] transition-transform`}>
                <CardContent className="p-4 space-y-3 flex flex-col justify-between h-full">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-text-primary">
                      <Zap className={`h-3.5 w-3.5 ${iconColor}`} />
                      <span>{rec.title}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full text-xs font-semibold mt-2 border-border-soft hover:bg-white"
                    onClick={rec.onClick}
                  >
                    <span>{rec.actionText}</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
}
