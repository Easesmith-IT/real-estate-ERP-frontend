"use client";

import { Card } from "@/components/ui/card";

export function EnterpriseTableLoader() {
  return (
    <div className="space-y-4 w-full">
      {/* Search and Filters Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface px-6 py-4 rounded-[var(--radius-card)] border border-border-soft shadow-soft">
        <div className="h-10 w-full sm:w-72 rounded-[var(--radius-input)] shimmer-skeleton" />
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="h-9 w-24 rounded-[var(--radius-input)] shimmer-skeleton" />
          <div className="h-9 w-24 rounded-[var(--radius-input)] shimmer-skeleton" />
          <div className="h-9 w-24 rounded-[var(--radius-input)] shimmer-skeleton" />
          <div className="h-9 w-32 rounded-[var(--radius-input)] shimmer-skeleton" />
        </div>
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border-soft bg-surface-secondary/60">
                <th className="px-6 py-4 w-12"><div className="h-4 w-4 rounded shimmer-skeleton" /></th>
                <th className="px-6 py-4"><div className="h-4 w-28 rounded shimmer-skeleton" /></th>
                <th className="px-6 py-4"><div className="h-4 w-32 rounded shimmer-skeleton" /></th>
                <th className="px-6 py-4"><div className="h-4 w-20 rounded shimmer-skeleton" /></th>
                <th className="px-6 py-4"><div className="h-4 w-24 rounded shimmer-skeleton" /></th>
                <th className="px-6 py-4"><div className="h-4 w-28 rounded shimmer-skeleton" /></th>
                <th className="px-6 py-4 text-right w-24"><div className="h-4 w-16 rounded shimmer-skeleton ml-auto" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border-soft hover:bg-hover/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="h-4 w-4 rounded shimmer-skeleton" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-[10px] shimmer-skeleton shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 rounded shimmer-skeleton" />
                        <div className="h-3 w-20 rounded shimmer-skeleton opacity-60" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <div className="h-4 w-40 rounded shimmer-skeleton" />
                      <div className="h-3.5 w-24 rounded shimmer-skeleton opacity-60" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 rounded-full shimmer-skeleton" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 rounded shimmer-skeleton" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-24 rounded shimmer-skeleton" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-8 w-8 rounded-lg shimmer-skeleton" />
                      <div className="h-8 w-8 rounded-lg shimmer-skeleton" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Skeleton */}
        <div className="border-t border-border-soft px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface">
          <div className="h-4 w-48 rounded shimmer-skeleton" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md shimmer-skeleton" />
            <div className="h-8 w-16 rounded-md shimmer-skeleton" />
            <div className="h-8 w-8 rounded-md shimmer-skeleton" />
          </div>
        </div>
      </Card>
    </div>
  );
}
