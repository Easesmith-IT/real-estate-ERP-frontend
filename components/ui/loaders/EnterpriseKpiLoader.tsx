"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function EnterpriseKpiLoader() {
  return (
    <Card className="card-kpi overflow-hidden">
      <CardHeader className="border-none pb-2 flex flex-row items-center justify-between">
        <div className="h-4.5 w-28 rounded-md shimmer-skeleton" />
        <div className="h-9 w-9 rounded-[var(--radius-icon)] shimmer-skeleton shrink-0" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 w-32 rounded-lg shimmer-skeleton" />
        
        <div className="space-y-2.5 pt-1">
          <div className="h-3.5 w-40 rounded-md shimmer-skeleton" />
          <div className="h-8 w-full rounded-md bg-hover/20 relative overflow-hidden flex items-end">
            <div className="absolute inset-0 shimmer-skeleton opacity-30" />
            <svg className="w-full h-6 text-hover" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path
                d="M0,8 Q15,2 30,5 T60,2 T90,6 L100,4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="opacity-40"
              />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
