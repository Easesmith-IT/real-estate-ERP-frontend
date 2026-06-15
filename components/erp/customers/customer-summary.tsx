"use client";

import { Card, CardContent } from "@/components/ui/card";

export function CustomerSummary() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-6">
        <p className="text-card-title text-text-primary">Customer Portfolio Summary</p>
        <ul className="space-y-2 text-body text-text-secondary">
          <li>Portfolio value reached ₹148 Cr</li>
          <li>Collection efficiency improved by 6%</li>
          <li>₹2.4 Cr due within 15 days</li>
          <li>Premium customers contribute 41% of revenue</li>
          <li>6 customers require collection follow-up</li>
        </ul>
        <p className="text-label text-text-muted">Last updated 5 minutes ago</p>
      </CardContent>
    </Card>
  );
}
