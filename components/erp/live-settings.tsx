"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BellRing, Building2, Settings2, ShieldCheck } from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatDateTime, toneForStatus } from "@/lib/erp-utils";
import type { AdminSettings, PermissionMatrix, UserDirectoryResponse } from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { KpiGrid, SectionHeader } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsOverviewWorkspace() {
  const role = useUiStore((state) => state.role);

  const usersQuery = useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });
  const settingsQuery = useQuery({
    queryKey: ["erp-admin-settings", role],
    queryFn: async () => (await apiRequest<AdminSettings>("/api/admin/settings", { role })).data,
  });

  if (usersQuery.isLoading || settingsQuery.isLoading) {
    return <LoadingStateCard title="Loading settings console" />;
  }

  if (usersQuery.error || settingsQuery.error || !usersQuery.data || !settingsQuery.data) {
    return <ErrorStateCard message="Settings overview data is unavailable." />;
  }

  const settingTiles = [
    {
      title: "Company Settings",
      detail: "Identity, office profile, and ERP defaults used across reports and customer-facing records.",
      href: "/settings/company-settings",
      icon: Building2,
      metric: `${usersQuery.data.roles.length} role templates`,
    },
    {
      title: "Notification Settings",
      detail: "Escalation channels, reminder cadence, and WhatsApp message template configurations.",
      href: "/settings/notification-settings",
      icon: BellRing,
      metric: `${settingsQuery.data.notificationSettings.length} live rules`,
    },
    {
      title: "Workflow Settings",
      detail: "Approval flow, biometric sync cadence, and operational thresholds that drive workflow actions.",
      href: "/settings/workflow-settings",
      icon: Settings2,
      metric: `${settingsQuery.data.workflowSettings.length} policies`,
    },
    {
      title: "Users and Permissions",
      detail: "Access templates, module visibility, and operator-role governance profiles.",
      href: "/settings/users-permissions",
      icon: ShieldCheck,
      metric: `${usersQuery.data.users.length} ERP users`,
    },
  ];

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Settings Console"
        description="Operational controls, notification rules, permissions, and ERP defaults gathered into one admin-facing console surface."
      />

      <KpiGrid
        items={[
          { label: "ERP Users", value: `${usersQuery.data.users.length}`, trend: "Seeded operators and role owners", tone: "info" },
          { label: "Workflow Policies", value: `${settingsQuery.data.workflowSettings.length}`, trend: "Execution rules in force", tone: "warning" },
          { label: "Notification Rules", value: `${settingsQuery.data.notificationSettings.length}`, trend: "Reminders and alerts configured", tone: "success" },
          { label: "Audit History", value: `${settingsQuery.data.auditLogs.length}`, trend: "Recent tracked control changes", tone: "info" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Admin Workstreams</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {settingTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.href}
                  href={tile.href}
                  className="group rounded-[var(--radius-card)] border border-border-soft bg-surface-secondary p-4 transition-transform hover:-translate-y-0.5 hover:border-accent-primary/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-surface text-accent-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="mt-4 text-card-title text-text-primary">{tile.title}</p>
                  <p className="mt-2 text-body text-text-secondary">{tile.detail}</p>
                  <Badge tone="info" className="mt-4">
                    {tile.metric}
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {settingsQuery.data.auditLogs.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-text-primary">{item.title}</p>
                    <Badge tone="info">{item.category}</Badge>
                  </div>
                  <p className="mt-2 text-body text-text-secondary">{item.detail}</p>
                  <p className="mt-2 text-label text-text-muted">
                    {item.actorName} · {formatDateTime(item.createdAt)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Notification Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {settingsQuery.data.notificationSettings.slice(0, 5).map((setting) => (
                <div key={setting.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-text-primary">{setting.name}</p>
                    <Badge tone={toneForStatus(setting.status)}>{setting.status}</Badge>
                  </div>
                  <p className="mt-2 text-body text-text-secondary">{setting.defaultValue}</p>
                  <p className="mt-2 text-label text-text-muted">{setting.code}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export function PermissionsWorkspace() {
  const role = useUiStore((state) => state.role);

  const usersQuery = useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });
  const matrixQuery = useQuery({
    queryKey: ["erp-permissions-matrix", role],
    queryFn: async () => (await apiRequest<PermissionMatrix>("/api/users/permissions-matrix", { role })).data,
  });
  const settingsQuery = useQuery({
    queryKey: ["erp-admin-settings", role],
    queryFn: async () => (await apiRequest<AdminSettings>("/api/admin/settings", { role })).data,
  });

  if (usersQuery.isLoading || matrixQuery.isLoading || settingsQuery.isLoading) {
    return <LoadingStateCard title="Loading settings and permission workspace" />;
  }

  if (usersQuery.error || matrixQuery.error || settingsQuery.error || !usersQuery.data || !matrixQuery.data || !settingsQuery.data) {
    return <ErrorStateCard message="Settings and permission data is unavailable." />;
  }

  const roleCount = usersQuery.data.roles.length;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Users and Permissions"
        description="Role-aware access, workflow defaults, and audit visibility for the internal web ERP foundation."
      />

      <KpiGrid
        items={[
          { label: "ERP Users", value: `${usersQuery.data.users.length}`, trend: "Seeded operators and system owners", tone: "info" },
          { label: "Role Profiles", value: `${roleCount}`, trend: "Permission group templates", tone: "success" },
          { label: "Workflow Policies", value: `${settingsQuery.data.workflowSettings.length}`, trend: "Operational controls", tone: "warning" },
          { label: "Notification Rules", value: `${settingsQuery.data.notificationSettings.length}`, trend: "System alerts configured", tone: "info" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="overflow-auto">
              <table className="w-full min-w-[720px] text-table">
                <thead className="bg-surface-secondary text-text-secondary">
                  <tr className="h-12 border-b border-border-soft">
                    <th className="px-4 text-left">User</th>
                    <th className="px-4 text-left">Role</th>
                    <th className="px-4 text-left">Designation</th>
                    <th className="px-4 text-left">Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersQuery.data.users.map((user) => (
                    <tr key={user.id} className="border-t border-border-soft">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-text-primary">{user.name}</p>
                          <p className="text-label text-text-muted">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone="info">{user.role}</Badge>
                      </td>
                      <td className="px-4 py-4">{user.designation}</td>
                      <td className="px-4 py-4">{user.permissions.includes("*") ? "Full platform access" : `${user.permissions.length} permission rules`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {settingsQuery.data.workflowSettings.map((setting) => (
                <div key={setting.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-text-primary">{setting.name}</p>
                    <Badge tone={toneForStatus(setting.status)}>{setting.status}</Badge>
                  </div>
                  <p className="mt-2 text-body text-text-secondary">{setting.defaultValue}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {settingsQuery.data.auditLogs.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-text-primary">{item.title}</p>
                    <Badge tone="info">{item.category}</Badge>
                  </div>
                  <p className="mt-2 text-body text-text-secondary">{item.detail}</p>
                  <p className="mt-2 text-label text-text-muted">
                    {item.actorName} · {formatDateTime(item.createdAt)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Role Access Matrix</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[760px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  {["Module", "Admin", "Manager", "Accountant", "Sales"].map((heading) => (
                    <th key={heading} className="px-4 text-left">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixQuery.data.rows.map((row) => (
                  <tr key={row.module} className="border-t border-border-soft">
                    <td className="px-4 py-4 text-text-primary">{row.module}</td>
                    <td className="px-4 py-4">{row.admin}</td>
                    <td className="px-4 py-4">{row.manager}</td>
                    <td className="px-4 py-4">{row.accountant}</td>
                    <td className="px-4 py-4">{row.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
