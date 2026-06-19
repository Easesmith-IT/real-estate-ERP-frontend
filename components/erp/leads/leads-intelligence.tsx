"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertTriangle, CheckCircle2, Info, ChevronRight } from "lucide-react";

interface Recommendation {
  id: string;
  type: "critical" | "warning" | "success" | "info";
  title: string;
  description: string;
  actionLabel: string;
  actionKey: string;
}

interface LeadsIntelligenceProps {
  onAction: (actionKey: string) => void;
  isLoading: boolean;
}

export function LeadsIntelligence({ onAction, isLoading }: LeadsIntelligenceProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Card key={idx} className="animate-pulse bg-surface-secondary">
            <CardHeader className="h-10 border-none" />
            <CardContent className="h-20" />
          </Card>
        ))}
      </div>
    );
  }

  const recommendations: Recommendation[] = [
    {
      id: "rec-1",
      type: "critical",
      title: "Follow-Up Risk",
      description: "12 leads have not been contacted in 7+ days.",
      actionLabel: "View Leads",
      actionKey: "view-overdue",
    },
    {
      id: "rec-2",
      type: "warning",
      title: "High Value Opportunity",
      description: "4 leads above ₹2 Cr budget are awaiting site visits.",
      actionLabel: "Schedule Visits",
      actionKey: "schedule-high-value",
    },
    {
      id: "rec-3",
      type: "critical",
      title: "Conversion Concern",
      description: "Site visit conversion dropped 11% this month.",
      actionLabel: "Review Pipeline",
      actionKey: "review-pipeline",
    },
    {
      id: "rec-4",
      type: "info",
      title: "Sales Opportunity",
      description: "South Zone generated 34% more leads than last month.",
      actionLabel: "View Performance",
      actionKey: "view-performance",
    },
    {
      id: "rec-5",
      type: "success",
      title: "Booking Alert",
      description: "Negotiation stage contains ₹8.4 Cr pipeline value.",
      actionLabel: "Review Deals",
      actionKey: "review-deals",
    },
  ];

  const getStyle = (type: Recommendation["type"]) => {
    switch (type) {
      case "critical":
        return {
          icon: ShieldAlert,
          bg: "bg-red-500/5 border-red-500/15",
          badgeTone: "error" as const,
          iconColor: "text-red-500",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          bg: "bg-amber-500/5 border-amber-500/15",
          badgeTone: "warning" as const,
          iconColor: "text-amber-500",
        };
      case "success":
        return {
          icon: CheckCircle2,
          bg: "bg-emerald-500/5 border-emerald-500/15",
          badgeTone: "success" as const,
          iconColor: "text-emerald-500",
        };
      case "info":
      default:
        return {
          icon: Info,
          bg: "bg-blue-500/5 border-blue-500/15",
          badgeTone: "info" as const,
          iconColor: "text-blue-500",
        };
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-section-title font-secondary text-text-primary">Sales Intelligence Center</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {recommendations.map((rec) => {
          const { icon: IconComponent, bg, badgeTone, iconColor } = getStyle(rec.type);
          return (
            <Card key={rec.id} className={`flex flex-col justify-between border ${bg} hover:shadow-soft transition-all duration-200`}>
              <CardHeader className="flex flex-row items-center justify-between border-none pb-2 space-y-0">
                <CardTitle className="text-card-title text-text-primary font-semibold">
                  {rec.title}
                </CardTitle>
                <div className={`p-1 rounded-full ${iconColor}`}>
                  <IconComponent className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between pt-0 space-y-4">
                <p className="text-body text-text-secondary leading-relaxed">{rec.description}</p>
                <div className="pt-2 flex items-center justify-between">
                  <Badge tone={badgeTone} className="capitalize py-0.5">
                    {rec.type === "critical" ? "Critical" : rec.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-label font-semibold h-8 px-2.5 text-accent-primary hover:bg-surface-secondary hover:text-accent-primary-hover gap-1"
                    onClick={() => onAction(rec.actionKey)}
                  >
                    {rec.actionLabel}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
