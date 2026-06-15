"use client";

export function EnterpriseDrawerLoader() {
  return (
    <div className="flex flex-col h-full w-full bg-surface">
      {/* Drawer Header */}
      <div className="border-b border-border-soft px-6 py-5 flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-6 w-48 rounded shimmer-skeleton" />
          <div className="h-4 w-64 rounded shimmer-skeleton opacity-60" />
        </div>
        <div className="h-8 w-8 rounded-lg shimmer-skeleton" />
      </div>

      {/* Drawer Body Form Fields */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-28 rounded shimmer-skeleton" />
            <div className="h-10 w-full rounded-[var(--radius-input)] shimmer-skeleton" />
          </div>
        ))}

        <div className="space-y-2">
          <div className="h-4 w-28 rounded shimmer-skeleton" />
          <div className="h-28 w-full rounded-[var(--radius-input)] shimmer-skeleton" />
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="border-t border-border-soft px-6 py-4 bg-surface-secondary/40 flex items-center justify-end gap-3">
        <div className="h-10 w-24 rounded-[var(--radius-button)] shimmer-skeleton" />
        <div className="h-10 w-32 rounded-[var(--radius-button)] shimmer-skeleton" />
      </div>
    </div>
  );
}
