"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { PayrollEmployeeSummary, PayrollResponse } from "@/types/payroll";

interface PayrollRegisterProps {
  data: PayrollResponse | undefined;
  isLoading: boolean;
  filters: {
    search: string;
    department: string;
    projectId: string;
    status: string;
    page: number;
    limit: number;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  projects: { id: string; name: string }[];
  onExport: () => void;
}

export function PayrollRegister({
  data,
  isLoading,
  filters,
  setFilters,
  projects,
  onExport,
}: PayrollRegisterProps) {
  const departments = ["Projects", "Procurement", "Sales", "Finance", "Admin"];
  const statuses = ["On Track", "Review", "Needs Attention"];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev: any) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleReset = () => {
    setFilters({
      search: "",
      department: "",
      projectId: "",
      status: "",
      page: 1,
      limit: 20,
    });
  };

  const handlePageChange = (newPage: number) => {
    if (data?.pagination && newPage >= 1 && newPage <= data.pagination.pageCount) {
      setFilters((prev: any) => ({ ...prev, page: newPage }));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: PayrollEmployeeSummary["status"]) => {
    switch (status) {
      case "On Track":
        return <Badge tone="success">On Track</Badge>;
      case "Review":
        return <Badge tone="warning">Review</Badge>;
      case "Needs Attention":
        return <Badge tone="warning">Needs Attention</Badge>; // mapping to warning for tone compatibility
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  };

  const pagination = data?.pagination;
  const employees = data?.employees || [];

  return (
    <Card className="overflow-hidden border-border-soft hover:shadow-soft transition-all duration-200">
      <CardHeader className="pb-3 border-b border-border-soft bg-surface-secondary/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="text-body font-semibold text-text-primary">
            Workforce Cost Register
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-label h-8 px-3 border-border-strong font-medium text-text-primary hover:bg-surface-secondary gap-1.5"
              onClick={onExport}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Filters Toolbar */}
      <div className="p-4 bg-surface-secondary/20 border-b border-border-soft flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-text-muted" />
          <Input
            placeholder="Search Employee..."
            className="pl-9 text-body h-9 bg-surface-primary border-border-strong rounded-[var(--radius-input)] placeholder:text-text-muted text-text-primary"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Department Filter */}
        <select
          value={filters.department}
          onChange={(e) => handleFilterChange("department", e.target.value)}
          className="text-body h-9 px-3 rounded-[var(--radius-input)] border border-border-strong bg-surface-primary text-text-primary outline-none focus:border-text-secondary min-w-[140px]"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Project Filter */}
        <select
          value={filters.projectId}
          onChange={(e) => handleFilterChange("projectId", e.target.value)}
          className="text-body h-9 px-3 rounded-[var(--radius-input)] border border-border-strong bg-surface-primary text-text-primary outline-none focus:border-text-secondary min-w-[180px] max-w-xs"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="text-body h-9 px-3 rounded-[var(--radius-input)] border border-border-strong bg-surface-primary text-text-primary outline-none focus:border-text-secondary min-w-[140px]"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Reset */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-label text-text-secondary hover:text-text-primary font-medium flex items-center gap-1.5"
          onClick={handleReset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Filters
        </Button>
      </div>

      <CardContent className="px-0 pb-0 pt-0">
        <div className="overflow-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-primary border-t-transparent" />
              <p className="text-body text-text-muted">Loading employee payroll register...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-body font-semibold text-text-primary">No payroll records found</p>
              <p className="text-label text-text-muted mt-1">Try resetting or altering your filters.</p>
            </div>
          ) : (
            <table className="w-full min-w-[1100px] text-table">
              <thead className="bg-surface-secondary/40 text-text-secondary">
                <tr className="h-11 border-b border-border-soft">
                  <th className="px-4 text-left font-medium text-label">Employee</th>
                  <th className="px-4 text-left font-medium text-label">Department</th>
                  <th className="px-4 text-left font-medium text-label">Project & Role</th>
                  <th className="px-4 text-center font-medium text-label">Present</th>
                  <th className="px-4 text-center font-medium text-label">Late</th>
                  <th className="px-4 text-center font-medium text-label">Hours</th>
                  <th className="px-4 text-right font-medium text-label">Daily Rate</th>
                  <th className="px-4 text-right font-medium text-label">Gross Estimate</th>
                  <th className="px-4 text-right font-medium text-label">Recommended Pay</th>
                  <th className="px-4 text-center font-medium text-label">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-border-soft hover:bg-surface-secondary/10 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center font-bold text-label">
                          {row.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary text-body leading-none">{row.name}</p>
                          <p className="text-label text-text-muted mt-1">{row.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body text-text-primary">{row.department}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary text-body leading-none">{row.projectName}</p>
                      <p className="text-label text-text-muted mt-1">{row.projectRole}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-body text-text-primary">{row.presentDays}d</td>
                    <td className="px-4 py-3 text-center text-body text-text-primary">
                      {row.lateDays > 0 ? (
                        <span className="text-accent-amber font-medium">{row.lateDays}d</span>
                      ) : (
                        <span>0d</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-body text-text-primary">{row.hoursWorked}h</td>
                    <td className="px-4 py-3 text-right text-body text-text-primary font-medium">
                      {formatCurrency(row.dailyRate)}
                    </td>
                    <td className="px-4 py-3 text-right text-body text-text-primary">
                      {formatCurrency(row.grossPayEstimate)}
                    </td>
                    <td className="px-4 py-3 text-right text-body text-accent-primary font-semibold">
                      {formatCurrency(row.recommendedPay)}
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.pageCount > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-border-soft">
            <div className="flex items-center gap-3">
              <span className="text-label text-text-secondary">
                Showing {Math.min(pagination.totalCount, (pagination.page - 1) * pagination.limit + 1)}-
                {Math.min(pagination.totalCount, pagination.page * pagination.limit)} of {pagination.totalCount}{" "}
                employees
              </span>
              
              <div className="flex items-center gap-1.5">
                <span className="text-label text-text-secondary">Rows per page:</span>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters((prev: any) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                  className="text-label h-7 px-1.5 rounded-[var(--radius-input)] border border-border-strong bg-surface-primary text-text-primary outline-none focus:border-text-secondary"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-border-strong text-text-primary hover:bg-surface-secondary"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: pagination.pageCount }).map((_, index) => {
                const pageNumber = index + 1;
                // Simple logic to show a window of pages
                if (
                  pageNumber === 1 ||
                  pageNumber === pagination.pageCount ||
                  Math.abs(pageNumber - pagination.page) <= 1
                ) {
                  return (
                    <Button
                      key={pageNumber}
                      variant={pagination.page === pageNumber ? "primary" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 text-label font-medium ${
                        pagination.page === pageNumber
                          ? ""
                          : "border-border-strong text-text-primary hover:bg-surface-secondary"
                      }`}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                } else if (
                  pageNumber === 2 ||
                  pageNumber === pagination.pageCount - 1
                ) {
                  return <span key={pageNumber} className="text-text-muted px-1 text-label">...</span>;
                }
                return null;
              })}

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-border-strong text-text-primary hover:bg-surface-secondary"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pageCount}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
