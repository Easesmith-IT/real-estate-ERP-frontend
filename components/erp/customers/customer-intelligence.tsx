"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertTriangle, CheckCircle2, Info, ShieldAlert, Sparkles } from "lucide-react";
import { CustomerRecommendation } from "./customer-utils";

type Props = {
  items: CustomerRecommendation[];
};

const iconMap = {
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: ShieldAlert,
  info: Info,
};

export function CustomerIntelligence({ items }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {items.map((item) => {
        const Icon = iconMap[item.tone];
        const tone = item.tone === "critical" ? "error" : item.tone === "warning" ? "warning" : item.tone === "success" ? "success" : "info";

        return (
          <Card key={item.title} className="overflow-hidden border-border-soft/80 bg-surface hover:shadow-soft transition-all duration-200">
            <CardHeader className="border-none pb-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone === "critical" ? "bg-error/10 text-error" : item.tone === "warning" ? "bg-warning/10 text-warning" : item.tone === "success" ? "bg-success/10 text-success" : "bg-info/10 text-info"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-card-title">{item.title}</CardTitle>
                  <Badge tone={tone} className="mt-2">Intelligence</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <p className="text-body text-text-secondary">{item.description}</p>
              <Button variant="secondary" size="sm" className="gap-1.5">
                {item.actionLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
