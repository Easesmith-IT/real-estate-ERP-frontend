"use client";

import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { LeadForm } from "@/components/forms/lead-form";
import { EnterpriseTable } from "@/components/table/enterprise-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ModuleWorkspaceProps = {
  title: string;
  description: string;
  actionSlot?: React.ReactNode;
};

export function ModuleWorkspace({ title, description, actionSlot }: ModuleWorkspaceProps) {
  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-page-title font-secondary text-text-primary">{title}</h1>
          <p className="max-w-3xl text-body text-text-secondary">{description}</p>
        </div>
        {actionSlot}
      </div>

      <RoleDashboard />

      <div className="section-separator grid grid-cols-1 gap-6 pt-6 2xl:grid-cols-5">
        <div className="2xl:col-span-3">
          <EnterpriseTable />
        </div>
        <div className="2xl:col-span-2">
          <LeadForm />
        </div>
      </div>

      <Card className="surface-secondary">
        <CardHeader>
          <CardTitle>Module Operations Guidance</CardTitle>
        </CardHeader>
        <CardContent className="text-body text-text-secondary">
          NimbusOS uses layered tokens and shared primitives. Build all new modules with the same surface hierarchy, spacing rhythm, table structure, and form patterns to keep the ERP visually premium and operationally fast.
        </CardContent>
      </Card>
    </section>
  );
}
