"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, RotateCcw, Download, ChevronRight } from "lucide-react";
import { CustomerPortfolioView, CustomerDirectoryFilters, formatPortfolioValue } from "./customer-utils";

type Props = {
  customers: CustomerPortfolioView[];
  onOpenCustomer: (customerId: string) => void;
};

export function CustomerDirectory({ customers, onOpenCustomer }: Props) {
  const [filters, setFilters] = useState<CustomerDirectoryFilters>({
    search: "",
    customerType: "All",
    project: "All",
    status: "All",
    outstanding: "All",
  });

  const projects = useMemo(() => Array.from(new Set(customers.flatMap((customer) => customer.activeBookings.map((booking) => booking.projectName).filter(Boolean)))), [customers]);

  const filtered = useMemo(() => {
    return customers.filter((customer) => {
      const needle = filters.search.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        customer.name.toLowerCase().includes(needle) ||
        customer.phone.toLowerCase().includes(needle) ||
        (customer.email || "").toLowerCase().includes(needle);
      const matchesType = filters.customerType === "All" || customer.type === filters.customerType;
      const matchesStatus = filters.status === "All" || customer.status === filters.status;
      const matchesProject =
        filters.project === "All" || customer.activeBookings.some((booking) => booking.projectName === filters.project);
      const matchesOutstanding =
        filters.outstanding === "All" ||
        (filters.outstanding === "Due" && customer.outstandingAmount > 0) ||
        (filters.outstanding === "Clear" && customer.outstandingAmount === 0);

      return matchesSearch && matchesType && matchesStatus && matchesProject && matchesOutstanding;
    });
  }, [customers, filters]);

  return (
    <Card className="overflow-hidden border-border-soft/80 bg-surface shadow-soft">
      <CardHeader className="items-start border-none pb-0">
        <div>
          <CardTitle>Customer Directory</CardTitle>
          <p className="text-body text-text-secondary">A searchable portfolio register with collection intelligence built into every row.</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
            <Input className="pl-9" placeholder="Search customer name, phone, email" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
          </div>
          <select className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body" value={filters.customerType} onChange={(event) => setFilters((current) => ({ ...current, customerType: event.target.value }))}>
            {['All', 'Premium', 'Investor', 'End User', 'Corporate', 'Referral'].map((option) => <option key={option}>{option}</option>)}
          </select>
          <select className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body" value={filters.project} onChange={(event) => setFilters((current) => ({ ...current, project: event.target.value }))}>
            <option>All</option>
            {projects.map((project) => <option key={project}>{project}</option>)}
          </select>
          <select className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            {['All', 'Premium', 'Healthy', 'New', 'At Risk'].map((option) => <option key={option === 'Healthy' ? 'Regular' : option}>{option === 'Healthy' ? 'Regular' : option}</option>)}
          </select>
          <select className="h-11 rounded-[var(--radius-input)] border border-border-soft bg-surface px-4 text-body" value={filters.outstanding} onChange={(event) => setFilters((current) => ({ ...current, outstanding: event.target.value }))}>
            {['All', 'Due', 'Clear'].map((option) => <option key={option}>{option}</option>)}
          </select>
          <Button variant="secondary" size="sm" className="h-11"><Download className="h-4 w-4" />Export</Button>
          <Button variant="ghost" size="sm" className="h-11 text-text-secondary" onClick={() => setFilters({ search: "", customerType: "All", project: "All", status: "All", outstanding: "All" })}><RotateCcw className="h-4 w-4" />Reset Filters</Button>
        </div>

        <div className="overflow-auto rounded-[var(--radius-card)] border border-border-soft">
          <table className="w-full min-w-[1200px] text-table">
            <thead className="bg-surface-secondary text-text-secondary">
              <tr className="h-12 border-b border-border-soft text-left">
                <th className="px-4">Customer</th>
                <th className="px-4">Source Lead</th>
                <th className="px-4">Bookings</th>
                <th className="px-4">Portfolio Value</th>
                <th className="px-4">Outstanding</th>
                <th className="px-4">Collection %</th>
                <th className="px-4">Last Activity</th>
                <th className="px-4">Status</th>
                <th className="px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const activeCount = customer.activeBookings.filter((b) => b.status === "Active").length;
                const completedCount = customer.activeBookings.filter((b) => b.status === "Completed").length;
                const totalCount = Math.max(1, customer.bookingCount);

                return (
                  <tr key={customer.id} className="cursor-pointer border-t border-border-soft hover:bg-hover" onClick={() => onOpenCustomer(customer.id)}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-body font-bold text-accent-primary">
                          {customer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-text-primary">{customer.name}</p>
                          <p className="text-label text-text-secondary">{customer.phone}</p>
                          <p className="text-label text-text-muted">{customer.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <Badge tone="neutral">{customer.sourceType}</Badge>
                        <p className="text-label text-text-muted">{customer.sourceLeadName || "Direct"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-body text-text-primary">
                          <span className="font-medium">{activeCount} Active</span>
                          <span className="text-text-muted">•</span>
                          <span className="text-text-secondary">{completedCount} Completed</span>
                        </div>
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-hover flex">
                          <div className="h-full bg-accent-primary" style={{ width: `${(activeCount / totalCount) * 100}%` }} />
                          <div className="h-full bg-success" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-text-primary font-medium">{formatPortfolioValue(customer.totalBookedValue || 0)}</td>
                    <td className="px-4 py-4 text-text-primary font-medium">{formatPortfolioValue(customer.outstandingAmount || 0)}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-hover">
                          <div className={`h-full ${customer.collectionScore >= 85 ? 'bg-success' : customer.collectionScore >= 65 ? 'bg-warning' : 'bg-error'}`} style={{ width: `${customer.collectionScore}%` }} />
                        </div>
                        <span className="text-label text-text-muted">{customer.collectionScore}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-text-secondary">
                      {new Date(customer.lastActivityAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={customer.status === 'Premium' ? 'success' : customer.status === 'Healthy' ? 'info' : customer.status === 'At Risk' ? 'warning' : 'neutral'}>
                        {customer.status === 'Healthy' ? 'Regular' : customer.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/sales/customers/${customer.id}`} onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-border-soft px-3 py-2 text-body text-text-secondary hover:bg-hover hover:text-text-primary">
                        Open <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
