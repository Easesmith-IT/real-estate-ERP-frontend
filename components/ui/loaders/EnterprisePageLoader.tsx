"use client";

import { EnterpriseChartLoader } from "./EnterpriseChartLoader";
import { EnterpriseKpiLoader } from "./EnterpriseKpiLoader";
import { EnterpriseTableLoader } from "./EnterpriseTableLoader";

interface EnterprisePageLoaderProps {
  title?: string;
  variant?: "dashboard" | "table" | "generic";
}

export function EnterpriseDashboardLoader() {
  return (
    <div className="space-y-6 w-full">
      {/* KPI Card Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <EnterpriseKpiLoader />
        <EnterpriseKpiLoader />
        <EnterpriseKpiLoader />
        <EnterpriseKpiLoader />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
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

export function EnterprisePageLoader({ title = "Loading workspace", variant = "dashboard" }: EnterprisePageLoaderProps) {
  return (
    <section className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-border-soft pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          {/* Breadcrumbs skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 rounded shimmer-skeleton" />
            <span className="text-text-muted">/</span>
            <div className="h-4 w-24 rounded shimmer-skeleton" />
          </div>
          {/* Page Title skeleton */}
          <div className="h-9 w-64 rounded-lg shimmer-skeleton" />
          {/* Description skeleton */}
          <div className="h-4 w-[480px] max-w-full rounded shimmer-skeleton opacity-70" />
        </div>
        
        {/* Header Actions skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-10 w-28 rounded-[var(--radius-button)] shimmer-skeleton" />
          <div className="h-10 w-10 rounded-[var(--radius-button)] shimmer-skeleton" />
        </div>
      </div>

      {/* Page Content Body depending on variant */}
      <div className="w-full">
        {variant === "dashboard" && <EnterpriseDashboardLoader />}
        {variant === "table" && <EnterpriseTableLoader />}
        {variant === "generic" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-6">
              <div className="h-64 w-full rounded-[var(--radius-card)] border border-border-soft bg-surface p-6 shadow-soft space-y-4">
                <div className="h-5 w-40 rounded shimmer-skeleton" />
                <div className="h-full border-t border-border-soft/60 pt-4 space-y-3">
                  <div className="h-4 w-full rounded shimmer-skeleton" />
                  <div className="h-4 w-5/6 rounded shimmer-skeleton" />
                  <div className="h-4 w-4/5 rounded shimmer-skeleton" />
                </div>
              </div>
              <div className="h-[400px] w-full rounded-[var(--radius-card)] border border-border-soft bg-surface p-6 shadow-soft space-y-4">
                <div className="h-5 w-48 rounded shimmer-skeleton" />
                <div className="h-full border-t border-border-soft/60 pt-4 space-y-3">
                  <div className="h-4 w-full rounded shimmer-skeleton" />
                  <div className="h-4 w-11/12 rounded shimmer-skeleton" />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-80 w-full rounded-[var(--radius-card)] border border-border-soft bg-surface p-6 shadow-soft space-y-4">
                <div className="h-5 w-32 rounded shimmer-skeleton" />
                <div className="h-full border-t border-border-soft/60 pt-4 space-y-3">
                  <div className="h-4 w-full rounded shimmer-skeleton" />
                  <div className="h-4 w-full rounded shimmer-skeleton" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
