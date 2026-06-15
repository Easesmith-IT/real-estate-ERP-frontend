"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPortfolioValue } from "./customer-utils";

type Props = {
  bookings: Array<{ id: string; projectName: string; unitCode: string; totalAmount: number; outstandingAmount: number; totalPaid: number; status: string; customerId: string; customerName: string; }>
};

export function CustomerBookings({ bookings }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {bookings.slice(0, 6).map((booking) => {
        const paid = Math.min(100, Math.round((booking.totalPaid / Math.max(booking.totalAmount, 1)) * 100));
        return (
          <Card key={booking.id} className="overflow-hidden border-border-soft/80 bg-surface hover:shadow-soft transition-all duration-200">
            <CardHeader className="border-none pb-3">
              <div>
                <CardTitle>{booking.projectName}</CardTitle>
                <p className="text-body text-text-secondary">Unit {booking.unitCode}</p>
              </div>
              <Badge tone={booking.status === "Active" ? "success" : "neutral"}>{booking.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4">
                <div className="flex items-center justify-between"><span className="text-label text-text-muted">Booking Value</span><span className="text-body font-medium">{formatPortfolioValue(booking.totalAmount)}</span></div>
                <div className="flex items-center justify-between"><span className="text-label text-text-muted">Collection %</span><span className="text-body font-medium">{paid}% Paid</span></div>
                <div className="h-2 rounded-full bg-hover"><div className="h-2 rounded-full bg-accent-primary" style={{ width: `${paid}%` }} /></div>
                <div className="flex items-center justify-between"><span className="text-label text-text-muted">Outstanding</span><span className="text-body font-medium text-warning">{formatPortfolioValue(booking.outstandingAmount)}</span></div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-label text-text-muted">{booking.customerName}</p>
                <Link href={`/sales/customers/${booking.customerId}`} className="rounded-[var(--radius-button)] border border-border-soft px-3 py-2 text-body text-text-secondary hover:bg-hover hover:text-text-primary">Open Profile</Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
