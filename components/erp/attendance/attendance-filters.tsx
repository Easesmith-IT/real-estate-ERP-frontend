"use client";

import { Search, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Project = {
  id: string;
  name: string;
};

type AttendanceFiltersProps = {
  filters: {
    search: string;
    status: string;
    department: string;
    projectId: string;
    startDate: string;
    endDate: string;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      search: string;
      status: string;
      department: string;
      projectId: string;
      startDate: string;
      endDate: string;
    }>
  >;
  projects: Project[];
  departments: string[];
  onReset: () => void;
  onExport: () => void;
};

const selectClassName =
  "h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body text-text-primary shadow-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.22)] w-full";

export function AttendanceFilters({
  filters,
  setFilters,
  projects,
  departments,
  onReset,
  onExport,
}: AttendanceFiltersProps) {
  return (
    <div className="space-y-4 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 items-end">
        
        {/* Search */}
        <div className="space-y-1.5">
          <label className="text-label text-text-secondary">Search Employee</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Name or designation..."
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-label text-text-secondary">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className={selectClassName}
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late Check-in</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <label className="text-label text-text-secondary">Department</label>
          <select
            value={filters.department}
            onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
            className={selectClassName}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Project/Site */}
        <div className="space-y-1.5">
          <label className="text-label text-text-secondary">Project Site</label>
          <select
            value={filters.projectId}
            onChange={(e) => setFilters((prev) => ({ ...prev, projectId: e.target.value }))}
            className={selectClassName}
          >
            <option value="">All Project Sites</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Start */}
        <div className="space-y-1.5">
          <label className="text-label text-text-secondary">From Date</label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
            className="h-11"
          />
        </div>

        {/* Date Range End */}
        <div className="space-y-1.5">
          <label className="text-label text-text-secondary">To Date</label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-soft">
        <Button variant="secondary" size="sm" onClick={onReset} className="h-9">
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Reset Filters
        </Button>
        <Button size="sm" onClick={onExport} className="h-9">
          <Download className="mr-1 h-3.5 w-3.5" />
          Export Report
        </Button>
      </div>
    </div>
  );
}
