"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, ChevronRight } from "lucide-react";
import { Booking } from "@/lib/erp-types";
import { formatPortfolioValue, bookingStatusTone } from "./customer-utils";

type Props = {
  bookings: Booking[];
};

type BookingFilters = {
  status: string;
  project: string;
  paymentPlan: string;
  dateRange: string;
};

const staticNow = Date.now();

export function BookingRegister({ bookings }: Props) {
  const [filters, setFilters] = useState<BookingFilters>({
    status: "All",
    project: "All",
    paymentPlan: "All",
    dateRange: "All",
  });

  const projects = useMemo(() => {
    return Array.from(new Set(bookings.map((b) => b.projectName).filter(Boolean)));
  }, [bookings]);

  const paymentPlans = useMemo(() => {
    return Array.from(new Set(bookings.map((b) => b.paymentPlanType).filter(Boolean)));
  }, [bookings]);

  const getNextDue = (booking: Booking) => {
    const unpaid = booking.scheduleSummary
      .filter((item) => item.status !== "Paid")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    if (unpaid.length === 0) return null;
    const first = unpaid[0];
    const isOverdue = first.status === "Overdue" || (staticNow > 0 && new Date(first.dueDate).getTime() < staticNow);
    return {
      date: first.dueDate,
      amount: first.amount - first.paidAmount,
      isOverdue,
    };
  };

  const getProgressString = (percent: number) => {
    const filledCount = Math.min(10, Math.max(0, Math.round(percent / 10)));
    const emptyCount = 10 - filledCount;
    return "█".repeat(filledCount) + "░".repeat(emptyCount);
  };

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesStatus = filters.status === "All" || booking.status === filters.status;
      const matchesProject = filters.project === "All" || booking.projectName === filters.project;
      const matchesPlan = filters.paymentPlan === "All" || booking.paymentPlanType === filters.paymentPlan;

      // Filter by booking date ranges
      let matchesDate = true;
      if (filters.dateRange !== "All") {
        const dateLimit = new Date();
        if (filters.dateRange === "30") {
          dateLimit.setDate(dateLimit.getDate() - 30);
          matchesDate = new Date(booking.bookingDate) >= dateLimit;
        } else if (filters.dateRange === "90") {
          dateLimit.setDate(dateLimit.getDate() - 90);
          matchesDate = new Date(booking.bookingDate) >= dateLimit;
        } else if (filters.dateRange === "365") {
          dateLimit.setDate(dateLimit.getDate() - 365);
          matchesDate = new Date(booking.bookingDate) >= dateLimit;
        }
      }

      return matchesStatus && matchesProject && matchesPlan && matchesDate;
    });
  }, [bookings, filters]);

  return (
    <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
      <CardHeader className="items-start border-none pb-0">
        <div>
          <CardTitle>Booking Register</CardTitle>
          <p className="text-body text-text-secondary">
            Granular transaction logs mapping active payment schedules, collected totals, and next dues.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body"
            value={filters.project}
            onChange={(e) => setFilters((prev) => ({ ...prev, project: e.target.value }))}
          >
            <option value="All">All Projects</option>
            {projects.map((proj) => (
              <option key={proj} value={proj}>
                {proj}
              </option>
            ))}
          </select>

          <select
            className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body"
            value={filters.paymentPlan}
            onChange={(e) => setFilters((prev) => ({ ...prev, paymentPlan: e.target.value }))}
          >
            <option value="All">All Payment Plans</option>
            {paymentPlans.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>

          <select
            className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body"
            value={filters.dateRange}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value }))}
          >
            <option value="All">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>

          <Button variant="secondary" size="sm" className="h-11">
            <Download className="h-4 w-4" /> Export
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-11 text-text-secondary"
            onClick={() =>
              setFilters({
                status: "All",
                project: "All",
                paymentPlan: "All",
                dateRange: "All",
              })
            }
          >
            <RotateCcw className="h-4 w-4" /> Reset Filters
          </Button>
        </div>

        {/* Table container */}
        <div className="overflow-auto rounded-[var(--radius-card)] border border-border-soft">
          <table className="w-full min-w-[1200px] text-table">
            <thead className="bg-surface-secondary text-text-secondary">
              <tr className="h-12 border-b border-border-soft text-left">
                <th className="px-4">Customer</th>
                <th className="px-4">Project</th>
                <th className="px-4">Unit</th>
                <th className="px-4">Booking Amount</th>
                <th className="px-4">Collected</th>
                <th className="px-4">Outstanding</th>
                <th className="px-4">Collection %</th>
                <th className="px-4">Next Due</th>
                <th className="px-4">Status</th>
                <th className="px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking) => {
                const collectionRate = booking.totalAmount > 0
                  ? Math.min(100, Math.round((booking.totalPaid / booking.totalAmount) * 100))
                  : 0;

                const nextDue = getNextDue(booking);

                return (
                  <tr
                    key={booking.id}
                    className="border-t border-border-soft hover:bg-hover"
                  >
                    <td className="px-4 py-4 font-medium text-text-primary">
                      {booking.customerName}
                    </td>
                    <td className="px-4 py-4 text-text-secondary">
                      {booking.projectName}
                    </td>
                    <td className="px-4 py-4 font-medium text-text-primary">
                      {booking.unitCode}
                    </td>
                    <td className="px-4 py-4 text-text-primary">
                      {formatPortfolioValue(booking.totalAmount)}
                    </td>
                    <td className="px-4 py-4 text-success font-medium">
                      {formatPortfolioValue(booking.totalPaid)}
                    </td>
                    <td className="px-4 py-4 text-warning font-medium">
                      {formatPortfolioValue(booking.outstandingAmount)}
                    </td>
                    <td className="px-4 py-4 font-mono text-body">
                      <div className="flex flex-col">
                        <span className="text-accent-primary">
                          {getProgressString(collectionRate)}
                        </span>
                        <span className="text-label text-text-muted mt-1">
                          {collectionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {nextDue ? (
                        <div className="space-y-1">
                          <p className="text-body font-medium text-text-primary">
                            {formatPortfolioValue(nextDue.amount)}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-label text-text-muted">
                              {new Date(nextDue.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            {nextDue.isOverdue && (
                              <Badge tone="error" className="py-0 px-1 text-[10px]">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-text-muted">Fully Paid</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={bookingStatusTone(booking.status)}>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/sales/customers/${booking.customerId}`}
                        className="inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-border-soft px-3 py-2 text-body text-text-secondary hover:bg-hover hover:text-text-primary"
                      >
                        Profile <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-text-secondary">
                    No bookings found matching selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
