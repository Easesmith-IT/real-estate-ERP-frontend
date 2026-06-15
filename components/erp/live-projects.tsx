"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderPlus } from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { apiRequest } from "@/lib/erp-api";
import { formatCurrency, toneForStatus } from "@/lib/erp-utils";
import type { PropertySummaryResponse, UserDirectoryResponse } from "@/lib/erp-types";
import { ErrorStateCard, LoadingStateCard } from "@/components/erp/live-state";
import { KpiGrid, SectionHeader, TableEmptyStateRow, TableToolbar } from "@/components/erp/page-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const selectClassName =
  "h-11 w-full rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)]";

export function ProjectsInventoryWorkspace() {
  const role = useUiStore((state) => state.role);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [stageFilter, setStageFilter] = useState("All");
  const [unitStatusFilter, setUnitStatusFilter] = useState("All");
  const [form, setForm] = useState({
    name: "",
    code: "",
    location: "",
    stage: "Execution Planning",
    managerId: "",
  });

  const projectsQuery = useQuery({
    queryKey: ["erp-properties-summary", role],
    queryFn: async () => (await apiRequest<PropertySummaryResponse>("/api/properties/summary", { role })).data,
  });
  const usersQuery = useQuery({
    queryKey: ["erp-users", role],
    queryFn: async () => (await apiRequest<UserDirectoryResponse>("/api/users", { role })).data,
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/properties", {
        role,
        method: "POST",
        body: form,
      }),
    onSuccess: async () => {
      setForm({
        name: "",
        code: "",
        location: "",
        stage: "Execution Planning",
        managerId: usersQuery.data?.users.find((user) => user.role === "manager")?.id || "",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp-properties-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-ai-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["erp-executive-dashboard"] }),
      ]);
    },
  });

  useEffect(() => {
    if (!form.managerId && usersQuery.data?.users.length) {
      setForm((current) => ({
        ...current,
        managerId: usersQuery.data?.users.find((user) => user.role === "manager")?.id || usersQuery.data?.users[0]?.id || "",
      }));
    }
  }, [form.managerId, usersQuery.data?.users]);

  const units = useMemo(() => {
    const rows = projectsQuery.data?.units || [];
    const needle = deferredSearch.trim().toLowerCase();
    return rows.filter(
      (unit) =>
        (!needle ||
          unit.projectName.toLowerCase().includes(needle) ||
          unit.code.toLowerCase().includes(needle) ||
          unit.configuration.toLowerCase().includes(needle)) &&
        (stageFilter === "All" ||
          projectsQuery.data?.projects.find((project) => project.id === unit.projectId)?.stage === stageFilter) &&
        (unitStatusFilter === "All" || unit.status === unitStatusFilter),
    );
  }, [deferredSearch, projectsQuery.data, stageFilter, unitStatusFilter]);

  if (projectsQuery.isLoading || usersQuery.isLoading) {
    return <LoadingStateCard title="Loading property inventory workspace" />;
  }

  if (projectsQuery.error || usersQuery.error || !projectsQuery.data || !usersQuery.data) {
    return <ErrorStateCard message="Property inventory is unavailable." />;
  }

  const { projects } = projectsQuery.data;
  const totalUnits = units.length;
  const availableUnits = units.filter((unit) => unit.status === "available").length;
  const bookedUnits = units.filter((unit) => unit.status === "booked").length;
  const inventoryValue = units.reduce((sum, unit) => sum + unit.finalPrice, 0);
  const managers = usersQuery.data.users.filter((user) => user.role === "manager" || user.role === "admin");
  const projectStages = Array.from(new Set(projects.map((project) => project.stage))).sort();
  const activeFilters = [
    stageFilter !== "All" ? `Stage: ${stageFilter}` : null,
    unitStatusFilter !== "All" ? `Status: ${unitStatusFilter}` : null,
  ].filter(Boolean) as string[];
  const projectsVisible = new Set(units.map((unit) => unit.projectId)).size;
  const premiumUnits = units.filter((unit) => unit.finalPrice >= 16000000).length;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Project and Unit Inventory"
        description="Commercial inventory is structured by project and unit, with live availability and pricing visible to the sales and management teams."
      />

      <KpiGrid
        items={[
          { label: "Projects", value: `${projects.length}`, trend: "Active commercial portfolios", tone: "info" },
          { label: "Tracked Units", value: `${totalUnits}`, trend: "Structured inventory register", tone: "info" },
          { label: "Available Units", value: `${availableUnits}`, trend: "Ready for booking", tone: "success" },
          { label: "Booked Units", value: `${bookedUnits}`, trend: "Commercially committed", tone: "warning" },
          { label: "Inventory Value", value: formatCurrency(inventoryValue), trend: "Total pipeline value", tone: "success" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id} className="surface-secondary">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-body text-text-secondary">{project.location}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="info">{project.stage}</Badge>
                  <Badge tone="success">{project.availableUnits} available</Badge>
                  <Badge tone="warning">{project.bookedUnits} booked</Badge>
                </div>
                <p className="text-body text-text-secondary">Manager: {project.managerName}</p>
                <p className="text-card-title text-text-primary">{formatCurrency(project.inventoryValue)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Project name</label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Code</label>
                <Input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />
              </div>
              <div className="space-y-1">
                <label className="text-label text-text-secondary">Stage</label>
                <select value={form.stage} onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value }))} className={selectClassName}>
                  <option value="Execution Planning">Execution Planning</option>
                  <option value="Sales Launch">Sales Launch</option>
                  <option value="Inventory Release">Inventory Release</option>
                  <option value="Possession Linked Sales">Possession Linked Sales</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Location</label>
              <Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-label text-text-secondary">Manager</label>
              <select value={form.managerId} onChange={(event) => setForm((current) => ({ ...current, managerId: event.target.value }))} className={selectClassName}>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
                <FolderPlus className="h-4 w-4" />
                Add Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="space-y-1">
            <CardTitle>Unit Availability Register</CardTitle>
            <p className="text-body text-text-secondary">
              Commercial inventory with searchable unit mix, stage-aware filtering, and ready-to-pitch premium stock visibility.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <TableToolbar
            searchPlaceholder="Search project, unit, or configuration"
            searchValue={search}
            onSearchChange={setSearch}
            filters={
              <>
                <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} className={selectClassName}>
                  <option value="All">All stages</option>
                  {projectStages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
                <select value={unitStatusFilter} onChange={(event) => setUnitStatusFilter(event.target.value)} className={selectClassName}>
                  <option value="All">All unit status</option>
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="blocked">Blocked</option>
                </select>
              </>
            }
            resultLabel={`${units.length} of ${projectsQuery.data.units.length} units`}
            activeFilters={activeFilters}
            summary={`${projectsVisible} projects represented · ${premiumUnits} premium-value units in current view`}
            onClear={() => {
              setSearch("");
              setStageFilter("All");
              setUnitStatusFilter("All");
            }}
          />
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-table">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr className="h-12 border-b border-border-soft">
                  <th className="px-4 text-left">Project</th>
                  <th className="px-4 text-left">Unit</th>
                  <th className="px-4 text-left">Configuration</th>
                  <th className="px-4 text-left">Floor</th>
                  <th className="px-4 text-left">Facing</th>
                  <th className="px-4 text-left">Value</th>
                  <th className="px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {units.length ? units.map((unit) => (
                  <tr key={unit.id} className="border-t border-border-soft transition-colors hover:bg-hover/40">
                    <td className="px-4 py-4 text-text-primary">{unit.projectName}</td>
                    <td className="px-4 py-4">{unit.code}</td>
                    <td className="px-4 py-4">{unit.configuration}</td>
                    <td className="px-4 py-4">{unit.floorLabel}</td>
                    <td className="px-4 py-4">{unit.facing}</td>
                    <td className="px-4 py-4 text-text-primary">{formatCurrency(unit.finalPrice)}</td>
                    <td className="px-4 py-4">
                      <Badge tone={toneForStatus(unit.status)}>{unit.status}</Badge>
                    </td>
                  </tr>
                )) : (
                  <TableEmptyStateRow
                    colSpan={7}
                    title="No units match the current commercial view"
                    description="Reset the stage or status filters to restore the broader inventory register."
                  />
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
