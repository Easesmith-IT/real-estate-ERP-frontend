"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterprisePageLoader } from "@/components/ui/loaders";

export function LoadingStateCard({
  title = "Loading ERP workspace",
  variant = "generic",
}: {
  title?: string;
  variant?: "dashboard" | "table" | "generic";
}) {
  return <EnterprisePageLoader title={title} variant={variant} />;
}

export function ErrorStateCard({
  title = "ERP data could not be loaded",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <Card className="border border-error/30">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-body text-text-secondary">{message}</CardContent>
    </Card>
  );
}
