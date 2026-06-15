"use client";

import { EnterpriseDashboardLoader } from "./enterprise-dashboard-loader";
import { EnterpriseTableLoader } from "./enterprise-table-loader";

interface EnterprisePageLoaderProps {
  title?: string;
  variant?: "dashboard" | "table" | "generic";
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
