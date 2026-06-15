"use client";

import { EnterpriseCardLoader } from "./enterprise-card-loader";
import { EnterpriseChartLoader } from "./enterprise-chart-loader";

export function EnterpriseDashboardLoader() {
  return (
    <div className="space-y-6 w-full">
      {/* KPI Card Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <EnterpriseCardLoader />
        <EnterpriseCardLoader />
        <EnterpriseCardLoader />
        <EnterpriseCardLoader />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Large Analytics Left Area (Area Chart + Operations Table) */}
        <div className="xl:col-span-2 space-y-6">
          <EnterpriseChartLoader title="Operations & Financial Performance Trends" type="area" height={320} />
          
          {/* Secondary Table List Skeleton */}
          <div className="bg-surface rounded-[var(--radius-card)] border border-border-soft p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border-soft pb-4">
              <div className="h-5 w-48 rounded shimmer-skeleton" />
              <div className="h-8 w-20 rounded-md shimmer-skeleton" />
            </div>
            <div className="space-y-3.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border-soft/60 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg shimmer-skeleton" />
                    <div className="space-y-1">
                      <div className="h-3.5 w-36 rounded shimmer-skeleton" />
                      <div className="h-3 w-20 rounded shimmer-skeleton opacity-60" />
                    </div>
                  </div>
                  <div className="h-4 w-16 rounded shimmer-skeleton" />
                  <div className="h-6 w-16 rounded-full shimmer-skeleton" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Area (Donut Chart + Insights Card) */}
        <div className="space-y-6">
          <EnterpriseChartLoader title="Resource Allocation" type="donut" height={280} />
          
          {/* Smart Insights Panel */}
          <div className="bg-surface rounded-[var(--radius-card)] border border-border-soft p-5 shadow-soft space-y-4">
            <div className="h-4.5 w-44 rounded shimmer-skeleton" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-surface-secondary/50 border border-border-soft space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded shimmer-skeleton" />
                    <div className="h-5 w-14 rounded-full shimmer-skeleton" />
                  </div>
                  <div className="h-3.5 w-full rounded shimmer-skeleton" />
                  <div className="h-3.5 w-2/3 rounded shimmer-skeleton" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
