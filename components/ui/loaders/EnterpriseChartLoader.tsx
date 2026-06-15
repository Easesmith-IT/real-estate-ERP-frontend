"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EnterpriseChartLoaderProps {
  title?: string;
  type?: "area" | "bar" | "donut";
  height?: number;
}

export function EnterpriseChartLoader({
  title = "Analyzing Data Trends",
  type = "area",
  height = 300,
}: EnterpriseChartLoaderProps) {
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="border-b border-border-soft pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-accent-primary/10 shimmer-skeleton" />
          <span>{title}</span>
        </CardTitle>
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-md shimmer-skeleton" />
          <div className="h-6 w-16 rounded-md shimmer-skeleton" />
        </div>
      </CardHeader>
      <CardContent className="p-6 relative flex flex-col justify-end" style={{ height: `${height}px` }}>
        <div className="absolute inset-0 shimmer-skeleton opacity-5 pointer-events-none" />

        {type === "area" && (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="absolute inset-x-6 top-6 bottom-16 flex flex-col justify-between pointer-events-none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-full border-t border-border-soft/60" />
              ))}
            </div>
            
            <div className="relative w-full h-full flex items-end">
              <svg className="w-full h-[80%] text-accent-primary/10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,10 L0,6 Q15,3 30,5.5 T60,2.5 T90,6.5 L100,4.5 L100,10 Z"
                  fill="url(#area-grad)"
                />
                <path
                  d="M0,6 Q15,3 30,5.5 T60,2.5 T90,6.5 L100,4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="text-accent-primary/30"
                />
              </svg>
            </div>
            
            <div className="h-10 border-t border-border-soft pt-3 flex justify-between text-[10px] text-text-muted">
              <div className="h-3 w-10 rounded shimmer-skeleton" />
              <div className="h-3 w-10 rounded shimmer-skeleton" />
              <div className="h-3 w-10 rounded shimmer-skeleton" />
              <div className="h-3 w-10 rounded shimmer-skeleton" />
              <div className="h-3 w-10 rounded shimmer-skeleton" />
            </div>
          </div>
        )}

        {type === "bar" && (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="absolute inset-x-6 top-6 bottom-16 flex flex-col justify-between pointer-events-none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-full border-t border-border-soft/60" />
              ))}
            </div>

            <div className="relative w-full h-[80%] flex items-end justify-between px-4 gap-4 sm:gap-6">
              {[45, 75, 55, 90, 65, 80, 50, 70, 85, 60].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-accent-primary/10 shimmer-skeleton"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            <div className="h-10 border-t border-border-soft pt-3 flex justify-between text-[10px] text-text-muted">
              <div className="h-3 w-8 rounded shimmer-skeleton" />
              <div className="h-3 w-8 rounded shimmer-skeleton" />
              <div className="h-3 w-8 rounded shimmer-skeleton" />
              <div className="h-3 w-8 rounded shimmer-skeleton" />
              <div className="h-3 w-8 rounded shimmer-skeleton" />
            </div>
          </div>
        )}

        {type === "donut" && (
          <div className="w-full h-full flex items-center justify-center gap-12 px-6">
            <div className="relative w-40 h-40 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="var(--color-surface-secondary)"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="var(--color-hover)"
                  strokeWidth="12"
                  strokeDasharray="238"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                  className="text-accent-primary/20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="var(--color-hover)"
                  strokeWidth="12"
                  strokeDasharray="238"
                  strokeDashoffset="180"
                  strokeLinecap="round"
                  className="text-accent-secondary/20"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="h-4 w-12 rounded shimmer-skeleton mb-1" />
                <div className="h-3 w-16 rounded shimmer-skeleton" />
              </div>
            </div>

            <div className="flex-1 space-y-3.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full shimmer-skeleton shrink-0" />
                  <div className="h-3.5 w-24 rounded shimmer-skeleton" />
                  <div className="h-3.5 w-8 rounded shimmer-skeleton ml-auto" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
