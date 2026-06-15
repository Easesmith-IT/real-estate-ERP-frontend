"use client";

import { EnterpriseDashboardLoader } from "@/components/ui/loaders";

export default function ErpLoading() {
  return (
    <div className="animate-page-in">
      <EnterpriseDashboardLoader />
    </div>
  );
}
